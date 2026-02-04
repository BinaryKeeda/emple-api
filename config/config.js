import { configDotenv } from "dotenv";
import mongoose from "mongoose";
configDotenv();
export const USER_JWT_SECRET = "FDSHHSDJDS";
export const ADMIN_JWT_SECRET = "shgdsjdsjds";
export const CALLBACK = ""
export const EVALUATOR_API = process.env.EVALUATOR_API
export const CODE_EXECUTION_API = process.env.EXECUTION_API;

const ORIGINS = process.env.CORS ? process.env.CORS.split(',') : [];
export const corsConfig = {
    origin: ORIGINS.length > 0 ? ORIGINS : ["https://www.accounts.binarykeeda.com", "https://accounts.binarykeeda.com", "https://login.binarykeeda.com", "https://www.login.binarykeeda.com", 'https://admin.binarykeeda.com', 'https://www.admin.binarykeeda.com', 'https://binarykeeda.com', 'https://www.binarykeeda.com', 'http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175', 'https://campus.binarykeeda.com', "https://www.campus.binarykeeda.com"],
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
};

export const db = () => {
    return new Promise((resolve, reject) => {
        mongoose.connect(process.env.URI, {})
            .then(() => {
                console.log("Connected to MongoDB");
                resolve();
            })
            .catch((err) => {
                console.log("Error connecting to MongoDB");
                reject(err);
            });
    })
}

export const COOKIE_OPTIONS = {
    httpOnly: true,
    secure: true,
    sameSite: 'none',
    maxAge: 7 * 24 * 60 * 60 * 1000,
};

export const redisConnection = {
    host: process.env.REDIS_HOST || 'localhost',//'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD,
    db: process.env.NODE_ENV == 'DEV' ? 0 : 1
};

export const MAIL_JOB = 'sendMail';
export const TEST_EVAL = 'testEval';
export const QUIZ_EVAL = 'quizEval';