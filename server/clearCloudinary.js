import mongoose from "mongoose";
import "dotenv/config";
import Message from "./models/Message.js";
import User from "./models/User.js";

async function run() {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected.");

    const msgResult = await Message.updateMany(
      { fileUrl: { $regex: /cloudinary\.com/ } },
      { $set: { fileUrl: "", messageType: "text", text: "Media removed from database." } }
    );
    console.log(`Updated ${msgResult.modifiedCount} messages containing Cloudinary URLs.`);

    const userResult = await User.updateMany(
      { avatar: { $regex: /cloudinary\.com/ } },
      { $set: { avatar: "" } }
    );
    console.log(`Updated ${userResult.modifiedCount} users containing Cloudinary avatars.`);

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}
run();
