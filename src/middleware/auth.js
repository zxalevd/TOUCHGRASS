import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET;

const requireAuth = (req, res, next) => {
    const auth = req.headers.authorization;
    if (!auth || !auth.startsWith('Bearer ')) {
        return res.status(401).json({
            success: false,
            error: "Auth token is required",
        });
    }

    const token = auth.slice(7);
    jwt.verify(token, JWT_SECRET, (err, decoded) => {
        if (err) {
            console.log(err)
            return res.status(401).json({
                success: false,
                error: "Invalid or expired token"
            });
        }
        req.user = { id: decoded.userId };
        next();
    });
}

export { requireAuth };