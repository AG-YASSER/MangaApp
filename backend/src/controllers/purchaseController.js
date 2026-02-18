// src/controllers/purchaseController.js
import Purchase from "../models/Purchase.js";
import User from "../models/User.js";
import Manga from "../models/Manga.js";
import Chapter from "../models/Chapter.js";
import mongoose from "mongoose";

// Get user's purchases
export const getUserPurchases = async (req, res) => {
  try {
    const userId = req.user.id;

    const purchases = await Purchase.find({ userId })
      .sort({ createdAt: -1 })
      .limit(50);

    res.json({
      success: true,
      purchases,
    });
  } catch (error) {
    console.error("Get user purchases error:", error);
    res.status(500).json({ message: error.message });
  }
};

// Purchase a single chapter
export const purchaseChapter = async (req, res) => {
  try {
    const userId = req.user.id;
    const { chapterId, mangaId, price } = req.body;

    // Check if user has enough tokens/balance
    const user = await User.findById(userId);
    if (user.tokensBalance < price) {
      return res.status(400).json({
        success: false,
        message: "Insufficient balance",
      });
    }

    // Check if chapter exists
    const chapter = await Chapter.findById(chapterId);
    if (!chapter) {
      return res.status(404).json({ message: "Chapter not found" });
    }

    // Create purchase record
    const purchase = await Purchase.create({
      userId,
      purchaseType: "chapter",
      itemId: chapterId,
      amount: price,
      currency: "tokens",
      status: "completed",
      description: `Chapter ${chapter.number}: ${chapter.title}`,
      metadata: {
        mangaId,
        chapterNumber: chapter.number,
      },
    });

    // Deduct tokens from user
    user.tokensBalance -= price;
    user.tokensSpent += price;
    user.chaptersPurchased.push({
      chapterId,
      mangaId,
      price,
      purchasedAt: new Date(),
    });
    await user.save();

    res.json({
      success: true,
      message: "Chapter purchased successfully",
      purchase,
    });
  } catch (error) {
    console.error("Purchase chapter error:", error);
    res.status(500).json({ message: error.message });
  }
};

// Purchase an entire manga
export const purchaseManga = async (req, res) => {
  try {
    const userId = req.user.id;
    const { mangaId, price } = req.body;

    // Check if user has enough tokens
    const user = await User.findById(userId);
    if (user.tokensBalance < price) {
      return res.status(400).json({
        success: false,
        message: "Insufficient balance",
      });
    }

    // Check if manga exists
    const manga = await Manga.findById(mangaId);
    if (!manga) {
      return res.status(404).json({ message: "Manga not found" });
    }

    // Get all premium chapters for this manga
    const premiumChapters = await Chapter.find({
      mangaId,
      isPremium: true,
    });

    // Create purchase record
    const purchase = await Purchase.create({
      userId,
      purchaseType: "manga",
      itemId: mangaId,
      amount: price,
      currency: "tokens",
      status: "completed",
      description: `Manga: ${manga.title}`,
      metadata: {
        mangaTitle: manga.title,
        chapterCount: premiumChapters.length,
      },
    });

    // Deduct tokens from user
    user.tokensBalance -= price;
    user.tokensSpent += price;

    // Add manga to purchased titles
    user.mangaTitlesPurchased.push({
      mangaId,
      price,
      purchasedAt: new Date(),
    });

    // Add all premium chapters to user's purchased chapters
    premiumChapters.forEach((chapter) => {
      // Check if already purchased
      const alreadyPurchased = user.chaptersPurchased.some(
        (c) => c.chapterId.toString() === chapter._id.toString(),
      );

      if (!alreadyPurchased) {
        user.chaptersPurchased.push({
          chapterId: chapter._id,
          mangaId,
          price: 0, // Free as part of manga purchase
          purchasedAt: new Date(),
        });
      }
    });

    await user.save();

    res.json({
      success: true,
      message: "Manga purchased successfully",
      purchase,
      chaptersUnlocked: premiumChapters.length,
    });
  } catch (error) {
    console.error("Purchase manga error:", error);
    res.status(500).json({ message: error.message });
  }
};

// Get purchase history
export const getPurchaseHistory = async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 20 } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const purchases = await Purchase.find({ userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Purchase.countDocuments({ userId });

    res.json({
      success: true,
      purchases,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error("Get purchase history error:", error);
    res.status(500).json({ message: error.message });
  }
};

// Check if user has access to manga or chapter
export const checkMangaAccess = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { mangaId } = req.params;

    if (!userId) {
      return res.json({
        success: true,
        hasAccess: false,
        requiresLogin: true,
        message: "Login required to access premium content",
      });
    }

    const user = await User.findById(userId);
    const manga = await Manga.findById(mangaId);

    if (!manga) {
      return res.status(404).json({ message: "Manga not found" });
    }

    // Check if user is admin/mod
    if (user.role === "admin" || user.role === "mod") {
      return res.json({
        success: true,
        hasAccess: true,
        role: user.role,
      });
    }

    // Check if user purchased the manga
    const hasMangaAccess = user.mangaTitlesPurchased.some(
      (p) => p.mangaId.toString() === mangaId,
    );

    // Check if user has active subscription
    const hasSubscription = user.isAdFree && user.adFreeExpiresAt > new Date();

    const hasAccess = hasMangaAccess || hasSubscription || !manga.premium;

    res.json({
      success: true,
      hasAccess,
      mangaId,
      isPremium: manga.premian,
      details: {
        purchased: hasMangaAccess,
        hasSubscription,
        requiresPurchase: !hasAccess && manga.premium,
      },
    });
  } catch (error) {
    console.error("Check manga access error:", error);
    res.status(500).json({ message: error.message });
  }
};

// Check if user has access to a specific chapter
export const checkChapterAccess = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { chapterId } = req.params;

    if (!userId) {
      return res.json({
        success: true,
        hasAccess: false,
        requiresLogin: true,
        message: "Login required to access premium content",
      });
    }

    const user = await User.findById(userId);
    const chapter = await Chapter.findById(chapterId).populate("mangaId");

    if (!chapter) {
      return res.status(404).json({ message: "Chapter not found" });
    }

    // If chapter is not premium, everyone has access
    if (!chapter.isPremium) {
      return res.json({
        success: true,
        hasAccess: true,
        isPremium: false,
      });
    }

    // Check if user is admin/mod
    if (user.role === "admin" || user.role === "mod") {
      return res.json({
        success: true,
        hasAccess: true,
        role: user.role,
      });
    }

    // Check if user purchased this specific chapter
    const hasChapterAccess = user.chaptersPurchased.some(
      (p) => p.chapterId.toString() === chapterId,
    );

    // Check if user purchased the entire manga
    const hasMangaAccess = user.mangaTitlesPurchased.some(
      (p) => p.mangaId.toString() === chapter.mangaId._id.toString(),
    );

    // Check if user has active subscription
    const hasSubscription = user.isAdFree && user.adFreeExpiresAt > new Date();

    const hasAccess = hasChapterAccess || hasMangaAccess || hasSubscription;

    res.json({
      success: true,
      hasAccess,
      chapterId,
      mangaId: chapter.mangaId._id,
      isPremium: true,
      details: {
        purchasedChapter: hasChapterAccess,
        purchasedManga: hasMangaAccess,
        hasSubscription,
        price: chapter.price || 0,
      },
    });
  } catch (error) {
    console.error("Check chapter access error:", error);
    res.status(500).json({ message: error.message });
  }
};
