import express from "express";
const router = express.Router();

import {
  getConversation,
  deleteMessageForMe,
  deleteMessageForEveryone,
} from "../controllers/messageController.js";

import { protect } from "../middleware/auth.js";

// All message routes are protected
router.use(protect);

router.get("/conversation/:friendId", getConversation);
router.delete("/:messageId/for-me", deleteMessageForMe);
router.delete("/:messageId/for-everyone", deleteMessageForEveryone);

export default router;