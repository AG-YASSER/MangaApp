// readingHistoryRoutes.js
import express from "express";
import {
  getReadingHistory,
  getContinueReading,
  getRecentManga,
  getMangaProgress,
  clearHistory,
  getReadingStats,
} from "../controllers/readingHistoryController.js";
import { authMiddleware } from "../middleware/auth.js";

const router = express.Router();

// All reading history routes are protected (require login)
router.get("/", authMiddleware, getReadingHistory);           // /api/history?page=1&limit=20
router.get("/continue", authMiddleware, getContinueReading);  // /api/history/continue?limit=10
router.get("/recent-manga", authMiddleware, getRecentManga); // /api/history/recent-manga?limit=10
router.get("/stats", authMiddleware, getReadingStats);       // /api/history/stats
router.get("/manga/:mangaId", authMiddleware, getMangaProgress);
router.delete("/", authMiddleware, clearHistory);            // /api/history?mangaId=123

export default router;