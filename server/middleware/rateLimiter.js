const rateLimit = require('express-rate-limit');

// 1. Rate limiter for OTP requests (max 5 requests per 15 minutes per IP)
const otpRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { error: 'Too many OTP requests from this IP. Please try again after 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false
});

// 2. Rate limiter for Auth endpoints (login / signup max 20 per 15 minutes per IP)
const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { error: 'Too many authentication attempts. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false
});

// 3. Rate limiter for Search endpoints (max 60 queries per minute per IP)
const searchRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  message: { error: 'Search rate limit exceeded. Please wait a moment before searching again.' },
  standardHeaders: true,
  legacyHeaders: false
});

// 4. General API Rate Limiter (max 200 requests per minute per IP)
const generalApiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 200,
  message: { error: 'Too many requests. Please slow down.' },
  standardHeaders: true,
  legacyHeaders: false
});

/**
 * 5. In-Memory Socket.IO Rate Limiter / Anti-Spam Guard
 * Limits how many times a socket can emit an event within a time window.
 * @param {number} maxEvents - Max events allowed in window
 * @param {number} windowMs - Window duration in milliseconds
 */
function createSocketRateLimiter(maxEvents = 10, windowMs = 2000) {
  const eventTimestamps = new Map();

  return function isAllowed(socketId) {
    const now = Date.now();
    let timestamps = eventTimestamps.get(socketId) || [];

    // Filter out timestamps outside window
    timestamps = timestamps.filter(t => now - t < windowMs);

    if (timestamps.length >= maxEvents) {
      return false; // Rate limit exceeded
    }

    timestamps.push(now);
    eventTimestamps.set(socketId, timestamps);

    // Clean up stale entries periodically
    if (eventTimestamps.size > 5000) {
      for (const [id, tsList] of eventTimestamps.entries()) {
        if (tsList.length === 0 || now - tsList[tsList.length - 1] > windowMs * 2) {
          eventTimestamps.delete(id);
        }
      }
    }

    return true;
  };
}

module.exports = {
  otpRateLimiter,
  authRateLimiter,
  searchRateLimiter,
  generalApiLimiter,
  createSocketRateLimiter
};
