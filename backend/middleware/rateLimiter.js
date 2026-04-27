// Simple in-memory rate limiter (use redis-backed for production)
const store = new Map(); // key → { count, resetAt }

/**
 * createRateLimiter({ windowMs, max, message })
 * Returns Express middleware that rate-limits by IP.
 */
function createRateLimiter({ windowMs = 60_000, max = 100, message = 'Too many requests' } = {}) {
  return (req, res, next) => {
    const key = req.ip;
    const now = Date.now();
    const entry = store.get(key);

    if (!entry || now > entry.resetAt) {
      store.set(key, { count: 1, resetAt: now + windowMs });
      return next();
    }

    entry.count += 1;
    if (entry.count > max) {
      res.setHeader('Retry-After', Math.ceil((entry.resetAt - now) / 1000));
      return res.status(429).json({ success: false, message });
    }
    next();
  };
}

// Pre-built limiters
const apiLimiter = createRateLimiter({ windowMs: 60_000, max: 200 });
const authLimiter = createRateLimiter({ windowMs: 15 * 60_000, max: 20, message: 'Too many auth attempts, try again later' });
const eventLimiter = createRateLimiter({ windowMs: 10_000, max: 30, message: 'Event rate limit exceeded' });

module.exports = { createRateLimiter, apiLimiter, authLimiter, eventLimiter };