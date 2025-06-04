/ backend/src/routes/interviews.js
import express from 'express';
import { body, validationResult } from 'express-validator';
import Interview from '../models/Interview.js';
import { auth } from '../middleware/auth.js';

const router = express.Router();

// Get all interviews for user
router.get('/', auth, async (req, res) => {
  try {
    const { page = 1, limit = 10, status, type } = req.query;
    const query = { userId: req.user._id };
    
    if (status) query.status = status;
    if (type) query.type = type;

    const interviews = await Interview.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Interview.countDocuments(query);

    res.json({
      interviews,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get interview by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const interview = await Interview.findOne({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!interview) {
      return res.status(404).json({ message: 'Interview not found' });
    }

    res.json(interview);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create new interview
router.post('/', auth, [
  body('title').trim().isLength({ min: 1 }).withMessage('Title is required'),
  body('type').isIn(['technical', 'behavioral', 'coding', 'system-design']).withMessage('Invalid interview type'),
  body('duration').isInt({ min: 5, max: 120 }).withMessage('Duration must be between 5 and 120 minutes')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { title, type, duration } = req.body;

    // Generate questions based on type
    const questions = generateQuestionsByType(type);

    const interview = new Interview({
      userId: req.user._id,
      title,
      type,
      duration,
      questions
    });

    await interview.save();

    res.status(201).json({
      message: 'Interview created successfully',
      interview
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Start interview
router.post('/:id/start', auth, async (req, res) => {
  try {
    const interview = await Interview.findOne({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!interview) {
      return res.status(404).json({ message: 'Interview not found' });
    }

    if (interview.status !== 'pending') {
      return res.status(400).json({ message: 'Interview already started or completed' });
    }

    interview.status = 'in-progress';
    interview.startedAt = new Date();
    await interview.save();

    // Emit to connected clients
    const io = req.app.get('io');
    io.to(`interview-${interview._id}`).emit('interview-started', {
      interviewId: interview._id,
      startedAt: interview.startedAt
    });

    res.json({
      message: 'Interview started successfully',
      interview
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Complete interview
router.post('/:id/complete', auth, async (req, res) => {
  try {
    const { score, answers } = req.body;
    
    const interview = await Interview.findOne({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!interview) {
      return res.status(404).json({ message: 'Interview not found' });
    }

    interview.status = 'completed';
    interview.completedAt = new Date();
    interview.score = score;
    await interview.save();

    // Emit to connected clients
    const io = req.app.get('io');
    io.to(`interview-${interview._id}`).emit('interview-completed', {
      interviewId: interview._id,
      score: interview.score,
      completedAt: interview.completedAt
    });

    res.json({
      message: 'Interview completed successfully',
      interview
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update interview
router.put('/:id', auth, async (req, res) => {
  try {
    const interview = await Interview.findOne({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!interview) {
      return res.status(404).json({ message: 'Interview not found' });
    }

    const { title, type, duration } = req.body;
    
    if (title) interview.title = title;
    if (type) interview.type = type;
    if (duration) interview.duration = duration;

    await interview.save();

    res.json({
      message: 'Interview updated successfully',
      interview
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete interview
router.delete('/:id', auth, async (req, res) => {
  try {
    const interview = await Interview.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!interview) {
      return res.status(404).json({ message: 'Interview not found' });
    }

    res.json({ message: 'Interview deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Helper function to generate questions
function generateQuestionsByType(type) {
  const questionBank = {
    technical: [
      { id: 1, text: "Explain the difference between let, const, and var in JavaScript.", type: "technical", timeLimit: 180 },
      { id: 2, text: "What is closure and how does it work?", type: "technical", timeLimit: 240 },
      { id: 3, text: "Describe the event loop in JavaScript.", type: "technical", timeLimit: 300 },
      { id: 4, text: "How does React's virtual DOM work?", type: "technical", timeLimit: 240 },
      { id: 5, text: "Explain the difference between SQL and NoSQL databases.", type: "technical", timeLimit: 300 }
    ],
    behavioral: [
      { id: 1, text: "Tell me about yourself and your background.", type: "behavioral", timeLimit: 300 },
      { id: 2, text: "Describe a challenging project you worked on.", type: "behavioral", timeLimit: 300 },
      { id: 3, text: "How do you handle conflicts in a team?", type: "behavioral", timeLimit: 240 },
      { id: 4, text: "What motivates you in your work?", type: "behavioral", timeLimit: 180 },
      { id: 5, text: "Where do you see yourself in 5 years?", type: "behavioral", timeLimit: 180 }
    ],
    coding: [
      { id: 1, text: "Implement a binary search algorithm.", type: "coding", timeLimit: 600 },
      { id: 2, text: "Reverse a linked list.", type: "coding", timeLimit: 480 },
      { id: 3, text: "Find the longest palindromic substring.", type: "coding", timeLimit: 720 },
      { id: 4, text: "Design a LRU cache.", type: "coding", timeLimit: 900 },
      { id: 5, text: "Implement a rate limiter.", type: "coding", timeLimit: 720 }
    ],
    'system-design': [
      { id: 1, text: "Design a URL shortener like bit.ly.", type: "system-design", timeLimit: 1800 },
      { id: 2, text: "How would you design a chat application?", type: "system-design", timeLimit: 1800 },
      { id: 3, text: "Design a distributed cache system.", type: "system-design", timeLimit: 2400 },
      { id: 4, text: "Architecture for a social media feed.", type: "system-design", timeLimit: 2400 },
      { id: 5, text: "Design a notification system.", type: "system-design", timeLimit: 1800 }
    ]
  };
  
  return questionBank[type] || questionBank.technical;
}

export default router;
