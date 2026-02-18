import express from "express";
import {
  getMe,
  updateMe,
  getProfile,
  updateAvatar,
  updateCoverPhoto,
  updatePreferences,
  requestDelete,
  verifyDelete,
  cancelDelete,
  getDeleteStatus,
} from "../controllers/profileController.js";
import { authMiddleware } from "../middleware/auth.js";

const router = express.Router();

// ============ PROFILE ROUTES (Require Login) ============

/**
 * @route   GET /api/profile/me
 * @desc    Get current user's profile
 * @access  Private
 */
router.get("/me", authMiddleware, getMe);

/**
 * @route   PUT /api/profile/me
 * @desc    Update current user's profile
 * @access  Private
 */
router.put("/me", authMiddleware, updateMe);

/**
 * @route   PATCH /api/profile/me/avatar
 * @desc    Update avatar only
 * @access  Private
 */
router.patch("/me/avatar", authMiddleware, updateAvatar);

/**
 * @route   PATCH /api/profile/me/cover
 * @desc    Update cover photo only
 * @access  Private
 */
router.patch("/me/cover", authMiddleware, updateCoverPhoto);

/**
 * @route   PATCH /api/profile/me/preferences
 * @desc    Update user preferences and privacy settings
 * @access  Private
 */
router.patch("/me/preferences", authMiddleware, updatePreferences);

// ============ ACCOUNT DELETION FLOW ============

/**
 * @route   POST /api/profile/delete/request
 * @desc    Request account deletion (locks account, sends email)
 * @access  Private
 */
router.post("/delete/request", authMiddleware, requestDelete);

/**
 * @route   POST /api/profile/delete/verify
 * @desc    Verify deletion with code and permanently delete
 * @access  Private
 */
router.post("/delete/verify", authMiddleware, verifyDelete);

/**
 * @route   POST /api/profile/delete/cancel
 * @desc    Cancel pending deletion request
 * @access  Private
 */
router.post("/delete/cancel", authMiddleware, cancelDelete);

/**
 * @route   GET /api/profile/delete/status
 * @desc    Check status of pending deletion
 * @access  Private
 */
router.get("/delete/status", authMiddleware, getDeleteStatus);

// ============ PUBLIC PROFILE ============

/**
 * @route   GET /api/profile/public
 * @desc    Get public profile by username or userId (query params)
 * @access  Public
 * @example /api/profile/public?username=johndoe
 * @example /api/profile/public?userId=123abc
 */
router.get("/public", getProfile);

export default router;