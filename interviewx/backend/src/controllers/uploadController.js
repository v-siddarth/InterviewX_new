const path = require('path');
const fs = require('fs');
const Interview = require('../models/Interview');
const logger = require('../utils/logger');
const { cleanupFile, generateSecureUrl } = require('../middleware/upload');

// @desc    Upload single file
// @route   POST /api/uploads/single
// @access  Private
const uploadSingleFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    const fileData = {
      originalName: req.file.originalname,
      filename: req.file.filename,
      mimetype: req.file.mimetype,
      size: req.file.size,
      path: req.file.path,
      url: req.file.url,
      uploadedBy: req.user.id,
      uploadedAt: new Date()
    };

    // Add processed images if available
    if (req.processedImages) {
      fileData.processedImages = req.processedImages;
    }

    logger.info(`File uploaded: ${req.file.originalname} by user: ${req.user.id}`);

    res.status(200).json({
      success: true,
      message: 'File uploaded successfully',
      data: fileData
    });
  } catch (error) {
    logger.error('Error in uploadSingleFile:', error);
    
    // Cleanup uploaded file on error
    if (req.file) {
      cleanupFile(req.file.path);
    }
    
    res.status(500).json({
      success: false,
      message: 'Server error during file upload',
      error: error.message
    });
  }
};

// @desc    Upload multiple files
// @route   POST /api/uploads/multiple
// @access  Private
const uploadMultipleFiles = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No files uploaded'
      });
    }

    const filesData = req.files.map(file => ({
      originalName: file.originalname,
      filename: file.filename,
      mimetype: file.mimetype,
      size: file.size,
      path: file.path,
      url: file.url,
      uploadedBy: req.user.id,
      uploadedAt: new Date()
    }));

    logger.info(`${req.files.length} files uploaded by user: ${req.user.id}`);

    res.status(200).json({
      success: true,
      message: `${req.files.length} files uploaded successfully`,
      data: filesData
    });
  } catch (error) {
    logger.error('Error in uploadMultipleFiles:', error);
    
    // Cleanup uploaded files on error
    if (req.files) {
      req.files.forEach(file => cleanupFile(file.path));
    }
    
    res.status(500).json({
      success: false,
      message: 'Server error during file upload',
      error: error.message
    });
  }
};

// @desc    Upload interview response files
// @route   POST /api/uploads/interview/:interviewId
// @access  Private
const uploadInterviewResponse = async (req, res) => {
  try {
    const { interviewId } = req.params;
    const userId = req.user.id;

    // Validate interview exists and user has access
    const interview = await Interview.findById(interviewId);
    
    if (!interview) {
      return res.status(404).json({
        success: false,
        message: 'Interview not found'
      });
    }

    // Check if user is the candidate or interviewer
    const hasAccess = 
      interview.candidate.toString() === userId ||
      interview.interviewer.toString() === userId ||
      req.user.role === 'admin';

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'Access denied to upload files for this interview'
      });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No files uploaded'
      });
    }

    // Process uploaded files
    const uploadedFiles = req.files.map(file => ({
      originalName: file.originalname,
      filename: file.filename,
      mimetype: file.mimetype,
      size: file.size,
      path: file.path,
      url: file.url,
      type: file.mimetype.startsWith('video/') ? 'video' : 'audio',
      uploadedBy: userId,
      uploadedAt: new Date()
    }));

    // Update interview with uploaded files
    const updateData = {
      $push: {
        'responses.files': { $each: uploadedFiles }
      },
      updatedAt: Date.now()
    };

    await Interview.findByIdAndUpdate(interviewId, updateData);

    logger.info(`Interview files uploaded: ${req.files.length} files for interview ${interviewId} by user: ${userId}`);

    res.status(200).json({
      success: true,
      message: 'Interview response files uploaded successfully',
      data: {
        interviewId,
        uploadedFiles,
        totalFiles: req.files.length
      }
    });
  } catch (error) {
    logger.error('Error in uploadInterviewResponse:', error);
    
    // Cleanup uploaded files on error
    if (req.files) {
      req.files.forEach(file => cleanupFile(file.path));
    }
    
    res.status(500).json({
      success: false,
      message: 'Server error during interview file upload',
      error: error.message
    });
  }
};

// @desc    Get file by filename
// @route   GET /api/uploads/file/:filename
// @access  Private
const getFile = async (req, res) => {
  try {
    const { filename } = req.params;
    const { type = 'temp' } = req.query;
    
    const filePath = path.join(__dirname, '../../uploads', type, filename);
    
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        message: 'File not found'
      });
    }

    // Get file stats
    const stats = fs.statSync(filePath);
    
    // Set appropriate headers
    const mimetype = getMimeType(path.extname(filename));
    res.setHeader('Content-Type', mimetype);
    res.setHeader('Content-Length', stats.size);
    res.setHeader('Cache-Control', 'public, max-age=3600'); // 1 hour cache
    
    // Stream the file
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);
    
    fileStream.on('error', (error) => {
      logger.error('Error streaming file:', error);
      if (!res.headersSent) {
        res.status(500).json({
          success: false,
          message: 'Error serving file'
        });
      }
    });
  } catch (error) {
    logger.error('Error in getFile:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while retrieving file',
      error: error.message
    });
  }
};

