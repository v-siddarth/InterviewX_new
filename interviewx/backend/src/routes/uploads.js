// backend/src/routes/uploads.js
import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { auth } from '../middleware/auth.js';
import { config } from '../utils/config.js';
import { logger } from '../utils/logger.js';

const router = express.Router();

// Ensure upload directory exists
const uploadDir = config.UPLOAD_PATH;
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let subDir = 'misc';
    
    if (file.fieldname === 'video') subDir = 'videos';
    else if (file.fieldname === 'audio') subDir = 'audio';
    else if (file.fieldname === 'document') subDir = 'documents';
    
    const fullPath = path.join(uploadDir, subDir);
    if (!fs.existsSync(fullPath)) {
      fs.mkdirSync(fullPath, { recursive: true });
    }
    
    cb(null, fullPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  // Define allowed file types
  const allowedTypes = {
    video: ['video/mp4', 'video/webm', 'video/ogg'],
    audio: ['audio/mp3', 'audio/wav', 'audio/ogg', 'audio/webm'],
    document: ['application/pdf', 'text/plain', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
  };
  
  const fieldName = file.fieldname;
  if (allowedTypes[fieldName] && allowedTypes[fieldName].includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Invalid file type for ${fieldName}. Allowed types: ${allowedTypes[fieldName]?.join(', ') || 'unknown'}`), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: config.MAX_FILE_SIZE
  }
});

// Upload video file
router.post('/video', auth, upload.single('video'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No video file uploaded' });
    }

    const metadata = req.body.metadata ? JSON.parse(req.body.metadata) : {};
    
    const fileData = {
      filename: req.file.filename,
      originalName: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
      path: req.file.path,
      uploadedBy: req.user._id,
      uploadedAt: new Date(),
      metadata
    };

    logger.info(`Video uploaded: ${req.file.filename}`);

    res.json({
      message: 'Video uploaded successfully',
      file: fileData
    });
  } catch (error) {
    logger.error('Video upload error:', error);
    res.status(500).json({ message: 'Video upload failed', error: error.message });
  }
});

// Upload audio file
router.post('/audio', auth, upload.single('audio'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No audio file uploaded' });
    }

    const metadata = req.body.metadata ? JSON.parse(req.body.metadata) : {};
    
    const fileData = {
      filename: req.file.filename,
      originalName: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
      path: req.file.path,
      uploadedBy: req.user._id,
      uploadedAt: new Date(),
      metadata
    };

    logger.info(`Audio uploaded: ${req.file.filename}`);

    res.json({
      message: 'Audio uploaded successfully',
      file: fileData
    });
  } catch (error) {
    logger.error('Audio upload error:', error);
    res.status(500).json({ message: 'Audio upload failed', error: error.message });
  }
});

// Upload document file
router.post('/document', auth, upload.single('document'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No document file uploaded' });
    }

    const metadata = req.body.metadata ? JSON.parse(req.body.metadata) : {};
    
    const fileData = {
      filename: req.file.filename,
      originalName: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
      path: req.file.path,
      uploadedBy: req.user._id,
      uploadedAt: new Date(),
      metadata
    };

    logger.info(`Document uploaded: ${req.file.filename}`);

    res.json({
      message: 'Document uploaded successfully',
      file: fileData
    });
  } catch (error) {
    logger.error('Document upload error:', error);
    res.status(500).json({ message: 'Document upload failed', error: error.message });
  }
});

// Delete file
router.delete('/:filename', auth, async (req, res) => {
  try {
    const { filename } = req.params;
    
    // Find file in subdirectories
    const subdirs = ['videos', 'audio', 'documents', 'misc'];
    let filePath = null;
    
    for (const subdir of subdirs) {
      const testPath = path.join(uploadDir, subdir, filename);
      if (fs.existsSync(testPath)) {
        filePath = testPath;
        break;
      }
    }
    
    if (!filePath) {
      return res.status(404).json({ message: 'File not found' });
    }
    
    // Delete the file
    fs.unlinkSync(filePath);
    
    logger.info(`File deleted: ${filename}`);
    
    res.json({ message: 'File deleted successfully' });
  } catch (error) {
    logger.error('File deletion error:', error);
    res.status(500).json({ message: 'File deletion failed', error: error.message });
  }
});

export default router;