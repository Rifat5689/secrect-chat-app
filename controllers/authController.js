import User from "../models/User.js";
import { generateToken } from "../utils/jwt.js";
import { sendOtpEmail, generateOtp } from "../utils/email.js";
import { sendSuccess, sendError } from "../utils/response.js";

// ── Register: Step 1 ──────────────────────────────────────
// User submits name, email, password → we send them an OTP
const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Basic validation
    if (!name || !email || !password) {
      return sendError(res, 400, "Name, email, and password are all required.");
    }

    // Check if email is already taken
    const existingUser = await User.findOne({ email });

    if (existingUser && existingUser.isVerified) {
      return sendError(res, 409, "An account with this email already exists.");
    }

    // Generate OTP
    const otp = generateOtp();
    const otpExpiresAt = new Date(
      Date.now() + process.env.OTP_EXPIRES_MINUTES * 60 * 1000
    );

    // If user exists but never verified, update their info
    // Otherwise create a new user
    let user;

    if (existingUser && !existingUser.isVerified) {
      existingUser.name = name;
      existingUser.password = password;
      existingUser.otp = { code: otp, expiresAt: otpExpiresAt };
      user = await existingUser.save();
    } else {
      user = await User.create({
        name,
        email,
        password,
        otp: { code: otp, expiresAt: otpExpiresAt },
      });
    }

    // Send OTP via email
    await sendOtpEmail(email, otp);

    return sendSuccess(res, 201, "Registration started. Please check your email for the OTP.", {
      email,
    });
  } catch (error) {
    console.error("Register error:", error.message);
    return sendError(res, 500, "Registration failed. Please try again.");
  }
};

// ── Verify OTP: Step 2 ────────────────────────────────────
// User submits their email + OTP → we mark them as verified and return a token
const verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return sendError(res, 400, "Email and OTP are required.");
    }

    // Find user and include OTP fields (they are hidden by default)
    const user = await User.findOne({ email }).select("+otp.code +otp.expiresAt");

    if (!user) {
      return sendError(res, 404, "No account found with this email.");
    }

    if (user.isVerified) {
      return sendError(res, 400, "This account is already verified.");
    }

    // Check OTP validity
    if (!user.isOtpValid(otp)) {
      return sendError(res, 400, "Invalid or expired OTP. Please try again.");
    }

    // Mark user as verified and clear OTP
    user.isVerified = true;
    user.otp = undefined;
    await user.save({ validateBeforeSave: false });

    // Issue JWT token
    const token = generateToken(user._id);

    return sendSuccess(res, 200, "Email verified successfully! Welcome to ChatApp.", {
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("Verify OTP error:", error.message);
    return sendError(res, 500, "Verification failed. Please try again.");
  }
};

// ── Resend OTP ────────────────────────────────────────────
const resendOtp = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return sendError(res, 400, "Email is required.");
    }

    const user = await User.findOne({ email });

    if (!user) {
      return sendError(res, 404, "No account found with this email.");
    }

    if (user.isVerified) {
      return sendError(res, 400, "This account is already verified.");
    }

    const otp = generateOtp();
    const otpExpiresAt = new Date(Date.now() + process.env.OTP_EXPIRES_MINUTES * 60 * 1000);

    user.otp = { code: otp, expiresAt: otpExpiresAt };
    await user.save({ validateBeforeSave: false });

    await sendOtpEmail(email, otp);

    return sendSuccess(res, 200, "A new OTP has been sent to your email.");
  } catch (error) {
    console.error("Resend OTP error:", error.message);
    return sendError(res, 500, "Could not resend OTP. Please try again.");
  }
};

// ── Login ─────────────────────────────────────────────────
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return sendError(res, 400, "Email and password are required.");
    }

    // Find user and include password for comparison
    const user = await User.findOne({ email }).select("+password");

    if (!user) {
      return sendError(res, 401, "Invalid email or password.");
    }

    if (!user.isVerified) {
      return sendError(res, 403, "Please verify your email first.");
    }

    // Compare passwords
    const isMatch = await user.isPasswordCorrect(password);

    if (!isMatch) {
      return sendError(res, 401, "Invalid email or password.");
    }

    // Issue JWT token
    const token = generateToken(user._id);

    return sendSuccess(res, 200, "Login successful.", {
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        isOnline: user.isOnline,
      },
    });
  } catch (error) {
    console.error("Login error:", error.message);
    return sendError(res, 500, "Login failed. Please try again.");
  }
};

// ── Get My Profile ────────────────────────────────────────
const getMyProfile = async (req, res) => {
  try {
    return sendSuccess(res, 200, "Profile fetched successfully.", {
      user: req.user,
    });
  } catch (error) {
    return sendError(res, 500, "Could not fetch profile.");
  }
};

export { register, verifyOtp, resendOtp, login, getMyProfile };