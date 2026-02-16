import mongoose from "mongoose";
import User from "../models/User.js";
import Manga from "../models/Manga.js";
import Chapter from "../models/Chapter.js";
import DeleteRequest from "../models/DeleteRequest.js";

// GET all mods
export const getAllMods = async (req, res) => {
  try {
    const mods = await User.find({ role: "mod" }).select(
      "username email displayName avatar",
    );
    res.json({ success: true, mods });
  } catch {
    res.status(500).json({ message: "Failed to load mods" });
  }
};

// MOD requests to delete manga/chapter (admin approval required)
// Creates a DeleteRequest document for admin review
// Prevents duplicate pending requests for the same item by the same mod
export const requestDelete = async (req, res) => {
  try {
    const { type, targetId, reason } = req.body; // type: 'manga' or 'chapter'

    // Get the user's MongoDB ObjectId using their Firebase UID
    const user = await User.findOne({ firebaseUid: req.user.uid });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check for existing pending request
    const exists = await DeleteRequest.findOne({
      requester: user._id,
      type,
      targetId,
      status: "pending",
    });
    if (exists) {
      return res
        .status(400)
        .json({ message: "You already have a pending request for this item." });
    }
    // Create the request
    const request = await DeleteRequest.create({
      requester: user._id,
      type,
      targetId,
      reason,
    });
    // (Optional) Notify admins here
    res.json({
      success: true,
      message: "Delete request sent to admins",
      request,
    });
  } catch (error) {
    console.log("DELETE REQUEST ERROR:", error);
    res.status(500).json({
      message: "Failed to send delete request",
      error: error.message,
    });
  }
};

// GET all manga/chapters by a mod
export const getModContent = async (req, res) => {
  try {
    const { modId } = req.params;
    const manga = await Manga.find({ createdBy: modId });
    const chapters = await Chapter.find({ createdBy: modId });
    res.json({ success: true, manga, chapters });
  } catch {
    res.status(500).json({ message: "Failed to load mod content" });
  }
};

// GET all delete requests by this mod (history)
// Returns all delete requests submitted by the logged-in mod
export const getMyDeleteRequests = async (req, res) => {
  try {
    // Get the user's MongoDB ObjectId using their Firebase UID
    const user = await User.findOne({ firebaseUid: req.user.uid });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const requests = await DeleteRequest.find({ requester: user._id });
    res.json({ success: true, requests });
  } catch {
    res.status(500).json({ message: "Failed to load your delete requests" });
  }
};

// MOD dashboard: stats (manga count, chapter count, views, etc.)
export const getModStats = async (req, res) => {
  try {
    const { modId } = req.params;
    const mangaCount = await Manga.countDocuments({ createdBy: modId });
    const chapterCount = await Chapter.countDocuments({ createdBy: modId });
    const totalViews =
      (
        await Manga.aggregate([
          { $match: { createdBy: new mongoose.Types.ObjectId(modId) } },
          { $group: { _id: null, views: { $sum: "$views" } } },
        ])
      )[0]?.views || 0;
    res.json({ success: true, mangaCount, chapterCount, totalViews });
  } catch (error) {
    console.log("Error is :", error);
    res.status(500).json({ message: "Failed to load mod stats" });
  }
};
