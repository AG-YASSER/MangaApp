// routes/index.js
import express from "express";
import authRoutes from "./authRoutes.js";
import profileRoutes from "./profileRoutes.js";
import mangaRoutes from "./mangaRoutes.js";
import chapterRoutes from "./chapterRoutes.js";
import bookmarkRoutes from "./bookmarkRoutes.js";
import ratingRoutes from "./ratingRoutes.js";
import historyRoutes from "./readingHistoryRoutes.js";
import commentRoutes from "./commentRoutes.js";
import searchRoutes from "./searchRoutes.js";
import adminRoutes from "./adminRoutes.js";
import modRoutes from "./modRoutes.js";
import subscriptionRoutes from "./subscriptionRoutes.js";
import purchaseRoutes from "./purchaseRoutes.js";
import notificationRoutes from "./notificationRoutes.js";

const router = express.Router();

router.use("/auth", authRoutes);
router.use("/profile", profileRoutes);
router.use("/manga", mangaRoutes);
router.use("/chapters", chapterRoutes);
router.use("/bookmarks", bookmarkRoutes);
router.use("/ratings", ratingRoutes);
router.use("/history", historyRoutes);
router.use("/comments", commentRoutes);
router.use("/search", searchRoutes);
router.use("/admin", adminRoutes);
router.use("/mod", modRoutes);
router.use("/subscription", subscriptionRoutes);
router.use("/purchases", purchaseRoutes);
router.use("/notifications", notificationRoutes);

// Health check
router.get("/health", (req, res) => {
  res.json({ status: "OK", timestamp: new Date().toISOString() });
});

export default router;