// src/controllers/subscriptionController.js
import Subscription from "../models/Subscription.js";
import User from "../models/User.js";
import Purchase from "../models/Purchase.js";
import Wallet from "../models/Wallet.js";

// Subscription plans
const SUBSCRIPTION_PLANS = {
  free: {
    id: "free",
    name: "Free",
    price: 0,
    billingCycle: null,
    features: [
      "Read all chapters",
      "Ad-supported experience",
      "See community content",
    ],
    benefits: {
      canAddGifProfile: false,
      canAddBanner: false,
      autoReaderEnabled: false,
      noAds: false,
      allChaptersFree: true,
    },
  },
  premium: {
    id: "premium",
    name: "Premium",
    price: 4.99,
    billingCycle: "monthly",
    features: [
      "Add GIFs to your profile",
      "Custom profile banner",
      "Auto-reader feature with adjustable speed",
      "All chapters free & ad-free",
      "Support our creators",
    ],
    benefits: {
      canAddGifProfile: true,
      canAddBanner: true,
      autoReaderEnabled: true,
      noAds: true,
      allChaptersFree: true,
    },
  },
};

// Get current user's subscription
export const getCurrentSubscription = async (req, res) => {
  try {
    const firebaseUid = req.user.uid;

    // Find user by Firebase UID to get MongoDB _id
    const user = await User.findOne({ firebaseUid });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const userId = user._id;

    // Find active subscription for user
    const subscription = await Subscription.findOne({
      userId,
      isActive: true,
      expiresAt: { $gt: new Date() },
    });

    if (!subscription) {
      // User is on free plan (default)
      return res.json({
        success: true,
        subscription: {
          _id: null,
          tier: "free",
          isActive: true,
          ...SUBSCRIPTION_PLANS.free,
        },
        isSubscriber: false,
        message: "User is on the free plan",
      });
    }

    res.json({
      success: true,
      subscription: {
        _id: subscription._id,
        tier: "premium",
        isActive: subscription.isActive,
        startDate: subscription.startDate,
        expiresAt: subscription.expiresAt,
        benefits: subscription.benefits,
        price: subscription.price,
        billingCycle: subscription.billingCycle,
        isAutoRenew: subscription.isAutoRenew,
        purchaseMethod: subscription.purchaseMethod, // 'cash' or 'tokens'
        ...SUBSCRIPTION_PLANS.premium,
      },
      isSubscriber: true,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get available subscription plans
export const getSubscriptionPlans = async (req, res) => {
  try {
    // Return both free and premium plans
    const plans = Object.values(SUBSCRIPTION_PLANS);
    res.json({
      success: true,
      plans,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Create a new subscription (Premium tier only)
export const createSubscription = async (req, res) => {
  try {
    const firebaseUid = req.user.uid;

    // Find user by Firebase UID
    const user = await User.findOne({ firebaseUid });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const userId = user._id;
    const { paymentMethod = "cash" } = req.body; // 'cash' or 'tokens'

    // Check if user already has an active subscription
    const existingSubscription = await Subscription.findOne({
      userId,
      isActive: true,
      expiresAt: { $gt: new Date() },
    });

    if (existingSubscription) {
      return res.status(400).json({
        success: false,
        message: "You already have an active subscription",
      });
    }

    // If paying with tokens, check wallet balance
    if (paymentMethod === "tokens") {
      const wallet = await Wallet.findOne({ userId });
      const requiredTokens = SUBSCRIPTION_PLANS.premium.price;
      if (!wallet || wallet.tokensBalance < requiredTokens) {
        return res.status(400).json({
          success: false,
          message: `Insufficient tokens. Required: ${requiredTokens}, Available: ${wallet?.tokensBalance || 0}`,
        });
      }
    }

    // Calculate expiration date (1 month from now)
    const now = new Date();
    const expiresAt = new Date();
    expiresAt.setMonth(expiresAt.getMonth() + 1);

    const plan = SUBSCRIPTION_PLANS.premium;

    // Create new subscription
    const subscription = new Subscription({
      userId,
      tier: "premium",
      benefits: plan.benefits,
      startDate: now,
      expiresAt,
      price: plan.price,
      billingCycle: "monthly",
      isActive: true,
      isAutoRenew: true,
      purchaseMethod: paymentMethod, // Track if purchased with cash or tokens
    });

    await subscription.save();

    // Create or update purchase record
    const purchase = new Purchase({
      userId,
      purchaseType: "subscription",
      itemId: subscription._id,
      amount: plan.price,
      currency: paymentMethod === "tokens" ? "tokens" : "usd",
      paymentMethod: paymentMethod === "tokens" ? "tokens" : "stripe",
      status: "completed",
      description: `Premium Subscription - Monthly`,
      metadata: {
        tier: "premium",
        billingCycle: "monthly",
        paymentMethod,
      },
    });

    await purchase.save();

    // Link purchase to subscription
    subscription.purchaseId = purchase._id;
    await subscription.save();

    // Deduct tokens if paid with tokens
    if (paymentMethod === "tokens") {
      const wallet = await Wallet.findOne({ userId });
      wallet.tokensBalance -= plan.price;
      wallet.transactions.push({
        type: "subscription",
        amount: plan.price,
        currency: "tokens",
        description: "Premium Subscription Purchase",
        referenceId: subscription._id.toString(),
        transactionDate: now,
      });
      await wallet.save();
    }

    // Update user's subscription reference
    await User.findByIdAndUpdate(userId, { subscription: subscription._id });

    // Update wallet's active subscription
    await Wallet.findOneAndUpdate(
      { userId },
      { activeSubscriptionId: subscription._id },
    );

    res.status(201).json({
      success: true,
      message: `Premium subscription activated! ${paymentMethod === "tokens" ? "(Paid with tokens)" : "(Awaiting payment)"}`,
      subscription: {
        _id: subscription._id,
        tier: "premium",
        isActive: subscription.isActive,
        startDate: subscription.startDate,
        expiresAt: subscription.expiresAt,
        benefits: subscription.benefits,
        price: subscription.price,
        billingCycle: subscription.billingCycle,
        isAutoRenew: subscription.isAutoRenew,
        purchaseMethod: subscription.purchaseMethod,
        ...SUBSCRIPTION_PLANS.premium,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
      error: process.env.NODE_ENV === "development" ? error : undefined,
    });
  }
};

// Cancel subscription
export const cancelSubscription = async (req, res) => {
  try {
    const firebaseUid = req.user.uid;

    // Find user by Firebase UID
    const user = await User.findOne({ firebaseUid });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const userId = user._id;
    const { reason } = req.body;

    // Find user's active subscription
    const subscription = await Subscription.findOne({
      userId,
      isActive: true,
    });

    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: "No active subscription to cancel",
      });
    }

    // Cancel the subscription
    await subscription.cancel(reason || "User requested cancellation");

    // Update user - remove subscription reference
    await User.findByIdAndUpdate(userId, {
      subscription: null,
    });

    // Update wallet
    await Wallet.findOneAndUpdate({ userId }, { activeSubscriptionId: null });

    res.json({
      success: true,
      message:
        "Subscription cancelled successfully. You will lose premium features at expiration.",
      subscription: {
        _id: subscription._id,
        isActive: subscription.isActive,
        cancelledAt: subscription.cancelledAt,
        cancellationReason: subscription.cancellationReason,
        expiresAt: subscription.expiresAt,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get subscription history
export const getSubscriptionHistory = async (req, res) => {
  try {
    const firebaseUid = req.user.uid;

    // Find user by Firebase UID
    const user = await User.findOne({ firebaseUid });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const userId = user._id;
    const { limit = 10, skip = 0 } = req.query;

    // Get all subscriptions for user (active and inactive)
    const subscriptions = await Subscription.find({ userId })
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(skip));

    const total = await Subscription.countDocuments({ userId });

    const history = subscriptions.map((sub) => ({
      _id: sub._id,
      isActive: sub.isActive,
      startDate: sub.startDate,
      expiresAt: sub.expiresAt,
      cancelledAt: sub.cancelledAt,
      cancellationReason: sub.cancellationReason,
      price: sub.price,
      billingCycle: sub.billingCycle,
      purchaseMethod: sub.purchaseMethod,
    }));

    res.json({
      success: true,
      history,
      pagination: {
        total,
        limit: parseInt(limit),
        skip: parseInt(skip),
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Check if user can access a specific feature
export const checkFeatureAccess = async (req, res) => {
  try {
    const firebaseUid = req.user.uid;

    // Find user by Firebase UID
    const user = await User.findOne({ firebaseUid });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const userId = user._id;
    const { feature } = req.query;
    console.log(feature);

    if (!feature) {
      return res.status(400).json({
        success: false,
        message: "Feature parameter is required",
      });
    }

    // Find active subscription
    const subscription = await Subscription.findOne({
      userId,
      isActive: true,
      expiresAt: { $gt: new Date() },
    });

    let hasAccess = false;
    const featureLower = feature.toLowerCase();

    if (subscription) {
      const benefits = subscription.benefits || {};

      switch (featureLower) {
        case "gif_profile":
        case "gifprofile":
          hasAccess = benefits.canAddGifProfile === true;
          break;
        case "banner":
        case "profile_banner":
          hasAccess = benefits.canAddBanner === true;
          break;
        case "auto_reader":
        case "autoreader":
          hasAccess = benefits.autoReaderEnabled === true;
          break;
        case "no_ads":
        case "noads":
          hasAccess = benefits.noAds === true;
          break;
        case "all_chapters":
        case "allchapters":
          hasAccess = benefits.allChaptersFree === true;
          break;
        default:
          return res.status(400).json({
            success: false,
            message: `Invalid feature. Valid options: gif_profile, banner, auto_reader, no_ads, all_chapters`,
          });
      }
    }

    res.json({
      success: true,
      feature,
      hasAccess,
      isSubscriber: !!subscription,
      subscription: subscription
        ? {
            _id: subscription._id,
            expiresAt: subscription.expiresAt,
            benefits: subscription.benefits,
          }
        : null,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get subscription benefits
export const getSubscriptionBenefits = async (req, res) => {
  try {
    const firebaseUid = req.user.uid;

    // Find user by Firebase UID
    const user = await User.findOne({ firebaseUid });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const userId = user._id;

    // Get user's current subscription
    const subscription = await Subscription.findOne({
      userId,
      isActive: true,
      expiresAt: { $gt: new Date() },
    });

    if (!subscription) {
      // User is on free tier
      return res.json({
        success: true,
        tier: "free",
        isSubscriber: false,
        benefits: SUBSCRIPTION_PLANS.free.benefits,
        features: SUBSCRIPTION_PLANS.free.features,
        message:
          "You are on the free plan. Upgrade to Premium to unlock exclusive features!",
      });
    }

    res.json({
      success: true,
      tier: "premium",
      isSubscriber: true,
      benefits: SUBSCRIPTION_PLANS.premium.benefits,
      features: SUBSCRIPTION_PLANS.premium.features,
      subscription: {
        _id: subscription._id,
        startDate: subscription.startDate,
        expiresAt: subscription.expiresAt,
        isAutoRenew: subscription.isAutoRenew,
        purchaseMethod: subscription.purchaseMethod,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ============ DONATIONS & TOKENS SYSTEM ============

// Get donation options
export const getDonationOptions = async (req, res) => {
  try {
    const donationOptions = [
      {
        id: "tier1",
        tokens: 50,
        displayName: "$1.99",
        price: 1.99,
        message: "Support our creators",
      },
      {
        id: "tier2",
        tokens: 130,
        displayName: "$4.99",
        price: 4.99,
        message: "You're awesome! 1 month subscription value",
        bonus: 30,
      },
      {
        id: "tier3",
        tokens: 270,
        displayName: "$9.99",
        price: 9.99,
        message: "Super donor! 2.2 months value",
        bonus: 70,
      },
      {
        id: "tier4",
        tokens: 550,
        displayName: "$19.99",
        price: 19.99,
        message: "Incredible! 4.4 months value",
        bonus: 150,
      },
    ];

    res.json({
      success: true,
      donationOptions,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Make a donation (get tokens)
export const makeDonation = async (req, res) => {
  try {
    const firebaseUid = req.user.uid;

    // Find user by Firebase UID
    const user = await User.findOne({ firebaseUid });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const userId = user._id;
    const { donationTierId } = req.body;

    if (!donationTierId) {
      return res.status(400).json({
        success: false,
        message: "Donation tier ID is required",
      });
    }

    const donationOptions = {
      tier1: { tokens: 50, price: 1.99 },
      tier2: { tokens: 130, price: 4.99 },
      tier3: { tokens: 270, price: 9.99 },
      tier4: { tokens: 550, price: 19.99 },
    };

    const donation = donationOptions[donationTierId];
    if (!donation) {
      return res.status(400).json({
        success: false,
        message: "Invalid donation tier",
      });
    }

    // Get user's wallet
    let wallet = await Wallet.findOne({ userId });
    if (!wallet) {
      // Create wallet if doesn't exist
      wallet = new Wallet({
        userId,
        tokensBalance: 0,
        coinsBalance: 0,
      });
      await wallet.save();
    }

    const now = new Date();

    // Add tokens to wallet
    wallet.tokensBalance += donation.tokens;
    wallet.transactions.push({
      type: "reward",
      amount: donation.tokens,
      currency: "tokens",
      description: `Donation tier ${donationTierId} - ${donation.tokens} tokens`,
      transactionDate: now,
    });
    await wallet.save();

    // Create purchase record for tracking
    const purchase = new Purchase({
      userId,
      purchaseType: "donation",
      itemId: userId, // Reference to user for donations
      amount: donation.price,
      currency: "usd",
      paymentMethod: "stripe", // Will be processed through Stripe
      status: "pending", // Will be 'completed' after payment
      description: `Donation - ${donation.tokens} tokens`,
      metadata: {
        donationTierId,
        tokensReceived: donation.tokens,
      },
    });

    await purchase.save();

    res.status(201).json({
      success: true,
      message: `Ready to donate! You will receive ${donation.tokens} tokens.`,
      donation: {
        tier: donationTierId,
        tokens: donation.tokens,
        price: donation.price,
        purchaseId: purchase._id,
      },
      wallet: {
        tokensBalance: wallet.tokensBalance,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get user's tokens balance
export const getTokensBalance = async (req, res) => {
  try {
    const firebaseUid = req.user.uid;

    // Find user by Firebase UID
    const user = await User.findOne({ firebaseUid });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const userId = user._id;

    let wallet = await Wallet.findOne({ userId });
    if (!wallet) {
      // Create wallet if doesn't exist
      wallet = new Wallet({
        userId,
        tokensBalance: 0,
        coinsBalance: 0,
      });
      await wallet.save();
    }

    res.json({
      success: true,
      wallet: {
        tokensBalance: wallet.tokensBalance,
        coinsBalance: wallet.coinsBalance,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Subscribe using tokens
export const subscribeWithTokens = async (req, res) => {
  try {
    const firebaseUid = req.user.uid;

    // Find user by Firebase UID
    const user = await User.findOne({ firebaseUid });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const userId = user._id;

    // Check if user already has active subscription
    const existingSubscription = await Subscription.findOne({
      userId,
      isActive: true,
      expiresAt: { $gt: new Date() },
    });

    if (existingSubscription) {
      return res.status(400).json({
        success: false,
        message: "You already have an active subscription",
      });
    }

    // Check wallet
    const wallet = await Wallet.findOne({ userId });
    const requiredTokens = SUBSCRIPTION_PLANS.premium.price;
    if (!wallet || wallet.tokensBalance < requiredTokens) {
      return res.status(400).json({
        success: false,
        message: `Insufficient tokens. Required: ${requiredTokens}, Available: ${wallet?.tokensBalance || 0}`,
      });
    }

    // Use create subscription endpoint with tokens
    req.body.paymentMethod = "tokens";
    return createSubscription(req, res);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
