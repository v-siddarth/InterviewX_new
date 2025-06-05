import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import { createServer } from 'http';
import { Server } from 'socket.io';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import fetch from 'node-fetch';

// Import User model (ES modules)
import User from './models/User.js';

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
  GEMINI_API_KEY: process.env.GEMINI_API_KEY || 'YOUR_GEMINI_API_KEY_HERE',
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
    version: '1.0.0',
    environment: config.NODE_ENV,
    database: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected'
  });
});


// Mock data for interviews and questions (since models don't exist yet)
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

// Helper function to create fallback avatar
const createFallbackAvatar = (firstName, lastName) => {
  const initials = `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  const colors = ['3B82F6', 'EF4444', '10B981', 'F59E0B', '8B5CF6', 'EC4899'];
  const color = colors[Math.floor(Math.random() * colors.length)];
  
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
  // In production, you'd verify the JWT token here
  next();
};

// Admin auth middleware
const requireAdmin = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) {
    return res.status(401).json({ message: 'No token provided' });
  }
  next();
};

// NEW: Gemini Question Generation Service
class BackendGeminiService {
  constructor() {
    this.apiKey = config.GEMINI_API_KEY;
    this.baseUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';
  }

  async generateQuestions(interviewType, difficulty = 'medium', duration = 30, count = null) {
    try {
      logger.info(`🤖 Generating ${interviewType} questions with Gemini AI...`);
      
      const questionCount = count || Math.max(3, Math.floor(duration / (interviewType === 'coding' ? 15 : 5)));
      
      const prompt = this.createQuestionPrompt(interviewType, difficulty, duration, questionCount);
      
      const response = await fetch(`${this.baseUrl}?key=${this.apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }],
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.8,
            maxOutputTokens: 2000,
          }
        })
      });

      if (!response.ok) {
        throw new Error(`Gemini API error: ${response.status}`);
      }

      const data = await response.json();
      const questionsText = data.candidates[0].content.parts[0].text;
      
      return this.parseQuestions(questionsText, interviewType);
      
    } catch (error) {
      logger.error('❌ Error generating questions:', error);
      return this.getFallbackQuestions(interviewType, difficulty, duration);
    }
  }

  createQuestionPrompt(interviewType, difficulty, duration, questionCount) {
    let typeGuidelines = '';
    
    switch (interviewType) {
      case 'technical':
        typeGuidelines = `
- Programming concepts, algorithms, system design
- Specific technologies (JavaScript, React, Node.js, Python)
- Debugging, optimization, best practices
- Scenario-based technical problems`;
        break;
        
      case 'behavioral':
        typeGuidelines = `
- Past experiences, teamwork, leadership
- STAR method questions (Situation, Task, Action, Result)
- Conflict resolution, decision-making
- Career goals and motivation`;
        break;
        
      case 'coding':
        typeGuidelines = `
- Algorithmic problems and data structures
- Array manipulation, string processing, tree/graph problems
- Time/space complexity analysis
- Practical coding scenarios`;
        break;
        
      case 'system-design':
        typeGuidelines = `
- Scalable system architecture
- Database design, API design, microservices
- Load balancing, caching, security
- Real-world system examples`;
        break;
    }

    return `Generate ${questionCount} high-quality ${interviewType} interview questions.

REQUIREMENTS:
- Type: ${interviewType}
- Difficulty: ${difficulty}
- Duration: ${duration} minutes
- Count: ${questionCount}

GUIDELINES:
${typeGuidelines}

DIFFICULTY LEVELS:
- Easy: Basic concepts, entry-level
- Medium: Intermediate concepts, moderate complexity
- Hard: Advanced concepts, complex scenarios

Return ONLY valid JSON in this format:
{
  "questions": [
    {
      "id": 1,
      "text": "Question text here",
      "type": "${interviewType}",
      "timeLimit": 300,
      "difficulty": "${difficulty}",
      "category": "Category name",
      "allowVideo": true,
      "allowAudio": true,
      "allowText": true,
      "hints": ["Optional hint"],
      "expectedPoints": ["Expected answer point 1", "Expected answer point 2"]
    }
  ]
}`;
  }

  parseQuestions(questionsText, interviewType) {
    try {
      const cleanedText = questionsText
        .replace(/```json/g, '')
        .replace(/```/g, '')
        .trim();
      
      const parsed = JSON.parse(cleanedText);
      
      if (!parsed.questions || !Array.isArray(parsed.questions)) {
        throw new Error('Invalid format');
      }
      
      return parsed.questions.map((q, index) => ({
        id: q.id || (index + 1),
        text: q.text || 'Sample question',
        type: q.type || interviewType,
        timeLimit: Math.max(120, Math.min(1800, q.timeLimit || 300)),
        difficulty: q.difficulty || 'medium',
        category: q.category || 'General',
        allowVideo: q.allowVideo !== false,
        allowAudio: q.allowAudio !== false,
        allowText: q.allowText !== false,
        hints: q.hints || [],
        expectedPoints: q.expectedPoints || []
      }));
      
    } catch (error) {
      logger.error('❌ Error parsing questions:', error);
      return this.getFallbackQuestions(interviewType, 'medium', 30);
    }
  }

  getFallbackQuestions(interviewType, difficulty, duration) {
    const fallbackBanks = {
      technical: [
        {
          id: 1,
          text: "Tell me about yourself and your background in technology.",
          type: "technical",
          timeLimit: 300,
          difficulty: "easy",
          category: "Introduction",
          allowVideo: true,
          allowAudio: true,
          allowText: true,
          hints: [],
          expectedPoints: ["Background", "Experience", "Skills"]
        },
        {
          id: 2,
          text: "Explain the difference between let, const, and var in JavaScript.",
          type: "technical",
          timeLimit: 240,
          difficulty: "medium",
          category: "JavaScript",
          allowVideo: true,
          allowAudio: true,
          allowText: true,
          hints: ["Think about scope", "Consider hoisting"],
          expectedPoints: ["Scope differences", "Hoisting behavior", "Reassignment rules"]
        },
        {
          id: 3,
          text: "What is closure and how does it work in JavaScript?",
          type: "technical",
          timeLimit: 300,
          difficulty: "medium",
          category: "JavaScript",
          allowVideo: true,
          allowAudio: true,
          allowText: true,
          hints: ["Inner function accessing outer variables"],
          expectedPoints: ["Definition", "Lexical scoping", "Practical example"]
        }
      ],
      behavioral: [
        {
          id: 1,
          text: "Tell me about yourself and your professional background.",
          type: "behavioral",
          timeLimit: 300,
          difficulty: "easy",
          category: "Introduction",
          allowVideo: true,
          allowAudio: true,
          allowText: true,
          hints: [],
          expectedPoints: ["Background", "Experience", "Goals"]
        },
        {
          id: 2,
          text: "Describe a challenging project you worked on and how you overcame obstacles.",
          type: "behavioral",
          timeLimit: 360,
          difficulty: "medium",
          category: "Problem Solving",
          allowVideo: true,
          allowAudio: true,
          allowText: true,
          hints: ["Use STAR method"],
          expectedPoints: ["Situation", "Task", "Action", "Result"]
        }
      ],
      coding: [
        {
          id: 1,
          text: "Implement a function to reverse a string without using built-in methods.",
          type: "coding",
          timeLimit: 600,
          difficulty: "easy",
          category: "String Manipulation",
          allowVideo: true,
          allowAudio: true,
          allowText: true,
          hints: ["Use two pointers", "Consider character swapping"],
          expectedPoints: ["Algorithm approach", "Time complexity", "Working code"]
        }
      ],
      'system-design': [
        {
          id: 1,
          text: "Design a URL shortener service like bit.ly.",
          type: "system-design",
          timeLimit: 1200,
          difficulty: "medium",
          category: "Web Services",
          allowVideo: true,
          allowAudio: true,
          allowText: true,
          hints: ["Think about URL encoding", "Consider database design"],
          expectedPoints: ["System architecture", "Database design", "Scalability"]
        }
      ]
    };
    
    const selectedQuestions = fallbackBanks[interviewType] || fallbackBanks.technical;
    const questionCount = Math.min(selectedQuestions.length, Math.max(1, Math.floor(duration / 5)));
    
    return selectedQuestions.slice(0, questionCount);
  }
}

