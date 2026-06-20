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
    messageType: {
      type: String,
      enum: ["text", "image", "video"],
      default: "text",
    },

    text: {
      type: String,
      trim: true,
      maxlength: [5000, "Message cannot exceed 5000 characters"],
      default: "",
    },

    fileUrl: {
      type: String,
      default: "",
    },

    // ── Message Reactions ──────────────────────────────────
    reactions: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        emoji: {
          type: String,
          required: true,
        },
      },
    ],

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
messageSchema.index({ sender: 1, receiver: 1 });
messageSchema.index({ createdAt: -1 });

const Message = mongoose.model("Message", messageSchema);

export default Message;