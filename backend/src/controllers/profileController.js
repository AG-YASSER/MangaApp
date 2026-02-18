import User from "../models/User.js";
import admin from "../config/firebase.js";
import crypto from "crypto";
import {
  sendDeletionEmail,
  sendDeletionCancelledEmail,
  sendDeletionConfirmedEmail,
  sendDeletionScheduledEmail,
} from "../utils/email.js";

// ============ HELPER FUNCTIONS ============

const generateCancelToken = (userId) => {
  return crypto
    .createHash("sha256")
    .update(userId.toString() + process.env.JWT_SECRET + Date.now())
    .digest("hex")
    .substring(0, 32);
};

const formatDate = (date) => {
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

const calculateDaysLeft = (scheduledDate) => {
  return Math.ceil((scheduledDate - new Date()) / (1000 * 60 * 60 * 24));
};

// ============ PROFILE CONTROLLERS ============

/**
 * GET /api/profile/me
 * Get current user's profile
 */
export const getMe = async (req, res) => {
  try {
    const user = await User.findOne({ firebaseUid: req.user.uid }).select(
      "email username displayName bio avatar coverPhoto role tokensBalance isAdFree adFreeExpiresAt preferences isLocked deleteRequestedAt deleteScheduledFor profileVisibility showBookmarks showReadingHistory"
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User profile not found",
        code: "USER_NOT_FOUND"
      });
    }

    // If locked, show special response
    if (user.isLocked) {
      const daysLeft = calculateDaysLeft(user.deleteScheduledFor);
      
      return res.json({
        success: true,
        data: {
          user,
          isLocked: true,
          deleteScheduledFor: user.deleteScheduledFor,
          daysLeft,
        },
        message: `Your account is locked due to pending deletion. ${daysLeft} days remaining.`,
      });
    }

    res.json({
      success: true,
      data: { user },
    });
  } catch (error) {
    console.error("Get profile error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to load profile",
      code: "SERVER_ERROR"
    });
  }
};

/**
 * PUT /api/profile/me
 * Update current user's profile
 */
export const updateMe = async (req, res) => {
  try {
    const uid = req.user.uid;

    // Check if account is locked
    const user = await User.findOne({ firebaseUid: uid });
    if (user?.isLocked) {
      return res.status(403).json({
        success: false,
        message: "Cannot update profile while account deletion is pending. Cancel deletion first.",
        code: "ACCOUNT_LOCKED"
      });
    }

    const allowedUpdates = [
      "username",
      "displayName",
      "bio",
      "avatar",
      "coverPhoto",
    ];

    const updates = {};

    for (let key of allowedUpdates) {
      if (req.body[key] !== undefined) {
        updates[key] = req.body[key];
      }
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        message: "No valid fields to update",
        code: "NO_UPDATES"
      });
    }

    if (updates.username) {
      const existingUser = await User.findOne({
        username: updates.username,
        firebaseUid: { $ne: uid },
      });
      
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: "Username already taken",
          code: "USERNAME_TAKEN"
        });
      }
    }

    const updatedUser = await User.findOneAndUpdate(
      { firebaseUid: uid },
      { $set: updates },
      { new: true, runValidators: true },
    ).select("email username displayName bio avatar coverPhoto");

    res.json({
      success: true,
      message: "Profile updated successfully",
      data: { user: updatedUser },
    });
  } catch (err) {
    console.error("Update profile error:", err);
    res.status(500).json({
      success: false,
      message: "Failed to update profile",
      code: "SERVER_ERROR"
    });
  }
};

/**
 * PATCH /api/profile/me/avatar
 * Update avatar only
 */
export const updateAvatar = async (req, res) => {
  try {
    const uid = req.user.uid;

    const user = await User.findOne({ firebaseUid: uid });
    if (user?.isLocked) {
      return res.status(403).json({
        success: false,
        message: "Cannot update avatar while account deletion is pending.",
        code: "ACCOUNT_LOCKED"
      });
    }

    const { avatar } = req.body;

    if (!avatar) {
      return res.status(400).json({
        success: false,
        message: "Avatar URL is required",
        code: "AVATAR_REQUIRED"
      });
    }

    const updatedUser = await User.findOneAndUpdate(
      { firebaseUid: uid },
      { $set: { avatar } },
      { new: true },
    ).select("avatar");

    res.json({
      success: true,
      message: "Avatar updated successfully",
      data: { avatar: updatedUser.avatar },
    });
  } catch (error) {
    console.error("Update avatar error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update avatar",
      code: "SERVER_ERROR"
    });
  }
};

/**
 * PATCH /api/profile/me/cover
 * Update cover photo only
 */