// Initialize Gemini service
const geminiService = new BackendGeminiService();

// Auth Routes - REAL DATABASE VERSION
app.post('/api/auth/login', asyncHandler(async (req, res) => {
  try {
    logger.info('🔐 Login attempt received:', { email: req.body.email });
    
    const { email, password } = req.body;
    
    // Validate input
    if (!email || !password) {
      logger.warn('❌ Login failed: Missing email or password');
      return res.status(400).json({ 
        message: 'Email and password are required' 
      });
    }

    // Use the static method from User model
    const user = await User.findByCredentials(email, password);
    
    if (!user) {
      logger.warn('❌ Login failed: Invalid credentials for email:', email);
      return res.status(400).json({ 
        message: 'Invalid email or password' 
      });
    }

    logger.info('✅ User found and authenticated:', { email: user.email, role: user.role });

    // Record login
    const ip = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('User-Agent');
    await user.recordLogin(ip, userAgent, true);

    // Generate token (mock for now)
    const token = `mock-jwt-token-${user._id}-${Date.now()}`;
    
    // Prepare user response
    const userResponse = {
      _id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      avatar: user.profileImage || createFallbackAvatar(user.firstName, user.lastName),
      role: user.role,
      stats: {
        totalInterviews: user.totalInterviews || 0,
        completedInterviews: user.completedInterviews || 0,
        averageScore: user.averageScore || 0
      },
      lastLogin: user.lastLogin,
      createdAt: user.createdAt
    };
    
    logger.info(`✅ User logged in successfully: ${user.email}`);
    
    res.json({
      message: 'Login successful',
      token,
      user: userResponse
    });
    
  } catch (error) {
    logger.error('❌ Login error:', error.message);
    
    // Handle specific errors from User.findByCredentials
    if (error.message.includes('Invalid login credentials')) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }
    if (error.message.includes('Account is temporarily locked')) {
      return res.status(429).json({ message: 'Account is temporarily locked. Please try again later.' });
    }
    if (error.message.includes('Account is deactivated')) {
      return res.status(403).json({ message: 'Account is deactivated. Please contact support.' });
    }
    
    res.status(500).json({ 
      message: 'Internal server error during login' 
    });
  }
}));

