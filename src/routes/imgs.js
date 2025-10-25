import express from "express";
import dotenv from "dotenv";
import db from "../config/database.js";
import SetTracker from "../config/setTracker.js";
import { randomBytes } from "crypto";
import * as fs from "node:fs";
import haversine from "haversine-distance";

dotenv.config();

const IMAGE_STORAGE_PATH = process.env.IMAGE_STORAGE_PATH;

const router = express.Router();

/**
 * GET /imgs/:id
 * Returns a specific image
 */
router.get("/:id", async (req, res) => {
    const id = req.params.id;

    // Ensure the user has completed or skipped previous images in the set
    if (!SetTracker.canAccessImage(req.user.id, id)) {
        return res.status(403).json({
            success: false,
            error: "Access to this image is forbidden until previous images are completed or skipped"
        });
    }

    try {
        // Get the image path from metadata
        const imgMeta = await db.get("SELECT path FROM imgs WHERE id = ?;", id);
        if (!imgMeta) {
            return res.status(404).json({
                success: false,
                error: "Image not found"
            });
        }

        // Get the image file from storage
        const imgPath = `${IMAGE_STORAGE_PATH}/${imgMeta.path}`;
        return res.sendFile(imgPath);
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            error: "Oopsies! Internal server error :("
        });
    }
});

/**
 * GET /imgs/:id/meta
 * Returns metadata for a specific image
 */
router.get("/:id/meta", async (req, res) => {
    const id = req.params.id;

    try {
        // Get the image path from metadata
        const imgMeta = await db.get("SELECT id, title, set_id, seq_no FROM imgs WHERE id = ?;", id);
        if (!imgMeta) {
            return res.status(404).json({
                success: false,
                error: "Image not found"
            });
        }

        return res.status(200).json({
            success: true,
            id: imgMeta.id,
            title: imgMeta.title,
            set_id: imgMeta.set_id,
            seq_no: imgMeta.seq_no
        })
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            error: "Oopsies! Internal server error :("
        });
    }
});

/**
 * GET /imgs/:id/hint
 * Returns the hint for a specific image
 */
router.get("/:id/hint", async (req, res) => {
    const id = req.params.id;

    try {
        // Get the image path from metadata
        const imgMeta = await db.get("SELECT hint FROM imgs WHERE id = ?;", id);
        if (!imgMeta) {
            return res.status(404).json({
                success: false,
                error: "Image not found"
            });
        }

        // mark image as hinted in SetTracker
        SetTracker.hintImg(req.user.id, id);

        return res.status(200).json({
            success: true,
            hint: imgMeta.hint
        })
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            error: "Oopsies! Internal server error :("
        });
    }
});

/**
 * POST /imgs/:id/outcome
 * Indicates whether the user skipped or completed the image
 */
router.post("/:id/outcome", async (req, res) => {
    const id = req.params.id;
    const { skipped, completed, lat, lng } = req.body;

    // validate booleans
    if (typeof skipped !== 'boolean' || typeof completed !== 'boolean') {
        return res.status(400).json({
            success: false,
            error: "Invalid request body"
        });
    }

    // ensure only one of skipped or completed is true
    if (skipped && completed) {
        return res.status(400).json({
            success: false,
            error: "Invalid request body"
        });
    }

    // validate lat lng if completed
    if (completed) {
        if (typeof lat !== 'number' || typeof lng !== 'number') {
            return res.status(400).json({
                success: false,
                error: "Invalid request body"
            });
        }
    }

    // Ensure the user has started the set containing this image
    if (!SetTracker.hasInstance(req.user.id)) {
        return res.status(400).json({
            success: false,
            error: "User has not started the set containing this image"
        });
    }

    // Ensure the user has completed or skipped previous images in the set
    if (!SetTracker.canAccessImage(req.user.id, id)) {
        return res.status(403).json({
            success: false,
            error: "Cannot submit outcome for this image until previous images are completed or skipped"
        });
    }

    // if skipped, update the SetTracker instance accordingly
    if (skipped) {
        SetTracker.skipImg(req.user.id, id);
        return res.status(200).json({
            success: true,
        });
    }

    // if completed, add evidence to database and send the id for evidence submission
    if (completed) {
        try {
            // check if the lat lng are within 100 meters of the image's target location
            const imgMeta = await db.get("SELECT lat, lng FROM imgs WHERE id = ?;", id);
            if (!imgMeta) {
                return res.status(404).json({
                    success: false,
                    error: "Image not found"
                });
            }
            const authoritativeCoord = {
                latitude: imgMeta.lat,
                longitude: imgMeta.lng
            };
            const userCoord = {
                latitude: lat,
                longitude: lng
            };
            const distance = haversine(authoritativeCoord, userCoord);
            console.log("Distance is: " + distance);
            if (distance > 100) {
                return res.status(400).json({
                    success: false,
                    error: "Submitted location is too far from the target location"
                });
            }

            const path = `evidence_user${req.user.id}_img${id}_${Date.now()}_${randomBytes(4).toString('hex')}.jpg`;
            const result = await db.run("INSERT INTO evidence (img_id, user_id, path, lat, lng) VALUES (?, ?, ?, ?, ?);", id, req.user.id, path, lat, lng);
            const evidenceId = result.lastID;
            return res.status(200).json({
                success: true,
                evidence_id: evidenceId
            });
        }
        catch (error) {
            return res.status(500).json({
                success: false,
                error: "Oopsies! Internal server error :("
            });
        }
    }
});

/**
 * POST /imgs/:id/submit
 * Endpoint for submitting the image evidence
 */
router.post("/:id/submit", async (req, res) => {
    const id = req.params.id;

    // try to get the path from the evidence table
    try {
        const evidence = await db.get("SELECT path FROM evidence WHERE id = ? AND user_id = ?;", id, req.user.id);
        if (!evidence) {
            return res.status(404).json({
                success: false,
                error: "Evidence not found"
            });
        }
        const imgPath = `${IMAGE_STORAGE_PATH}/${evidence.path}`;

        // write image file to storage (from body)
        // assuming the body is just the image
        req.pipe(fs.createWriteStream(imgPath));

        // mark the image as completed in SetTracker
        SetTracker.completeImg(req.user.id, id);

        return res.status(200).json({
            success: true,
        });
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            error: "Oopsies! Internal server error :("
        });
    }
});

// For creating sets

/**
 * POST /imgs/:id
 * Used to upload an image file for a specific image id
 */
router.post("/:id", async (req, res) => {
    const id = req.params.id;
    try {
        // Get the image path from metadata
        const imgMeta = await db.get("SELECT path FROM imgs WHERE id = ?;", id);
        if (!imgMeta) {
            return res.status(404).json({
                success: false,
                error: "Image not found"
            });
        }

        const imgPath = `${IMAGE_STORAGE_PATH}/${imgMeta.path}`;

        // write image file to storage (from body)
        // assuming the body is just the image
        req.pipe(fs.createWriteStream(imgPath));

        return res.status(200).json({
            success: true,
        });
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            error: "Oopsies! Internal server error :("
        });
    }
});

export default router;