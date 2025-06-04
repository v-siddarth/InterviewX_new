#!/usr/bin/env python3
"""
InterviewX - Facial Analysis Service
Uses MTCNN for face detection and CNN for confidence analysis
"""

import os
import logging
import traceback
from datetime import datetime
from typing import Dict, List, Any, Optional

import cv2
import numpy as np
from flask import Flask, request, jsonify
from flask_cors import CORS
import torch
import tensorflow as tf
from werkzeug.utils import secure_filename

# Import our custom utilities
from utils.face_detector import FaceDetector
from utils.confidence_analyzer import ConfidenceAnalyzer

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Initialize Flask app
app = Flask(__name__)
CORS(app)

# Configuration
CONFIG = {
    'UPLOAD_FOLDER': 'temp_uploads',
    'MAX_CONTENT_LENGTH': 50 * 1024 * 1024,  # 50MB max file size
    'ALLOWED_EXTENSIONS': {'mp4', 'avi', 'mov', 'mkv', 'webm', 'jpg', 'jpeg', 'png'},
    'CONFIDENCE_THRESHOLD': 0.8,  # 80% threshold for passing
    'MODEL_PATH': 'models',
    'PORT': int(os.getenv('PORT', 5001)),
    'HOST': os.getenv('HOST', '0.0.0.0'),
    'DEBUG': os.getenv('DEBUG', 'False').lower() == 'true'
}

# Set max content length
app.config['MAX_CONTENT_LENGTH'] = CONFIG['MAX_CONTENT_LENGTH']

# Create necessary directories
os.makedirs(CONFIG['UPLOAD_FOLDER'], exist_ok=True)
os.makedirs(CONFIG['MODEL_PATH'], exist_ok=True)

# Initialize AI components
face_detector = None
confidence_analyzer = None

def initialize_models():
    """Initialize face detection and confidence analysis models"""
    global face_detector, confidence_analyzer
    
    try:
        logger.info("Initializing facial analysis models...")
        
        # Initialize face detector (MTCNN)
        face_detector = FaceDetector()
        logger.info("✅ Face detector (MTCNN) initialized")
        
        # Initialize confidence analyzer (CNN)
        confidence_analyzer = ConfidenceAnalyzer()
        logger.info("✅ Confidence analyzer (CNN) initialized")
        
        logger.info("🎯 All facial analysis models ready!")
        return True
        
    except Exception as e:
        logger.error(f"❌ Error initializing models: {str(e)}")
        logger.error(traceback.format_exc())
        return False

def allowed_file(filename: str) -> bool:
    """Check if file extension is allowed"""
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in CONFIG['ALLOWED_EXTENSIONS']

def process_video_frames(video_path: str, max_frames: int = 30) -> List[np.ndarray]:
    """Extract frames from video for analysis"""
    try:
        cap = cv2.VideoCapture(video_path)
        frames = []
        
        total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        step = max(1, total_frames // max_frames)
        
        frame_count = 0
        while cap.isOpened() and len(frames) < max_frames:
            ret, frame = cap.read()
            if not ret:
                break
                
            if frame_count % step == 0:
                # Convert BGR to RGB
                frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
                frames.append(frame_rgb)
            
            frame_count += 1
        
        cap.release()
        logger.info(f"Extracted {len(frames)} frames from video")
        return frames
        
    except Exception as e:
        logger.error(f"Error processing video: {str(e)}")
        return []

def process_image(image_path: str) -> List[np.ndarray]:
    """Process single image"""
    try:
        image = cv2.imread(image_path)
        if image is None:
            raise ValueError("Could not load image")
        
        # Convert BGR to RGB
        image_rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
        return [image_rgb]
        
    except Exception as e:
        logger.error(f"Error processing image: {str(e)}")
        return []

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'service': 'facial-analysis',
        'version': '1.0.0',
        'timestamp': datetime.utcnow().isoformat(),
        'models_loaded': face_detector is not None and confidence_analyzer is not None
    })

