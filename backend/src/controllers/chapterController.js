import Chapter from "../models/Chapter.js";
import Manga from "../models/Manga.js";
import ReadingHistory from "../models/ReadingHistory.js";

// ============ PUBLIC ROUTES ============

// GET /api/manga/:mangaId/chapters - Get all chapters for a manga
export const getChapters = async (req, res) => {
  try {
    const { mangaId } = req.params;
    
    const chapters = await Chapter.find({ mangaId })
      .sort({ number: 1 })
      .select("title number isPremium views releaseDate createdAt");

    res.json({
      success: true,
      chapters,
      total: chapters.length,
    });
  } catch (error) {
    console.error("Get chapters error:", error);
    res.status(500).json({ message: "Failed to load chapters" });
  }
};

// GET /api/chapters/:id - Get single chapter with pages
export const getChapter = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id; // Optional, for access check

    const chapter = await Chapter.findById(id)
      .populate("mangaId", "title slug premium readingDirection");

    if (!chapter) {
      return res.status(404).json({ message: "Chapter not found" });
    }

    // Check if chapter is premium and user has access
    if (chapter.isPremium) {
      const manga = await Manga.findById(chapter.mangaId);
      
      // Check access if user is logged in
      if (userId) {
        const hasAccess = await manga.userHasAccess(userId);
        if (!hasAccess) {
          // Check if user purchased this specific chapter
          const user = await User.findById(userId);
          const purchased = user?.chaptersPurchased?.some(
            p => p.chapterId.toString() === id
          );
          
          if (!purchased) {
            return res.status(403).json({ 
              message: "This chapter is premium. Purchase or subscribe to access.",
              isPremium: true,
              requiresPurchase: true
            });
          }
        }
      } else {
        // Not logged in
        return res.status(401).json({ 
          message: "Please log in to access premium content",
          isPremium: true,
          requiresLogin: true
        });
      }
    }

    // Increment view count
    await chapter.incrementViews();

    // Track reading history if user is logged in
    if (userId) {
      await ReadingHistory.findOneAndUpdate(
        {
          userId,
          chapterId: chapter._id,
          mangaId: chapter.mangaId._id,
        },
        {
          $set: {
            pageNumber: 1,
            updatedAt: new Date(),
          },
          $inc: { timeSpent: 0 }, // Will be updated when they finish
        },
        { upsert: true, new: true }
      );
    }

    res.json({
      success: true,
      chapter: {
        _id: chapter._id,
        title: chapter.title,
        number: chapter.number,
        pages: chapter.pages,
        isPremium: chapter.isPremium,
        releaseDate: chapter.releaseDate,
        manga: chapter.mangaId,
        readingDirection: chapter.mangaId.readingDirection,
      },
    });
  } catch (error) {
    console.error("Get chapter error:", error);
    res.status(500).json({ message: "Failed to load chapter" });
  }
};

// POST /api/chapters/:id/progress - Update reading progress
export const updateReadingProgress = async (req, res) => {
  try {
    const { id } = req.params;
    const { pageNumber, percentageRead, timeSpent, isCompleted } = req.body;
    const userId = req.user.id;

    const chapter = await Chapter.findById(id);
    if (!chapter) {
      return res.status(404).json({ message: "Chapter not found" });
    }

    const updateData = {
      userId,
      chapterId: id,
      mangaId: chapter.mangaId,
      pageNumber,
      percentageRead,
      $inc: { timeSpent: timeSpent || 0 },
    };

    if (isCompleted) {
      updateData.isCompleted = true;
      updateData.completedAt = new Date();
    }

    const history = await ReadingHistory.findOneAndUpdate(
      { userId, chapterId: id },
      updateData,
      { upsert: true, new: true }
    );

    // If chapter is completed, update user's reading stats
    if (isCompleted && userId) {
      const User = mongoose.model("User");
      await User.findByIdAndUpdate(userId, {
        $inc: { chaptersReadCount: 1 },
        lastReadAt: new Date(),
      });
    }

    res.json({
      success: true,
      progress: history,
    });
  } catch (error) {
    console.error("Update reading progress error:", error);
    res.status(500).json({ message: "Failed to update progress" });
  }
};

// ============ PROTECTED ROUTES (MOD/ADMIN) ============

