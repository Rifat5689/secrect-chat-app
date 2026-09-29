import express from "express";
import multer from "multer";
import { PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import crypto from "crypto";
import r2Client from "../config/r2.js";
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

// ── GET Presigned URL Endpoint (Redirects to R2) ───────────
router.get("/file/:key", async (req, res) => {
  try {
    const { key } = req.params;
    
    // Create the command to get the object
    const command = new GetObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: key,
    });

    // Generate a presigned URL valid for 1 hour (3600 seconds)
    const signedUrl = await getSignedUrl(r2Client, command, { expiresIn: 3600 });
    
    // Redirect the browser/client to the presigned URL
    res.redirect(signedUrl);
  } catch (error) {
    console.error("Error generating presigned URL:", error);
    res.status(500).send("Error fetching file.");
  }
});

// ── POST Upload Endpoint ───────────────────────────────────
router.post("/", protect, upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return sendError(res, 400, "No file uploaded.");
    }

    // Determine file type
    let fileType = "text";
    if (req.file.mimetype.startsWith("image/")) {
      fileType = "image";
    } else if (req.file.mimetype.startsWith("video/")) {
      fileType = "video";
    } else if (req.file.mimetype.startsWith("audio/")) {
      fileType = "audio";
    }

    // Generate unique filename/key
    const extension = req.file.originalname.split('.').pop() || "bin";
    const uniqueKey = `${crypto.randomBytes(16).toString("hex")}-${Date.now()}.${extension}`;

    // Upload to Cloudflare R2
    const command = new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: uniqueKey,
      Body: req.file.buffer,
      ContentType: req.file.mimetype,
    });

    await r2Client.send(command);

    // Build the proxy URL to our backend GET endpoint
    // Azure proxies via http initially, so we check x-forwarded-proto if available
    const protocol = req.headers['x-forwarded-proto'] || req.protocol;
    const proxyUrl = `${protocol}://${req.get("host")}/api/upload/file/${uniqueKey}`;

    return sendSuccess(res, 200, "File uploaded successfully.", {
      url: proxyUrl,
      fileType,
    });
  } catch (error) {
    console.error("Upload route error:", error);
    return sendError(res, 500, "Server error during file upload.");
  }
});

export default router;
