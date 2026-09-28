import express from "express";
const router = express.Router();

import {
  sendFriendRequest,
  acceptFriendRequest,
  rejectFriendRequest,
  getFriends,
  getPendingRequests,
  blockUser,
  unblockUser,
  getBlockedUsers,
  updateProfile,
} from "../controllers/friendController.js";

import { protect } from "../middleware/auth.js";

// All friend routes are protected
router.use(protect);

router.post("/request", sendFriendRequest);
router.put("/accept/:requesterId", acceptFriendRequest);
router.delete("/reject/:requesterId", rejectFriendRequest);
router.get("/", getFriends);
router.get("/requests/pending", getPendingRequests);

// Block / Unblock
router.put("/block/:userId", blockUser);
router.put("/unblock/:userId", unblockUser);
router.get("/blocked", getBlockedUsers);

// Profile
router.put("/profile", updateProfile);

export default router;