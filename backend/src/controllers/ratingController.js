import Rating from "../models/Rating.js";
import Manga from "../models/Manga.js";
import mongoose from "mongoose";

// GET /api/manga/:mangaId/ratings - Get all ratings for a manga
export const getMangaRatings = async (req, res) => {
  try {
    const { mangaId } = req.params;
    const { page = 1, limit = 20 } = req.query;

    // Validate mangaId is valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(mangaId)) {
      return res.status(400).json({ message: "Invalid manga ID" });
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const ratings = await Rating.find({ mangaId })
      .populate("userId", "username avatar")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Rating.countDocuments({ mangaId });

    // Get rating distribution
    const distribution = await Rating.aggregate([
      { $match: { mangaId: new mongoose.Types.ObjectId(mangaId) } },
      {
        $group: {
          _id: "$rating",
          count: { $sum: 1 },
        },
      },
    ]);

    const distMap = {
      1: 0,
      2: 0,
      3: 0,
      4: 0,
      5: 0,
    };

    distribution.forEach((d) => {
      distMap[d._id] = d.count;
    });

    res.json({
      success: true,
      ratings,
      distribution: distMap,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error("Get manga ratings error:", error);
    res.status(500).json({ message: "Failed to load ratings" });
  }
};

// GET /api/user/ratings - Get current user's ratings
export const getUserRatings = async (req, res) => {
  try {
    const userId = req.user.id;

    const ratings = await Rating.find({ userId })
      .populate("mangaId", "title slug coverImage")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      ratings,
    });
  } catch (error) {
    console.error("Get user ratings error:", error);
    res.status(500).json({ message: "Failed to load ratings" });
  }
};

// GET /api/manga/:mangaId/user-rating - Get current user's rating for a manga
export const getUserMangaRating = async (req, res) => {
  try {
    const { mangaId } = req.params;
    const userId = req.user.id;

    const rating = await Rating.findOne({ userId, mangaId });

    res.json({
      success: true,
      rating: rating || null,
    });
  } catch (error) {
    console.error("Get user manga rating error:", error);
    res.status(500).json({ message: "Failed to load rating" });
  }
};

// POST /api/manga/:mangaId/rate - Add or update rating
export const rateManga = async (req, res) => {
  try {
    const { mangaId } = req.params;
    const userId = req.user.id;
    const { rating, review } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      return res
        .status(400)
        .json({ message: "Rating must be between 1 and 5" });
    }

    // Check if manga exists
    const manga = await Manga.findById(mangaId);
    if (!manga) {
      return res.status(404).json({ message: "Manga not found" });
    }

    // Check if user already rated
    const existingRating = await Rating.findOne({ userId, mangaId });

    let result;
    if (existingRating) {
      // Update existing rating
      const oldRating = existingRating.rating;
      existingRating.rating = rating;
      if (review !== undefined) existingRating.review = review;
      await existingRating.save();

      // Update manga's rating stats
      await manga.updateRating(rating, oldRating);

      result = existingRating;
    } else {
      // Create new rating
      const newRating = await Rating.create({
        userId,
        mangaId,
        rating,
        review: review || "",
      });

      // Update manga's rating stats
      await manga.updateRating(rating);

      result = newRating;
    }

    res.json({
      success: true,
      message: existingRating ? "Rating updated" : "Rating added",
      rating: result,
    });
  } catch (error) {
    console.error("Rate manga error:", error);

    // Handle duplicate key error
    if (error.code === 11000) {
      return res
        .status(400)
        .json({ message: "You have already rated this manga" });
    }

    res.status(500).json({ message: "Failed to submit rating" });
  }
};

// DELETE /api/manga/:mangaId/rate - Remove rating
export const deleteRating = async (req, res) => {
  try {
    const { mangaId } = req.params;
    const userId = req.user.id;

    const rating = await Rating.findOneAndDelete({ userId, mangaId });

    if (!rating) {
      return res.status(404).json({ message: "Rating not found" });
    }

    // Update manga's rating stats (remove this rating)
    const manga = await Manga.findById(mangaId);
    if (manga && manga.totalRatings > 0) {
      manga.ratingSum -= rating.rating;
      manga.totalRatings -= 1;
      manga.ratingDistribution[rating.rating] -= 1;

      if (manga.totalRatings > 0) {
        manga.rating = manga.ratingSum / manga.totalRatings;
      } else {
        manga.rating = 0;
      }

      await manga.save();
    }

    res.json({
      success: true,
      message: "Rating removed successfully",
    });
  } catch (error) {
    console.error("Delete rating error:", error);
    res.status(500).json({ message: "Failed to delete rating" });
  }
};

// GET /api/manga/:mangaId/rating-summary - Get rating summary
export const getRatingSummary = async (req, res) => {
  try {
    const { mangaId } = req.params;

    const manga = await Manga.findById(mangaId).select(
      "rating totalRatings ratingDistribution",
    );

    if (!manga) {
      return res.status(404).json({ message: "Manga not found" });
    }

    res.json({
      success: true,
      summary: {
        average: manga.rating,
        total: manga.totalRatings,
        distribution: manga.ratingDistribution,
      },
    });
  } catch (error) {
    console.error("Get rating summary error:", error);
    res.status(500).json({ message: "Failed to load rating summary" });
  }
};
