// frontend/src/utils/constants.js

// API Endpoints Configuration
export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/api/auth/login',
    REGISTER: '/api/auth/register',
    LOGOUT: '/api/auth/logout',
    REFRESH: '/api/auth/refresh',
    PROFILE: '/api/auth/profile',
    VERIFY_EMAIL: '/api/auth/verify-email',
    FORGOT_PASSWORD: '/api/auth/forgot-password',
    RESET_PASSWORD: '/api/auth/reset-password'
  },
  INTERVIEWS: {
    BASE: '/api/interviews',
    START: '/api/interviews/start',
    SUBMIT: '/api/interviews/submit',
    RESULTS: '/api/interviews/results',
    STATS: '/api/interviews/stats',
    ACTIVE: '/api/interviews/active',
    HISTORY: '/api/interviews/history'
  },
  EVALUATIONS: {
    BASE: '/api/evaluations',
    FACIAL: '/api/evaluations/facial',
    AUDIO: '/api/evaluations/audio',
    TEXT: '/api/evaluations/text',
    OVERALL: '/api/evaluations/overall',
    PROGRESS: '/api/evaluations/progress'
  },
  UPLOADS: {
    BASE: '/api/uploads',
    VIDEO: '/api/uploads/video',
    AUDIO: '/api/uploads/audio',
    IMAGE: '/api/uploads/image',
    BULK: '/api/uploads/bulk'
  },
  QUESTIONS: {
    BASE: '/api/questions',
    CATEGORIES: '/api/questions/categories',
    RANDOM: '/api/questions/random',
    TEMPLATES: '/api/questions/templates'
  },
  ANALYTICS: {
    BASE: '/api/analytics',
    DASHBOARD: '/api/analytics/dashboard',
    REPORTS: '/api/analytics/reports',
    EXPORT: '/api/analytics/export'
  }
};

// WebSocket Events Configuration
export const WEBSOCKET_EVENTS = {
  // Connection Events
  CONNECTION: 'connection',
  DISCONNECT: 'disconnect',
  RECONNECT: 'reconnect',
  ERROR: 'error',
  HEARTBEAT: 'heartbeat',
  
  // Authentication Events
  AUTH_SUCCESS: 'auth:success',
  AUTH_ERROR: 'auth:error',
  
  // Interview Events
  INTERVIEW_START: 'interview:start',
  INTERVIEW_END: 'interview:end',
  INTERVIEW_PAUSE: 'interview:pause',
  INTERVIEW_RESUME: 'interview:resume',
  INTERVIEW_CANCEL: 'interview:cancel',
  
  // Question Events
  QUESTION_START: 'question:start',
  QUESTION_END: 'question:end',
  QUESTION_SKIP: 'question:skip',
  QUESTION_ANSWERED: 'question:answered',
  
  // Analysis Events
  FACIAL_ANALYSIS_START: 'facial:start',
  FACIAL_ANALYSIS_PROGRESS: 'facial:progress',
  FACIAL_ANALYSIS_RESULT: 'facial:result',
  FACIAL_ANALYSIS_ERROR: 'facial:error',
  
  AUDIO_ANALYSIS_START: 'audio:start',
  AUDIO_ANALYSIS_PROGRESS: 'audio:progress',
  AUDIO_ANALYSIS_RESULT: 'audio:result',
  AUDIO_ANALYSIS_ERROR: 'audio:error',
  
  TEXT_ANALYSIS_START: 'text:start',
  TEXT_ANALYSIS_PROGRESS: 'text:progress',
  TEXT_ANALYSIS_RESULT: 'text:result',
  TEXT_ANALYSIS_ERROR: 'text:error',
  
  // Overall Results
  EVALUATION_START: 'evaluation:start',
  EVALUATION_PROGRESS: 'evaluation:progress',
  EVALUATION_COMPLETE: 'evaluation:complete',
  EVALUATION_ERROR: 'evaluation:error',
  
  // Real-time Updates
  PROGRESS_UPDATE: 'progress:update',
  STATUS_UPDATE: 'status:update',
  NOTIFICATION: 'notification'
};

