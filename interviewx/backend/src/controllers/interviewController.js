const Interview = require('../models/Interview');
const User = require('../models/User');
const Question = require('../models/Question');
const Evaluation = require('../models/Evaluation');
const logger = require('../utils/logger');

// @desc    Get all interviews for a user
// @route   GET /api/interviews
// @access  Private
const getAllInterviews = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const interviews = await Interview.find({ 
      $or: [
        { interviewer: userId },
        { candidate: userId }
      ]
    })
    .populate('interviewer', 'name email')
    .populate('candidate', 'name email')
    .populate('questions')
    .populate('evaluation')
    .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: interviews.length,
      data: interviews
    });
  } catch (error) {
    logger.error('Error fetching interviews:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching interviews',
      error: error.message
    });
  }
};

// @desc    Get single interview by ID
// @route   GET /api/interviews/:id
// @access  Private
const getInterviewById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const interview = await Interview.findById(id)
      .populate('interviewer', 'name email company')
      .populate('candidate', 'name email')
      .populate('questions')
      .populate('evaluation');

    if (!interview) {
      return res.status(404).json({
        success: false,
        message: 'Interview not found'
      });
    }

    // Check if user has access to this interview
    const hasAccess = 
      interview.interviewer._id.toString() === userId ||
      interview.candidate._id.toString() === userId ||
      req.user.role === 'admin';

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'Access denied to this interview'
      });
    }

    res.status(200).json({
      success: true,
      data: interview
    });
  } catch (error) {
    logger.error('Error fetching interview:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching interview',
      error: error.message
    });
  }
};

// @desc    Create new interview
// @route   POST /api/interviews
// @access  Private
const createInterview = async (req, res) => {
  try {
    const {
      title,
      position,
      candidateEmail,
      scheduledAt,
      duration,
      description,
      questionIds,
      settings
    } = req.body;

    const interviewerId = req.user.id;

    // Find candidate by email
    let candidate = await User.findOne({ email: candidateEmail });
    
    // If candidate doesn't exist, create a basic candidate account
    if (!candidate) {
      candidate = await User.create({
        email: candidateEmail,
        name: candidateEmail.split('@')[0], // Use email prefix as name
        role: 'candidate',
        password: 'temp_password_' + Date.now(), // Temporary password
        isTemporary: true
      });
    }

    // Validate questions exist
    if (questionIds && questionIds.length > 0) {
      const existingQuestions = await Question.find({ _id: { $in: questionIds } });
      if (existingQuestions.length !== questionIds.length) {
        return res.status(400).json({
          success: false,
          message: 'One or more questions not found'
        });
      }
    }

    // Create interview
    const interview = await Interview.create({
      title,
      position,
      interviewer: interviewerId,
      candidate: candidate._id,
      scheduledAt: scheduledAt ? new Date(scheduledAt) : undefined,
      duration: duration || 60, // Default 60 minutes
      description,
      questions: questionIds || [],
      status: 'scheduled',
      settings: {
        recordVideo: settings?.recordVideo !== false,
        recordAudio: settings?.recordAudio !== false,
        allowRetakes: settings?.allowRetakes || false,
        timeLimit: settings?.timeLimit || duration || 60,
        ...settings
      }
    });

    // Populate the created interview
    const populatedInterview = await Interview.findById(interview._id)
      .populate('interviewer', 'name email company')
      .populate('candidate', 'name email')
      .populate('questions');

    logger.info(`Interview created: ${interview._id} by user: ${interviewerId}`);

    res.status(201).json({
      success: true,
      data: populatedInterview,
      message: 'Interview created successfully'
    });
  } catch (error) {
    logger.error('Error creating interview:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while creating interview',
      error: error.message
    });
  }
};

// @desc    Update interview
// @route   PUT /api/interviews/:id
// @access  Private
const updateInterview = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const updateData = req.body;

    // Find interview
    const interview = await Interview.findById(id);
    
    if (!interview) {
      return res.status(404).json({
        success: false,
        message: 'Interview not found'
      });
    }

    // Check if user can update this interview
    const canUpdate = 
      interview.interviewer.toString() === userId ||
      req.user.role === 'admin';

    if (!canUpdate) {
      return res.status(403).json({
        success: false,
        message: 'Access denied to update this interview'
      });
    }

    // Prevent updating if interview is completed
    if (interview.status === 'completed' && updateData.status !== 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Cannot modify completed interview'
      });
    }

    // Update interview
    const updatedInterview = await Interview.findByIdAndUpdate(
      id,
      { 
        ...updateData,
        updatedAt: Date.now()
      },
      { new: true, runValidators: true }
    )
    .populate('interviewer', 'name email company')
    .populate('candidate', 'name email')
    .populate('questions')
    .populate('evaluation');

    logger.info(`Interview updated: ${id} by user: ${userId}`);

    res.status(200).json({
      success: true,
      data: updatedInterview,
      message: 'Interview updated successfully'
    });
  } catch (error) {
    logger.error('Error updating interview:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating interview',
      error: error.message
    });
  }
};

