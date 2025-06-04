// frontend/src/services/api.js
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

// Create axios instance
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // 30 seconds
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
apiClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    // Handle network errors
    if (!error.response) {
      throw new Error('Network error. Please check your connection.');
    }

    // Handle authentication errors
    if (error.response.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }

    // Handle other errors
    const message = error.response.data?.message || 'An error occurred';
    throw new Error(message);
  }
);

// Utility functions
export const getImageUrl = (path) => {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  if (path.startsWith('data:')) return path;
  return `${API_BASE_URL.replace('/api', '')}${path}`;
};

export const downloadFile = async (url, filename) => {
  try {
    const response = await apiClient.get(url, { responseType: 'blob' });
    const blob = new Blob([response]);
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(downloadUrl);
  } catch (error) {
    throw new Error('Failed to download file');
  }
};

// Auth API
export const authAPI = {
  login: (credentials) => apiClient.post('/auth/login', credentials),
  register: (userData) => apiClient.post('/auth/register', userData),
  logout: () => {
    // Clear local storage and return resolved promise
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    return Promise.resolve({ message: 'Logged out successfully' });
  },
  refreshToken: () => apiClient.post('/auth/refresh'),
  forgotPassword: (email) => apiClient.post('/auth/forgot-password', { email }),
  resetPassword: (token, password) => apiClient.post('/auth/reset-password', { token, password }),
  verifyEmail: (token) => apiClient.post('/auth/verify-email', { token }),
};

