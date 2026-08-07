// ============================================
// Auth Middleware — JWT verify + role guard
// ============================================
import { verifyAccessToken } from '../services/authService.js';
import { User } from '../Models/sql/index.js';
import ApiResponse from '../utils/ApiResponse.js';
import logger from '../utils/logger.js';

// ─── Authenticate ──────────────────────────
const authenticate = async (req, res, next) => {
  try {
    let token = null;

    // 1. Bearer header
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    }
    // 2. Cookie
    if (!token && req.cookies?.access_token) {
      token = req.cookies.access_token;
    }
    // 3. Query (WebSocket)
    if (!token && req.query?.token) {
      token = req.query.token;
    }

    if (!token) {
      return ApiResponse.unauthorized(res, 'No token provided');
    }

    const decoded = verifyAccessToken(token);

    const user = await User.findByPk(decoded.id, {
      attributes: { exclude: ['password'] },
    });

    if (!user) {
      return ApiResponse.unauthorized(res, 'User no longer exists');
    }
    if (user.account_status !== 'active') {
      return ApiResponse.forbidden(res, `Account is ${user.account_status}`);
    }
    if (user.isLocked()) {
      return ApiResponse.forbidden(res, 'Account temporarily locked');
    }
    if (user.password_changed_at) {
      const changedAt = Math.floor(new Date(user.password_changed_at).getTime() / 1000);
      if (decoded.iat < changedAt) {
        return ApiResponse.unauthorized(res, 'Password changed. Please login again.');
      }
    }

    req.user   = user;
    req.userId = user.id;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return ApiResponse.unauthorized(res, 'Token expired');
    }
    if (error.name === 'JsonWebTokenError') {
      return ApiResponse.unauthorized(res, 'Invalid token');
    }
    logger.error('Auth middleware error:', { error: error.message });
    return ApiResponse.serverError(res, 'Authentication failed');
  }
};

// ─── Role-based authorization ─────────────
const authorize = (...roles) => (req, res, next) => {
  if (!req.user) return ApiResponse.unauthorized(res);
  if (!roles.includes(req.user.role)) {
    return ApiResponse.forbidden(res,
      `Role '${req.user.role}' cannot access this resource`
    );
  }
  next();
};

// ─── Optional auth ─────────────────────────
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    let token = null;
    if (authHeader?.startsWith('Bearer ')) token = authHeader.split(' ')[1];
    if (!token && req.cookies?.access_token)  token = req.cookies.access_token;

    if (token) {
      const decoded = verifyAccessToken(token);
      const user    = await User.findByPk(decoded.id, {
        attributes: { exclude: ['password'] },
      });
      if (user && user.account_status === 'active') {
        req.user   = user;
        req.userId = user.id;
      }
    }
  } catch (_) { /* silently continue */ }
  next();
};

export { authenticate, authorize, optionalAuth };