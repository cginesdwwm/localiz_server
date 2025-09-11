import rateLimit from "express-rate-limit";

// Simple rate limiter for sensitive endpoints (register, login)
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // limit each IP to 10 requests per windowMs
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false,
  message: {
    message: "Trop de tentatives, réessayez plus tard.",
  },
});

export default authRateLimiter;
