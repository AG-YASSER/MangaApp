// src/routes/purchaseRoutes.js
import express from "express";
import {
  getUserPurchases,
  purchaseChapter,
  purchaseManga,
  getPurchaseHistory,
  checkMangaAccess,
  checkChapterAccess,
} from "../controllers/purchaseController.js";
import { authMiddleware } from "../middleware/auth.js";  // Changed from authMiddleware to protect

const router = express.Router();

// Protected routes (all require authentication)
router.get("/", authMiddleware, getUserPurchases);
router.get("/history", authMiddleware, getPurchaseHistory);
router.get("/check/manga/:mangaId", authMiddleware, checkMangaAccess);
router.get("/check/chapter/:chapterId", authMiddleware, checkChapterAccess);
router.post("/chapter", authMiddleware, purchaseChapter);
router.post("/manga", authMiddleware, purchaseManga);

export default router;