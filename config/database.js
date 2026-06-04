import mongoose from "mongoose";

const connectDatabase = async () => {
  try {
    const connection = await mongoose.connect(process.env.MONGO_URI);
    console.log(`✅  MongoDB connected: ${connection.connection.host}`);
  } catch (error) {
    console.error("❌  MongoDB connection failed:", error.message);
    process.exit(1); // Stop the server if DB fails
  }
};

export default connectDatabase;