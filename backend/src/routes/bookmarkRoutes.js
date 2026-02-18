// bookmarkRoutes.js
import express from "express";
import {
  getUserBookmarks,
  addBookmark,
  updateBookmark,
  removeBookmark,
  getBookmarkCategories,
  moveBookmark,
} from "../controllers/bookmarkController.js";
import { authMiddleware } from "../middleware/auth.js";

const router = express.Router();

// All bookmark routes are protected (require login)
router.get("/", authMiddleware, getUserBookmarks); // /api/bookmarks?category=reading
router.get("/categories", authMiddleware, getBookmarkCategories);
router.post("/", authMiddleware, addBookmark);
router.put("/:id", authMiddleware, updateBookmark);
router.delete("/:id", authMiddleware, removeBookmark);
router.post("/:id/move", authMiddleware, moveBookmark); // Move to different category

export default router;
