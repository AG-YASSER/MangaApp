import mongoose from "mongoose";

// This model stores requests from mods to delete manga or chapters.
const deleteRequestSchema = new mongoose.Schema(
  {
    requester: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    type: {
      type: String,
      enum: ["manga", "chapter"],
      required: true,
    },
    targetId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    reason: {
      type: String,
      required: true,
      maxlength: 500,
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // Admin who reviewed
      default: null,
    },
    reviewedAt: {
      type: Date,
      default: null,
    },
    response: {
      type: String,
      default: "",
    },
  },
  { timestamps: true },
);

const DeleteRequest = mongoose.model("DeleteRequest", deleteRequestSchema);
export default DeleteRequest;
