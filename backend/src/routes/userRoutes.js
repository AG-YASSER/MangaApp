import express from "express";
import { protect } from "../middleware/auth.js";
import { getMe, updateMe, deleteMe } from "../controllers/userController.js";

const router = express.Router();

router
  .route("/me")
  .get(protect, getMe)
  .put(protect, updateMe)
  .delete(protect, deleteMe);

export default router;
