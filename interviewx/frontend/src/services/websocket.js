// frontend/src/services/websocket.js

import { WEBSOCKET_EVENTS, WEBSOCKET_CONFIG, ERROR_MESSAGES, SUCCESS_MESSAGES } from '../utils/constants';
import useInterviewStore from '../store/interviewStore';
import useUserStore from '../store/userStore';
import toast from 'react-hot-toast';

class WebSocketService {
  constructor() {
    this.socket = null;
    this.reconnectAttempts = 0;
    this.heartbeatInterval = null;
    this.reconnectTimeout = null;
    this.isConnecting = false;
    this.isDestroyed = false;
    this.eventListeners = new Map();
    this.messageQueue = [];
    this.lastHeartbeat = null;
    this.connectionStartTime = null;
  }

  // Connection Management
  connect(token) {
    if (this.isDestroyed) {
      console.warn('WebSocket service has been destroyed');
      return Promise.reject(new Error('Service destroyed'));
    }

    if (this.isConnecting || (this.socket && this.socket.readyState === WebSocket.OPEN)) {
      return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
      try {
        this.isConnecting = true;
        this.connectionStartTime = Date.now();
        
        const wsUrl = this.buildWebSocketUrl(token);
        console.log('Connecting to WebSocket:', wsUrl);

        this.socket = new WebSocket(wsUrl);
        this.setupEventListeners(resolve, reject);
        
        // Set connection timeout
        setTimeout(() => {
          if (this.isConnecting) {
            this.isConnecting = false;
            this.updateStoreConnectionState(false, 'Connection timeout');
            reject(new Error('Connection timeout'));
          }
        }, WEBSOCKET_CONFIG.CONNECTION_TIMEOUT);

      } catch (error) {
        console.error('WebSocket connection error:', error);
        this.isConnecting = false;
        this.handleConnectionError(error);
        reject(error);
      }
    });
  }

  buildWebSocketUrl(token) {
    const baseUrl = import.meta.env.VITE_WS_URL || 'ws://localhost:5000';
    const url = new URL(baseUrl);
    
    // Add authentication token as query parameter
    url.searchParams.set('token', token);
    
    // Add client info
    url.searchParams.set('client', 'interviewx-web');
    url.searchParams.set('version', '1.0.0');
    
    return url.toString();
  }

  setupEventListeners(resolveConnection, rejectConnection) {
    if (!this.socket) return;

    this.socket.onopen = (event) => {
      console.log('WebSocket connected successfully');
      this.isConnecting = false;
      this.reconnectAttempts = 0;
      
      // Update store state
      this.updateStoreConnectionState(true, null);
      
      // Start heartbeat mechanism
      this.startHeartbeat();
      
      // Process queued messages
      this.processMessageQueue();
      
      // Emit connection success event
      this.emit('connected', {
        timestamp: Date.now(),
        connectionTime: Date.now() - this.connectionStartTime
      });

      if (resolveConnection) resolveConnection();
    };

    this.socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        this.handleIncomingMessage(data);
      } catch (error) {
        console.error('Error parsing WebSocket message:', error, event.data);
        this.emit('error', { type: 'parse_error', message: 'Failed to parse message', data: event.data });
      }
    };

    this.socket.onclose = (event) => {
      console.log('WebSocket disconnected:', event.code, event.reason);
      this.isConnecting = false;
      this.stopHeartbeat();
      
      // Update store state
      this.updateStoreConnectionState(false, 'Connection lost');

      // Emit disconnection event
      this.emit('disconnected', {
        code: event.code,
        reason: event.reason,
        wasClean: event.wasClean,
        timestamp: Date.now()
      });

      // Attempt reconnection if not intentional closure
      if (!this.isDestroyed && event.code !== 1000 && event.code !== 1001) {
        this.attemptReconnect();
      }

      if (rejectConnection && this.isConnecting) {
        rejectConnection(new Error(`Connection failed: ${event.reason || event.code}`));
      }
    };

    this.socket.onerror = (error) => {
      console.error('WebSocket error:', error);
      this.handleConnectionError(error);
      
      if (rejectConnection && this.isConnecting) {
        rejectConnection(error);
      }
    };
  }

  handleIncomingMessage(data) {
    const { type, payload, timestamp, id } = data;
    
    // Update last message in store
    this.updateStoreLastMessage(data);
    
    // Handle heartbeat responses
    if (type === WEBSOCKET_EVENTS.HEARTBEAT) {
      this.lastHeartbeat = Date.now();
      return;
    }

    // Route message to appropriate handler
    switch (type) {
      case WEBSOCKET_EVENTS.FACIAL_ANALYSIS_RESULT:
        this.handleFacialAnalysisResult(payload);
        break;
        
      case WEBSOCKET_EVENTS.FACIAL_ANALYSIS_PROGRESS:
        this.handleFacialAnalysisProgress(payload);
        break;
        
      case WEBSOCKET_EVENTS.AUDIO_ANALYSIS_RESULT:
        this.handleAudioAnalysisResult(payload);
        break;
        
      case WEBSOCKET_EVENTS.AUDIO_ANALYSIS_PROGRESS:
        this.handleAudioAnalysisProgress(payload);
        break;
        
      case WEBSOCKET_EVENTS.TEXT_ANALYSIS_RESULT:
        this.handleTextAnalysisResult(payload);
        break;
        
      case WEBSOCKET_EVENTS.EVALUATION_COMPLETE:
        this.handleEvaluationComplete(payload);
        break;
        
      case WEBSOCKET_EVENTS.ERROR:
        this.handleServerError(payload);
        break;
        
      case WEBSOCKET_EVENTS.NOTIFICATION:
        this.handleNotification(payload);
        break;
        
      case WEBSOCKET_EVENTS.STATUS_UPDATE:
        this.handleStatusUpdate(payload);
        break;
        
      default:
        console.log('Unknown WebSocket message type:', type, payload);
    }

    // Emit to custom listeners
    this.emit(type, payload, { timestamp, id });
  }

  // Analysis Result Handlers
  handleFacialAnalysisResult(payload) {
    const { updateAnalysisState } = useInterviewStore.getState();
    
    updateAnalysisState('facial', {
      confidence: payload.confidence || 0,
      result: payload,
      isAnalyzing: false,
      error: null,
      progress: 100
    });

    const isPassingScore = payload.confidence >= 80;
    const message = `Face confidence: ${payload.confidence}%`;
    
    if (isPassingScore) {
      toast.success(message, { id: 'facial-analysis' });
    } else {
      toast.error(`Low ${message.toLowerCase()}`, { id: 'facial-analysis' });
    }
  }

  handleFacialAnalysisProgress(payload) {
    const { setAnalysisProgress } = useInterviewStore.getState();
    setAnalysisProgress('facial', payload.progress || 0);
  }

  handleAudioAnalysisResult(payload) {
    const { updateAnalysisState } = useInterviewStore.getState();
    
    updateAnalysisState('audio', {
      transcription: payload.transcription || '',
      quality: payload.quality || 0,
      result: payload,
      isAnalyzing: false,
      error: null,
      progress: 100
    });

    const isPassingScore = payload.quality >= 80;
    const message = `Audio quality: ${payload.quality}%`;
    
    if (isPassingScore) {
      toast.success(message, { id: 'audio-analysis' });
    } else {
      toast.error(`Low ${message.toLowerCase()}`, { id: 'audio-analysis' });
    }
  }

  handleAudioAnalysisProgress(payload) {
    const { setAnalysisProgress } = useInterviewStore.getState();
    setAnalysisProgress('audio', payload.progress || 0);
  }

  handleTextAnalysisResult(payload) {
    const { updateAnalysisState } = useInterviewStore.getState();
    
    updateAnalysisState('text', {
      score: payload.score || 0,
      feedback: payload.feedback || '',
      result: payload,
      isAnalyzing: false,
      error: null
    });

    // Don't show toast for individual text analysis to avoid spam
    console.log('Text analysis completed:', payload);
  }

  handleEvaluationComplete(payload) {
    const { updateAnalysisState, updateInterviewData } = useInterviewStore.getState();
    
    // Update overall analysis state
    updateAnalysisState('overall', {
      score: payload.overallScore || 0,
      passed: payload.passed || false,
      feedback: payload.feedback || '',
      breakdown: payload.breakdown || {},
      isCalculating: false
    });

    // Update interview status
    updateInterviewData({
      status: payload.passed ? 'completed' : 'failed'
    });

    // Show completion notification
    if (payload.passed) {
      toast.success(SUCCESS_MESSAGES.INTERVIEW_COMPLETED, {
        duration: 6000,
        id: 'interview-complete'
      });
    } else {
      toast.error('Interview requirements not met. Please review your performance.', {
        duration: 6000,
        id: 'interview-failed'
      });
    }
  }

  handleServerError(payload) {
    const { setError } = useInterviewStore.getState();
    const errorMessage = payload.message || 'Server error occurred';
    
    setError('analysis', errorMessage);
    toast.error(errorMessage, { id: 'server-error' });
    
    console.error('Server error:', payload);
  }

  handleNotification(payload) {
    const { type = 'info', message, title, duration = 4000 } = payload;
    
    switch (type) {
      case 'success':
        toast.success(message, { duration, id: 'notification' });
        break;
      case 'error':
        toast.error(message, { duration, id: 'notification' });
        break;
      case 'warning':
        toast(message, { duration, id: 'notification', icon: '⚠️' });
        break;
      default:
        toast(message, { duration, id: 'notification' });
    }
  }

  handleStatusUpdate(payload) {
    const { updateInterviewData } = useInterviewStore.getState();
    
    if (payload.interviewStatus) {
      updateInterviewData({ status: payload.interviewStatus });
    }
  }

  // Connection State Management
  updateStoreConnectionState(connected, error = null) {
    const { updateWebSocketState } = useInterviewStore.getState();
    updateWebSocketState({
      connected,
      connecting: false,
      error,
      reconnectAttempts: this.reconnectAttempts,
      lastHeartbeat: this.lastHeartbeat
    });
  }

  updateStoreLastMessage(message) {
    const { updateWebSocketState } = useInterviewStore.getState();
    updateWebSocketState({ lastMessage: message });
  }

  handleConnectionError(error = null) {
    this.isConnecting = false;
    console.error('WebSocket connection error:', error);
    
    this.updateStoreConnectionState(false, error?.message || 'Connection failed');
    this.emit('error', { type: 'connection_error', error });
  }

  // Reconnection Logic
  attemptReconnect() {
    if (this.isDestroyed || this.reconnectAttempts >= WEBSOCKET_CONFIG.MAX_RECONNECT_ATTEMPTS) {
      if (this.reconnectAttempts >= WEBSOCKET_CONFIG.MAX_RECONNECT_ATTEMPTS) {
        console.log('Max reconnection attempts reached');
        toast.error(ERROR_MESSAGES.WEBSOCKET_ERROR, { id: 'reconnect-failed' });
      }
      return;
    }

    this.reconnectAttempts++;
    
    const delay = WEBSOCKET_CONFIG.RETRY_DELAYS[
      Math.min(this.reconnectAttempts - 1, WEBSOCKET_CONFIG.RETRY_DELAYS.length - 1)
    ] || WEBSOCKET_CONFIG.RECONNECT_INTERVAL;

    console.log(`Reconnection attempt ${this.reconnectAttempts} in ${delay}ms`);
    
    // Update store with current attempt count
    this.updateStoreConnectionState(false, `Reconnecting... (${this.reconnectAttempts}/${WEBSOCKET_CONFIG.MAX_RECONNECT_ATTEMPTS})`);

    this.reconnectTimeout = setTimeout(() => {
      const { user } = useUserStore.getState();
      if (user?.token && !this.isDestroyed) {
        this.connect(user.token).catch(error => {
          console.error('Reconnection failed:', error);
          this.attemptReconnect();
        });
      }
    }, delay);
  }

  // Heartbeat Mechanism
  startHeartbeat() {
    this.stopHeartbeat(); // Clear any existing interval
    
    this.heartbeatInterval = setInterval(() => {
      if (this.socket && this.socket.readyState === WebSocket.OPEN) {
        this.send(WEBSOCKET_EVENTS.HEARTBEAT, { 
          timestamp: Date.now(),
          clientTime: new Date().toISOString()
        });
        
        // Check if we haven't received a heartbeat response in too long
        if (this.lastHeartbeat && (Date.now() - this.lastHeartbeat) > WEBSOCKET_CONFIG.PING_TIMEOUT) {
          console.warn('Heartbeat timeout, connection may be stale');
          this.handleConnectionError(new Error('Heartbeat timeout'));
        }
      }
    }, WEBSOCKET_CONFIG.HEARTBEAT_INTERVAL);
  }

  stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  // Message Sending
  send(type, payload = {}, options = {}) {
    const message = {
      type,
      payload,
      timestamp: Date.now(),
      id: options.id || this.generateMessageId(),
      ...options
    };

    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      try {
        this.socket.send(JSON.stringify(message));
        return true;
      } catch (error) {
        console.error('Error sending WebSocket message:', error);
        this.queueMessage(message);
        return false;
      }
    } else {
      console.warn('WebSocket not connected. Queueing message:', type);
      this.queueMessage(message);
      return false;
    }
  }

  queueMessage(message) {
    // Only queue important messages, not heartbeats
    if (message.type !== WEBSOCKET_EVENTS.HEARTBEAT) {
      this.messageQueue.push(message);
      
      // Limit queue size to prevent memory issues
      if (this.messageQueue.length > 100) {
        this.messageQueue = this.messageQueue.slice(-50);
      }
    }
  }

  processMessageQueue() {
    while (this.messageQueue.length > 0 && this.socket?.readyState === WebSocket.OPEN) {
      const message = this.messageQueue.shift();
      try {
        this.socket.send(JSON.stringify(message));
      } catch (error) {
        console.error('Error sending queued message:', error);
        // Re-queue the message
        this.messageQueue.unshift(message);
        break;
      }
    }
  }

  generateMessageId() {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Interview Event Methods
  startInterview(interviewId) {
    return this.send(WEBSOCKET_EVENTS.INTERVIEW_START, {
      interviewId,
      timestamp: Date.now()
    });
  }

  endInterview(interviewId) {
    return this.send(WEBSOCKET_EVENTS.INTERVIEW_END, {
      interviewId,
      timestamp: Date.now()
    });
  }

  pauseInterview(interviewId) {
    return this.send(WEBSOCKET_EVENTS.INTERVIEW_PAUSE, {
      interviewId,
      timestamp: Date.now()
    });
  }

  resumeInterview(interviewId) {
    return this.send(WEBSOCKET_EVENTS.INTERVIEW_RESUME, {
      interviewId,
      timestamp: Date.now()
    });
  }

  submitAnswer(questionId, answer, answerType) {
    return this.send(WEBSOCKET_EVENTS.QUESTION_ANSWERED, {
      questionId,
      answer,
      answerType,
      timestamp: Date.now()
    });
  }

  skipQuestion(questionId, reason = null) {
    return this.send(WEBSOCKET_EVENTS.QUESTION_SKIP, {
      questionId,
      reason,
      timestamp: Date.now()
    });
  }

  // Analysis Event Methods
  startFacialAnalysis(videoData, options = {}) {
    return this.send(WEBSOCKET_EVENTS.FACIAL_ANALYSIS_START, {
      videoData,
      options,
      timestamp: Date.now()
    });
  }

  startAudioAnalysis(audioData, options = {}) {
    return this.send(WEBSOCKET_EVENTS.AUDIO_ANALYSIS_START, {
      audioData,
      options,
      timestamp: Date.now()
    });
  }

  startTextAnalysis(text, questionId, options = {}) {
    return this.send(WEBSOCKET_EVENTS.TEXT_ANALYSIS_START, {
      text,
      questionId,
      options,
      timestamp: Date.now()
    });
  }

  // Event Listener Management
  on(event, callback) {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }
    this.eventListeners.get(event).add(callback);
    
    return () => this.off(event, callback);
  }

  off(event, callback) {
    if (this.eventListeners.has(event)) {
      this.eventListeners.get(event).delete(callback);
    }
  }

  emit(event, data, metadata = {}) {
    if (this.eventListeners.has(event)) {
      this.eventListeners.get(event).forEach(callback => {
        try {
          callback(data, metadata);
        } catch (error) {
          console.error(`Error in WebSocket event listener for '${event}':`, error);
        }
      });
    }
  }

  // Utility Methods
  isConnected() {
    return this.socket && this.socket.readyState === WebSocket.OPEN;
  }

  getConnectionState() {
    if (!this.socket) return 'disconnected';
    
    switch (this.socket.readyState) {
      case WebSocket.CONNECTING: return 'connecting';
      case WebSocket.OPEN: return 'connected';
      case WebSocket.CLOSING: return 'disconnecting';
      case WebSocket.CLOSED: return 'disconnected';
      default: return 'unknown';
    }
  }

  getConnectionStats() {
    return {
      state: this.getConnectionState(),
      reconnectAttempts: this.reconnectAttempts,
      lastHeartbeat: this.lastHeartbeat,
      queuedMessages: this.messageQueue.length,
      connectionTime: this.connectionStartTime ? Date.now() - this.connectionStartTime : 0
    };
  }

  // Cleanup
  disconnect(reason = 'Client disconnecting') {
    this.isDestroyed = false; // Allow reconnection unless explicitly destroyed
    
    this.stopHeartbeat();
    
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    if (this.socket) {
      this.socket.close(1000, reason);
      this.socket = null;
    }

    this.isConnecting = false;
    this.reconnectAttempts = 0;
    this.messageQueue = [];

    // Update store
    this.updateStoreConnectionState(false, null);
  }

  destroy() {
    this.isDestroyed = true;
    this.disconnect('Service destroyed');
    this.eventListeners.clear();
  }
}

// Create and export singleton instance
const websocketService = new WebSocketService();

// Cleanup on page unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    websocketService.disconnect('Page unloading');
  });
}

export default websocketService;