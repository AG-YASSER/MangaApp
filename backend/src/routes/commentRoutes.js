// commentRoutes.js
import express from "express";
import {
  getMangaComments,
  addComment,
  updateComment,
  deleteComment,
  addReply,
  deleteReply,
  reportComment,
} from "../controllers/commentController.js";
import { authMiddleware } from "../middleware/auth.js";

const router = express.Router();

// Public routes
router.get("/manga/:mangaId", getMangaComments);  // /api/comments/manga/123?chapterId=456&page=1

// Protected routes
router.post("/manga/:mangaId", authMiddleware, addComment);
router.put("/:id", authMiddleware, updateComment);
router.delete("/:id", authMiddleware, deleteComment);
router.post("/:id/reply", authMiddleware, addReply);
router.delete("/:commentId/reply/:replyId", authMiddleware, deleteReply);
router.post("/:id/report", authMiddleware, reportComment);

export default router;