app.post('/api/auth/register', asyncHandler(async (req, res) => {
  try {
    logger.info('📝 Registration attempt received:', { 
      firstName: req.body.firstName, 
      lastName: req.body.lastName,
      email: req.body.email 
    });
    
    const { firstName, lastName, email, password } = req.body;
    
    // Validate input
    if (!firstName || !lastName || !email || !password) {
      logger.warn('❌ Registration failed: Missing required fields');
      return res.status(400).json({ 
        message: 'All fields are required' 
      });
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      logger.warn('❌ Registration failed: Invalid email format:', email);
      return res.status(400).json({ 
        message: 'Please enter a valid email address' 
      });
    }
    
    // Validate password length
    if (password.length < 6) {
      logger.warn('❌ Registration failed: Password too short');
      return res.status(400).json({ 
        message: 'Password must be at least 6 characters long' 
      });
    }
    
    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      logger.warn('❌ Registration failed: User already exists:', email);
      return res.status(400).json({ 
        message: 'User already exists with this email address' 
      });
    }
    
    // Create new user (password will be hashed by pre-save middleware)
    const userData = {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.toLowerCase().trim(),
      password,
      role: 'candidate',
      isActive: true,
      status: 'active'
    };
    
    const newUser = new User(userData);
    await newUser.save();
    
    // Generate token (mock)
    const token = `mock-jwt-token-${newUser._id}-${Date.now()}`;
    
    // Record initial login
    const ip = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('User-Agent');
    await newUser.recordLogin(ip, userAgent, true);
    
    // Prepare user response
    const userResponse = {
      _id: newUser._id,
      firstName: newUser.firstName,
      lastName: newUser.lastName,
      email: newUser.email,
      avatar: newUser.profileImage || createFallbackAvatar(newUser.firstName, newUser.lastName),
      role: newUser.role,
      stats: {
        totalInterviews: newUser.totalInterviews || 0,
        completedInterviews: newUser.completedInterviews || 0,
        averageScore: newUser.averageScore || 0
      },
      lastLogin: newUser.lastLogin,
      createdAt: newUser.createdAt
    };
    
    logger.info(`✅ New user registered successfully: ${newUser.email}`);
    logger.info(`📊 User saved to MongoDB with ID: ${newUser._id}`);
    
    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: userResponse
    });
    
  } catch (error) {
    logger.error('❌ Registration error:', error);
    
    // Handle duplicate key error
    if (error.code === 11000) {
      return res.status(400).json({ 
        message: 'User already exists with this email address' 
      });
    }
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(e => e.message);
      return res.status(400).json({ 
        message: messages.join(', ') 
      });
    }
    
    res.status(500).json({ 
      message: 'Internal server error during registration' 
    });
  }
}));

