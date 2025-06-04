// frontend/src/store/interviewStore.js
import { create } from 'zustand';
import api from '../services/api';

const useInterviewStore = create((set, get) => ({
  // State
  interviews: [],
  currentInterview: null,
  isLoading: false,
  error: null,

  // Mock data for development
  generateMockInterviews: () => [
    {
      _id: '1',
      title: 'Frontend Developer Assessment',
      type: 'technical',
      duration: 30,
      status: 'completed',
      score: 85,
      createdAt: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
      completedAt: new Date(Date.now() - 86400000 + 1800000).toISOString(), // 30 mins later
      questions: [
        'Tell me about yourself',
        'Explain React hooks',
        'What is closure in JavaScript?',
        'Describe your ideal work environment'
      ]
    },
    {
      _id: '2',
      title: 'System Design Interview',
      type: 'system-design',
      duration: 45,
      status: 'in-progress',
      score: null,
      createdAt: new Date(Date.now() - 43200000).toISOString(), // 12 hours ago
      completedAt: null,
      questions: [
        'Design a URL shortener like bit.ly',
        'How would you scale a chat application?',
        'Database design for e-commerce platform'
      ]
    },
    {
      _id: '3',
      title: 'Behavioral Interview',
      type: 'behavioral',
      duration: 25,
      status: 'completed',
      score: 78,
      createdAt: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
      completedAt: new Date(Date.now() - 172800000 + 1500000).toISOString(),
      questions: [
        'Describe a challenging project',
        'How do you handle conflicts?',
        'Leadership experience',
        'Career goals'
      ]
    },
    {
      _id: '4',
      title: 'Coding Challenge',
      type: 'coding',
      duration: 60,
      status: 'pending',
      score: null,
      createdAt: new Date().toISOString(),
      completedAt: null,
      questions: [
        'Implement binary search',
        'Design data structures',
        'Algorithm optimization',
        'Code review session'
      ]
    }
  ],

  // Actions
  fetchInterviews: async () => {
    set({ isLoading: true, error: null });
    
    try {
      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 500)); // Simulate network delay
      const mockInterviews = get().generateMockInterviews();
      
      set({ 
        interviews: mockInterviews, 
        isLoading: false,
        error: null 
      });
      
      // Real API call (commented)
      /*
      const response = await api.get('/interviews');
      set({ 
        interviews: response.data, 
        isLoading: false,
        error: null 
      });
      */
    } catch (error) {
      set({ 
        error: error.message || 'Failed to fetch interviews',
        isLoading: false 
      });
    }
  },

  fetchInterview: async (id) => {
    set({ isLoading: true, error: null });
    
    try {
      // Mock API call
      const mockInterviews = get().generateMockInterviews();
      const interview = mockInterviews.find(i => i._id === id);
      
      if (interview) {
        set({ 
          currentInterview: interview, 
          isLoading: false,
          error: null 
        });
        return interview;
      } else {
        throw new Error('Interview not found');
      }
      
      // Real API call (commented)
      /*
      const response = await api.get(`/interviews/${id}`);
      const interview = response.data;
      
      set({ 
        currentInterview: interview, 
        isLoading: false,
        error: null 
      });
      return interview;
      */
    } catch (error) {
      set({ 
        error: error.message || 'Failed to fetch interview',
        isLoading: false 
      });
      throw error;
    }
  },

  createInterview: async (interviewData) => {
    set({ isLoading: true, error: null });
    
    try {
      // Mock interview creation
      const newInterview = {
        _id: Date.now().toString(),
        ...interviewData,
        status: 'pending',
        score: null,
        createdAt: new Date().toISOString(),
        completedAt: null,
        questions: get().generateQuestionsByType(interviewData.type)
      };
      
      // Add to interviews list
      const currentInterviews = get().interviews;
      set({ 
        interviews: [newInterview, ...currentInterviews],
        currentInterview: newInterview,
        isLoading: false,
        error: null 
      });
      
      return newInterview;
      
      // Real API call (commented)
      /*
      const response = await api.post('/interviews', interviewData);
      const newInterview = response.data;
      
      const currentInterviews = get().interviews;
      set({ 
        interviews: [newInterview, ...currentInterviews],
        currentInterview: newInterview,
        isLoading: false,
        error: null 
      });
      
      return newInterview;
      */
    } catch (error) {
      set({ 
        error: error.message || 'Failed to create interview',
        isLoading: false 
      });
      throw error;
    }
  },

  updateInterview: async (id, updateData) => {
    set({ isLoading: true, error: null });
    
    try {
      // Mock update
      const currentInterviews = get().interviews;
      const updatedInterviews = currentInterviews.map(interview => 
        interview._id === id 
          ? { ...interview, ...updateData, updatedAt: new Date().toISOString() }
          : interview
      );
      
      const updatedInterview = updatedInterviews.find(i => i._id === id);
      
      set({ 
        interviews: updatedInterviews,
        currentInterview: updatedInterview,
        isLoading: false,
        error: null 
      });
      
      return updatedInterview;
      
      // Real API call (commented)
      /*
      const response = await api.put(`/interviews/${id}`, updateData);
      const updatedInterview = response.data;
      
      const currentInterviews = get().interviews;
      const updatedInterviews = currentInterviews.map(interview => 
        interview._id === id ? updatedInterview : interview
      );
      
      set({ 
        interviews: updatedInterviews,
        currentInterview: updatedInterview,
        isLoading: false,
        error: null 
      });
      
      return updatedInterview;
      */
    } catch (error) {
      set({ 
        error: error.message || 'Failed to update interview',
        isLoading: false 
      });
      throw error;
    }
  },

  deleteInterview: async (id) => {
    set({ isLoading: true, error: null });
    
    try {
      // Mock deletion
      const currentInterviews = get().interviews;
      const filteredInterviews = currentInterviews.filter(interview => interview._id !== id);
      
      set({ 
        interviews: filteredInterviews,
        isLoading: false,
        error: null 
      });
      
      // Clear current interview if it's the deleted one
      if (get().currentInterview?._id === id) {
        set({ currentInterview: null });
      }
      
      // Real API call (commented)
      /*
      await api.delete(`/interviews/${id}`);
      
      const currentInterviews = get().interviews;
      const filteredInterviews = currentInterviews.filter(interview => interview._id !== id);
      
      set({ 
        interviews: filteredInterviews,
        isLoading: false,
        error: null 
      });
      
      if (get().currentInterview?._id === id) {
        set({ currentInterview: null });
      }
      */
    } catch (error) {
      set({ 
        error: error.message || 'Failed to delete interview',
        isLoading: false 
      });
      throw error;
    }
  },

  submitAnswer: async (answerData) => {
    set({ isLoading: true, error: null });
    
    try {
      // Mock answer submission and AI analysis
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate AI processing
      
      const analysisResult = {
        confidence: Math.floor(Math.random() * 20) + 80, // 80-100
        audioQuality: Math.floor(Math.random() * 20) + 75, // 75-95
        relevance: Math.floor(Math.random() * 25) + 70, // 70-95
        feedback: "Good answer with clear communication",
        timestamp: new Date().toISOString()
      };
      
      set({ isLoading: false, error: null });
      return analysisResult;
      
      // Real API call (commented)
      /*
      const response = await api.post('/evaluations/analyze', answerData);
      const analysisResult = response.data;
      
      set({ isLoading: false, error: null });
      return analysisResult;
      */
    } catch (error) {
      set({ 
        error: error.message || 'Failed to submit answer',
        isLoading: false 
      });
      throw error;
    }
  },

  generateQuestionsByType: (type) => {
    const questionBank = {
      technical: [
        "Explain the difference between let, const, and var in JavaScript.",
        "What is closure and how does it work?",
        "Describe the event loop in JavaScript.",
        "How does React's virtual DOM work?",
        "Explain the difference between SQL and NoSQL databases."
      ],
      behavioral: [
        "Tell me about yourself and your background.",
        "Describe a challenging project you worked on.",
        "How do you handle conflicts in a team?",
        "What motivates you in your work?",
        "Where do you see yourself in 5 years?"
      ],
      coding: [
        "Implement a binary search algorithm.",
        "Reverse a linked list.",
        "Find the longest palindromic substring.",
        "Design a LRU cache.",
        "Implement a rate limiter."
      ],
      'system-design': [
        "Design a URL shortener like bit.ly.",
        "How would you design a chat application?",
        "Design a distributed cache system.",
        "Architecture for a social media feed.",
        "Design a notification system."
      ]
    };
    
    return questionBank[type] || questionBank.technical;
  },

  clearError: () => set({ error: null }),

  resetCurrentInterview: () => set({ currentInterview: null })
}));

