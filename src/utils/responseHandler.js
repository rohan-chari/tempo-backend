/**
 * Standardized response handler for consistent API responses
 */

class ResponseHandler {
  /**
   * Success response
   * @param {Object} res - Express response object
   * @param {number} statusCode - HTTP status code
   * @param {any} data - Response data
   * @param {string} message - Success message
   */
  static success (res, statusCode = 200, data = null, message = 'Success') {
    return res.status(statusCode).json({
      success: true,
      message,
      data,
    });
  }

  /**
   * Error response
   * @param {Object} res - Express response object
   * @param {number} statusCode - HTTP status code
   * @param {string} message - Error message
   * @param {any} errors - Additional error details
   */
  static error (res, statusCode = 500, message = 'Internal Server Error', errors = null) {
    return res.status(statusCode).json({
      success: false,
      message,
      ...(errors && { errors }),
    });
  }

  /**
   * Created response
   * @param {Object} res - Express response object
   * @param {any} data - Created resource data
   * @param {string} message - Success message
   */
  static created (res, data = null, message = 'Resource created successfully') {
    return this.success(res, 201, data, message);
  }

  /**
   * No content response
   * @param {Object} res - Express response object
   */
  static noContent (res) {
    return res.status(204).send();
  }

  /**
   * Bad request response
   * @param {Object} res - Express response object
   * @param {string} message - Error message
   * @param {any} errors - Validation errors
   */
  static badRequest (res, message = 'Bad Request', errors = null) {
    return this.error(res, 400, message, errors);
  }

  /**
   * Unauthorized response
   * @param {Object} res - Express response object
   * @param {string} message - Error message
   */
  static unauthorized (res, message = 'Unauthorized') {
    return this.error(res, 401, message);
  }

  /**
   * Forbidden response
   * @param {Object} res - Express response object
   * @param {string} message - Error message
   */
  static forbidden (res, message = 'Forbidden') {
    return this.error(res, 403, message);
  }

  /**
   * Not found response
   * @param {Object} res - Express response object
   * @param {string} message - Error message
   */
  static notFound (res, message = 'Resource not found') {
    return this.error(res, 404, message);
  }

  /**
   * Conflict response
   * @param {Object} res - Express response object
   * @param {string} message - Error message
   */
  static conflict (res, message = 'Resource conflict') {
    return this.error(res, 409, message);
  }
}

module.exports = ResponseHandler;
