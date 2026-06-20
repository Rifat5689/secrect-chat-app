import express from "express";
const router = express.Router();

import {
  register,
  login,
  getMyProfile,
} from "../controllers/authController.js";

import { protect } from "../middleware/auth.js";

// Public routes (no token needed)
router.post("/register", register);
router.post("/login", login);

// Protected route (token required)
router.get("/me", protect, getMyProfile);

export default router;