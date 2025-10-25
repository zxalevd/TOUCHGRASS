import express from "express";
import db from "../config/database.js";
import SetTracker from "../config/setTracker.js";

const router = express.Router();

/**
 * GET /sets
 * Returns a list of sets
 */
router.get("/", async (req, res) => {
    const sqlSelectSets = `
        SELECT
            s.id,
            u.username AS creator_username
            s.time_limit
        FROM sets s
        LEFT JOIN users u ON u.id = s.creator_id
        ORDER BY s.id;
    `;

    try {
        const sets = await db.all(sqlSelectSets);
        return res.status(200).json({
            success: true,
            data: sets
        });
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            error: "Oopsies! Internal server error :("
        });
    }
});

/**
 * GET /sets/:id
 * Returns a specific set.
 * Starts the timer for the user.
 */
router.get("/:id", async (req, res) => {
    const id = req.params.id;

    // check the user has not got a timer already running
    if (SetTracker.hasInstance(req.user.id)) {
        return res.status(400).json({
            success: false,
            error: "User has already started a set!"
        });
    }

    const sqlSelectSet = `
        SELECT
            s.id,
            u.username AS creator_username,
            s.time_limit
        FROM sets s
        LEFT JOIN users u ON u.id = s.creator_id
        WHERE s.id = ?;
    `;

    const sqlSelectImgs = `
        SELECT
            i.id,
            i.path,
            i.title,
            i.seq_no
        FROM imgs i
        WHERE i.set_id = ?
        ORDER BY i.seq_no
    `;

    try {
        const set = await db.get(sqlSelectSet, [id]);
        if (!set) {
            return res.status(404).json({
                success: false,
                error: "Set not found"
            });
        }
        set.imgs = await db.all(sqlSelectImgs, [id]);

        // start the timer for the user here
        SetTracker.startInstance(req.user.id, set);

        return res.status(200).json({
            success: true,
            data: set
        });
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            error: "Oopsies! Internal server error :("
        });
    }
});

/**
 * POST /sets/:id/finish
 * Indicates completion of a set, or time out (which needs to be verified)
 */
router.post("/:id/finish", (req, res) => {
    const id = req.params.id;

    // check if user has a timer (i.e. they started)
    if (!SetTracker.hasInstance(req.user.id) || SetTracker.getInstance(req.user.id).setId !== id) {
        return res.status(400).json({
            success: false,
            error: "User has not started this set!"
        });
    }

    // Verify that all images have been submitted or skipped
    const instance = SetTracker.getInstance(req.user.id);
    const allImgsHandled = instance.imgs.every(img => img.skipped || img.completed);
    if (!allImgsHandled) {
        return res.status(400).json({
            success: false,
            error: "Not all images have been handled (skipped or completed)!"
        });
    }

    // check that the time is up
    if (SetTracker.instanceTimedOut(req.user.id)) {
        return res.status(200).json({
            success: true,
            timeout: true,
            message: "Set finished due to time out"
        });
    }
    else {
        return res.status(200).json({
            success: true,
            timeout: false,
            message: "Set finished by user"
        });
    }
});

export default router;