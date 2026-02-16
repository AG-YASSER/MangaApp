import Bookmark from "../models/Bookmark.js";
import Manga from "../models/Manga.js";

// GET /api/user/bookmarks - Get user's bookmarks
export const getUserBookmarks = async (req, res) => {
  try {
    const userId = req.user.id;
    const { collection } = req.query;

    const query = { userId };
    if (collection) {
      query.collection = collection;
    }

    const bookmarks = await Bookmark.find(query)
      .populate("mangaId", "title slug coverImage rating")
      .populate("chapterId", "title number")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      bookmarks,
    });
  } catch (error) {
    console.error("Get user bookmarks error:", error);
    res.status(500).json({ message: "Failed to load bookmarks" });
  }
};

// POST /api/user/bookmarks - Add bookmark
export const addBookmark = async (req, res) => {
  try {
    const userId = req.user.id;
    const { mangaId, chapterId, pageNumber, collection } = req.body;

    // Check if manga exists
    const manga = await Manga.findById(mangaId);
    if (!manga) {
      return res.status(404).json({ message: "Manga not found" });
    }

    // Check if bookmark already exists
    const existing = await Bookmark.findOne({
      userId,
      mangaId,
      collection: collection || "to-read",
    });

    if (existing) {
      return res.status(400).json({ 
        message: "Bookmark already exists in this collection" 
      });
    }

    const bookmark = await Bookmark.create({
      userId,
      mangaId,
      chapterId: chapterId || null,
      pageNumber: pageNumber || null,
      collection: collection || "to-read",
    });

    // Increment bookmark count on manga
    await manga.incrementBookmarks();

    res.status(201).json({
      success: true,
      message: "Bookmark added successfully",
      bookmark,
    });
  } catch (error) {
    console.error("Add bookmark error:", error);
    res.status(500).json({ message: "Failed to add bookmark" });
  }
};

// PUT /api/user/bookmarks/:id - Update bookmark (change collection, etc.)
export const updateBookmark = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const { collection, chapterId, pageNumber } = req.body;

    const bookmark = await Bookmark.findOneAndUpdate(
      { _id: id, userId },
      { 
        collection: collection || "to-read",
        chapterId: chapterId || null,
        pageNumber: pageNumber || null,
      },
      { new: true }
    );

    if (!bookmark) {
      return res.status(404).json({ message: "Bookmark not found" });
    }

    res.json({
      success: true,
      message: "Bookmark updated successfully",
      bookmark,
    });
  } catch (error) {
    console.error("Update bookmark error:", error);
    res.status(500).json({ message: "Failed to update bookmark" });
  }
};

// DELETE /api/user/bookmarks/:id - Remove bookmark
export const removeBookmark = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const bookmark = await Bookmark.findOneAndDelete({ _id: id, userId });
    
    if (!bookmark) {
      return res.status(404).json({ message: "Bookmark not found" });
    }

    // Decrement bookmark count on manga
    const manga = await Manga.findById(bookmark.mangaId);
    if (manga) {
      await manga.decrementBookmarks();
    }

    res.json({
      success: true,
      message: "Bookmark removed successfully",
    });
  } catch (error) {
    console.error("Remove bookmark error:", error);
    res.status(500).json({ message: "Failed to remove bookmark" });
  }
};

// GET /api/user/bookmarks/collections - Get all collections with counts
export const getBookmarkCollections = async (req, res) => {
  try {
    const userId = req.user.id;

    const collections = await Bookmark.aggregate([
      { $match: { userId: mongoose.Types.ObjectId(userId) } },
      {
        $group: {
          _id: "$collection",
          count: { $sum: 1 },
        },
      },
      {
        $project: {
          collection: "$_id",
          count: 1,
          _id: 0,
        },
      },
    ]);

    // Default collections with counts
    const defaultCollections = [
      "to-read",
      "reading",
      "completed",
      "favorites",
      "dropped",
    ];

    const result = defaultCollections.map(name => {
      const found = collections.find(c => c.collection === name);
      return {
        name,
        count: found ? found.count : 0,
      };
    });

    res.json({
      success: true,
      collections: result,
    });
  } catch (error) {
    console.error("Get bookmark collections error:", error);
    res.status(500).json({ message: "Failed to load collections" });
  }
};

// POST /api/user/bookmarks/:id/move - Move bookmark to different collection
export const moveBookmark = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const { toCollection } = req.body;

    if (!toCollection) {
      return res.status(400).json({ message: "Target collection is required" });
    }

    // Check if bookmark exists in target collection already
    const bookmark = await Bookmark.findOne({ _id: id, userId });
    if (!bookmark) {
      return res.status(404).json({ message: "Bookmark not found" });
    }

    const existing = await Bookmark.findOne({
      userId,
      mangaId: bookmark.mangaId,
      collection: toCollection,
    });

    if (existing) {
      // If exists, delete this one and keep the existing
      await bookmark.deleteOne();
      return res.json({
        success: true,
        message: `Moved to ${toCollection} (merged with existing)`,
      });
    } else {
      // Update collection
      bookmark.collection = toCollection;
      await bookmark.save();
      
      res.json({
        success: true,
        message: `Moved to ${toCollection}`,
        bookmark,
      });
    }
  } catch (error) {
    console.error("Move bookmark error:", error);
    res.status(500).json({ message: "Failed to move bookmark" });
  }
};