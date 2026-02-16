// adminRoutes.js
import express from "express";
import {
  getDashboardStats,
  getAllUsers,
  getUserDetails,
  changeUserRole,
  banUser,
  unbanUser,
  getDeleteRequests,
  reviewDeleteRequest,
  getReportedContent,
  moderateComment,
} from "../controllers/adminController.js";
import {
  createManga,
  updateManga,
  deleteManga,
  toggleFeatureManga,
  restoreManga,
} from "../controllers/mangaController.js";
import {
  createChapter,
  updateChapter,
  deleteChapter,
  addChapterPage,
  removeChapterPage,
  reorderChapters,
} from "../controllers/chapterController.js";
import { authMiddleware, roleMiddleware } from "../middleware/auth.js";

const router = express.Router();

// All admin routes require admin role
router.use(authMiddleware, roleMiddleware(["admin"]));

// ============ DASHBOARD ============
router.get("/dashboard", getDashboardStats);

// ============ USER MANAGEMENT ============
router.get("/users", getAllUsers);                 // /api/admin/users?role=mod&page=1
router.get("/users/:id", getUserDetails);
router.patch("/users/:id/role", changeUserRole);
router.patch("/users/:id/ban", banUser);
router.patch("/users/:id/unban", unbanUser);

// ============ MANGA MANAGEMENT ============
router.post("/manga", createManga);
router.put("/manga/:id", updateManga);
router.delete("/manga/:id", deleteManga);
router.post("/manga/:id/feature", toggleFeatureManga);
router.post("/manga/:id/restore", restoreManga);

// ============ CHAPTER MANAGEMENT ============
router.post("/chapters", createChapter);
router.put("/chapters/:id", updateChapter);
router.delete("/chapters/:id", deleteChapter);
router.post("/chapters/:id/pages", addChapterPage);
router.delete("/chapters/:id/pages/:index", removeChapterPage);
router.post("/chapters/reorder", reorderChapters);

// ============ DELETE REQUESTS ============
router.get("/delete-requests", getDeleteRequests);  // /api/admin/delete-requests?status=pending
router.post("/delete-requests/:id/review", reviewDeleteRequest);

// ============ MODERATION ============
router.get("/reports", getReportedContent);
router.post("/comments/:id/moderate", moderateComment); // action: "delete" or "clear"

export default router;