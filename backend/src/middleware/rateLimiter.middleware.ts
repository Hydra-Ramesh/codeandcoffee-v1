import rateLimit from 'express-rate-limit';

// Global API rate limiter
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300, // Limit each IP to 300 requests per 15 mins
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests from this IP address, please try again after 15 minutes.',
  },
});

// Strict rate limiter for Authentication & OTP routes
export const authLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 20, // Max 20 attempts
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many authentication attempts. Please wait 10 minutes before trying again.',
  },
});

// Lightweight reader heartbeat rate limiter (supports frequent pings from active readers)
export const heartbeatLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 60, // Up to 60 pings/min
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Heartbeat rate limit reached.',
  },
});

// Comment submission rate limiter (prevents spam floods)
export const commentLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 15, // Up to 15 comments per 5 minutes per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many comments submitted in a short period. Please wait a few minutes.',
  },
});

// Contributor application limiter
export const contributorLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // Up to 5 submission attempts per hour per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Application submission limit exceeded. Please wait an hour before submitting again.',
  },
});
