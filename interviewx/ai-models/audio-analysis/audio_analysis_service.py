#!/usr/bin/env python3
"""
InterviewX - Audio Analysis Service
Handles speech-to-text conversion and audio quality analysis
"""

import os
import logging
import traceback
from datetime import datetime
from typing import Dict, List, Any, Optional

import librosa
import numpy as np
from flask import Flask, request, jsonify
from flask_cors import CORS
from werkzeug.utils import secure_filename

# Import our custom utilities
from utils.audio_processor import AudioProcessor
from utils.speech_to_text import SpeechToTextProcessor

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
    'MAX_CONTENT_LENGTH': 100 * 1024 * 1024,  # 100MB max file size
    'ALLOWED_EXTENSIONS': {'mp3', 'wav', 'ogg', 'webm', 'm4a', 'aac', 'flac'},
    'QUALITY_THRESHOLD': 0.7,  # 70% threshold for audio quality
    'PORT': int(os.getenv('PORT', 5002)),
    'HOST': os.getenv('HOST', '0.0.0.0'),
    'DEBUG': os.getenv('DEBUG', 'False').lower() == 'true',
    'SAMPLE_RATE': 16000,  # Standard sample rate for speech processing
    'MAX_DURATION': 600,   # Maximum audio duration in seconds (10 minutes)
}

# Set max content length
app.config['MAX_CONTENT_LENGTH'] = CONFIG['MAX_CONTENT_LENGTH']

# Create necessary directories
os.makedirs(CONFIG['UPLOAD_FOLDER'], exist_ok=True)

# Initialize audio components
audio_processor = None
speech_to_text = None

def initialize_models():
    """Initialize audio processing and speech-to-text models"""
    global audio_processor, speech_to_text
    
    try:
        logger.info("Initializing audio analysis models...")
        
        # Initialize audio processor
        audio_processor = AudioProcessor()
        logger.info("✅ Audio processor initialized")
        
        # Initialize speech-to-text processor
        speech_to_text = SpeechToTextProcessor()
        logger.info("✅ Speech-to-text processor initialized")
        
        logger.info("🎯 All audio analysis models ready!")
        return True
        
    except Exception as e:
        logger.error(f"❌ Error initializing models: {str(e)}")
        logger.error(traceback.format_exc())
        return False

def allowed_file(filename: str) -> bool:
    """Check if file extension is allowed"""
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in CONFIG['ALLOWED_EXTENSIONS']

def load_audio_file(file_path: str) -> tuple:
    """
    Load audio file and return audio data and sample rate
    
    Args:
        file_path: Path to audio file
        
    Returns:
        Tuple of (audio_data, sample_rate)
    """
    try:
        # Load audio using librosa
        audio_data, sample_rate = librosa.load(
            file_path, 
            sr=CONFIG['SAMPLE_RATE'],  # Resample to standard rate
            mono=True  # Convert to mono
        )
        
        # Check duration
        duration = len(audio_data) / sample_rate
        if duration > CONFIG['MAX_DURATION']:
            logger.warning(f"Audio duration {duration:.2f}s exceeds maximum {CONFIG['MAX_DURATION']}s")
            # Truncate to maximum duration
            max_samples = int(CONFIG['MAX_DURATION'] * sample_rate)
            audio_data = audio_data[:max_samples]
        
        logger.info(f"Loaded audio: {duration:.2f}s, {sample_rate}Hz")
        return audio_data, sample_rate
        
    except Exception as e:
        logger.error(f"Error loading audio file: {str(e)}")
        return None, None

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'service': 'audio-analysis',
        'version': '1.0.0',
        'timestamp': datetime.utcnow().isoformat(),
        'models_loaded': audio_processor is not None and speech_to_text is not None
    })

