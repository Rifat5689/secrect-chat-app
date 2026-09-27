import mongoose from "mongoose";

const connectDatabase = async () => {
  try {
    const connection = await mongoose.connect(process.env.MONGO_URI);
    console.log(`✅  MongoDB connected: ${connection.connection.host}`);

    // ── Drop stale indexes from old schema versions ──────────
    const db = connection.connection.db;
    try {
      await db.collection("users").dropIndex("phone_1");
      console.log("🧹  Dropped stale index: phone_1");
    } catch (_) {
      // Index doesn't exist — that's fine, ignore the error
    }
  } catch (error) {
    console.error("❌  MongoDB connection failed:", error.message);
    process.exit(1); // Stop the server if DB fails
  }
};

export default connectDatabase;