@app.route('/analyze', methods=['POST'])
def analyze_facial_confidence():
    """
    Main endpoint for facial confidence analysis
    Accepts video files or images and returns confidence score
    """
    try:
        # Check if models are loaded
        if not face_detector or not confidence_analyzer:
            return jsonify({
                'success': False,
                'error': 'Models not initialized',
                'message': 'Facial analysis models are not loaded'
            }), 500
        
        # Check if file is present
        if 'file' not in request.files:
            return jsonify({
                'success': False,
                'error': 'no_file',
                'message': 'No file provided'
            }), 400
        
        file = request.files['file']
        
        if file.filename == '':
            return jsonify({
                'success': False,
                'error': 'empty_filename',
                'message': 'No file selected'
            }), 400
        
        if not allowed_file(file.filename):
            return jsonify({
                'success': False,
                'error': 'invalid_file_type',
                'message': f'Allowed file types: {", ".join(CONFIG["ALLOWED_EXTENSIONS"])}'
            }), 400
        
        # Save uploaded file
        filename = secure_filename(file.filename)
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        filename = f"{timestamp}_{filename}"
        file_path = os.path.join(CONFIG['UPLOAD_FOLDER'], filename)
        file.save(file_path)
        
        logger.info(f"Processing file: {filename}")
        
        # Process file based on type
        file_ext = filename.rsplit('.', 1)[1].lower()
        if file_ext in ['mp4', 'avi', 'mov', 'mkv', 'webm']:
            frames = process_video_frames(file_path)
        else:
            frames = process_image(file_path)
        
        if not frames:
            # Cleanup file
            os.remove(file_path)
            return jsonify({
                'success': False,
                'error': 'processing_failed',
                'message': 'Could not extract frames from file'
            }), 400
        
        # Analyze faces in frames
        analysis_results = []
        total_confidence = 0
        valid_detections = 0
        
        for i, frame in enumerate(frames):
            try:
                # Detect faces
                faces = face_detector.detect_faces(frame)
                
                if not faces:
                    logger.warning(f"No faces detected in frame {i}")
                    continue
                
                # Analyze each face
                for face_data in faces:
                    face_image = face_data['face_image']
                    detection_confidence = face_data['confidence']
                    
                    # Skip low-confidence detections
                    if detection_confidence < 0.7:
                        continue
                    
                    # Analyze confidence
                    confidence_score = confidence_analyzer.analyze_confidence(face_image)
                    
                    analysis_results.append({
                        'frame_index': i,
                        'detection_confidence': float(detection_confidence),
                        'confidence_score': float(confidence_score),
                        'bbox': face_data['bbox'].tolist() if hasattr(face_data['bbox'], 'tolist') else face_data['bbox'],
                        'landmarks': face_data.get('landmarks', [])
                    })
                    
                    total_confidence += confidence_score
                    valid_detections += 1
                    
            except Exception as e:
                logger.error(f"Error analyzing frame {i}: {str(e)}")
                continue
        
        # Cleanup uploaded file
        try:
            os.remove(file_path)
        except:
            pass
        
        if valid_detections == 0:
            return jsonify({
                'success': False,
                'error': 'no_valid_faces',
                'message': 'No valid faces detected in the provided media'
            }), 400
        
        # Calculate overall confidence
        overall_confidence = total_confidence / valid_detections
        passed = overall_confidence >= CONFIG['CONFIDENCE_THRESHOLD']
        
        # Prepare response
        response = {
            'success': True,
            'data': {
                'overall_confidence': round(float(overall_confidence), 4),
                'threshold': CONFIG['CONFIDENCE_THRESHOLD'],
                'passed': passed,
                'total_frames_analyzed': len(frames),
                'valid_detections': valid_detections,
                'average_detection_confidence': round(
                    sum(r['detection_confidence'] for r in analysis_results) / len(analysis_results), 4
                ) if analysis_results else 0,
                'analysis_summary': {
                    'high_confidence_detections': len([r for r in analysis_results if r['confidence_score'] >= 0.8]),
                    'medium_confidence_detections': len([r for r in analysis_results if 0.6 <= r['confidence_score'] < 0.8]),
                    'low_confidence_detections': len([r for r in analysis_results if r['confidence_score'] < 0.6])
                },
                'detailed_results': analysis_results[:10]  # Return max 10 detailed results
            },
            'metadata': {
                'processing_time': datetime.utcnow().isoformat(),
                'model_version': '1.0.0',
                'file_type': file_ext
            }
        }
        
        logger.info(f"Analysis complete: {overall_confidence:.4f} confidence, passed: {passed}")
        return jsonify(response)
        
    except Exception as e:
        logger.error(f"Error in facial analysis: {str(e)}")
        logger.error(traceback.format_exc())
        
        # Cleanup file if exists
        try:
            if 'file_path' in locals():
                os.remove(file_path)
        except:
            pass
        
        return jsonify({
            'success': False,
            'error': 'internal_error',
            'message': 'An internal error occurred during analysis'
        }), 500

