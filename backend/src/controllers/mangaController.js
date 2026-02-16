import Manga from "../models/Manga.js";
import Chapter from "../models/Chapter.js";
import Rating from "../models/Rating.js";
import mongoose from "mongoose";

// ============ PUBLIC ROUTES ============

// GET /api/manga - Get all manga with filters, pagination, sorting
export const getMangaList = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      genre,
      status,
      sort = "latest",
      search,
    } = req.query;

    const query = { 
      isDeleted: false, 
      publicationStatus: "published" 
    };

    // Filter by genre
    if (genre) {
      query.genres = genre;
    }

    // Filter by status
    if (status) {
      query.status = status;
    }

    // Search by title
    if (search) {
      query.$text = { $search: search };
    }

    // Determine sort order
    let sortOption = {};
    switch (sort) {
      case "latest":
        sortOption = { createdAt: -1 };
        break;
      case "popular":
        sortOption = { views: -1 };
        break;
      case "rating":
        sortOption = { rating: -1 };
        break;
      case "trending":
        sortOption = { viewsWeekly: -1 };
        break;
      case "updated":
        sortOption = { lastChapterAddedAt: -1 };
        break;
      default:
        sortOption = { createdAt: -1 };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Execute query
    const manga = await Manga.find(query)
      .sort(sortOption)
      .skip(skip)
      .limit(parseInt(limit))
      .select("title slug coverImage description summary genres status rating views premium createdAt lastChapterAddedAt totalChapters");

    const total = await Manga.countDocuments(query);

    res.json({
      success: true,
      manga,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error("Get manga list error:", error);
    res.status(500).json({ message: "Failed to load manga" });
  }
};

// GET /api/manga/:slug - Get single manga by slug
export const getMangaBySlug = async (req, res) => {
  try {
    const { slug } = req.params;
    
    const manga = await Manga.findOne({ 
      slug, 
      isDeleted: false,
      publicationStatus: "published" 
    }).populate("createdBy", "username");

    if (!manga) {
      return res.status(404).json({ message: "Manga not found" });
    }

    // Increment view count
    await manga.incrementViews();

    // Get chapters for this manga
    const chapters = await Chapter.find({ mangaId: manga._id })
      .sort({ number: 1 })
      .select("title number isPremium views releaseDate createdAt");

    res.json({
      success: true,
      manga,
      chapters,
      totalChapters: chapters.length,
    });
  } catch (error) {
    console.error("Get manga by slug error:", error);
    res.status(500).json({ message: "Failed to load manga" });
  }
};

// GET /api/manga/:id/related - Get related manga recommendations
export const getRelatedManga = async (req, res) => {
  try {
    const { id } = req.params;
    
    const manga = await Manga.findById(id);
    if (!manga) {
      return res.status(404).json({ message: "Manga not found" });
    }

    // Find manga with similar genres
    const related = await Manga.find({
      _id: { $ne: id },
      genres: { $in: manga.genres },
      isDeleted: false,
      publicationStatus: "published",
    })
      .sort({ rating: -1, views: -1 })
      .limit(5)
      .select("title slug coverImage summary rating");

    res.json({ success: true, related });
  } catch (error) {
    console.error("Get related manga error:", error);
    res.status(500).json({ message: "Failed to load related manga" });
  }
};

// GET /api/manga/trending - Get trending manga
export const getTrendingManga = async (req, res) => {
  try {
    const { period = "weekly", limit = 10 } = req.query;
    
    const trending = await Manga.getTrending(period, parseInt(limit));
    
    res.json({ success: true, trending });
  } catch (error) {
    console.error("Get trending manga error:", error);
    res.status(500).json({ message: "Failed to load trending manga" });
  }
};

// GET /api/manga/featured - Get featured manga
export const getFeaturedManga = async (req, res) => {
  try {
    const featured = await Manga.find({
      isFeatured: true,
      featuredUntil: { $gt: new Date() },
      isDeleted: false,
      publicationStatus: "published",
    })
      .sort({ sortPriority: -1 })
      .limit(10)
      .select("title slug coverImage summary rating");

    res.json({ success: true, featured });
  } catch (error) {
    console.error("Get featured manga error:", error);
    res.status(500).json({ message: "Failed to load featured manga" });
  }
};

// ============ PROTECTED ROUTES (MOD/ADMIN) ============

// POST /api/admin/manga - Create new manga
export const createManga = async (req, res) => {
  try {
    const {
      title,
      slug,
      description,
      summary,
      coverImage,
      images,
      author,
      artist,
      publisher,
      yearReleased,
      genres,
      contentRating,
      status,
      originalLanguage,
      isColored,
      readingDirection,
      externalLinks,
    } = req.body;

    // Check if slug already exists
    const existing = await Manga.findOne({ slug });
    if (existing) {
      return res.status(400).json({ message: "Slug already exists" });
    }

    const manga = await Manga.create({
      title,
      slug,
      description,
      summary,
      coverImage: coverImage || "default-cover.jpg",
      images,
      author: author || [],
      artist: artist || [],
      publisher,
      yearReleased,
      genres: genres || [],
      contentRating: contentRating || "all_ages",
      status: status || "ongoing",
      originalLanguage: originalLanguage || "ja",
      isColored: isColored || false,
      readingDirection: readingDirection || "ltr",
      externalLinks,
      createdBy: req.user.id, // From auth middleware
      publishedAt: new Date(),
    });

    res.status(201).json({
      success: true,
      message: "Manga created successfully",
      manga,
    });
  } catch (error) {
    console.error("Create manga error:", error);
    res.status(500).json({ message: "Failed to create manga" });
  }
};

// PUT /api/admin/manga/:id - Update manga
export const updateManga = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Remove fields that shouldn't be updated directly
    delete updates._id;
    delete updates.createdBy;
    delete updates.createdAt;
    delete updates.views;
    delete updates.rating;
    delete updates.totalRatings;

    // If slug is being updated, check it's unique
    if (updates.slug) {
      const existing = await Manga.findOne({ 
        slug: updates.slug,
        _id: { $ne: id }
      });
      if (existing) {
        return res.status(400).json({ message: "Slug already exists" });
      }
    }

    const manga = await Manga.findByIdAndUpdate(
      id,
      { 
        ...updates,
        lastUpdatedBy: req.user.id,
      },
      { new: true, runValidators: true }
    );

    if (!manga) {
      return res.status(404).json({ message: "Manga not found" });
    }

    res.json({
      success: true,
      message: "Manga updated successfully",
      manga,
    });
  } catch (error) {
    console.error("Update manga error:", error);
    res.status(500).json({ message: "Failed to update manga" });
  }
};

