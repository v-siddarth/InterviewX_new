// backend/src/routes/interviews.js - FIXED VERSION
import express from 'express';
import { body, validationResult } from 'express-validator';
import Interview from '../models/Interview.js';
import { auth } from '../middleware/auth.js';

const router = express.Router();

// FIXED: Generate questions helper function with enhanced structure
function generateQuestionsByType(type, duration = 30) {
  const questionBanks = {
    technical: [
      {
        id: 1,
        text: "Tell me about yourself and your background in technology.",
        type: "technical",
        timeLimit: 300,
        allowVideo: true,
        allowAudio: true,
        allowText: true,
        difficulty: "easy",
        category: "Introduction"
      },
      {
        id: 2,
        text: "Explain the difference between let, const, and var in JavaScript.",
        type: "technical",
        timeLimit: 240,
        allowVideo: true,
        allowAudio: true,
        allowText: true,
        difficulty: "medium",
        category: "JavaScript"
      },
      {
        id: 3,
        text: "What is closure and how does it work in JavaScript?",
        type: "technical",
        timeLimit: 300,
        allowVideo: true,
        allowAudio: true,
        allowText: true,
        difficulty: "medium",
        category: "JavaScript"
      },
      {
        id: 4,
        text: "How does React's virtual DOM work?",
        type: "technical",
        timeLimit: 300,
        allowVideo: true,
        allowAudio: true,
        allowText: true,
        difficulty: "medium",
        category: "React"
      },
      {
        id: 5,
        text: "Explain the concept of promises and async/await in JavaScript.",
        type: "technical",
        timeLimit: 300,
        allowVideo: true,
        allowAudio: true,
        allowText: true,
        difficulty: "medium",
        category: "JavaScript"
      }
    ],
    behavioral: [
      {
        id: 1,
        text: "Tell me about yourself and your professional background.",
        type: "behavioral",
        timeLimit: 300,
        allowVideo: true,
        allowAudio: true,
        allowText: true,
        difficulty: "easy",
        category: "Introduction"
      },
      {
        id: 2,
        text: "Describe a challenging project you worked on and how you overcame obstacles.",
        type: "behavioral",
        timeLimit: 360,
        allowVideo: true,
        allowAudio: true,
        allowText: true,
        difficulty: "medium",
        category: "Problem Solving"
      },
      {
        id: 3,
        text: "How do you handle conflicts with team members?",
        type: "behavioral",
        timeLimit: 300,
        allowVideo: true,
        allowAudio: true,
        allowText: true,
        difficulty: "medium",
        category: "Teamwork"
      },
      {
        id: 4,
        text: "Where do you see yourself in the next 5 years?",
        type: "behavioral",
        timeLimit: 240,
        allowVideo: true,
        allowAudio: true,
        allowText: true,
        difficulty: "easy",
        category: "Career Goals"
      }
    ],
    coding: [
      {
        id: 1,
        text: "Implement a function to reverse a string without using built-in methods.",
        type: "coding",
        timeLimit: 600,
        allowVideo: true,
        allowAudio: true,
        allowText: true,
        difficulty: "easy",
        category: "String Manipulation"
      },
      {
        id: 2,
        text: "Write a function to find the maximum element in an array.",
        type: "coding",
        timeLimit: 480,
        allowVideo: true,
        allowAudio: true,
        allowText: true,
        difficulty: "easy",
        category: "Array Operations"
      },
      {
        id: 3,
        text: "Implement a binary search algorithm.",
        type: "coding",
        timeLimit: 900,
        allowVideo: true,
        allowAudio: true,
        allowText: true,
        difficulty: "medium",
        category: "Search Algorithms"
      }
    ],
    'system-design': [
      {
        id: 1,
        text: "Design a URL shortener service like bit.ly.",
        type: "system-design",
        timeLimit: 1200,
        allowVideo: true,
        allowAudio: true,
        allowText: true,
        difficulty: "medium",
        category: "Web Services"
      },
      {
        id: 2,
        text: "How would you design a chat application like WhatsApp?",
        type: "system-design",
        timeLimit: 1200,
        allowVideo: true,
        allowAudio: true,
        allowText: true,
        difficulty: "hard",
        category: "Real-time Systems"
      }
    ]
  };
  
  const selectedQuestions = questionBanks[type] || questionBanks.technical;
  
  // Calculate number of questions based on duration
  const averageTimePerQuestion = type === 'coding' || type === 'system-design' ? 15 : 5;
  const maxQuestions = Math.max(1, Math.floor(duration / averageTimePerQuestion));
  
  return selectedQuestions.slice(0, Math.min(maxQuestions, selectedQuestions.length));
}