// Profile API
export const profileAPI = {
  getProfile: () => apiClient.get('/profile'),
  updateProfile: (profileData) => apiClient.put('/profile', profileData),
  uploadProfileImage: (formData) => {
    return apiClient.post('/profile/upload-image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  uploadResume: (formData) => {
    return apiClient.post('/profile/upload-resume', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  deleteProfileImage: () => apiClient.delete('/profile/image'),
  deleteResume: () => apiClient.delete('/profile/resume'),
  changePassword: (passwordData) => apiClient.put('/profile/password', passwordData),
  getStats: () => apiClient.get('/profile/stats'),
};

// Interview API
export const interviewAPI = {
  getInterviews: (params = {}) => apiClient.get('/interviews', { params }),
  getInterview: (id) => apiClient.get(`/interviews/${id}`),
  createInterview: (interviewData) => apiClient.post('/interviews', interviewData),
  updateInterview: (id, interviewData) => apiClient.put(`/interviews/${id}`, interviewData),
  deleteInterview: (id) => apiClient.delete(`/interviews/${id}`),
  startInterview: (id) => apiClient.post(`/interviews/${id}/start`),
  submitAnswer: (interviewId, questionId, answerData) => 
    apiClient.post(`/interviews/${interviewId}/questions/${questionId}/answer`, answerData),
  completeInterview: (id) => apiClient.post(`/interviews/${id}/complete`),
  getInterviewQuestions: (id) => apiClient.get(`/interviews/${id}/questions`),
  uploadVideo: (interviewId, formData) => {
    return apiClient.post(`/interviews/${interviewId}/upload-video`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  uploadAudio: (interviewId, formData) => {
    return apiClient.post(`/interviews/${interviewId}/upload-audio`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
};

// Evaluation API
export const evaluationAPI = {
  getEvaluation: (interviewId) => apiClient.get(`/evaluations/${interviewId}`),
  getEvaluations: (params = {}) => apiClient.get('/evaluations', { params }),
  startEvaluation: (interviewId) => apiClient.post(`/evaluations/${interviewId}/start`),
  getEvaluationStatus: (interviewId) => apiClient.get(`/evaluations/${interviewId}/status`),
  getFeedback: (interviewId) => apiClient.get(`/evaluations/${interviewId}/feedback`),
  downloadReport: (interviewId) => 
    apiClient.get(`/evaluations/${interviewId}/report`, { responseType: 'blob' }),
};

// Admin API
export const adminAPI = {
  // Dashboard
  getDashboardStats: () => apiClient.get('/admin/dashboard/stats'),
  getRecentActivities: () => apiClient.get('/admin/dashboard/activities'),
  
  // User Management
  getAllUsers: (page = 1, limit = 10, filters = {}) => 
    apiClient.get(`/admin/users?page=${page}&limit=${limit}`, { params: filters }),
  getUserStats: () => apiClient.get('/admin/users/stats'),
  updateUserRole: (userId, role) => 
    apiClient.put(`/admin/users/${userId}/role`, { role }),
  toggleUserStatus: (userId, status) => 
    apiClient.put(`/admin/users/${userId}/status`, { status }),
  deleteUser: (userId) => apiClient.delete(`/admin/users/${userId}`),
  getUserDetails: (userId) => apiClient.get(`/admin/users/${userId}`),
  
  // Question Management
  getAllQuestions: (page = 1, limit = 20, filters = {}) => 
    apiClient.get(`/admin/questions?page=${page}&limit=${limit}`, { params: filters }),
  createQuestion: (questionData) => apiClient.post('/admin/questions', questionData),
  updateQuestion: (questionId, questionData) => 
    apiClient.put(`/admin/questions/${questionId}`, questionData),
  deleteQuestion: (questionId) => apiClient.delete(`/admin/questions/${questionId}`),
  getQuestionCategories: () => apiClient.get('/admin/questions/categories'),
  generateQuestionSet: (criteria) => 
    apiClient.post('/admin/questions/generate-set', criteria),
  bulkDeleteQuestions: (questionIds) => 
    apiClient.delete('/admin/questions/bulk', { data: { questionIds } }),
  importQuestions: (formData) => 
    apiClient.post('/admin/questions/import', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }),
  exportQuestions: (filters = {}) => 
    apiClient.get('/admin/questions/export', { 
      params: filters, 
      responseType: 'blob' 
    }),
  
  // Results Management
  getAllResults: (page = 1, limit = 20, filters = {}) => 
    apiClient.get(`/admin/results?page=${page}&limit=${limit}`, { params: filters }),
  getResultsStats: () => apiClient.get('/admin/results/stats'),
  getResultDetails: (resultId) => apiClient.get(`/admin/results/${resultId}`),
  exportResults: (filters = {}) => 
    apiClient.get('/admin/results/export', { 
      params: filters, 
      responseType: 'blob' 
    }),
  getPerformanceAnalytics: (timeframe = '30d') => 
    apiClient.get(`/admin/analytics/performance?timeframe=${timeframe}`),
  
  // System Settings
  getSystemSettings: () => apiClient.get('/admin/settings'),
  updateSystemSettings: (settings) => apiClient.put('/admin/settings', settings),
  getAIModelSettings: () => apiClient.get('/admin/settings/ai-models'),
  updateAIModelSettings: (settings) => apiClient.put('/admin/settings/ai-models', settings),
  
  // System Health
  getSystemHealth: () => apiClient.get('/admin/system/health'),
  getSystemLogs: (page = 1, level = 'all') => 
    apiClient.get(`/admin/system/logs?page=${page}&level=${level}`),
  
  // Backup & Restore
  createBackup: () => apiClient.post('/admin/backup/create'),
  getBackups: () => apiClient.get('/admin/backup/list'),
  restoreBackup: (backupId) => apiClient.post(`/admin/backup/restore/${backupId}`),
  downloadBackup: (backupId) => 
    apiClient.get(`/admin/backup/download/${backupId}`, { responseType: 'blob' }),
  
  // Email Templates
  getEmailTemplates: () => apiClient.get('/admin/email-templates'),
  updateEmailTemplate: (templateId, template) => 
    apiClient.put(`/admin/email-templates/${templateId}`, template),
  sendTestEmail: (templateId, email) => 
    apiClient.post(`/admin/email-templates/${templateId}/test`, { email }),
};

// Questions API (for public/candidate use)
export const questionsAPI = {
  getPublicQuestions: (category = null, difficulty = null) => {
    const params = {};
    if (category) params.category = category;
    if (difficulty) params.difficulty = difficulty;
    return apiClient.get('/questions', { params });
  },
  getQuestionById: (id) => apiClient.get(`/questions/${id}`),
  getCategories: () => apiClient.get('/questions/categories'),
  getPracticeQuestions: (count = 5, category = null) => {
    const params = { count };
    if (category) params.category = category;
    return apiClient.get('/questions/practice', { params });
  },
};

// WebSocket API helper
export const websocketAPI = {
  connect: (token) => {
    // This would be implemented with socket.io-client
    // For now, return a mock connection
    return {
      on: (event, callback) => console.log(`Listening for ${event}`),
      emit: (event, data) => console.log(`Emitting ${event}`, data),
      disconnect: () => console.log('Disconnected'),
    };
  },
};

// Legacy unified API export (for backward compatibility)
export const api = {
  // Auth methods
  login: authAPI.login,
  register: authAPI.register,
  logout: authAPI.logout,
  
  // Profile methods
  getProfile: profileAPI.getProfile,
  updateProfile: profileAPI.updateProfile,
  uploadProfileImage: profileAPI.uploadProfileImage,
  uploadResume: profileAPI.uploadResume,
  
  // Interview methods
  getInterviews: interviewAPI.getInterviews,
  createInterview: interviewAPI.createInterview,
  startInterview: interviewAPI.startInterview,
  
  // Evaluation methods
  getEvaluation: evaluationAPI.getEvaluation,
  
  // Admin methods
  ...adminAPI,
  
  // Utility methods
  getImageUrl,
  downloadFile,
};

// Default export
export default apiClient;