// @desc    Delete interview
// @route   DELETE /api/interviews/:id
// @access  Private
const deleteInterview = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Find interview
    const interview = await Interview.findById(id);
    
    if (!interview) {
      return res.status(404).json({
        success: false,
        message: 'Interview not found'
      });
    }

    // Check if user can delete this interview
    const canDelete = 
      interview.interviewer.toString() === userId ||
      req.user.role === 'admin';

    if (!canDelete) {
      return res.status(403).json({
        success: false,
        message: 'Access denied to delete this interview'
      });
    }

    // Delete associated evaluation if exists
    if (interview.evaluation) {
      await Evaluation.findByIdAndDelete(interview.evaluation);
    }

    // Delete interview
    await Interview.findByIdAndDelete(id);

    logger.info(`Interview deleted: ${id} by user: ${userId}`);

    res.status(200).json({
      success: true,
      message: 'Interview deleted successfully'
    });
  } catch (error) {
    logger.error('Error deleting interview:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting interview',
      error: error.message
    });
  }
};

// @desc    Start interview (change status to in_progress)
// @route   POST /api/interviews/:id/start
// @access  Private
const startInterview = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const interview = await Interview.findById(id);
    
    if (!interview) {
      return res.status(404).json({
        success: false,
        message: 'Interview not found'
      });
    }

    // Check if user can start this interview (candidate or interviewer)
    const canStart = 
      interview.candidate.toString() === userId ||
      interview.interviewer.toString() === userId ||
      req.user.role === 'admin';

    if (!canStart) {
      return res.status(403).json({
        success: false,
        message: 'Access denied to start this interview'
      });
    }

    // Check if interview can be started
    if (interview.status !== 'scheduled') {
      return res.status(400).json({
        success: false,
        message: `Cannot start interview with status: ${interview.status}`
      });
    }

    // Update interview status
    const updatedInterview = await Interview.findByIdAndUpdate(
      id,
      { 
        status: 'in_progress',
        startedAt: new Date(),
        updatedAt: Date.now()
      },
      { new: true }
    )
    .populate('interviewer', 'name email')
    .populate('candidate', 'name email')
    .populate('questions');

    logger.info(`Interview started: ${id} by user: ${userId}`);

    res.status(200).json({
      success: true,
      data: updatedInterview,
      message: 'Interview started successfully'
    });
  } catch (error) {
    logger.error('Error starting interview:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while starting interview',
      error: error.message
    });
  }
};

// @desc    Complete interview
// @route   POST /api/interviews/:id/complete
// @access  Private
const completeInterview = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const interview = await Interview.findById(id);
    
    if (!interview) {
      return res.status(404).json({
        success: false,
        message: 'Interview not found'
      });
    }

    // Check if user can complete this interview
    const canComplete = 
      interview.candidate.toString() === userId ||
      interview.interviewer.toString() === userId ||
      req.user.role === 'admin';

    if (!canComplete) {
      return res.status(403).json({
        success: false,
        message: 'Access denied to complete this interview'
      });
    }

    // Check if interview can be completed
    if (interview.status !== 'in_progress') {
      return res.status(400).json({
        success: false,
        message: `Cannot complete interview with status: ${interview.status}`
      });
    }

    // Update interview status
    const updatedInterview = await Interview.findByIdAndUpdate(
      id,
      { 
        status: 'completed',
        completedAt: new Date(),
        updatedAt: Date.now()
      },
      { new: true }
    )
    .populate('interviewer', 'name email')
    .populate('candidate', 'name email')
    .populate('questions')
    .populate('evaluation');

    logger.info(`Interview completed: ${id} by user: ${userId}`);

    res.status(200).json({
      success: true,
      data: updatedInterview,
      message: 'Interview completed successfully'
    });
  } catch (error) {
    logger.error('Error completing interview:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while completing interview',
      error: error.message
    });
  }
};

// @desc    Get interview statistics for dashboard
// @route   GET /api/interviews/stats
// @access  Private
const getInterviewStats = async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;

    let matchQuery = {};
    
    // Set match query based on user role
    if (userRole === 'interviewer') {
      matchQuery = { interviewer: userId };
    } else if (userRole === 'candidate') {
      matchQuery = { candidate: userId };
    } else if (userRole === 'admin') {
      // Admin can see all interviews
      matchQuery = {};
    }

    const stats = await Interview.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: null,
          totalInterviews: { $sum: 1 },
          completedInterviews: {
            $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] }
          },
          inProgressInterviews: {
            $sum: { $cond: [{ $eq: ["$status", "in_progress"] }, 1, 0] }
          },
          scheduledInterviews: {
            $sum: { $cond: [{ $eq: ["$status", "scheduled"] }, 1, 0] }
          }
        }
      }
    ]);

    const result = stats[0] || {
      totalInterviews: 0,
      completedInterviews: 0,
      inProgressInterviews: 0,
      scheduledInterviews: 0
    };

    // Get recent interviews
    const recentInterviews = await Interview.find(matchQuery)
      .populate('interviewer', 'name email')
      .populate('candidate', 'name email')
      .populate('evaluation', 'overallScore')
      .sort({ createdAt: -1 })
      .limit(5);

    res.status(200).json({
      success: true,
      data: {
        ...result,
        recentInterviews
      }
    });
  } catch (error) {
    logger.error('Error fetching interview stats:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching interview statistics',
      error: error.message
    });
  }
};

module.exports = {
  getAllInterviews,
  getInterviewById,
  createInterview,
  updateInterview,
  deleteInterview,
  startInterview,
  completeInterview,
  getInterviewStats
};