// DELETE /api/admin/manga/:id - Soft delete manga
export const deleteManga = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const manga = await Manga.findById(id);
    if (!manga) {
      return res.status(404).json({ message: "Manga not found" });
    }

    await manga.softDelete(reason || "Deleted by admin");

    res.json({
      success: true,
      message: "Manga deleted successfully",
    });
  } catch (error) {
    console.error("Delete manga error:", error);
    res.status(500).json({ message: "Failed to delete manga" });
  }
};

// POST /api/admin/manga/:id/feature - Feature/unfeature manga
export const toggleFeatureManga = async (req, res) => {
  try {
    const { id } = req.params;
    const { featured, featuredUntil, sortPriority } = req.body;

    const manga = await Manga.findByIdAndUpdate(
      id,
      {
        isFeatured: featured,
        featuredUntil: featuredUntil || null,
        sortPriority: sortPriority || 0,
        lastUpdatedBy: req.user.id,
      },
      { new: true }
    );

    if (!manga) {
      return res.status(404).json({ message: "Manga not found" });
    }

    res.json({
      success: true,
      message: featured ? "Manga featured" : "Manga unfeatured",
      manga,
    });
  } catch (error) {
    console.error("Toggle feature manga error:", error);
    res.status(500).json({ message: "Failed to update featured status" });
  }
};

// POST /api/admin/manga/:id/restore - Restore soft-deleted manga
export const restoreManga = async (req, res) => {
  try {
    const { id } = req.params;

    const manga = await Manga.findById(id);
    if (!manga) {
      return res.status(404).json({ message: "Manga not found" });
    }

    await manga.restore();

    res.json({
      success: true,
      message: "Manga restored successfully",
    });
  } catch (error) {
    console.error("Restore manga error:", error);
    res.status(500).json({ message: "Failed to restore manga" });
  }
};

// GET /api/manga/stats - Get manga statistics
export const getMangaStats = async (req, res) => {
  try {
    // Get total count
    const totalManga = await Manga.countDocuments({ 
      isDeleted: false, 
      publicationStatus: "published" 
    });
    
    // Get count by genre
    const genreStats = await Manga.aggregate([
      { $match: { isDeleted: false, publicationStatus: "published" } },
      { $unwind: "$genres" },
      { $group: { _id: "$genres", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);
    
    // Get count by status
    const statusStats = await Manga.aggregate([
      { $match: { isDeleted: false, publicationStatus: "published" } },
      { $group: { _id: "$status", count: { $sum: 1 } } }
    ]);
    
    // Get recently added
    const recentlyAdded = await Manga.find({ 
      isDeleted: false, 
      publicationStatus: "published" 
    })
      .sort({ createdAt: -1 })
      .limit(5)
      .select("title slug coverImage");
    
    res.json({
      success: true,
      stats: {
        total: totalManga,
        byGenre: genreStats,
        byStatus: statusStats,
        recentlyAdded
      }
    });
  } catch (error) {
    console.error("Get manga stats error:", error);
    res.status(500).json({ message: "Failed to load manga stats" });
  }
};