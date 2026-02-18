import { body, query } from "express-validator";

export const createSubscriptionValidator = [
  body("paymentMethod")
    .optional()
    .isIn(["cash", "tokens"])
    .withMessage("Payment method must be 'cash' or 'tokens'"),
];

export const cancelSubscriptionValidator = [
  body("reason")
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage("Cancellation reason must be less than 500 characters"),
];

export const getHistoryValidator = [
  query("limit")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("Limit must be between 1 and 100"),

  query("skip")
    .optional()
    .isInt({ min: 0 })
    .withMessage("Skip must be 0 or greater"),
];

export const makeDonationValidator = [
  body("donationTierId")
    .notEmpty()
    .withMessage("Donation tier ID is required")
    .isIn(["tier1", "tier2", "tier3", "tier4"])
    .withMessage(
      "Invalid donation tier. Must be tier1, tier2, tier3, or tier4",
    ),
];
