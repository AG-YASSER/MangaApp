import User from "../models/User.js";
import admin from "../config/firebase.js";
import crypto from "crypto";
import {
  sendDeletionEmail,          
} from "../utils/email.js";

// ============ HELPER FUNCTIONS ============

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
      "email username displayName bio avatar coverPhoto role tokensBalance preferences isLocked deleteRequestedAt deleteScheduledFor profileVisibility"
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    if (user.isLocked) {
      const daysLeft = calculateDaysLeft(user.deleteScheduledFor);
      return res.json({
        success: true,
        user: {
          ...user.toObject(),
          isLocked: true,
          daysLeft
        }
      });
    }

    res.json({ success: true, user });
  } catch (error) {
    console.error("Get profile error:", error);
    res.status(500).json({ 
      success: false, 
      message: "Failed to load profile" 
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

    const user = await User.findOne({ firebaseUid: uid });
    if (user?.isLocked) {
      return res.status(403).json({
        success: false,
        message: "Cannot update profile while account deletion is pending"
      });
    }

    const allowedUpdates = ["username", "displayName", "bio", "avatar", "coverPhoto"];
    const updates = {};

    for (let key of allowedUpdates) {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        message: "No valid fields to update"
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
          message: "Username already taken"
        });
      }
    }

    const updatedUser = await User.findOneAndUpdate(
      { firebaseUid: uid },
      { $set: updates },
      { new: true, runValidators: true }
    ).select("email username displayName bio avatar coverPhoto");

    res.json({
      success: true,
      message: "Profile updated",
      user: updatedUser
    });
  } catch (err) {
    console.error("Update profile error:", err);
    res.status(500).json({ 
      success: false, 
      message: "Failed to update profile" 
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
        message: "Cannot update avatar while account deletion is pending"
      });
    }

    const { avatar } = req.body;

    if (!avatar) {
      return res.status(400).json({
        success: false,
        message: "Avatar URL is required"
      });
    }

    const updatedUser = await User.findOneAndUpdate(
      { firebaseUid: uid },
      { $set: { avatar } },
      { new: true }
    ).select("avatar");

    res.json({
      success: true,
      message: "Avatar updated",
      avatar: updatedUser.avatar
    });
  } catch (error) {
    console.error("Update avatar error:", error);
    res.status(500).json({ 
      success: false, 
      message: "Failed to update avatar" 
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
        message: "Cannot update cover photo while account deletion is pending"
      });
    }

    const { coverPhoto } = req.body;

    if (!coverPhoto) {
      return res.status(400).json({
        success: false,
        message: "Cover photo URL is required"
      });
    }

    const updatedUser = await User.findOneAndUpdate(
      { firebaseUid: uid },
      { $set: { coverPhoto } },
      { new: true }
    ).select("coverPhoto");

    res.json({
      success: true,
      message: "Cover photo updated",
      coverPhoto: updatedUser.coverPhoto
    });
  } catch (error) {
    console.error("Update cover photo error:", error);
    res.status(500).json({ 
      success: false, 
      message: "Failed to update cover photo" 
    });
  }
};

/**
 * PATCH /api/profile/me/preferences
 * Update user preferences
 */
export const updatePreferences = async (req, res) => {
  try {
    const uid = req.user.uid;

    const user = await User.findOne({ firebaseUid: uid });
    if (user?.isLocked) {
      return res.status(403).json({
        success: false,
        message: "Cannot update preferences while account deletion is pending"
      });
    }

    const { preferences, settings } = req.body;

    if (!preferences && !settings) {
      return res.status(400).json({
        success: false,
        message: "No preferences or settings provided"
      });
    }

    const updateData = {};

    if (preferences) updateData.preferences = preferences;
    if (settings) {
      if (settings.profileVisibility) updateData.profileVisibility = settings.profileVisibility;
      if (settings.showBookmarks !== undefined) updateData.showBookmarks = settings.showBookmarks;
      if (settings.showReadingHistory !== undefined) updateData.showReadingHistory = settings.showReadingHistory;
    }

    const updatedUser = await User.findOneAndUpdate(
      { firebaseUid: uid },
      { $set: updateData },
      { new: true, runValidators: true }
    ).select("preferences profileVisibility showBookmarks showReadingHistory");

    res.json({
      success: true,
      message: "Preferences updated",
      preferences: updatedUser.preferences,
      settings: {
        profileVisibility: updatedUser.profileVisibility,
        showBookmarks: updatedUser.showBookmarks,
        showReadingHistory: updatedUser.showReadingHistory
      }
    });
  } catch (error) {
    console.error("Update preferences error:", error);
    res.status(500).json({ 
      success: false, 
      message: "Failed to update preferences" 
    });
  }
};