@app.route('/analyze', methods=['POST'])
def analyze_audio():
    """
    Main endpoint for audio analysis
    Accepts audio files and returns transcription and quality analysis
    """
    try:
        # Check if models are loaded
        if not audio_processor or not speech_to_text:
            return jsonify({
                'success': False,
                'error': 'models_not_initialized',
                'message': 'Audio analysis models are not loaded'
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
        
        logger.info(f"Processing audio file: {filename}")
        
        # Load audio file
        audio_data, sample_rate = load_audio_file(file_path)
        
        if audio_data is None:
            # Cleanup file
            os.remove(file_path)
            return jsonify({
                'success': False,
                'error': 'audio_load_failed',
                'message': 'Could not load audio file'
            }), 400
        
        # Get optional parameters
        language = request.form.get('language', 'en-US')
        include_timestamps = request.form.get('include_timestamps', 'false').lower() == 'true'
        analyze_sentiment = request.form.get('analyze_sentiment', 'true').lower() == 'true'
        
        # Perform audio quality analysis
        logger.info("Analyzing audio quality...")
        quality_analysis = audio_processor.analyze_audio_quality(audio_data, sample_rate)
        
        # Perform speech-to-text conversion
        logger.info("Converting speech to text...")
        stt_result = speech_to_text.transcribe_audio(
            audio_data, 
            sample_rate, 
            language=language,
            include_timestamps=include_timestamps
        )
        
        # Perform additional audio analysis
        logger.info("Performing additional audio analysis...")
        speech_analysis = audio_processor.analyze_speech_characteristics(audio_data, sample_rate)
        
        # Cleanup uploaded file
        try:
            os.remove(file_path)
        except:
            pass
        
        # Calculate overall quality score
        overall_quality = calculate_overall_quality(quality_analysis, speech_analysis, stt_result)
        passed = overall_quality >= CONFIG['QUALITY_THRESHOLD']
        
        # Prepare response
        response = {
            'success': True,
            'data': {
                'transcription': stt_result.get('transcription', ''),
                'confidence': stt_result.get('confidence', 0.0),
                'language_detected': stt_result.get('language_detected', language),
                'word_count': len(stt_result.get('transcription', '').split()),
                'duration': len(audio_data) / sample_rate,
                'overall_quality': round(float(overall_quality), 4),
                'quality_threshold': CONFIG['QUALITY_THRESHOLD'],
                'passed': passed,
                'audio_quality': quality_analysis,
                'speech_analysis': speech_analysis
            },
            'metadata': {
                'processing_time': datetime.utcnow().isoformat(),
                'model_version': '1.0.0',
                'sample_rate': sample_rate,
                'file_type': filename.rsplit('.', 1)[1].lower()
            }
        }
        
        # Add timestamps if requested
        if include_timestamps and 'timestamps' in stt_result:
            response['data']['timestamps'] = stt_result['timestamps']
        
        # Add sentiment analysis if requested and available
        if analyze_sentiment and stt_result.get('transcription'):
            sentiment_result = audio_processor.analyze_sentiment(stt_result['transcription'])
            response['data']['sentiment_analysis'] = sentiment_result
        
        logger.info(f"Analysis complete: quality={overall_quality:.4f}, passed={passed}")
        return jsonify(response)
        
    except Exception as e:
        logger.error(f"Error in audio analysis: {str(e)}")
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

@app.route('/transcribe', methods=['POST'])
def transcribe_only():
    """Endpoint for speech-to-text conversion only"""
    try:
        if not speech_to_text:
            return jsonify({
                'success': False,
                'error': 'model_not_loaded',
                'message': 'Speech-to-text model not loaded'
            }), 500
        
        if 'file' not in request.files:
            return jsonify({
                'success': False,
                'error': 'no_file',
                'message': 'No file provided'
            }), 400
        
        file = request.files['file']
        
        if not file or file.filename == '' or not allowed_file(file.filename):
            return jsonify({
                'success': False,
                'error': 'invalid_file',
                'message': 'Invalid or no file provided'
            }), 400
        
        # Save and process file
        filename = secure_filename(file.filename)
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        filename = f"{timestamp}_{filename}"
        file_path = os.path.join(CONFIG['UPLOAD_FOLDER'], filename)
        file.save(file_path)
        
        # Load audio
        audio_data, sample_rate = load_audio_file(file_path)
        
        if audio_data is None:
            os.remove(file_path)
            return jsonify({
                'success': False,
                'error': 'audio_load_failed',
                'message': 'Could not load audio file'
            }), 400
        
        # Get parameters
        language = request.form.get('language', 'en-US')
        include_timestamps = request.form.get('include_timestamps', 'false').lower() == 'true'
        
        # Transcribe
        result = speech_to_text.transcribe_audio(
            audio_data, 
            sample_rate, 
            language=language,
            include_timestamps=include_timestamps
        )
        
        # Cleanup
        os.remove(file_path)
        
        return jsonify({
            'success': True,
            'data': result
        })
        
    except Exception as e:
        logger.error(f"Error in transcription: {str(e)}")
        
        try:
            if 'file_path' in locals():
                os.remove(file_path)
        except:
            pass
        
        return jsonify({
            'success': False,
            'error': 'transcription_failed',
            'message': str(e)
        }), 500

@app.route('/quality_check', methods=['POST'])
def quality_check():
    """Endpoint for audio quality analysis only"""
    try:
        if not audio_processor:
            return jsonify({
                'success': False,
                'error': 'model_not_loaded',
                'message': 'Audio processor not loaded'
            }), 500
        
        if 'file' not in request.files:
            return jsonify({
                'success': False,
                'error': 'no_file',
                'message': 'No file provided'
            }), 400
        
        file = request.files['file']
        
        if not file or file.filename == '' or not allowed_file(file.filename):
            return jsonify({
                'success': False,
                'error': 'invalid_file',
                'message': 'Invalid or no file provided'
            }), 400
        
        # Save and process file
        filename = secure_filename(file.filename)
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        filename = f"{timestamp}_{filename}"
        file_path = os.path.join(CONFIG['UPLOAD_FOLDER'], filename)
        file.save(file_path)
        
        # Load audio
        audio_data, sample_rate = load_audio_file(file_path)
        
        if audio_data is None:
            os.remove(file_path)
            return jsonify({
                'success': False,
                'error': 'audio_load_failed',
                'message': 'Could not load audio file'
            }), 400
        
        # Analyze quality
        quality_analysis = audio_processor.analyze_audio_quality(audio_data, sample_rate)
        speech_analysis = audio_processor.analyze_speech_characteristics(audio_data, sample_rate)
        
        # Calculate overall quality
        overall_quality = (quality_analysis.get('overall_score', 0.5) + 
                          speech_analysis.get('overall_score', 0.5)) / 2
        
        # Cleanup
        os.remove(file_path)
        
        return jsonify({
            'success': True,
            'data': {
                'overall_quality': round(float(overall_quality), 4),
                'passed': overall_quality >= CONFIG['QUALITY_THRESHOLD'],
                'audio_quality': quality_analysis,
                'speech_analysis': speech_analysis
            }
        })
        
    except Exception as e:
        logger.error(f"Error in quality check: {str(e)}")
        
        try:
            if 'file_path' in locals():
                os.remove(file_path)
        except:
            pass
        
        return jsonify({
            'success': False,
            'error': 'quality_check_failed',
            'message': str(e)
        }), 500

@app.route('/batch_analyze', methods=['POST'])
def batch_analyze():
    """Analyze multiple audio files in batch"""
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
        
        for file in files[:3]:  # Limit to 3 files for batch processing
            if file and file.filename and allowed_file(file.filename):
                try:
                    # Quick processing for batch
                    filename = secure_filename(file.filename)
                    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
                    filename = f"{timestamp}_{filename}"
                    file_path = os.path.join(CONFIG['UPLOAD_FOLDER'], filename)
                    file.save(file_path)
                    
                    # Load and analyze
                    audio_data, sample_rate = load_audio_file(file_path)
                    
                    if audio_data is not None:
                        # Quick transcription
                        stt_result = speech_to_text.transcribe_audio(audio_data, sample_rate)
                        
                        # Quick quality check
                        quality_score = audio_processor.quick_quality_check(audio_data, sample_rate)
                        
                        results.append({
                            'filename': file.filename,
                            'transcription': stt_result.get('transcription', ''),
                            'confidence': stt_result.get('confidence', 0.0),
                            'quality_score': quality_score,
                            'passed': quality_score >= CONFIG['QUALITY_THRESHOLD'],
                            'duration': len(audio_data) / sample_rate
                        })
                    else:
                        results.append({
                            'filename': file.filename,
                            'error': 'Could not process audio file'
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
                'successful_analyses': len([r for r in results if 'transcription' in r])
            }
        })
        
    except Exception as e:
        logger.error(f"Error in batch analysis: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'batch_analysis_failed',
            'message': str(e)
        }), 500

