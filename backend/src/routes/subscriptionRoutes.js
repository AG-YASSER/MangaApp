// subscriptionRoutes.js
import express from "express";
import {
  getCurrentSubscription,
  getSubscriptionPlans,
  createSubscription,
  cancelSubscription,
  getSubscriptionHistory,
  checkFeatureAccess,
  getSubscriptionBenefits,
  getDonationOptions,
  makeDonation,
  getTokensBalance,
  subscribeWithTokens,
} from "../controllers/subscriptionController.js";
import { authMiddleware } from "../middleware/auth.js";
import validate from "../middleware/validate.js";
import {
  createSubscriptionValidator,
  cancelSubscriptionValidator,
  getHistoryValidator,
  makeDonationValidator,
} from "../validators/subscriptionValidators.js";

const router = express.Router();

// ============ PUBLIC ROUTES ============
router.get("/plans", getSubscriptionPlans);
router.get("/donations/options", getDonationOptions);

// ============ PROTECTED ROUTES - SUBSCRIPTION ============
router.get("/me", authMiddleware, getCurrentSubscription);

router.get(
  "/history",
  authMiddleware,
  ...getHistoryValidator,
  validate,
  getSubscriptionHistory,
);

router.get("/check-feature", authMiddleware, checkFeatureAccess);

router.get("/benefits", authMiddleware, getSubscriptionBenefits);

router.post(
  "/create",
  authMiddleware,
  ...createSubscriptionValidator,
  validate,
  createSubscription,
);

router.post(
  "/cancel",
  authMiddleware,
  ...cancelSubscriptionValidator,
  validate,
  cancelSubscription,
);

// ============ PROTECTED ROUTES - TOKENS & DONATIONS ============
router.get("/tokens/balance", authMiddleware, getTokensBalance);

router.post(
  "/donations/make",
  authMiddleware,
  ...makeDonationValidator,
  validate,
  makeDonation,
);

router.post("/subscribe-with-tokens", authMiddleware, subscribeWithTokens);

export default router;
