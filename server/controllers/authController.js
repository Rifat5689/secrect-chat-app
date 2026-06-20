import User from "../models/User.js";
import { generateToken } from "../utils/jwt.js";
import { sendSuccess, sendError } from "../utils/response.js";

// ── Register ──────────────────────────────────────────────
const register = async (req, res) => {
  try {
    const { name, mobilenumber, password } = req.body;

    // Basic validation
    if (!name || !mobilenumber || !password) {
      return sendError(res, 400, "Name, mobile number, and password are all required.");
    }

    if (mobilenumber.length < 8 || mobilenumber.length > 15) {
      return sendError(res, 400, "Mobile number must be between 8 and 15 digits.");
    }

    if (password.length < 6) {
      return sendError(res, 400, "Password must be at least 6 characters.");
    }

    // Check if mobilenumber is already taken
    const existingUser = await User.findOne({ mobilenumber });

    if (existingUser) {
      return sendError(res, 409, "An account with this mobile number already exists.");
    }

    // Create user
    const user = await User.create({
      name,
      mobilenumber,
      password,
      isVerified: true,
    });

    const token = generateToken(user._id);

    return sendSuccess(res, 201, "Account created successfully! Welcome.", {
      token,
      user: {
        id: user._id,
        name: user.name,
        mobilenumber: user.mobilenumber,
      },
    });
  } catch (error) {
    console.error("Register error:", error.message);
    return sendError(res, 500, "Registration failed. Please try again.");
  }
};

// ── Login ─────────────────────────────────────────────────
const login = async (req, res) => {
  try {
    const { mobilenumber, password } = req.body;

    if (!mobilenumber || !password) {
      return sendError(res, 400, "Mobile number and password are required.");
    }

    // Find user and include password for comparison
    const user = await User.findOne({ mobilenumber }).select("+password");

    if (!user) {
      return sendError(res, 401, "Invalid mobile number or password.");
    }

    // Compare passwords
    const isMatch = await user.isPasswordCorrect(password);

    if (!isMatch) {
      return sendError(res, 401, "Invalid mobile number or password.");
    }

    // Issue JWT token
    const token = generateToken(user._id);

    return sendSuccess(res, 200, "Login successful.", {
      token,
      user: {
        id: user._id,
        name: user.name,
        mobilenumber: user.mobilenumber,
        avatar: user.avatar,
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

export { register, login, getMyProfile };