@app.route('/batch_analyze', methods=['POST'])
def batch_analyze():
    """Analyze multiple files in batch"""
    try:
        if 'files' not in request.files:
            return jsonify({
                'success': False,
                'error': 'no_files',
                'message': 'No files provided'
            }), 400
        
        files = request.files.getlist('files')
        if not files:
            return jsonify({
                'success': False,
                'error': 'empty_files',
                'message': 'No files selected'
            }), 400
        
        results = []
        
        for file in files[:5]:  # Limit to 5 files
            if file and file.filename and allowed_file(file.filename):
                # Process each file using the main analyze logic
                # This is a simplified version - in production, you'd want to optimize this
                try:
                    # Save file temporarily
                    filename = secure_filename(file.filename)
                    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
                    filename = f"{timestamp}_{filename}"
                    file_path = os.path.join(CONFIG['UPLOAD_FOLDER'], filename)
                    file.save(file_path)
                    
                    # Process file (simplified)
                    file_ext = filename.rsplit('.', 1)[1].lower()
                    if file_ext in ['mp4', 'avi', 'mov', 'mkv', 'webm']:
                        frames = process_video_frames(file_path, max_frames=10)  # Fewer frames for batch
                    else:
                        frames = process_image(file_path)
                    
                    if frames:
                        # Quick analysis
                        face_count = 0
                        confidence_sum = 0
                        
                        for frame in frames[:3]:  # Analyze first 3 frames only
                            faces = face_detector.detect_faces(frame)
                            for face_data in faces:
                                if face_data['confidence'] >= 0.7:
                                    confidence_score = confidence_analyzer.analyze_confidence(face_data['face_image'])
                                    confidence_sum += confidence_score
                                    face_count += 1
                        
                        avg_confidence = confidence_sum / face_count if face_count > 0 else 0
                        
                        results.append({
                            'filename': file.filename,
                            'confidence': round(float(avg_confidence), 4),
                            'passed': avg_confidence >= CONFIG['CONFIDENCE_THRESHOLD'],
                            'faces_detected': face_count
                        })
                    else:
                        results.append({
                            'filename': file.filename,
                            'error': 'Could not process file'
                        })
                    
                    # Cleanup
                    os.remove(file_path)
                    
                except Exception as e:
                    results.append({
                        'filename': file.filename,
                        'error': str(e)
                    })
        
        return jsonify({
            'success': True,
            'data': {
                'results': results,
                'total_files': len(results),
                'successful_analyses': len([r for r in results if 'confidence' in r])
            }
        })
        
    except Exception as e:
        logger.error(f"Error in batch analysis: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'internal_error',
            'message': str(e)
        }), 500

@app.route('/models/info', methods=['GET'])
def get_model_info():
    """Get information about loaded models"""
    return jsonify({
        'success': True,
        'data': {
            'face_detector': {
                'name': 'MTCNN',
                'loaded': face_detector is not None,
                'version': face_detector.get_version() if face_detector else None
            },
            'confidence_analyzer': {
                'name': 'CNN Confidence Analyzer',
                'loaded': confidence_analyzer is not None,
                'version': confidence_analyzer.get_version() if confidence_analyzer else None
            }
        }
    })

@app.errorhandler(413)
def too_large(e):
    """Handle file too large error"""
    return jsonify({
        'success': False,
        'error': 'file_too_large',
        'message': f'File size exceeds maximum limit of {CONFIG["MAX_CONTENT_LENGTH"] // (1024*1024)}MB'
    }), 413

@app.errorhandler(404)
def not_found(e):
    """Handle 404 errors"""
    return jsonify({
        'success': False,
        'error': 'endpoint_not_found',
        'message': 'Endpoint not found'
    }), 404

@app.errorhandler(500)
def internal_error(e):
    """Handle internal server errors"""
    logger.error(f"Internal server error: {str(e)}")
    return jsonify({
        'success': False,
        'error': 'internal_server_error',
        'message': 'An internal server error occurred'
    }), 500

def cleanup_temp_files():
    """Clean up old temporary files"""
    try:
        import time
        current_time = time.time()
        
        for filename in os.listdir(CONFIG['UPLOAD_FOLDER']):
            file_path = os.path.join(CONFIG['UPLOAD_FOLDER'], filename)
            if os.path.isfile(file_path):
                file_age = current_time - os.path.getmtime(file_path)
                # Remove files older than 1 hour
                if file_age > 3600:
                    os.remove(file_path)
                    logger.info(f"Cleaned up old temp file: {filename}")
    except Exception as e:
        logger.error(f"Error cleaning up temp files: {str(e)}")

if __name__ == '__main__':
    logger.info("🚀 Starting InterviewX Facial Analysis Service...")
    
    # Initialize models
    if not initialize_models():
        logger.error("❌ Failed to initialize models. Exiting...")
        exit(1)
    
    # Clean up old temp files
    cleanup_temp_files()
    
    logger.info(f"🌐 Starting server on {CONFIG['HOST']}:{CONFIG['PORT']}")
    
    # Start Flask app
    app.run(
        host=CONFIG['HOST'],
        port=CONFIG['PORT'],
        debug=CONFIG['DEBUG'],
        threaded=True
    )