// ============ ACCOUNT DELETION CONTROLLERS ============

/**
 * POST /api/profile/delete/request
 * Request account deletion (locks account, sends email with code)
 */
export const requestDelete = async (req, res) => {
  try {
    const uid = req.user.uid;
    const user = await User.findOne({ firebaseUid: uid });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    if (user.deleteRequestedAt) {
      const daysLeft = calculateDaysLeft(user.deleteScheduledFor);
      return res.status(400).json({
        success: false,
        message: `Already have a pending deletion request. ${daysLeft} days remaining.`
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

    // ONLY essential email with code
    await sendDeletionEmail(user.email, {
      code: verificationCode,
      name: user.username,
      deletionDate: formatDate(deletionDate)
    });

    res.json({
      success: true,
      message: "Deletion requested. Check your email for verification code.",
      deleteScheduledFor: deletionDate
    });
  } catch (err) {
    console.error("Delete request error:", err);
    res.status(500).json({ 
      success: false, 
      message: "Failed to process deletion request" 
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
        message: "Verification code is required"
      });
    }

    const user = await User.findOne({ firebaseUid: uid });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    if (!user.deleteRequestedAt) {
      return res.status(400).json({
        success: false,
        message: "No pending deletion request"
      });
    }

    if (user.deleteVerificationCode !== code) {
      return res.status(400).json({
        success: false,
        message: "Invalid verification code"
      });
    }

    if (user.deleteVerificationExpires < new Date()) {
      return res.status(400).json({
        success: false,
        message: "Verification code expired. Please request again."
      });
    }

    user.deleteVerified = true;
    user.deleteVerificationCode = null;
    user.deleteVerificationExpires = null;
    await user.save();

    res.clearCookie("session");

    res.json({
      success: true,
      message: "Deletion confirmed. Your account will be permanently deleted in 15 days.",
      deleteScheduledFor: user.deleteScheduledFor
    });
  } catch (err) {
    console.error("Verify deletion error:", err);
    res.status(500).json({ 
      success: false, 
      message: "Failed to verify deletion" 
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
        message: "User not found"
      });
    }

    if (!user.deleteRequestedAt) {
      return res.status(400).json({
        success: false,
        message: "No pending deletion request"
      });
    }

    // Reset all deletion fields
    user.deleteRequestedAt = null;
    user.deleteScheduledFor = null;
    user.deleteVerificationCode = null;
    user.deleteVerificationExpires = null;
    user.deleteVerified = false;
    user.isLocked = false;
    user.isActive = true;

    await user.save();

    res.json({
      success: true,
      message: "Deletion cancelled. Your account is now active."
    });
  } catch (err) {
    console.error("Cancel deletion error:", err);
    res.status(500).json({ 
      success: false, 
      message: "Failed to cancel deletion" 
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

    const daysLeft = calculateDaysLeft(user.deleteScheduledFor);

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

// ============ PUBLIC PROFILE ============

/**
 * GET /api/profile/public
 * Get public profile by username or userId
 */
export const getProfile = async (req, res) => {
  try {
    const { username, userId } = req.query;

    if (!username && !userId) {
      return res.status(400).json({
        success: false,
        message: "Username or userId required"
      });
    }

    const user = username 
      ? await User.findOne({ username })
      : await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    const publicProfile = {
      username: user.username,
      displayName: user.displayName,
      bio: user.bio,
      avatar: user.avatar,
      coverPhoto: user.coverPhoto,
      role: user.role,
      createdAt: user.createdAt
    };

    res.json({
      success: true,
      profile: publicProfile
    });
  } catch (error) {
    console.error("Get public profile error:", error);
    res.status(500).json({ 
      success: false, 
      message: "Failed to load profile" 
    });
  }
};