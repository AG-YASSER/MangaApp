import { body } from "express-validator";

const passwordValidator = (field = "password") => 
  body(field)
    .notEmpty()
    .withMessage(`${field === "newPassword" ? "New password" : "Password"} is required`)
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters long")
    .matches(/[A-Z]/)
    .withMessage("Password must contain at least one uppercase letter (A-Z)")
    .matches(/[a-z]/)
    .withMessage("Password must contain at least one lowercase letter (a-z)")
    .matches(/[0-9]/)
    .withMessage("Password must contain at least one number (0-9)")
    .matches(/[\W_]/)
    .withMessage("Password must contain at least one special character (!@#$%^&*)");

export const registerValidator = [
  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Please provide a valid email address (e.g., name@example.com)")
    .normalizeEmail()
    .toLowerCase(),

  passwordValidator(),

  body("username")
    .trim()
    .notEmpty()
    .withMessage("Username is required")
    .isLength({ min: 3, max: 30 })
    .withMessage("Username must be between 3 and 30 characters")
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage("Username can only contain letters, numbers, and underscores (no spaces)")
    .custom(async (username) => {
      // You can add async checks here if needed
      // For example, check if username contains profanity
      const bannedWords = ['admin', 'root', 'moderator'];
      if (bannedWords.includes(username.toLowerCase())) {
        throw new Error('This username is not allowed');
      }
      return true;
    }),
];

export const loginValidator = [
  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Please provide a valid email address")
    .normalizeEmail()
    .toLowerCase(),

  body("password")
    .notEmpty()
    .withMessage("Password is required"),
];

export const forgotPasswordValidator = [
  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Please provide a valid email address")
    .normalizeEmail()
    .toLowerCase(),
];

export const changePasswordValidator = [
  passwordValidator("newPassword"),
];

export const resendVerificationValidator = [
  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Please provide a valid email address")
    .normalizeEmail()
    .toLowerCase(),
];