// Profile Routes
app.get('/api/profile', requireAuth, asyncHandler(async (req, res) => {
  try {
    // In production, get user ID from JWT token
    // For now, we'll use the first candidate user
    const user = await User.findOne({ role: 'candidate' }).sort({ createdAt: -1 });
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    const userResponse = {
      _id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      avatar: user.profileImage || createFallbackAvatar(user.firstName, user.lastName),
      role: user.role,
      stats: {
        totalInterviews: user.totalInterviews || 0,
        completedInterviews: user.completedInterviews || 0,
        averageScore: user.averageScore || 0
      },
      phone: user.phone || '',
      location: user.location || '',
      jobTitle: user.jobTitle || '',
      skills: user.skills || [],
      education: user.education || '',
      about: user.about || '',
      profileImage: user.profileImage || null,
      resumeUrl: user.resumeUrl || null,
      resumeFileName: user.resumeFileName || null,
      lastLogin: user.lastLogin,
      createdAt: user.createdAt
    };
    
    res.json({
      user: userResponse
    });
  } catch (error) {
    logger.error('Get profile error:', error);
    res.status(500).json({ 
      message: 'Error fetching profile' 
    });
  }
}));

app.put('/api/profile', requireAuth, asyncHandler(async (req, res) => {
  try {
    const updates = req.body;
    
    // Find user to update (in real app, use req.user.id from JWT)
    const user = await User.findOne({ role: 'candidate' }).sort({ createdAt: -1 });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Update user data
    Object.assign(user, updates);
    await user.save();
    
    const userResponse = {
      _id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      avatar: user.profileImage || createFallbackAvatar(user.firstName, user.lastName),
      role: user.role,
      stats: {
        totalInterviews: user.totalInterviews || 0,
        completedInterviews: user.completedInterviews || 0,
        averageScore: user.averageScore || 0
      },
      phone: user.phone || '',
      location: user.location || '',
      jobTitle: user.jobTitle || '',
      skills: user.skills || [],
      education: user.education || '',
      about: user.about || '',
      profileImage: user.profileImage || null,
      resumeUrl: user.resumeUrl || null,
      lastLogin: user.lastLogin,
      createdAt: user.createdAt
    };
    
    logger.info(`Profile updated for user: ${user.email}`);
    
    res.json({
      message: 'Profile updated successfully',
      user: userResponse
    });
    
  } catch (error) {
    logger.error('Update profile error:', error);
    res.status(500).json({ 
      message: 'Error updating profile' 
    });
  }
}));

