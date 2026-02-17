import Comment from "../models/Comment.js";
import Notification from "../models/Notification.js";

// GET /api/manga/:mangaId/comments - Get comments for a manga
export const getMangaComments = async (req, res) => {
  try {
    const { mangaId } = req.params;
    const { chapterId, page = 1, limit = 20 } = req.query;

    const query = {
      mangaId,
      isDeleted: false,
    };

    if (chapterId) {
      query.chapterId = chapterId;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const comments = await Comment.find(query)
      .populate("userId", "username avatar role")
      .populate("replies.userId", "username avatar")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Comment.countDocuments(query);

    res.json({
      success: true,
      comments,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error("Get manga comments error:", error);
    res.status(500).json({ message: "Failed to load comments" });
  }
};

// POST /api/manga/:mangaId/comments - Add comment
export const addComment = async (req, res) => {
  try {
    const { mangaId } = req.params;
    const userId = req.user.id;
    const { text, chapterId } = req.body;

    if (!text || text.trim().length === 0) {
      return res.status(400).json({ message: "Comment text is required" });
    }

    const comment = await Comment.create({
      userId,
      mangaId,
      chapterId: chapterId || null,
      text: text.trim(),
    });

    const populatedComment = await Comment.findById(comment._id).populate(
      "userId",
      "username avatar",
    );

    res.status(201).json({
      success: true,
      message: "Comment added successfully",
      comment: populatedComment,
    });
  } catch (error) {
    console.error("Add comment error:", error);
    res.status(500).json({ message: "Failed to add comment" });
  }
};

// PUT /api/comments/:id - Update comment
export const updateComment = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const { text } = req.body;

    if (!text || text.trim().length === 0) {
      return res.status(400).json({ message: "Comment text is required" });
    }

    const comment = await Comment.findOneAndUpdate(
      { _id: id, userId },
      { text: text.trim() },
      { new: true },
    ).populate("userId", "username avatar");

    if (!comment) {
      return res.status(404).json({ message: "Comment not found" });
    }

    res.json({
      success: true,
      message: "Comment updated successfully",
      comment,
    });
  } catch (error) {
    console.error("Update comment error:", error);
    res.status(500).json({ message: "Failed to update comment" });
  }
};

// DELETE /api/comments/:id - Delete comment
export const deleteComment = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    // Allow admins/mods to delete any comment
    const query =
      userRole === "admin" || userRole === "mod"
        ? { _id: id }
        : { _id: id, userId };

    const comment = await Comment.findOneAndUpdate(
      query,
      { isDeleted: true },
      { new: true },
    );

    if (!comment) {
      return res.status(404).json({ message: "Comment not found" });
    }

    res.json({
      success: true,
      message: "Comment deleted successfully",
    });
  } catch (error) {
    console.error("Delete comment error:", error);
    res.status(500).json({ message: "Failed to delete comment" });
  }
};

// POST /api/comments/:id/reply - Add reply to comment
export const addReply = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const { text } = req.body;

    if (!text || text.trim().length === 0) {
      return res.status(400).json({ message: "Reply text is required" });
    }

    const comment = await Comment.findById(id);
    if (!comment) {
      return res.status(404).json({ message: "Comment not found" });
    }

    const reply = {
      userId,
      text: text.trim(),
      createdAt: new Date(),
    };

    comment.replies.push(reply);
    await comment.save();

    // Create notification for original commenter
    if (comment.userId.toString() !== userId) {
      await Notification.create({
        userId: comment.userId,
        type: "comment_reply",
        title: "New reply to your comment",
        message: `${req.user.username} replied to your comment`,
        relatedTo: {
          mangaId: comment.mangaId,
          chapterId: comment.chapterId,
          userId: userId,
        },
        actionUrl: comment.chapterId
          ? `/chapter/${comment.chapterId}`
          : `/manga/${comment.mangaId}`,
      });
    }

    const updatedComment = await Comment.findById(id)
      .populate("userId", "username avatar")
      .populate("replies.userId", "username avatar");

    res.status(201).json({
      success: true,
      message: "Reply added successfully",
      comment: updatedComment,
    });
  } catch (error) {
    console.error("Add reply error:", error);
    res.status(500).json({ message: "Failed to add reply" });
  }
};

// DELETE /api/comments/:commentId/reply/:replyId - Delete reply
export const deleteReply = async (req, res) => {
  try {
    const { commentId, replyId } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    const comment = await Comment.findById(commentId);
    if (!comment) {
      return res.status(404).json({ message: "Comment not found" });
    }

    // Find the reply
    const replyIndex = comment.replies.findIndex(
      (r) => r._id.toString() === replyId,
    );

    if (replyIndex === -1) {
      return res.status(404).json({ message: "Reply not found" });
    }

    // Check permission
    const isOwner = comment.replies[replyIndex].userId.toString() === userId;
    const isModOrAdmin = userRole === "admin" || userRole === "mod";

    if (!isOwner && !isModOrAdmin) {
      return res
        .status(403)
        .json({ message: "Not authorized to delete this reply" });
    }

    // Remove reply
    comment.replies.splice(replyIndex, 1);
    await comment.save();

    res.json({
      success: true,
      message: "Reply deleted successfully",
    });
  } catch (error) {
    console.error("Delete reply error:", error);
    res.status(500).json({ message: "Failed to delete reply" });
  }
};

// PUT /api/comments/:commentId/reply/:replyId - Update reply
export const updateReply = async (req, res) => {
  try {
    const { commentId, replyId } = req.params;
    const userId = req.user.id;
    const { text } = req.body;

    if (!text || text.trim().length === 0) {
      return res.status(400).json({ message: "Reply text is required" });
    }

    const comment = await Comment.findById(commentId);
    if (!comment) {
      return res.status(404).json({ message: "Comment not found" });
    }

    // Find the reply
    const reply = comment.replies.find((r) => r._id.toString() === replyId);
    if (!reply) {
      return res.status(404).json({ message: "Reply not found" });
    }

    // Check if user is the owner of the reply
    if (reply.userId.toString() !== userId.toString()) {
      return res
        .status(403)
        .json({ message: "Not authorized to update this reply" });
    }

    // Update reply
    reply.text = text.trim();
    reply.updatedAt = new Date();
    await comment.save();

    const updatedComment = await Comment.findById(commentId)
      .populate("userId", "username avatar")
      .populate("replies.userId", "username avatar");

    res.json({
      success: true,
      message: "Reply updated successfully",
      comment: updatedComment,
    });
  } catch (error) {
    console.error("Update reply error:", error);
    res.status(500).json({ message: "Failed to update reply" });
  }
};

// POST /api/comments/:id/report - Report a comment
export const reportComment = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const comment = await Comment.findByIdAndUpdate(
      id,
      {
        isReported: true,
        $inc: { reportCount: 1 },
      },
      { new: true },
    );

    if (!comment) {
      return res.status(404).json({ message: "Comment not found" });
    }

    // Notify admins (could be implemented with a separate admin notification system)
    // For now, just log it
    console.log(`Comment ${id} reported. Reason: ${reason}`);

    res.json({
      success: true,
      message:
        "Comment reported. Thank you for helping keep our community safe.",
    });
  } catch (error) {
    console.error("Report comment error:", error);
    res.status(500).json({ message: "Failed to report comment" });
  }
};
