// frontend/src/utils/validators.js

import { VALIDATION_RULES, MEDIA_SETTINGS } from './constants.js';

// Email Validation
export const validateEmail = (email) => {
  const errors = [];
  
  if (!email || typeof email !== 'string') {
    errors.push('Email is required');
    return { isValid: false, errors };
  }
  
  const trimmedEmail = email.trim();
  
  if (trimmedEmail.length === 0) {
    errors.push('Email is required');
  } else if (trimmedEmail.length > VALIDATION_RULES.EMAIL.MAX_LENGTH) {
    errors.push(`Email must not exceed ${VALIDATION_RULES.EMAIL.MAX_LENGTH} characters`);
  } else if (!VALIDATION_RULES.EMAIL.PATTERN.test(trimmedEmail)) {
    errors.push('Please enter a valid email address');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// Password Validation
export const validatePassword = (password, confirmPassword = null) => {
  const errors = [];
  const rules = VALIDATION_RULES.PASSWORD;
  
  if (!password || typeof password !== 'string') {
    errors.push('Password is required');
    return { isValid: false, errors };
  }
  
  if (password.length < rules.MIN_LENGTH) {
    errors.push(`Password must be at least ${rules.MIN_LENGTH} characters long`);
  }
  
  if (password.length > rules.MAX_LENGTH) {
    errors.push(`Password must not exceed ${rules.MAX_LENGTH} characters`);
  }
  
  if (rules.REQUIRE_UPPERCASE && !/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  
  if (rules.REQUIRE_LOWERCASE && !/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  
  if (rules.REQUIRE_NUMBER && !/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  
  if (rules.REQUIRE_SPECIAL_CHAR) {
    const specialCharRegex = new RegExp(`[${rules.SPECIAL_CHARS.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}]`);
    if (!specialCharRegex.test(password)) {
      errors.push('Password must contain at least one special character');
    }
  }
  
  // Check for common weak patterns
  if (/(.)\1{2,}/.test(password)) {
    errors.push('Password should not contain repeated characters');
  }
  
  if (/^(123456|password|qwerty|abc123)/i.test(password)) {
    errors.push('Password is too common. Please choose a stronger password');
  }
  
  // Confirm password validation
  if (confirmPassword !== null && password !== confirmPassword) {
    errors.push('Passwords do not match');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// Name Validation
export const validateName = (name, fieldName = 'Name') => {
  const errors = [];
  const rules = VALIDATION_RULES.NAME;
  
  if (!name || typeof name !== 'string') {
    errors.push(`${fieldName} is required`);
    return { isValid: false, errors };
  }
  
  const trimmedName = name.trim();
  
  if (trimmedName.length < rules.MIN_LENGTH) {
    errors.push(`${fieldName} must be at least ${rules.MIN_LENGTH} characters long`);
  }
  
  if (trimmedName.length > rules.MAX_LENGTH) {
    errors.push(`${fieldName} must not exceed ${rules.MAX_LENGTH} characters`);
  }
  
  if (!rules.PATTERN.test(trimmedName)) {
    errors.push(`${fieldName} can only contain letters, spaces, hyphens, and apostrophes`);
  }
  
  // Check for inappropriate content (basic)
  const inappropriateWords = ['admin', 'test', 'null', 'undefined'];
  if (inappropriateWords.some(word => trimmedName.toLowerCase().includes(word))) {
    errors.push(`${fieldName} contains inappropriate content`);
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// Phone Number Validation
export const validatePhone = (phone) => {
  const errors = [];
  
  if (!phone || typeof phone !== 'string') {
    errors.push('Phone number is required');
    return { isValid: false, errors };
  }
  
  const cleanedPhone = phone.replace(/\s+/g, '');
  
  if (!VALIDATION_RULES.PHONE.PATTERN.test(cleanedPhone)) {
    errors.push('Please enter a valid phone number');
  }
  
  if (cleanedPhone.length < 7 || cleanedPhone.length > 15) {
    errors.push('Phone number must be between 7 and 15 digits');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// Answer Validation
export const validateAnswer = (answer) => {
  const errors = [];
  const rules = VALIDATION_RULES.ANSWER;
  
  if (!answer || typeof answer !== 'string') {
    errors.push('Answer is required');
    return { isValid: false, errors };
  }
  
  const trimmedAnswer = answer.trim();
  
  if (trimmedAnswer.length < rules.MIN_LENGTH) {
    errors.push(`Answer must be at least ${rules.MIN_LENGTH} characters long`);
  }
  
  if (trimmedAnswer.length > rules.MAX_LENGTH) {
    errors.push(`Answer must not exceed ${rules.MAX_LENGTH} characters`);
  }
  
  // Check for meaningful content
  const wordCount = trimmedAnswer.split(/\s+/).filter(word => word.length > 0).length;
  if (wordCount < 3) {
    errors.push('Answer should contain at least 3 words');
  }
  
  // Check for copy-paste indicators
  if (/(.{10,})\1+/.test(trimmedAnswer)) {
    errors.push('Answer appears to contain repeated content');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// Form Validation
export const validateForm = (formData, validationSchema) => {
  const errors = {};
  let isValid = true;
  
  Object.keys(validationSchema).forEach(field => {
    const validators = validationSchema[field];
    const fieldErrors = [];
    
    if (Array.isArray(validators)) {
      validators.forEach(validator => {
        try {
          const result = validator(formData[field]);
          if (!result.isValid) {
            fieldErrors.push(...result.errors);
          }
        } catch (error) {
          fieldErrors.push(`Validation error for ${field}`);
        }
      });
    }
    
    if (fieldErrors.length > 0) {
      errors[field] = fieldErrors;
      isValid = false;
    }
  });
  
  return {
    isValid,
    errors
  };
};

// File Upload Validation
export const validateFileUpload = (file, options = {}) => {
  const errors = [];
  const {
    maxSize = MEDIA_SETTINGS.FILE_SIZE_LIMITS.VIDEO,
    allowedTypes = ['image/*', 'video/*', 'audio/*'],
    requiredExtensions = null,
    maxDuration = null
  } = options;
  
  if (!file) {
    errors.push('File is required');
    return { isValid: false, errors };
  }
  
  // Check file size
  if (file.size > maxSize) {
    const maxSizeMB = Math.round(maxSize / (1024 * 1024));
    errors.push(`File size must not exceed ${maxSizeMB}MB`);
  }
  
  // Check file type
  const isAllowedType = allowedTypes.some(type => {
    if (type.endsWith('*')) {
      return file.type.startsWith(type.slice(0, -1));
    }
    return file.type === type;
  });
  
  if (!isAllowedType) {
    errors.push(`File type not supported. Allowed types: ${allowedTypes.join(', ')}`);
  }
  
  // Check file extension if specified
  if (requiredExtensions) {
    const fileName = file.name.toLowerCase();
    const hasValidExtension = requiredExtensions.some(ext => 
      fileName.endsWith(ext.toLowerCase())
    );
    
    if (!hasValidExtension) {
      errors.push(`File must have one of these extensions: ${requiredExtensions.join(', ')}`);
    }
  }
  
  // Check if file is corrupted (basic check)
  if (file.size === 0) {
    errors.push('File appears to be empty or corrupted');
  }
  
  // Check for suspicious file names
  const suspiciousPatterns = ['.exe', '.bat', '.cmd', '.scr', '.vbs', '.js'];
  if (suspiciousPatterns.some(pattern => file.name.toLowerCase().includes(pattern))) {
    errors.push('File type not allowed for security reasons');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings: [] // Could add non-blocking warnings here
  };
};

// Media Permissions Validation
export const validateMediaPermissions = (permissions) => {
  const errors = [];
  const warnings = [];
  
  if (!permissions || typeof permissions !== 'object') {
    errors.push('Media permissions object is required');
    return { isValid: false, errors, warnings };
  }
  
  if (!permissions.camera) {
    errors.push('Camera permission is required for video recording');
  }
  
  if (!permissions.microphone) {
    errors.push('Microphone permission is required for audio recording');
  }
  
  // Check for partial permissions
  if (permissions.camera && !permissions.microphone) {
    warnings.push('Audio recording may not work without microphone permission');
  }
  
  if (!permissions.camera && permissions.microphone) {
    warnings.push('Video recording may not work without camera permission');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
};

// Interview Data Validation
export const validateInterviewData = (interviewData) => {
  const errors = [];
  
  if (!interviewData || typeof interviewData !== 'object') {
    errors.push('Interview data is required');
    return { isValid: false, errors };
  }
  
  // Validate title
  if (!interviewData.title?.trim()) {
    errors.push('Interview title is required');
  } else if (interviewData.title.trim().length > 100) {
    errors.push('Interview title must not exceed 100 characters');
  }
  
  // Validate description
  if (interviewData.description && interviewData.description.length > 500) {
    errors.push('Interview description must not exceed 500 characters');
  }
  
  // Validate questions array
  if (!interviewData.questions || !Array.isArray(interviewData.questions)) {
    errors.push('At least one question is required');
  } else if (interviewData.questions.length === 0) {
    errors.push('At least one question is required');
  } else if (interviewData.questions.length > 50) {
    errors.push('Interview cannot have more than 50 questions');
  } else {
    // Validate individual questions
    interviewData.questions.forEach((question, index) => {
      if (!question.text?.trim()) {
        errors.push(`Question ${index + 1} text is required`);
      } else if (question.text.trim().length > 1000) {
        errors.push(`Question ${index + 1} text is too long (max 1000 characters)`);
      }
      
      if (!question.type) {
        errors.push(`Question ${index + 1} type is required`);
      } else if (!['text', 'audio', 'video', 'mixed'].includes(question.type)) {
        errors.push(`Question ${index + 1} has invalid type`);
      }
      
      if (question.timeLimit && (question.timeLimit < 30 || question.timeLimit > 600)) {
        errors.push(`Question ${index + 1} time limit must be between 30 seconds and 10 minutes`);
      }
    });
  }
  
  // Validate status
  if (interviewData.status && !['pending', 'in-progress', 'completed', 'failed', 'cancelled'].includes(interviewData.status)) {
    errors.push('Invalid interview status');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// Analysis Result Validation
export const validateAnalysisResult = (result, type) => {
  const errors = [];
  
  if (!result || typeof result !== 'object') {
    errors.push(`${type} analysis result is required`);
    return { isValid: false, errors };
  }
  
  switch (type) {
    case 'facial':
      if (typeof result.confidence !== 'number' || result.confidence < 0 || result.confidence > 100) {
        errors.push('Facial confidence score must be between 0 and 100');
      }
      break;
      
    case 'audio':
      if (typeof result.quality !== 'number' || result.quality < 0 || result.quality > 100) {
        errors.push('Audio quality score must be between 0 and 100');
      }
      if (result.transcription && typeof result.transcription !== 'string') {
        errors.push('Audio transcription must be a string');
      }
      break;
      
    case 'text':
      if (typeof result.score !== 'number' || result.score < 0 || result.score > 100) {
        errors.push('Text analysis score must be between 0 and 100');
      }
      if (result.feedback && typeof result.feedback !== 'string') {
        errors.push('Text feedback must be a string');
      }
      break;
      
    case 'overall':
      if (typeof result.score !== 'number' || result.score < 0 || result.score > 100) {
        errors.push('Overall score must be between 0 and 100');
      }
      if (typeof result.passed !== 'boolean') {
        errors.push('Overall passed status must be a boolean');
      }
      break;
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// URL Validation
export const validateUrl = (url, options = {}) => {
  const errors = [];
  const { requireProtocol = true, allowedProtocols = ['http', 'https'] } = options;
  
  if (!url || typeof url !== 'string') {
    errors.push('URL is required');
    return { isValid: false, errors };
  }
  
  try {
    const urlObj = new URL(url);
    
    if (requireProtocol && !allowedProtocols.includes(urlObj.protocol.slice(0, -1))) {
      errors.push(`URL must use one of these protocols: ${allowedProtocols.join(', ')}`);
    }
    
    // Basic security checks
    if (urlObj.hostname === 'localhost' && window.location.hostname !== 'localhost') {
      errors.push('Localhost URLs are not allowed in production');
    }
    
  } catch (error) {
    errors.push('Please enter a valid URL');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// Date/Time Validation
export const validateDateTime = (dateTime, options = {}) => {
  const errors = [];
  const { 
    future = false, 
    past = false, 
    minDate = null, 
    maxDate = null 
  } = options;
  
  if (!dateTime) {
    errors.push('Date and time is required');
    return { isValid: false, errors };
  }
  
  const date = new Date(dateTime);
  
  if (isNaN(date.getTime())) {
    errors.push('Please enter a valid date and time');
    return { isValid: false, errors };
  }
  
  const now = new Date();
  
  if (future && date <= now) {
    errors.push('Date must be in the future');
  }
  
  if (past && date >= now) {
    errors.push('Date must be in the past');
  }
  
  if (minDate && date < new Date(minDate)) {
    errors.push(`Date must be after ${new Date(minDate).toLocaleDateString()}`);
  }
  
  if (maxDate && date > new Date(maxDate)) {
    errors.push(`Date must be before ${new Date(maxDate).toLocaleDateString()}`);
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// Custom Validation Rule Builder
export const createValidator = (validationFn, errorMessage) => {
  return (value) => {
    try {
      const isValid = validationFn(value);
      return {
        isValid,
        errors: isValid ? [] : [errorMessage]
      };
    } catch (error) {
      return {
        isValid: false,
        errors: [errorMessage]
      };
    }
  };
};

// Validation Schemas for Common Forms
export const LOGIN_VALIDATION_SCHEMA = {
  email: [validateEmail],
  password: [(password) => ({
    isValid: !!password && password.length > 0,
    errors: !password || password.length === 0 ? ['Password is required'] : []
  })]
};

export const REGISTER_VALIDATION_SCHEMA = {
  firstName: [(name) => validateName(name, 'First name')],
  lastName: [(name) => validateName(name, 'Last name')],
  email: [validateEmail],
  password: [validatePassword],
  confirmPassword: [(confirmPassword, formData) => {
    if (!confirmPassword) {
      return { isValid: false, errors: ['Please confirm your password'] };
    }
    if (confirmPassword !== formData.password) {
      return { isValid: false, errors: ['Passwords do not match'] };
    }
    return { isValid: true, errors: [] };
  }]
};

export const PROFILE_UPDATE_SCHEMA = {
  firstName: [(name) => validateName(name, 'First name')],
  lastName: [(name) => validateName(name, 'Last name')],
  email: [validateEmail],
  phone: [(phone) => phone ? validatePhone(phone) : { isValid: true, errors: [] }]
};

export const ANSWER_VALIDATION_SCHEMA = {
  text: [validateAnswer]
};

export const INTERVIEW_CREATION_SCHEMA = {
  title: [createValidator(
    (title) => title && title.trim().length >= 3 && title.trim().length <= 100,
    'Title must be between 3 and 100 characters'
  )],
  description: [createValidator(
    (description) => !description || description.length <= 500,
    'Description must not exceed 500 characters'
  )]
};

// Batch Validation
export const validateMultiple = (data, schemas) => {
  const results = {};
  let overallValid = true;
  
  Object.keys(schemas).forEach(key => {
    if (data.hasOwnProperty(key)) {
      const result = validateForm({ [key]: data[key] }, { [key]: schemas[key] });
      results[key] = result;
      if (!result.isValid) {
        overallValid = false;
      }
    }
  });
  
  return {
    isValid: overallValid,
    results
  };
};

// Real-time Validation Helpers
export const createRealTimeValidator = (schema, debounceMs = 300) => {
  let timeoutId;
  
  return (formData, callback) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      const result = validateForm(formData, schema);
      callback(result);
    }, debounceMs);
  };
};

// Field-specific Validators
export const isRequired = (fieldName = 'Field') => 
  createValidator(
    (value) => value !== null && value !== undefined && String(value).trim().length > 0,
    `${fieldName} is required`
  );

export const minLength = (length, fieldName = 'Field') =>
  createValidator(
    (value) => !value || String(value).length >= length,
    `${fieldName} must be at least ${length} characters long`
  );

export const maxLength = (length, fieldName = 'Field') =>
  createValidator(
    (value) => !value || String(value).length <= length,
    `${fieldName} must not exceed ${length} characters`
  );

export const isNumeric = (fieldName = 'Field') =>
  createValidator(
    (value) => !value || !isNaN(Number(value)),
    `${fieldName} must be a valid number`
  );

export const isPositive = (fieldName = 'Field') =>
  createValidator(
    (value) => !value || (Number(value) > 0),
    `${fieldName} must be a positive number`
  );

export const isInRange = (min, max, fieldName = 'Field') =>
  createValidator(
    (value) => !value || (Number(value) >= min && Number(value) <= max),
    `${fieldName} must be between ${min} and ${max}`
  );