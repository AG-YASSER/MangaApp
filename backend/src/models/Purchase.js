import mongoose from "mongoose";

const purchaseSchema = new mongoose.Schema(
  {
    // WHO made the purchase
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // WHAT they bought (could be chapter, manga, subscription, or donation)
    // We use flexible type to handle different purchases
    purchaseType: {
      type: String,
      enum: ["chapter", "manga", "subscription", "donation"], // Could add 'bundle', 'season' later
      required: true,
    },

    // DIFFERENT ITEMS for different purchase types
    itemId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      // Could reference Chapter, Manga, or Subscription
      // We don't specify ref because it varies by purchaseType
    },

    // HOW MUCH THEY PAID
    amount: {
      type: Number,
      required: true,
      min: 0,
    },

    // WHAT CURRENCY
    currency: {
      type: String,
      enum: ["tokens", "usd", "eur", "gbp"],
      default: "tokens",
    },

    // PAYMENT GATEWAY INFO
    // For when they pay with real money or tokens
    paymentMethod: {
      type: String,
      enum: ["stripe", "paypal", "apple_pay", "google_pay", "tokens"],
      default: null,
    },

    // UNIQUE PAYMENT ID from Stripe/PayPal
    // Used to retrieve receipt, handle refunds, etc
    transactionId: String,

    // STATUS: did payment succeed?
    status: {
      type: String,
      enum: ["pending", "completed", "failed", "refunded"],
      default: "pending",
    },

    // FOR REFUNDS
    refundedAt: Date,
    refundReason: String, // "User requested", "Broken content", etc

    // WHAT DID THEY GET?
    // After payment succeeds, we unlock access
    description: String, // "Chapter 5: The Battle", "Premium Subscription - 30 days"

    // SO WE REMEMBER
    // Why purchase? Track trends: "Most bought chapters", etc
    metadata: {
      mangaTitle: String,
      chapterNumber: Number,
      // Any extra info buyer needs
    },
  },
  { timestamps: true }, // createdAt = purchase time
);

// Index: quickly find user's purchases
purchaseSchema.index({ userId: 1, createdAt: -1 });

// Index: find purchases by transaction (for payment gateway reconciliation)
purchaseSchema.index({ transactionId: 1 });

const Purchase = mongoose.model("Purchase", purchaseSchema);
export default Purchase;
