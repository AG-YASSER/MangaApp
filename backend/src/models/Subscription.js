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

    // WHICH TIER (only premium in new system)
    tier: {
      type: String,
      enum: ["premium"],
      default: "premium",
    },

    // WHAT ARE THE BENEFITS OF THIS TIER?
    benefits: {
      // Profile customization features
      canAddGifProfile: {
        type: Boolean,
        default: true,
      },

      canAddBanner: {
        type: Boolean,
        default: true,
      },

      // Reading experience features
      autoReaderEnabled: {
        type: Boolean,
        default: true,
      },

      // Ad-free experience
      noAds: {
        type: Boolean,
        default: true,
      },

      // All chapters are free (same for free & premium users)
      allChaptersFree: {
        type: Boolean,
        default: true,
      },
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
    price: {
      type: Number,
      default: 4.99, // Fixed monthly price
    },

    billingCycle: {
      type: String,
      enum: ["monthly"],
      default: "monthly",
    },

    // HOW WAS IT PAID?
    purchaseMethod: {
      type: String,
      enum: ["cash", "tokens"],
      default: "cash", // Stripe payment or tokens
    },

    // IS IT ACTIVE RIGHT NOW?
    isActive: {
      type: Boolean,
      default: true,
    },

    // PAYMENT ID (links to Purchase)
    purchaseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Purchase",
    },

    // STRIPE SUBSCRIPTION ID (for recurring payments)
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
  return this.findOne({
    userId,
    isActive: true,
    expiresAt: { $gt: new Date() },
  });
};

subscriptionSchema.methods.cancel = function (reason = "") {
  this.isActive = false;
  this.cancelledAt = new Date();
  this.cancellationReason = reason;
  return this.save();
};

const Subscription = mongoose.model("Subscription", subscriptionSchema);
export default Subscription;
