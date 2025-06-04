// frontend/src/utils/helpers.js

import { PERFORMANCE_SCORES, ANALYSIS_THRESHOLDS } from './constants.js';

// Time Formatting Utilities
export const formatTime = (seconds) => {
  if (typeof seconds !== 'number' || isNaN(seconds)) return '00:00';
  
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

export const formatDuration = (milliseconds) => {
  if (typeof milliseconds !== 'number' || isNaN(milliseconds)) return '0s';
  
  const totalSeconds = Math.floor(milliseconds / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  
  if (hours > 0) {
    return `${hours}h ${minutes}m ${seconds}s`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds}s`;
  } else {
    return `${seconds}s`;
  }
};

export const formatTimeAgo = (date) => {
  if (!date) return 'Unknown';
  
  const now = new Date();
  const diffInSeconds = Math.floor((now - new Date(date)) / 1000);
  
  const intervals = [
    { label: 'year', seconds: 31536000 },
    { label: 'month', seconds: 2592000 },
    { label: 'week', seconds: 604800 },
    { label: 'day', seconds: 86400 },
    { label: 'hour', seconds: 3600 },
    { label: 'minute', seconds: 60 },
    { label: 'second', seconds: 1 }
  ];
  
  for (const interval of intervals) {
    const count = Math.floor(diffInSeconds / interval.seconds);
    if (count >= 1) {
      return `${count} ${interval.label}${count !== 1 ? 's' : ''} ago`;
    }
  }
  
  return 'just now';
};

export const formatRelativeTime = (date) => {
  if (!date) return '';
  
  const now = new Date();
  const target = new Date(date);
  const diffInMs = target - now;
  const diffInSeconds = Math.floor(diffInMs / 1000);
  
  if (diffInSeconds > 0) {
    // Future time
    if (diffInSeconds < 60) return 'in a few seconds';
    if (diffInSeconds < 3600) return `in ${Math.floor(diffInSeconds / 60)} minutes`;
    if (diffInSeconds < 86400) return `in ${Math.floor(diffInSeconds / 3600)} hours`;
    return `in ${Math.floor(diffInSeconds / 86400)} days`;
  } else {
    // Past time
    return formatTimeAgo(date);
  }
};

// Progress and Calculation Utilities
export const calculateProgress = (current, total) => {
  if (!total || total === 0) return 0;
  return Math.min(Math.max((current / total) * 100, 0), 100);
};

export const calculatePercentage = (value, total, decimals = 1) => {
  if (!total || total === 0) return 0;
  return Number(((value / total) * 100).toFixed(decimals));
};

export const calculateAverage = (numbers) => {
  if (!Array.isArray(numbers) || numbers.length === 0) return 0;
  const validNumbers = numbers.filter(n => typeof n === 'number' && !isNaN(n));
  if (validNumbers.length === 0) return 0;
  return validNumbers.reduce((sum, num) => sum + num, 0) / validNumbers.length;
};

export const calculateWeightedAverage = (values) => {
  if (!Array.isArray(values) || values.length === 0) return 0;
  
  let totalValue = 0;
  let totalWeight = 0;
  
  for (const { value, weight } of values) {
    if (typeof value === 'number' && typeof weight === 'number' && !isNaN(value) && !isNaN(weight)) {
      totalValue += value * weight;
      totalWeight += weight;
    }
  }
  
  return totalWeight > 0 ? totalValue / totalWeight : 0;
};

// Score and Performance Utilities
export const getScoreColor = (score) => {
  if (typeof score !== 'number' || isNaN(score)) return PERFORMANCE_SCORES.COLORS.POOR;
  
  for (const [label, [min, max]] of Object.entries(PERFORMANCE_SCORES.RANGES)) {
    if (score >= min && score <= max) {
      return PERFORMANCE_SCORES.COLORS[label];
    }
  }
  
  return PERFORMANCE_SCORES.COLORS.POOR;
};

export const getScoreBadge = (score) => {
  if (typeof score !== 'number' || isNaN(score)) {
    return { text: 'N/A', color: 'bg-gray-500', textColor: 'text-white' };
  }
  
  for (const [label, [min, max]] of Object.entries(PERFORMANCE_SCORES.RANGES)) {
    if (score >= min && score <= max) {
      return {
        text: label.charAt(0).toUpperCase() + label.slice(1).toLowerCase().replace('_', ' '),
        color: getScoreColorClass(PERFORMANCE_SCORES.COLORS[label]),
        textColor: 'text-white'
      };
    }
  }
  
  return { text: 'Poor', color: 'bg-red-600', textColor: 'text-white' };
};

export const getScoreColorClass = (color) => {
  const colorMap = {
    '#10b981': 'bg-green-500',
    '#3b82f6': 'bg-blue-500',
    '#f59e0b': 'bg-amber-500',
    '#ef4444': 'bg-red-500',
    '#dc2626': 'bg-red-600'
  };
  
  return colorMap[color] || 'bg-gray-500';
};

export const getProgressColor = (percentage) => {
  if (percentage >= 90) return 'bg-green-500';
  if (percentage >= 70) return 'bg-blue-500';
  if (percentage >= 50) return 'bg-amber-500';
  if (percentage >= 30) return 'bg-orange-500';
  return 'bg-red-500';
};

export const getPerformanceLabel = (score) => {
  if (typeof score !== 'number' || isNaN(score)) return 'N/A';
  
  for (const [label, [min, max]] of Object.entries(PERFORMANCE_SCORES.RANGES)) {
    if (score >= min && score <= max) {
      return label.charAt(0).toUpperCase() + label.slice(1).toLowerCase().replace('_', ' ');
    }
  }
  
  return 'Poor';
};

// Text Formatting Utilities
export const truncateText = (text, maxLength = 100, suffix = '...') => {
  if (!text || typeof text !== 'string') return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength).trim() + suffix;
};

export const capitalizeFirst = (string) => {
  if (!string || typeof string !== 'string') return '';
  return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase();
};

export const capitalizeWords = (string) => {
  if (!string || typeof string !== 'string') return '';
  return string.replace(/\w\S*/g, (txt) => 
    txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
  );
};

export const slugify = (string) => {
  if (!string || typeof string !== 'string') return '';
  return string
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/[\s_-]+/g, '-') // Replace spaces and underscores with hyphens
    .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
};

export const formatCamelCase = (string) => {
  if (!string || typeof string !== 'string') return '';
  return string.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
};

// Validation Utilities
export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const isValidUrl = (string) => {
  try {
    new URL(string);
    return true;
  } catch (_) {
    return false;
  }
};

export const isValidPhoneNumber = (phone) => {
  const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
  return phoneRegex.test(phone.replace(/\s/g, ''));
};

export const isStrongPassword = (password) => {
  const minLength = 8;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  
  return password.length >= minLength && hasUpperCase && hasLowerCase && hasNumbers && hasSpecialChar;
};

// File Utilities
export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  if (typeof bytes !== 'number' || isNaN(bytes)) return 'Unknown';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export const getFileExtension = (filename) => {
  if (!filename || typeof filename !== 'string') return '';
  return filename.slice((filename.lastIndexOf('.') - 1 >>> 0) + 2);
};

export const getMimeType = (filename) => {
  const extension = getFileExtension(filename).toLowerCase();
  
  const mimeTypes = {
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'png': 'image/png',
    'gif': 'image/gif',
    'webp': 'image/webp',
    'mp4': 'video/mp4',
    'webm': 'video/webm',
    'avi': 'video/avi',
    'mov': 'video/quicktime',
    'mp3': 'audio/mpeg',
    'wav': 'audio/wav',
    'ogg': 'audio/ogg',
    'pdf': 'application/pdf',
    'doc': 'application/msword',
    'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'txt': 'text/plain',
    'json': 'application/json',
    'xml': 'application/xml'
  };
  
  return mimeTypes[extension] || 'application/octet-stream';
};

// Utility Functions
export const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

export const generateUUID = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

export const debounce = (func, wait, immediate = false) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      timeout = null;
      if (!immediate) func(...args);
    };
    const callNow = immediate && !timeout;
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
    if (callNow) func(...args);
  };
};

export const throttle = (func, limit) => {
  let inThrottle;
  return function executedFunction(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};

export const deepClone = (obj) => {
  if (obj === null || typeof obj !== 'object') return obj;
  if (obj instanceof Date) return new Date(obj.getTime());
  if (obj instanceof Array) return obj.map(item => deepClone(item));
  if (typeof obj === 'object') {
    const cloned = {};
    Object.keys(obj).forEach(key => {
      cloned[key] = deepClone(obj[key]);
    });
    return cloned;
  }
};

export const isEmpty = (value) => {
  if (value === null || value === undefined) return true;
  if (typeof value === 'string') return value.trim().length === 0;
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === 'object') return Object.keys(value).length === 0;
  return false;
};

// Download Utilities
export const downloadFile = (data, filename, type = 'application/json') => {
  const blob = new Blob([data], { type });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};

export const downloadJSON = (data, filename = 'data.json') => {
  const jsonString = JSON.stringify(data, null, 2);
  downloadFile(jsonString, filename, 'application/json');
};

export const downloadCSV = (data, filename = 'data.csv') => {
  if (!Array.isArray(data) || data.length === 0) return;
  
  const headers = Object.keys(data[0]).join(',');
  const rows = data.map(row => Object.values(row).join(','));
  const csvContent = [headers, ...rows].join('\n');
  
  downloadFile(csvContent, filename, 'text/csv');
};

// Clipboard Utilities
export const copyToClipboard = async (text) => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (err) {
    // Fallback for older browsers
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    try {
      const successful = document.execCommand('copy');
      document.body.removeChild(textArea);
      return successful;
    } catch (err) {
      document.body.removeChild(textArea);
      return false;
    }
  }
};

// JWT Utilities
export const parseJWT = (token) => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('Error parsing JWT:', error);
    return null;
  }
};

export const isTokenExpired = (token) => {
  try {
    const decoded = parseJWT(token);
    if (!decoded || !decoded.exp) return true;
    return decoded.exp * 1000 < Date.now();
  } catch (error) {
    return true;
  }
};

export const getTokenTimeLeft = (token) => {
  try {
    const decoded = parseJWT(token);
    if (!decoded || !decoded.exp) return 0;
    return Math.max(0, decoded.exp * 1000 - Date.now());
  } catch (error) {
    return 0;
  }
};

// Browser Utilities
export const getBrowserInfo = () => {
  const userAgent = navigator.userAgent;
  let browserName = 'Unknown';
  let browserVersion = 'Unknown';
  
  if (userAgent.indexOf('Chrome') > -1) {
    browserName = 'Chrome';
    browserVersion = userAgent.match(/Chrome\/(\d+)/)?.[1] || 'Unknown';
  } else if (userAgent.indexOf('Firefox') > -1) {
    browserName = 'Firefox';
    browserVersion = userAgent.match(/Firefox\/(\d+)/)?.[1] || 'Unknown';
  } else if (userAgent.indexOf('Safari') > -1) {
    browserName = 'Safari';
    browserVersion = userAgent.match(/Version\/(\d+)/)?.[1] || 'Unknown';
  } else if (userAgent.indexOf('Edge') > -1) {
    browserName = 'Edge';
    browserVersion = userAgent.match(/Edge\/(\d+)/)?.[1] || 'Unknown';
  }
  
  return { browserName, browserVersion };
};

export const isMobileDevice = () => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
};

export const getDeviceInfo = () => {
  return {
    isMobile: isMobileDevice(),
    screen: {
      width: window.screen.width,
      height: window.screen.height
    },
    viewport: {
      width: window.innerWidth,
      height: window.innerHeight
    },
    ...getBrowserInfo()
  };
};

// Color Utilities
export const hexToRgb = (hex) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
};

export const rgbToHex = (r, g, b) => {
  return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
};

export const generateRandomColor = () => {
  return '#' + Math.floor(Math.random()*16777215).toString(16);
};

// Analytics Utilities
export const calculateInterviewMetrics = (interviewData) => {
  if (!interviewData || !interviewData.answers) return null;
  
  const { answers, questions, startTime, endTime } = interviewData;
  const duration = endTime ? new Date(endTime) - new Date(startTime) : 0;
  
  return {
    totalQuestions: questions?.length || 0,
    answeredQuestions: answers.filter(a => !a.skipped).length,
    skippedQuestions: answers.filter(a => a.skipped).length,
    averageTimePerQuestion: duration && answers.length ? duration / answers.length : 0,
    completionRate: questions?.length ? (answers.length / questions.length) * 100 : 0,
    duration: duration
  };
};

export const calculateOverallScore = (scores) => {
  const { facial = 0, audio = 0, text = 0 } = scores;
  const weights = PERFORMANCE_SCORES.WEIGHTS;
  
  return (
    facial * weights.FACIAL_CONFIDENCE +
    audio * weights.AUDIO_QUALITY +
    text * weights.TEXT_RELEVANCE
  );
};