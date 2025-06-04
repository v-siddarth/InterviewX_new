// backend/src/routes/profile.js
const express = require('express');
const router = express.Router();
const profileController = require('../controllers/profileController');
const auth = require('../middleware/auth');
const { 
  uploadProfileImage, 
  uploadResume, 
  handleUploadError 
} = require('../middleware/upload');

// @route   GET /api/profile
// @desc    Get current user's profile
// @access  Private
router.get('/', auth, profileController.getProfile);

// @route   PUT /api/profile
// @desc    Update user profile
// @access  Private
router.put('/', auth, profileController.updateProfile);

// @route   POST /api/profile/upload-image
// @desc    Upload profile image
// @access  Private
router.post('/upload-image', auth, (req, res, next) => {
  uploadProfileImage(req, res, (error) => {
    if (error) {
      return handleUploadError(error, req, res, next);
    }
    next();
  });
}, profileController.uploadProfileImage);

// @route   POST /api/profile/upload-resume
// @desc    Upload resume
// @access  Private
router.post('/upload-resume', auth, (req, res, next) => {
  uploadResume(req, res, (error) => {
    if (error) {
      return handleUploadError(error, req, res, next);
    }
    next();
  });
}, profileController.uploadResume);

// @route   DELETE /api/profile/image
// @desc    Delete profile image
// @access  Private
router.delete('/image', auth, profileController.deleteProfileImage);

// @route   DELETE /api/profile/resume
// @desc    Delete resume
// @access  Private
router.delete('/resume', auth, profileController.deleteResume);

// @route   GET /api/profile/public/:userId
// @desc    Get public profile of a user
// @access  Public
router.get('/public/:userId', profileController.getPublicProfile);

// @route   GET /api/profile/search
// @desc    Search users by skills or job title
// @access  Private
router.get('/search', auth, profileController.searchUsers);

module.exports = router;