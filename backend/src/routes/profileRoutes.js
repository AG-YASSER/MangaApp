// profileRoutes.js
import express from "express";
import {
  getMe,
  updateMe,
  deleteMe,
  getProfile,
  updateAvatar,
  updateCoverPhoto,
  updatePreferences,
  getBookmarks,
  getReadingList,
  followUser,
  unfollowUser,
  getActivity,
} from "../controllers/profileController.js";
import { authMiddleware } from "../middleware/auth.js";

const router = express.Router();

// Protected routes (require login)
router.get("/me", authMiddleware, getMe);
router.put("/me", authMiddleware, updateMe);
router.delete("/me", authMiddleware, deleteMe);
router.patch("/me/avatar", authMiddleware, updateAvatar);
router.patch("/me/cover", authMiddleware, updateCoverPhoto);
router.patch("/me/preferences", authMiddleware, updatePreferences);
router.get("/me/bookmarks", authMiddleware, getBookmarks);
router.get("/me/reading-list", authMiddleware, getReadingList);
router.get("/me/activity", authMiddleware, getActivity);

// Public profile
router.get("/public", getProfile);

// Social routes
router.post("/follow/:userId", authMiddleware, followUser);
router.post("/unfollow/:userId", authMiddleware, unfollowUser);

export default router;