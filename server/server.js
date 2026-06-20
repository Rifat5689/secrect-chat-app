import "dotenv/config";

import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import rateLimit from "express-rate-limit";
import { fileURLToPath } from "url";
import path from "path";

import connectDatabase from "./config/database.js";
import { socketAuth } from "./middleware/socketAuth.js";
import { setupSocketHandlers } from "./socket/socketHandlers.js";

import authRoutes from "./routes/authRoutes.js";
import friendRoutes from "./routes/friendRoutes.js";
import messageRoutes from "./routes/messageRoutes.js";
import uploadRoutes from "./routes/uploadRoutes.js";

// ── Initialize Express and HTTP Server ────────────────────
const app = express();
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const server = http.createServer(app);

// ── Initialize Socket.IO ───────────────────────────────────
const io = new Server(server, {
  cors: {
    origin: "*", // Allow all connections
    methods: ["GET", "POST"],
  },
});
app.set("io", io);

// ── Connect to MongoDB ─────────────────────────────────────
connectDatabase();

// ── Global Middleware ──────────────────────────────────────

// Allow requests from all origins
app.use(cors());

// Parse incoming JSON request bodies
app.use(express.json());

// Rate limiting: max 1000 requests per 15 minutes per IP (raised limits for files/chats)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000,
  message: { success: false, message: "Too many requests. Please try again later." },
});
app.use(limiter);

// ── REST API Routes ────────────────────────────────────────
app.use("/api/auth", authRoutes);
app.use("/api/friends", friendRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/upload", uploadRoutes);

// ── Health Check Route ─────────────────────────────────────
app.get("/api/health", (req, res) => {
  res.json({ success: true, message: "ChatApp server is running ✅" });
});

// ── 404 Handler ────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, message: "Route not found." });
});

// ── Socket.IO Auth Middleware ──────────────────────────────
io.use(socketAuth);

// ── Socket.IO Event Handlers ───────────────────────────────
setupSocketHandlers(io);

// ── Start the Server ───────────────────────────────────────
const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`🚀  Server running on port ${PORT}`);
});