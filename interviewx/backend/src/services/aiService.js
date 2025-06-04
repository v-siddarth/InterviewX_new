// backend/src/services/aiService.js
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');
const logger = require('../utils/logger');
const config = require('../utils/config');

class AIService {
    constructor() {
        // AI service endpoints - should be in environment variables
        this.facialAnalysisUrl = process.env.FACIAL_ANALYSIS_URL || 'http://localhost:8001';
        this.audioAnalysisUrl = process.env.AUDIO_ANALYSIS_URL || 'http://localhost:8002';
        this.textAnalysisUrl = process.env.TEXT_ANALYSIS_URL || 'http://localhost:8003';
        
        // Timeout for AI service calls
        this.timeout = 30000; // 30 seconds
        
        // Initialize axios instances with proper configuration
        this.facialClient = axios.create({
            baseURL: this.facialAnalysisUrl,
            timeout: this.timeout,
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        this.audioClient = axios.create({
            baseURL: this.audioAnalysisUrl,
            timeout: this.timeout
        });
        
        this.textClient = axios.create({
            baseURL: this.textAnalysisUrl,
            timeout: this.timeout,
            headers: {
                'Content-Type': 'application/json'
            }
        });
    }

    /**
     * Analyze facial features and confidence from video/image
     * @param {string} mediaPath - Path to the media file
     * @param {string} mediaType - 'image' or 'video'
     * @returns {Object} Facial analysis results
     */
    async analyzeFacialFeatures(mediaPath, mediaType = 'image') {
        try {
            logger.info(`Starting facial analysis for ${mediaType}: ${mediaPath}`);
            
            // Check if file exists
            if (!fs.existsSync(mediaPath)) {
                throw new Error(`Media file not found: ${mediaPath}`);
            }

            const formData = new FormData();
            formData.append('file', fs.createReadStream(mediaPath));
            formData.append('media_type', mediaType);
            formData.append('analysis_type', 'confidence');

            const response = await this.facialClient.post('/analyze', formData, {
                headers: {
                    ...formData.getHeaders(),
                    'Content-Type': 'multipart/form-data'
                },
                timeout: this.timeout
            });

            const result = response.data;
            
            // Validate response structure
            if (!result || typeof result.confidence_score === 'undefined') {
                throw new Error('Invalid response from facial analysis service');
            }

            logger.info(`Facial analysis completed. Confidence: ${result.confidence_score}%`);
            
            return {
                success: true,
                confidence_score: result.confidence_score,
                face_detected: result.face_detected || false,
                emotions: result.emotions || {},
                face_landmarks: result.face_landmarks || {},
                analysis_timestamp: new Date().toISOString(),
                passed_threshold: result.confidence_score >= 80
            };

        } catch (error) {
            logger.error('Facial analysis failed:', error.message);
            
            if (error.code === 'ECONNREFUSED') {
                throw new Error('Facial analysis service is unavailable');
            }
            
            return {
                success: false,
                error: error.message,
                confidence_score: 0,
                face_detected: false,
                passed_threshold: false
            };
        }
    }

    /**
     * Analyze audio for speech quality and convert to text
     * @param {string} audioPath - Path to the audio file
     * @param {string} questionText - The question being answered
     * @returns {Object} Audio analysis results
     */
    async analyzeAudio(audioPath, questionText = '') {
        try {
            logger.info(`Starting audio analysis: ${audioPath}`);
            
            // Check if file exists
            if (!fs.existsSync(audioPath)) {
                throw new Error(`Audio file not found: ${audioPath}`);
            }

            const formData = new FormData();
            formData.append('audio_file', fs.createReadStream(audioPath));
            formData.append('question_context', questionText);
            formData.append('analysis_type', 'full'); // speech-to-text + quality analysis

            const response = await this.audioClient.post('/analyze', formData, {
                headers: {
                    ...formData.getHeaders(),
                    'Content-Type': 'multipart/form-data'
                },
                timeout: this.timeout
            });

            const result = response.data;
            
            // Validate response structure
            if (!result || typeof result.transcribed_text === 'undefined') {
                throw new Error('Invalid response from audio analysis service');
            }

            logger.info(`Audio analysis completed. Transcription length: ${result.transcribed_text.length}`);
            
            return {
                success: true,
                transcribed_text: result.transcribed_text,
                audio_quality_score: result.audio_quality_score || 0,
                speech_clarity: result.speech_clarity || 0,
                speaking_pace: result.speaking_pace || 'normal',
                volume_level: result.volume_level || 'normal',
                background_noise: result.background_noise || 'low',
                analysis_timestamp: new Date().toISOString(),
                duration_seconds: result.duration_seconds || 0
            };

        } catch (error) {
            logger.error('Audio analysis failed:', error.message);
            
            if (error.code === 'ECONNREFUSED') {
                throw new Error('Audio analysis service is unavailable');
            }
            
            return {
                success: false,
                error: error.message,
                transcribed_text: '',
                audio_quality_score: 0
            };
        }
    }

    /**
     * Analyze text response using Gemini Pro
     * @param {string} answerText - The candidate's answer
     * @param {string} questionText - The interview question
     * @param {string} expectedKeywords - Keywords expected in the answer
     * @returns {Object} Text analysis results
     */
    async analyzeText(answerText, questionText, expectedKeywords = []) {
        try {
            logger.info('Starting text analysis with Gemini Pro');
            
            if (!answerText || answerText.trim().length === 0) {
                throw new Error('Answer text is empty or invalid');
            }

            const analysisPayload = {
                answer_text: answerText.trim(),
                question_text: questionText || '',
                expected_keywords: Array.isArray(expectedKeywords) ? expectedKeywords : [],
                analysis_criteria: {
                    relevance: true,
                    clarity: true,
                    completeness: true,
                    technical_accuracy: true,
                    communication_skills: true
                }
            };

            const response = await this.textClient.post('/analyze', analysisPayload, {
                timeout: this.timeout
            });

            const result = response.data;
            
            // Validate response structure
            if (!result || typeof result.overall_score === 'undefined') {
                throw new Error('Invalid response from text analysis service');
            }

            logger.info(`Text analysis completed. Overall score: ${result.overall_score}%`);
            
            return {
                success: true,
                overall_score: result.overall_score,
                relevance_score: result.relevance_score || 0,
                clarity_score: result.clarity_score || 0,
                completeness_score: result.completeness_score || 0,
                technical_score: result.technical_score || 0,
                communication_score: result.communication_score || 0,
                keyword_matches: result.keyword_matches || [],
                feedback: result.feedback || '',
                suggestions: result.suggestions || [],
                analysis_timestamp: new Date().toISOString(),
                passed_threshold: result.overall_score >= 80,
                word_count: answerText.split(' ').length,
                sentiment: result.sentiment || 'neutral'
            };

        } catch (error) {
            logger.error('Text analysis failed:', error.message);
            
            if (error.code === 'ECONNREFUSED') {
                throw new Error('Text analysis service is unavailable');
            }
            
            return {
                success: false,
                error: error.message,
                overall_score: 0,
                passed_threshold: false
            };
        }
    }

    /**
     * Comprehensive analysis combining all AI services
     * @param {Object} analysisData - Contains all analysis inputs
     * @returns {Object} Combined analysis results
     */
    async performComprehensiveAnalysis({
        videoPath,
        audioPath,
        answerText,
        questionText,
        expectedKeywords = []
    }) {
        try {
            logger.info('Starting comprehensive analysis');
            
            const analysisPromises = [];
            
            // Facial analysis if video provided
            if (videoPath) {
                analysisPromises.push(
                    this.analyzeFacialFeatures(videoPath, 'video')
                        .catch(error => ({ 
                            success: false, 
                            error: error.message,
                            service: 'facial' 
                        }))
                );
            }
            
            // Audio analysis if audio provided
            if (audioPath) {
                analysisPromises.push(
                    this.analyzeAudio(audioPath, questionText)
                        .catch(error => ({ 
                            success: false, 
                            error: error.message,
                            service: 'audio' 
                        }))
                );
            }
            
            // Text analysis if answer provided
            if (answerText) {
                analysisPromises.push(
                    this.analyzeText(answerText, questionText, expectedKeywords)
                        .catch(error => ({ 
                            success: false, 
                            error: error.message,
                            service: 'text' 
                        }))
                );
            }

            // Wait for all analyses to complete
            const results = await Promise.all(analysisPromises);
            
            // Process results
            const facialResult = results.find(r => r.confidence_score !== undefined) || {};
            const audioResult = results.find(r => r.transcribed_text !== undefined) || {};
            const textResult = results.find(r => r.overall_score !== undefined) || {};
            
            // Calculate overall evaluation
            const evaluation = this.calculateOverallEvaluation(facialResult, audioResult, textResult);
            
            logger.info(`Comprehensive analysis completed. Overall result: ${evaluation.passed ? 'PASSED' : 'FAILED'}`);
            
            return {
                success: true,
                timestamp: new Date().toISOString(),
                facial_analysis: facialResult,
                audio_analysis: audioResult,
                text_analysis: textResult,
                overall_evaluation: evaluation,
                errors: results.filter(r => !r.success).map(r => r.error)
            };

        } catch (error) {
            logger.error('Comprehensive analysis failed:', error.message);
            
            return {
                success: false,
                error: error.message,
                timestamp: new Date().toISOString()
            };
        }
    }

    /**
     * Calculate overall evaluation based on all analysis results
     * @param {Object} facialResult - Facial analysis results
     * @param {Object} audioResult - Audio analysis results  
     * @param {Object} textResult - Text analysis results
     * @returns {Object} Overall evaluation
     */
    calculateOverallEvaluation(facialResult = {}, audioResult = {}, textResult = {}) {
        const scores = {
            facial: facialResult.confidence_score || 0,
            audio: audioResult.audio_quality_score || 0,
            text: textResult.overall_score || 0
        };
        
        // Calculate weighted average (text analysis has higher weight)
        const weights = {
            facial: 0.25,  // 25%
            audio: 0.25,   // 25% 
            text: 0.50     // 50%
        };
        
        const weightedScore = (
            scores.facial * weights.facial +
            scores.audio * weights.audio +
            scores.text * weights.text
        );
        
        // Check individual thresholds (both facial and text must pass 80%)
        const facialPassed = scores.facial >= 80;
        const textPassed = scores.text >= 80;
        const audioPassed = scores.audio >= 60; // Lower threshold for audio quality
        
        const overallPassed = facialPassed && textPassed && audioPassed && weightedScore >= 75;
        
        return {
            overall_score: Math.round(weightedScore * 100) / 100,
            individual_scores: scores,
            thresholds_met: {
                facial: facialPassed,
                audio: audioPassed,
                text: textPassed
            },
            passed: overallPassed,
            grade: this.getGrade(weightedScore),
            feedback: this.generateFeedback(scores, overallPassed)
        };
    }

    /**
     * Get letter grade based on score
     * @param {number} score - Overall score
     * @returns {string} Letter grade
     */
    getGrade(score) {
        if (score >= 90) return 'A';
        if (score >= 80) return 'B';
        if (score >= 70) return 'C';
        if (score >= 60) return 'D';
        return 'F';
    }

    /**
     * Generate feedback based on analysis results
     * @param {Object} scores - Individual scores
     * @param {boolean} passed - Whether overall evaluation passed
     * @returns {string} Feedback message
     */
    generateFeedback(scores, passed) {
        const feedback = [];
        
        if (passed) {
            feedback.push('Congratulations! You have successfully passed the interview evaluation.');
        } else {
            feedback.push('Interview evaluation requires improvement in the following areas:');
        }
        
        if (scores.facial < 80) {
            feedback.push('- Maintain better eye contact and confident posture during the interview.');
        }
        
        if (scores.audio < 60) {
            feedback.push('- Speak more clearly and ensure good audio quality.');
        }
        
        if (scores.text < 80) {
            feedback.push('- Provide more detailed and relevant answers to the questions.');
        }
        
        return feedback.join(' ');
    }

    /**
     * Health check for all AI services
     * @returns {Object} Health status of all services
     */
    async healthCheck() {
        const services = [
            { name: 'facial', client: this.facialClient, endpoint: '/health' },
            { name: 'audio', client: this.audioClient, endpoint: '/health' },
            { name: 'text', client: this.textClient, endpoint: '/health' }
        ];
        
        const healthResults = await Promise.all(
            services.map(async (service) => {
                try {
                    const response = await service.client.get(service.endpoint, { timeout: 5000 });
                    return {
                        service: service.name,
                        status: 'healthy',
                        response_time: response.headers['x-response-time'] || 'unknown'
                    };
                } catch (error) {
                    return {
                        service: service.name,
                        status: 'unhealthy',
                        error: error.message
                    };
                }
            })
        );
        
        const allHealthy = healthResults.every(result => result.status === 'healthy');
        
        return {
            overall_status: allHealthy ? 'healthy' : 'degraded',
            services: healthResults,
            timestamp: new Date().toISOString()
        };
    }
}

module.exports = new AIService();