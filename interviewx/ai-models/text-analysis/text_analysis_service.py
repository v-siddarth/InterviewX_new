#!/usr/bin/env python3
"""
InterviewX - Text Analysis Service
Uses Gemini Pro for intelligent text evaluation and analysis
"""

import os
import logging
import traceback
from datetime import datetime
from typing import Dict, List, Any, Optional

from flask import Flask, request, jsonify
from flask_cors import CORS

# Import our custom utilities
from utils.gemini_client import GeminiClient
from utils.text_processor import TextProcessor

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
    'QUALITY_THRESHOLD': 0.8,  # 80% threshold for text quality
    'MAX_TEXT_LENGTH': 10000,  # Maximum text length for analysis
    'PORT': int(os.getenv('PORT', 5003)),
    'HOST': os.getenv('HOST', '0.0.0.0'),
    'DEBUG': os.getenv('DEBUG', 'False').lower() == 'true',
    'GEMINI_API_KEY': os.getenv('GEMINI_API_KEY'),
    'DEFAULT_MODEL': 'gemini-pro',
    'BATCH_SIZE': 5,  # Maximum texts to process in batch
}

# Initialize text analysis components
gemini_client = None
text_processor = None

def initialize_models():
    """Initialize text analysis and Gemini models"""
    global gemini_client, text_processor
    
    try:
        logger.info("Initializing text analysis models...")
        
        # Initialize Gemini client
        if CONFIG['GEMINI_API_KEY']:
            gemini_client = GeminiClient(api_key=CONFIG['GEMINI_API_KEY'])
            logger.info("✅ Gemini client initialized")
        else:
            logger.warning("⚠️ GEMINI_API_KEY not provided, using fallback analysis")
            gemini_client = None
        
        # Initialize text processor
        text_processor = TextProcessor()
        logger.info("✅ Text processor initialized")
        
        logger.info("🎯 All text analysis models ready!")
        return True
        
    except Exception as e:
        logger.error(f"❌ Error initializing models: {str(e)}")
        logger.error(traceback.format_exc())
        return False

def validate_text_input(text: str) -> tuple:
    """
    Validate text input
    
    Args:
        text: Input text to validate
        
    Returns:
        Tuple of (is_valid, error_message)
    """
    if not text or not text.strip():
        return False, "Empty text provided"
    
    if len(text) > CONFIG['MAX_TEXT_LENGTH']:
        return False, f"Text length exceeds maximum of {CONFIG['MAX_TEXT_LENGTH']} characters"
    
    # Check for minimum meaningful content
    if len(text.split()) < 3:
        return False, "Text must contain at least 3 words"
    
    return True, None

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'service': 'text-analysis',
        'version': '1.0.0',
        'timestamp': datetime.utcnow().isoformat(),
        'models_loaded': {
            'gemini_client': gemini_client is not None,
            'text_processor': text_processor is not None
        },
        'gemini_available': CONFIG['GEMINI_API_KEY'] is not None
    })

