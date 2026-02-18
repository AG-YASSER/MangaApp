import express from "express";
import {
  register,
  login,
  logout,
  forgotPassword,
  changePassword,
  verifyEmail,
  resendVerification,
} from "../controllers/authController.js";
import {
  registerValidator,
  loginValidator,
  forgotPasswordValidator,
  changePasswordValidator,
  resendVerificationValidator,
} from "../validators/authValidators.js";
import { validate } from "../middleware/validate.js";
import { authMiddleware } from "../middleware/auth.js";
import rateLimit from "express-rate-limit";

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 10, 
  message: "Too many requests. Please try again later.",
});

const router = express.Router();



router.use(authLimiter);

router.post("/register", registerValidator, validate, register);
router.post("/login", loginValidator, validate, login);
router.post("/change-password", authMiddleware, changePasswordValidator, validate, changePassword);
router.post("/logout", logout);
router.post("/forgot-password", forgotPasswordValidator, validate, forgotPassword);
router.get("/verify-email", verifyEmail);
router.post("/resend-verification", resendVerificationValidator, validate, resendVerification);

export default router;