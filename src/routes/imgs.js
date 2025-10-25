import express from "express";

const router = express.Router();

/**
 * GET /imgs/:id
 * Returns a specific image
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
 * GET /imgs/:id/meta
 * Returns metadata for a specific image
 */
router.get("/:id/meta", (req, res) => {
    // logic here
    const id = req.params.id;

    // change me!
    res.status(501).json({
        message: "not implemented"
    })
});

/**
 * GET /imgs/:id/hint
 * Returns the hint for a specific image
 */
router.get("/:id/hint", (req, res) => {
    // logic here
    const id = req.params.id;

    // change me!
    res.status(501).json({
        message: "not implemented"
    })
});

/**
 * POST /imgs/:id/outcome
 * Indicates whether the user skipped or completed the image
 */
router.post("/:id/outcome", (req, res) => {
    // logic here
    const id = req.params.id;

    // change me!
    res.status(501).json({
        message: "not implemented"
    })
});

/**
 * POST /imgs/:id/submit
 * Endpoint for submitting the image evidence
 */
router.post("/:id/submit", (req, res) => {
    // logic here
    const id = req.params.id;

    // change me!
    res.status(501).json({
        message: "not implemented"
    })
});

export default router;