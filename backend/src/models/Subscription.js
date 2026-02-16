import mongoose from "mongoose";

const subscriptionSchema = new mongoose.Schema(
  {
    // WHO has this subscription
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // WHICH TIER are they on?
    tier: {
      type: String,
      enum: ["free", "premium", "pro"],
      default: "free",
    },

    // WHAT ARE THE BENEFITS OF THIS TIER?
    // This defines what user can do
    benefits: {
      // How many chapters can they read per day?
      dailyChapterLimit: Number, // free: 3, premium: 10, pro: unlimited

      // Can they access premium content?
      canAccessPremium: Boolean,

      // Discount on purchases (0-100%)
      discountPercentage: Number,

      // Max offline downloads per month
      offlineDownloads: Number,

      // Ad-free experience?
      noAds: Boolean,
    },

    // PAYMENT & DURATION
    // When did subscription start?
    startDate: {
      type: Date,
      default: Date.now,
    },

    // When does it end?
    expiresAt: {
      type: Date,
      required: true,
    },

    // AUTO-RENEW? (for paid subscriptions)
    isAutoRenew: {
      type: Boolean,
      default: true,
    },

    // HOW MUCH DOES THIS TIER COST?
    // Store cost to show in invoice
    price: Number, // in USD or tokens
    billingCycle: {
      type: String,
      enum: ["monthly", "quarterly", "yearly"],
      default: "monthly",
    },

    // IS IT ACTIVE RIGHT NOW?
    // Easy check: is expiresAt > now?
    isActive: {
      type: Boolean,
      default: true,
    },

    // PAYMENT ID (links to Purchase)
    purchaseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Purchase",
    },

    // STRIPE/PAYPAL SUBSCRIPTION ID
    // For recurring payments and cancellations
    stripeSubscriptionId: String,

    // IF THEY CANCELLED
    cancelledAt: Date,
    cancellationReason: String,
  },
  { timestamps: true },
);

// Index: find active subscriptions for a user
subscriptionSchema.index({ userId: 1, isActive: 1 });

// Common static and instance methods
subscriptionSchema.statics.findActiveByUser = function (userId) {
  return this.findOne({ userId, isActive: true });
};

subscriptionSchema.methods.cancel = function (reason = "") {
  this.isActive = false;
  this.cancelledAt = new Date();
  this.cancellationReason = reason;
  return this.save();
};

const Subscription = mongoose.model("Subscription", subscriptionSchema);
export default Subscription;
