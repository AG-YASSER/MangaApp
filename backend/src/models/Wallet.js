import mongoose from "mongoose";

const walletSchema = new mongoose.Schema(
  {
    // WHO owns the wallet
    // This is a ONE-TO-ONE relationship: each user has exactly ONE wallet
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true, // Only ONE wallet per user
      index: true,
    },

    // MAIN BALANCE: How many tokens/coins user has
    // Tokens = premium currency (buy with real money or earn)
    // Used to: unlock chapters, buy books, renew subscriptions
    tokensBalance: {
      type: Number,
      default: 0,
      min: 0, // Can't go negative
    },

    // COINS: Free currency earned by reading/daily login/referrals
    // Less valuable than tokens
    coinsBalance: {
      type: Number,
      default: 0,
      min: 0,
    },

    // TRANSACTION HISTORY
    // Keep a record of every token/coin movement
    // Why? For auditing, refunds, customer support
    transactions: [
      {
        type: {
          type: String,
          enum: ["purchase", "refund", "reward", "debit", "subscription"],
        },
        amount: Number,
        currency: {
          type: String,
          enum: ["tokens", "coins"],
          default: "tokens",
        },
        description: String, // e.g., "Purchased premium chapter", "Refund for broken chapter"
        referenceId: String, // Links to Purchase._id, Subscription._id, etc
        transactionDate: {
          type: Date,
          default: Date.now,
        },
      },
    ],

    // PAYMENT METHODS
    // Store multiple payment methods (credit card, PayPal, etc)
    // SECURITY: Don't store card numbers! Only payment gateway IDs
    paymentMethods: [
      {
        id: String, // Stripe/PayPal ID, never raw credit card data
        type: {
          type: String,
          enum: ["credit_card", "paypal", "apple_pay", "google_pay"],
        },
        last4: String, // Last 4 digits for display only
        isDefault: Boolean,
        expiresAt: Date,
      },
    ],

    // SUBSCRIPTION STATUS
    // Links to user's active subscription
    activeSubscriptionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subscription",
      default: null,
    },
  },
  { timestamps: true },
);

// Common static and instance methods
walletSchema.statics.findByUser = function (userId) {
  return this.findOne({ userId });
};

walletSchema.methods.addTokens = function (amount) {
  this.tokensBalance += amount;
  return this.save();
};

walletSchema.methods.addCoins = function (amount) {
  this.coinsBalance += amount;
  return this.save();
};

const Wallet = mongoose.model("Wallet", walletSchema);
export default Wallet;
