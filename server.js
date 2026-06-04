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

// ── Initialize Express and HTTP Server ────────────────────
const app = express();
const __dirname = path.dirname(fileURLToPath(import.meta.url));
app.use(express.static(path.join(__dirname, "public")));
const server = http.createServer(app);

// ── Initialize Socket.IO ───────────────────────────────────
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || "*", // Set your frontend URL in .env
    methods: ["GET", "POST"],
  },
});

// ── Connect to MongoDB ─────────────────────────────────────
connectDatabase();

// ── Global Middleware ──────────────────────────────────────

// Allow requests from the frontend
app.use(cors());

// Parse incoming JSON request bodies
app.use(express.json());

// Rate limiting: max 100 requests per 15 minutes per IP
// This helps prevent spam and brute-force attacks
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: { success: false, message: "Too many requests. Please try again later." },
});
app.use(limiter);

// Stricter limit for auth routes to prevent brute-force
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { success: false, message: "Too many login attempts. Please try again in 15 minutes." },
});
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index (1).html"));
});
// ── REST API Routes ────────────────────────────────────────
app.use("/api/auth", authLimiter, authRoutes);
app.use("/api/friends", friendRoutes);
app.use("/api/messages", messageRoutes);

// ── Health Check Route ─────────────────────────────────────
app.get("/", (req, res) => {
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