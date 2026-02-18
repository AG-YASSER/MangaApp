import Bookmark from "../models/Bookmark.js";
import mongoose from "mongoose";
import Manga from "../models/Manga.js";

/* ===============================
   GET /api/user/bookmarks
================================= */
export const getUserBookmarks = async (req, res) => {
  try {
    const userId = req.user.id;
    const { category } = req.query;

    const query = { userId };

    if (category) {
      query.category = category;
    }

    const bookmarks = await Bookmark.find(query)
      .populate("mangaId", "title slug coverImage rating")
      .populate("chapterId", "title number")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: bookmarks.length,
      bookmarks,
    });
  } catch (error) {
    console.error("Get user bookmarks error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to load bookmarks",
    });
  }
};

/* ===============================
   POST /api/user/bookmarks
================================= */
export const addBookmark = async (req, res) => {
  try {
    const userId = req.user.id;
    const { mangaId, chapterId, pageNumber, category = "to-read" } = req.body;

    if (!mongoose.Types.ObjectId.isValid(mangaId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid manga ID",
      });
    }

    const manga = await Manga.findById(mangaId);
    if (!manga) {
      return res.status(404).json({
        success: false,
        message: "Manga not found",
      });
    }

    const existing = await Bookmark.findOne({
      userId,
      mangaId,
      category,
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: "Bookmark already exists in this category",
      });
    }

    const bookmark = await Bookmark.create({
      userId,
      mangaId,
      chapterId: chapterId || null,
      pageNumber: pageNumber || null,
      category,
    });

    if (typeof manga.incrementBookmarks === "function") {
      await manga.incrementBookmarks();
    }

    res.status(201).json({
      success: true,
      message: "Bookmark added successfully",
      bookmark,
    });
  } catch (error) {
    console.error("Add bookmark error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to add bookmark",
    });
  }
};

/* ===============================
   PUT /api/user/bookmarks/:id
================================= */
export const updateBookmark = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const { category, chapterId, pageNumber } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid bookmark ID",
      });
    }

    const updateData = {};

    if (category) updateData.category = category;
    if (chapterId !== undefined) updateData.chapterId = chapterId || null;
    if (pageNumber !== undefined) updateData.pageNumber = pageNumber || null;

    const bookmark = await Bookmark.findOneAndUpdate(
      { _id: id, userId },
      updateData,
      { new: true }
    );

    if (!bookmark) {
      return res.status(404).json({
        success: false,
        message: "Bookmark not found",
      });
    }

    res.json({
      success: true,
      message: "Bookmark updated successfully",
      bookmark,
    });
  } catch (error) {
    console.error("Update bookmark error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update bookmark",
    });
  }
};

/* ===============================
   DELETE /api/user/bookmarks/:id
================================= */
export const removeBookmark = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid bookmark ID",
      });
    }

    const bookmark = await Bookmark.findOneAndDelete({ _id: id, userId });

    if (!bookmark) {
      return res.status(404).json({
        success: false,
        message: "Bookmark not found",
      });
    }

    const manga = await Manga.findById(bookmark.mangaId);
    if (manga && typeof manga.decrementBookmarks === "function") {
      await manga.decrementBookmarks();
    }

    res.json({
      success: true,
      message: "Bookmark removed successfully",
    });
  } catch (error) {
    console.error("Remove bookmark error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to remove bookmark",
    });
  }
};

/* ===============================
   GET /api/user/bookmarks/categories
================================= */
export const getBookmarkCategories = async (req, res) => {
  try {
    const userId = req.user.id;

    const categories = await Bookmark.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(userId) } },
      {
        $group: {
          _id: "$category",
          count: { $sum: 1 },
        },
      },
      {
        $project: {
          category: "$_id",
          count: 1,
          _id: 0,
        },
      },
    ]);

    const defaultCategories = [
      "to-read",
      "reading",
      "completed",
      "favorites",
      "dropped",
    ];

    const result = defaultCategories.map((name) => {
      const found = categories.find((c) => c.category === name);
      return {
        name,
        count: found ? found.count : 0,
      };
    });

    res.json({
      success: true,
      categories: result,
    });
  } catch (error) {
    console.error("Get bookmark categories error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to load categories",
    });
  }
};

/* ===============================
   POST /api/user/bookmarks/:id/move
================================= */
export const moveBookmark = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const { toCategory } = req.body;

    if (!toCategory) {
      return res.status(400).json({
        success: false,
        message: "Target category is required",
      });
    }

    const bookmark = await Bookmark.findOne({ _id: id, userId });

    if (!bookmark) {
      return res.status(404).json({
        success: false,
        message: "Bookmark not found",
      });
    }

    const existing = await Bookmark.findOne({
      userId,
      mangaId: bookmark.mangaId,
      category: toCategory,
    });

    if (existing) {
      await bookmark.deleteOne();
      return res.json({
        success: true,
        message: `Moved to ${toCategory} (merged with existing)`,
      });
    }

    bookmark.category = toCategory;
    await bookmark.save();

    res.json({
      success: true,
      message: `Moved to ${toCategory}`,
      bookmark,
    });
  } catch (error) {
    console.error("Move bookmark error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to move bookmark",
    });
  }
};
