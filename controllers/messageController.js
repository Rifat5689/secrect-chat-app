import Message from "../models/Message.js";
import User from "../models/User.js";
import { sendSuccess, sendError } from "../utils/response.js";

// ── Get Conversation Between Two Users ────────────────────
// Also marks all unread messages as "read" when you open the chat
const getConversation = async (req, res) => {
  try {
    const currentUserId = req.user._id;
    const { friendId } = req.params;

    // Make sure they are actually friends
    const currentUser = await User.findById(currentUserId);
    const areFriends = currentUser.friends.includes(friendId);

    if (!areFriends) {
      return sendError(res, 403, "You can only view conversations with your friends.");
    }

    // Fetch messages between these two users (both directions)
    const messages = await Message.find({
      $or: [
        { sender: currentUserId, receiver: friendId },
        { sender: friendId, receiver: currentUserId },
      ],
      // Exclude messages deleted by the current user
      deletedBy: { $nin: [currentUserId] },
      isDeletedForEveryone: false,
    })
      .sort({ createdAt: 1 }) // Oldest first
      .populate("sender", "name email")
      .populate("receiver", "name email");

    // Mark all messages SENT BY the friend as "read"
    await Message.updateMany(
      {
        sender: friendId,
        receiver: currentUserId,
        status: { $in: ["sent", "delivered"] },
      },
      { $set: { status: "read" } }
    );

    return sendSuccess(res, 200, "Conversation fetched.", { messages });
  } catch (error) {
    console.error("Get conversation error:", error.message);
    return sendError(res, 500, "Could not fetch conversation.");
  }
};

// ── Delete a Message For Me ───────────────────────────────
const deleteMessageForMe = async (req, res) => {
  try {
    const { messageId } = req.params;
    const currentUserId = req.user._id;

    const message = await Message.findById(messageId);

    if (!message) {
      return sendError(res, 404, "Message not found.");
    }

    // Add current user to the deletedBy list
    if (!message.deletedBy.includes(currentUserId)) {
      message.deletedBy.push(currentUserId);
      await message.save();
    }

    return sendSuccess(res, 200, "Message deleted for you.");
  } catch (error) {
    console.error("Delete message error:", error.message);
    return sendError(res, 500, "Could not delete message.");
  }
};

// ── Delete a Message For Everyone ─────────────────────────
const deleteMessageForEveryone = async (req, res) => {
  try {
    const { messageId } = req.params;
    const currentUserId = req.user._id;

    const message = await Message.findById(messageId);

    if (!message) {
      return sendError(res, 404, "Message not found.");
    }

    // Only the sender can delete for everyone
    if (message.sender.toString() !== currentUserId.toString()) {
      return sendError(res, 403, "You can only delete your own messages for everyone.");
    }

    message.isDeletedForEveryone = true;
    message.text = "This message was deleted.";
    await message.save();

    return sendSuccess(res, 200, "Message deleted for everyone.");
  } catch (error) {
    console.error("Delete for everyone error:", error.message);
    return sendError(res, 500, "Could not delete message.");
  }
};

export { getConversation, deleteMessageForMe, deleteMessageForEveryone };