// ============ FULL USER MODEL ============
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

    // ============
    isAdFree: { type: Boolean, default: false },
    adFreeExpiresAt: { type: Date },

    // ============ ACCOUNT STATUS ============
    role: {
      type: String,
      enum: ["user", "mod", "admin", "banned"],
      default: "user",
    },
    isActive: {
      type: Boolean,
      default: true,
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

    // ============ WALLET & SUBSCRIPTION ============
    wallet: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Wallet",
      default: null,
    },
    subscription: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subscription",
      default: null,
    },

    // ============ NOTIFICATIONS ============
    notifications: [
      { type: mongoose.Schema.Types.ObjectId, ref: "Notification" },
    ],

    // ============ APP SPECIFIC DATA ============
    tokensBalance: {
      type: Number,
      default: 0,
      min: 0,
    },
    tokensSpent: {
      type: Number,
      default: 0,
      min: 0,
    },
    tokensEarned: {
      type: Number,
      default: 0,
      min: 0,
    },

    // ============ USER ACTIVITY ============
    chaptersRead: [
      {
        chapterId: { type: mongoose.Schema.Types.ObjectId, ref: "Chapter" },
        readAt: { type: Date, default: Date.now },
        mangaId: { type: mongoose.Schema.Types.ObjectId, ref: "Manga" },
      },
    ],
    chaptersPurchased: [
      {
        chapterId: { type: mongoose.Schema.Types.ObjectId, ref: "Chapter" },
        purchasedAt: { type: Date, default: Date.now },
        price: Number,
        mangaId: { type: mongoose.Schema.Types.ObjectId, ref: "Manga" },
      },
    ],
    mangaTitlesPurchased: [
      {
        mangaId: { type: mongoose.Schema.Types.ObjectId, ref: "Manga" },
        purchasedAt: { type: Date, default: Date.now },
        price: Number,
      },
    ],

    // ============ USER PREFERENCES ============
    preferences: {
      language: { type: String, default: "en" },
      theme: {
        type: String,
        enum: ["light", "dark", "system"],
        default: "dark",
      },
      notifications: {
        email: { type: Boolean, default: true },
        push: { type: Boolean, default: true },
        newChapters: { type: Boolean, default: true },
        promotions: { type: Boolean, default: false },
      },
      readingDirection: { type: String, enum: ["ltr", "rtl"], default: "ltr" },
      autoplay: { type: Boolean, default: false },
    },

    // ============ BOOKMARKS/FOLLOWING ============
    bookmarkedManga: [
      {
        mangaId: { type: mongoose.Schema.Types.ObjectId, ref: "Manga" },
        addedAt: { type: Date, default: Date.now },
        lastReadChapter: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Chapter",
        },
      },
    ],
    readingList: [
      {
        chapterId: { type: mongoose.Schema.Types.ObjectId, ref: "Chapter" },
        addedAt: { type: Date, default: Date.now },
        note: String,
      },
    ],

    // ============ SOCIAL ============
    followers: [
      {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        followedAt: { type: Date, default: Date.now },
      },
    ],
    following: [
      {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        followedAt: { type: Date, default: Date.now },
      },
    ],

    // ============ REVIEWS/RATINGS ============
    totalReviews: { type: Number, default: 0 },
    averageRating: { type: Number, min: 0, max: 5, default: 0 },

    // ============ SECURITY ============
    lastLogin: { type: Date, default: Date.now },
    lastActive: { type: Date, default: Date.now },
    loginHistory: [
      {
        timestamp: { type: Date, default: Date.now },
        ipAddress: String,
        userAgent: String,
        device: String,
      },
    ],
  },
  {
    timestamps: true, // Automatically manages createdAt/updatedAt
  },
);

// ============ METHODS & VIRTUALS (OPTIONAL) ============
// You can add custom methods and virtuals here as needed
// ============ METHODS ============
// Instance method: Check if user is currently banned
userSchema.methods.isBannedActive = function () {
  if (!this.isBanned) return false;
  if (!this.banExpiresAt) return true;
  return this.banExpiresAt > new Date();
};

// Instance method: Add tokens to user
userSchema.methods.addTokens = function (amount) {
  this.tokensBalance += amount;
  this.tokensEarned += amount > 0 ? amount : 0;
  return this.save();
};

// Instance method: Deduct tokens from user
userSchema.methods.deductTokens = function (amount) {
  if (this.tokensBalance < amount) {
    throw new Error("Insufficient tokens");
  }
  this.tokensBalance -= amount;
  this.tokensSpent += amount;
  return this.save();
};

// Instance method: Purchase a chapter
userSchema.methods.purchaseChapter = function (chapterId, mangaId, price) {
  if (this.tokensBalance < price) {
    throw new Error("Insufficient tokens");
  }
  this.tokensBalance -= price;
  this.tokensSpent += price;
  this.chaptersPurchased.push({ chapterId, mangaId, price });
  return this.save();
};

// Instance method: Mark chapter as read
userSchema.methods.readChapter = function (chapterId, mangaId) {
  this.chaptersRead.push({ chapterId, mangaId });
  this.lastActive = new Date();
  return this.save();
};

// Instance method: Bookmark a manga
userSchema.methods.bookmarkManga = function (mangaId) {
  const exists = this.bookmarkedManga.find(
    (b) => b.mangaId.toString() === mangaId.toString(),
  );
  if (!exists) {
    this.bookmarkedManga.push({ mangaId });
  }
  return this.save();
};

// Instance method: Buy all premium chapters in a manga at once
userSchema.methods.buyAllPremiumChapters = async function (
  mangaId,
  chapterIds,
  totalPrice,
) {
  if (this.tokensBalance < totalPrice) {
    throw new Error("Insufficient tokens");
  }
  this.tokensBalance -= totalPrice;
  this.tokensSpent += totalPrice;
  // Add each chapter to chaptersPurchased if not already purchased
  chapterIds.forEach((chapterId) => {
    const alreadyBought = this.chaptersPurchased.some(
      (c) => c.chapterId.toString() === chapterId.toString(),
    );
    if (!alreadyBought) {
      this.chaptersPurchased.push({ chapterId, mangaId });
    }
  });
  // Optionally, add a record to mangaTitlesPurchased
  const alreadyBoughtManga = this.mangaTitlesPurchased.some(
    (m) => m.mangaId.toString() === mangaId.toString(),
  );
  if (!alreadyBoughtManga) {
    this.mangaTitlesPurchased.push({ mangaId, price: totalPrice });
  }
  return this.save();
};
// ============ VIRTUALS ============
// Virtual: Get user's full display name
userSchema.virtual("fullName").get(function () {
  return this.displayName || this.username;
});

// Virtual: Get account age in days
userSchema.virtual("accountAge").get(function () {
  return Math.floor((Date.now() - this.createdAt) / (1000 * 60 * 60 * 24));
});
// ============ STATICS ============
// Static: Find all admins
userSchema.statics.findAdmins = function () {
  return this.find({ role: "admin" });
};

// Static: Find all banned users
userSchema.statics.findBanned = function () {
  return this.find({ isBanned: true });
};

// Static: Find user by email
userSchema.statics.findByEmail = function (email) {
  return this.findOne({ email });
};

// Static: Count active users
userSchema.statics.countActiveUsers = function () {
  return this.countDocuments({ isActive: true });
};

const User = mongoose.model("User", userSchema);
export default User;
