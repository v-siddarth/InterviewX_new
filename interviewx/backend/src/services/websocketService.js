// backend/src/services/websocketService.js
const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Interview = require('../models/Interview');
const Evaluation = require('../models/Evaluation');
const aiService = require('./aiService');
const logger = require('../utils/logger');
const config = require('../utils/config');

class WebSocketService {
    constructor() {
        this.io = null;
        this.connectedUsers = new Map(); // userId -> socketId mapping
        this.activeInterviews = new Map(); // interviewId -> Set of socketIds
        this.realTimeAnalysis = new Map(); // socketId -> analysis state
        this.isInitialized = false;
    }

    /**
     * Initialize WebSocket server
     * @param {Object} server - HTTP server instance
     */
    initialize(server) {
        if (this.isInitialized) {
            logger.warn('WebSocket service already initialized');
            return;
        }

        this.io = new Server(server, {
            cors: {
                origin: config.FRONTEND_URL || "http://localhost:3000",
                methods: ["GET", "POST"],
                credentials: true
            },
            transports: ['websocket', 'polling'],
            pingTimeout: 60000,
            pingInterval: 25000
        });

        // Authentication middleware
        this.io.use(async (socket, next) => {
            try {
                const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '');
                
                if (!token) {
                    throw new Error('Authentication token required');
                }

                const decoded = jwt.verify(token, config.JWT_SECRET);
                const user = await User.findById(decoded.id).select('-password');
                
                if (!user) {
                    throw new Error('User not found');
                }

                socket.userId = user._id.toString();
                socket.user = user;
                next();
            } catch (error) {
                logger.error('Socket authentication failed:', error.message);
                next(new Error('Authentication failed'));
            }
        });

        // Connection handler
        this.io.on('connection', (socket) => {
            this.handleConnection(socket);
        });

