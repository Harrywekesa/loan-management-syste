
import rateLimit from 'express-rate-limit';

// Standard limiter for most API routes
export const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    message: { message: 'Too many requests, please try again later.' }
});

// Stricter limiter for Auth routes (Login/Register)
export const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Increased limit for testing/dev
    message: { message: 'Too many login attempts, please try again later.' }
});
