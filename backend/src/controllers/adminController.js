import User from "../models/User.js";
import Manga from "../models/Manga.js";
import Chapter from "../models/Chapter.js";
import Comment from "../models/Comment.js";
import DeleteRequest from "../models/DeleteRequest.js";
import Purchase from "../models/Purchase.js";
import ReadingHistory from "../models/ReadingHistory.js";
import mongoose from "mongoose";

// GET /api/admin/dashboard - Admin dashboard stats
export const getDashboardStats = async (req, res) => {
  try {
    // User stats
    const totalUsers = await User.countDocuments();
    const activeToday = await User.countDocuments({
      lastActive: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
    });
    const bannedUsers = await User.countDocuments({ isBanned: true });

    // Content stats
    const totalManga = await Manga.countDocuments({ isDeleted: false });
    const totalChapters = await Chapter.countDocuments();
    const totalComments = await Comment.countDocuments({ isDeleted: false });

    // Revenue stats (if using purchases)
    const totalRevenue = await Purchase.aggregate([
      { $match: { status: "completed" } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]);

    // Pending requests
    const pendingDeleteRequests = await DeleteRequest.countDocuments({
      status: "pending",
    });

    res.json({
      success: true,
      stats: {
        users: {
          total: totalUsers,
          activeToday,
          banned: bannedUsers,
        },
        content: {
          manga: totalManga,
          chapters: totalChapters,
          comments: totalComments,
        },
        revenue: totalRevenue[0]?.total || 0,
        pendingRequests: pendingDeleteRequests,
      },
    });
  } catch (error) {
    console.error("Get dashboard stats error:", error);
    res.status(500).json({ message: "Failed to load dashboard stats" });
  }
};

// GET /api/admin/users - Get all users with filters
export const getAllUsers = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      role,
      isBanned,
      search,
    } = req.query;

    const query = {};

    if (role) query.role = role;
    if (isBanned !== undefined) query.isBanned = isBanned === "true";
    if (search) {
      query.$or = [
        { username: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { displayName: { $regex: search, $options: "i" } },
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const users = await User.find(query)
      .select("-loginHistory -chaptersRead -chaptersPurchased -mangaTitlesPurchased")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await User.countDocuments(query);

    res.json({
      success: true,
      users,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error("Get all users error:", error);
    res.status(500).json({ message: "Failed to load users" });
  }
};

// GET /api/admin/users/:id - Get single user details
export const getUserDetails = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id)
      .select("-loginHistory")
      .populate("chaptersPurchased.chapterId", "title number")
      .populate("mangaTitlesPurchased.mangaId", "title slug");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Get user activity summary
let readingStats = [];
try {
  readingStats = await ReadingHistory.aggregate([
    { $match: { userId: new mongoose.Types.ObjectId(id) } },
    {
      $group: {
        _id: null,
        totalChapters: { $sum: 1 },
        totalTime: { $sum: "$timeSpent" },
        completedChapters: {
          $sum: { $cond: ["$isCompleted", 1, 0] },
        },
      },
    },
  ]);
} catch (err) {
  console.error("Error fetching reading stats:", err);
  readingStats = [];
}

    res.json({
      success: true,
      user,
      stats: {
        reading: readingStats[0] || { totalChapters: 0, totalTime: 0, completedChapters: 0 },
      },
    });
  } catch (error) {
    console.error("Get user details error:", error);
    res.status(500).json({ message: "Failed to load user details" });
  }
};

// PATCH /api/admin/users/:id/role - Change user role
export const changeUserRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!["user", "mod", "admin"].includes(role)) {
      return res.status(400).json({ message: "Invalid role" });
    }

    const user = await User.findByIdAndUpdate(
      id,
      { role },
      { new: true }
    ).select("username email role");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({
      success: true,
      message: `User role updated to ${role}`,
      user,
    });
  } catch (error) {
    console.error("Change user role error:", error);
    res.status(500).json({ message: "Failed to update user role" });
  }
};

