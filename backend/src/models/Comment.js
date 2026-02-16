import mongoose from "mongoose";

const commentSchema = new mongoose.Schema(
  {
    // WHO wrote the comment (reference to User document)
    // ref: 'User' means this field links to the User model
    // When you query, you can use .populate('userId') to get full user details
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true, // Add index for faster queries (finding comments by user)
    },

    // WHAT are they commenting on?
    // Keep it flexible: could be mangaId or chapterId
    // We store BOTH so we know if comment is on the whole manga or specific chapter
    mangaId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Manga",
      required: true,
      index: true, // Index for fast queries: "get all comments for this manga"
    },

    chapterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Chapter", // Assuming you'll create Chapter model later
      default: null, // null = commenting on whole manga
    },

    // THE ACTUAL COMMENT TEXT
    text: {
      type: String,
      required: true,
      minlength: 1,
      maxlength: 1000, // Prevent spam with huge comments
      trim: true, // Remove extra whitespace
    },

    // NESTED REPLIES (comments within comments)
    // replies is an array of reply objects
    // Each reply has same structure: { userId, text, createdAt }
    replies: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        text: {
          type: String,
          maxlength: 500,
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],

    // SPAM CONTROL: Track if comment got reported
    isReported: {
      type: Boolean,
      default: false,
    },

    reportCount: {
      type: Number,
      default: 0,
    },

    // FOR MODERATION: Admin can delete/hide inappropriate comments
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }, // Adds createdAt & updatedAt automatically
);

// Common static and instance methods
commentSchema.statics.findByManga = function (mangaId) {
  return this.find({ mangaId });
};

commentSchema.methods.addReply = function (reply) {
  this.replies.push(reply);
  return this.save();
};

const Comment = mongoose.model("Comment", commentSchema);
export default Comment;
