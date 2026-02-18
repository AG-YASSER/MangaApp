// ============ CLEAN USER MODEL ============
import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    // ============ AUTHENTICATION (FROM FIREBASE) ============
    firebaseUid: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    emailVerified: {
      type: Boolean,
      default: false,
    },

    // ============ PROFILE (USER PROVIDED) ============
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      minlength: 3,
      maxlength: 30,
    },
    displayName: {
      type: String,
      trim: true,
      maxlength: 50,
    },
    bio: {
      type: String,
      maxlength: 500,
      default: "",
    },
    avatar: {
      type: String,
      default: "default-avatar.png",
    },
    coverPhoto: {
      type: String,
      default: "default-cover.jpg",
    },

    // ============ ACCOUNT STATUS ============
    role: {
      type: String,
      enum: ["user", "mod", "admin", "banned"],
      default: "user",
    },
    isBanned: {
      type: Boolean,
      default: false,
    },
    banReason: {
      type: String,
      default: null,
    },
    banExpiresAt: {
      type: Date,
      default: null,
    },

    // ============ APP SPECIFIC DATA ============
    tokensBalance: {
      type: Number,
      default: 0,
      min: 0,
    },

    // ============ USER PREFERENCES ============
    preferences: {
      language: { type: String, default: "en" },
      theme: {
        type: String,
        enum: ["light", "dark", "system"],
        default: "dark",
      },
      readingDirection: { type: String, enum: ["ltr", "rtl"], default: "ltr" },
    },

    // ============ PRIVACY SETTINGS ============
    profileVisibility: {
      type: String,
      enum: ["public", "private"],
      default: "public"
    },
    showBookmarks: {
      type: Boolean,
      default: false
    },
    showReadingHistory: {
      type: Boolean,
      default: false
    },

    // ============ DELETION FIELDS ============
    deleteRequestedAt: {
      type: Date,
      default: null,
    },
    deleteScheduledFor: {
      type: Date,
      default: null,
    },
    deleteVerificationCode: {
      type: String,
      default: null,
    },
    deleteVerificationExpires: {
      type: Date,
      default: null,
    },
    deleteVerified: {
      type: Boolean,
      default: false,
    },
    isLocked: {
      type: Boolean,
      default: false,
    },

    // ============ REVIEWS/RATINGS ============
    totalReviews: { type: Number, default: 0 },
    averageRating: { type: Number, min: 0, max: 5, default: 0 },

    // ============ SECURITY ============
    lastLogin: { type: Date, default: Date.now },
    lastActive: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
  }
);

// ============ METHODS ============

// Check if user is banned
userSchema.methods.isBannedActive = function () {
  if (!this.isBanned) return false;
  if (!this.banExpiresAt) return true;
  return this.banExpiresAt > new Date();
};

// Token methods
userSchema.methods.addTokens = function (amount) {
  this.tokensBalance += amount;
  return this.save();
};

userSchema.methods.deductTokens = function (amount) {
  if (this.tokensBalance < amount) {
    throw new Error("Insufficient tokens");
  }
  this.tokensBalance -= amount;
  return this.save();
};

// ============ VIRTUALS ============

userSchema.virtual("fullName").get(function () {
  return this.displayName || this.username;
});

userSchema.virtual("accountAge").get(function () {
  return Math.floor((Date.now() - this.createdAt) / (1000 * 60 * 60 * 24));
});

// ============ STATICS ============

userSchema.statics.findByEmail = function (email) {
  return this.findOne({ email });
};

const User = mongoose.model("User", userSchema);
export default User;