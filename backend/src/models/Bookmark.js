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
    pageNumber: {
      type: Number,
      default: null,
    },

    // USER ORGANIZATION CATEGORY
    category: {
      type: String,
      enum: ["to-read", "reading", "completed", "favorites", "dropped"],
      default: "to-read",
    },
  },
  { timestamps: true }
);

// Prevent duplicates:
// One user can't bookmark same manga twice in same category
bookmarkSchema.index(
  { userId: 1, mangaId: 1, category: 1 },
  { unique: true }
);

// Static methods
bookmarkSchema.statics.findByUser = function (userId) {
  return this.find({ userId });
};

// Instance methods
bookmarkSchema.methods.isForManga = function (mangaId) {
  return this.mangaId.equals(mangaId);
};

const Bookmark = mongoose.model("Bookmark", bookmarkSchema);
export default Bookmark;
