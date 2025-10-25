import express from "express";
import setsRoutes from "./sets.js";
import imgsRoutes from "./imgs.js";
import authRoutes from "./auth.js";
import {requireAuth} from "../middleware/auth.js";

const router = express.Router();

// Mount routes
router.use("/sets", requireAuth, setsRoutes);
router.use("/imgs", requireAuth, imgsRoutes);
router.use("/auth", authRoutes);

export default router;