export { useInterviewStore };


// // frontend/src/store/interviewStore.js

// import { create } from 'zustand';
// import { devtools, persist } from 'zustand/middleware';

// const useInterviewStore = create()(
//   devtools(
//     persist(
//       (set, get) => ({
//         // Current Interview State
//         currentInterview: null,
//         interviewData: {
//           id: null,
//           title: '',
//           description: '',
//           questions: [],
//           currentQuestionIndex: 0,
//           answers: [],
//           startTime: null,
//           endTime: null,
//           duration: 0,
//           status: 'pending' // pending, in-progress, completed, failed, cancelled
//         },

//         // Media State for Camera/Audio
//         mediaState: {
//           camera: {
//             isEnabled: false,
//             stream: null,
//             error: null,
//             isInitializing: false
//           },
//           audio: {
//             isRecording: false,
//             stream: null,
//             error: null,
//             chunks: [],
//             isInitializing: false
//           },
//           permissions: {
//             camera: false,
//             microphone: false,
//             requested: false
//           }
//         },

//         // AI Analysis State
//         analysisState: {
//           facial: {
//             confidence: 0,
//             isAnalyzing: false,
//             result: null,
//             error: null,
//             progress: 0
//           },
//           audio: {
//             transcription: '',
//             quality: 0,
//             isAnalyzing: false,
//             result: null,
//             error: null,
//             progress: 0
//           },
//           text: {
//             score: 0,
//             isAnalyzing: false,
//             result: null,
//             error: null,
//             feedback: ''
//           },
//           overall: {
//             score: 0,
//             passed: false,
//             feedback: '',
//             isCalculating: false,
//             breakdown: {
//               facial: 0,
//               audio: 0,
//               text: 0
//             }
//           }
//         },