export const updateCoverPhoto = async (req, res) => {
  try {
    const uid = req.user.uid;

    const user = await User.findOne({ firebaseUid: uid });
    if (user?.isLocked) {
      return res.status(403).json({
        success: false,
        message: "Cannot update cover photo while account deletion is pending.",
        code: "ACCOUNT_LOCKED"
      });
    }

    const { coverPhoto } = req.body;

    if (!coverPhoto) {
      return res.status(400).json({
        success: false,
        message: "Cover photo URL is required",
        code: "COVER_REQUIRED"
      });
    }

    const updatedUser = await User.findOneAndUpdate(
      { firebaseUid: uid },
      { $set: { coverPhoto } },
      { new: true },
    ).select("coverPhoto");

    res.json({
      success: true,
      message: "Cover photo updated successfully",
      data: { coverPhoto: updatedUser.coverPhoto },
    });
  } catch (error) {
    console.error("Update cover photo error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update cover photo",
      code: "SERVER_ERROR"
    });
  }
};

/**
 * PATCH /api/profile/me/preferences
 * Update user preferences and privacy settings
 */
export const updatePreferences = async (req, res) => {
  try {
    const uid = req.user.uid;

    const user = await User.findOne({ firebaseUid: uid });
    if (user?.isLocked) {
      return res.status(403).json({
        success: false,
        message: "Cannot update preferences while account deletion is pending.",
        code: "ACCOUNT_LOCKED"
      });
    }

    const { preferences, settings } = req.body;

    if (!preferences && !settings) {
      return res.status(400).json({
        success: false,
        message: "No preferences or settings provided",
        code: "NO_UPDATES"
      });
    }

    const updateData = {};

    if (preferences) {
      updateData.preferences = preferences;
    }

    if (settings) {
      if (settings.profileVisibility) updateData.profileVisibility = settings.profileVisibility;
      if (settings.showBookmarks !== undefined) updateData.showBookmarks = settings.showBookmarks;
      if (settings.showReadingHistory !== undefined) updateData.showReadingHistory = settings.showReadingHistory;
    }

    const updatedUser = await User.findOneAndUpdate(
      { firebaseUid: uid },
      { $set: updateData },
      { new: true, runValidators: true },
    ).select("preferences profileVisibility showBookmarks showReadingHistory");

    res.json({
      success: true,
      message: "Preferences updated successfully",
      data: {
        preferences: updatedUser.preferences,
        settings: {
          profileVisibility: updatedUser.profileVisibility,
          showBookmarks: updatedUser.showBookmarks,
          showReadingHistory: updatedUser.showReadingHistory,
        },
      },
    });
  } catch (error) {
    console.error("Update preferences error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update preferences",
      code: "SERVER_ERROR"
    });
  }
};

// ============ ACCOUNT DELETION CONTROLLERS ============

/**
 * POST /api/profile/delete/request
 * Request account deletion (locks account, sends email)
 */
export const requestDelete = async (req, res) => {
  try {
    const uid = req.user.uid;
    const user = await User.findOne({ firebaseUid: uid });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
        code: "USER_NOT_FOUND"
      });
    }

    // Check if already have pending deletion
    if (user.deleteRequestedAt) {
      const daysLeft = calculateDaysLeft(user.deleteScheduledFor);
      
      return res.status(400).json({
        success: false,
        message: `You already have a pending deletion request. ${daysLeft} days remaining.`,
        code: "PENDING_DELETION_EXISTS",
        data: await getDeleteStatus(req, res, true),
      });
    }

    const verificationCode = crypto.randomInt(100000, 999999).toString();
    const codeExpires = new Date(Date.now() + 15 * 60 * 1000);
    const deletionDate = new Date(Date.now() + 15 * 24 * 60 * 60 * 1000);

    user.deleteRequestedAt = new Date();
    user.deleteScheduledFor = deletionDate;
    user.deleteVerificationCode = verificationCode;
    user.deleteVerificationExpires = codeExpires;
    user.isLocked = true;
    user.isActive = false;

    await user.save();

    await sendDeletionEmail(user.email, {
      code: verificationCode,
      name: user.username,
      deletionDate: formatDate(deletionDate),
      cancelLink: `http://localhost:5000/api/profile/delete/cancel?token=${generateCancelToken(user._id)}`,
    });

    res.json({
      success: true,
      message: "Deletion requested. Check your email for verification code.",
      data: {
        deleteScheduledFor: deletionDate,
        note: "You have 15 days to cancel this request.",
      },
    });
  } catch (err) {
    console.error("Delete request error:", err);
    res.status(500).json({
      success: false,
      message: "Failed to process deletion request",
      code: "SERVER_ERROR"
    });
  }
};

/**
 * POST /api/profile/delete/verify
 * Verify deletion with code and start 15-day countdown
 */