// FIXED: Get all interviews for user with better error handling
router.get('/', auth, async (req, res) => {
  try {
    const { page = 1, limit = 10, status, type } = req.query;
    
    // FIXED: Handle case where req.user might not exist
    if (!req.user || !req.user._id) {
      return res.status(401).json({ 
        success: false,
        message: 'User not authenticated' 
      });
    }
    
    const query = { userId: req.user._id };
    
    if (status && status !== 'all') query.status = status;
    if (type && type !== 'all') query.type = type;

    console.log('🔍 Fetching interviews with query:', query);

    const interviews = await Interview.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Interview.countDocuments(query);

    console.log(`✅ Found ${interviews.length} interviews for user ${req.user._id}`);

    res.json({
      success: true,
      interviews,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      total
    });
  } catch (error) {
    console.error('❌ Error fetching interviews:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error while fetching interviews', 
      error: error.message 
    });
  }
});

// FIXED: Get interview by ID with enhanced error handling
router.get('/:id', auth, async (req, res) => {
  try {
    if (!req.user || !req.user._id) {
      return res.status(401).json({ 
        success: false,
        message: 'User not authenticated' 
      });
    }

    console.log(`🔍 Fetching interview ${req.params.id} for user ${req.user._id}`);

    const interview = await Interview.findOne({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!interview) {
      console.log(`❌ Interview ${req.params.id} not found for user ${req.user._id}`);
      return res.status(404).json({ 
        success: false,
        message: 'Interview not found' 
      });
    }

    console.log('✅ Interview found:', interview._id);

    res.json({
      success: true,
      interview
    });
  } catch (error) {
    console.error('❌ Error fetching interview:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error while fetching interview', 
      error: error.message 
    });
  }
});

// FIXED: Create new interview with proper validation and question generation
router.post('/', auth, [
  body('title').trim().isLength({ min: 1 }).withMessage('Title is required'),
  body('type').isIn(['technical', 'behavioral', 'coding', 'system-design']).withMessage('Invalid interview type'),
  body('duration').isInt({ min: 5, max: 120 }).withMessage('Duration must be between 5 and 120 minutes')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      success: false,
      message: 'Validation errors',
      errors: errors.array() 
    });
  }

  try {
    if (!req.user || !req.user._id) {
      return res.status(401).json({ 
        success: false,
        message: 'User not authenticated' 
      });
    }

    const { title, type, duration, difficulty = 'medium', settings } = req.body;

    console.log('🔄 Creating interview:', { title, type, duration, difficulty });

    // Generate questions based on type and duration
    const questions = generateQuestionsByType(type, duration);

    console.log(`✅ Generated ${questions.length} questions for ${type} interview`);

    const interview = new Interview({
      userId: req.user._id,
      title,
      type,
      duration,
      difficulty,
      questions,
      settings: {
        cameraEnabled: settings?.cameraEnabled !== false,
        audioEnabled: settings?.audioEnabled !== false,
        recordingEnabled: settings?.recordingEnabled !== false,
        ...settings
      }
    });

    await interview.save();

    console.log('✅ Interview created:', interview._id);

    res.status(201).json({
      success: true,
      message: 'Interview created successfully',
      interview
    });
  } catch (error) {
    console.error('❌ Error creating interview:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error while creating interview', 
      error: error.message 
    });
  }
});

// FIXED: Start interview with proper status validation
router.post('/:id/start', auth, async (req, res) => {
  try {
    if (!req.user || !req.user._id) {
      return res.status(401).json({ 
        success: false,
        message: 'User not authenticated' 
      });
    }

    const interview = await Interview.findOne({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!interview) {
      return res.status(404).json({ 
        success: false,
        message: 'Interview not found' 
      });
    }

    // FIXED: Allow starting from pending or any status
    if (interview.status === 'completed') {
      return res.status(400).json({ 
        success: false,
        message: 'Interview is already completed' 
      });
    }

    interview.status = 'in-progress';
    interview.startedAt = new Date();
    await interview.save();

    console.log('✅ Interview started:', interview._id);

    // Emit to connected clients
    const io = req.app.get('io');
    if (io) {
      io.to(`interview-${interview._id}`).emit('interview-started', {
        interviewId: interview._id,
        startedAt: interview.startedAt
      });
    }

    res.json({
      success: true,
      message: 'Interview started successfully',
      interview
    });
  } catch (error) {
    console.error('❌ Error starting interview:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error while starting interview', 
      error: error.message 
    });
  }
});

