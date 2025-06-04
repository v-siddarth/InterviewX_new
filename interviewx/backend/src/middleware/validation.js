// backend/src/middleware/validation.js - UPDATED FOR PHASE 6
const { body, param, query, validationResult } = require('express-validator');
const mongoose = require('mongoose');
const logger = require('../utils/logger');

class ValidationMiddleware {
    /**
     * Generic request validation middleware
     * @param {Object} schema - Validation schema
     * @returns {Array} Array of validation middleware
     */
    validateRequest(schema = {}) {
        const validations = [];

        // Body validations
        if (schema.body) {
            for (const [field, rules] of Object.entries(schema.body)) {
                let validator = body(field);

                // Apply each rule
                for (const [rule, config] of Object.entries(rules)) {
                    validator = this.applyValidationRule(validator, rule, config);
                }

                validations.push(validator);
            }
        }

        // Param validations
        if (schema.params) {
            for (const [field, rules] of Object.entries(schema.params)) {
                let validator = param(field);

                for (const [rule, config] of Object.entries(rules)) {
                    validator = this.applyValidationRule(validator, rule, config);
                }

                validations.push(validator);
            }
        }

        // Query validations
        if (schema.query) {
            for (const [field, rules] of Object.entries(schema.query)) {
                let validator = query(field);

                for (const [rule, config] of Object.entries(rules)) {
                    validator = this.applyValidationRule(validator, rule, config);
                }

                validations.push(validator);
            }
        }

        // Add result handler
        validations.push(this.handleValidationResult);

        return validations;
    }

    /**
     * Apply validation rule to validator
     * @param {Object} validator - Express validator instance
     * @param {string} rule - Rule name
     * @param {*} config - Rule configuration
     * @returns {Object} Updated validator
     */
    applyValidationRule(validator, rule, config) {
        switch (rule) {
            case 'notEmpty':
                return validator.notEmpty().withMessage(config.errorMessage || 'Field is required');

            case 'optional':
                return validator.optional();

            case 'isEmail':
                return validator.isEmail().withMessage(config.errorMessage || 'Invalid email format');

            case 'isLength':
                return validator.isLength(config.options || {}).withMessage(config.errorMessage || 'Invalid length');

            case 'isInt':
                return validator.isInt(config.options || {}).withMessage(config.errorMessage || 'Must be an integer');

            case 'isFloat':
                return validator.isFloat(config.options || {}).withMessage(config.errorMessage || 'Must be a number');

            case 'isBoolean':
                return validator.isBoolean().withMessage(config.errorMessage || 'Must be true or false');

            case 'isMongoId':
                return validator.isMongoId().withMessage(config.errorMessage || 'Invalid ID format');

            case 'isIn':
                return validator.isIn(config.options || []).withMessage(config.errorMessage || 'Invalid value');

            case 'matches':
                return validator.matches(config.pattern).withMessage(config.errorMessage || 'Invalid format');

            case 'custom':
                return validator.custom(config.validator).withMessage(config.errorMessage || 'Invalid value');

            case 'trim':
                return validator.trim();

            case 'escape':
                return validator.escape();

            case 'toLowerCase':
                return validator.toLowerCase();

            case 'toUpperCase':
                return validator.toUpperCase();

            case 'isURL':
                return validator.isURL(config.options || {}).withMessage(config.errorMessage || 'Invalid URL format');

            case 'isDate':
                return validator.isISO8601().withMessage(config.errorMessage || 'Invalid date format');

            case 'isJSON':
                return validator.isJSON().withMessage(config.errorMessage || 'Invalid JSON format');

            default:
                logger.warn(`Unknown validation rule: ${rule}`);
                return validator;
        }
    }

