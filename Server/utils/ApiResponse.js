// apps/api/utils/ApiResponse.js

/**
 * Standardized API Response Class
 * Ensures all API responses have a consistent format
 */
class ApiResponse {
  /**
   * Success response
   */
  static success(res, { data = null, message = 'Success', statusCode = 200, meta = null }) {
    const response = {
      success: true,
      status: statusCode,
      message,
      data,
    };

    if (meta) {
      response.meta = meta;
    }

    response.timestamp = new Date().toISOString();

    return res.status(statusCode).json(response);
  }

  /**
   * Created response (201)
   */
  static created(res, { data = null, message = 'Resource created successfully' }) {
    return ApiResponse.success(res, { data, message, statusCode: 201 });
  }

  /**
   * Error response
   */
  static error(res, { message = 'Internal Server Error', statusCode = 500, errors = null, code = null }) {
    const response = {
      success: false,
      status: statusCode,
      message,
    };

    if (errors) {
      response.errors = errors;
    }

    if (code) {
      response.error_code = code;
    }

    response.timestamp = new Date().toISOString();

    return res.status(statusCode).json(response);
  }

  /**
   * Bad Request (400)
   */
  static badRequest(res, message = 'Bad Request', errors = null) {
    return ApiResponse.error(res, { message, statusCode: 400, errors, code: 'BAD_REQUEST' });
  }

  /**
   * Unauthorized (401)
   */
  static unauthorized(res, message = 'Unauthorized. Please login to continue.') {
    return ApiResponse.error(res, { message, statusCode: 401, code: 'UNAUTHORIZED' });
  }

  /**
   * Forbidden (403)
   */
  static forbidden(res, message = 'Access denied. You do not have permission.') {
    return ApiResponse.error(res, { message, statusCode: 403, code: 'FORBIDDEN' });
  }

  /**
   * Not Found (404)
   */
  static notFound(res, message = 'Resource not found.') {
    return ApiResponse.error(res, { message, statusCode: 404, code: 'NOT_FOUND' });
  }

  /**
   * Conflict (409)
   */
  static conflict(res, message = 'Resource already exists.') {
    return ApiResponse.error(res, { message, statusCode: 409, code: 'CONFLICT' });
  }

  /**
   * Validation Error (422)
   */
  static validationError(res, errors, message = 'Validation failed.') {
    return ApiResponse.error(res, { message, statusCode: 422, errors, code: 'VALIDATION_ERROR' });
  }

  /**
   * Too Many Requests (429)
   */
  static tooManyRequests(res, message = 'Too many requests. Please try again later.') {
    return ApiResponse.error(res, { message, statusCode: 429, code: 'RATE_LIMIT_EXCEEDED' });
  }

  /**
   * Internal Server Error (500)
   */
  static serverError(res, message = 'Internal server error. Please try again later.') {
    return ApiResponse.error(res, { message, statusCode: 500, code: 'INTERNAL_ERROR' });
  }
}

export default ApiResponse;