@app.route('/analyze', methods=['POST'])
def analyze_text():
    """
    Main endpoint for text analysis
    Accepts text input and returns comprehensive analysis including Gemini evaluation
    """
    try:
        # Check if models are loaded
        if not text_processor:
            return jsonify({
                'success': False,
                'error': 'models_not_initialized',
                'message': 'Text analysis models are not loaded'
            }), 500
        
        # Get text from request
        data = request.get_json()
        if not data:
            return jsonify({
                'success': False,
                'error': 'no_data',
                'message': 'No JSON data provided'
            }), 400
        
        text = data.get('text', '')
        question = data.get('question', '')  # Optional interview question context
        analysis_type = data.get('analysis_type', 'comprehensive')  # comprehensive, quick, grammar_only
        include_suggestions = data.get('include_suggestions', True)
        
        # Validate input
        is_valid, error_msg = validate_text_input(text)
        if not is_valid:
            return jsonify({
                'success': False,
                'error': 'invalid_input',
                'message': error_msg
            }), 400
        
        logger.info(f"Analyzing text: {len(text)} characters, type: {analysis_type}")
        
        # Perform text processing analysis
        logger.info("Performing text processing analysis...")
        text_metrics = text_processor.analyze_text(text)
        
        # Perform Gemini analysis if available
        gemini_analysis = None
        if gemini_client:
            try:
                logger.info("Performing Gemini Pro analysis...")
                gemini_analysis = gemini_client.analyze_interview_response(
                    text=text,
                    question=question,
                    analysis_type=analysis_type
                )
            except Exception as e:
                logger.warning(f"Gemini analysis failed: {str(e)}")
                gemini_analysis = {'error': str(e)}
        
        # Combine analyses
        combined_analysis = combine_analyses(text_metrics, gemini_analysis, text, question)
        
        # Calculate overall quality score
        overall_quality = calculate_overall_quality(combined_analysis)
        passed = overall_quality >= CONFIG['QUALITY_THRESHOLD']
        
        # Generate suggestions if requested
        suggestions = []
        if include_suggestions:
            suggestions = generate_suggestions(combined_analysis, text)
        
        # Prepare response
        response = {
            'success': True,
            'data': {
                'text_length': len(text),
                'word_count': len(text.split()),
                'overall_quality': round(float(overall_quality), 4),
                'quality_threshold': CONFIG['QUALITY_THRESHOLD'],
                'passed': passed,
                'analysis_type': analysis_type,
                'text_metrics': text_metrics,
                'ai_analysis': gemini_analysis,
                'combined_scores': {
                    'grammar_score': combined_analysis.get('grammar_score', 0.5),
                    'clarity_score': combined_analysis.get('clarity_score', 0.5),
                    'relevance_score': combined_analysis.get('relevance_score', 0.5),
                    'completeness_score': combined_analysis.get('completeness_score', 0.5),
                    'professionalism_score': combined_analysis.get('professionalism_score', 0.5)
                },
                'quality_level': get_quality_level(overall_quality),
                'suggestions': suggestions
            },
            'metadata': {
                'processing_time': datetime.utcnow().isoformat(),
                'model_version': '1.0.0',
                'gemini_used': gemini_analysis is not None and 'error' not in gemini_analysis,
                'question_provided': bool(question)
            }
        }
        
        logger.info(f"Analysis complete: quality={overall_quality:.4f}, passed={passed}")
        return jsonify(response)
        
    except Exception as e:
        logger.error(f"Error in text analysis: {str(e)}")
        logger.error(traceback.format_exc())
        
        return jsonify({
            'success': False,
            'error': 'internal_error',
            'message': 'An internal error occurred during analysis'
        }), 500

@app.route('/grammar_check', methods=['POST'])
def grammar_check():
    """Endpoint for grammar checking only"""
    try:
        data = request.get_json()
        if not data or 'text' not in data:
            return jsonify({
                'success': False,
                'error': 'no_text',
                'message': 'No text provided'
            }), 400
        
        text = data['text']
        
        # Validate input
        is_valid, error_msg = validate_text_input(text)
        if not is_valid:
            return jsonify({
                'success': False,
                'error': 'invalid_input',
                'message': error_msg
            }), 400
        
        # Perform grammar analysis
        grammar_analysis = text_processor.check_grammar(text)
        
        return jsonify({
            'success': True,
            'data': grammar_analysis
        })
        
    except Exception as e:
        logger.error(f"Error in grammar check: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'grammar_check_failed',
            'message': str(e)
        }), 500

@app.route('/readability', methods=['POST'])
def check_readability():
    """Endpoint for readability analysis"""
    try:
        data = request.get_json()
        if not data or 'text' not in data:
            return jsonify({
                'success': False,
                'error': 'no_text',
                'message': 'No text provided'
            }), 400
        
        text = data['text']
        
        # Validate input
        is_valid, error_msg = validate_text_input(text)
        if not is_valid:
            return jsonify({
                'success': False,
                'error': 'invalid_input',
                'message': error_msg
            }), 400
        
        # Perform readability analysis
        readability_analysis = text_processor.analyze_readability(text)
        
        return jsonify({
            'success': True,
            'data': readability_analysis
        })
        
    except Exception as e:
        logger.error(f"Error in readability check: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'readability_check_failed',
            'message': str(e)
        }), 500

@app.route('/sentiment', methods=['POST'])
def analyze_sentiment():
    """Endpoint for sentiment analysis"""
    try:
        data = request.get_json()
        if not data or 'text' not in data:
            return jsonify({
                'success': False,
                'error': 'no_text',
                'message': 'No text provided'
            }), 400
        
        text = data['text']
        
        # Validate input
        is_valid, error_msg = validate_text_input(text)
        if not is_valid:
            return jsonify({
                'success': False,
                'error': 'invalid_input',
                'message': error_msg
            }), 400
        
        # Perform sentiment analysis
        sentiment_analysis = text_processor.analyze_sentiment(text)
        
        return jsonify({
            'success': True,
            'data': sentiment_analysis
        })
        
    except Exception as e:
        logger.error(f"Error in sentiment analysis: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'sentiment_analysis_failed',
            'message': str(e)
        }), 500

