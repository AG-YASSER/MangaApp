import express from "express";
import {
  register,
  login,
  logout,
  forgotPassword,
  changePassword,
} from "../controllers/authController.js";
import {
  registerValidator,
  loginValidator,
  forgotPasswordValidator,
  changePasswordValidator,
} from "../validators/authValidators.js";
import validate from "../middleware/validate.js";
import { authMiddleware } from "../middleware/auth.js";
import rateLimit from "express-rate-limit";

const authLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 5,
  message: "Too many login attempts. Try again later.",
});

const router = express.Router();

router.post("/register", authLimiter, registerValidator, validate, register);
router.post("/login", authLimiter, loginValidator, validate, login);
router.post(
  "/change-password",
  authMiddleware,
  changePasswordValidator,
  validate,
  changePassword,
);
router.post("/logout", logout);
router.post(
  "/forgot-password",
  authLimiter,
  forgotPasswordValidator,
  validate,
  forgotPassword,
);

export default router;
