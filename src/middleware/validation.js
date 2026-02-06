/**
 * Validation middleware factory
 * @param {Object} schema - Joi validation schema
 * @returns {Function} Express middleware
 */
const validate = (schema) => {
    return (req, res, next) => {
        const { error, value } = schema.validate(req.body, {
            abortEarly: false, // Return all errors
            stripUnknown: true // Remove unknown fields
        });

        if (error) {
            const errors = error.details.map(detail => ({
                field: detail.path.join('.'),
                message: detail.message
            }));

            console.error('❌ Validation Failed:', JSON.stringify(errors, null, 2));
            return res.status(400).json({
                success: false,
                message: 'Validation error',
                errors
            });
        }

        // Replace req.body with validated and sanitized value
        req.body = value;
        next();
    };
};

module.exports = validate;
