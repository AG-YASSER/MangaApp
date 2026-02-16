import mongoose from "mongoose";

const readingHistorySchema = new mongoose.Schema(
  {
    // WHO read it
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // WHAT they read
    mangaId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Manga",
      required: true,
      index: true,
    },

    chapterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Chapter",
      required: true,
      index: true,
    },

    // HOW FAR DID THEY GET
    // This helps with "continue reading" feature
    pageNumber: {
      type: Number,
      default: 1,
    },

    // PROGRESS: What % of chapter did they read? (0-100)
    // Useful for: "Resume from 45%"
    percentageRead: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },

    // TIME SPENT reading (in seconds)
    // Useful for: "You spent 30 mins on this chapter"
    timeSpent: {
      type: Number,
      default: 0,
    },

    // WAS IT COMPLETED?
    isCompleted: {
      type: Boolean,
      default: false,
    },

    // WHEN DID THEY FINISH?
    completedAt: {
      type: Date,
      default: null,
    },

    // IMPORTANT NOTE:
    // createdAt = first time they opened chapter
    // updatedAt = last time they read it (AUTO-updated by mongoose)
    // This is how you sort "recently read"
  },
  { timestamps: true },
);

// Index for fast queries like "Get reading history for user, newest first"
readingHistorySchema.index({ userId: 1, updatedAt: -1 });

// Common static and instance methods
readingHistorySchema.statics.findByUser = function (userId) {
  return this.find({ userId });
};

readingHistorySchema.methods.markCompleted = function () {
  this.isCompleted = true;
  this.completedAt = new Date();
  return this.save();
};

const ReadingHistory = mongoose.model("ReadingHistory", readingHistorySchema);
export default ReadingHistory;