export const verifyDelete = async (req, res) => {
  try {
    const { code } = req.body;
    const uid = req.user.uid;

    if (!code) {
      return res.status(400).json({
        success: false,
        message: "Verification code is required",
        code: "CODE_REQUIRED"
      });
    }

    const user = await User.findOne({ firebaseUid: uid });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
        code: "USER_NOT_FOUND"
      });
    }

    if (!user.deleteRequestedAt) {
      return res.status(400).json({
        success: false,
        message: "No pending deletion request",
        code: "NO_PENDING_DELETION"
      });
    }

    if (user.deleteVerificationCode !== code) {
      return res.status(400).json({
        success: false,
        message: "Invalid verification code",
        code: "INVALID_CODE"
      });
    }

    if (user.deleteVerificationExpires < new Date()) {
      return res.status(400).json({
        success: false,
        message: "Verification code expired. Please request again.",
        code: "CODE_EXPIRED"
      });
    }

    // Mark as verified and start 15-day countdown
    user.deleteVerified = true;
    user.deleteVerificationCode = null;
    user.deleteVerificationExpires = null;
    
    await user.save();

    await sendDeletionScheduledEmail(user.email, {
      name: user.username,
      deletionDate: formatDate(user.deleteScheduledFor),
    });

    res.clearCookie("session");

    res.json({
      success: true,
      message: "Deletion confirmed. Your account will be permanently deleted in 15 days.",
      data: {
        deleteScheduledFor: user.deleteScheduledFor,
        daysLeft: 15,
      },
    });
  } catch (err) {
    console.error("Verify deletion error:", err);
    res.status(500).json({
      success: false,
      message: "Failed to verify deletion",
      code: "SERVER_ERROR"
    });
  }
};

/**
 * POST /api/profile/delete/cancel
 * Cancel pending deletion request
 */
export const cancelDelete = async (req, res) => {
  try {
    const uid = req.user.uid;

    const user = await User.findOne({ firebaseUid: uid });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
        code: "USER_NOT_FOUND"
      });
    }

    if (!user.deleteRequestedAt) {
      return res.status(400).json({
        success: false,
        message: "No pending deletion request",
        code: "NO_PENDING_DELETION"
      });
    }

    // Reset ALL deletion fields
    user.deleteRequestedAt = null;
    user.deleteScheduledFor = null;
    user.deleteVerificationCode = null;
    user.deleteVerificationExpires = null;
    user.deleteVerified = false;
    user.isLocked = false;
    user.isActive = true;

    await user.save();

    await sendDeletionCancelledEmail(user.email, {
      name: user.username,
    });

    res.json({
      success: true,
      message: "Deletion cancelled successfully. Your account is now active.",
      data: null,
    });
  } catch (err) {
    console.error("Cancel deletion error:", err);
    res.status(500).json({
      success: false,
      message: "Failed to cancel deletion",
      code: "SERVER_ERROR"
    });
  }
};

/**
 * GET /api/profile/delete/status
 * Check pending deletion status
 */
export const getDeleteStatus = async (req, res) => {
  try {
    const user = await User.findOne({ firebaseUid: req.user.uid });
    
    if (!user?.deleteRequestedAt) {
      return res.json({ 
        success: true, 
        hasPendingDeletion: false 
      });
    }

    const daysLeft = Math.ceil(
      (user.deleteScheduledFor - new Date()) / (1000 * 60 * 60 * 24)
    );

    res.json({
      success: true,
      hasPendingDeletion: true,
      isVerified: user.deleteVerified || false,
      daysLeft,
      deleteScheduledFor: user.deleteScheduledFor
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: "Failed to get status" 
    });
  }
};

// ============ PUBLIC PROFILE CONTROLLER ============

/**
 * GET /api/profile/public
 * Get public profile by username or userId
 */
export const getProfile = async (req, res) => {
  try {
    const { username, userId } = req.query;
    const requestingUserId = req.user?.id;

    if (!username && !userId) {
      return res.status(400).json({
        success: false,
        message: "Username or userId is required",
        code: "MISSING_PARAMETER"
      });
    }

    let user;
    if (username) {
      user = await User.findOne({ username });
    } else {
      user = await User.findById(userId);
    }

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
        code: "USER_NOT_FOUND"
      });
    }

    // Base public info - always visible
    const publicProfile = {
      username: user.username,
      displayName: user.displayName,
      bio: user.bio,
      avatar: user.avatar,
      coverPhoto: user.coverPhoto,
      role: user.role,
      createdAt: user.createdAt,
      totalReviews: user.totalReviews,
      averageRating: user.averageRating,
    };

    // Check if profile is private
    const isOwner = requestingUserId && requestingUserId.toString() === user._id.toString();

    if (user.profileVisibility === "private" && !isOwner) {
      return res.json({
        success: true,
        data: {
          profile: publicProfile,
          isPrivate: true,
        },
        message: "This profile is private",
      });
    }

    // Add additional info based on permissions
    if (isOwner || user.profileVisibility === "public") {
      if (user.showBookmarks || isOwner) {
        publicProfile.bookmarks = user.bookmarkedManga;
      }

      if (user.showReadingHistory || isOwner) {
        publicProfile.readingHistory = user.chaptersRead.slice(0, 10);
      }
    }

    res.json({
      success: true,
      data: { profile: publicProfile },
    });
  } catch (error) {
    console.error("Get public profile error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to load profile",
      code: "SERVER_ERROR"
    });
  }
};