// FIXED: Complete interview with results
router.post('/:id/complete', auth, async (req, res) => {
  try {
    if (!req.user || !req.user._id) {
      return res.status(401).json({ 
        success: false,
        message: 'User not authenticated' 
      });
    }

    const { score, answers, results } = req.body;
    
    const interview = await Interview.findOne({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!interview) {
      return res.status(404).json({ 
        success: false,
        message: 'Interview not found' 
      });
    }

    interview.status = 'completed';
    interview.completedAt = new Date();
    interview.score = score || results?.overallScore || 0;
    
    // Store additional results data
    if (results) {
      interview.results = results;
    }

    await interview.save();

    console.log('✅ Interview completed:', interview._id, 'Score:', interview.score);

    // Emit to connected clients
    const io = req.app.get('io');
    if (io) {
      io.to(`interview-${interview._id}`).emit('interview-completed', {
        interviewId: interview._id,
        score: interview.score,
        completedAt: interview.completedAt
      });
    }

    res.json({
      success: true,
      message: 'Interview completed successfully',
      interview
    });
  } catch (error) {
    console.error('❌ Error completing interview:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error while completing interview', 
      error: error.message 
    });
  }
});

// FIXED: Update interview
router.put('/:id', auth, async (req, res) => {
  try {
    if (!req.user || !req.user._id) {
      return res.status(401).json({ 
        success: false,
        message: 'User not authenticated' 
      });
    }

    const interview = await Interview.findOne({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!interview) {
      return res.status(404).json({ 
        success: false,
        message: 'Interview not found' 
      });
    }

    const { title, type, duration, status, score, results } = req.body;
    
    if (title) interview.title = title;
    if (type) interview.type = type;
    if (duration) interview.duration = duration;
    if (status) interview.status = status;
    if (score !== undefined) interview.score = score;
    if (results) interview.results = results;

    await interview.save();

    console.log('✅ Interview updated:', interview._id);

    res.json({
      success: true,
      message: 'Interview updated successfully',
      interview
    });
  } catch (error) {
    console.error('❌ Error updating interview:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error while updating interview', 
      error: error.message 
    });
  }
});

// FIXED: Delete interview
router.delete('/:id', auth, async (req, res) => {
  try {
    if (!req.user || !req.user._id) {
      return res.status(401).json({ 
        success: false,
        message: 'User not authenticated' 
      });
    }

    const interview = await Interview.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!interview) {
      return res.status(404).json({ 
        success: false,
        message: 'Interview not found' 
      });
    }

    console.log('✅ Interview deleted:', req.params.id);

    res.json({ 
      success: true,
      message: 'Interview deleted successfully' 
    });
  } catch (error) {
    console.error('❌ Error deleting interview:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error while deleting interview', 
      error: error.message 
    });
  }
});

// FIXED: Get interview statistics
router.get('/stats', auth, async (req, res) => {
  try {
    if (!req.user || !req.user._id) {
      return res.status(401).json({ 
        success: false,
        message: 'User not authenticated' 
      });
    }

    const userId = req.user._id;

    const totalInterviews = await Interview.countDocuments({ userId });
    const completedInterviews = await Interview.countDocuments({ userId, status: 'completed' });
    const inProgressInterviews = await Interview.countDocuments({ userId, status: 'in-progress' });
    const pendingInterviews = await Interview.countDocuments({ userId, status: 'pending' });

    // Calculate average score
    const completedWithScores = await Interview.find({ 
      userId, 
      status: 'completed', 
      score: { $exists: true, $ne: null } 
    });
    
    const averageScore = completedWithScores.length > 0
      ? Math.round(completedWithScores.reduce((sum, interview) => sum + interview.score, 0) / completedWithScores.length)
      : 0;

    // Get recent interviews
    const recentInterviews = await Interview.find({ userId })
      .sort({ createdAt: -1 })
      .limit(5);

    res.json({
      success: true,
      data: {
        totalInterviews,
        completedInterviews,
        inProgressInterviews,
        pendingInterviews,
        averageScore,
        recentInterviews
      }
    });
  } catch (error) {
    console.error('❌ Error fetching interview stats:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error while fetching interview statistics', 
      error: error.message 
    });
  }
});

export default router;