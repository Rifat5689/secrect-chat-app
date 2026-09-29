import express from "express";
import { adminProtect } from "../middleware/auth.js";
import { getAllUsers, deleteUser, getAllMedia, deleteMedia } from "../controllers/adminController.js";

const router = express.Router();

// Apply adminProtect middleware to all routes in this file
router.use(adminProtect);

router.get("/users", getAllUsers);
router.delete("/users/:id", deleteUser);

router.get("/media", getAllMedia);
router.delete("/media/:id", deleteMedia);

export default router;
