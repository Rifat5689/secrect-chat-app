import User from "../models/User.js";
import Message from "../models/Message.js";
import { sendSuccess, sendError } from "../utils/response.js";

// ── Get All Users ─────────────────────────────────────────
const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password");
    return sendSuccess(res, 200, "Users fetched.", { users });
  } catch (error) {
    return sendError(res, 500, "Failed to fetch users.");
  }
};

// ── Delete User Permanently ───────────────────────────────
const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    await User.findByIdAndDelete(id);
    // Optionally delete all messages sent/received by this user
    await Message.deleteMany({ $or: [{ sender: id }, { receiver: id }] });
    return sendSuccess(res, 200, "User and their messages deleted permanently.");
  } catch (error) {
    return sendError(res, 500, "Failed to delete user.");
  }
};

// ── Get All Media Messages ────────────────────────────────
const getAllMedia = async (req, res) => {
  try {
    // fetch messages that have a fileUrl (media)
    const mediaMessages = await Message.find({ fileUrl: { $ne: "" }, messageType: { $in: ["image", "video", "audio"] } })
      .populate("sender", "name mobilenumber")
      .populate("receiver", "name mobilenumber");
    return sendSuccess(res, 200, "Media fetched.", { media: mediaMessages });
  } catch (error) {
    return sendError(res, 500, "Failed to fetch media.");
  }
};

// ── Delete Media Message Permanently ──────────────────────
const deleteMedia = async (req, res) => {
  try {
    const { id } = req.params;
    await Message.findByIdAndDelete(id);
    return sendSuccess(res, 200, "Media message deleted permanently from database.");
  } catch (error) {
    return sendError(res, 500, "Failed to delete media.");
  }
};

export { getAllUsers, deleteUser, getAllMedia, deleteMedia };
