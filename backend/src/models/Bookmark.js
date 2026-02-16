import mongoose from "mongoose";

const bookmarkSchema = new mongoose.Schema(
  {
    // WHO bookmarked
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // WHAT they bookmarked (manga, chapter, or specific scene)
    mangaId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Manga",
      required: true,
    },

    chapterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Chapter",
      default: null, // If null: bookmarked whole manga. If set: bookmarked specific chapter
    },

    // OPTIONAL: Save a page number / section for quick jump
    // E.g., user bookmarks page 45 of a chapter
    pageNumber: {
      type: Number,
      default: null,
    },

    // A LABEL/FOLDER system
    // User can organize bookmarks: "To Read", "Favorites", "Reading"
    collection: {
      type: String,
      enum: ["to-read", "reading", "completed", "favorites", "dropped"],
      default: "to-read",
    },

    // PREVENT DUPLICATES
    // One user can't bookmark same manga twice in same collection
  },
  { timestamps: true },
);

// Unique index: same user can't bookmark same manga twice in same collection
bookmarkSchema.index(
  { userId: 1, mangaId: 1, collection: 1 },
  { unique: true },
);

// Common static and instance methods
bookmarkSchema.statics.findByUser = function (userId) {
  return this.find({ userId });
};

bookmarkSchema.methods.isForManga = function (mangaId) {
  return this.mangaId.equals(mangaId);
};

const Bookmark = mongoose.model("Bookmark", bookmarkSchema);
export default Bookmark;
