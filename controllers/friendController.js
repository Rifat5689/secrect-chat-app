import User from "../models/User.js";
import { sendSuccess, sendError } from "../utils/response.js";

// ── Send a Friend Request ─────────────────────────────────
const sendFriendRequest = async (req, res) => {
  try {
    const { email } = req.body;
    const currentUser = req.user;

    if (!email) {
      return sendError(res, 400, "Please provide the email of the person you want to add.");
    }

    // Can't add yourself
    if (email === currentUser.email) {
      return sendError(res, 400, "You cannot send a friend request to yourself.");
    }

    // Find the target user
    const targetUser = await User.findOne({ email });

    if (!targetUser) {
      return sendError(res, 404, "No user found with that email address.");
    }

    // Check if already friends
    const alreadyFriends = currentUser.friends.includes(targetUser._id);
    if (alreadyFriends) {
      return sendError(res, 400, "You are already friends with this person.");
    }

    // Check if a request was already sent
    const alreadySent = currentUser.friendRequests.sent.some(
      (req) => req.to.toString() === targetUser._id.toString()
    );
    if (alreadySent) {
      return sendError(res, 400, "You have already sent a friend request to this person.");
    }

    // Check if the other person already sent YOU a request → auto-accept
    const theyAlreadySentRequest = currentUser.friendRequests.received.some(
      (req) => req.from.toString() === targetUser._id.toString()
    );

    if (theyAlreadySentRequest) {
      // Auto accept: add to friends on both sides
      await User.findByIdAndUpdate(currentUser._id, {
        $push: { friends: targetUser._id },
        $pull: { "friendRequests.received": { from: targetUser._id } },
      });

      await User.findByIdAndUpdate(targetUser._id, {
        $push: { friends: currentUser._id },
        $pull: { "friendRequests.sent": { to: currentUser._id } },
      });

      return sendSuccess(res, 200, "You are now friends!", {
        friend: {
          id: targetUser._id,
          name: targetUser.name,
          email: targetUser.email,
        },
      });
    }

    // Normal case: add to sent/received lists
    await User.findByIdAndUpdate(currentUser._id, {
      $push: { "friendRequests.sent": { to: targetUser._id } },
    });

    await User.findByIdAndUpdate(targetUser._id, {
      $push: { "friendRequests.received": { from: currentUser._id } },
    });

    return sendSuccess(res, 200, "Friend request sent successfully.", {
      sentTo: {
        id: targetUser._id,
        name: targetUser.name,
        email: targetUser.email,
      },
    });
  } catch (error) {
    console.error("Send friend request error:", error.message);
    return sendError(res, 500, "Could not send friend request.");
  }
};

// ── Accept a Friend Request ───────────────────────────────
const acceptFriendRequest = async (req, res) => {
  try {
    const { requesterId } = req.params; // The ID of the person who sent the request
    const currentUser = req.user;

    // Make sure the request actually exists
    const requestExists = currentUser.friendRequests.received.some(
      (req) => req.from.toString() === requesterId
    );

    if (!requestExists) {
      return sendError(res, 404, "No friend request found from this user.");
    }

    // Add each other as friends and clean up the request
    await User.findByIdAndUpdate(currentUser._id, {
      $push: { friends: requesterId },
      $pull: { "friendRequests.received": { from: requesterId } },
    });

    await User.findByIdAndUpdate(requesterId, {
      $push: { friends: currentUser._id },
      $pull: { "friendRequests.sent": { to: currentUser._id } },
    });

    const newFriend = await User.findById(requesterId).select("name email avatar");

    return sendSuccess(res, 200, "Friend request accepted! You are now connected.", {
      friend: newFriend,
    });
  } catch (error) {
    console.error("Accept friend request error:", error.message);
    return sendError(res, 500, "Could not accept friend request.");
  }
};

// ── Reject a Friend Request ───────────────────────────────
const rejectFriendRequest = async (req, res) => {
  try {
    const { requesterId } = req.params;
    const currentUser = req.user;

    await User.findByIdAndUpdate(currentUser._id, {
      $pull: { "friendRequests.received": { from: requesterId } },
    });

    await User.findByIdAndUpdate(requesterId, {
      $pull: { "friendRequests.sent": { to: currentUser._id } },
    });

    return sendSuccess(res, 200, "Friend request rejected.");
  } catch (error) {
    console.error("Reject friend request error:", error.message);
    return sendError(res, 500, "Could not reject friend request.");
  }
};

// ── Get My Friends List ───────────────────────────────────
const getFriends = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate("friends", "name email avatar isOnline lastSeen")
      .select("friends");

    return sendSuccess(res, 200, "Friends list fetched.", {
      friends: user.friends,
    });
  } catch (error) {
    console.error("Get friends error:", error.message);
    return sendError(res, 500, "Could not fetch friends list.");
  }
};

// ── Get Pending Friend Requests (received) ────────────────
const getPendingRequests = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate("friendRequests.received.from", "name email avatar")
      .select("friendRequests.received");

    return sendSuccess(res, 200, "Pending friend requests fetched.", {
      requests: user.friendRequests.received,
    });
  } catch (error) {
    console.error("Get pending requests error:", error.message);
    return sendError(res, 500, "Could not fetch pending requests.");
  }
};

export {
  sendFriendRequest,
  acceptFriendRequest,
  rejectFriendRequest,
  getFriends,
  getPendingRequests,
};