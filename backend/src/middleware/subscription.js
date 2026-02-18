import Subscription from "../models/Subscription.js";

/**
 * Middleware to attach user's subscription info to req.subscription
 * Can be used before handlers that need subscription data
 */
export const subscriptionMiddleware = async (req, res, next) => {
  try {
    const userId = req.user?.uid;
    if (!userId) {
      req.subscription = null;
      return next();
    }

    // Find active subscription
    const subscription = await Subscription.findOne({
      userId,
      isActive: true,
      expiresAt: { $gt: new Date() },
    });

    req.subscription = subscription || null;
    next();
  } catch (error) {
    console.error("Subscription middleware error:", error);
    req.subscription = null;
    next();
  }
};

/**
 * Middleware to check if user has premium subscription (premium or pro)
 * Requires authMiddleware to be used first
 */
export const requirePremium = async (req, res, next) => {
  try {
    const userId = req.user?.uid;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const subscription = await Subscription.findOne({
      userId,
      isActive: true,
      expiresAt: { $gt: new Date() },
      tier: { $in: ["premium", "pro"] },
    });

    if (!subscription) {
      return res.status(403).json({
        success: false,
        message: "Premium subscription required to access this feature",
      });
    }

    req.subscription = subscription;
    next();
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Middleware to check if user has pro subscription
 * Requires authMiddleware to be used first
 */
export const requirePro = async (req, res, next) => {
  try {
    const userId = req.user?.uid;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const subscription = await Subscription.findOne({
      userId,
      isActive: true,
      expiresAt: { $gt: new Date() },
      tier: "pro",
    });

    if (!subscription) {
      return res.status(403).json({
        success: false,
        message: "Pro subscription required to access this feature",
      });
    }

    req.subscription = subscription;
    next();
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Utility function to check if subscription is valid (active and not expired)
 */
export const isSubscriptionValid = (subscription) => {
  if (!subscription) return false;
  return subscription.isActive && new Date(subscription.expiresAt) > new Date();
};

/**
 * Utility function to get user's subscription tier
 * Returns 'free' if no subscription
 */
export const getUserSubscriptionTier = async (userId) => {
  try {
    const subscription = await Subscription.findOne({
      userId,
      isActive: true,
      expiresAt: { $gt: new Date() },
    });

    return subscription?.tier || "free";
  } catch (error) {
    console.error("Error getting subscription tier:", error);
    return "free";
  }
};

/**
 * Utility function to check if user can access a feature
 */
export const canAccessFeature = async (userId, feature) => {
  try {
    const subscription = await Subscription.findOne({
      userId,
      isActive: true,
      expiresAt: { $gt: new Date() },
    });

    if (!subscription) {
      return false;
    }

    const benefits = subscription.benefits || {};

    switch (feature) {
      case "noAds":
        return benefits.noAds === true;
      case "unlimited_chapters":
        return benefits.dailyChapterLimit === null;
      case "premium_content":
        return benefits.canAccessPremium === true;
      case "discount":
        return benefits.discountPercentage > 0;
      case "offline_download":
        return benefits.offlineDownloads > 0;
      default:
        return false;
    }
  } catch (error) {
    console.error("Error checking feature access:", error);
    return false;
  }
};
