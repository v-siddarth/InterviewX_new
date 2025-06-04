// backend/src/controllers/evaluationController.js
const aiService = require('../services/aiService');
const Evaluation = require('../models/Evaluation');
const Interview = require('../models/Interview');
const User = require('../models/User');
const logger = require('../utils/logger');
const path = require('path');
const fs = require('fs').promises;

class EvaluationController {
    /**
     * Start a new evaluation process
     * POST /api/evaluations/start
     */
    async startEvaluation(req, res) {
        try {
            const { interviewId, questionId } = req.body;
            const userId = req.user.id;

            // Validate required fields
            if (!interviewId || !questionId) {
                return res.status(400).json({
                    success: false,
                    message: 'Interview ID and Question ID are required'
                });
            }

            // Check if interview exists and belongs to user
            const interview = await Interview.findOne({
                _id: interviewId,
                candidateId: userId
            }).populate('questions');

            if (!interview) {
                return res.status(404).json({
                    success: false,
                    message: 'Interview not found or access denied'
                });
            }

            // Check if question exists in interview
            const question = interview.questions.find(q => q._id.toString() === questionId);
            if (!question) {
                return res.status(404).json({
                    success: false,
                    message: 'Question not found in this interview'
                });
            }

            // Create new evaluation record
            const evaluation = new Evaluation({
                interviewId,
                questionId,
                candidateId: userId,
                status: 'in_progress',
                startedAt: new Date(),
                questionText: question.text,
                expectedKeywords: question.keywords || []
            });

            await evaluation.save();

            logger.info(`Evaluation started for user ${userId}, interview ${interviewId}, question ${questionId}`);

            res.status(201).json({
                success: true,
                message: 'Evaluation started successfully',
                evaluation: {
                    id: evaluation._id,
                    interviewId,
                    questionId,
                    status: evaluation.status,
                    questionText: question.text,
                    timeLimit: question.timeLimit || 300 // 5 minutes default
                }
            });

        } catch (error) {
            logger.error('Error starting evaluation:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to start evaluation',
                error: error.message
            });
        }
    }

    /**
     * Submit evaluation with media files
     * POST /api/evaluations/:evaluationId/submit
     */
    async submitEvaluation(req, res) {
        try {
            const { evaluationId } = req.params;
            const { answerText } = req.body;
            const userId = req.user.id;

            // Find evaluation
            const evaluation = await Evaluation.findOne({
                _id: evaluationId,
                candidateId: userId
            });

            if (!evaluation) {
                return res.status(404).json({
                    success: false,
                    message: 'Evaluation not found or access denied'
                });
            }

            if (evaluation.status === 'completed') {
                return res.status(400).json({
                    success: false,
                    message: 'Evaluation already completed'
                });
            }

            // Process uploaded files
            const videoFile = req.files?.video?.[0];
            const audioFile = req.files?.audio?.[0];

            if (!videoFile && !audioFile && !answerText) {
                return res.status(400).json({
                    success: false,
                    message: 'At least one form of answer (video, audio, or text) is required'
                });
            }

            // Update evaluation with submitted data
            evaluation.submittedAt = new Date();
            evaluation.status = 'processing';
            evaluation.answerText = answerText || '';

            // Store file paths if files were uploaded
            if (videoFile) {
                evaluation.videoPath = videoFile.path;
                evaluation.videoSize = videoFile.size;
            }

            if (audioFile) {
                evaluation.audioPath = audioFile.path;
                evaluation.audioSize = audioFile.size;
            }

            await evaluation.save();

            // Start AI analysis asynchronously
            this.processEvaluationAsync(evaluationId);

            logger.info(`Evaluation submitted for processing: ${evaluationId}`);

            res.json({
                success: true,
                message: 'Evaluation submitted successfully',
                evaluation: {
                    id: evaluation._id,
                    status: evaluation.status,
                    submittedAt: evaluation.submittedAt
                }
            });

        } catch (error) {
            logger.error('Error submitting evaluation:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to submit evaluation',
                error: error.message
            });
        }
    }

    /**
     * Process evaluation asynchronously with AI services
     * @param {string} evaluationId - The evaluation ID to process
     */
    async processEvaluationAsync(evaluationId) {
        try {
            logger.info(`Starting async processing for evaluation: ${evaluationId}`);

            const evaluation = await Evaluation.findById(evaluationId);
            if (!evaluation) {
                throw new Error('Evaluation not found');
            }

            // Prepare analysis data
            const analysisData = {
                questionText: evaluation.questionText,
                expectedKeywords: evaluation.expectedKeywords
            };

            // Add file paths if they exist
            if (evaluation.videoPath) {
                analysisData.videoPath = evaluation.videoPath;
            }

            if (evaluation.audioPath) {
                analysisData.audioPath = evaluation.audioPath;
            }

            if (evaluation.answerText) {
                analysisData.answerText = evaluation.answerText;
            }

            // Perform comprehensive AI analysis
            const analysisResult = await aiService.performComprehensiveAnalysis(analysisData);

            // Update evaluation with results
            evaluation.status = analysisResult.success ? 'completed' : 'failed';
            evaluation.completedAt = new Date();
            evaluation.processingTime = new Date() - evaluation.submittedAt;

            if (analysisResult.success) {
                // Store facial analysis results
                if (analysisResult.facial_analysis) {
                    evaluation.facialAnalysis = {
                        confidenceScore: analysisResult.facial_analysis.confidence_score,
                        faceDetected: analysisResult.facial_analysis.face_detected,
                        emotions: analysisResult.facial_analysis.emotions,
                        passedThreshold: analysisResult.facial_analysis.passed_threshold
                    };
                }

                // Store audio analysis results
                if (analysisResult.audio_analysis) {
                    evaluation.audioAnalysis = {
                        transcribedText: analysisResult.audio_analysis.transcribed_text,
                        audioQualityScore: analysisResult.audio_analysis.audio_quality_score,
                        speechClarity: analysisResult.audio_analysis.speech_clarity,
                        speakingPace: analysisResult.audio_analysis.speaking_pace,
                        volumeLevel: analysisResult.audio_analysis.volume_level
                    };

                    // Use transcribed text if no manual text was provided
                    if (!evaluation.answerText && analysisResult.audio_analysis.transcribed_text) {
                        evaluation.answerText = analysisResult.audio_analysis.transcribed_text;
                    }
                }

                // Store text analysis results
                if (analysisResult.text_analysis) {
                    evaluation.textAnalysis = {
                        overallScore: analysisResult.text_analysis.overall_score,
                        relevanceScore: analysisResult.text_analysis.relevance_score,
                        clarityScore: analysisResult.text_analysis.clarity_score,
                        completenessScore: analysisResult.text_analysis.completeness_score,
                        technicalScore: analysisResult.text_analysis.technical_score,
                        communicationScore: analysisResult.text_analysis.communication_score,
                        keywordMatches: analysisResult.text_analysis.keyword_matches,
                        feedback: analysisResult.text_analysis.feedback,
                        suggestions: analysisResult.text_analysis.suggestions,
                        passedThreshold: analysisResult.text_analysis.passed_threshold,
                        wordCount: analysisResult.text_analysis.word_count,
                        sentiment: analysisResult.text_analysis.sentiment
                    };
                }

                // Store overall evaluation
                if (analysisResult.overall_evaluation) {
                    evaluation.overallScore = analysisResult.overall_evaluation.overall_score;
                    evaluation.individualScores = analysisResult.overall_evaluation.individual_scores;
                    evaluation.thresholdsMet = analysisResult.overall_evaluation.thresholds_met;
                    evaluation.passed = analysisResult.overall_evaluation.passed;
                    evaluation.grade = analysisResult.overall_evaluation.grade;
                    evaluation.feedback = analysisResult.overall_evaluation.feedback;
                }

                // Store any errors
                if (analysisResult.errors && analysisResult.errors.length > 0) {
                    evaluation.analysisErrors = analysisResult.errors;
                }

            } else {
                evaluation.error = analysisResult.error;
                logger.error(`AI analysis failed for evaluation ${evaluationId}: ${analysisResult.error}`);
            }

            await evaluation.save();

            // Update interview progress
            await this.updateInterviewProgress(evaluation.interviewId);

            logger.info(`Evaluation processing completed: ${evaluationId}, Result: ${evaluation.passed ? 'PASSED' : 'FAILED'}`);

        } catch (error) {
            logger.error(`Error processing evaluation ${evaluationId}:`, error);

            // Update evaluation with error status
            try {
                await Evaluation.findByIdAndUpdate(evaluationId, {
                    status: 'failed',
                    error: error.message,
                    completedAt: new Date()
                });
            } catch (updateError) {
                logger.error('Error updating evaluation with failure status:', updateError);
            }
        }
    }

    /**
     * Update interview progress based on completed evaluations
     * @param {string} interviewId - The interview ID to update
     */
    async updateInterviewProgress(interviewId) {
        try {
            const interview = await Interview.findById(interviewId).populate('questions');
            if (!interview) return;

            const evaluations = await Evaluation.find({ interviewId });
            const totalQuestions = interview.questions.length;
            const completedEvaluations = evaluations.filter(e => e.status === 'completed').length;

            // Calculate overall interview score
            const passedEvaluations = evaluations.filter(e => e.passed).length;
            const overallScore = completedEvaluations > 0 ? 
                evaluations
                    .filter(e => e.status === 'completed')
                    .reduce((sum, e) => sum + (e.overallScore || 0), 0) / completedEvaluations 
                : 0;

            // Update interview status
            let status = interview.status;
            if (completedEvaluations === totalQuestions) {
                status = 'completed';
            } else if (completedEvaluations > 0) {
                status = 'in_progress';
            }

            await Interview.findByIdAndUpdate(interviewId, {
                status,
                progress: Math.round((completedEvaluations / totalQuestions) * 100),
                overallScore: Math.round(overallScore * 100) / 100,
                completedQuestions: completedEvaluations,
                passedQuestions: passedEvaluations,
                completedAt: status === 'completed' ? new Date() : undefined
            });

            logger.info(`Interview progress updated: ${interviewId}, Progress: ${completedEvaluations}/${totalQuestions}`);

        } catch (error) {
            logger.error('Error updating interview progress:', error);
        }
    }

    /**
     * Get evaluation results
     * GET /api/evaluations/:evaluationId
     */
    async getEvaluation(req, res) {
        try {
            const { evaluationId } = req.params;
            const userId = req.user.id;

            const evaluation = await Evaluation.findOne({
                _id: evaluationId,
                candidateId: userId
            }).populate('questionId', 'text type timeLimit');

            if (!evaluation) {
                return res.status(404).json({
                    success: false,
                    message: 'Evaluation not found or access denied'
                });
            }

            // Remove sensitive file paths from response
            const evaluationData = evaluation.toObject();
            delete evaluationData.videoPath;
            delete evaluationData.audioPath;

            res.json({
                success: true,
                evaluation: evaluationData
            });

        } catch (error) {
            logger.error('Error getting evaluation:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get evaluation',
                error: error.message
            });
        }
    }

    /**
     * Get all evaluations for an interview
     * GET /api/evaluations/interview/:interviewId
     */
    async getInterviewEvaluations(req, res) {
        try {
            const { interviewId } = req.params;
            const userId = req.user.id;

            // Verify user has access to this interview
            const interview = await Interview.findOne({
                _id: interviewId,
                candidateId: userId
            });

            if (!interview) {
                return res.status(404).json({
                    success: false,
                    message: 'Interview not found or access denied'
                });
            }

            const evaluations = await Evaluation.find({
                interviewId,
                candidateId: userId
            }).populate('questionId', 'text type timeLimit')
              .sort({ createdAt: 1 });

            // Remove sensitive data
            const cleanedEvaluations = evaluations.map(evaluation => {
                const evalData = evaluation.toObject();
                delete evalData.videoPath;
                delete evalData.audioPath;
                return evalData;
            });

            res.json({
                success: true,
                evaluations: cleanedEvaluations,
                summary: {
                    total: evaluations.length,
                    completed: evaluations.filter(e => e.status === 'completed').length,
                    passed: evaluations.filter(e => e.passed).length,
                    inProgress: evaluations.filter(e => e.status === 'in_progress').length,
                    failed: evaluations.filter(e => e.status === 'failed').length
                }
            });

        } catch (error) {
            logger.error('Error getting interview evaluations:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get interview evaluations',
                error: error.message
            });
        }
    }

    /**
     * Delete evaluation and associated files
     * DELETE /api/evaluations/:evaluationId
     */
    async deleteEvaluation(req, res) {
        try {
            const { evaluationId } = req.params;
            const userId = req.user.id;

            const evaluation = await Evaluation.findOne({
                _id: evaluationId,
                candidateId: userId
            });

            if (!evaluation) {
                return res.status(404).json({
                    success: false,
                    message: 'Evaluation not found or access denied'
                });
            }

            // Delete associated files
            if (evaluation.videoPath) {
                try {
                    await fs.unlink(evaluation.videoPath);
                    logger.info(`Deleted video file: ${evaluation.videoPath}`);
                } catch (error) {
                    logger.warn(`Failed to delete video file: ${evaluation.videoPath}`, error);
                }
            }

            if (evaluation.audioPath) {
                try {
                    await fs.unlink(evaluation.audioPath);
                    logger.info(`Deleted audio file: ${evaluation.audioPath}`);
                } catch (error) {
                    logger.warn(`Failed to delete audio file: ${evaluation.audioPath}`, error);
                }
            }

            // Delete evaluation record
            await Evaluation.findByIdAndDelete(evaluationId);

            // Update interview progress
            await this.updateInterviewProgress(evaluation.interviewId);

            logger.info(`Evaluation deleted: ${evaluationId}`);

            res.json({
                success: true,
                message: 'Evaluation deleted successfully'
            });

        } catch (error) {
            logger.error('Error deleting evaluation:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to delete evaluation',
                error: error.message
            });
        }
    }

    /**
     * Get evaluation status (for polling)
     * GET /api/evaluations/:evaluationId/status
     */
    async getEvaluationStatus(req, res) {
        try {
            const { evaluationId } = req.params;
            const userId = req.user.id;

            const evaluation = await Evaluation.findOne({
                _id: evaluationId,
                candidateId: userId
            }).select('status overallScore passed completedAt error');

            if (!evaluation) {
                return res.status(404).json({
                    success: false,
                    message: 'Evaluation not found or access denied'
                });
            }

            res.json({
                success: true,
                status: evaluation.status,
                overallScore: evaluation.overallScore,
                passed: evaluation.passed,
                completedAt: evaluation.completedAt,
                error: evaluation.error
            });

        } catch (error) {
            logger.error('Error getting evaluation status:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get evaluation status',
                error: error.message
            });
        }
    }

    /**
     * Retry failed evaluation
     * POST /api/evaluations/:evaluationId/retry
     */
    async retryEvaluation(req, res) {
        try {
            const { evaluationId } = req.params;
            const userId = req.user.id;

            const evaluation = await Evaluation.findOne({
                _id: evaluationId,
                candidateId: userId
            });

            if (!evaluation) {
                return res.status(404).json({
                    success: false,
                    message: 'Evaluation not found or access denied'
                });
            }

            if (evaluation.status !== 'failed') {
                return res.status(400).json({
                    success: false,
                    message: 'Only failed evaluations can be retried'
                });
            }

            // Reset evaluation status
            evaluation.status = 'processing';
            evaluation.error = undefined;
            evaluation.completedAt = undefined;
            await evaluation.save();

            // Start processing again
            this.processEvaluationAsync(evaluationId);

            logger.info(`Evaluation retry initiated: ${evaluationId}`);

            res.json({
                success: true,
                message: 'Evaluation retry initiated',
                status: evaluation.status
            });

        } catch (error) {
            logger.error('Error retrying evaluation:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to retry evaluation',
                error: error.message
            });
        }
    }
}

module.exports = new EvaluationController();