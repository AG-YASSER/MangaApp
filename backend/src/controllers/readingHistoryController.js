import ReadingHistory from "../models/ReadingHistory.js";
import mongoose from "mongoose";
import Manga from "../models/Manga.js";
import Chapter from "../models/Chapter.js";

// GET /api/user/history - Get user's reading history
export const getReadingHistory = async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 20 } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const history = await ReadingHistory.find({ userId })
      .populate("mangaId", "title slug coverImage")
      .populate("chapterId", "title number")
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await ReadingHistory.countDocuments({ userId });

    // Get unique manga count
    const uniqueManga = await ReadingHistory.distinct("mangaId", { userId });

    // Get total reading time
    const timeStats = await ReadingHistory.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(userId) } },
      {
        $group: {
          _id: null,
          totalTime: { $sum: "$timeSpent" },
          completedChapters: {
            $sum: { $cond: ["$isCompleted", 1, 0] },
          },
        },
      },
    ]);

    res.json({
      success: true,
      history,
      stats: {
        totalChapters: total,
        uniqueManga: uniqueManga.length,
        totalTimeSpent: timeStats[0]?.totalTime || 0,
        completedChapters: timeStats[0]?.completedChapters || 0,
      },
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.log("Get reading history error:", error);
    res.status(500).json({ message: "Failed to load reading history" });
  }
};

// GET /api/user/history/continue - Get continue reading list
export const getContinueReading = async (req, res) => {
  try {
    const userId = req.user.id;
    const { limit = 10 } = req.query;

    // Get most recently read chapters that aren't completed
    const history = await ReadingHistory.find({ 
      userId,
      isCompleted: false 
    })
      .populate("mangaId", "title slug coverImage")
      .populate("chapterId", "title number")
      .sort({ updatedAt: -1 })
      .limit(parseInt(limit));

    res.json({
      success: true,
      continueReading: history,
    });
  } catch (error) {
    console.error("Get continue reading error:", error);
    res.status(500).json({ message: "Failed to load continue reading list" });
  }
};

// GET /api/user/history/recent-manga - Get recently read manga
export const getRecentManga = async (req, res) => {
  try {
    const userId = req.user.id;
    const { limit = 10 } = req.query;

    // Get unique manga from reading history, sorted by last read
    const recent = await ReadingHistory.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(userId) } },
      { $sort: { updatedAt: -1 } },
      {
        $group: {
          _id: "$mangaId",
          lastRead: { $first: "$updatedAt" },
          chapterId: { $first: "$chapterId" },
          percentageRead: { $first: "$percentageRead" },
        },
      },
      { $limit: parseInt(limit) },
      {
        $lookup: {
          from: "mangas",
          localField: "_id",
          foreignField: "_id",
          as: "manga",
        },
      },
      { $unwind: "$manga" },
      {
        $lookup: {
          from: "chapters",
          localField: "chapterId",
          foreignField: "_id",
          as: "chapter",
        },
      },
      { $unwind: "$chapter" },
      {
        $project: {
          manga: {
            _id: 1,
            title: 1,
            slug: 1,
            coverImage: 1,
          },
          lastRead: 1,
          chapter: {
            _id: 1,
            title: 1,
            number: 1,
          },
          percentageRead: 1,
        },
      },
    ]);

    res.json({
      success: true,
      recentManga: recent,
    });
  } catch (error) {
    console.error("Get recent manga error:", error);
    res.status(500).json({ message: "Failed to load recent manga" });
  }
};

// GET /api/user/history/manga/:mangaId - Get reading progress for a manga
export const getMangaProgress = async (req, res) => {
  try {
    const { mangaId } = req.params;
    const userId = req.user.id;

    const history = await ReadingHistory.find({ userId, mangaId })
      .populate("chapterId", "title number")
      .sort({ chapterNumber: 1 });

    // Find last read chapter
    const lastRead = history
      .filter(h => h.percentageRead > 0)
      .sort((a, b) => b.updatedAt - a.updatedAt)[0];

    // Get completed chapters
    const completed = history.filter(h => h.isCompleted).length;

    res.json({
      success: true,
      progress: {
        chapters: history,
        lastRead: lastRead || null,
        completedChapters: completed,
        totalTracked: history.length,
      },
    });
  } catch (error) {
    console.error("Get manga progress error:", error);
    res.status(500).json({ message: "Failed to load manga progress" });
  }
};

// DELETE /api/user/history - Clear reading history
export const clearHistory = async (req, res) => {
  try {
    const userId = req.user.id;
    const { mangaId } = req.query; // Optional: clear only for specific manga

    const query = { userId };
    if (mangaId) {
      query.mangaId = mangaId;
    }

    await ReadingHistory.deleteMany(query);

    res.json({
      success: true,
      message: mangaId 
        ? "Reading history cleared for this manga" 
        : "All reading history cleared",
    });
  } catch (error) {
    console.error("Clear history error:", error);
    res.status(500).json({ message: "Failed to clear history" });
  }
};

// GET /api/user/stats/reading - Get reading statistics
export const getReadingStats = async (req, res) => {
  try {
    const userId = req.user.id;

    // Get daily reading stats for last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const dailyStats = await ReadingHistory.aggregate([
      {
        $match: {
          userId: new mongoose.Types.ObjectId(userId),
          updatedAt: { $gte: thirtyDaysAgo },
        },
      },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: "%Y-%m-%d", date: "$updatedAt" } },
          },
          chaptersRead: { $sum: 1 },
          timeSpent: { $sum: "$timeSpent" },
        },
      },
      { $sort: { "_id.date": 1 } },
    ]);

    // Get genre preferences based on reading history
    const genreStats = await ReadingHistory.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(userId) } },
      {
        $lookup: {
          from: "mangas",
          localField: "mangaId",
          foreignField: "_id",
          as: "manga",
        },
      },
      { $unwind: "$manga" },
      { $unwind: "$manga.genres" },
      {
        $group: {
          _id: "$manga.genres",
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
      { $limit: 5 },
    ]);

    res.json({
      success: true,
      stats: {
        daily: dailyStats,
        favoriteGenres: genreStats,
      },
    });
  } catch (error) {
    console.error("Get reading stats error:", error);
    res.status(500).json({ message: "Failed to load reading stats" });
  }
};