// @desc    Download file with secure URL
// @route   GET /api/uploads/secure/:path
// @access  Private
const downloadSecureFile = async (req, res) => {
  try {
    const { path: encodedPath } = req.params;
    const { token, expiry } = req.query;
    
    const filePath = decodeURIComponent(encodedPath);
    
    // Validate token and expiry
    if (!token || !expiry) {
      return res.status(400).json({
        success: false,
        message: 'Missing security token or expiry'
      });
    }
    
    // Check if token has expired
    if (Date.now() > parseInt(expiry)) {
      return res.status(401).json({
        success: false,
        message: 'Download link has expired'
      });
    }
    
    // Verify token
    const expectedToken = require('crypto')
      .createHash('sha256')
      .update(`${filePath}${expiry}${process.env.JWT_SECRET}`)
      .digest('hex');
    
    if (token !== expectedToken) {
      return res.status(401).json({
        success: false,
        message: 'Invalid security token'
      });
    }
    
    const fullPath = path.join(__dirname, '../../uploads', filePath);
    
    // Check if file exists
    if (!fs.existsSync(fullPath)) {
      return res.status(404).json({
        success: false,
        message: 'File not found'
      });
    }
    
    // Set download headers
    const filename = path.basename(fullPath);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Type', 'application/octet-stream');
    
    // Stream the file
    const fileStream = fs.createReadStream(fullPath);
    fileStream.pipe(res);
    
  } catch (error) {
    logger.error('Error in downloadSecureFile:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during secure download',
      error: error.message
    });
  }
};

// @desc    Delete file
// @route   DELETE /api/uploads/file/:filename
// @access  Private
const deleteFile = async (req, res) => {
  try {
    const { filename } = req.params;
    const { type = 'temp' } = req.query;
    const userId = req.user.id;
    
    const filePath = path.join(__dirname, '../../uploads', type, filename);
    
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        message: 'File not found'
      });
    }
    
    // Additional authorization check could be added here
    // For now, allow users to delete files they uploaded
    
    const deleted = cleanupFile(filePath);
    
    if (deleted) {
      logger.info(`File deleted: ${filename} by user: ${userId}`);
      res.status(200).json({
        success: true,
        message: 'File deleted successfully'
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Failed to delete file'
      });
    }
  } catch (error) {
    logger.error('Error in deleteFile:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during file deletion',
      error: error.message
    });
  }
};

// @desc    Get file information
// @route   GET /api/uploads/info/:filename
// @access  Private
const getFileInfo = async (req, res) => {
  try {
    const { filename } = req.params;
    const { type = 'temp' } = req.query;
    
    const filePath = path.join(__dirname, '../../uploads', type, filename);
    
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        message: 'File not found'
      });
    }
    
    const stats = fs.statSync(filePath);
    const mimetype = getMimeType(path.extname(filename));
    
    const fileInfo = {
      filename,
      originalName: filename,
      mimetype,
      size: stats.size,
      createdAt: stats.birthtime,
      modifiedAt: stats.mtime,
      type: getFileType(mimetype),
      url: `/api/uploads/file/${filename}?type=${type}`
    };
    
    // Generate secure download URL
    const secureUrl = generateSecureUrl(`${type}/${filename}`);
    fileInfo.secureDownload = secureUrl;
    
    res.status(200).json({
      success: true,
      data: fileInfo
    });
  } catch (error) {
    logger.error('Error in getFileInfo:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while retrieving file information',
      error: error.message
    });
  }
};

// Helper function to get MIME type
const getMimeType = (extension) => {
  const mimeTypes = {
    '.mp4': 'video/mp4',
    '.webm': 'video/webm',
    '.ogg': 'video/ogg',
    '.mp3': 'audio/mp3',
    '.wav': 'audio/wav',
    '.pdf': 'application/pdf',
    '.txt': 'text/plain',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.webp': 'image/webp'
  };
  
  return mimeTypes[extension.toLowerCase()] || 'application/octet-stream';
};

// Helper function to get file type category
const getFileType = (mimetype) => {
  if (mimetype.startsWith('video/')) return 'video';
  if (mimetype.startsWith('audio/')) return 'audio';
  if (mimetype.startsWith('image/')) return 'image';
  if (mimetype === 'application/pdf' || mimetype === 'text/plain') return 'document';
  return 'other';
};

module.exports = {
  uploadSingleFile,
  uploadMultipleFiles,
  uploadInterviewResponse,
  getFile,
  downloadSecureFile,
  deleteFile,
  getFileInfo
};