@app.route('/models/info', methods=['GET'])
def get_model_info():
    """Get information about loaded models"""
    return jsonify({
        'success': True,
        'data': {
            'audio_processor': {
                'loaded': audio_processor is not None,
                'version': audio_processor.get_version() if audio_processor else None
            },
            'speech_to_text': {
                'loaded': speech_to_text is not None,
                'version': speech_to_text.get_version() if speech_to_text else None,
                'supported_languages': speech_to_text.get_supported_languages() if speech_to_text else []
            }
        }
    })

def calculate_overall_quality(quality_analysis: Dict, speech_analysis: Dict, stt_result: Dict) -> float:
    """Calculate overall audio quality score"""
    try:
        # Weight different quality factors
        weights = {
            'audio_quality': 0.3,
            'speech_quality': 0.4,
            'transcription_confidence': 0.3
        }
        
        audio_quality = quality_analysis.get('overall_score', 0.5)
        speech_quality = speech_analysis.get('overall_score', 0.5)
        transcription_confidence = stt_result.get('confidence', 0.5)
        
        overall_quality = (
            weights['audio_quality'] * audio_quality +
            weights['speech_quality'] * speech_quality +
            weights['transcription_confidence'] * transcription_confidence
        )
        
        return max(0.0, min(1.0, overall_quality))
        
    except Exception as e:
        logger.error(f"Error calculating overall quality: {str(e)}")
        return 0.5

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
    logger.info("🚀 Starting InterviewX Audio Analysis Service...")
    
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