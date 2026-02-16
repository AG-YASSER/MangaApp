import mongoose from "mongoose";

const mangaSchema = new mongoose.Schema(
  {
    // ============ BASIC INFORMATION ============
    title: { 
      type: String, 
      required: true, 
      unique: true,
      trim: true,
      maxlength: 200
    },
    
    // URL-friendly version of title (e.g., "one-piece" from "One Piece")
    slug: { 
      type: String, 
      required: true, 
      unique: true,
      lowercase: true,
      trim: true
    },
    
    // Full description/synopsis of the manga
    description: { 
      type: String, 
      default: "",
      maxlength: 5000
    },
    
    // Short summary for cards/previews
    summary: {
      type: String,
      default: "",
      maxlength: 300
    },
    
    // Main cover image URL/path
    coverImage: { 
      type: String, 
      required: true, 
      default: "default-avatar.png" 
    },
    
    // Additional images (banner, thumbnails, etc.)
    images: {
      banner: { type: String, default: "" },
      thumbnail: { type: String, default: "" },
      gallery: [{ type: String }] // Array of additional images
    },
    
    // ============ CREATIVE TEAM ============
    // Multiple authors (writers/creators)
    author: [{ 
      type: String, 
      trim: true, 
      maxlength: 50 
    }],
    
    // Multiple artists (illustrators)
    artist: [{ 
      type: String, 
      trim: true, 
      maxlength: 50 
    }],
    
    // Publisher/licensor information
    publisher: {
      type: String,
      trim: true,
      default: ""
    },
    
    // Year of original release
    yearReleased: {
      type: Number,
      min: 1900,
      max: new Date().getFullYear()
    },
    
    // ============ CLASSIFICATION ============
    // Genres/tags for categorization
    genres: [{ 
      type: String,
      enum: [
        "action", "adventure", "comedy", "drama", "fantasy", "horror",
        "mystery", "romance", "sci-fi", "slice of life", "sports",
        "supernatural", "thriller", "psychological", "historical",
        "mecha", "music", "shoujo", "shounen", "seinen", "josei",
        "isekai", "game", "harem", "ecchi", "martial arts", "school"
      ]
    }],
    
    // Content rating (age appropriateness)
    contentRating: {
      type: String,
      enum: ["all_ages", "teen", "mature", "adult"],
      default: "all_ages"
    },
    
    // ============ SERIALIZATION STATUS ============
    status: {
      type: String,
      enum: ["ongoing", "completed", "hiatus", "cancelled"],
      default: "ongoing",
    },
    
    // Alternative status for release schedule
    releaseSchedule: {
      type: String,
      enum: ["weekly", "biweekly", "monthly", "irregular", "unknown"],
      default: "unknown"
    },
    
    // Date when serialization started
    serializationStart: {
      type: Date
    },
    
    // Date when serialization ended (if completed)
    serializationEnd: {
      type: Date
    },
    
    // ============ STATISTICS ============
    // Total number of views
    views: { 
      type: Number, 
      default: 0,
      min: 0
    },
    
    // Daily/Weekly/Monthly views for trending
    viewsDaily: { type: Number, default: 0 },
    viewsWeekly: { type: Number, default: 0 },
    viewsMonthly: { type: Number, default: 0 },
    
    // Current average rating (1-5)
    rating: { 
      type: Number, 
      default: 0,
      min: 0,
      max: 5
    },
    
    // Sum of all ratings (for accurate average calculation)
    ratingSum: {
      type: Number,
      default: 0
    },
    
    // Total number of people who rated
    totalRatings: {
      type: Number,
      default: 0,
      min: 0
    },
    
    // Distribution of ratings (how many 1-star, 2-star, etc.)
    ratingDistribution: {
      1: { type: Number, default: 0 },
      2: { type: Number, default: 0 },
      3: { type: Number, default: 0 },
      4: { type: Number, default: 0 },
      5: { type: Number, default: 0 }
    },
    
    // Number of users who bookmarked/followed this
    bookmarkCount: {
      type: Number,
      default: 0
    },
    
    // Number of comments/reviews
    reviewCount: {
      type: Number,
      default: 0
    },
    
    // ============ CHAPTER MANAGEMENT ============
    // Total number of chapters published
    totalChapters: {
      type: Number,
      default: 0
    },
    
    // Number of premium chapters
    totalPremiumChapters: {
      type: Number,
      default: 0
    },
    
    // Latest chapter number (for quick access)
    latestChapterNumber: {
      type: Number,
      default: 0
    },
    
    // When the last chapter was added
    lastChapterAddedAt: {
      type: Date
    },
    
    // ============ MONETIZATION ============
    // Is this manga premium (requires purchase/tokens)?
    premium: { 
      type: Boolean, 
      default: false 
    },
    
    // Price to unlock entire manga (in tokens or currency)
    purchasePrice: {
      type: Number,
      default: 0,
      min: 0
    },
    
    // Price per individual chapter
    chapterPrice: {
      type: Number,
      default: 0,
      min: 0
    },
    
    // Discounted price (for sales/promotions)
    discountedPrice: {
      type: Number,
      default: 0,
      min: 0
    },
    
    // When the discount ends
    discountEndsAt: {
      type: Date
    },
    
    // ============ RELATED CONTENT ============
    // Related manga (sequels, prequels, spin-offs)
    relatedManga: [{
      mangaId: { type: mongoose.Schema.Types.ObjectId, ref: "Manga" },
      relationship: {
        type: String,
        enum: ["sequel", "prequel", "spin_off", "side_story", "adaptation", "alternative_version"]
      }
    }],
    
    // Recommendations based on this manga
    recommendedManga: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "Manga"
    }],
    
    // ============ METADATA & SEO ============
    // Alternative titles
    alternativeTitles: [{
      title: String,
      language: String
    }],
    
    // For search engine optimization
    metaTitle: { type: String },
    metaDescription: { type: String, maxlength: 160 },
    metaKeywords: [{ type: String }],
    
    // Custom SEO slug (if different from auto-generated)
    customSlug: {
      type: String,
      unique: true,
      sparse: true // Allows null/undefined values
    },
    
    // ============ OWNERSHIP & AUDIT ============
    // Who created/uploaded this manga
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    
    // Last person who updated this manga
    lastUpdatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },
    
    // For soft delete (don't actually remove from DB)
    isDeleted: {
      type: Boolean,
      default: false
    },
    
    // When it was deleted (if isDeleted is true)
    deletedAt: {
      type: Date
    },
    
    // Reason for deletion (for audit)
    deletionReason: {
      type: String
    },
    
    // ============ PUBLICATION STATUS ============
    // For draft/published workflow
    publicationStatus: {
      type: String,
      enum: ["draft", "published", "archived", "blocked"],
      default: "published"
    },
    
    // If blocked, why?
    blockReason: {
      type: String
    },
    
    // When it was published
    publishedAt: {
      type: Date,
      default: Date.now
    },
    
    // ============ FEATURED/PROMOTION ============
    // Is this featured on homepage?
    isFeatured: {
      type: Boolean,
      default: false
    },
    
    // Featured until when?
    featuredUntil: {
      type: Date
    },
    
    // Priority in listings (higher = appears first)
    sortPriority: {
      type: Number,
      default: 0,
      min: -999,
      max: 999
    },
    
    // ============ EXTERNAL LINKS ============
    // Links to official sources
    externalLinks: {
      officialWebsite: String,
      wikipedia: String,
      myAnimeList: String,
      anilist: String,
      mangaUpdates: String,
      amazon: String
    },
    
    // ============ SETTINGS ============
    // Reading direction (for RTL/LTR manga)
    readingDirection: {
      type: String,
      enum: ["ltr", "rtl"],
      default: "ltr"
    },
    
    // Is this manga in color?
    isColored: {
      type: Boolean,
      default: false
    },
    
    // Original language
    originalLanguage: {
      type: String,
      default: "ja" // Japanese by default
    },
    
    // Available translations
    availableLanguages: [{
      language: String,
      isComplete: Boolean,
      translatedBy: String
    }]
  },
  { 
    timestamps: true, // Automatically adds createdAt and updatedAt
    
    // Virtual fields (not stored in DB, computed on demand)
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// ============ VIRTUAL FIELDS ============
// Computed fields that don't get stored in DB

// Get accurate average rating
mangaSchema.virtual('averageRating').get(function() {
  if (this.totalRatings === 0) return 0;
  return (this.ratingSum / this.totalRatings).toFixed(1);
});

// Get reading progress URL (for frontend)
mangaSchema.virtual('url').get(function() {
  return `/manga/${this.slug}`;
});

// Check if manga is on discount
mangaSchema.virtual('isOnDiscount').get(function() {
  return this.discountedPrice > 0 && 
         this.discountEndsAt && 
         this.discountEndsAt > new Date();
});

// Get current price (with discount applied if available)
mangaSchema.virtual('currentPrice').get(function() {
  if (this.isOnDiscount) {
    return this.discountedPrice;
  }
  return this.purchasePrice;
});

// ============ INDEXES ============
// For faster queries

// Compound index for featured + priority sorting
mangaSchema.index({ isFeatured: -1, sortPriority: -1, createdAt: -1 });

// Index for search by title
mangaSchema.index({ title: 'text', description: 'text', 'alternativeTitles.title': 'text' });

// Index for genre filtering
mangaSchema.index({ genres: 1, status: 1, rating: -1 });

// Index for trending (views based)
mangaSchema.index({ viewsDaily: -1, viewsWeekly: -1, viewsMonthly: -1 });

// Index for recently updated
mangaSchema.index({ lastChapterAddedAt: -1 });

// ============ STATIC METHODS ============
// Called on the Model itself: Manga.findBySlug(slug)

// Find by slug (primary lookup method)
mangaSchema.statics.findBySlug = function(slug) {
  return this.findOne({ slug, isDeleted: false });
};

// Find by custom slug or regular slug
mangaSchema.statics.findByIdentifier = function(identifier) {
  return this.findOne({
    $or: [
      { slug: identifier },
      { customSlug: identifier }
    ],
    isDeleted: false
  });
};

// Get trending manga (based on views)
mangaSchema.statics.getTrending = function(period = 'weekly', limit = 10) {
  const sortField = period === 'daily' ? 'viewsDaily' : 
                    period === 'monthly' ? 'viewsMonthly' : 'viewsWeekly';
  
  return this.find({ isDeleted: false, publicationStatus: 'published' })
    .sort({ [sortField]: -1 })
    .limit(limit);
};

// Search manga by title or description
mangaSchema.statics.search = function(query, limit = 20) {
  return this.find(
    { $text: { $search: query }, isDeleted: false },
    { score: { $meta: "textScore" } } // Return relevance score
  )
  .sort({ score: { $meta: "textScore" } })
  .limit(limit);
};

// Get manga by genre with pagination
mangaSchema.statics.findByGenre = function(genre, page = 1, limit = 20) {
  const skip = (page - 1) * limit;
  
  return this.find({ 
    genres: genre, 
    isDeleted: false,
    publicationStatus: 'published'
  })
  .sort({ rating: -1, views: -1 })
  .skip(skip)
  .limit(limit);
};

// Get related manga recommendations
mangaSchema.statics.getRecommendations = async function(mangaId, limit = 5) {
  const manga = await this.findById(mangaId);
  if (!manga) return [];
  
  // Find manga with similar genres
  return this.find({
    _id: { $ne: mangaId },
    genres: { $in: manga.genres },
    isDeleted: false,
    publicationStatus: 'published'
  })
  .sort({ rating: -1, views: -1 })
  .limit(limit);
};

// ============ INSTANCE METHODS ============
// Called on a specific manga document: manga.incrementViews()

// Increment view count (track views)
mangaSchema.methods.incrementViews = function() {
  this.views += 1;
  this.viewsDaily += 1;
  this.viewsWeekly += 1;
  this.viewsMonthly += 1;
  return this.save();
};

// Update rating with new user rating
mangaSchema.methods.updateRating = function(newRating, oldRating = null) {
  // If user had previous rating, remove it from sum
  if (oldRating) {
    this.ratingSum = this.ratingSum - oldRating + newRating;
    // Update distribution (decrement old, increment new)
    this.ratingDistribution[oldRating] -= 1;
    this.ratingDistribution[newRating] += 1;
  } else {
    // New rating
    this.ratingSum += newRating;
    this.totalRatings += 1;
    this.ratingDistribution[newRating] += 1;
  }
  
  // Calculate new average
  this.rating = this.ratingSum / this.totalRatings;
  return this.save();
};

// Add a chapter to manga (update counters)
mangaSchema.methods.addChapter = function(isPremium = false) {
  this.totalChapters += 1;
  this.latestChapterNumber += 1;
  this.lastChapterAddedAt = new Date();
  
  if (isPremium) {
    this.totalPremiumChapters += 1;
  }
  
  return this.save();
};

// Remove a chapter (update counters)
mangaSchema.methods.removeChapter = function(isPremium = false) {
  if (this.totalChapters > 0) {
    this.totalChapters -= 1;
    
    if (isPremium && this.totalPremiumChapters > 0) {
      this.totalPremiumChapters -= 1;
    }
    
    // Update latest chapter number if needed
    if (this.latestChapterNumber > 0) {
      this.latestChapterNumber -= 1;
    }
  }
  
  return this.save();
};

// Increment bookmark count
mangaSchema.methods.incrementBookmarks = function() {
  this.bookmarkCount += 1;
  return this.save();
};

// Decrement bookmark count
mangaSchema.methods.decrementBookmarks = function() {
  if (this.bookmarkCount > 0) {
    this.bookmarkCount -= 1;
  }
  return this.save();
};

// Check if user has access to premium content
mangaSchema.methods.userHasAccess = async function(userId) {
  if (!userId) return false;
  
  const User = mongoose.model('User');
  const user = await User.findById(userId);
  
  // Admin/mods always have access
  if (user && (user.role === 'admin' || user.role === 'mod')) {
    return true;
  }
  
  // Check if user purchased the manga
  const Purchase = mongoose.model('Purchase');
  const purchase = await Purchase.findOne({
    userId: userId,
    'metadata.mangaId': this._id,
    purchaseType: 'manga',
    status: 'completed'
  });
  
  return !!purchase;
};

// Apply discount to manga
mangaSchema.methods.applyDiscount = function(discountedPrice, endDate) {
  this.discountedPrice = discountedPrice;
  this.discountEndsAt = endDate;
  return this.save();
};

// Remove discount
mangaSchema.methods.removeDiscount = function() {
  this.discountedPrice = 0;
  this.discountEndsAt = null;
  return this.save();
};

// Soft delete (mark as deleted)
mangaSchema.methods.softDelete = function(reason = '') {
  this.isDeleted = true;
  this.deletedAt = new Date();
  this.deletionReason = reason;
  return this.save();
};

// Restore soft-deleted manga
mangaSchema.methods.restore = function() {
  this.isDeleted = false;
  this.deletedAt = null;
  this.deletionReason = null;
  return this.save();
};

// Get all chapters with access info for a user
mangaSchema.methods.getChaptersWithAccess = async function(userId) {
  const Chapter = mongoose.model('Chapter');
  const chapters = await Chapter.find({ mangaId: this._id })
    .sort({ number: 1 });
  
  if (!userId) {
    // Non-logged in users see only free chapters
    return chapters.map(ch => ({
      ...ch.toObject(),
      isAccessible: !ch.isPremium
    }));
  }
  
  const User = mongoose.model('User');
  const user = await User.findById(userId);
  const hasMangaAccess = await this.userHasAccess(userId);
  
  // Get user's purchased chapters
  const Purchase = mongoose.model('Purchase');
  const purchases = await Purchase.find({
    userId: userId,
    purchaseType: 'chapter',
    status: 'completed'
  });
  
  const purchasedChapterIds = purchases.map(p => p.itemId.toString());
  
  return chapters.map(ch => ({
    ...ch.toObject(),
    isAccessible: !ch.isPremium || 
                  hasMangaAccess || 
                  purchasedChapterIds.includes(ch._id.toString()) ||
                  (user && (user.role === 'admin' || user.role === 'mod'))
  }));
};

// Reset daily/weekly/monthly counters (for cron jobs)
mangaSchema.methods.resetViewCounters = function(period) {
  if (period === 'daily' || period === 'all') {
    this.viewsDaily = 0;
  }
  if (period === 'weekly' || period === 'all') {
    this.viewsWeekly = 0;
  }
  if (period === 'monthly' || period === 'all') {
    this.viewsMonthly = 0;
  }
  return this.save();
};

const Manga = mongoose.model("Manga", mangaSchema);
export default Manga;