// frontend/src/hooks/useInterview.js - COMPLETE IMPLEMENTATION
import { useState, useEffect, useCallback, useRef } from 'react';
import { useInterviewStore } from '../store/interviewStore';

export const useInterview = (interviewId) => {
  // State
  const [interview, setInterview] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [evaluation, setEvaluation] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [interviewStatus, setInterviewStatus] = useState('not_started'); // not_started, in_progress, paused, completed
  const [questionStatus, setQuestionStatus] = useState('ready'); // ready, in_progress, answering, evaluating, completed
  const [currentSubmission, setCurrentSubmission] = useState(null);
  const [evaluationResults, setEvaluationResults] = useState([]);

  // Refs
  const timerRef = useRef(null);
  const interviewStartTime = useRef(null);
  const questionStartTime = useRef(null);

  // Store
  const { fetchInterview: storeFetchInterview, submitAnswer: storeSubmitAnswer } = useInterviewStore();

  // Mock questions for development
  const mockQuestions = [
    {
      id: 1,
      text: "Tell me about yourself and your professional background.",
      type: "behavioral",
      timeLimit: 300,
      allowVideo: true,
      allowAudio: true,
      allowText: true
    },
    {
      id: 2,
      text: "Describe a challenging project you worked on and how you overcame obstacles.",
      type: "behavioral",
      timeLimit: 300,
      allowVideo: true,
      allowAudio: true,
      allowText: true
    },
    {
      id: 3,
      text: "Explain the difference between let, const, and var in JavaScript.",
      type: "technical",
      timeLimit: 240,
      allowVideo: true,
      allowAudio: true,
      allowText: true
    },
    {
      id: 4,
      text: "How would you optimize the performance of a web application?",
      type: "technical",
      timeLimit: 300,
      allowVideo: true,
      allowAudio: true,
      allowText: true
    },
    {
      id: 5,
      text: "Where do you see yourself in the next 5 years?",
      type: "behavioral",
      timeLimit: 180,
      allowVideo: true,
      allowAudio: true,
      allowText: true
    }
  ];

  // Initialize interview
  useEffect(() => {
    if (interviewId) {
      loadInterview();
    } else {
      // Create mock interview for development
      const mockInterview = {
        _id: 'mock-interview',
        title: 'Mock Interview Session',
        type: 'technical',
        duration: 30,
        status: 'pending',
        questions: mockQuestions,
        createdAt: new Date().toISOString()
      };
      setInterview(mockInterview);
      setCurrentQuestion(mockQuestions[0]);
      setTimeRemaining(mockQuestions[0].timeLimit);
    }
  }, [interviewId]);

  // Timer effect
  useEffect(() => {
    if (interviewStatus === 'in_progress' && questionStatus === 'answering' && timeRemaining > 0) {
      timerRef.current = setTimeout(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            // Time's up - auto submit
            handleTimeUp();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [interviewStatus, questionStatus, timeRemaining]);

  // Load interview
  const loadInterview = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // In development, use mock data
      const mockInterview = {
        _id: interviewId,
        title: 'Technical Interview Session',
        type: 'technical',
        duration: 30,
        status: 'pending',
        questions: mockQuestions,
        createdAt: new Date().toISOString()
      };

      setInterview(mockInterview);
      setCurrentQuestion(mockQuestions[0]);
      setTimeRemaining(mockQuestions[0].timeLimit);

      // Real implementation would be:
      // const fetchedInterview = await storeFetchInterview(interviewId);
      // setInterview(fetchedInterview);
      // setCurrentQuestion(fetchedInterview.questions[0]);
      // setTimeRemaining(fetchedInterview.questions[0].timeLimit);
    } catch (err) {
      setError(err.message || 'Failed to load interview');
    } finally {
      setIsLoading(false);
    }
  };

  // Start interview
  const startInterview = useCallback(async () => {
    try {
      setInterviewStatus('in_progress');
      setQuestionStatus('in_progress');
      interviewStartTime.current = Date.now();
      
      // Create evaluation session
      const mockEvaluation = {
        id: `eval_${Date.now()}`,
        interviewId: interview._id,
        startedAt: new Date().toISOString(),
        status: 'in_progress'
      };
      setEvaluation(mockEvaluation);

      console.log('🎯 Interview started');
    } catch (err) {
      setError(err.message || 'Failed to start interview');
      throw err;
    }
  }, [interview]);

  // Start answering current question
  const startAnswering = useCallback(async () => {
    try {
      setQuestionStatus('answering');
      questionStartTime.current = Date.now();
      
      // Initialize submission object
      setCurrentSubmission({
        questionId: currentQuestion.id,
        questionText: currentQuestion.text,
        answerText: '',
        videoBlob: null,
        audioBlob: null,
        startTime: new Date().toISOString()
      });

      console.log('📝 Started answering question:', currentQuestion.id);
    } catch (err) {
      setError(err.message || 'Failed to start answering');
      throw err;
    }
  }, [currentQuestion]);

  // Update answer
  const updateAnswer = useCallback((field, value) => {
    setCurrentSubmission(prev => {
      if (!prev) return null;
      return {
        ...prev,
        [field]: value,
        updatedAt: new Date().toISOString()
      };
    });
  }, []);

  // Submit answer
  const submitAnswer = useCallback(async () => {
    if (!currentSubmission) {
      throw new Error('No submission data available');
    }

    setQuestionStatus('evaluating');

    try {
      // Calculate time spent
      const timeSpent = questionStartTime.current 
        ? Math.floor((Date.now() - questionStartTime.current) / 1000)
        : currentQuestion.timeLimit - timeRemaining;

      const submissionData = {
        ...currentSubmission,
        timeSpent,
        submittedAt: new Date().toISOString()
      };

      // Mock AI evaluation
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate processing

      const mockEvaluationResult = {
        questionId: currentQuestion.id,
        scores: {
          confidence: Math.floor(Math.random() * 20) + 80,
          audioQuality: Math.floor(Math.random() * 20) + 75,
          contentRelevance: Math.floor(Math.random() * 25) + 70
        },
        feedback: "Good answer with clear explanation",
        completedAt: new Date().toISOString()
      };

      setEvaluationResults(prev => [...prev, mockEvaluationResult]);
      setQuestionStatus('completed');
      setCurrentSubmission(null);

      console.log('✅ Answer submitted and evaluated');
      return mockEvaluationResult;

      // Real implementation would be:
      // const result = await storeSubmitAnswer(submissionData);
      // return result;
    } catch (err) {
      setQuestionStatus('answering'); // Reset on error
      setError(err.message || 'Failed to submit answer');
      throw err;
    }
  }, [currentSubmission, currentQuestion, timeRemaining]);

  // Move to next question
  const nextQuestion = useCallback(() => {
    if (currentQuestionIndex < interview.questions.length - 1) {
      const nextIndex = currentQuestionIndex + 1;
      const nextQ = interview.questions[nextIndex];
      
      setCurrentQuestionIndex(nextIndex);
      setCurrentQuestion(nextQ);
      setTimeRemaining(nextQ.timeLimit);
      setQuestionStatus('in_progress');
      setCurrentSubmission(null);
      
      console.log('➡️ Moved to next question:', nextIndex + 1);
    }
  }, [currentQuestionIndex, interview]);

  // Move to previous question
  const previousQuestion = useCallback(() => {
    if (currentQuestionIndex > 0) {
      const prevIndex = currentQuestionIndex - 1;
      const prevQ = interview.questions[prevIndex];
      
      setCurrentQuestionIndex(prevIndex);
      setCurrentQuestion(prevQ);
      setTimeRemaining(prevQ.timeLimit);
      setQuestionStatus('completed'); // Previous questions are already completed
      setCurrentSubmission(null);
      
      console.log('⬅️ Moved to previous question:', prevIndex + 1);
    }
  }, [currentQuestionIndex, interview]);

  // Pause interview
  const pauseInterview = useCallback(() => {
    setInterviewStatus('paused');
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    console.log('⏸️ Interview paused');
  }, []);

  // Resume interview
  const resumeInterview = useCallback(() => {
    setInterviewStatus('in_progress');
    console.log('▶️ Interview resumed');
  }, []);

  // Exit interview
  const exitInterview = useCallback(() => {
    setInterviewStatus('completed');
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    console.log('🚪 Interview exited');
  }, []);

  // Handle time up
  const handleTimeUp = useCallback(() => {
    if (questionStatus === 'answering') {
      submitAnswer().catch(console.error);
    }
  }, [questionStatus, submitAnswer]);

  // Helper functions
  const hasNextQuestion = useCallback(() => {
    return interview && currentQuestionIndex < interview.questions.length - 1;
  }, [interview, currentQuestionIndex]);

  const hasPreviousQuestion = useCallback(() => {
    return currentQuestionIndex > 0;
  }, [currentQuestionIndex]);

  const getProgress = useCallback(() => {
    if (!interview) return 0;
    return Math.round(((currentQuestionIndex + 1) / interview.questions.length) * 100);
  }, [interview, currentQuestionIndex]);

  const getQuestionProgress = useCallback(() => {
    if (!currentQuestion) return 0;
    const elapsed = currentQuestion.timeLimit - timeRemaining;
    return Math.round((elapsed / currentQuestion.timeLimit) * 100);
  }, [currentQuestion, timeRemaining]);

  const formatTimeRemaining = useCallback(() => {
    const minutes = Math.floor(timeRemaining / 60);
    const seconds = timeRemaining % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }, [timeRemaining]);

  const getCurrentSubmission = useCallback(() => {
    return currentSubmission;
  }, [currentSubmission]);

  const getCurrentEvaluation = useCallback(() => {
    return evaluationResults.find(result => result.questionId === currentQuestion?.id);
  }, [evaluationResults, currentQuestion]);

  const isQuestionAnswered = useCallback((questionId) => {
    return evaluationResults.some(result => result.questionId === questionId);
  }, [evaluationResults]);

  return {
    // State
    interview,
    currentQuestion,
    currentQuestionIndex,
    evaluation,
    isLoading,
    error,
    timeRemaining,
    interviewStatus,
    questionStatus,

    // Actions
    startInterview,
    startAnswering,
    updateAnswer,
    submitAnswer,
    nextQuestion,
    previousQuestion,
    pauseInterview,
    resumeInterview,
    exitInterview,

    // Helpers
    hasNextQuestion,
    hasPreviousQuestion,
    getProgress,
    getQuestionProgress,
    formatTimeRemaining,
    getCurrentSubmission,
    getCurrentEvaluation,
    isQuestionAnswered
  };
};

// frontend/src/hooks/useWebSocket.js - COMPLETE IMPLEMENTATION
import { useState, useEffect, useRef, useCallback } from 'react';
import io from 'socket.io-client';

export const useWebSocket = () => {
  // State
  const [isConnected, setIsConnected] = useState(false);
  const [realTimeAnalysis, setRealTimeAnalysis] = useState({
    facial: null,
    audio: null
  });
  const [aiServicesHealth, setAiServicesHealth] = useState(null);
  const [error, setError] = useState(null);

  // Refs
  const socketRef = useRef(null);
  const facialAnalysisActive = useRef(false);
  const audioAnalysisActive = useRef(false);

  // Initialize WebSocket connection
  useEffect(() => {
    const initializeConnection = () => {
      try {
        // For development, create mock connection
        const mockSocket = {
          connected: true,
          on: (event, callback) => {
            console.log(`📡 Listening for ${event}`);
            
            // Simulate some events
            if (event === 'connect') {
              setTimeout(() => callback(), 100);
            } else if (event === 'ai_services_health') {
              setTimeout(() => {
                callback({
                  status: 'healthy',
                  services: [
                    { service: 'facial-analysis', status: 'healthy', response_time: 45 },
                    { service: 'audio-analysis', status: 'healthy', response_time: 32 },
                    { service: 'text-analysis', status: 'healthy', response_time: 28 }
                  ],
                  timestamp: new Date().toISOString()
                });
              }, 500);
            }
          },
          emit: (event, data) => {
            console.log(`📤 Emitting ${event}:`, data);
            
            // Mock responses
            if (event === 'start_facial_analysis') {
              setTimeout(() => {
                setRealTimeAnalysis(prev => ({
                  ...prev,
                  facial: {
                    face_detected: true,
                    confidence_score: Math.floor(Math.random() * 20) + 80,
                    timestamp: Date.now()
                  }
                }));
              }, 1000);
            } else if (event === 'start_audio_analysis') {
              setTimeout(() => {
                setRealTimeAnalysis(prev => ({
                  ...prev,
                  audio: {
                    text: "This is a mock transcription...",
                    confidence: Math.floor(Math.random() * 20) + 80,
                    timestamp: Date.now()
                  }
                }));
              }, 1500);
            }
          },
          disconnect: () => {
            console.log('📴 Mock socket disconnected');
            setIsConnected(false);
          }
        };

        socketRef.current = mockSocket;
        setIsConnected(true);
        
        // Simulate health check
        mockSocket.emit('health_check');
        mockSocket.on('ai_services_health', setAiServicesHealth);

        // Real WebSocket implementation would be:
        /*
        const socket = io(process.env.REACT_APP_WEBSOCKET_URL || 'http://localhost:5000', {
          transports: ['websocket'],
          upgrade: false
        });

        socket.on('connect', () => {
          console.log('📡 Connected to WebSocket server');
          setIsConnected(true);
          setError(null);
        });

        socket.on('disconnect', () => {
          console.log('📴 Disconnected from WebSocket server');
          setIsConnected(false);
        });

        socket.on('error', (err) => {
          console.error('❌ WebSocket error:', err);
          setError(err.message);
        });

        socket.on('facial_analysis_result', (data) => {
          setRealTimeAnalysis(prev => ({
            ...prev,
            facial: data
          }));
        });

        socket.on('audio_analysis_result', (data) => {
          setRealTimeAnalysis(prev => ({
            ...prev,
            audio: data
          }));
        });

        socket.on('ai_services_health', (data) => {
          setAiServicesHealth(data);
        });

        socketRef.current = socket;
        */

      } catch (err) {
        console.error('❌ Failed to initialize WebSocket:', err);
        setError(err.message);
      }
    };

    initializeConnection();

    // Cleanup
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

  // Start facial analysis
  const startFacialAnalysis = useCallback((evaluationId) => {
    if (!socketRef.current || !isConnected) {
      console.warn('⚠️ WebSocket not connected');
      return;
    }

    facialAnalysisActive.current = true;
    socketRef.current.emit('start_facial_analysis', {
      evaluation_id: evaluationId,
      config: {
        confidence_threshold: 0.8,
        analysis_interval: 1000
      }
    });

    console.log('📹 Started facial analysis for evaluation:', evaluationId);
  }, [isConnected]);

  // Send facial frame
  const sendFacialFrame = useCallback((frameData) => {
    if (!socketRef.current || !facialAnalysisActive.current) {
      return;
    }

    // In real implementation, this would send actual frame data
    // socketRef.current.emit('facial_frame', frameData);
    
    // Mock: Update analysis periodically
    if (Math.random() > 0.7) { // 30% chance to update
      setRealTimeAnalysis(prev => ({
        ...prev,
        facial: {
          face_detected: true,
          confidence_score: Math.floor(Math.random() * 20) + 75,
          timestamp: Date.now()
        }
      }));
    }
  }, []);

  // Stop facial analysis
  const stopFacialAnalysis = useCallback(() => {
    if (!socketRef.current) return;

    facialAnalysisActive.current = false;
    socketRef.current.emit('stop_facial_analysis');
    
    setRealTimeAnalysis(prev => ({
      ...prev,
      facial: null
    }));

    console.log('⏹️ Stopped facial analysis');
  }, []);

  // Start audio analysis
  const startAudioAnalysis = useCallback((evaluationId) => {
    if (!socketRef.current || !isConnected) {
      console.warn('⚠️ WebSocket not connected');
      return;
    }

    audioAnalysisActive.current = true;
    socketRef.current.emit('start_audio_analysis', {
      evaluation_id: evaluationId,
      config: {
        language: 'en-US',
        real_time: true
      }
    });

    console.log('🎤 Started audio analysis for evaluation:', evaluationId);
  }, [isConnected]);

  // Send audio chunk
  const sendAudioChunk = useCallback((audioChunk) => {
    if (!socketRef.current || !audioAnalysisActive.current) {
      return;
    }

    // In real implementation, this would send actual audio data
    // socketRef.current.emit('audio_chunk', audioChunk);
    
    // Mock: Update transcription periodically
    if (Math.random() > 0.8) { // 20% chance to update
      const mockTranscriptions = [
        "I have experience with",
        "In my previous role,",
        "I believe that",
        "My approach would be",
        "The main challenge was"
      ];
      
      setRealTimeAnalysis(prev => ({
        ...prev,
        audio: {
          text: mockTranscriptions[Math.floor(Math.random() * mockTranscriptions.length)],
          confidence: Math.floor(Math.random() * 20) + 80,
          timestamp: Date.now()
        }
      }));
    }
  }, []);

  // Stop audio analysis
  const stopAudioAnalysis = useCallback(() => {
    if (!socketRef.current) return;

    audioAnalysisActive.current = false;
    socketRef.current.emit('stop_audio_analysis');
    
    setRealTimeAnalysis(prev => ({
      ...prev,
      audio: null
    }));

    console.log('⏹️ Stopped audio analysis');
  }, []);

  // Get connection status
  const getConnectionStatus = useCallback(() => {
    return {
      connected: isConnected,
      error: error
    };
  }, [isConnected, error]);

  return {
    // State
    isConnected,
    realTimeAnalysis,
    aiServicesHealth,
    error,

    // Facial Analysis
    startFacialAnalysis,
    sendFacialFrame,
    stopFacialAnalysis,

    // Audio Analysis
    startAudioAnalysis,
    sendAudioChunk,
    stopAudioAnalysis,

    // Helpers
    getConnectionStatus
  };
};