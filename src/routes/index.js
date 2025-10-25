import express from "express";
import setsRoutes from "./sets.js";
import imgsRoutes from "./imgs.js";

const router = express.Router();

// Mount routes
router.use("/sets", setsRoutes);
router.use("/imgs", imgsRoutes);

export default router;