//         // WebSocket Connection State
//         websocketState: {
//           connected: false,
//           connecting: false,
//           error: null,
//           lastMessage: null,
//           reconnectAttempts: 0,
//           lastHeartbeat: null
//         },

//         // Loading States
//         loading: {
//           interview: false,
//           submission: false,
//           results: false,
//           initialization: false,
//           mediaSetup: false
//         },

//         // Error States
//         errors: {
//           interview: null,
//           media: null,
//           analysis: null,
//           submission: null,
//           connection: null
//         },

//         // Interview Management Actions
//         setCurrentInterview: (interview) => set({ currentInterview: interview }),
        
//         updateInterviewData: (data) => set((state) => ({
//           interviewData: { ...state.interviewData, ...data }
//         })),

//         initializeInterview: (interviewData) => set({
//           interviewData: {
//             ...interviewData,
//             startTime: null,
//             endTime: null,
//             duration: 0,
//             status: 'pending'
//           }
//         }),

//         startInterview: () => set((state) => ({
//           interviewData: {
//             ...state.interviewData,
//             startTime: new Date().toISOString(),
//             status: 'in-progress'
//           }
//         })),

//         endInterview: () => set((state) => {
//           const startTime = new Date(state.interviewData.startTime);
//           const endTime = new Date();
//           const duration = endTime - startTime;

//           return {
//             interviewData: {
//               ...state.interviewData,
//               endTime: endTime.toISOString(),
//               duration: duration,
//               status: 'completed'
//             }
//           };
//         }),

//         // Question Navigation
//         nextQuestion: () => set((state) => ({
//           interviewData: {
//             ...state.interviewData,
//             currentQuestionIndex: Math.min(
//               state.interviewData.currentQuestionIndex + 1,
//               state.interviewData.questions.length - 1
//             )
//           }
//         })),

//         previousQuestion: () => set((state) => ({
//           interviewData: {
//             ...state.interviewData,
//             currentQuestionIndex: Math.max(
//               state.interviewData.currentQuestionIndex - 1,
//               0
//             )
//           }
//         })),

//         goToQuestion: (index) => set((state) => ({
//           interviewData: {
//             ...state.interviewData,
//             currentQuestionIndex: Math.max(0, Math.min(index, state.interviewData.questions.length - 1))
//           }
//         })),

//         // Answer Management
//         addAnswer: (answer) => set((state) => ({
//           interviewData: {
//             ...state.interviewData,
//             answers: [...state.interviewData.answers, {
//               ...answer,
//               id: answer.id || Date.now().toString(),
//               timestamp: answer.timestamp || new Date().toISOString()
//             }]
//           }
//         })),

//         updateAnswer: (answerIndex, updates) => set((state) => ({
//           interviewData: {
//             ...state.interviewData,
//             answers: state.interviewData.answers.map((answer, index) =>
//               index === answerIndex ? { ...answer, ...updates } : answer
//             )
//           }
//         })),

