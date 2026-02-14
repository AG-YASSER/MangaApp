import User from "../models/User.js";
import admin from "../config/firebase.js";

// ✅ GET /me
export const getMe = async (req, res) => {
  try {
    const user = await User.findOne({ firebaseUid: req.user.uid })
      .select("email username avatar role tokensBalance");

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

    const allowedUpdates = ["username","displayName", "avatar"];
    const updates = {};

    for (let key of allowedUpdates) {
      if (req.body[key]) updates[key] = req.body[key];
    }

    const user = await User.findOneAndUpdate(
      { firebaseUid: uid },
      { $set: updates },
      { new: true }
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
