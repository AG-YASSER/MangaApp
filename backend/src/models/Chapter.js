import mongoose from "mongoose";

const chapterSchema = new mongoose.Schema(
  {
    mangaId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Manga",
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    number: {
      type: Number,
      required: true,
      index: true,
    },
    pages: {
      type: [String], // Array of image URLs or file paths
      required: true,
      default: [],
    },
    isPremium: {
      type: Boolean,
      default: false,
    },
    releaseDate: {
      type: Date,
      default: Date.now,
    },
    views: {
      type: Number,
      default: 0,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true },
);

// Static: Find all chapters for a manga, sorted by number
chapterSchema.statics.findByManga = function (mangaId) {
  return this.find({ mangaId }).sort({ number: 1 });
};

// Instance: Increment views
chapterSchema.methods.incrementViews = function () {
  this.views += 1;
  return this.save();
};

// Instance: Add a page
chapterSchema.methods.addPage = function (pageUrl) {
  this.pages.push(pageUrl);
  return this.save();
};

// Instance: Remove a page by index
chapterSchema.methods.removePage = function (index) {
  if (index >= 0 && index < this.pages.length) {
    this.pages.splice(index, 1);
    return this.save();
  }
  throw new Error("Invalid page index");
};

const Chapter = mongoose.model("Chapter", chapterSchema);
export default Chapter;