// Application Status Constants
export const INTERVIEW_STATUS = {
  PENDING: 'pending',
  INITIALIZING: 'initializing',
  IN_PROGRESS: 'in-progress',
  PAUSED: 'paused',
  COMPLETING: 'completing',
  COMPLETED: 'completed',
  FAILED: 'failed',
  CANCELLED: 'cancelled',
  TIMEOUT: 'timeout'
};

export const QUESTION_STATUS = {
  NOT_STARTED: 'not-started',
  ACTIVE: 'active',
  ANSWERING: 'answering',
  COMPLETED: 'completed',
  SKIPPED: 'skipped',
  TIMEOUT: 'timeout'
};

export const ANALYSIS_STATUS = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  FAILED: 'failed',
  CANCELLED: 'cancelled'
};

// Analysis Configuration
export const ANALYSIS_THRESHOLDS = {
  FACIAL_CONFIDENCE: 80,
  AUDIO_QUALITY: 80,
  TEXT_RELEVANCE: 80,
  OVERALL_PASS: 80,
  
  // Performance thresholds
  EXCELLENT: 90,
  GOOD: 80,
  AVERAGE: 70,
  BELOW_AVERAGE: 50,
  POOR: 0
};

// Media Configuration
export const MEDIA_CONSTRAINTS = {
  VIDEO: {
    width: { ideal: 1280, max: 1920 },
    height: { ideal: 720, max: 1080 },
    facingMode: 'user',
    frameRate: { ideal: 30, max: 60 }
  },
  AUDIO: {
    echoCancellation: true,
    noiseSuppression: true,
    autoGainControl: true,
    sampleRate: 44100,
    channelCount: 1
  }
};

export const MEDIA_SETTINGS = {
  VIDEO_BITRATE: 2500000, // 2.5 Mbps
  AUDIO_BITRATE: 128000,  // 128 kbps
  MAX_RECORDING_DURATION: 300000, // 5 minutes in ms
  CHUNK_DURATION: 10000, // 10 seconds
  
  SUPPORTED_VIDEO_FORMATS: ['video/webm', 'video/mp4'],
  SUPPORTED_AUDIO_FORMATS: ['audio/webm', 'audio/wav', 'audio/mp3'],
  
  FILE_SIZE_LIMITS: {
    VIDEO: 50 * 1024 * 1024, // 50MB
    AUDIO: 10 * 1024 * 1024, // 10MB
    IMAGE: 5 * 1024 * 1024   // 5MB
  }
};

// Question Types
export const QUESTION_TYPES = {
  TEXT: 'text',
  AUDIO: 'audio',
  VIDEO: 'video',
  MIXED: 'mixed',
  CODING: 'coding',
  BEHAVIORAL: 'behavioral',
  TECHNICAL: 'technical',
  SITUATIONAL: 'situational'
};

export const QUESTION_DIFFICULTY = {
  EASY: 'easy',
  MEDIUM: 'medium',
  HARD: 'hard',
  EXPERT: 'expert'
};

// UI Constants
export const UI_CONSTANTS = {
  SIDEBAR_WIDTH: 280,
  SIDEBAR_COLLAPSED_WIDTH: 64,
  HEADER_HEIGHT: 64,
  FOOTER_HEIGHT: 60,
  
  BREAKPOINTS: {
    SM: 640,
    MD: 768,
    LG: 1024,
    XL: 1280,
    XXL: 1536
  },
  
  ANIMATION_DURATION: {
    FAST: 150,
    NORMAL: 300,
    SLOW: 500
  }
};

