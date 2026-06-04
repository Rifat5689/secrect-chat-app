import Message from "../models/Message.js";
import User from "../models/User.js";

/*
  Online Users Map
  ────────────────
  Keeps track of which socket ID belongs to which user ID.
  This lets us find a user's socket to send them messages directly.

  Format: { userId: socketId }
*/
const onlineUsers = new Map();

const setupSocketHandlers = (io) => {
  // ── Socket Authentication is handled in middleware ──────
  // By the time we reach here, socket.user is already set.

  io.on("connection", async (socket) => {
    const userId = socket.user._id.toString();

    console.log(`🔌  User connected: ${socket.user.name} (${socket.id})`);

    // ── 1. Mark user as online ─────────────────────────────
    onlineUsers.set(userId, socket.id);

    await User.findByIdAndUpdate(userId, { isOnline: true });

    // Tell all the user's friends that they came online
    socket.user.friends.forEach((friendId) => {
      const friendSocketId = onlineUsers.get(friendId.toString());
      if (friendSocketId) {
        io.to(friendSocketId).emit("friend:online", { userId });
      }
    });

    // ── 2. Join a personal room (for direct delivery) ──────
    // Each user joins a room named after their own userId.
    // We can use this room to send targeted messages.
    socket.join(userId);

    // ── 3. Deliver any pending "sent" messages ─────────────
    // If the user reconnects, mark messages sent to them as "delivered"
    const pendingMessages = await Message.find({
      receiver: userId,
      status: "sent",
    });

    if (pendingMessages.length > 0) {
      // Update all to "delivered" in DB
      await Message.updateMany(
        { receiver: userId, status: "sent" },
        { $set: { status: "delivered" } }
      );

      // Notify each sender about the delivery
      pendingMessages.forEach((msg) => {
        const senderSocketId = onlineUsers.get(msg.sender.toString());
        if (senderSocketId) {
          io.to(senderSocketId).emit("message:delivered", {
            messageId: msg._id,
            deliveredAt: new Date(),
          });
        }
      });
    }

    // ── 4. Send Message Event ──────────────────────────────
    socket.on("message:send", async (data, callback) => {
      try {
        const { receiverId, text } = data;

        if (!receiverId || !text || text.trim() === "") {
          return callback?.({ success: false, error: "Receiver ID and message text are required." });
        }

        // Security: Make sure they are friends before allowing messaging
        const sender = await User.findById(userId);
        const areFriends = sender.friends.map(String).includes(receiverId.toString());

        if (!areFriends) {
          return callback?.({ success: false, error: "You can only message your friends." });
        }

        // Save message to database with "sent" status
        const newMessage = await Message.create({
          sender: userId,
          receiver: receiverId,
          text: text.trim(),
          status: "sent",
        });

        // Populate sender info for the response
        await newMessage.populate("sender", "name email");

        // ── Acknowledge to the SENDER: single tick ✓ ────────
        callback?.({ success: true, message: newMessage });

        // ── Deliver to the RECEIVER if they are online ───────
        const receiverSocketId = onlineUsers.get(receiverId.toString());

        if (receiverSocketId) {
          // Send message to the receiver
          io.to(receiverSocketId).emit("message:receive", { message: newMessage });

          // Update status to "delivered" in DB
          await Message.findByIdAndUpdate(newMessage._id, { status: "delivered" });

          // Notify the SENDER: double tick ✓✓
          socket.emit("message:delivered", {
            messageId: newMessage._id,
            deliveredAt: new Date(),
          });
        }
      } catch (error) {
        console.error("message:send error:", error.message);
        callback?.({ success: false, error: "Failed to send message." });
      }
    });

    // ── 5. Read Receipt Event ──────────────────────────────
    // Frontend calls this when the user opens a chat
    socket.on("message:read", async (data) => {
      try {
        const { senderId } = data; // The friend whose messages we just read

        // Update all messages from that sender → "read"
        await Message.updateMany(
          {
            sender: senderId,
            receiver: userId,
            status: { $in: ["sent", "delivered"] },
          },
          { $set: { status: "read" } }
        );

        // Notify the SENDER: blue double tick ✓✓ (blue)
        const senderSocketId = onlineUsers.get(senderId.toString());
        if (senderSocketId) {
          io.to(senderSocketId).emit("message:read", {
            readBy: userId,
            readAt: new Date(),
          });
        }
      } catch (error) {
        console.error("message:read error:", error.message);
      }
    });

    // ── 6. Typing Indicator ────────────────────────────────
    socket.on("typing:start", ({ receiverId }) => {
      const receiverSocketId = onlineUsers.get(receiverId.toString());
      if (receiverSocketId) {
        io.to(receiverSocketId).emit("typing:start", { senderId: userId });
      }
    });

    socket.on("typing:stop", ({ receiverId }) => {
      const receiverSocketId = onlineUsers.get(receiverId.toString());
      if (receiverSocketId) {
        io.to(receiverSocketId).emit("typing:stop", { senderId: userId });
      }
    });

    // ── 7. Disconnect ──────────────────────────────────────
    socket.on("disconnect", async () => {
      console.log(`🔌  User disconnected: ${socket.user.name}`);

      onlineUsers.delete(userId);

      const lastSeen = new Date();
      await User.findByIdAndUpdate(userId, {
        isOnline: false,
        lastSeen,
      });

      // Tell all friends that the user went offline
      socket.user.friends.forEach((friendId) => {
        const friendSocketId = onlineUsers.get(friendId.toString());
        if (friendSocketId) {
          io.to(friendSocketId).emit("friend:offline", { userId, lastSeen });
        }
      });
    });
  });
};

export { setupSocketHandlers };