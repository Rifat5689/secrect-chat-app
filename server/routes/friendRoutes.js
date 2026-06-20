import express from "express";
const router = express.Router();

import {
  sendFriendRequest,
  acceptFriendRequest,
  rejectFriendRequest,
  getFriends,
  getPendingRequests,
} from "../controllers/friendController.js";

import { protect } from "../middleware/auth.js";

// All friend routes are protected
router.use(protect);

router.post("/request", sendFriendRequest);
router.put("/accept/:requesterId", acceptFriendRequest);
router.delete("/reject/:requesterId", rejectFriendRequest);
router.get("/", getFriends);
router.get("/requests/pending", getPendingRequests);

export default router;