import mongoose from "mongoose";

/*
  Message Status Flow (like WhatsApp):
  ─────────────────────────────────────
  "sent"      → Server received the message      (single grey tick  ✓ )
  "delivered" → Recipient's device received it   (double grey tick  ✓✓)
  "read"      → Recipient opened the chat        (double blue tick  ✓✓ in blue)
*/

const messageSchema = new mongoose.Schema(
  {
    // ── Participants ───────────────────────────────────────
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    receiver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // ── Content ────────────────────────────────────────────
    text: {
      type: String,
      required: [true, "Message text cannot be empty"],
      trim: true,
      maxlength: [5000, "Message cannot exceed 5000 characters"],
    },

    // ── Delivery Status ────────────────────────────────────
    status: {
      type: String,
      enum: ["sent", "delivered", "read"],
      default: "sent",
    },

    // ── Soft Delete (like WhatsApp "delete for me") ────────
    deletedBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    isDeletedForEveryone: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// ── Index for fast conversation queries ───────────────────
// Fetching all messages between two users will be very fast
messageSchema.index({ sender: 1, receiver: 1 });
messageSchema.index({ createdAt: -1 });

const Message = mongoose.model("Message", messageSchema);

export default Message;