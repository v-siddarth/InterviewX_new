
// backend/src/utils/config.js
import dotenv from 'dotenv';

dotenv.config();

export const config = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: process.env.PORT || 5000,
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/interviewx',
  JWT_SECRET: process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production',
  JWT_EXPIRE: process.env.JWT_EXPIRE || '7d',
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:3000',
  
  // AI Service URLs
  FACIAL_ANALYSIS_URL: process.env.FACIAL_ANALYSIS_URL || 'http://localhost:8001',
  AUDIO_ANALYSIS_URL: process.env.AUDIO_ANALYSIS_URL || 'http://localhost:8002',
  TEXT_ANALYSIS_URL: process.env.TEXT_ANALYSIS_URL || 'http://localhost:8003',
  
  // File upload settings
  MAX_FILE_SIZE: process.env.MAX_FILE_SIZE || 50 * 1024 * 1024, // 50MB
  UPLOAD_PATH: process.env.UPLOAD_PATH || './uploads',
  
  // Rate limiting
  RATE_LIMIT_WINDOW: process.env.RATE_LIMIT_WINDOW || 15 * 60 * 1000, // 15 minutes
  RATE_LIMIT_MAX: process.env.RATE_LIMIT_MAX || 100, // requests per window
};