//         removeAnswer: (answerIndex) => set((state) => ({
//           interviewData: {
//             ...state.interviewData,
//             answers: state.interviewData.answers.filter((_, index) => index !== answerIndex)
//           }
//         })),

//         // Media State Management
//         updateMediaState: (mediaType, updates) => set((state) => ({
//           mediaState: {
//             ...state.mediaState,
//             [mediaType]: { ...state.mediaState[mediaType], ...updates }
//           }
//         })),

//         setMediaPermissions: (permissions) => set((state) => ({
//           mediaState: {
//             ...state.mediaState,
//             permissions: { ...state.mediaState.permissions, ...permissions }
//           }
//         })),

//         resetMediaState: () => set({
//           mediaState: {
//             camera: {
//               isEnabled: false,
//               stream: null,
//               error: null,
//               isInitializing: false
//             },
//             audio: {
//               isRecording: false,
//               stream: null,
//               error: null,
//               chunks: [],
//               isInitializing: false
//             },
//             permissions: {
//               camera: false,
//               microphone: false,
//               requested: false
//             }
//           }
//         }),

//         // Analysis State Management
//         updateAnalysisState: (analysisType, updates) => set((state) => ({
//           analysisState: {
//             ...state.analysisState,
//             [analysisType]: { ...state.analysisState[analysisType], ...updates }
//           }
//         })),

//         setAnalysisProgress: (analysisType, progress) => set((state) => ({
//           analysisState: {
//             ...state.analysisState,
//             [analysisType]: { ...state.analysisState[analysisType], progress }
//           }
//         })),

//         setOverallScore: (score, passed, feedback, breakdown = {}) => set((state) => ({
//           analysisState: {
//             ...state.analysisState,
//             overall: {
//               ...state.analysisState.overall,
//               score,
//               passed,
//               feedback,
//               breakdown: { ...state.analysisState.overall.breakdown, ...breakdown },
//               isCalculating: false
//             }
//           }
//         })),

//         resetAnalysisState: () => set({
//           analysisState: {
//             facial: {
//               confidence: 0,
//               isAnalyzing: false,
//               result: null,
//               error: null,
//               progress: 0
//             },
//             audio: {
//               transcription: '',
//               quality: 0,
//               isAnalyzing: false,
//               result: null,
//               error: null,
//               progress: 0
//             },
//             text: {
//               score: 0,
//               isAnalyzing: false,
//               result: null,
//               error: null,
//               feedback: ''
//             },
//             overall: {
//               score: 0,
//               passed: false,
//               feedback: '',
//               isCalculating: false,
//               breakdown: {
//                 facial: 0,
//                 audio: 0,
//                 text: 0
//               }
//             }
//           }
//         }),

//         // WebSocket State Management
//         updateWebSocketState: (updates) => set((state) => ({
//           websocketState: { ...state.websocketState, ...updates }
//         })),

//         setWebSocketConnected: (connected) => set((state) => ({
//           websocketState: { 
//             ...state.websocketState, 
//             connected,
//             connecting: false,
//             error: connected ? null : state.websocketState.error
//           }
//         })),

//         incrementReconnectAttempts: () => set((state) => ({
//           websocketState: {
//             ...state.websocketState,
//             reconnectAttempts: state.websocketState.reconnectAttempts + 1
//           }
//         })),

//         resetWebSocketState: () => set({
//           websocketState: {
//             connected: false,
//             connecting: false,
//             error: null,
//             lastMessage: null,
//             reconnectAttempts: 0,
//             lastHeartbeat: null
//           }
//         }),

//         // Loading State Management
//         setLoading: (loadingType, isLoading) => set((state) => ({
//           loading: { ...state.loading, [loadingType]: isLoading }
//         })),

//         setLoadingStates: (loadingStates) => set((state) => ({
//           loading: { ...state.loading, ...loadingStates }
//         })),

//         // Error State Management
//         setError: (errorType, error) => set((state) => ({
//           errors: { ...state.errors, [errorType]: error }
//         })),

//         clearError: (errorType) => set((state) => ({
//           errors: { ...state.errors, [errorType]: null }
//         })),

//         clearAllErrors: () => set({
//           errors: {
//             interview: null,
//             media: null,
//             analysis: null,
//             submission: null,
//             connection: null
//           }
//         }),

//         // Reset Functions
//         resetInterview: () => set({
//           currentInterview: null,
//           interviewData: {
//             id: null,
//             title: '',
//             description: '',
//             questions: [],
//             currentQuestionIndex: 0,
//             answers: [],
//             startTime: null,
//             endTime: null,
//             duration: 0,
//             status: 'pending'
//           }
//         }),

