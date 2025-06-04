// frontend/src/hooks/useInterview.js

import { useCallback, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import useInterviewStore from '../store/interviewStore';
import useWebSocket from './useWebSocket';
import { interviewAPI, uploadAPI, handleApiError } from '../services/api';
import { INTERVIEW_STATUS, SUCCESS_MESSAGES, ERROR_MESSAGES } from '../utils/constants';
import { validateAnswer, validateInterviewData } from '../utils/validators';
import { calculateOverallScore } from '../utils/helpers';
import toast from 'react-hot-toast';

export const useInterview = (options = {}) => {
  const {
    autoSave = true,
    autoAnalyze = true,
    enableOfflineMode = false
  } = options;

  const navigate = useNavigate();
  const {
    interviewData,
    analysisState,
    loading,
    errors,
    updateInterviewData,
    initializeInterview,
    startInterview: startInterviewStore,
    endInterview: endInterviewStore,
    nextQuestion,
    previousQuestion,
    goToQuestion,
    addAnswer,
    updateAnswer,
    removeAnswer,
    updateAnalysisState,
    setLoading,
    setError,
    clearError,
    getCurrentQuestion,
    getProgress,
    getAnswerProgress,
    isInterviewComplete,
    canProceedToNext,
    canGoToPrevious,
    getTimeElapsed,
    getInterviewSummary,
    resetInterview
  } = useInterviewStore();

  const {
    isConnected,
    startInterview: startInterviewWS,
    endInterview: endInterviewWS,
    pauseInterview: pauseInterviewWS,
    resumeInterview: resumeInterviewWS,
    submitAnswer: submitAnswerWS,
    skipQuestion: skipQuestionWS,
    startFacialAnalysis,
    startAudioAnalysis,
    startTextAnalysis,
    onAnalysisResult,
    onAnalysisProgress
  } = useWebSocket({ autoConnect: true });

  // Refs for managing state
  const autoSaveTimeoutRef = useRef(null);
  const analysisQueueRef = useRef([]);
  const offlineActionsRef = useRef([]);

  // Initialize interview from ID or data
  const initializeInterviewFromId = useCallback(async (interviewId) => {
    try {
      setLoading('initialization', true);
      clearError('interview');

      const response = await interviewAPI.getById(interviewId);
      const interview = response.interview;

      // Validate interview data
      const validation = validateInterviewData(interview);
      if (!validation.isValid) {
        throw new Error(`Invalid interview data: ${validation.errors.join(', ')}`);
      }

      initializeInterview({
        id: interview._id,
        title: interview.title,
        description: interview.description,
        questions: interview.questions,
        currentQuestionIndex: interview.currentQuestionIndex || 0,
        answers: interview.answers || [],
        status: interview.status || INTERVIEW_STATUS.PENDING,
        startTime: interview.startTime,
        endTime: interview.endTime,
        duration: interview.duration || 0
      });

      return interview;
    } catch (error) {
      console.error('Error initializing interview:', error);
      setError('interview', error.message || 'Failed to load interview');
      throw error;
    } finally {
      setLoading('initialization', false);
    }
  }, [initializeInterview, setLoading, setError, clearError]);

  // Start interview with comprehensive checks
  const startInterview = useCallback(async (interviewId = null) => {
    try {
      if (!isConnected && !enableOfflineMode) {
        throw new Error('Real-time connection required to start interview');
      }

      setLoading('interview', true);
      clearError('interview');

      const currentInterviewId = interviewId || interviewData.id;
      if (!currentInterviewId) {
        throw new Error('No interview ID provided');
      }

      // Start interview in store
      startInterviewStore();

      // Notify server via WebSocket if connected
      if (isConnected) {
        const success = startInterviewWS(currentInterviewId);
        if (!success) {
          console.warn('Failed to notify server of interview start');
        }
      } else if (enableOfflineMode) {
        // Queue action for when connection is restored
        offlineActionsRef.current.push({
          type: 'start',
          interviewId: currentInterviewId,
          timestamp: Date.now()
        });
      }

      toast.success(SUCCESS_MESSAGES.INTERVIEW_STARTED);
      return true;
    } catch (error) {
      console.error('Error starting interview:', error);
      setError('interview', error.message || 'Failed to start interview');
      throw error;
    } finally {
      setLoading('interview', false);
    }
  }, [
    isConnected,
    enableOfflineMode,
    interviewData.id,
    startInterviewStore,
    startInterviewWS,
    setLoading,
    setError,
    clearError
  ]);

  // End interview with final submission
  const endInterview = useCallback(async (options = {}) => {
    try {
      const { skipValidation = false, reason = 'completed' } = options;

      setLoading('submission', true);
      clearError('submission');

      // Validate interview completion if not skipping
      if (!skipValidation && !isInterviewComplete()) {
        const summary = getInterviewSummary();
        if (summary.answeredQuestions < summary.totalQuestions) {
          const proceed = window.confirm(
            `You have only answered ${summary.answeredQuestions} out of ${summary.totalQuestions} questions. Are you sure you want to end the interview?`
          );
          if (!proceed) {
            setLoading('submission', false);
            return false;
          }
        }
      }

      // End interview in store
      endInterviewStore();

      // Submit final interview data to server
      const submissionData = {
        answers: interviewData.answers,
        endTime: new Date().toISOString(),
        status: reason === 'completed' ? INTERVIEW_STATUS.COMPLETED : INTERVIEW_STATUS.CANCELLED,
        duration: getTimeElapsed(),
        summary: getInterviewSummary()
      };

      if (isConnected) {
        // Submit via API
        await interviewAPI.submit(interviewData.id, submissionData);
        
        // Notify server via WebSocket
        endInterviewWS(interviewData.id);
      } else if (enableOfflineMode) {
        // Store for later submission
        localStorage.setItem(`interview_${interviewData.id}_submission`, JSON.stringify(submissionData));
        offlineActionsRef.current.push({
          type: 'end',
          interviewId: interviewData.id,
          data: submissionData,
          timestamp: Date.now()
        });
      }

      toast.success(SUCCESS_MESSAGES.INTERVIEW_COMPLETED);
      
      // Navigate to results page
      navigate(`/interview/${interviewData.id}/results`);
      return true;
    } catch (error) {
      console.error('Error ending interview:', error);
      setError('submission', error.message || 'Failed to submit interview');
      throw error;
    } finally {
      setLoading('submission', false);
    }
  }, [
    interviewData.id,
    interviewData.answers,
    isConnected,
    enableOfflineMode,
    isInterviewComplete,
    getInterviewSummary,
    getTimeElapsed,
    endInterviewStore,
    endInterviewWS,
    navigate,
    setLoading,
    setError,
    clearError
  ]);

  // Pause interview
  const pauseInterview = useCallback(async () => {
    try {
      updateInterviewData({ status: INTERVIEW_STATUS.PAUSED });
      
      if (isConnected) {
        pauseInterviewWS(interviewData.id);
      }
      
      toast.info('Interview paused');
      return true;
    } catch (error) {
      console.error('Error pausing interview:', error);
      toast.error('Failed to pause interview');
      return false;
    }
  }, [interviewData.id, isConnected, pauseInterviewWS, updateInterviewData]);

  // Resume interview
  const resumeInterview = useCallback(async () => {
    try {
      updateInterviewData({ status: INTERVIEW_STATUS.IN_PROGRESS });
      
      if (isConnected) {
        resumeInterviewWS(interviewData.id);
      }
      
      toast.success('Interview resumed');
      return true;
    } catch (error) {
      console.error('Error resuming interview:', error);
      toast.error('Failed to resume interview');
      return false;
    }
  }, [interviewData.id, isConnected, resumeInterviewWS, updateInterviewData]);

  // Submit answer with comprehensive handling
  const submitAnswer = useCallback(async (answerData, options = {}) => {
    try {
      const {
        text,
        audioBlob,
        videoBlob,
        type = 'text',
        skipValidation = false,
        autoAdvance = true
      } = answerData;

      const {
        uploadProgress = null,
        analysisOptions = {}
      } = options;

      const currentQuestion = getCurrentQuestion();
      if (!currentQuestion) {
        throw new Error('No current question found');
      }

      // Validate answer if not skipping
      if (!skipValidation && text) {
        const validation = validateAnswer(text);
        if (!validation.isValid) {
          throw new Error(validation.errors[0]);
        }
      }

      setLoading('submission', true);
      clearError('submission');

      const answer = {
        id: `answer_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        questionId: currentQuestion._id || currentQuestion.id,
        text: text || '',
        type,
        timestamp: new Date().toISOString(),
        audioUrl: null,
        videoUrl: null,
        metadata: {
          duration: answerData.duration || null,
          wordCount: text ? text.trim().split(/\s+/).length : 0
        }
      };

      // Handle media uploads with progress tracking
      const uploadPromises = [];

      if (audioBlob) {
        uploadPromises.push(
          uploadAudioFile(audioBlob, answer, uploadProgress, analysisOptions)
        );
      }

      if (videoBlob) {
        uploadPromises.push(
          uploadVideoFile(videoBlob, answer, uploadProgress, analysisOptions)
        );
      }

      // Wait for uploads to complete
      if (uploadPromises.length > 0) {
        const uploadResults = await Promise.allSettled(uploadPromises);
        
        uploadResults.forEach((result, index) => {
          if (result.status === 'fulfilled') {
            const { type: uploadType, url } = result.value;
            if (uploadType === 'audio') answer.audioUrl = url;
            if (uploadType === 'video') answer.videoUrl = url;
          } else {
            console.error(`Upload ${index} failed:`, result.reason);
          }
        });
      }

      // Add answer to store
      addAnswer(answer);

      // Submit via WebSocket if connected
      if (isConnected) {
        submitAnswerWS(currentQuestion._id || currentQuestion.id, answer, type);
      } else if (enableOfflineMode) {
        offlineActionsRef.current.push({
          type: 'answer',
          questionId: currentQuestion._id || currentQuestion.id,
          answer,
          timestamp: Date.now()
        });
      }

      // Start analysis if enabled and text is provided
      if (autoAnalyze && text) {
        queueTextAnalysis(text, currentQuestion._id || currentQuestion.id);
      }

      // Auto-save if enabled
      if (autoSave) {
        scheduleAutoSave();
      }

      toast.success(SUCCESS_MESSAGES.ANSWER_SAVED);

      // Auto-advance to next question if enabled
      if (autoAdvance && canProceedToNext()) {
        setTimeout(() => nextQuestion(), 1000);
      }

      return answer;
    } catch (error) {
      console.error('Error submitting answer:', error);
      setError('submission', error.message || 'Failed to submit answer');
      throw error;
    } finally {
      setLoading('submission', false);
    }
  }, [
    getCurrentQuestion,
    addAnswer,
    submitAnswerWS,
    isConnected,
    enableOfflineMode,
    autoAnalyze,
    autoSave,
    canProceedToNext,
    nextQuestion,
    setLoading,
    setError,
    clearError
  ]);

  // Helper function to upload audio files
  const uploadAudioFile = useCallback(async (audioBlob, answer, onProgress, options) => {
    try {
      updateAnalysisState('audio', { isAnalyzing: true, progress: 0 });
      
      const audioFile = new File([audioBlob], `answer-audio-${answer.id}.wav`, { 
        type: 'audio/wav' 
      });
      
      const response = await uploadAPI.uploadAudio(audioFile, onProgress, {
        interviewId: interviewData.id,
        questionId: answer.questionId,
        ...options
      });
      
      // Start audio analysis if connected
      if (isConnected) {
        startAudioAnalysis(response.url, options);
      }
      
      return { type: 'audio', url: response.url };
    } catch (error) {
      updateAnalysisState('audio', { 
        isAnalyzing: false, 
        error: error.message,
        progress: 0 
      });
      throw error;
    }
  }, [interviewData.id, isConnected, startAudioAnalysis, updateAnalysisState]);

  // Helper function to upload video files
  const uploadVideoFile = useCallback(async (videoBlob, answer, onProgress, options) => {
    try {
      updateAnalysisState('facial', { isAnalyzing: true, progress: 0 });
      
      const videoFile = new File([videoBlob], `answer-video-${answer.id}.webm`, { 
        type: 'video/webm' 
      });
      
      const response = await uploadAPI.uploadVideo(videoFile, onProgress, {
        interviewId: interviewData.id,
        questionId: answer.questionId,
        ...options
      });
      
      // Start facial analysis if connected
      if (isConnected) {
        startFacialAnalysis(response.url, options);
      }
      
      return { type: 'video', url: response.url };
    } catch (error) {
      updateAnalysisState('facial', { 
        isAnalyzing: false, 
        error: error.message,
        progress: 0 
      });
      throw error;
    }
  }, [interviewData.id, isConnected, startFacialAnalysis, updateAnalysisState]);

  // Queue text analysis to avoid overwhelming the server
  const queueTextAnalysis = useCallback((text, questionId) => {
    analysisQueueRef.current.push({ text, questionId, timestamp: Date.now() });
    
    // Process queue after a short delay to batch requests
    setTimeout(() => {
      if (analysisQueueRef.current.length > 0 && isConnected) {
        const { text: queuedText, questionId: queuedQuestionId } = analysisQueueRef.current.shift();
        updateAnalysisState('text', { isAnalyzing: true });
        startTextAnalysis(queuedText, queuedQuestionId);
      }
    }, 2000);
  }, [isConnected, startTextAnalysis, updateAnalysisState]);

  // Auto-save functionality
  const scheduleAutoSave = useCallback(() => {
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }
    
    autoSaveTimeoutRef.current = setTimeout(async () => {
      try {
        const saveData = {
          answers: interviewData.answers,
          currentQuestionIndex: interviewData.currentQuestionIndex,
          status: interviewData.status,
          lastSaved: new Date().toISOString()
        };
        
        if (isConnected) {
          await interviewAPI.update(interviewData.id, saveData);
        } else {
          // Save locally
          localStorage.setItem(`interview_${interviewData.id}_autosave`, JSON.stringify(saveData));
        }
      } catch (error) {
        console.warn('Auto-save failed:', error);
      }
    }, 5000); // Auto-save after 5 seconds of inactivity
  }, [interviewData, isConnected, autoSave]);

  // Skip question
  const skipQuestion = useCallback(async (reason = null) => {
    try {
      const currentQuestion = getCurrentQuestion();
      if (!currentQuestion) return false;

      const skipAnswer = {
        id: `skip_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        questionId: currentQuestion._id || currentQuestion.id,
        text: '',
        type: 'skipped',
        timestamp: new Date().toISOString(),
        skipped: true,
        skipReason: reason,
        metadata: {
          skippedAt: interviewData.currentQuestionIndex
        }
      };

      addAnswer(skipAnswer);

      if (isConnected) {
        skipQuestionWS(currentQuestion._id || currentQuestion.id, reason);
      }

      toast.info(`Question ${interviewData.currentQuestionIndex + 1} skipped`);
      
      // Auto-advance
      if (canProceedToNext()) {
        setTimeout(() => nextQuestion(), 500);
      }
      
      return true;
    } catch (error) {
      console.error('Error skipping question:', error);
      toast.error('Failed to skip question');
      return false;
    }
  }, [getCurrentQuestion, addAnswer, skipQuestionWS, isConnected, interviewData.currentQuestionIndex, canProceedToNext, nextQuestion]);

  // Navigation methods with validation
  const goToNextQuestion = useCallback(() => {
    if (canProceedToNext()) {
      nextQuestion();
      return true;
    }
    toast.warning('Please answer the current question before proceeding');
    return false;
  }, [canProceedToNext, nextQuestion]);

  const goToPreviousQuestion = useCallback(() => {
    if (canGoToPrevious()) {
      previousQuestion();
      return true;
    }
    return false;
  }, [canGoToPrevious, previousQuestion]);

  const goToSpecificQuestion = useCallback((index) => {
    if (index >= 0 && index < interviewData.questions.length) {
      goToQuestion(index);
      return true;
    }
    return false;
  }, [interviewData.questions.length, goToQuestion]);

  // Handle offline actions when connection is restored
  useEffect(() => {
    if (isConnected && offlineActionsRef.current.length > 0) {
      const actions = [...offlineActionsRef.current];
      offlineActionsRef.current = [];
      
      actions.forEach(async (action) => {
        try {
          switch (action.type) {
            case 'start':
              startInterviewWS(action.interviewId);
              break;
            case 'end':
              await interviewAPI.submit(action.interviewId, action.data);
              endInterviewWS(action.interviewId);
              break;
            case 'answer':
              submitAnswerWS(action.questionId, action.answer, action.answer.type);
              break;
          }
        } catch (error) {
          console.error('Error replaying offline action:', error);
        }
      });
    }
  }, [isConnected]);

  // Setup analysis result listeners
  useEffect(() => {
    const cleanup1 = onAnalysisResult('facial', (result) => {
      console.log('Facial analysis result received:', result);
    });

    const cleanup2 = onAnalysisResult('audio', (result) => {
      console.log('Audio analysis result received:', result);
    });

    const cleanup3 = onAnalysisResult('text', (result) => {
      console.log('Text analysis result received:', result);
    });

    const cleanup4 = onAnalysisResult('overall', (result) => {
      console.log('Overall evaluation result received:', result);
    });

    return () => {
      cleanup1();
      cleanup2();
      cleanup3();
      cleanup4();
    };
  }, [onAnalysisResult]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, []);

  return {
    // State
    interviewData,
    analysisState,
    loading,
    errors,
    isConnected,

    // Interview management
    initializeInterviewFromId,
    startInterview,
    endInterview,
    pauseInterview,
    resumeInterview,
    resetInterview,

    // Answer management
    submitAnswer,
    skipQuestion,

    // Navigation
    goToNextQuestion,
    goToPreviousQuestion,
    goToSpecificQuestion,

    // Computed values
    currentQuestion: getCurrentQuestion(),
    progress: getProgress(),
    answerProgress: getAnswerProgress(),
    isComplete: isInterviewComplete(),
    canProceed: canProceedToNext(),
    canGoBack: canGoToPrevious(),
    timeElapsed: getTimeElapsed(),
    summary: getInterviewSummary(),

    // Utilities
    scheduleAutoSave,
    
    // Analysis queue info
    analysisQueueLength: analysisQueueRef.current.length,
    offlineActionsCount: offlineActionsRef.current.length
  };
};

export default useInterview;