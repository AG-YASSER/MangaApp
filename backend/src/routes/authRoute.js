import express from "express";
import { register, login, logout, forgotPassword, changePassword } from "../controllers/authController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/register", register);

router.post("/login", login);


router.get("/profile", protect, (req, res) => {
  res.json({
    message: "Welcome!",
    user: req.user,
  });
});

router.post("/logout", protect, logout);
router.post("/forgot-password", forgotPassword);
router.post("/change-password", protect, changePassword);






export default router;
