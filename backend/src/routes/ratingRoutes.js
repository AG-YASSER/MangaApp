// ratingRoutes.js
import express from "express";
import {
  getMangaRatings,
  getUserRatings,
  getUserMangaRating,
  rateManga,
  deleteRating,
  getRatingSummary,
} from "../controllers/ratingController.js";
import { authMiddleware } from "../middleware/auth.js";

const router = express.Router();

// Public routes
router.get("/manga/:mangaId", getMangaRatings);           // /api/ratings/manga/123?page=1&limit=20
router.get("/manga/:mangaId/summary", getRatingSummary);  // /api/ratings/manga/123/summary

// Protected routes
router.get("/user", authMiddleware, getUserRatings);      // Get all user's ratings
router.get("/user/:mangaId", authMiddleware, getUserMangaRating); // Get user's rating for specific manga
router.post("/manga/:mangaId", authMiddleware, rateManga); // Add/update rating
router.delete("/manga/:mangaId", authMiddleware, deleteRating); // Remove rating

export default router;