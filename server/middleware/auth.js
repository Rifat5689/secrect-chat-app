import User from "../models/User.js";
import { verifyToken } from "../utils/jwt.js";
import { sendError } from "../utils/response.js";

/**
 * Protect Middleware
 * ──────────────────
 * Checks the Authorization header for a valid Bearer JWT.
 * If valid, attaches the full user object to req.user and calls next().
 * If not, returns a 401 Unauthorized error.
 */
const protect = async (req, res, next) => {
  try {
    // 1. Check if the Authorization header exists
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return sendError(res, 401, "Access denied. No token provided.");
    }

    // 2. Extract the token from "Bearer <token>"
    const token = authHeader.split(" ")[1];

    // 3. Verify the token
    const decoded = verifyToken(token);

    // 4. Find the user in the database (exclude password)
    const user = await User.findById(decoded.id).select("-password");

    if (!user) {
      return sendError(res, 401, "User belonging to this token no longer exists.");
    }

    // 5. Attach user to the request object
    req.user = user;

    next();
  } catch (error) {
    // JWT errors (expired, invalid signature, etc.)
    if (error.name === "JsonWebTokenError") {
      return sendError(res, 401, "Invalid token. Please log in again.");
    }
    if (error.name === "TokenExpiredError") {
      return sendError(res, 401, "Token has expired. Please log in again.");
    }

    return sendError(res, 500, "Authentication failed.");
  }
};

export { protect };