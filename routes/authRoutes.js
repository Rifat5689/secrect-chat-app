import express from "express";
const router = express.Router();

import {
  register,
  verifyOtp,
  resendOtp,
  login,
  getMyProfile,
} from "../controllers/authController.js";

import { protect } from "../middleware/auth.js";

// Public routes (no token needed)
router.post("/register", register);
router.post("/verify-otp", verifyOtp);
router.post("/resend-otp", resendOtp);
router.post("/login", login);

// Protected route (token required)
router.get("/me", protect, getMyProfile);

export default router;