// Error Messages
export const ERROR_MESSAGES = {
  // Authentication Errors
  INVALID_SESSION: 'Your session has expired. Please log in again.',
  ACCESS_DENIED: 'Access denied. You do not have permission to perform this action.',
  AUTHENTICATION_REQUIRED: 'Authentication required. Please log in to continue.',
  
  // Media Errors
  CAMERA_ACCESS_DENIED: 'Camera access denied. Please allow camera permissions to continue with the interview.',
  MICROPHONE_ACCESS_DENIED: 'Microphone access denied. Please allow microphone permissions to continue.',
  MEDIA_DEVICE_ERROR: 'Media device error. Please check your camera and microphone.',
  MEDIA_NOT_SUPPORTED: 'Your browser does not support the required media features.',
  
  // Network Errors
  NETWORK_ERROR: 'Network error. Please check your internet connection and try again.',
  SERVER_ERROR: 'Server error. Please try again later or contact support.',
  CONNECTION_TIMEOUT: 'Connection timeout. Please check your internet connection.',
  WEBSOCKET_ERROR: 'Real-time connection error. Please refresh the page.',
  
  // Interview Errors
  INTERVIEW_NOT_FOUND: 'Interview not found. Please check the interview link.',
  INTERVIEW_EXPIRED: 'This interview has expired. Please contact the administrator.',
  INTERVIEW_ALREADY_COMPLETED: 'This interview has already been completed.',
  INTERVIEW_IN_PROGRESS: 'An interview is already in progress.',
  
  // Upload Errors
  UPLOAD_FAILED: 'File upload failed. Please try again.',
  FILE_TOO_LARGE: 'File size exceeds the maximum limit.',
  INVALID_FILE_TYPE: 'Invalid file type. Please select a supported file format.',
  
  // Analysis Errors
  ANALYSIS_FAILED: 'Analysis failed. Please try again or contact support.',
  FACIAL_ANALYSIS_ERROR: 'Facial analysis could not be completed.',
  AUDIO_ANALYSIS_ERROR: 'Audio analysis could not be completed.',
  TEXT_ANALYSIS_ERROR: 'Text analysis could not be completed.',
  
  // General Errors
  VALIDATION_ERROR: 'Please check the form for errors and try again.',
  UNKNOWN_ERROR: 'An unexpected error occurred. Please try again.',
  FEATURE_NOT_AVAILABLE: 'This feature is not available in your current plan.'
};

// Success Messages
export const SUCCESS_MESSAGES = {
  LOGIN_SUCCESS: 'Successfully logged in. Welcome back!',
  LOGOUT_SUCCESS: 'Successfully logged out.',
  REGISTRATION_SUCCESS: 'Registration successful. Welcome to InterviewX!',
  
  INTERVIEW_STARTED: 'Interview started successfully.',
  INTERVIEW_COMPLETED: 'Interview completed successfully!',
  INTERVIEW_SUBMITTED: 'Interview submitted successfully.',
  
  ANSWER_SAVED: 'Answer saved successfully.',
  UPLOAD_SUCCESS: 'File uploaded successfully.',
  
  ANALYSIS_COMPLETE: 'Analysis completed successfully.',
  RESULTS_GENERATED: 'Results generated successfully.',
  
  SETTINGS_UPDATED: 'Settings updated successfully.',
  PROFILE_UPDATED: 'Profile updated successfully.'
};

