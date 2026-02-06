/**
 * Create a standardized success response
 * @param {Object} res - Express response object
 * @param {Number} statusCode - HTTP status code
 * @param {String} message - Success message
 * @param {Object|Array} data - Response data
 * @param {Object} pagination - Optional pagination data
 */
const successResponse = (res, statusCode, message, data, pagination = null) => {
    const response = {
        success: true,
        message,
        data
    };

    if (pagination) {
        response.pagination = pagination;
    }

    return res.status(statusCode).json(response);
};

/**
 * Create a standardized error response
 * @param {Object} res - Express response object
 * @param {Number} statusCode - HTTP status code
 * @param {String} message - Error message
 * @param {String} error - Detailed error (optional)
 */
const errorResponse = (res, statusCode, message, error = null) => {
    const response = {
        success: false,
        message
    };

    if (error && process.env.NODE_ENV === 'development') {
        response.error = error;
    }

    return res.status(statusCode).json(response);
};

/**
 * Create pagination metadata
 * @param {Number} page - Current page
 * @param {Number} limit - Items per page
 * @param {Number} total - Total items
 * @returns {Object} Pagination metadata
 */
const createPagination = (page, limit, total) => {
    const totalPages = Math.ceil(total / limit);

    return {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
    };
};

/**
 * Calculate percentage
 * @param {Number} part - Part value
 * @param {Number} total - Total value
 * @returns {Number} Percentage (0-100)
 */
const calculatePercentage = (part, total) => {
    if (total === 0) return 0;
    return Math.round((part / total) * 100);
};

/**
 * Generate random string
 * @param {Number} length - Length of string
 * @returns {String} Random string
 */
const generateRandomString = (length = 32) => {
    return require('crypto').randomBytes(length).toString('hex');
};

/**
 * Sleep/delay function
 * @param {Number} ms - Milliseconds to sleep
 * @returns {Promise}
 */
const sleep = (ms) => {
    return new Promise(resolve => setTimeout(resolve, ms));
};

module.exports = {
    successResponse,
    errorResponse,
    createPagination,
    calculatePercentage,
    generateRandomString,
    sleep
};
