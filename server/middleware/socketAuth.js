import User from "../models/User.js";
import { verifyToken } from "../utils/jwt.js";

/**
 * Socket.IO Authentication Middleware
 * ─────────────────────────────────────
 * The frontend must send the JWT in the socket handshake:
 *
 *   const socket = io("http://localhost:5000", {
 *     auth: { token: "Bearer <your_jwt_token>" }
 *   });
 *
 * This middleware verifies the token before the connection is established.
 */
const socketAuth = async (socket, next) => {
  try {
    // 1. Get the token from the handshake auth object
    const rawToken = socket.handshake.auth?.token;

    if (!rawToken) {
      return next(new Error("Authentication error: No token provided."));
    }

    // 2. Strip "Bearer " prefix if present
    const token = rawToken.startsWith("Bearer ") ? rawToken.split(" ")[1] : rawToken;

    // 3. Verify the token
    const decoded = verifyToken(token);

    // 4. Find the user
    const user = await User.findById(decoded.id).select("-password");

    if (!user) {
      return next(new Error("Authentication error: User not found."));
    }

    // 5. Attach user to the socket object for use in event handlers
    socket.user = user;

    next();
  } catch (error) {
    return next(new Error("Authentication error: Invalid or expired token."));
  }
};

export { socketAuth };