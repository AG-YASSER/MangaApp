/* import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  // ============ AUTHENTICATION (FROM FIREBASE) ============
  firebaseUid: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  // WHY: Links your MongoDB user to Firebase Auth
  // HOW: You get this from Firebase after login/register
  // USE: "Find the MongoDB profile for this Firebase UID"

  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  // WHY: Primary identifier, used for login
  // FROM: Firebase provides this
  
  emailVerified: {
    type: Boolean,
    default: false
  },
  // WHY: Know if user confirmed their email
  // FROM: Firebase can verify this
  
  // ============ PROFILE (USER PROVIDED) ============
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3,
    maxlength: 30
  },
  // WHY: Public display name, unique for URLs/profile pages
  // NOTE: Separate from email, user chooses this
  
  displayName: {
    type: String,
    trim: true,
    maxlength: 50
  },
  // WHY: Full name (optional), shown in comments/profile
  
  bio: {
    type: String,
    maxlength: 500,
    default: ''
  },
  // WHY: Short description about user
  
  avatar: {
    type: String,
    default: 'default-avatar.png'
  },
  // WHY: Profile picture
  // CAN BE: URL string or just filename
  
  coverPhoto: {
    type: String,
    default: 'default-cover.jpg'
  },
  // WHY: Profile banner/background
  
  // ============ ACCOUNT STATUS ============
  role: {
    type: String,
    enum: ['user', 'mod', 'admin', 'banned'],
    default: 'user'
  },
  // WHY: Permissions control
  // 'user' = normal, 'mod' = moderate content, 'admin' = full control
  
  isActive: {
    type: Boolean,
    default: true
  },
  // WHY: Soft delete - user can deactivate account
  // TRUE = account active, FALSE = account deactivated
  
  isBanned: {
    type: Boolean,
    default: false
  },
  
  banReason: {
    type: String,
    default: null
  },
  
  banExpiresAt: {
    type: Date,
    default: null
  },
  // WHY: Temporary bans with expiration
  
  // ============ APP SPECIFIC DATA ============
  tokensBalance: {
    type: Number,
    default: 0,
    min: 0
  },
  // WHY: Virtual currency for purchases
  
  tokensSpent: {
    type: Number,
    default: 0,
    min: 0
  },
  // WHY: Track lifetime spending
  
  tokensEarned: {
    type: Number,
    default: 0,
    min: 0
  },
  // WHY: Track how user acquired tokens
  
  // ============ USER ACTIVITY ============
  chaptersRead: [{
    chapterId: { type: mongoose.Schema.Types.ObjectId, ref: 'Chapter' },
    readAt: { type: Date, default: Date.now },
    mangaId: { type: mongoose.Schema.Types.ObjectId, ref: 'Manga' }
  }],
  // WHY: Track reading history, know where user left off
  
  chaptersPurchased: [{
    chapterId: { type: mongoose.Schema.Types.ObjectId, ref: 'Chapter' },
    purchasedAt: { type: Date, default: Date.now },
    price: Number,
    mangaId: { type: mongoose.Schema.Types.ObjectId, ref: 'Manga' }
  }],
  // WHY: Track purchased content
  
  mangaTitlesPurchased: [{
    mangaId: { type: mongoose.Schema.Types.ObjectId, ref: 'Manga' },
    purchasedAt: { type: Date, default: Date.now },
    price: Number
  }],
  // WHY: Track full manga purchases
  
  // ============ USER PREFERENCES ============
  preferences: {
    language: { type: String, default: 'en' },
    theme: { type: String, enum: ['light', 'dark', 'system'], default: 'dark' },
    notifications: {
      email: { type: Boolean, default: true },
      push: { type: Boolean, default: true },
      newChapters: { type: Boolean, default: true },
      promotions: { type: Boolean, default: false }
    },
    readingDirection: { type: String, enum: ['ltr', 'rtl'], default: 'ltr' },
    autoplay: { type: Boolean, default: false }
  },
  // WHY: User customization
  
  // ============ BOOKMARKS/FOLLOWING ============
  bookmarkedManga: [{
    mangaId: { type: mongoose.Schema.Types.ObjectId, ref: 'Manga' },
    addedAt: { type: Date, default: Date.now },
    lastReadChapter: { type: mongoose.Schema.Types.ObjectId, ref: 'Chapter' }
  }],
  // WHY: Track followed series
  
  readingList: [{
    chapterId: { type: mongoose.Schema.Types.ObjectId, ref: 'Chapter' },
    addedAt: { type: Date, default: Date.now },
    note: String
  }],
  // WHY: Save for later
  
  // ============ SOCIAL ============
  followers: [{
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    followedAt: { type: Date, default: Date.now }
  }],
  
  following: [{
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    followedAt: { type: Date, default: Date.now }
  }],
  // WHY: Social features
  
  // ============ REVIEWS/RATINGS ============
  totalReviews: {
    type: Number,
    default: 0
  },
  
  averageRating: {
    type: Number,
    min: 0,
    max: 5,
    default: 0
  },
  // WHY: User reputation/activity score
  
  // ============ SECURITY ============
  lastLogin: {
    type: Date,
    default: Date.now
  },
  
  lastActive: {
    type: Date,
    default: Date.now
  },
  
  loginHistory: [{
    timestamp: { type: Date, default: Date.now },
    ipAddress: String,
    userAgent: String,
    device: String
  }],
  // WHY: Security monitoring, show user their login history
  
  // ============ TIMESTAMPS ============
  createdAt: {
    type: Date,
    default: Date.now
  },
  
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true // Automatically manages createdAt/updatedAt
});

// ============ INDEXES ============
userSchema.index({ firebaseUid: 1 });        // Fast lookup by Firebase ID
userSchema.index({ email: 1 });              // Fast login by email
userSchema.index({ username: 1 });           // Fast profile lookup
userSchema.index({ role: 1 });               // Filter by role
userSchema.index({ createdAt: -1 });         // Sort by join date
userSchema.index({ tokensBalance: -1 });     // Find top users by tokens
userSchema.index({ isBanned: 1 });           // Find banned users

// ============ METHODS ============
userSchema.methods.addTokens = function(amount, reason) {
  this.tokensBalance += amount;
  this.tokensEarned += amount > 0 ? amount : 0;
  return this.save();
};

userSchema.methods.deductTokens = function(amount, reason) {
  if (this.tokensBalance < amount) {
    throw new Error('Insufficient tokens');
  }
  this.tokensBalance -= amount;
  this.tokensSpent += amount;
  return this.save();
};

userSchema.methods.purchaseChapter = function(chapterId, mangaId, price) {
  if (this.tokensBalance < price) {
    throw new Error('Insufficient tokens');
  }
  
  this.tokensBalance -= price;
  this.tokensSpent += price;
  this.chaptersPurchased.push({ chapterId, mangaId, price });
  this.chaptersPurchasedCount = this.chaptersPurchased.length;
  
  return this.save();
};

userSchema.methods.readChapter = function(chapterId, mangaId) {
  this.chaptersRead.push({ chapterId, mangaId });
  this.chaptersReadCount = this.chaptersRead.length;
  this.lastActive = new Date();
  return this.save();
};

userSchema.methods.bookmarkManga = function(mangaId) {
  const exists = this.bookmarkedManga.find(b => b.mangaId.toString() === mangaId.toString());
  if (!exists) {
    this.bookmarkedManga.push({ mangaId });
  }
  return this.save();
};

userSchema.methods.isBannedActive = function() {
  if (!this.isBanned) return false;
  if (!this.banExpiresAt) return true;
  return this.banExpiresAt > new Date();
};

// ============ VIRTUALS ============
userSchema.virtual('profileComplete').get(function() {
  return !!this.username && !!this.avatar && this.username !== this.email.split('@')[0];
});

userSchema.virtual('accountAge').get(function() {
  return Math.floor((Date.now() - this.createdAt) / (1000 * 60 * 60 * 24));
});

const User = mongoose.model('User', userSchema);
export default User; */


import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  firebaseUid: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  emailVerified: { type: Boolean, default: false },
  username: { type: String, required: true, unique: true },
  displayName: { type: String, trim: true, maxlength: 50 },
  avatar: { type: String, default: 'default-avatar.png' },
  role: { type: String, enum: ['user', 'mod', 'admin'], default: 'user' },
  isBanned: { type: Boolean, default: false },
  tokensBalance: { type: Number, default: 0 },
  lastLogin: { type: Date, default: Date.now }
}, { timestamps: true });

const User = mongoose.model('User', userSchema);
export default User;