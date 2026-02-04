import rateLimit from 'express-rate-limit';

export const signupLinkLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500, // max requests
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    const retryAfterSeconds = Math.ceil((req.rateLimit.resetTime - new Date()) / 1000);
    const minutes = Math.floor(retryAfterSeconds / 60);
    const seconds = retryAfterSeconds % 60;

    const formattedTime = `${minutes}:${seconds.toString().padStart(2, '0')}`; // e.g., 2:05

    return res.status(429).json({
      status: 429,
      message: `Too many signup link requests. Please try again later in ${formattedTime} minutes.`,
    });
  }
});

