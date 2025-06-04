// frontend/src/hooks/useWebSocket.js

import { useEffect, useCallback, useRef, useState } from 'react';
import useUserStore from '../store/userStore';
import useInterviewStore from '../store/interviewStore';
import websocketService from '../services/websocket';
import { WEBSOCKET_EVENTS } from '../utils/constants';

export const useWebSocket = (options = {}) => {
  const {
    autoConnect = true,
    reconnectOnAuthChange = true,
    enableHeartbeat = true
  } = options;

  const { user } = useUserStore();
  const { websocketState } = useInterviewStore();
  const [connectionHistory, setConnectionHistory] = useState([]);
  const [isInitialized, setIsInitialized] = useState(false);
  const cleanupFunctionsRef = useRef([]);
  const lastConnectionAttemptRef = useRef(null);

  // Initialize connection when user is authenticated
  useEffect(() => {
    const initializeConnection = async () => {
      if (!isInitialized && user?.token && autoConnect) {
        try {
          setIsInitialized(true);
          lastConnectionAttemptRef.current = Date.now();
          
          await websocketService.connect(user.token);
          
          setConnectionHistory(prev => [...prev, {
            timestamp: Date.now(),
            action: 'connected',
            success: true
          }]);
          
        } catch (error) {
          console.error('Initial WebSocket connection failed:', error);
          setConnectionHistory(prev => [...prev, {
            timestamp: Date.now(),
            action: 'connect_failed',
            success: false,
            error: error.message
          }]);
        }
      }
    };

    initializeConnection();
  }, [user?.token, autoConnect, isInitialized]);

  // Handle authentication changes
  useEffect(() => {
    if (reconnectOnAuthChange && isInitialized) {
      if (!user) {
        // User logged out - disconnect
        websocketService.disconnect('User logged out');
        setConnectionHistory(prev => [...prev, {
          timestamp: Date.now(),
          action: 'disconnected',
          reason: 'User logged out'
        }]);
      } else if (user.token && !websocketService.isConnected()) {
        // User logged in or token refreshed - reconnect
        const currentTime = Date.now();
        const timeSinceLastAttempt = lastConnectionAttemptRef.current 
          ? currentTime - lastConnectionAttemptRef.current 
          : Infinity;

        // Avoid rapid reconnection attempts
        if (timeSinceLastAttempt > 5000) {
          lastConnectionAttemptRef.current = currentTime;
          websocketService.connect(user.token).catch(error => {
            console.error('Reconnection on auth change failed:', error);
          });
        }
      }
    }
  }, [user, reconnectOnAuthChange, isInitialized]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Clean up any registered event listeners
      cleanupFunctionsRef.current.forEach(cleanup => {
        try {
          cleanup();
        } catch (error) {
          console.error('Error during WebSocket cleanup:', error);
        }
      });
      cleanupFunctionsRef.current = [];
    };
  }, []);

  // Connection management methods
  const connect = useCallback(async (token = null) => {
    const authToken = token || user?.token;
    if (!authToken) {
      throw new Error('No authentication token available');
    }

    lastConnectionAttemptRef.current = Date.now();
    
    try {
      await websocketService.connect(authToken);
      setConnectionHistory(prev => [...prev, {
        timestamp: Date.now(),
        action: 'manual_connect',
        success: true
      }]);
      return true;
    } catch (error) {
      setConnectionHistory(prev => [...prev, {
        timestamp: Date.now(),
        action: 'manual_connect_failed',
        success: false,
        error: error.message
      }]);
      throw error;
    }
  }, [user?.token]);

  const disconnect = useCallback((reason = 'Manual disconnect') => {
    websocketService.disconnect(reason);
    setConnectionHistory(prev => [...prev, {
      timestamp: Date.now(),
      action: 'manual_disconnect',
      reason
    }]);
  }, []);

  const reconnect = useCallback(async () => {
    disconnect('Manual reconnect');
    
    // Wait a brief moment before reconnecting
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return connect();
  }, [connect, disconnect]);

  // Message sending methods
  const sendMessage = useCallback((type, payload, options = {}) => {
    if (!websocketService.isConnected()) {
      console.warn('Cannot send message: WebSocket not connected');
      return false;
    }

    return websocketService.send(type, payload, options);
  }, []);

  // Interview-specific methods
  const startInterview = useCallback((interviewId) => {
    return websocketService.startInterview(interviewId);
  }, []);

  const endInterview = useCallback((interviewId) => {
    return websocketService.endInterview(interviewId);
  }, []);

  const pauseInterview = useCallback((interviewId) => {
    return websocketService.pauseInterview(interviewId);
  }, []);

  const resumeInterview = useCallback((interviewId) => {
    return websocketService.resumeInterview(interviewId);
  }, []);

  const submitAnswer = useCallback((questionId, answer, answerType) => {
    return websocketService.submitAnswer(questionId, answer, answerType);
  }, []);

  const skipQuestion = useCallback((questionId, reason = null) => {
    return websocketService.skipQuestion(questionId, reason);
  }, []);

  // Analysis methods
  const startFacialAnalysis = useCallback((videoData, options = {}) => {
    return websocketService.startFacialAnalysis(videoData, options);
  }, []);

  const startAudioAnalysis = useCallback((audioData, options = {}) => {
    return websocketService.startAudioAnalysis(audioData, options);
  }, []);

  const startTextAnalysis = useCallback((text, questionId, options = {}) => {
    return websocketService.startTextAnalysis(text, questionId, options);
  }, []);

  // Event listener management
  const addEventListener = useCallback((event, callback, options = {}) => {
    const { once = false } = options;
    
    let actualCallback = callback;
    
    if (once) {
      actualCallback = (...args) => {
        callback(...args);
        websocketService.off(event, actualCallback);
      };
    }
    
    const cleanup = websocketService.on(event, actualCallback);
    cleanupFunctionsRef.current.push(cleanup);
    
    return cleanup;
  }, []);

  const removeEventListener = useCallback((event, callback) => {
    websocketService.off(event, callback);
  }, []);

  // Specialized event hooks
  const onConnectionChange = useCallback((callback) => {
    const cleanup1 = addEventListener('connected', () => callback(true));
    const cleanup2 = addEventListener('disconnected', () => callback(false));
    
    return () => {
      cleanup1();
      cleanup2();
    };
  }, [addEventListener]);

  const onAnalysisResult = useCallback((analysisType, callback) => {
    const eventMap = {
      facial: WEBSOCKET_EVENTS.FACIAL_ANALYSIS_RESULT,
      audio: WEBSOCKET_EVENTS.AUDIO_ANALYSIS_RESULT,
      text: WEBSOCKET_EVENTS.TEXT_ANALYSIS_RESULT,
      overall: WEBSOCKET_EVENTS.EVALUATION_COMPLETE
    };
    
    const event = eventMap[analysisType];
    if (!event) {
      console.warn(`Unknown analysis type: ${analysisType}`);
      return () => {};
    }
    
    return addEventListener(event, callback);
  }, [addEventListener]);

  const onAnalysisProgress = useCallback((analysisType, callback) => {
    const eventMap = {
      facial: WEBSOCKET_EVENTS.FACIAL_ANALYSIS_PROGRESS,
      audio: WEBSOCKET_EVENTS.AUDIO_ANALYSIS_PROGRESS,
      text: WEBSOCKET_EVENTS.TEXT_ANALYSIS_PROGRESS
    };
    
    const event = eventMap[analysisType];
    if (!event) {
      console.warn(`Unknown analysis type: ${analysisType}`);
      return () => {};
    }
    
    return addEventListener(event, callback);
  }, [addEventListener]);

  const onError = useCallback((callback) => {
    return addEventListener('error', callback);
  }, [addEventListener]);

  const onNotification = useCallback((callback) => {
    return addEventListener(WEBSOCKET_EVENTS.NOTIFICATION, callback);
  }, [addEventListener]);

  // Utility methods
  const getConnectionStats = useCallback(() => {
    return {
      ...websocketService.getConnectionStats(),
      connectionHistory: connectionHistory.slice(-10), // Last 10 events
      isInitialized
    };
  }, [connectionHistory, isInitialized]);

  const isConnected = websocketService.isConnected();
  const connectionState = websocketService.getConnectionState();

  // Advanced connection monitoring
  const [connectionQuality, setConnectionQuality] = useState('unknown');
  
  useEffect(() => {
    let qualityCheckInterval;
    
    if (isConnected && enableHeartbeat) {
      qualityCheckInterval = setInterval(() => {
        const stats = websocketService.getConnectionStats();
        const timeSinceLastHeartbeat = stats.lastHeartbeat 
          ? Date.now() - stats.lastHeartbeat 
          : Infinity;
        
        if (timeSinceLastHeartbeat < 35000) { // Within 35 seconds
          setConnectionQuality('good');
        } else if (timeSinceLastHeartbeat < 60000) { // Within 1 minute
          setConnectionQuality('fair');
        } else {
          setConnectionQuality('poor');
        }
      }, 10000); // Check every 10 seconds
    } else {
      setConnectionQuality(isConnected ? 'good' : 'disconnected');
    }
    
    return () => {
      if (qualityCheckInterval) {
        clearInterval(qualityCheckInterval);
      }
    };
  }, [isConnected, enableHeartbeat]);

  return {
    // Connection state
    isConnected,
    isConnecting: websocketState.connecting,
    connectionState,
    connectionQuality,
    error: websocketState.error,
    reconnectAttempts: websocketState.reconnectAttempts,
    lastMessage: websocketState.lastMessage,
    lastHeartbeat: websocketState.lastHeartbeat,

    // Connection management
    connect,
    disconnect,
    reconnect,

    // Basic messaging
    sendMessage,

    // Interview methods
    startInterview,
    endInterview,
    pauseInterview,
    resumeInterview,
    submitAnswer,
    skipQuestion,

    // Analysis methods
    startFacialAnalysis,
    startAudioAnalysis,
    startTextAnalysis,

    // Event management
    addEventListener,
    removeEventListener,
    onConnectionChange,
    onAnalysisResult,
    onAnalysisProgress,
    onError,
    onNotification,

    // Utilities
    getConnectionStats,
    service: websocketService // For advanced usage
  };
};

// Specialized hooks for specific use cases
export const useWebSocketConnection = () => {
  const { isConnected, isConnecting, error, connect, disconnect, reconnect } = useWebSocket();
  
  return {
    isConnected,
    isConnecting,
    error,
    connect,
    disconnect,
    reconnect
  };
};

export const useInterviewWebSocket = () => {
  const {
    startInterview,
    endInterview,
    pauseInterview,
    resumeInterview,
    submitAnswer,
    skipQuestion,
    isConnected
  } = useWebSocket();
  
  return {
    startInterview,
    endInterview,
    pauseInterview,
    resumeInterview,
    submitAnswer,
    skipQuestion,
    isConnected
  };
};

export const useAnalysisWebSocket = () => {
  const {
    startFacialAnalysis,
    startAudioAnalysis,
    startTextAnalysis,
    onAnalysisResult,
    onAnalysisProgress,
    isConnected
  } = useWebSocket();
  
  return {
    startFacialAnalysis,
    startAudioAnalysis,
    startTextAnalysis,
    onAnalysisResult,
    onAnalysisProgress,
    isConnected
  };
};

export default useWebSocket;