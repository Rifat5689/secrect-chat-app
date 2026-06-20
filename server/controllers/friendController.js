import User from "../models/User.js";
import { sendSuccess, sendError } from "../utils/response.js";
import { onlineUsers } from "../socket/socketHandlers.js";

// ── Send a Friend Request ─────────────────────────────────
const sendFriendRequest = async (req, res) => {
  try {
    const { mobilenumber } = req.body;
    const currentUser = req.user;

    if (!mobilenumber) {
      return sendError(res, 400, "Please provide the mobile number of the person you want to add.");
    }

    const trimmedMobile = mobilenumber.trim();

    // Can't add yourself
    if (trimmedMobile === currentUser.mobilenumber) {
      return sendError(res, 400, "You cannot send a friend request to yourself.");
    }

    // Find the target user
    const targetUser = await User.findOne({ mobilenumber: trimmedMobile });

    if (!targetUser) {
      return sendError(res, 404, "No user found with that mobile number.");
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

      // Notify target user if online
      const targetSocketId = onlineUsers.get(targetUser._id.toString());
      if (targetSocketId) {
        const io = req.app.get("io");
        if (io) {
          io.to(targetSocketId).emit("friend:accepted", {
            friend: {
              _id: currentUser._id,
              name: currentUser.name,
              mobilenumber: currentUser.mobilenumber,
              avatar: currentUser.avatar,
              isOnline: true,
            }
          });
        }
      }

      return sendSuccess(res, 200, "You are now friends!", {
        friend: {
          id: targetUser._id,
          name: targetUser.name,
          mobilenumber: targetUser.mobilenumber,
          avatar: targetUser.avatar,
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

    // Notify target user if online
    const targetSocketId = onlineUsers.get(targetUser._id.toString());
    if (targetSocketId) {
      const io = req.app.get("io");
      if (io) {
        io.to(targetSocketId).emit("friend:request", {
          request: {
            from: {
              _id: currentUser._id,
              name: currentUser.name,
              mobilenumber: currentUser.mobilenumber,
              avatar: currentUser.avatar,
            }
          }
        });
      }
    }

    return sendSuccess(res, 200, "Friend request sent successfully.", {
      sentTo: {
        id: targetUser._id,
        name: targetUser.name,
        mobilenumber: targetUser.mobilenumber,
        avatar: targetUser.avatar,
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

    const newFriend = await User.findById(requesterId).select("name mobilenumber avatar");

    // Notify the requester that the request was accepted
    const requesterSocketId = onlineUsers.get(requesterId.toString());
    if (requesterSocketId) {
      const io = req.app.get("io");
      if (io) {
        io.to(requesterSocketId).emit("friend:accepted", {
          friend: {
            _id: currentUser._id,
            name: currentUser.name,
            mobilenumber: currentUser.mobilenumber,
            avatar: currentUser.avatar,
            isOnline: true,
          }
        });
      }
    }

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
      $pull: { "friendRequests.sent": { to: requesterId } }, // Clean up requester's sent requests
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
      .populate("friends", "name mobilenumber avatar isOnline lastSeen")
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
      .populate("friendRequests.received.from", "name mobilenumber avatar")
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