// NEW: Gemini AI Question Generation Routes
app.post('/api/questions/generate', requireAuth, asyncHandler(async (req, res) => {
  try {
    logger.info('🎯 Generating questions:', req.body);
    
    const { 
      type = 'technical', 
      difficulty = 'medium', 
      duration = 30,
      count = null 
    } = req.body;
    
    // Validate inputs
    const validTypes = ['technical', 'behavioral', 'coding', 'system-design'];
    const validDifficulties = ['easy', 'medium', 'hard'];
    
    if (!validTypes.includes(type)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid interview type'
      });
    }
    
    if (!validDifficulties.includes(difficulty)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid difficulty level'
      });
    }
    
    if (duration < 5 || duration > 120) {
      return res.status(400).json({
        success: false,
        message: 'Duration must be between 5 and 120 minutes'
      });
    }
    
    // Generate questions
    const questions = await geminiService.generateQuestions(type, difficulty, duration, count);
    
    logger.info(`✅ Generated ${questions.length} questions for ${type} interview`);
    
    res.json({
      success: true,
      message: 'Questions generated successfully',
      questions,
      metadata: {
        type,
        difficulty,
        duration,
        count: questions.length,
        generatedBy: 'gemini-ai',
        generatedAt: new Date().toISOString()
      }
    });
    
  } catch (error) {
    logger.error('❌ Error generating questions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate questions',
      error: error.message
    });
  }
}));

app.get('/api/questions/types', requireAuth, (req, res) => {
  try {
    const questionTypes = [
      {
        value: 'technical',
        label: 'Technical',
        description: 'Programming concepts, algorithms, and technical skills',
        duration: '15-45 minutes',
        difficulty: ['easy', 'medium', 'hard']
      },
      {
        value: 'behavioral',
        label: 'Behavioral',
        description: 'Past experiences, teamwork, and soft skills',
        duration: '15-30 minutes',
        difficulty: ['easy', 'medium', 'hard']
      },
      {
        value: 'coding',
        label: 'Coding',
        description: 'Live coding challenges and algorithm problems',
        duration: '30-60 minutes',
        difficulty: ['easy', 'medium', 'hard']
      },
      {
        value: 'system-design',
        label: 'System Design',
        description: 'Architecture design and scalability discussions',
        duration: '45-60 minutes',
        difficulty: ['medium', 'hard']
      }
    ];
    
    res.json({
      success: true,
      types: questionTypes,
      difficulties: [
        { value: 'easy', label: 'Easy', description: 'Entry-level questions' },
        { value: 'medium', label: 'Medium', description: 'Intermediate-level questions' },
        { value: 'hard', label: 'Hard', description: 'Advanced-level questions' }
      ]
    });
  } catch (error) {
    logger.error('❌ Error fetching question types:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch question types'
    });
  }
});

app.post('/api/questions/preview', requireAuth, asyncHandler(async (req, res) => {
  try {
    const { type, difficulty, duration, count } = req.body;
    
    // Generate sample questions
    const questions = await geminiService.generateQuestions(type, difficulty, duration, count);
    
    res.json({
      success: true,
      preview: questions.map(q => ({
        text: q.text,
        category: q.category,
        difficulty: q.difficulty,
        timeLimit: q.timeLimit,
        type: q.type
      })),
      metadata: {
        totalQuestions: questions.length,
        estimatedDuration: questions.reduce((sum, q) => sum + q.timeLimit, 0),
        type,
        difficulty
      }
    });
    
  } catch (error) {
    logger.error('❌ Error generating preview:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate preview'
    });
  }
}));

