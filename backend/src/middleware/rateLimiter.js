const rateLimit = require("express-rate-limit");

const rateLimiter = rateLimit({
  windowMs: 60 * 1000,        // 1-minute window
  max: 10,                     // 10 requests per window per IP
  standardHeaders: true,       // Return rate limit info in RateLimit-* headers
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many requests. Maximum 10 uploads per minute. Please try again shortly.",
  },
  keyGenerator: (req) => {
    // Respect reverse-proxy forwarded IP (Render, Vercel, etc.)
    return req.headers["x-forwarded-for"]?.split(",")[0].trim() || req.ip;
  },
});

module.exports = rateLimiter;
