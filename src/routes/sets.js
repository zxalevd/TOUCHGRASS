import express from "express";

const router = express.Router();

/**
 * GET /sets
 * Returns a list of sets
 */
router.get("/", (req, res) => {
    // logic here

    // change me!
    res.status(501).json({
        message: "not implemented"
    })
});

/**
 * GET /sets/:id
 * Returns a specific set
 */
router.get("/:id", (req, res) => {
    // logic here
    const id = req.params.id;

    // change me!
    res.status(501).json({
        message: "not implemented"
    })
});

/**
 * POST /sets/:id/finish
 * Indicates completion of a set, or time out (which needs to be verified)
 */
router.post("/:id/finish", (req, res) => {
    // logic here
    const id = req.params.id;

    // change me!
    res.status(501).json({
        message: "not implemented"
    })
});

export default router;