// GET /api/admin/delete-requests - Get all delete requests
export const getDeleteRequests = async (req, res) => {
  try {
    const { status = "pending", page = 1, limit = 20 } = req.query;

    const query = {};
    if (status) query.status = status;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const requests = await DeleteRequest.find(query)
      .populate("requester", "username email")
      .populate("reviewedBy", "username")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Get target details (manga or chapter)
    const populatedRequests = await Promise.all(
      requests.map(async (req) => {
        const reqObj = req.toObject();
        if (req.type === "manga") {
          reqObj.target = await Manga.findById(req.targetId)
            .select("title slug");
        } else {
          reqObj.target = await Chapter.findById(req.targetId)
            .populate("mangaId", "title");
        }
        return reqObj;
      })
    );

    const total = await DeleteRequest.countDocuments(query);

    res.json({
      success: true,
      requests: populatedRequests,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error("Get delete requests error:", error);
    res.status(500).json({ message: "Failed to load delete requests" });
  }
};

// POST /api/admin/delete-requests/:id/review - Review delete request
export const reviewDeleteRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, response } = req.body;
    const adminId = req.user.id;

    if (!["approved", "rejected"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const request = await DeleteRequest.findById(id);
    if (!request) {
      return res.status(404).json({ message: "Request not found" });
    }

    if (request.status !== "pending") {
      return res.status(400).json({ message: "Request already reviewed" });
    }

    request.status = status;
    request.reviewedBy = adminId;
    request.reviewedAt = new Date();
    request.response = response || "";
    await request.save();

    // If approved, perform the deletion
    if (status === "approved") {
      if (request.type === "manga") {
        const manga = await Manga.findById(request.targetId);
        if (manga) {
          await manga.softDelete(`Approved delete request: ${response}`);
        }
      } else {
        const chapter = await Chapter.findById(request.targetId);
        if (chapter) {
          await chapter.deleteOne();
          // Update manga counters
          const manga = await Manga.findById(chapter.mangaId);
          if (manga) {
            await manga.removeChapter(chapter.isPremium);
          }
        }
      }
    }

    // Notify the requester (you could add notification here)
    // await Notification.create({...})

    res.json({
      success: true,
      message: `Delete request ${status}`,
      request,
    });
  } catch (error) {
    console.error("Review delete request error:", error);
    res.status(500).json({ message: "Failed to review request" });
  }
};

// GET /api/admin/reports - Get reported content
export const getReportedContent = async (req, res) => {
  try {
    // Get reported comments
    const reportedComments = await Comment.find({ isReported: true })
      .populate("userId", "username")
      .populate("mangaId", "title")
      .sort({ reportCount: -1 });

    res.json({
      success: true,
      reportedComments,
    });
  } catch (error) {
    console.error("Get reported content error:", error);
    res.status(500).json({ message: "Failed to load reported content" });
  }
};

// POST /api/admin/comments/:id/moderate - Moderate a comment
export const moderateComment = async (req, res) => {
  try {
    const { id } = req.params;
    const { action } = req.body; // "delete" or "clear"

    const comment = await Comment.findById(id);
    if (!comment) {
      return res.status(404).json({ message: "Comment not found" });
    }

    if (action === "delete") {
      comment.isDeleted = true;
      comment.isReported = false;
      await comment.save();
    } else if (action === "clear") {
      comment.isReported = false;
      comment.reportCount = 0;
      await comment.save();
    }

    res.json({
      success: true,
      message: action === "delete" ? "Comment deleted" : "Reports cleared",
    });
  } catch (error) {
    console.error("Moderate comment error:", error);
    res.status(500).json({ message: "Failed to moderate comment" });
  }
};

// PATCH /api/admin/users/:id/ban - Ban a user
export const banUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason, banExpiresAt } = req.body;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Don't allow banning admins
    if (user.role === "admin") {
      return res.status(403).json({ message: "Cannot ban another admin" });
    }

    user.isBanned = true;
    user.banReason = reason || "Violated terms of service";
    user.banExpiresAt = banExpiresAt || null;
    
    await user.save();

    res.json({
      success: true,
      message: `User ${user.username} has been banned`,
      user: {
        id: user._id,
        username: user.username,
        isBanned: user.isBanned,
        banReason: user.banReason,
        banExpiresAt: user.banExpiresAt,
      },
    });
  } catch (error) {
    console.error("Ban user error:", error);
    res.status(500).json({ message: "Failed to ban user" });
  }
};

// PATCH /api/admin/users/:id/unban - Unban a user
export const unbanUser = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.isBanned = false;
    user.banReason = null;
    user.banExpiresAt = null;
    
    await user.save();

    res.json({
      success: true,
      message: `User ${user.username} has been unbanned`,
      user: {
        id: user._id,
        username: user.username,
        isBanned: user.isBanned,
      },
    });
  } catch (error) {
    console.error("Unban user error:", error);
    res.status(500).json({ message: "Failed to unban user" });
  }
};