import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import morgan from 'morgan';
import router from "./routes/index.js";

dotenv.config();

console.log(`Starting Server on ${process.env.NODE_ENV}`);

const app = express();

const PORT = process.env.PORT || 8000;

const allowedOrigins = (process.env.CORS_ORIGINS || 'http://localhost:3000')
    .split(',')
    .map(o => o.trim())
    .filter(Boolean);
console.log(`CORS ORIGINS: ${allowedOrigins.join(',')}`);

app.use(cors({
    origin: allowedOrigins,
    credentials: true,
}));
app.use(morgan('combined', {
    stream: process.stdout,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health Check
app.get('/', (req, res) => {
    res.status(200).json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV,
    })
});

app.use('/api', router);

// INITIALISE DB

app.listen(PORT, () => {
    console.log(`Listening on http://localhost:${PORT}`);
});