import mongoose from "mongoose";

const ratingSchema = new mongoose.Schema(
  {
    // WHO gave the rating
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // WHAT are they rating?
    // For now: manga, but later you might rate chapters too
    mangaId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Manga",
      required: true,
      index: true,
    },

    chapterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Chapter",
      default: null,
    },

    // THE RATING VALUE (1-5 stars)
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },

    // OPTIONAL: User can write a review along with rating
    review: {
      type: String,
      maxlength: 500,
      default: "",
    },

    // IMPORTANT: One user = ONE rating per manga
    // We use a UNIQUE compound index to prevent duplicate ratings
    // If user rates again, we UPDATE, not INSERT
    // This gets enforced in the controller logic
  },
  { timestamps: true },
);

// COMPOUND UNIQUE INDEX
// Prevents same user from rating same manga multiple times
// If user tries to rate again, database rejects OR we handle the update
ratingSchema.index({ userId: 1, mangaId: 1 }, { unique: true });

// Common static and instance methods
ratingSchema.statics.findByManga = function (mangaId) {
  return this.find({ mangaId });
};

ratingSchema.methods.updateRating = function (newRating, review = "") {
  this.rating = newRating;
  if (review) this.review = review;
  return this.save();
};

const Rating = mongoose.model("Rating", ratingSchema);
export default Rating;