// Validation Rules
export const VALIDATION_RULES = {
  PASSWORD: {
    MIN_LENGTH: 8,
    MAX_LENGTH: 128,
    REQUIRE_UPPERCASE: true,
    REQUIRE_LOWERCASE: true,
    REQUIRE_NUMBER: true,
    REQUIRE_SPECIAL_CHAR: true,
    SPECIAL_CHARS: '!@#$%^&*(),.?":{}|<>'
  },
  EMAIL: {
    PATTERN: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    MAX_LENGTH: 254
  },
  NAME: {
    MIN_LENGTH: 2,
    MAX_LENGTH: 50,
    PATTERN: /^[a-zA-Z\s'-]+$/
  },
  ANSWER: {
    MIN_LENGTH: 10,
    MAX_LENGTH: 2000
  },
  PHONE: {
    PATTERN: /^[\+]?[1-9][\d]{0,15}$/
  }
};

// Local Storage Keys
export const LOCAL_STORAGE_KEYS = {
  USER_TOKEN: 'interviewx_user_token',
  USER_PREFERENCES: 'interviewx_user_preferences',
  INTERVIEW_DATA: 'interviewx_interview_backup',
  MEDIA_SETTINGS: 'interviewx_media_settings',
  ANALYSIS_RESULTS: 'interviewx_analysis_cache',
  THEME_PREFERENCE: 'interviewx_theme',
  LANGUAGE_PREFERENCE: 'interviewx_language'
};

// WebSocket Configuration
export const WEBSOCKET_CONFIG = {
  RECONNECT_INTERVAL: 3000,
  MAX_RECONNECT_ATTEMPTS: 5,
  HEARTBEAT_INTERVAL: 30000,
  CONNECTION_TIMEOUT: 10000,
  PING_TIMEOUT: 5000,
  
  RETRY_DELAYS: [1000, 2000, 4000, 8000, 16000], // Exponential backoff
  
  MESSAGE_TYPES: {
    PING: 'ping',
    PONG: 'pong',
    AUTH: 'auth',
    DATA: 'data',
    ERROR: 'error'
  }
};

// API Configuration
export const API_CONFIG = {
  TIMEOUT: 30000,
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000,
  
  RATE_LIMIT: {
    REQUESTS_PER_MINUTE: 60,
    BURST_LIMIT: 10
  },
  
  CACHE_DURATION: {
    SHORT: 5 * 60 * 1000,  // 5 minutes
    MEDIUM: 30 * 60 * 1000, // 30 minutes
    LONG: 24 * 60 * 60 * 1000 // 24 hours
  }
};

// Performance Scoring
export const PERFORMANCE_SCORES = {
  RANGES: {
    EXCELLENT: [90, 100],
    GOOD: [80, 89],
    AVERAGE: [70, 79],
    BELOW_AVERAGE: [50, 69],
    POOR: [0, 49]
  },
  
  WEIGHTS: {
    FACIAL_CONFIDENCE: 0.3,
    AUDIO_QUALITY: 0.3,
    TEXT_RELEVANCE: 0.4
  },
  
  LABELS: {
    90: 'Excellent',
    80: 'Good',
    70: 'Average',
    50: 'Below Average',
    0: 'Poor'
  },
  
  COLORS: {
    EXCELLENT: '#10b981', // green-500
    GOOD: '#3b82f6',      // blue-500
    AVERAGE: '#f59e0b',   // amber-500
    BELOW_AVERAGE: '#ef4444', // red-500
    POOR: '#dc2626'       // red-600
  }
};

// Feature Flags
export const FEATURE_FLAGS = {
  ENABLE_REAL_TIME_ANALYSIS: true,
  ENABLE_VIDEO_RECORDING: true,
  ENABLE_AUDIO_RECORDING: true,
  ENABLE_SCREEN_SHARING: false,
  ENABLE_AI_SUGGESTIONS: true,
  ENABLE_EXPORT_RESULTS: true,
  ENABLE_ANALYTICS: true,
  ENABLE_NOTIFICATIONS: true,
  ENABLE_DARK_MODE: true,
  ENABLE_MULTI_LANGUAGE: false
};

// Environment Configuration
export const ENV_CONFIG = {
  DEVELOPMENT: {
    API_URL: 'http://localhost:5000',
    WS_URL: 'ws://localhost:5000',
    DEBUG: true
  },
  STAGING: {
    API_URL: 'https://staging-api.interviewx.com',
    WS_URL: 'wss://staging-api.interviewx.com',
    DEBUG: false
  },
  PRODUCTION: {
    API_URL: 'https://api.interviewx.com',
    WS_URL: 'wss://api.interviewx.com',
    DEBUG: false
  }
};

// Export environment-specific config
export const getCurrentConfig = () => {
  const env = import.meta.env.MODE || 'development';
  return ENV_CONFIG[env.toUpperCase()] || ENV_CONFIG.DEVELOPMENT;
};