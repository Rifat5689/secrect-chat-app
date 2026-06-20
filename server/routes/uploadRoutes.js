import express from "express";
import multer from "multer";
import cloudinary from "../config/cloudinary.js";
import { protect } from "../middleware/auth.js";
import { sendSuccess, sendError } from "../utils/response.js";

const router = express.Router();
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB limit for video
  },
});

router.post("/", protect, upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return sendError(res, 400, "No file uploaded.");
    }

    // Determine resource type based on mimetype
    let resourceType = "raw";
    let fileType = "text";
    if (req.file.mimetype.startsWith("image/")) {
      resourceType = "image";
      fileType = "image";
    } else if (req.file.mimetype.startsWith("video/")) {
      resourceType = "video";
      fileType = "video";
    }

    // Upload using stream
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        resource_type: resourceType,
        folder: "chatapp",
      },
      (error, result) => {
        if (error) {
          console.error("Cloudinary upload error:", error);
          return sendError(res, 500, "Upload to Cloudinary failed.");
        }
        return sendSuccess(res, 200, "File uploaded successfully.", {
          url: result.secure_url,
          fileType,
        });
      }
    );

    uploadStream.end(req.file.buffer);
  } catch (error) {
    console.error("Upload route error:", error);
    return sendError(res, 500, "Server error during file upload.");
  }
});

export default router;
