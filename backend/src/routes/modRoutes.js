// modRoutes.js
import express from "express";
import {
  getAllMods,
  getModContent,
  requestDelete,
  getMyDeleteRequests,
  getModStats,
} from "../controllers/modController.js";
import {
  createManga,
  updateManga,
} from "../controllers/mangaController.js";
import {
  createChapter,
  updateChapter,
  addChapterPage,
  removeChapterPage,
} from "../controllers/chapterController.js";
import { authMiddleware, roleMiddleware } from "../middleware/auth.js";

const router = express.Router();

// All mod routes require mod or admin role
router.use(authMiddleware, roleMiddleware(["mod", "admin"]));

// ============ MOD PROFILE ============
router.get("/", getAllMods);
router.get("/stats/:modId", getModStats);
router.get("/content/:modId", getModContent);

// ============ MANGA MANAGEMENT ============
router.post("/manga", createManga);
router.put("/manga/:id", updateManga);

// ============ CHAPTER MANAGEMENT ============
router.post("/chapters", createChapter);
router.put("/chapters/:id", updateChapter);
router.post("/chapters/:id/pages", addChapterPage);
router.delete("/chapters/:id/pages/:index", removeChapterPage);

// ============ DELETE REQUESTS ============
router.post("/delete-request", requestDelete);  // Request to delete manga/chapter
router.get("/delete-requests", getMyDeleteRequests); // View own requests

export default router;