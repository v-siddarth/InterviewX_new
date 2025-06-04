import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import { createServer } from 'http';
import { Server } from 'socket.io';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Custom async error handler
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// Simple logger utility
const logger = {
  info: (message, ...args) => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] INFO: ${message}`, ...args);
  },
  error: (message, ...args) => {
    const timestamp = new Date().toISOString();
    console.error(`[${timestamp}] ERROR: ${message}`, ...args);
  },
  warn: (message, ...args) => {
    const timestamp = new Date().toISOString();
    console.warn(`[${timestamp}] WARN: ${message}`, ...args);
  }
};

// Configuration
const config = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: process.env.PORT || 5000,
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/interviewx',
  JWT_SECRET: process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production',
  JWT_EXPIRE: process.env.JWT_EXPIRE || '7d',
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:3000',
  FACIAL_ANALYSIS_URL: process.env.FACIAL_ANALYSIS_URL || 'http://localhost:8001',
  AUDIO_ANALYSIS_URL: process.env.AUDIO_ANALYSIS_URL || 'http://localhost:8002',
  TEXT_ANALYSIS_URL: process.env.TEXT_ANALYSIS_URL || 'http://localhost:8003',
  MAX_FILE_SIZE: process.env.MAX_FILE_SIZE || 50 * 1024 * 1024,
  UPLOAD_PATH: process.env.UPLOAD_PATH || './uploads',
  RATE_LIMIT_WINDOW: process.env.RATE_LIMIT_WINDOW || 15 * 60 * 1000,
  RATE_LIMIT_MAX: process.env.RATE_LIMIT_MAX || 100,
};

// Initialize Express app
const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: config.FRONTEND_URL,
    methods: ['GET', 'POST']
  }
});

// Middleware
app.use(helmet());
app.use(cors({
  origin: config.FRONTEND_URL,
  credentials: true
}));
app.use(compression());
app.use(morgan('combined'));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Simple rate limiter with higher limits for development
const requestCounts = new Map();
const rateLimiter = (req, res, next) => {
  // Skip rate limiting in development
  if (config.NODE_ENV === 'development') {
    return next();
  }
  
  const ip = req.ip || req.connection.remoteAddress;
  const now = Date.now();
  const windowStart = now - config.RATE_LIMIT_WINDOW;
  
  if (!requestCounts.has(ip)) {
    requestCounts.set(ip, []);
  }
  
  const requests = requestCounts.get(ip).filter(time => time > windowStart);
  
  if (requests.length >= config.RATE_LIMIT_MAX) {
    return res.status(429).json({
      message: 'Too many requests from this IP, please try again later'
    });
  }
  
  requests.push(now);
  requestCounts.set(ip, requests);
  next();
};

// Apply rate limiting only in production
if (config.NODE_ENV === 'production') {
  app.use(rateLimiter);
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    service: 'InterviewX Backend',
    version: '1.0.0'
  });
});

// Mock data with proper field names and admin user
const users = [
  {
    _id: '1',
    firstName: 'Demo',
    lastName: 'User',
    email: 'demo@interviewx.com',
    password: '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewqmtYEOxfOqlPAK', // demo123
    role: 'candidate',
    isActive: true,
    createdAt: new Date().toISOString(),
    lastLogin: new Date(Date.now() - 86400000).toISOString(),
    stats: {
      totalInterviews: 5,
      completedInterviews: 3,
      averageScore: 82
    }
  },
  {
    _id: '2',
    firstName: 'Admin',
    lastName: 'User',
    email: 'admin@interviewx.com',
    password: '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewqmtYEOxfOqlPAK', // admin123
    role: 'admin',
    isActive: true,
    createdAt: new Date(Date.now() - 86400000 * 30).toISOString(),
    lastLogin: new Date().toISOString(),
    stats: {
      totalInterviews: 0,
      completedInterviews: 0,
      averageScore: 0
    }
  },
  {
    _id: '3',
    firstName: 'Sarah',
    lastName: 'Johnson',
    email: 'sarah@example.com',
    password: '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewqmtYEOxfOqlPAK',
    role: 'candidate',
    isActive: true,
    createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
    lastLogin: new Date(Date.now() - 172800000).toISOString(),
    stats: {
      totalInterviews: 2,
      completedInterviews: 1,
      averageScore: 76
    }
  }
];

const interviews = [
  {
    _id: '1',
    userId: '1',
    title: 'Frontend Developer Assessment',
    type: 'technical',
    duration: 30,
    status: 'completed',
    score: 85,
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    completedAt: new Date(Date.now() - 86400000 + 1800000).toISOString(),
    questions: [
      { id: 1, text: 'Tell me about yourself', type: 'behavioral', timeLimit: 300 },
      { id: 2, text: 'Explain React hooks', type: 'technical', timeLimit: 240 },
      { id: 3, text: 'What is closure in JavaScript?', type: 'technical', timeLimit: 180 }
    ]
  }
];

const questions = [
  {
    _id: '1',
    text: 'What is closure in JavaScript?',
    category: 'JavaScript',
    difficulty: 'Medium',
    type: 'Text Answer',
    timeLimit: 300,
    usageCount: 45,
    createdAt: new Date(Date.now() - 86400000 * 10).toISOString(),
  },
  {
    _id: '2',
    text: 'Explain the difference between let, const, and var',
    category: 'JavaScript',
    difficulty: 'Easy',
    type: 'Text Answer',
    timeLimit: 240,
    usageCount: 78,
    createdAt: new Date(Date.now() - 86400000 * 15).toISOString(),
  },
  {
    _id: '3',
    text: 'What is the output of the following code?',
    category: 'JavaScript',
    difficulty: 'Hard',
    type: 'Multiple Choice',
    timeLimit: 180,
    options: [
      'undefined',
      'null',
      'ReferenceError',
      'TypeError'
    ],
    correctAnswer: 2,
    usageCount: 23,
    createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
  }
];

// Helper function to generate initials for avatar
const generateInitials = (firstName, lastName) => {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
};

// Helper function to create fallback avatar
const createFallbackAvatar = (firstName, lastName) => {
  const initials = generateInitials(firstName, lastName);
  const colors = ['3B82F6', 'EF4444', '10B981', 'F59E0B', '8B5CF6', 'EC4899'];
  const color = colors[Math.floor(Math.random() * colors.length)];
  
  // Create a data URI for the avatar instead of external URL
  return `data:image/svg+xml;base64,${btoa(`
    <svg width="100" height="100" xmlns="http://www.w3.org/2000/svg">
      <rect width="100" height="100" fill="#${color}"/>
      <text x="50" y="50" font-family="Arial, sans-serif" font-size="36" font-weight="bold" text-anchor="middle" dy=".1em" fill="white">${initials}</text>
    </svg>
  `)}`;
};

// Simple auth middleware
const requireAuth = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) {
    return res.status(401).json({ message: 'No token provided' });
  }
  // In a real app, verify JWT token here
  next();
};

// Admin auth middleware
const requireAdmin = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) {
    return res.status(401).json({ message: 'No token provided' });
  }
  // In a real app, verify JWT token and check role here
  // For now, just pass through
  next();
};

// Auth Routes
app.post('/api/auth/login', asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  
  const user = users.find(u => u.email === email);
  
  if ((email === 'demo@interviewx.com' && password === 'demo123') ||
      (email === 'admin@interviewx.com' && password === 'admin123')) {
    
    const token = 'mock-jwt-token';
    
    res.json({
      message: 'Login successful',
      token,
      user: {
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        avatar: createFallbackAvatar(user.firstName, user.lastName),
        role: user.role,
        stats: user.stats
      }
    });
  } else {
    res.status(400).json({ message: 'Invalid credentials' });
  }
}));

app.post('/api/auth/register', asyncHandler(async (req, res) => {
  const { firstName, lastName, email, password } = req.body;
  
  // Check if user already exists
  const existingUser = users.find(u => u.email === email);
  if (existingUser) {
    return res.status(400).json({ message: 'User already exists with this email' });
  }
  
  const newUser = {
    _id: Date.now().toString(),
    firstName,
    lastName,
    email,
    password: 'hashed-password',
    role: 'candidate',
    isActive: true,
    createdAt: new Date().toISOString(),
    lastLogin: null,
    stats: {
      totalInterviews: 0,
      completedInterviews: 0,
      averageScore: 0
    }
  };
  
  users.push(newUser);
  
  res.status(201).json({
    message: 'User created successfully',
    token: 'mock-jwt-token-new',
    user: {
      _id: newUser._id,
      firstName: newUser.firstName,
      lastName: newUser.lastName,
      email: newUser.email,
      avatar: createFallbackAvatar(newUser.firstName, newUser.lastName),
      role: newUser.role,
      stats: newUser.stats
    }
  });
}));

// Profile Routes (existing)
app.get('/api/profile', requireAuth, (req, res) => {
  const user = users[0]; // Mock current user
  res.json({
    user: {
      _id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      avatar: createFallbackAvatar(user.firstName, user.lastName),
      role: user.role,
      stats: user.stats,
      phone: '',
      location: '',
      jobTitle: '',
      skills: [],
      education: '',
      about: '',
      profileImage: null,
      resumeUrl: null
    }
  });
});

// Admin Routes
// Dashboard
app.get('/api/admin/dashboard/stats', requireAdmin, (req, res) => {
  res.json({
    totalUsers: users.length,
    activeInterviews: interviews.filter(i => i.status === 'in-progress').length,
    completedInterviews: interviews.filter(i => i.status === 'completed').length,
    totalQuestions: questions.length,
  });
});

app.get('/api/admin/dashboard/activities', requireAdmin, (req, res) => {
  const activities = [
    {
      type: 'user',
      title: 'New user registration: John Doe',
      time: '2 minutes ago',
      color: 'bg-blue-100'
    },
    {
      type: 'interview',
      title: 'Interview completed by Sarah Wilson',
      time: '15 minutes ago',
      color: 'bg-green-100'
    },
    {
      type: 'question',
      title: 'New question added to JavaScript category',
      time: '1 hour ago',
      color: 'bg-purple-100'
    }
  ];
  res.json(activities);
});

// User Management
app.get('/api/admin/users', requireAdmin, (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  
  res.json({
    users: users,
    totalPages: 1,
    currentPage: parseInt(page),
    total: users.length
  });
});

app.get('/api/admin/users/stats', requireAdmin, (req, res) => {
  res.json({
    totalUsers: users.length,
    activeUsers: users.filter(u => u.isActive).length,
    adminUsers: users.filter(u => u.role === 'admin').length,
    newThisMonth: users.filter(u => {
      const userDate = new Date(u.createdAt);
      const monthAgo = new Date();
      monthAgo.setMonth(monthAgo.getMonth() - 1);
      return userDate > monthAgo;
    }).length
  });
});

app.put('/api/admin/users/:userId/role', requireAdmin, (req, res) => {
  const { userId } = req.params;
  const { role } = req.body;
  
  const user = users.find(u => u._id === userId);
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }
  
  user.role = role;
  res.json({ message: 'User role updated successfully', user });
});

app.put('/api/admin/users/:userId/status', requireAdmin, (req, res) => {
  const { userId } = req.params;
  const { status } = req.body;
  
  const user = users.find(u => u._id === userId);
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }
  
  user.isActive = status === 'active';
  res.json({ message: 'User status updated successfully', user });
});

app.delete('/api/admin/users/:userId', requireAdmin, (req, res) => {
  const { userId } = req.params;
  const userIndex = users.findIndex(u => u._id === userId);
  
  if (userIndex === -1) {
    return res.status(404).json({ message: 'User not found' });
  }
  
  users.splice(userIndex, 1);
  res.json({ message: 'User deleted successfully' });
});

// Question Management
app.get('/api/admin/questions', requireAdmin, (req, res) => {
  const { page = 1, limit = 20 } = req.query;
  
  res.json({
    questions: questions,
    totalPages: 1,
    currentPage: parseInt(page),
    total: questions.length
  });
});

app.post('/api/admin/questions', requireAdmin, (req, res) => {
  const newQuestion = {
    _id: Date.now().toString(),
    ...req.body,
    usageCount: 0,
    createdAt: new Date().toISOString()
  };
  
  questions.push(newQuestion);
  res.status(201).json(newQuestion);
});

app.put('/api/admin/questions/:questionId', requireAdmin, (req, res) => {
  const { questionId } = req.params;
  const questionIndex = questions.findIndex(q => q._id === questionId);
  
  if (questionIndex === -1) {
    return res.status(404).json({ message: 'Question not found' });
  }
  
  questions[questionIndex] = { ...questions[questionIndex], ...req.body };
  res.json(questions[questionIndex]);
});

app.delete('/api/admin/questions/:questionId', requireAdmin, (req, res) => {
  const { questionId } = req.params;
  const questionIndex = questions.findIndex(q => q._id === questionId);
  
  if (questionIndex === -1) {
    return res.status(404).json({ message: 'Question not found' });
  }
  
  questions.splice(questionIndex, 1);
  res.json({ message: 'Question deleted successfully' });
});

app.post('/api/admin/questions/generate-set', requireAdmin, (req, res) => {
  const { count = 10, categories = [], difficulty = null } = req.body;
  
  let filteredQuestions = questions;
  
  if (categories.length > 0) {
    filteredQuestions = filteredQuestions.filter(q => categories.includes(q.category));
  }
  
  if (difficulty) {
    filteredQuestions = filteredQuestions.filter(q => q.difficulty === difficulty);
  }
  
  // Shuffle and take requested count
  const shuffled = filteredQuestions.sort(() => 0.5 - Math.random());
  const selectedQuestions = shuffled.slice(0, Math.min(count, shuffled.length));
  
  res.json(selectedQuestions);
});

// ============= NEW ADMIN ROUTES ADDED BELOW =============

// Results Management Routes
app.get('/api/admin/results', requireAdmin, (req, res) => {
  const { page = 1, limit = 20, status, dateRange, search } = req.query;
  
  // Mock results data
  const mockResults = [
    {
      _id: '1',
      interviewId: 'int_001',
      userId: '1',
      userName: 'Demo User',
      userEmail: 'demo@interviewx.com',
      interviewTitle: 'Frontend Developer Assessment',
      overallScore: 85,
      faceConfidence: 88,
      audioQuality: 90,
      answerRelevance: 82,
      status: 'completed',
      duration: 1845,
      completedAt: new Date(Date.now() - 86400000).toISOString(),
      passed: true,
      strengths: ['Technical knowledge', 'Communication', 'Problem solving'],
      improvements: ['More specific examples', 'Confidence in answers'],
      detailedAnalysis: {
        facial: { confidence: 88, eyeContact: 92, posture: 85 },
        audio: { clarity: 90, pace: 78, volume: 85 },
        content: { relevance: 87, depth: 82, structure: 90 }
      }
    },
    {
      _id: '2',
      interviewId: 'int_002',
      userId: '3',
      userName: 'Sarah Johnson',
      userEmail: 'sarah@example.com',
      interviewTitle: 'Backend Developer Position',
      overallScore: 76,
      faceConfidence: 82,
      audioQuality: 85,
      answerRelevance: 71,
      status: 'completed',
      duration: 2145,
      completedAt: new Date(Date.now() - 172800000).toISOString(),
      passed: true,
      strengths: ['System design', 'Database knowledge'],
      improvements: ['Communication clarity', 'Code optimization'],
      detailedAnalysis: {
        facial: { confidence: 82, eyeContact: 78, posture: 80 },
        audio: { clarity: 85, pace: 82, volume: 88 },
        content: { relevance: 71, depth: 75, structure: 85 }
      }
    }
  ];

  let filteredResults = mockResults;
  
  if (search) {
    const searchLower = search.toLowerCase();
    filteredResults = filteredResults.filter(result => 
      result.userName.toLowerCase().includes(searchLower) ||
      result.userEmail.toLowerCase().includes(searchLower) ||
      result.interviewTitle.toLowerCase().includes(searchLower)
    );
  }
  
  if (status) {
    filteredResults = filteredResults.filter(result => result.status === status);
  }

  res.json({
    results: filteredResults,
    totalPages: Math.ceil(filteredResults.length / limit),
    currentPage: parseInt(page),
    total: filteredResults.length
  });
});

app.get('/api/admin/results/stats', requireAdmin, (req, res) => {
  res.json({
    totalResults: 156,
    averageScore: 84.2,
    passRate: 87,
    avgDuration: 28 * 60 // in seconds
  });
});

app.get('/api/admin/results/:resultId', requireAdmin, (req, res) => {
  const { resultId } = req.params;
  
  // Mock detailed result
  const mockResult = {
    _id: resultId,
    interviewId: 'int_001',
    userId: '1',
    userName: 'Demo User',
    userEmail: 'demo@interviewx.com',
    interviewTitle: 'Frontend Developer Assessment',
    overallScore: 85,
    faceConfidence: 88,
    audioQuality: 90,
    answerRelevance: 82,
    status: 'completed',
    duration: 1845,
    completedAt: new Date(Date.now() - 86400000).toISOString(),
    passed: true,
    questions: [
      {
        id: 1,
        text: 'Tell me about yourself',
        answer: 'I am a frontend developer with 3 years of experience...',
        score: 85,
        timeSpent: 280
      },
      {
        id: 2,
        text: 'Explain React hooks',
        answer: 'React hooks are functions that let you use state...',
        score: 92,
        timeSpent: 340
      }
    ],
    detailedAnalysis: {
      facial: { confidence: 88, eyeContact: 92, posture: 85, expressiveness: 80 },
      audio: { clarity: 90, pace: 78, volume: 85, filler_words: 15 },
      content: { relevance: 87, depth: 82, structure: 90, examples: 75 }
    }
  };

  res.json(mockResult);
});

// System Settings Routes
app.get('/api/admin/settings', requireAdmin, (req, res) => {
  const mockSettings = {
    general: {
      siteName: 'InterviewX',
      siteDescription: 'AI-Powered Interview Assessment Platform',
      adminEmail: 'admin@interviewx.com',
      timezone: 'UTC',
      language: 'en',
      maintenanceMode: false
    },
    interview: {
      maxDuration: 60,
      minDuration: 5,
      defaultQuestionCount: 10,
      autoSave: true,
      allowRetakes: false,
      passThreshold: 70
    },
    ai: {
      faceAnalysisEnabled: true,
      audioAnalysisEnabled: true,
      textAnalysisEnabled: true,
      confidenceThreshold: 80,
      faceAnalysisUrl: config.FACIAL_ANALYSIS_URL,
      audioAnalysisUrl: config.AUDIO_ANALYSIS_URL,
      textAnalysisUrl: config.TEXT_ANALYSIS_URL,
      geminiApiKey: '***********'
    },
    email: {
      smtpHost: 'smtp.gmail.com',
      smtpPort: 587,
      smtpUser: 'noreply@interviewx.com',
      smtpPassword: '***********',
      fromEmail: 'InterviewX <noreply@interviewx.com>',
      enableNotifications: true
    },
    security: {
      passwordMinLength: 8,
      requireSpecialChars: true,
      sessionTimeout: 24,
      maxLoginAttempts: 5,
      enableTwoFactor: false,
      maxFileSize: 10
    },
    backup: {
      autoBackup: true,
      backupFrequency: 'daily',
      retentionDays: 30,
      backupLocation: 'local'
    }
  };

  res.json(mockSettings);
});

app.put('/api/admin/settings', requireAdmin, (req, res) => {
  const updatedSettings = req.body;
  
  // In a real app, save to database
  logger.info('Settings updated:', updatedSettings);
  
  res.json({
    message: 'Settings updated successfully',
    settings: updatedSettings
  });
});

// Question Categories Route
app.get('/api/admin/questions/categories', requireAdmin, (req, res) => {
  const categories = [
    'Technical',
    'Behavioral',
    'Problem Solving',
    'Communication',
    'Leadership',
    'JavaScript',
    'React',
    'Node.js',
    'Python',
    'Data Structures',
    'Algorithms',
    'System Design',
    'Database',
    'DevOps'
  ];

  res.json(categories);
});

// Bulk question operations
app.delete('/api/admin/questions/bulk', requireAdmin, (req, res) => {
  const { questionIds } = req.body;
  
  questionIds.forEach(id => {
    const index = questions.findIndex(q => q._id === id);
    if (index !== -1) {
      questions.splice(index, 1);
    }
  });

  res.json({
    message: `${questionIds.length} questions deleted successfully`
  });
});

// Export routes
app.get('/api/admin/questions/export', requireAdmin, (req, res) => {
  const { format = 'csv' } = req.query;
  
  if (format === 'csv') {
    let csv = 'ID,Text,Category,Difficulty,Type,Time Limit,Usage Count,Created At\n';
    
    questions.forEach(q => {
      csv += `${q._id},"${q.text}",${q.category},${q.difficulty},${q.type},${q.timeLimit},${q.usageCount || 0},${q.createdAt}\n`;
    });
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=questions.csv');
    res.send(csv);
  } else {
    res.json(questions);
  }
});

app.get('/api/admin/users/export', requireAdmin, (req, res) => {
  const { format = 'csv' } = req.query;
  
  if (format === 'csv') {
    let csv = 'ID,First Name,Last Name,Email,Role,Status,Created At,Last Login\n';
    
    users.forEach(u => {
      csv += `${u._id},${u.firstName},${u.lastName},${u.email},${u.role},${u.isActive ? 'Active' : 'Inactive'},${u.createdAt},${u.lastLogin || 'Never'}\n`;
    });
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=users.csv');
    res.send(csv);
  } else {
    res.json(users);
  }
});

app.get('/api/admin/results/export', requireAdmin, (req, res) => {
  const { format = 'csv' } = req.query;
  
  const mockResults = [
    {
      _id: '1',
      userName: 'Demo User',
      userEmail: 'demo@interviewx.com',
      interviewTitle: 'Frontend Developer Assessment',
      overallScore: 85,
      status: 'completed',
      completedAt: new Date(Date.now() - 86400000).toISOString()
    }
  ];
  
  if (format === 'csv') {
    let csv = 'ID,User Name,Email,Interview,Score,Status,Completed At\n';
    
    mockResults.forEach(r => {
      csv += `${r._id},${r.userName},${r.userEmail},"${r.interviewTitle}",${r.overallScore},${r.status},${r.completedAt}\n`;
    });
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=results.csv');
    res.send(csv);
  } else {
    res.json(mockResults);
  }
});

// Analytics routes
app.get('/api/admin/analytics/performance', requireAdmin, (req, res) => {
  const { timeframe = '30d' } = req.query;
  
  const mockAnalytics = {
    timeframe,
    totalInterviews: 245,
    completedInterviews: 189,
    averageScore: 84.2,
    passRate: 87.3,
    topCategories: [
      { category: 'JavaScript', count: 45, avgScore: 86 },
      { category: 'React', count: 38, avgScore: 82 },
      { category: 'Node.js', count: 32, avgScore: 79 }
    ],
    scoreDistribution: [
      { range: '0-20', count: 2 },
      { range: '21-40', count: 8 },
      { range: '41-60', count: 15 },
      { range: '61-80', count: 67 },
      { range: '81-100', count: 97 }
    ],
    dailyStats: Array.from({ length: 30 }, (_, i) => ({
      date: new Date(Date.now() - i * 86400000).toISOString().split('T')[0],
      interviews: Math.floor(Math.random() * 15) + 5,
      avgScore: Math.floor(Math.random() * 20) + 75
    })).reverse()
  };

  res.json(mockAnalytics);
});

// System health and logs
app.get('/api/admin/system/logs', requireAdmin, (req, res) => {
  const { page = 1, level = 'all' } = req.query;
  
  const mockLogs = [
    {
      timestamp: new Date().toISOString(),
      level: 'info',
      message: 'User login successful',
      details: { userId: '1', ip: '192.168.1.1' }
    },
    {
      timestamp: new Date(Date.now() - 300000).toISOString(),
      level: 'warn',
      message: 'High memory usage detected',
      details: { usage: '85%' }
    },
    {
      timestamp: new Date(Date.now() - 600000).toISOString(),
      level: 'error',
      message: 'Failed to connect to AI service',
      details: { service: 'face-analysis', error: 'Connection timeout' }
    }
  ];

  res.json({
    logs: mockLogs,
    totalPages: 1,
    currentPage: parseInt(page),
    total: mockLogs.length
  });
});

// Backup routes
app.post('/api/admin/backup/create', requireAdmin, asyncHandler(async (req, res) => {
  // Simulate backup creation
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  const backupId = Date.now().toString();
  
  res.json({
    message: 'Backup created successfully',
    backupId,
    filename: `backup_${backupId}.zip`,
    size: '125MB',
    createdAt: new Date().toISOString()
  });
}));

app.get('/api/admin/backup/list', requireAdmin, (req, res) => {
  const mockBackups = [
    {
      id: '1',
      filename: 'backup_20240101.zip',
      size: '125MB',
      createdAt: new Date(Date.now() - 86400000).toISOString(),
      type: 'auto'
    },
    {
      id: '2',
      filename: 'backup_20231231.zip',
      size: '122MB',
      createdAt: new Date(Date.now() - 172800000).toISOString(),
      type: 'manual'
    }
  ];

  res.json(mockBackups);
});

// Email template routes
app.get('/api/admin/email-templates', requireAdmin, (req, res) => {
  const mockTemplates = [
    {
      id: 'welcome',
      name: 'Welcome Email',
      subject: 'Welcome to InterviewX',
      content: 'Welcome {{firstName}} to InterviewX platform...',
      variables: ['firstName', 'lastName', 'email']
    },
    {
      id: 'interview-reminder',
      name: 'Interview Reminder',
      subject: 'Interview Reminder - {{interviewTitle}}',
      content: 'Hi {{firstName}}, this is a reminder for your upcoming interview...',
      variables: ['firstName', 'interviewTitle', 'interviewDate']
    }
  ];

  res.json(mockTemplates);
});

app.put('/api/admin/email-templates/:templateId', requireAdmin, (req, res) => {
  const { templateId } = req.params;
  const { subject, content } = req.body;
  
  res.json({
    message: 'Email template updated successfully',
    templateId,
    subject,
    content
  });
});

app.post('/api/admin/email-templates/:templateId/test', requireAdmin, (req, res) => {
  const { templateId } = req.params;
  const { email } = req.body;
  
  // Simulate sending test email
  setTimeout(() => {
    res.json({
      message: `Test email sent to ${email}`,
      templateId
    });
  }, 1000);
});

// ============= END OF NEW ADMIN ROUTES =============

// System Health
app.get('/api/admin/system/health', requireAdmin, (req, res) => {
  res.json({
    apiServer: 'online',
    database: 'connected',
    aiServices: 'running',
    storage: 85
  });
});

// Keep existing routes...
app.get('/api/interviews', requireAuth, (req, res) => {
  res.json({
    interviews,
    totalPages: 1,
    currentPage: 1,
    total: interviews.length
  });
});

app.post('/api/interviews', requireAuth, asyncHandler(async (req, res) => {
  const { title, type, duration } = req.body;
  
  const newInterview = {
    _id: Date.now().toString(),
    userId: '1',
    title,
    type,
    duration,
    status: 'pending',
    score: null,
    createdAt: new Date().toISOString(),
    completedAt: null,
    questions: [
      { id: 1, text: 'Tell me about yourself', type: 'behavioral', timeLimit: 300 },
      { id: 2, text: 'Describe a challenging project', type: 'behavioral', timeLimit: 300 },
      { id: 3, text: 'Technical question about ' + type, type: 'technical', timeLimit: 240 }
    ]
  };
  
  interviews.push(newInterview);
  
  res.status(201).json({
    message: 'Interview created successfully',
    interview: newInterview
  });
}));

// Mock file upload endpoints
app.post('/api/profile/upload-image', requireAuth, (req, res) => {
  const imageUrl = `/uploads/profiles/profile-${Date.now()}.jpg`;
  const user = users[0];
  user.profileImage = imageUrl;
  
  res.json({
    message: 'Profile image uploaded successfully',
    profileImageUrl: imageUrl
  });
});

app.post('/api/profile/upload-resume', requireAuth, (req, res) => {
  const resumeUrl = `/uploads/resumes/resume-${Date.now()}.pdf`;
  const user = users[0];
  user.resumeUrl = resumeUrl;
  user.resumeFileName = 'resume.pdf';
  
  res.json({
    message: 'Resume uploaded successfully',
    resumeUrl: resumeUrl,
    resumeFileName: 'resume.pdf'
  });
});

// Socket.IO connection handling
io.on('connection', (socket) => {
  logger.info(`Client connected: ${socket.id}`);
  
  socket.on('join-interview', (interviewId) => {
    socket.join(`interview-${interviewId}`);
    logger.info(`Client ${socket.id} joined interview ${interviewId}`);
  });
  
  socket.on('leave-interview', (interviewId) => {
    socket.leave(`interview-${interviewId}`);
    logger.info(`Client ${socket.id} left interview ${interviewId}`);
  });
  
  socket.on('disconnect', () => {
    logger.info(`Client disconnected: ${socket.id}`);
  });
});

// Make io available to routes
app.set('io', io);

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error('Error:', err);

  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map(e => e.message);
    return res.status(400).json({
      message: 'Validation Error',
      errors
    });
  }

  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return res.status(400).json({
      message: `${field} already exists`
    });
  }

  res.status(err.statusCode || 500).json({
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Database connection (optional)
const connectDB = async () => {
  try {
    await mongoose.connect(config.MONGODB_URI);
    logger.info('Connected to MongoDB');
  } catch (error) {
    logger.warn('MongoDB connection failed, using mock data:', error.message);
  }
};

// Start server
const startServer = async () => {
  await connectDB();
  
  const PORT = config.PORT || 5000;
  server.listen(PORT, () => {
    logger.info(`🚀 Server running on port ${PORT}`);
    logger.info(`📱 Frontend URL: ${config.FRONTEND_URL}`);
    logger.info(`🌍 Environment: ${config.NODE_ENV}`);
    logger.info(`📋 Health check: http://localhost:${PORT}/health`);
    logger.info(`👑 Admin login: admin@interviewx.com / admin123`);
    logger.info(`👤 Demo login: demo@interviewx.com / demo123`);
  });
};

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  server.close(() => {
    mongoose.connection.close();
    process.exit(0);
  });
});

startServer().catch(error => {
  logger.error('Failed to start server:', error);
  process.exit(1);
});