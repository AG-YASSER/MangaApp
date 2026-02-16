// mangaRoutes.js
import express from "express";
import {
  getMangaList,
  getMangaBySlug,
  getRelatedManga,
  getTrendingManga,
  getFeaturedManga,
  getMangaStats,
} from "../controllers/mangaController.js";

const router = express.Router();

// Public routes
router.get("/", getMangaList);                // /api/manga?page=1&limit=20&genre=action&sort=latest
router.get("/trending", getTrendingManga);    // /api/manga/trending?period=weekly&limit=10
router.get("/featured", getFeaturedManga);    // /api/manga/featured
router.get("/stats", getMangaStats);          // /api/manga/stats
router.get("/:slug", getMangaBySlug);         // /api/manga/one-piece
router.get("/:id/related", getRelatedManga);  // /api/manga/123/related

export default router;