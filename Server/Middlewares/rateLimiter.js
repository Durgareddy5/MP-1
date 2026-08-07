// ============================================
// Rate Limiters — different limits per route
// ============================================
import rateLimit from 'express-rate-limit';

// General API rate limit
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max:      100,
  standardHeaders: true,
  legacyHeaders:   false,
  message: {
    success: false,
    message: 'Too many requests. Please try again in 15 minutes.',
    code:    'RATE_LIMIT_EXCEEDED',
  },
});

// Strict limit for auth routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max:      10,
  standardHeaders: true,
  legacyHeaders:   false,
  message: {
    success: false,
    message: 'Too many authentication attempts. Please try again later.',
    code:    'AUTH_RATE_LIMIT',
  },
});

// Order placement limit
const orderLimiter = rateLimit({
  windowMs: 60 * 1000,   // 1 minute
  max:      30,          // 30 orders per minute
  standardHeaders: true,
  legacyHeaders:   false,
  message: {
    success: false,
    message: 'Order placement rate limit exceeded. Please slow down.',
    code:    'ORDER_RATE_LIMIT',
  },
});

// Market data limit (more generous)
const marketLimiter = rateLimit({
  windowMs: 60 * 1000,
  max:      120,
  standardHeaders: true,
  legacyHeaders:   false,
});

export { generalLimiter, authLimiter, orderLimiter, marketLimiter };