//         resetAll: () => set({
//           currentInterview: null,
//           interviewData: {
//             id: null,
//             title: '',
//             description: '',
//             questions: [],
//             currentQuestionIndex: 0,
//             answers: [],
//             startTime: null,
//             endTime: null,
//             duration: 0,
//             status: 'pending'
//           },
//           mediaState: {
//             camera: {
//               isEnabled: false,
//               stream: null,
//               error: null,
//               isInitializing: false
//             },
//             audio: {
//               isRecording: false,
//               stream: null,
//               error: null,
//               chunks: [],
//               isInitializing: false
//             },
//             permissions: {
//               camera: false,
//               microphone: false,
//               requested: false
//             }
//           },
//           analysisState: {
//             facial: {
//               confidence: 0,
//               isAnalyzing: false,
//               result: null,
//               error: null,
//               progress: 0
//             },
//             audio: {
//               transcription: '',
//               quality: 0,
//               isAnalyzing: false,
//               result: null,
//               error: null,
//               progress: 0
//             },
//             text: {
//               score: 0,
//               isAnalyzing: false,
//               result: null,
//               error: null,
//               feedback: ''
//             },
//             overall: {
//               score: 0,
//               passed: false,
//               feedback: '',
//               isCalculating: false,
//               breakdown: {
//                 facial: 0,
//                 audio: 0,
//                 text: 0
//               }
//             }
//           },
//           loading: {
//             interview: false,
//             submission: false,
//             results: false,
//             initialization: false,
//             mediaSetup: false
//           },
//           errors: {
//             interview: null,
//             media: null,
//             analysis: null,
//             submission: null,
//             connection: null
//           }
//         }),

//         // Computed Values / Getters
//         getCurrentQuestion: () => {
//           const state = get();
//           const { questions, currentQuestionIndex } = state.interviewData;
//           return questions[currentQuestionIndex] || null;
//         },

//         getProgress: () => {
//           const state = get();
//           const { questions, currentQuestionIndex } = state.interviewData;
//           if (questions.length === 0) return 0;
//           return ((currentQuestionIndex + 1) / questions.length) * 100;
//         },

//         getAnswerProgress: () => {
//           const state = get();
//           const { questions, answers } = state.interviewData;
//           if (questions.length === 0) return 0;
//           return (answers.length / questions.length) * 100;
//         },

//         isInterviewComplete: () => {
//           const state = get();
//           const { questions, currentQuestionIndex, answers } = state.interviewData;
//           return currentQuestionIndex >= questions.length - 1 && 
//                  answers.length >= questions.length;
//         },

//         canProceedToNext: () => {
//           const state = get();
//           const { questions, currentQuestionIndex, answers } = state.interviewData;
//           return answers.length > currentQuestionIndex && 
//                  currentQuestionIndex < questions.length - 1;
//         },

//         canGoToPrevious: () => {
//           const state = get();
//           return state.interviewData.currentQuestionIndex > 0;
//         },

//         getTimeElapsed: () => {
//           const state = get();
//           if (!state.interviewData.startTime) return 0;
//           const startTime = new Date(state.interviewData.startTime);
//           const currentTime = state.interviewData.endTime 
//             ? new Date(state.interviewData.endTime)
//             : new Date();
//           return currentTime - startTime;
//         },

//         getInterviewSummary: () => {
//           const state = get();
//           const { questions, answers, status } = state.interviewData;
          
//           return {
//             totalQuestions: questions.length,
//             answeredQuestions: answers.length,
//             skippedQuestions: answers.filter(a => a.skipped).length,
//             completedQuestions: answers.filter(a => !a.skipped).length,
//             progress: state.getProgress(),
//             answerProgress: state.getAnswerProgress(),
//             isComplete: state.isInterviewComplete(),
//             canProceed: state.canProceedToNext(),
//             canGoBack: state.canGoToPrevious(),
//             timeElapsed: state.getTimeElapsed(),
//             status,
//             currentQuestion: state.getCurrentQuestion(),
//             overallScore: state.analysisState.overall.score,
//             passed: state.analysisState.overall.passed
//           };
//         }
//       }),
//       {
//         name: 'interview-storage',
//         partialize: (state) => ({
//           interviewData: state.interviewData,
//           analysisState: state.analysisState,
//           currentInterview: state.currentInterview
//         })
//       }
//     ),
//     { name: 'interview-store' }
//   )
// );

// export default useInterviewStore;