@app.route('/batch_analyze', methods=['POST'])
def batch_analyze():
    """Analyze multiple texts in batch"""
    try:
        data = request.get_json()
        if not data or 'texts' not in data:
            return jsonify({
                'success': False,
                'error': 'no_texts',
                'message': 'No texts provided'
            }), 400
        
        texts = data['texts']
        questions = data.get('questions', [])  # Optional questions for each text
        
        if not isinstance(texts, list):
            return jsonify({
                'success': False,
                'error': 'invalid_format',
                'message': 'Texts must be provided as a list'
            }), 400
        
        if len(texts) > CONFIG['BATCH_SIZE']:
            return jsonify({
                'success': False,
                'error': 'batch_too_large',
                'message': f'Maximum batch size is {CONFIG["BATCH_SIZE"]}'
            }), 400
        
        results = []
        
        for i, text in enumerate(texts):
            try:
                # Get corresponding question if available
                question = questions[i] if i < len(questions) else ''
                
                # Validate text
                is_valid, error_msg = validate_text_input(text)
                if not is_valid:
                    results.append({
                        'index': i,
                        'success': False,
                        'error': error_msg
                    })
                    continue
                
                # Quick analysis for batch processing
                text_metrics = text_processor.quick_analyze(text)
                
                # Simplified quality calculation
                quality_score = (
                    text_metrics.get('grammar_score', 0.5) * 0.3 +
                    text_metrics.get('clarity_score', 0.5) * 0.3 +
                    text_metrics.get('readability_score', 0.5) * 0.2 +
                    text_metrics.get('completeness_score', 0.5) * 0.2
                )
                
                results.append({
                    'index': i,
                    'success': True,
                    'text_length': len(text),
                    'word_count': len(text.split()),
                    'quality_score': round(float(quality_score), 4),
                    'passed': quality_score >= CONFIG['QUALITY_THRESHOLD'],
                    'metrics': text_metrics
                })
                
            except Exception as e:
                results.append({
                    'index': i,
                    'success': False,
                    'error': str(e)
                })
        
        return jsonify({
            'success': True,
            'data': {
                'results': results,
                'total_texts': len(texts),
                'successful_analyses': len([r for r in results if r.get('success', False)])
            }
        })
        
    except Exception as e:
        logger.error(f"Error in batch analysis: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'batch_analysis_failed',
            'message': str(e)
        }), 500

@app.route('/compare', methods=['POST'])
def compare_texts():
    """Compare two texts for similarity and quality"""
    try:
        data = request.get_json()
        if not data or 'text1' not in data or 'text2' not in data:
            return jsonify({
                'success': False,
                'error': 'insufficient_data',
                'message': 'Two texts required for comparison'
            }), 400
        
        text1 = data['text1']
        text2 = data['text2']
        
        # Validate inputs
        for i, text in enumerate([text1, text2], 1):
            is_valid, error_msg = validate_text_input(text)
            if not is_valid:
                return jsonify({
                    'success': False,
                    'error': f'invalid_text{i}',
                    'message': f'Text {i}: {error_msg}'
                }), 400
        
        # Perform comparison
        comparison_result = text_processor.compare_texts(text1, text2)
        
        return jsonify({
            'success': True,
            'data': comparison_result
        })
        
    except Exception as e:
        logger.error(f"Error in text comparison: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'comparison_failed',
            'message': str(e)
        }), 500

@app.route('/models/info', methods=['GET'])
def get_model_info():
    """Get information about loaded models"""
    return jsonify({
        'success': True,
        'data': {
            'text_processor': {
                'loaded': text_processor is not None,
                'version': text_processor.get_version() if text_processor else None,
                'features': text_processor.get_features() if text_processor else []
            },
            'gemini_client': {
                'loaded': gemini_client is not None,
                'version': gemini_client.get_version() if gemini_client else None,
                'model': CONFIG['DEFAULT_MODEL'],
                'api_key_configured': CONFIG['GEMINI_API_KEY'] is not None
            }
        }
    })

