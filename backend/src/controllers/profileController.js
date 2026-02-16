import User from "../models/User.js";
import admin from "../config/firebase.js";

// ✅ GET /me
export const getMe = async (req, res) => {
  try {
    const user = await User.findOne({ firebaseUid: req.user.uid }).select(
      "email username avatar role tokensBalance",
    );

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({
      success: true,
      user,
    });
  } catch {
    res.status(500).json({ message: "Failed to load profile" });
  }
};

// ✅ PUT /me
export const updateMe = async (req, res) => {
  try {
    const uid = req.user.uid;

    const allowedUpdates = ["username", "displayName", "avatar"];
    const updates = {};

    for (let key of allowedUpdates) {
      if (req.body[key]) updates[key] = req.body[key];
    }

    const user = await User.findOneAndUpdate(
      { firebaseUid: uid },
      { $set: updates },
      { new: true },
    );

    res.json({
      success: true,
      message: "Profile updated",
      user,
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to update profile" });
  }
};

// ✅ DELETE /me
export const deleteMe = async (req, res) => {
  try {
    const uid = req.user.uid;

    // 1. delete from Mongo
    await User.findOneAndDelete({ firebaseUid: uid });

    // 2. delete from Firebase
    await admin.auth().deleteUser(uid);

    res.clearCookie("session");

    res.json({
      success: true,
      message: "Account deleted successfully",
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete account" });
  }
};

// GET public profile by username or userId
export const getProfile = async (req, res) => {
  try {
    const { username, userId } = req.query;
    let user;
    if (username) {
      user = await User.findOne({ username }).select(
        "username displayName bio avatar coverPhoto role totalReviews averageRating followers following",
      );
    } else if (userId) {
      user = await User.findById(userId).select(
        "username displayName bio avatar coverPhoto role totalReviews averageRating followers following",
      );
    }
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json({ success: true, user });
  } catch {
    res.status(500).json({ message: "Failed to load profile" });
  }
};

// PATCH /me/avatar - Change avatar
export const updateAvatar = async (req, res) => {
  try {
    const uid = req.user.uid;
    const { avatar } = req.body;
    if (!avatar) return res.status(400).json({ message: "No avatar provided" });
    const user = await User.findOneAndUpdate(
      { firebaseUid: uid },
      { $set: { avatar } },
      { new: true },
    );
    res.json({ success: true, avatar: user.avatar });
  } catch {
    res.status(500).json({ message: "Failed to update avatar" });
  }
};

// PATCH /me/cover - Change cover photo
export const updateCoverPhoto = async (req, res) => {
  try {
    const uid = req.user.uid;
    const { coverPhoto } = req.body;
    if (!coverPhoto)
      return res.status(400).json({ message: "No cover photo provided" });
    const user = await User.findOneAndUpdate(
      { firebaseUid: uid },
      { $set: { coverPhoto } },
      { new: true },
    );
    res.json({ success: true, coverPhoto: user.coverPhoto });
  } catch {
    res.status(500).json({ message: "Failed to update cover photo" });
  }
};

// PATCH /me/preferences - Update user preferences
export const updatePreferences = async (req, res) => {
  try {
    const uid = req.user.uid;
    const { preferences } = req.body;
    if (!preferences)
      return res.status(400).json({ message: "No preferences provided" });
    const user = await User.findOneAndUpdate(
      { firebaseUid: uid },
      { $set: { preferences } },
      { new: true },
    );
    res.json({ success: true, preferences: user.preferences });
  } catch {
    res.status(500).json({ message: "Failed to update preferences" });
  }
};

// GET /me/bookmarks - Get user's bookmarks
export const getBookmarks = async (req, res) => {
  try {
    const uid = req.user.uid;
    const user = await User.findOne({ firebaseUid: uid }).populate({
      path: "bookmarkedManga.mangaId",
      select: "title coverImage slug",
    });
    res.json({ success: true, bookmarks: user.bookmarkedManga });
  } catch {
    res.status(500).json({ message: "Failed to load bookmarks" });
  }
};

// GET /me/reading-list - Get user's reading list
export const getReadingList = async (req, res) => {
  try {
    const uid = req.user.uid;
    const user = await User.findOne({ firebaseUid: uid }).populate({
      path: "readingList.chapterId",
      select: "title number mangaId",
    });
    res.json({ success: true, readingList: user.readingList });
  } catch {
    res.status(500).json({ message: "Failed to load reading list" });
  }
};

// POST /follow/:userId - Follow another user
export const followUser = async (req, res) => {
  try {
    const uid = req.user.uid;
    const { userId } = req.params;
    if (uid === userId)
      return res.status(400).json({ message: "Cannot follow yourself" });
    const user = await User.findOne({ firebaseUid: uid });
    const target = await User.findById(userId);
    if (!target) return res.status(404).json({ message: "User not found" });
    // Add to following/followers if not already
    if (!user.following.some((f) => f.userId.equals(target._id))) {
      user.following.push({ userId: target._id });
      await user.save();
    }
    if (!target.followers.some((f) => f.userId.equals(user._id))) {
      target.followers.push({ userId: user._id });
      await target.save();
    }
    res.json({ success: true });
  } catch {
    res.status(500).json({ message: "Failed to follow user" });
  }
};

// POST /unfollow/:userId - Unfollow another user
export const unfollowUser = async (req, res) => {
  try {
    const uid = req.user.uid;
    const { userId } = req.params;
    const user = await User.findOne({ firebaseUid: uid });
    const target = await User.findById(userId);
    if (!target) return res.status(404).json({ message: "User not found" });
    user.following = user.following.filter((f) => !f.userId.equals(target._id));
    target.followers = target.followers.filter(
      (f) => !f.userId.equals(user._id),
    );
    await user.save();
    await target.save();
    res.json({ success: true });
  } catch {
    res.status(500).json({ message: "Failed to unfollow user" });
  }
};

// GET /me/activity - Get user's recent activity (reads, purchases)
export const getActivity = async (req, res) => {
  try {
    const uid = req.user.uid;
    const user = await User.findOne({ firebaseUid: uid });
    res.json({
      success: true,
      chaptersRead: user.chaptersRead,
      chaptersPurchased: user.chaptersPurchased,
      mangaTitlesPurchased: user.mangaTitlesPurchased,
    });
  } catch {
    res.status(500).json({ message: "Failed to load activity" });
  }
};

// PATCH /admin/ban/:userId - Admin: Ban a user
export const banUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { reason, banExpiresAt } = req.body;
    const user = await User.findByIdAndUpdate(
      userId,
      { isBanned: true, banReason: reason, banExpiresAt },
      { new: true },
    );
    res.json({ success: true, user });
  } catch {
    res.status(500).json({ message: "Failed to ban user" });
  }
};

// PATCH /admin/unban/:userId - Admin: Unban a user
export const unbanUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findByIdAndUpdate(
      userId,
      { isBanned: false, banReason: null, banExpiresAt: null },
      { new: true },
    );
    res.json({ success: true, user });
  } catch {
    res.status(500).json({ message: "Failed to unban user" });
  }
};
