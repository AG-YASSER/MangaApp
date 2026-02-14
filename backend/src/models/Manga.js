import mongoose from "mongoose";
const mangaSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, unique: true },
    slug: { type: String, required: true, unique: true },
    description: { type: String, default: "" },
    coverImage: { type: String, required: true, default: "default-avatar.png" },
    author: { type: String, trim: true, maxlength: 50 },
    artist: { type: String, trim: true, maxlength: 50 },
    genres: { type: [String], default: [] },
    status: {
      type: String,
      enum: ["ongoing", "completed", "hiatus"],
      default: "ongoing",
    },
    views: { type: Number, default: 0 },
    rating: { type: Number, default: 0 },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true },
);

const Manga = mongoose.model("Manga", mangaSchema);
export default Manga;
