// frontend/src/store/adminStore.js
import { create } from 'zustand';
import { adminAPI } from '../services/api';

const useAdminStore = create((set, get) => ({
  // State
  loading: false,
  error: null,
  
  // Dashboard
  stats: {
    totalUsers: 0,
    activeInterviews: 0,
    completedInterviews: 0,
    totalQuestions: 0,
  },
  recentActivities: [],
  
  // Users
  users: [],
  userStats: {
    totalUsers: 0,
    activeUsers: 0,
    adminUsers: 0,
    newThisMonth: 0,
  },
  
  // Questions
  questions: [],
  questionCategories: [
    'Technical',
    'Behavioral',
    'Problem Solving',
    'Communication',
    'Leadership',
    'JavaScript',
    'React',
    'Node.js',
    'Python',
    'Data Structures',
    'Algorithms'
  ],
  
  // Results
  results: [],
  resultsStats: {
    totalResults: 0,
    averageScore: 0,
    passRate: 0,
    avgDuration: 0,
  },
  
  // System
  systemSettings: {},
  systemHealth: {},

  // Actions
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  clearError: () => set({ error: null }),

  // Dashboard Actions
  fetchDashboardStats: async () => {
    set({ loading: true, error: null });
    try {
      const stats = await adminAPI.getDashboardStats();
      set({ stats, loading: false });
    } catch (error) {
      set({ error: error.message, loading: false });
    }
  },

  fetchRecentActivities: async () => {
    try {
      const activities = await adminAPI.getRecentActivities();
      set({ recentActivities: activities });
    } catch (error) {
      set({ error: error.message });
    }
  },

  // User Management Actions
  fetchUsers: async (page = 1, limit = 50, filters = {}) => {
    set({ loading: true, error: null });
    try {
      const response = await adminAPI.getAllUsers(page, limit, filters);
      set({ users: response.users || [], loading: false });
    } catch (error) {
      set({ error: error.message, loading: false });
    }
  },

  fetchUserStats: async () => {
    try {
      const userStats = await adminAPI.getUserStats();
      set({ userStats });
    } catch (error) {
      set({ error: error.message });
    }
  },

  updateUserRole: async (userId, role) => {
    try {
      await adminAPI.updateUserRole(userId, role);
      // Update local state
      set((state) => ({
        users: state.users.map(user => 
          user._id === userId ? { ...user, role } : user
        )
      }));
    } catch (error) {
      set({ error: error.message });
      throw error;
    }
  },

  toggleUserStatus: async (userId, status) => {
    try {
      await adminAPI.toggleUserStatus(userId, status);
      // Update local state
      set((state) => ({
        users: state.users.map(user => 
          user._id === userId ? { ...user, isActive: status === 'active' } : user
        )
      }));
    } catch (error) {
      set({ error: error.message });
      throw error;
    }
  },

  deleteUser: async (userId) => {
    try {
      await adminAPI.deleteUser(userId);
      // Remove from local state
      set((state) => ({
        users: state.users.filter(user => user._id !== userId)
      }));
    } catch (error) {
      set({ error: error.message });
      throw error;
    }
  },

  // Question Management Actions
  fetchQuestions: async (page = 1, limit = 50, filters = {}) => {
    set({ loading: true, error: null });
    try {
      const response = await adminAPI.getAllQuestions(page, limit, filters);
      set({ questions: response.questions || [], loading: false });
    } catch (error) {
      set({ error: error.message, loading: false });
    }
  },

  createQuestion: async (questionData) => {
    try {
      const newQuestion = await adminAPI.createQuestion(questionData);
      set((state) => ({
        questions: [newQuestion, ...state.questions]
      }));
      return newQuestion;
    } catch (error) {
      set({ error: error.message });
      throw error;
    }
  },

  updateQuestion: async (questionId, questionData) => {
    try {
      const updatedQuestion = await adminAPI.updateQuestion(questionId, questionData);
      set((state) => ({
        questions: state.questions.map(question => 
          question._id === questionId ? updatedQuestion : question
        )
      }));
      return updatedQuestion;
    } catch (error) {
      set({ error: error.message });
      throw error;
    }
  },

  deleteQuestion: async (questionId) => {
    try {
      await adminAPI.deleteQuestion(questionId);
      set((state) => ({
        questions: state.questions.filter(question => question._id !== questionId)
      }));
    } catch (error) {
      set({ error: error.message });
      throw error;
    }
  },

  generateQuestionSet: async (criteria) => {
    try {
      const questionSet = await adminAPI.generateQuestionSet(criteria);
      return questionSet;
    } catch (error) {
      set({ error: error.message });
      throw error;
    }
  },

  // Results Management Actions
  fetchResults: async (page = 1, limit = 50, filters = {}) => {
    set({ loading: true, error: null });
    try {
      const response = await adminAPI.getAllResults(page, limit, filters);
      set({ results: response.results || [], loading: false });
    } catch (error) {
      set({ error: error.message, loading: false });
    }
  },

  fetchResultsStats: async () => {
    try {
      const resultsStats = await adminAPI.getResultsStats();
      set({ resultsStats });
    } catch (error) {
      set({ error: error.message });
    }
  },

  // System Actions
  fetchSystemSettings: async () => {
    set({ loading: true, error: null });
    try {
      const systemSettings = await adminAPI.getSystemSettings();
      set({ systemSettings, loading: false });
    } catch (error) {
      set({ error: error.message, loading: false });
    }
  },

  updateSystemSettings: async (settings) => {
    try {
      const updatedSettings = await adminAPI.updateSystemSettings(settings);
      set({ systemSettings: updatedSettings });
      return updatedSettings;
    } catch (error) {
      set({ error: error.message });
      throw error;
    }
  },

  fetchSystemHealth: async () => {
    try {
      const systemHealth = await adminAPI.getSystemHealth();
      set({ systemHealth });
    } catch (error) {
      set({ error: error.message });
    }
  },

  // Utility Actions
  exportData: async (type, filters = {}) => {
    try {
      let response;
      switch (type) {
        case 'users':
          response = await adminAPI.exportUsers(filters);
          break;
        case 'questions':
          response = await adminAPI.exportQuestions(filters);
          break;
        case 'results':
          response = await adminAPI.exportResults(filters);
          break;
        default:
          throw new Error('Invalid export type');
      }
      
      // Create download link
      const url = window.URL.createObjectURL(new Blob([response]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${type}_export_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      set({ error: error.message });
      throw error;
    }
  },

  // Mock data generation for development
  generateMockData: () => {
    set({
      stats: {
        totalUsers: 1247,
        activeInterviews: 23,
        completedInterviews: 8934,
        totalQuestions: 456,
      },
      userStats: {
        totalUsers: 1247,
        activeUsers: 1156,
        adminUsers: 5,
        newThisMonth: 67,
      },
      recentActivities: [
        {
          type: 'user',
          title: 'New user registration: John Doe',
          time: '2 minutes ago',
          color: 'bg-blue-100'
        },
        {
          type: 'interview',
          title: 'Interview completed by Sarah Wilson',
          time: '15 minutes ago',
          color: 'bg-green-100'
        },
        {
          type: 'question',
          title: 'New question added to JavaScript category',
          time: '1 hour ago',
          color: 'bg-purple-100'
        },
        {
          type: 'result',
          title: 'High score achieved: 95% by Mike Johnson',
          time: '2 hours ago',
          color: 'bg-yellow-100'
        },
        {
          type: 'user',
          title: 'User role updated: Emily Chen promoted to Admin',
          time: '3 hours ago',
          color: 'bg-blue-100'
        }
      ],
      users: [
        {
          _id: '1',
          firstName: 'Demo',
          lastName: 'User',
          email: 'demo@interviewx.com',
          role: 'candidate',
          isActive: true,
          totalInterviews: 5,
          averageScore: 82,
          createdAt: new Date(Date.now() - 86400000 * 30).toISOString(),
          lastLogin: new Date(Date.now() - 86400000).toISOString(),
        },
        {
          _id: '2',
          firstName: 'Admin',
          lastName: 'User',
          email: 'admin@interviewx.com',
          role: 'admin',
          isActive: true,
          totalInterviews: 0,
          averageScore: 0,
          createdAt: new Date(Date.now() - 86400000 * 60).toISOString(),
          lastLogin: new Date().toISOString(),
        }
      ],
      questions: [
        {
          _id: '1',
          text: 'What is closure in JavaScript?',
          category: 'JavaScript',
          difficulty: 'Medium',
          type: 'Text Answer',
          timeLimit: 300,
          usageCount: 45,
          createdAt: new Date(Date.now() - 86400000 * 10).toISOString(),
        },
        {
          _id: '2',
          text: 'Explain the difference between let, const, and var',
          category: 'JavaScript',
          difficulty: 'Easy',
          type: 'Text Answer',
          timeLimit: 240,
          usageCount: 78,
          createdAt: new Date(Date.now() - 86400000 * 15).toISOString(),
        },
        {
          _id: '3',
          text: 'What is the output of the following code?',
          category: 'JavaScript',
          difficulty: 'Hard',
          type: 'Multiple Choice',
          timeLimit: 180,
          options: [
            'undefined',
            'null',
            'ReferenceError',
            'TypeError'
          ],
          correctAnswer: 2,
          usageCount: 23,
          createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
        }
      ],
      systemHealth: {
        apiServer: 'online',
        database: 'connected',
        aiServices: 'running',
        storage: 85
      }
    });
  }
}));

export { useAdminStore };