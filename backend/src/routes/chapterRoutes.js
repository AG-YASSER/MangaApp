// chapterRoutes.js
import express from "express";
import {
  getChapters,
  getChapter,
  updateReadingProgress,
} from "../controllers/chapterController.js";
import { authMiddleware } from "../middleware/auth.js";

const router = express.Router();

// Public routes
router.get("/manga/:mangaId", getChapters);        // /api/chapters/manga/123
router.get("/:id", getChapter);                     // /api/chapters/456

// Protected routes
router.post("/:id/progress", authMiddleware, updateReadingProgress); // Track reading

export default router;