    /**
     * Handle validation results
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     * @param {Function} next - Express next function
     */
    handleValidationResult(req, res, next) {
        const errors = validationResult(req);

        if (!errors.isEmpty()) {
            const errorDetails = errors.array().map(error => ({
                field: error.param,
                message: error.msg,
                value: error.value,
                location: error.location
            }));

            logger.warn(`Validation failed for ${req.method} ${req.path}:`, errorDetails);

            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: errorDetails
            });
        }

        next();
    }

    /**
     * Validate file uploads
     * @param {Object} requirements - File requirements
     * @returns {Function} Validation middleware
     */
    validateFiles(requirements = {}) {
        return (req, res, next) => {
            try {
                const files = req.files || {};
                const errors = [];

                // Check each field requirement
                for (const [fieldName, config] of Object.entries(requirements)) {
                    const uploadedFiles = files[fieldName] || [];

                    // Check if required field is missing
                    if (config.required && uploadedFiles.length === 0) {
                        errors.push({
                            field: fieldName,
                            message: `${fieldName} file is required`,
                            type: 'missing_required_file'
                        });
                        continue;
                    }

                    // Validate each uploaded file for this field
                    for (let i = 0; i < uploadedFiles.length; i++) {
                        const file = uploadedFiles[i];

                        // Check file size
                        if (config.maxSize && file.size > config.maxSize) {
                            errors.push({
                                field: fieldName,
                                message: `${fieldName} file too large. Maximum size: ${Math.round(config.maxSize / (1024 * 1024))}MB`,
                                type: 'file_too_large',
                                actual_size: file.size,
                                max_size: config.maxSize
                            });
                        }

                        // Check minimum file size
                        if (config.minSize && file.size < config.minSize) {
                            errors.push({
                                field: fieldName,
                                message: `${fieldName} file too small. Minimum size: ${Math.round(config.minSize / (1024 * 1024))}MB`,
                                type: 'file_too_small',
                                actual_size: file.size,
                                min_size: config.minSize
                            });
                        }

                        // Check file type
                        if (config.allowedTypes && !config.allowedTypes.includes(file.mimetype)) {
                            errors.push({
                                field: fieldName,
                                message: `Invalid ${fieldName} file type. Allowed types: ${config.allowedTypes.join(', ')}`,
                                type: 'invalid_file_type',
                                actual_type: file.mimetype,
                                allowed_types: config.allowedTypes
                            });
                        }

                        // Check file name length
                        if (config.maxNameLength && file.originalname.length > config.maxNameLength) {
                            errors.push({
                                field: fieldName,
                                message: `${fieldName} filename too long. Maximum length: ${config.maxNameLength} characters`,
                                type: 'filename_too_long',
                                actual_length: file.originalname.length,
                                max_length: config.maxNameLength
                            });
                        }

                        // Custom validation
                        if (config.customValidator) {
                            try {
                                const customResult = config.customValidator(file);
                                if (customResult !== true) {
                                    errors.push({
                                        field: fieldName,
                                        message: customResult || `Custom validation failed for ${fieldName}`,
                                        type: 'custom_validation_failed'
                                    });
                                }
                            } catch (error) {
                                errors.push({
                                    field: fieldName,
                                    message: `Custom validation error: ${error.message}`,
                                    type: 'custom_validation_error'
                                });
                            }
                        }
                    }

                    // Check maximum file count
                    if (config.maxCount && uploadedFiles.length > config.maxCount) {
                        errors.push({
                            field: fieldName,
                            message: `Too many ${fieldName} files. Maximum: ${config.maxCount}`,
                            type: 'too_many_files',
                            actual_count: uploadedFiles.length,
                            max_count: config.maxCount
                        });
                    }
                }

                if (errors.length > 0) {
                    logger.warn(`File validation failed for ${req.method} ${req.path}:`, errors);

                    return res.status(400).json({
                        success: false,
                        message: 'File validation failed',
                        errors: errors
                    });
                }

                // Log successful file validation
                const fileInfo = Object.entries(files).map(([field, fileArray]) =>
                    `${field}: ${fileArray.length} file(s)`
                ).join(', ');

                if (fileInfo) {
                    logger.info(`File validation passed for user ${req.user?.id}: ${fileInfo}`);
                }

                next();

            } catch (error) {
                logger.error('Error in file validation:', error);
                res.status(500).json({
                    success: false,
                    message: 'File validation error',
                    error: error.message
                });
            }
        };
    }

    /**
     * Validate MongoDB ObjectId
     * @param {string} fieldName - Field name to validate
     * @returns {Function} Validation middleware
     */
    validateObjectId(fieldName = 'id') {
        return (req, res, next) => {
            const id = req.params[fieldName];

            if (!mongoose.Types.ObjectId.isValid(id)) {
                return res.status(400).json({
                    success: false,
                    message: `Invalid ${fieldName} format`,
                    field: fieldName,
                    value: id
                });
            }

            next();
        };
    }

    /**
     * Validate pagination parameters
     * @param {Object} options - Pagination options
     * @returns {Function} Validation middleware
     */
    validatePagination(options = {}) {
        const {
            maxLimit = 100,
            defaultLimit = 20,
            maxPage = 1000
        } = options;

        return [
            query('page')
                .optional()
                .isInt({ min: 1, max: maxPage })
                .toInt()
                .withMessage(`Page must be between 1 and ${maxPage}`),
            
            query('limit')
                .optional()
                .isInt({ min: 1, max: maxLimit })
                .toInt()
                .withMessage(`Limit must be between 1 and ${maxLimit}`),
            
            query('sort')
                .optional()
                .isLength({ max: 50 })
                .matches(/^[a-zA-Z_][a-zA-Z0-9_]*$/)
                .withMessage('Invalid sort field'),
            
            query('order')
                .optional()
                .isIn(['asc', 'desc', '1', '-1'])
                .withMessage('Order must be asc, desc, 1, or -1'),
            
            (req, res, next) => {
                // Set defaults
                req.query.page = req.query.page || 1;
                req.query.limit = req.query.limit || defaultLimit;
                req.query.sort = req.query.sort || 'createdAt';
                req.query.order = req.query.order || 'desc';
                
                next();
            },
            
            this.handleValidationResult
        ];
    }

    /**
     * Validate search parameters
     * @param {Array} searchableFields - Fields that can be searched
     * @returns {Function} Validation middleware
     */
    validateSearch(searchableFields = []) {
        return [
            query('search')
                .optional()
                .isLength({ min: 1, max: 100 })
                .trim()
                .escape()
                .withMessage('Search query must be 1-100 characters'),
            
            query('searchField')
                .optional()
                .isIn(searchableFields)
                .withMessage(`Search field must be one of: ${searchableFields.join(', ')}`),
            
            this.handleValidationResult
        ];
    }

    /**
     * Validate date range parameters
     * @returns {Function} Validation middleware
     */
    validateDateRange() {
        return [
            query('startDate')
                .optional()
                .isISO8601()
                .withMessage('Start date must be in ISO 8601 format'),
            
            query('endDate')
                .optional()
                .isISO8601()
                .withMessage('End date must be in ISO 8601 format'),
            
            query('dateField')
                .optional()
                .isLength({ max: 50 })
                .matches(/^[a-zA-Z_][a-zA-Z0-9_]*$/)
                .withMessage('Invalid date field'),
            
            (req, res, next) => {
                const { startDate, endDate } = req.query;
                
                if (startDate && endDate) {
                    const start = new Date(startDate);
                    const end = new Date(endDate);
                    
                    if (start >= end) {
                        return res.status(400).json({
                            success: false,
                            message: 'Start date must be before end date',
                            errors: [{
                                field: 'dateRange',
                                message: 'Start date must be before end date',
                                startDate,
                                endDate
                            }]
                        });
                    }
                }
                
                next();
            },
            
            this.handleValidationResult
        ];
    }

    /**
     * Custom validation for evaluation submission
     * @returns {Function} Validation middleware
     */
    validateEvaluationSubmission() {
        return (req, res, next) => {
            const { answerText } = req.body;
            const files = req.files || {};
            const hasVideo = files.video && files.video.length > 0;
            const hasAudio = files.audio && files.audio.length > 0;
            const hasText = answerText && answerText.trim().length > 0;

            // At least one form of answer is required
            if (!hasVideo && !hasAudio && !hasText) {
                return res.status(400).json({
                    success: false,
                    message: 'At least one form of answer (video, audio, or text) is required',
                    errors: [{
                        field: 'submission',
                        message: 'No answer provided',
                        type: 'missing_answer'
                    }]
                });
            }

            // If text is provided, validate its quality
            if (hasText) {
                const wordCount = answerText.trim().split(/\s+/).length;
                
                if (wordCount < 10) {
                    return res.status(400).json({
                        success: false,
                        message: 'Text answer must contain at least 10 words',
                        errors: [{
                            field: 'answerText',
                            message: 'Answer too short',
                            type: 'insufficient_content',
                            word_count: wordCount,
                            min_words: 10
                        }]
                    });
                }
            }

            next();
        };
    }
}

module.exports = new ValidationMiddleware();