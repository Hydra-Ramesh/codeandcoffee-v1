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
