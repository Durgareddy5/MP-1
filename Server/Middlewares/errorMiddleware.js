// ============================================
// Global Error Handling Middleware
// ============================================
import env from '../config/environment.js';
import logger from '../utils/logger.js';
import ApiResponse from '../utils/ApiResponse.js';

// ─── Async error wrapper ───────────────────
const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

// ─── 404 handler ──────────────────────────
const notFoundHandler = (req, res) => {
  return ApiResponse.notFound(res,
    `Route ${req.method} ${req.originalUrl} not found`
  );
};

// ─── Global error handler ─────────────────
const globalErrorHandler = (err, req, res, next) => {
  logger.error('Unhandled error:', {
    message:  err.message,
    stack:    err.stack,
    method:   req.method,
    url:      req.originalUrl,
    userId:   req.user?.id,
    ip:       req.ip,
  });

  // Sequelize validation error
  if (err.name === 'SequelizeValidationError') {
    const errors = err.errors.map((e) => ({
      field:   e.path,
      message: e.message,
    }));
    return ApiResponse.validationError(res, errors, 'Database validation failed');
  }

  // Sequelize unique constraint
  if (err.name === 'SequelizeUniqueConstraintError') {
    const field = err.errors[0]?.path || 'field';
    return ApiResponse.conflict(res, `${field} already exists`);
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map((e) => ({
      field:   e.path,
      message: e.message,
    }));
    return ApiResponse.validationError(res, errors);
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return ApiResponse.unauthorized(res, 'Invalid token');
  }
  if (err.name === 'TokenExpiredError') {
    return ApiResponse.unauthorized(res, 'Token expired');
  }

  // Custom operational errors
  if (err.isOperational) {
    return ApiResponse.error(res, {
      message:    err.message,
      statusCode: err.statusCode || 400,
    });
  }

  // Default 500
  const message = env.NODE_ENV === 'production'
    ? 'Internal server error'
    : err.message;

  return ApiResponse.serverError(res, message);
};

export { asyncHandler, notFoundHandler, globalErrorHandler };