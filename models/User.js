import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
    // ── Identity ──────────────────────────────────────────
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      minlength: [2, "Name must be at least 2 characters"],
      maxlength: [50, "Name cannot exceed 50 characters"],
    },

    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Please enter a valid email"],
    },

    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters"],
      select: false, // Never return password in queries by default
    },

    avatar: {
      type: String,
      default: "",
    },

    // ── Account Status ────────────────────────────────────
    isVerified: {
      type: Boolean,
      default: false,
    },

    isOnline: {
      type: Boolean,
      default: false,
    },

    lastSeen: {
      type: Date,
      default: Date.now,
    },

    // ── OTP for Email Verification ────────────────────────
    otp: {
      code: { type: String, select: false },
      expiresAt: { type: Date, select: false },
    },

    // ── Friend System ─────────────────────────────────────
    friends: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    friendRequests: {
      // Requests this user has RECEIVED
      received: [
        {
          from: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
          sentAt: { type: Date, default: Date.now },
        },
      ],

      // Requests this user has SENT
      sent: [
        {
          to: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
          sentAt: { type: Date, default: Date.now },
        },
      ],
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt automatically
  }
);

// ── Hash password before saving ────────────────────────────
userSchema.pre("save", async function (next) {
  // Only hash if the password was changed
  if (!this.isModified("password")) return next();

  const saltRounds = 12;
  this.password = await bcrypt.hash(this.password, saltRounds);
  next();
});

// ── Method: Check if password is correct ──────────────────
userSchema.methods.isPasswordCorrect = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// ── Method: Check if OTP is valid ─────────────────────────
userSchema.methods.isOtpValid = function (enteredOtp) {
  return this.otp.code === enteredOtp && this.otp.expiresAt > Date.now();
};

const User = mongoose.model("User", userSchema);

export default User;