def combine_analyses(text_metrics: Dict, gemini_analysis: Optional[Dict], 
                    text: str, question: str) -> Dict:
    """Combine text processing and Gemini analyses"""
    try:
        combined = text_metrics.copy()
        
        # If Gemini analysis is available and successful
        if gemini_analysis and 'error' not in gemini_analysis:
            # Merge Gemini scores with text processing scores
            gemini_scores = gemini_analysis.get('scores', {})
            
            # Weight the scores (text processing + Gemini)
            weights = {'text_processing': 0.4, 'gemini': 0.6}
            
            for score_type in ['grammar_score', 'clarity_score', 'relevance_score', 'completeness_score']:
                text_score = combined.get(score_type, 0.5)
                gemini_score = gemini_scores.get(score_type, 0.5)
                
                # Weighted average
                combined[score_type] = (
                    weights['text_processing'] * text_score +
                    weights['gemini'] * gemini_score
                )
            
            # Add professionalism score from Gemini
            combined['professionalism_score'] = gemini_scores.get('professionalism_score', 0.5)
            
            # Add Gemini-specific insights
            combined['ai_insights'] = gemini_analysis.get('insights', [])
            combined['content_analysis'] = gemini_analysis.get('content_analysis', {})
            
        else:
            # Use only text processing scores
            combined['professionalism_score'] = combined.get('formality_score', 0.5)
            combined['ai_insights'] = []
            combined['content_analysis'] = {}
        
        return combined
        
    except Exception as e:
        logger.error(f"Error combining analyses: {str(e)}")
        return text_metrics

def calculate_overall_quality(analysis: Dict) -> float:
    """Calculate overall quality score from combined analysis"""
    try:
        # Weight different quality components
        weights = {
            'grammar_score': 0.25,
            'clarity_score': 0.25,
            'relevance_score': 0.20,
            'completeness_score': 0.15,
            'professionalism_score': 0.15
        }
        
        quality_score = 0.0
        total_weight = 0.0
        
        for metric, weight in weights.items():
            if metric in analysis:
                quality_score += weight * analysis[metric]
                total_weight += weight
        
        # Normalize by actual weights used
        if total_weight > 0:
            quality_score /= total_weight
        else:
            quality_score = 0.5
        
        return max(0.0, min(1.0, quality_score))
        
    except Exception as e:
        logger.error(f"Error calculating overall quality: {str(e)}")
        return 0.5

def get_quality_level(score: float) -> str:
    """Convert quality score to descriptive level"""
    if score >= 0.9:
        return "Excellent"
    elif score >= 0.8:
        return "Good"
    elif score >= 0.6:
        return "Fair"
    elif score >= 0.4:
        return "Poor"
    else:
        return "Very Poor"

def generate_suggestions(analysis: Dict, text: str) -> List[str]:
    """Generate improvement suggestions based on analysis"""
    try:
        suggestions = []
        
        # Grammar suggestions
        if analysis.get('grammar_score', 1.0) < 0.7:
            suggestions.append("Consider reviewing grammar and sentence structure for clarity.")
        
        # Clarity suggestions
        if analysis.get('clarity_score', 1.0) < 0.7:
            suggestions.append("Try to express ideas more clearly and concisely.")
        
        # Length suggestions
        word_count = len(text.split())
        if word_count < 50:
            suggestions.append("Consider providing more detailed responses to fully address the question.")
        elif word_count > 300:
            suggestions.append("Try to be more concise while maintaining the key points.")
        
        # Relevance suggestions
        if analysis.get('relevance_score', 1.0) < 0.7:
            suggestions.append("Ensure your response directly addresses the question asked.")
        
        # Professionalism suggestions
        if analysis.get('professionalism_score', 1.0) < 0.7:
            suggestions.append("Use more professional language and avoid overly casual expressions.")
        
        # AI-generated insights
        ai_insights = analysis.get('ai_insights', [])
        for insight in ai_insights[:3]:  # Limit to top 3
            if isinstance(insight, str):
                suggestions.append(insight)
        
        return suggestions[:5]  # Limit to 5 suggestions
        
    except Exception as e:
        logger.error(f"Error generating suggestions: {str(e)}")
        return ["Continue practicing to improve your interview responses."]

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

if __name__ == '__main__':
    logger.info("🚀 Starting InterviewX Text Analysis Service...")
    
    # Initialize models
    if not initialize_models():
        logger.error("❌ Failed to initialize models. Exiting...")
        exit(1)
    
    logger.info(f"🌐 Starting server on {CONFIG['HOST']}:{CONFIG['PORT']}")
    
    # Start Flask app
    app.run(
        host=CONFIG['HOST'],
        port=CONFIG['PORT'],
        debug=CONFIG['DEBUG'],
        threaded=True
    )