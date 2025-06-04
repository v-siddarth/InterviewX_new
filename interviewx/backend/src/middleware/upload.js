// backend/src/middleware/upload.js
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure upload directories exist
const createUploadDirs = () => {
  const uploadDirs = [
    'uploads',
    'uploads/profiles',
    'uploads/resumes',
    'uploads/interview-videos',
    'uploads/interview-audio'
  ];

  uploadDirs.forEach(dir => {
    const dirPath = path.join(__dirname, '../../', dir);
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
  });
};

// Create upload directories on startup
createUploadDirs();

// Storage configuration for profile images
const profileImageStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '../../uploads/profiles'));
  },
  filename: function (req, file, cb) {
    // Generate unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const extension = path.extname(file.originalname);
    cb(null, `profile-${req.user.id}-${uniqueSuffix}${extension}`);
  }
});

// Storage configuration for resumes
const resumeStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '../../uploads/resumes'));
  },
  filename: function (req, file, cb) {
    // Generate unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const extension = path.extname(file.originalname);
    cb(null, `resume-${req.user.id}-${uniqueSuffix}${extension}`);
  }
});

// Storage configuration for interview videos
const videoStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '../../uploads/interview-videos'));
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const extension = path.extname(file.originalname);
    cb(null, `video-${req.user.id}-${uniqueSuffix}${extension}`);
  }
});

// Storage configuration for interview audio
const audioStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '../../uploads/interview-audio'));
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const extension = path.extname(file.originalname);
    cb(null, `audio-${req.user.id}-${uniqueSuffix}${extension}`);
  }
});

// File filter for images
const imageFileFilter = (req, file, cb) => {
  const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, JPG, PNG, and WebP are allowed.'), false);
  }
};

// File filter for resumes
const resumeFileFilter = (req, file, cb) => {
  const allowedMimes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ];
  
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only PDF, DOC, and DOCX are allowed.'), false);
  }
};

// File filter for videos
const videoFileFilter = (req, file, cb) => {
  const allowedMimes = ['video/mp4', 'video/mpeg', 'video/quicktime', 'video/webm'];
  
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only MP4, MPEG, MOV, and WebM are allowed.'), false);
  }
};

// File filter for audio
const audioFileFilter = (req, file, cb) => {
  const allowedMimes = ['audio/mpeg', 'audio/wav', 'audio/mp4', 'audio/webm'];
  
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only MP3, WAV, MP4, and WebM are allowed.'), false);
  }
};

// Multer configurations
const uploadProfileImage = multer({
  storage: profileImageStorage,
  fileFilter: imageFileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
    files: 1
  }
}).single('profileImage');

const uploadResume = multer({
  storage: resumeStorage,
  fileFilter: resumeFileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
    files: 1
  }
}).single('resume');

const uploadInterviewVideo = multer({
  storage: videoStorage,
  fileFilter: videoFileFilter,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB limit
    files: 1
  }
}).single('video');

const uploadInterviewAudio = multer({
  storage: audioStorage,
  fileFilter: audioFileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
    files: 1
  }
}).single('audio');

// Multiple file upload for interview (video + audio)
const uploadInterviewFiles = multer({
  storage: multer.diskStorage({
    destination: function (req, file, cb) {
      if (file.fieldname === 'video') {
        cb(null, path.join(__dirname, '../../uploads/interview-videos'));
      } else if (file.fieldname === 'audio') {
        cb(null, path.join(__dirname, '../../uploads/interview-audio'));
      } else {
        cb(new Error('Invalid field name'), false);
      }
    },
    filename: function (req, file, cb) {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const extension = path.extname(file.originalname);
      const prefix = file.fieldname === 'video' ? 'video' : 'audio';
      cb(null, `${prefix}-${req.user.id}-${uniqueSuffix}${extension}`);
    }
  }),
  fileFilter: function (req, file, cb) {
    if (file.fieldname === 'video') {
      videoFileFilter(req, file, cb);
    } else if (file.fieldname === 'audio') {
      audioFileFilter(req, file, cb);
    } else {
      cb(new Error('Invalid field name'), false);
    }
  },
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB limit
    files: 2
  }
}).fields([
  { name: 'video', maxCount: 1 },
  { name: 'audio', maxCount: 1 }
]);

// Error handling middleware
const handleUploadError = (error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    switch (error.code) {
      case 'LIMIT_FILE_SIZE':
        return res.status(400).json({ 
          message: 'File too large. Please check the file size limits.' 
        });
      case 'LIMIT_FILE_COUNT':
        return res.status(400).json({ 
          message: 'Too many files. Please upload one file at a time.' 
        });
      case 'LIMIT_UNEXPECTED_FILE':
        return res.status(400).json({ 
          message: 'Unexpected file field. Please check the form data.' 
        });
      default:
        return res.status(400).json({ 
          message: 'File upload error: ' + error.message 
        });
    }
  } else if (error) {
    return res.status(400).json({ 
      message: error.message || 'File upload error' 
    });
  }
  next();
};

// Helper function to delete file
const deleteFile = async (filePath) => {
  try {
    await fs.promises.unlink(filePath);
    console.log(`File deleted: ${filePath}`);
  } catch (error) {
    console.error(`Error deleting file ${filePath}:`, error);
  }
};

// Helper function to get file URL
const getFileUrl = (req, filePath) => {
  const baseUrl = `${req.protocol}://${req.get('host')}`;
  return `${baseUrl}${filePath}`;
};

module.exports = {
  uploadProfileImage,
  uploadResume,
  uploadInterviewVideo,
  uploadInterviewAudio,
  uploadInterviewFiles,
  handleUploadError,
  deleteFile,
  getFileUrl,
  createUploadDirs
};