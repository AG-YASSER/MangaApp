// subscriptionRoutes.js
import express from "express";
import {
  getCurrentSubscription,
  getSubscriptionPlans,
  createSubscription,
  cancelSubscription,
  getSubscriptionHistory,
} from "../controllers/subscriptionController.js";
import { authMiddleware } from "../middleware/auth.js";

const router = express.Router();

// Public routes
router.get("/plans", getSubscriptionPlans);  // Available subscription tiers

// Protected routes
router.get("/me", authMiddleware, getCurrentSubscription);
router.get("/history", authMiddleware, getSubscriptionHistory);
router.post("/create", authMiddleware, createSubscription);
router.post("/cancel", authMiddleware, cancelSubscription);

export default router;