// Admin Routes - Using Real Database + Mock Data
app.get('/api/admin/dashboard/stats', requireAdmin, asyncHandler(async (req, res) => {
  try {
    const userStats = await User.getAdminStats();
    
    res.json({
      totalUsers: userStats.totalUsers,
      activeInterviews: interviews.filter(i => i.status === 'in-progress').length,
      completedInterviews: interviews.filter(i => i.status === 'completed').length,
      totalQuestions: questions.length,
      ...userStats
    });
  } catch (error) {
    logger.error('Error fetching admin stats:', error);
    res.status(500).json({ message: 'Error fetching admin statistics' });
  }
}));

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

// User Management - Real Database
app.get('/api/admin/users', requireAdmin, asyncHandler(async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '' } = req.query;
    
    const result = await User.searchUsers(search, {
      page: parseInt(page),
      limit: parseInt(limit),
      sortBy: 'createdAt',
      sortOrder: -1
    });
    
    res.json(result);
  } catch (error) {
    logger.error('Error fetching users:', error);
    res.status(500).json({ message: 'Error fetching users' });
  }
}));

app.get('/api/admin/users/stats', requireAdmin, asyncHandler(async (req, res) => {
  try {
    const stats = await User.getAdminStats();
    res.json(stats);
  } catch (error) {
    logger.error('Error fetching user stats:', error);
    res.status(500).json({ message: 'Error fetching user statistics' });
  }
}));

app.put('/api/admin/users/:userId/role', requireAdmin, asyncHandler(async (req, res) => {
  try {
    const { userId } = req.params;
    const { role } = req.body;
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    user.role = role;
    await user.save();
    
    res.json({ message: 'User role updated successfully', user });
  } catch (error) {
    logger.error('Error updating user role:', error);
    res.status(500).json({ message: 'Error updating user role' });
  }
}));

app.put('/api/admin/users/:userId/status', requireAdmin, asyncHandler(async (req, res) => {
  try {
    const { userId } = req.params;
    const { status } = req.body;
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    user.isActive = status === 'active';
    user.status = status;
    await user.save();
    
    res.json({ message: 'User status updated successfully', user });
  } catch (error) {
    logger.error('Error updating user status:', error);
    res.status(500).json({ message: 'Error updating user status' });
  }
}));

app.delete('/api/admin/users/:userId', requireAdmin, asyncHandler(async (req, res) => {
  try {
    const { userId } = req.params;
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    await User.findByIdAndDelete(userId);
    
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    logger.error('Error deleting user:', error);
    res.status(500).json({ message: 'Error deleting user' });
  }
}));

