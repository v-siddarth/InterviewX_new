// backend/src/middleware/rateLimiter.js
import rateLimit from 'express-rate-limit';
import { config } from '../utils/config.js';

export const rateLimiter = rateLimit({
  windowMs: config.RATE_LIMIT_WINDOW,
  max: config.RATE_LIMIT_MAX,
  message: {
    message: 'Too many requests from this IP, please try again later'
  },
  standardHeaders: true,
  legacyHeaders: false
});