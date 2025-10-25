import express from "express";
import bcrypt from "bcrypt"
import db from "../config/database.js";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

// Constants
const MIN_PASSWORD_LENGTH = 8;
const SALT_ROUNDS = 10;
const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRE = process.env.JWT_EXPIRE;

const router = express.Router();

/**
 * POST /auth/register
 * Registers a user
 */
router.post("/register", async (req, res) => {
    const { username, password } = req.body;

    // Validate password
    if (password.length < MIN_PASSWORD_LENGTH) {
        return res.status(400).json({
            success: false,
            error: `Password is too short (must be at least ${MIN_PASSWORD_LENGTH} characters).`,
        })
    }

    try {
        const password_hash = await bcrypt.hash(password, SALT_ROUNDS);
        await db.run("INSERT INTO users (username, password_hash) VALUES (?, ?);", username, password_hash);
        return res.status(200).json({
            success: true,
        });
    }
    catch (error) {
        if (error.message && error.message.includes("UNIQUE")) {
            return res.status(409).json({
                success: false,
                error: "Username already exists",
            });
        }
    }
});

/**
 * POST /auth/login
 * Logs a user in and issues JWT
 */
router.post("/login", async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({
            success: false,
            error: "Username or password is required",
        })
    }

    try {
        const user = await db.get('SELECT id, password_hash FROM users WHERE username = ?', username);
        if (!user) {
            return res.status(401).json({
                success: false,
                error: "Invalid credentials"
            });
        }

        const match = await bcrypt.compare(password, user.password_hash);
        if (!match) {
            return res.status(401).json({
                success: false,
                error: "Invalid credentials"
            });
        }

        // Create JWT
        const token = await jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: JWT_EXPIRE });
        return res.status(200).json({
            success: true,
            token: token,
            expiresIn: JWT_EXPIRE
        })
    }
    catch (error) {
        return res.status(500).json({
            error: "Oopsies! Internal server error :(",
        })
    }
});

export default router;