// Question Management (Mock Data - since Question model doesn't exist yet)
app.get('/api/admin/questions', requireAdmin, (req, res) => {
  const { page = 1, limit = 20, search = '', category = '', difficulty = '' } = req.query;
  
  let filteredQuestions = questions;
  
  if (search) {
    const searchLower = search.toLowerCase();
    filteredQuestions = filteredQuestions.filter(q => 
      q.text.toLowerCase().includes(searchLower)
    );
  }
  
  if (category) {
    filteredQuestions = filteredQuestions.filter(q => q.category === category);
  }
  
  if (difficulty) {
    filteredQuestions = filteredQuestions.filter(q => q.difficulty === difficulty);
  }
  
  res.json({
    questions: filteredQuestions,
    totalPages: Math.ceil(filteredQuestions.length / limit),
    currentPage: parseInt(page),
    total: filteredQuestions.length
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

app.post('/api/admin/questions/generate-set', requireAdmin, (req, res) => {
  const { count = 10, categories = [], difficulty = null } = req.body;
  
  let filteredQuestions = questions;
  
  if (categories.length > 0) {
    filteredQuestions = filteredQuestions.filter(q => categories.includes(q.category));
  }
  
  if (difficulty) {
    filteredQuestions = filteredQuestions.filter(q => q.difficulty === difficulty);
  }
  
  const shuffled = filteredQuestions.sort(() => 0.5 - Math.random());
  const selectedQuestions = shuffled.slice(0, Math.min(count, shuffled.length));
  
  res.json(selectedQuestions);
});

// Results Management Routes (Mock Data)
app.get('/api/admin/results', requireAdmin, (req, res) => {
  const { page = 1, limit = 20, status, dateRange, search } = req.query;
  
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
      improvements: ['More specific examples', 'Confidence in answers']
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
    avgDuration: 28 * 60
  });
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
    security: {
      passwordMinLength: 8,
      requireSpecialChars: true,
      sessionTimeout: 24,
      maxLoginAttempts: 5,
      enableTwoFactor: false,
      maxFileSize: 10
    }
  };

  res.json(mockSettings);
});

app.put('/api/admin/settings', requireAdmin, (req, res) => {
  const updatedSettings = req.body;
  
  logger.info('Settings updated:', updatedSettings);
  
  res.json({
    message: 'Settings updated successfully',
    settings: updatedSettings
  });
});

// Interview Routes (Mock Data)
app.get('/api/interviews', requireAuth, (req, res) => {
  res.json({
    interviews,
    totalPages: 1,
    currentPage: 1,
    total: interviews.length
  });
});

app.post('/api/interviews', requireAuth, asyncHandler(async (req, res) => {
  const { title, type, duration, questions: interviewQuestions } = req.body;
  
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
    questions: interviewQuestions || [
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

// File upload endpoints (Mock)
app.post('/api/profile/upload-image', requireAuth, (req, res) => {
  const imageUrl = `/uploads/profiles/profile-${Date.now()}.jpg`;
  
  res.json({
    message: 'Profile image uploaded successfully',
    profileImageUrl: imageUrl
  });
});

app.post('/api/profile/upload-resume', requireAuth, (req, res) => {
  const resumeUrl = `/uploads/resumes/resume-${Date.now()}.pdf`;
  
  res.json({
    message: 'Resume uploaded successfully',
    resumeUrl: resumeUrl,
    resumeFileName: 'resume.pdf'
  });
});

// Export routes
app.get('/api/admin/users/export', requireAdmin, asyncHandler(async (req, res) => {
  try {
    const { format = 'csv' } = req.query;
    const users = await User.find({}).select('-password -twoFactorSecret');
    
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
  } catch (error) {
    logger.error('Error exporting users:', error);
    res.status(500).json({ message: 'Error exporting users' });
  }
}));

// Socket.IO connection handling
io.on('connection', (socket) => {
  logger.info(`📡 Client connected: ${socket.id}`);
  
  socket.on('join-interview', (interviewId) => {
    socket.join(`interview-${interviewId}`);
    logger.info(`🎯 Client ${socket.id} joined interview ${interviewId}`);
  });
  
  socket.on('leave-interview', (interviewId) => {
    socket.leave(`interview-${interviewId}`);
    logger.info(`🚪 Client ${socket.id} left interview ${interviewId}`);
  });
  
  socket.on('disconnect', () => {
    logger.info(`📴 Client disconnected: ${socket.id}`);
  });
});

// Make io available to routes
app.set('io', io);

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error('❌ Unhandled error:', err);

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

// Database connection
const connectDB = async () => {
  try {
    await mongoose.connect(config.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    logger.info('🗄️ Connected to MongoDB Atlas');
    logger.info(`📍 Database: ${mongoose.connection.db.databaseName}`);
    
    // Create default admin user if none exists
    const adminExists = await User.findOne({ role: 'admin' });
    if (!adminExists) {
      const defaultAdmin = await User.createAdmin({
        firstName: 'Admin',
        lastName: 'User',
        email: 'admin@interviewx.com',
        password: 'admin123'
      });
      logger.info('👑 Default admin user created:', defaultAdmin.email);
    }
    
  } catch (error) {
    logger.error('❌ MongoDB connection failed:', error.message);
    process.exit(1);
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
    logger.info(`👤 Register new users or login with existing accounts`);
    logger.info(`🗄️ Database: MongoDB Atlas (Production)`);
    logger.info(`🤖 Gemini AI: ${config.GEMINI_API_KEY !== 'YOUR_GEMINI_API_KEY_HERE' ? 'Configured' : 'Not Configured'}`);
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