// POST /api/admin/chapters - Create new chapter
export const createChapter = async (req, res) => {
  try {
    const {
      mangaId,
      title,
      number,
      pages,
      isPremium,
      releaseDate,
    } = req.body;

    // Check if chapter number already exists for this manga
    const existing = await Chapter.findOne({ mangaId, number });
    if (existing) {
      return res.status(400).json({ 
        message: `Chapter ${number} already exists for this manga` 
      });
    }

    const chapter = await Chapter.create({
      mangaId,
      title,
      number,
      pages: pages || [],
      isPremium: isPremium || false,
      releaseDate: releaseDate || new Date(),
      createdBy: req.user.id,
    });

    // Update manga's chapter counters
    const manga = await Manga.findById(mangaId);
    await manga.addChapter(isPremium);

    res.status(201).json({
      success: true,
      message: "Chapter created successfully",
      chapter,
    });
  } catch (error) {
    console.error("Create chapter error:", error);
    res.status(500).json({ message: "Failed to create chapter" });
  }
};

// PUT /api/admin/chapters/:id - Update chapter
export const updateChapter = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Remove fields that shouldn't be updated
    delete updates._id;
    delete updates.mangaId;
    delete updates.createdBy;
    delete updates.views;

    const chapter = await Chapter.findByIdAndUpdate(
      id,
      updates,
      { new: true, runValidators: true }
    );

    if (!chapter) {
      return res.status(404).json({ message: "Chapter not found" });
    }

    res.json({
      success: true,
      message: "Chapter updated successfully",
      chapter,
    });
  } catch (error) {
    console.error("Update chapter error:", error);
    res.status(500).json({ message: "Failed to update chapter" });
  }
};

// DELETE /api/admin/chapters/:id - Delete chapter
export const deleteChapter = async (req, res) => {
  try {
    const { id } = req.params;

    const chapter = await Chapter.findById(id);
    if (!chapter) {
      return res.status(404).json({ message: "Chapter not found" });
    }

    const mangaId = chapter.mangaId;
    const wasPremium = chapter.isPremium;

    await chapter.deleteOne();

    // Update manga counters
    const manga = await Manga.findById(mangaId);
    await manga.removeChapter(wasPremium);

    res.json({
      success: true,
      message: "Chapter deleted successfully",
    });
  } catch (error) {
    console.error("Delete chapter error:", error);
    res.status(500).json({ message: "Failed to delete chapter" });
  }
};

// POST /api/admin/chapters/:id/pages - Add page to chapter
export const addChapterPage = async (req, res) => {
  try {
    const { id } = req.params;
    const { pageUrl } = req.body;

    if (!pageUrl) {
      return res.status(400).json({ message: "Page URL is required" });
    }

    const chapter = await Chapter.findById(id);
    if (!chapter) {
      return res.status(404).json({ message: "Chapter not found" });
    }

    await chapter.addPage(pageUrl);

    res.json({
      success: true,
      message: "Page added successfully",
      pages: chapter.pages,
    });
  } catch (error) {
    console.error("Add chapter page error:", error);
    res.status(500).json({ message: "Failed to add page" });
  }
};

// DELETE /api/admin/chapters/:id/pages/:index - Remove page from chapter
export const removeChapterPage = async (req, res) => {
  try {
    const { id, index } = req.params;

    const chapter = await Chapter.findById(id);
    if (!chapter) {
      return res.status(404).json({ message: "Chapter not found" });
    }

    await chapter.removePage(parseInt(index));

    res.json({
      success: true,
      message: "Page removed successfully",
      pages: chapter.pages,
    });
  } catch (error) {
    console.error("Remove chapter page error:", error);
    res.status(500).json({ message: "Failed to remove page" });
  }
};

// POST /api/admin/chapters/reorder - Reorder chapters (bulk update)
export const reorderChapters = async (req, res) => {
  try {
    const { mangaId, chapterOrder } = req.body; // chapterOrder: [{ id, number }]

    const operations = chapterOrder.map(({ id, number }) => ({
      updateOne: {
        filter: { _id: id, mangaId },
        update: { $set: { number } },
      },
    }));

    await Chapter.bulkWrite(operations);

    res.json({
      success: true,
      message: "Chapters reordered successfully",
    });
  } catch (error) {
    console.error("Reorder chapters error:", error);
    res.status(500).json({ message: "Failed to reorder chapters" });
  }
};