        this.isInitialized = true;
        logger.info('WebSocket service initialized successfully');
    }

    /**
     * Handle new socket connection
     * @param {Object} socket - Socket instance
     */
    handleConnection(socket) {
        const userId = socket.userId;
        
        logger.info(`User connected: ${userId}, Socket: ${socket.id}`);
        
        // Store user connection
        this.connectedUsers.set(userId, socket.id);
        
        // Send connection confirmation
        socket.emit('connected', {
            success: true,
            message: 'Connected to InterviewX',
            userId: userId,
            timestamp: new Date().toISOString()
        });

        // Handle interview room joining
        socket.on('join_interview', async (data) => {
            await this.handleJoinInterview(socket, data);
        });

        // Handle interview room leaving
        socket.on('leave_interview', async (data) => {
            await this.handleLeaveInterview(socket, data);
        });

        // Handle real-time facial analysis
        socket.on('start_facial_analysis', async (data) => {
            await this.handleStartFacialAnalysis(socket, data);
        });

        // Handle facial analysis frame
        socket.on('facial_analysis_frame', async (data) => {
            await this.handleFacialAnalysisFrame(socket, data);
        });

        // Handle stop facial analysis
        socket.on('stop_facial_analysis', () => {
            this.handleStopFacialAnalysis(socket);
        });

        // Handle real-time audio analysis
        socket.on('start_audio_analysis', async (data) => {
            await this.handleStartAudioAnalysis(socket, data);
        });

        // Handle audio chunk
        socket.on('audio_chunk', async (data) => {
            await this.handleAudioChunk(socket, data);
        });

        // Handle stop audio analysis
        socket.on('stop_audio_analysis', () => {
            this.handleStopAudioAnalysis(socket);
        });

        // Handle evaluation status requests
        socket.on('get_evaluation_status', async (data) => {
            await this.handleGetEvaluationStatus(socket, data);
        });

        // Handle AI service health check
        socket.on('check_ai_services', async () => {
            await this.handleCheckAIServices(socket);
        });

        // Handle disconnect
        socket.on('disconnect', () => {
            this.handleDisconnect(socket);
        });

        // Error handling
        socket.on('error', (error) => {
            logger.error(`Socket error for user ${userId}:`, error);
            socket.emit('error', {
                success: false,
                message: 'Socket error occurred',
                error: error.message
            });
        });
    }

    /**
     * Handle joining interview room
     */
    async handleJoinInterview(socket, data) {
        try {
            const { interviewId } = data;
            const userId = socket.userId;

            if (!interviewId) {
                socket.emit('error', { message: 'Interview ID is required' });
                return;
            }

            // Verify user has access to this interview
            const interview = await Interview.findOne({
                _id: interviewId,
                candidateId: userId
            });

            if (!interview) {
                socket.emit('error', { message: 'Interview not found or access denied' });
                return;
            }

            // Join interview room
            socket.join(`interview_${interviewId}`);
            
            // Track active interview
            if (!this.activeInterviews.has(interviewId)) {
                this.activeInterviews.set(interviewId, new Set());
            }
            this.activeInterviews.get(interviewId).add(socket.id);

            socket.currentInterview = interviewId;

            logger.info(`User ${userId} joined interview room: ${interviewId}`);

            socket.emit('interview_joined', {
                success: true,
                interviewId,
                interview: {
                    id: interview._id,
                    title: interview.title,
                    status: interview.status,
                    progress: interview.progress || 0
                }
            });

            // Notify others in the room (if any)
            socket.to(`interview_${interviewId}`).emit('user_joined_interview', {
                userId,
                timestamp: new Date().toISOString()
            });

        } catch (error) {
            logger.error('Error joining interview:', error);
            socket.emit('error', {
                message: 'Failed to join interview',
                error: error.message
            });
        }
    }

    /**
     * Handle leaving interview room
     */
    async handleLeaveInterview(socket, data) {
        try {
            const { interviewId } = data;
            const userId = socket.userId;

            if (socket.currentInterview) {
                socket.leave(`interview_${socket.currentInterview}`);
                
                // Remove from active interviews
                if (this.activeInterviews.has(socket.currentInterview)) {
                    this.activeInterviews.get(socket.currentInterview).delete(socket.id);
                    if (this.activeInterviews.get(socket.currentInterview).size === 0) {
                        this.activeInterviews.delete(socket.currentInterview);
                    }
                }

                logger.info(`User ${userId} left interview room: ${socket.currentInterview}`);

                socket.to(`interview_${socket.currentInterview}`).emit('user_left_interview', {
                    userId,
                    timestamp: new Date().toISOString()
                });

                socket.currentInterview = null;
            }

            socket.emit('interview_left', { success: true });

        } catch (error) {
            logger.error('Error leaving interview:', error);
            socket.emit('error', {
                message: 'Failed to leave interview',
                error: error.message
            });
        }
    }

    /**
     * Handle start facial analysis
     */
    async handleStartFacialAnalysis(socket, data) {
        try {
            const { evaluationId } = data;
            const userId = socket.userId;

            if (!evaluationId) {
                socket.emit('error', { message: 'Evaluation ID is required' });
                return;
            }

            // Verify evaluation belongs to user
            const evaluation = await Evaluation.findOne({
                _id: evaluationId,
                candidateId: userId
            });

            if (!evaluation) {
                socket.emit('error', { message: 'Evaluation not found or access denied' });
                return;
            }

            // Initialize real-time analysis state
            this.realTimeAnalysis.set(socket.id, {
                type: 'facial',
                evaluationId,
                startTime: Date.now(),
                frameCount: 0,
                lastAnalysis: null
            });

            logger.info(`Started facial analysis for user ${userId}, evaluation ${evaluationId}`);

            socket.emit('facial_analysis_started', {
                success: true,
                evaluationId,
                message: 'Facial analysis started'
            });

        } catch (error) {
            logger.error('Error starting facial analysis:', error);
            socket.emit('error', {
                message: 'Failed to start facial analysis',
                error: error.message
            });
        }
    }

    /**
     * Handle facial analysis frame
     */
    async handleFacialAnalysisFrame(socket, data) {
        try {
            const analysisState = this.realTimeAnalysis.get(socket.id);
            
            if (!analysisState || analysisState.type !== 'facial') {
                socket.emit('error', { message: 'Facial analysis not started' });
                return;
            }

            const { frameData, timestamp } = data;
            
            if (!frameData) {
                return; // Skip empty frames
            }

            analysisState.frameCount++;
            
            // Process every 5th frame to reduce load
            if (analysisState.frameCount % 5 !== 0) {
                return;
            }

            // Convert base64 frame to temporary file for analysis
            const frameBuffer = Buffer.from(frameData.split(',')[1], 'base64');
            const tempFramePath = `/tmp/frame_${socket.id}_${Date.now()}.jpg`;
            
            require('fs').writeFileSync(tempFramePath, frameBuffer);

            // Perform quick facial analysis
            const result = await aiService.analyzeFacialFeatures(tempFramePath, 'image');
            
            // Clean up temp file
            require('fs').unlinkSync(tempFramePath);

            analysisState.lastAnalysis = result;

            // Send real-time feedback
            socket.emit('facial_analysis_feedback', {
                confidence_score: result.confidence_score,
                face_detected: result.face_detected,
                emotions: result.emotions,
                timestamp: new Date().toISOString(),
                frame_number: analysisState.frameCount
            });

            // Warn if confidence is low
            if (result.confidence_score < 60) {
                socket.emit('facial_analysis_warning', {
                    type: 'low_confidence',
                    message: 'Please maintain eye contact and confident posture',
                    score: result.confidence_score
                });
            }

        } catch (error) {
            logger.error('Error processing facial analysis frame:', error);
            // Don't emit error for individual frame failures to avoid spam
        }
    }

    /**
     * Handle stop facial analysis
     */
    handleStopFacialAnalysis(socket) {
        const analysisState = this.realTimeAnalysis.get(socket.id);
        
        if (analysisState && analysisState.type === 'facial') {
            const duration = Date.now() - analysisState.startTime;
            
            logger.info(`Stopped facial analysis for socket ${socket.id}. Duration: ${duration}ms, Frames: ${analysisState.frameCount}`);
            
            socket.emit('facial_analysis_stopped', {
                success: true,
                duration_ms: duration,
                total_frames: analysisState.frameCount,
                last_confidence: analysisState.lastAnalysis?.confidence_score || 0
            });
            
            this.realTimeAnalysis.delete(socket.id);
        }
    }

    /**
     * Handle start audio analysis
     */
    async handleStartAudioAnalysis(socket, data) {
        try {
            const { evaluationId, sampleRate = 44100 } = data;
            const userId = socket.userId;

            if (!evaluationId) {
                socket.emit('error', { message: 'Evaluation ID is required' });
                return;
            }

            // Verify evaluation belongs to user
            const evaluation = await Evaluation.findOne({
                _id: evaluationId,
                candidateId: userId
            });

            if (!evaluation) {
                socket.emit('error', { message: 'Evaluation not found or access denied' });
                return;
            }

            // Initialize audio analysis state
            this.realTimeAnalysis.set(socket.id, {
                type: 'audio',
                evaluationId,
                startTime: Date.now(),
                audioBuffer: [],
                sampleRate,
                lastTranscription: ''
            });

            logger.info(`Started audio analysis for user ${userId}, evaluation ${evaluationId}`);

            socket.emit('audio_analysis_started', {
                success: true,
                evaluationId,
                message: 'Audio analysis started'
            });

        } catch (error) {
            logger.error('Error starting audio analysis:', error);
            socket.emit('error', {
                message: 'Failed to start audio analysis',
                error: error.message
            });
        }
    }

    /**
     * Handle audio chunk
     */
    async handleAudioChunk(socket, data) {
        try {
            const analysisState = this.realTimeAnalysis.get(socket.id);
            
            if (!analysisState || analysisState.type !== 'audio') {
                return;
            }

            const { audioData, isLastChunk = false } = data;
            
            if (audioData) {
                analysisState.audioBuffer.push(audioData);
            }

            // Process audio in chunks for real-time transcription
            if (analysisState.audioBuffer.length > 10 || isLastChunk) {
                // Create temporary audio file
                const audioBuffer = Buffer.concat(analysisState.audioBuffer.map(chunk => 
                    Buffer.from(chunk.split(',')[1], 'base64')
                ));
                
                const tempAudioPath = `/tmp/audio_${socket.id}_${Date.now()}.wav`;
                require('fs').writeFileSync(tempAudioPath, audioBuffer);

                try {
                    // Quick transcription
                    const result = await aiService.analyzeAudio(tempAudioPath);
                    
                    if (result.success && result.transcribed_text) {
                        analysisState.lastTranscription += result.transcribed_text + ' ';
                        
                        socket.emit('audio_transcription', {
                            text: result.transcribed_text,
                            full_transcription: analysisState.lastTranscription.trim(),
                            timestamp: new Date().toISOString()
                        });
                    }
                } catch (error) {
                    logger.error('Error in real-time audio processing:', error);
                } finally {
                    // Clean up temp file
                    require('fs').unlinkSync(tempAudioPath);
                }

                // Clear processed chunks
                analysisState.audioBuffer = [];
            }

        } catch (error) {
            logger.error('Error processing audio chunk:', error);
        }
    }

    /**
     * Handle stop audio analysis
     */
    handleStopAudioAnalysis(socket) {
        const analysisState = this.realTimeAnalysis.get(socket.id);
        
        if (analysisState && analysisState.type === 'audio') {
            const duration = Date.now() - analysisState.startTime;
            
            logger.info(`Stopped audio analysis for socket ${socket.id}. Duration: ${duration}ms`);
            
            socket.emit('audio_analysis_stopped', {
                success: true,
                duration_ms: duration,
                final_transcription: analysisState.lastTranscription.trim()
            });
            
            this.realTimeAnalysis.delete(socket.id);
        }
    }

    /**
     * Handle get evaluation status
     */
    async handleGetEvaluationStatus(socket, data) {
        try {
            const { evaluationId } = data;
            const userId = socket.userId;

            if (!evaluationId) {
                socket.emit('error', { message: 'Evaluation ID is required' });
                return;
            }

            const evaluation = await Evaluation.findOne({
                _id: evaluationId,
                candidateId: userId
            }).select('status overallScore passed completedAt error');

            if (!evaluation) {
                socket.emit('error', { message: 'Evaluation not found or access denied' });
                return;
            }

            socket.emit('evaluation_status', {
                evaluationId,
                status: evaluation.status,
                overallScore: evaluation.overallScore,
                passed: evaluation.passed,
                completedAt: evaluation.completedAt,
                error: evaluation.error,
                timestamp: new Date().toISOString()
            });

        } catch (error) {
            logger.error('Error getting evaluation status:', error);
            socket.emit('error', {
                message: 'Failed to get evaluation status',
                error: error.message
            });
        }
    }

    /**
     * Handle AI services health check
     */
    async handleCheckAIServices(socket) {
        try {
            const healthStatus = await aiService.healthCheck();
            
            socket.emit('ai_services_health', {
                ...healthStatus,
                timestamp: new Date().toISOString()
            });

        } catch (error) {
            logger.error('Error checking AI services health:', error);
            socket.emit('ai_services_health', {
                overall_status: 'error',
                error: error.message,
                timestamp: new Date().toISOString()
            });
        }
    }

    /**
     * Handle socket disconnect
     */
    handleDisconnect(socket) {
        const userId = socket.userId;
        
        logger.info(`User disconnected: ${userId}, Socket: ${socket.id}`);
        
        // Clean up user connection
        this.connectedUsers.delete(userId);
        
        // Clean up interview room
        if (socket.currentInterview) {
            const interviewId = socket.currentInterview;
            if (this.activeInterviews.has(interviewId)) {
                this.activeInterviews.get(interviewId).delete(socket.id);
                if (this.activeInterviews.get(interviewId).size === 0) {
                    this.activeInterviews.delete(interviewId);
                }
            }
            
            // Notify others in the room
            socket.to(`interview_${interviewId}`).emit('user_left_interview', {
                userId,
                timestamp: new Date().toISOString()
            });
        }
        
        // Clean up real-time analysis
        if (this.realTimeAnalysis.has(socket.id)) {
            this.realTimeAnalysis.delete(socket.id);
        }
    }

    /**
     * Broadcast evaluation update to connected clients
     * @param {string} evaluationId - Evaluation ID
     * @param {Object} update - Update data
     */
    broadcastEvaluationUpdate(evaluationId, update) {
        if (!this.io) return;
        
        this.io.emit('evaluation_updated', {
            evaluationId,
            ...update,
            timestamp: new Date().toISOString()
        });
        
        logger.info(`Broadcasted evaluation update: ${evaluationId}`);
    }

    /**
     * Send notification to specific user
     * @param {string} userId - User ID
     * @param {Object} notification - Notification data
     */
    sendUserNotification(userId, notification) {
        if (!this.io) return;
        
        const socketId = this.connectedUsers.get(userId);
        if (socketId) {
            this.io.to(socketId).emit('notification', {
                ...notification,
                timestamp: new Date().toISOString()
            });
            
            logger.info(`Sent notification to user ${userId}: ${notification.type}`);
        }
    }

    /**
     * Get connected users count
     * @returns {number} Number of connected users
     */
    getConnectedUsersCount() {
        return this.connectedUsers.size;
    }

    /**
     * Get active interviews count
     * @returns {number} Number of active interviews
     */
    getActiveInterviewsCount() {
        return this.activeInterviews.size;
    }

    /**
     * Check if user is connected
     * @param {string} userId - User ID to check
     * @returns {boolean} True if user is connected
     */
    isUserConnected(userId) {
        return this.connectedUsers.has(userId);
    }

    /**
     * Get server stats
     * @returns {Object} Server statistics
     */
    getStats() {
        return {
            connected_users: this.getConnectedUsersCount(),
            active_interviews: this.getActiveInterviewsCount(),
            real_time_analysis_sessions: this.realTimeAnalysis.size,
            uptime: process.uptime(),
            timestamp: new Date().toISOString()
        };
    }

    /**
     * Shutdown WebSocket service
     */
    shutdown() {
        if (this.io) {
            logger.info('Shutting down WebSocket service...');
            
            // Notify all connected users
            this.io.emit('server_shutdown', {
                message: 'Server is shutting down',
                timestamp: new Date().toISOString()
            });
            
            // Close all connections
            this.io.close();
            
            // Clear all maps
            this.connectedUsers.clear();
            this.activeInterviews.clear();
            this.realTimeAnalysis.clear();
            
            this.isInitialized = false;
            logger.info('WebSocket service shutdown complete');
        }
    }
}

module.exports = new WebSocketService();