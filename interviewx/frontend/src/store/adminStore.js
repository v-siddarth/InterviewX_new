// // frontend/src/store/adminStore.js
// import { create } from 'zustand';
// import { persist } from 'zustand/middleware';
// import { adminAPI } from '../services/api';

// const useAdminStore = create(
//   persist(
//     (set, get) => ({
//       // Dashboard State
//       dashboardStats: {
//         totalUsers: 0,
//         activeInterviews: 0,
//         completedInterviews: 0,
//         totalQuestions: 0
//       },
//       recentActivities: [],
//       dashboardLoading: false,
      
//       // Users State
//       users: [],
//       userStats: {
//         totalUsers: 0,
//         activeUsers: 0,
//         adminUsers: 0,
//         newThisMonth: 0
//       },
//       usersLoading: false,
//       usersPagination: {
//         page: 1,
//         totalPages: 1,
//         total: 0,
//         limit: 10
//       },
      
//       // Questions State
//       questions: [],
//       questionsLoading: false,
//       questionsPagination: {
//         page: 1,
//         totalPages: 1,
//         total: 0,
//         limit: 20
//       },
//       questionCategories: [],
      
//       // Results State
//       results: [],
//       resultsStats: {
//         totalResults: 0,
//         averageScore: 0,
//         passRate: 0,
//         avgDuration: 0
//       },
//       resultsLoading: false,
//       resultsPagination: {
//         page: 1,
//         totalPages: 1,
//         total: 0,
//         limit: 20
//       },
      
//       // Settings State
//       systemSettings: null,
//       settingsLoading: false,
      
//       // System State
//       systemHealth: null,
//       systemLogs: [],
      
//       // Loading States
//       isLoading: false,
//       error: null,

//       // Actions
//       setError: (error) => set({ error }),
//       clearError: () => set({ error: null }),
//       setLoading: (isLoading) => set({ isLoading }),

//       // Dashboard Actions
//       fetchDashboardStats: async () => {
//         set({ dashboardLoading: true, error: null });
//         try {
//           const stats = await adminAPI.getDashboardStats();
//           const activities = await adminAPI.getRecentActivities();
          
//           set({
//             dashboardStats: stats,
//             recentActivities: activities,
//             dashboardLoading: false
//           });
          
//           return { success: true };
//         } catch (error) {
//           set({
//             dashboardLoading: false,
//             error: error.message || 'Failed to fetch dashboard stats'
//           });
//           return { success: false, error: error.message };
//         }
//       },

//       // User Management Actions
//       fetchUsers: async (page = 1, filters = {}) => {
//         set({ usersLoading: true, error: null });
//         try {
//           const response = await adminAPI.getAllUsers(page, 10, filters);
          
//           set({
//             users: response.users,
//             usersPagination: {
//               page: response.currentPage,
//               totalPages: response.totalPages,
//               total: response.total,
//               limit: 10
//             },
//             usersLoading: false
//           });
          
//           return { success: true };
//         } catch (error) {
//           set({
//             usersLoading: false,
//             error: error.message || 'Failed to fetch users'
//           });
//           return { success: false, error: error.message };
//         }
//       },

//       fetchUserStats: async () => {
//         try {
//           const stats = await adminAPI.getUserStats();
//           set({ userStats: stats });
//           return { success: true };
//         } catch (error) {
//           set({ error: error.message || 'Failed to fetch user stats' });
//           return { success: false, error: error.message };
//         }
//       },

//       updateUserRole: async (userId, role) => {
//         set({ isLoading: true, error: null });
//         try {
//           await adminAPI.updateUserRole(userId, role);
          
//           // Update local state
//           const users = get().users.map(user => 
//             user._id === userId ? { ...user, role } : user
//           );
          
//           set({ users, isLoading: false });
//           return { success: true };
//         } catch (error) {
//           set({
//             isLoading: false,
//             error: error.message || 'Failed to update user role'
//           });
//           return { success: false, error: error.message };
//         }
//       },

//       toggleUserStatus: async (userId, status) => {
//         set({ isLoading: true, error: null });
//         try {
//           await adminAPI.toggleUserStatus(userId, status);
          
//           // Update local state
//           const users = get().users.map(user => 
//             user._id === userId ? { ...user, isActive: status === 'active' } : user
//           );
          
//           set({ users, isLoading: false });
//           return { success: true };
//         } catch (error) {
//           set({
//             isLoading: false,
//             error: error.message || 'Failed to update user status'
//           });
//           return { success: false, error: error.message };
//         }
//       },

//       deleteUser: async (userId) => {
//         set({ isLoading: true, error: null });
//         try {
//           await adminAPI.deleteUser(userId);
          
//           // Remove from local state
//           const users = get().users.filter(user => user._id !== userId);
          
//           set({ users, isLoading: false });
//           return { success: true };
//         } catch (error) {
//           set({
//             isLoading: false,
//             error: error.message || 'Failed to delete user'
//           });
//           return { success: false, error: error.message };
//         }
//       },

//       // Question Management Actions
//       fetchQuestions: async (page = 1, filters = {}) => {
//         set({ questionsLoading: true, error: null });
//         try {
//           const response = await adminAPI.getAllQuestions(page, 20, filters);
          
//           set({
//             questions: response.questions,
//             questionsPagination: {
//               page: response.currentPage,
//               totalPages: response.totalPages,
//               total: response.total,
//               limit: 20
//             },
//             questionsLoading: false
//           });
          
//           return { success: true };
//         } catch (error) {
//           set({
//             questionsLoading: false,
//             error: error.message || 'Failed to fetch questions'
//           });
//           return { success: false, error: error.message };
//         }
//       },

//       fetchQuestionCategories: async () => {
//         try {
//           const categories = await adminAPI.getQuestionCategories();
//           set({ questionCategories: categories });
//           return { success: true };
//         } catch (error) {
//           set({ error: error.message || 'Failed to fetch categories' });
//           return { success: false, error: error.message };
//         }
//       },

//       createQuestion: async (questionData) => {
//         set({ isLoading: true, error: null });
//         try {
//           const newQuestion = await adminAPI.createQuestion(questionData);
          
//           // Add to local state
//           const questions = [newQuestion, ...get().questions];
          
//           set({ questions, isLoading: false });
//           return { success: true, question: newQuestion };
//         } catch (error) {
//           set({
//             isLoading: false,
//             error: error.message || 'Failed to create question'
//           });
//           return { success: false, error: error.message };
//         }
//       },

//       updateQuestion: async (questionId, questionData) => {
//         set({ isLoading: true, error: null });
//         try {
//           const updatedQuestion = await adminAPI.updateQuestion(questionId, questionData);
          
//           // Update local state
//           const questions = get().questions.map(question => 
//             question._id === questionId ? updatedQuestion : question
//           );
          
//           set({ questions, isLoading: false });
//           return { success: true, question: updatedQuestion };
//         } catch (error) {
//           set({
//             isLoading: false,
//             error: error.message || 'Failed to update question'
//           });
//           return { success: false, error: error.message };
//         }
//       },

//       deleteQuestion: async (questionId) => {
//         set({ isLoading: true, error: null });
//         try {
//           await adminAPI.deleteQuestion(questionId);
          
//           // Remove from local state
//           const questions = get().questions.filter(question => question._id !== questionId);
          
//           set({ questions, isLoading: false });
//           return { success: true };
//         } catch (error) {
//           set({
//             isLoading: false,
//             error: error.message || 'Failed to delete question'
//           });
//           return { success: false, error: error.message };
//         }
//       },

//       bulkDeleteQuestions: async (questionIds) => {
//         set({ isLoading: true, error: null });
//         try {
//           await adminAPI.bulkDeleteQuestions(questionIds);
          
//           // Remove from local state
//           const questions = get().questions.filter(question => !questionIds.includes(question._id));
          
//           set({ questions, isLoading: false });
//           return { success: true };
//         } catch (error) {
//           set({
//             isLoading: false,
//             error: error.message || 'Failed to delete questions'
//           });
//           return { success: false, error: error.message };
//         }
//       },

//       // Results Management Actions
//       fetchResults: async (page = 1, filters = {}) => {
//         set({ resultsLoading: true, error: null });
//         try {
//           const response = await adminAPI.getAllResults(page, 20, filters);
          
//           set({
//             results: response.results,
//             resultsPagination: {
//               page: response.currentPage,
//               totalPages: response.totalPages,
//               total: response.total,
//               limit: 20
//             },
//             resultsLoading: false
//           });
          
//           return { success: true };
//         } catch (error) {
//           set({
//             resultsLoading: false,
//             error: error.message || 'Failed to fetch results'
//           });
//           return { success: false, error: error.message };
//         }
//       },

//       fetchResultsStats: async () => {
//         try {
//           const stats = await adminAPI.getResultsStats();
//           set({ resultsStats: stats });
//           return { success: true };
//         } catch (error) {
//           set({ error: error.message || 'Failed to fetch results stats' });
//           return { success: false, error: error.message };
//         }
//       },

//       // Settings Actions
//       fetchSystemSettings: async () => {
//         set({ settingsLoading: true, error: null });
//         try {
//           const settings = await adminAPI.getSystemSettings();
          
//           set({
//             systemSettings: settings,
//             settingsLoading: false
//           });
          
//           return { success: true };
//         } catch (error) {
//           set({
//             settingsLoading: false,
//             error: error.message || 'Failed to fetch system settings'
//           });
//           return { success: false, error: error.message };
//         }
//       },

//       updateSystemSettings: async (settings) => {
//         set({ settingsLoading: true, error: null });
//         try {
//           const updatedSettings = await adminAPI.updateSystemSettings(settings);
          
//           set({
//             systemSettings: updatedSettings.settings,
//             settingsLoading: false
//           });
          
//           return { success: true };
//         } catch (error) {
//           set({
//             settingsLoading: false,
//             error: error.message || 'Failed to update system settings'
//           });
//           return { success: false, error: error.message };
//         }
//       },

//       // System Health Actions
//       fetchSystemHealth: async () => {
//         try {
//           const health = await adminAPI.getSystemHealth();
//           set({ systemHealth: health });
//           return { success: true };
//         } catch (error) {
//           set({ error: error.message || 'Failed to fetch system health' });
//           return { success: false, error: error.message };
//         }
//       },

//       fetchSystemLogs: async (page = 1, level = 'all') => {
//         try {
//           const response = await adminAPI.getSystemLogs(page, level);
//           set({ systemLogs: response.logs });
//           return { success: true };
//         } catch (error) {
//           set({ error: error.message || 'Failed to fetch system logs' });
//           return { success: false, error: error.message };
//         }
//       },

//       // Export Actions
//       exportUsers: async (format = 'csv') => {
//         set({ isLoading: true, error: null });
//         try {
//           const blob = await adminAPI.exportUsers({ format });
          
//           // Create download link
//           const url = window.URL.createObjectURL(blob);
//           const link = document.createElement('a');
//           link.href = url;
//           link.download = `users.${format}`;
//           document.body.appendChild(link);
//           link.click();
//           link.remove();
//           window.URL.revokeObjectURL(url);
          
//           set({ isLoading: false });
//           return { success: true };
//         } catch (error) {
//           set({
//             isLoading: false,
//             error: error.message || 'Failed to export users'
//           });
//           return { success: false, error: error.message };
//         }
//       },

//       exportQuestions: async (format = 'csv', filters = {}) => {
//         set({ isLoading: true, error: null });
//         try {
//           const blob = await adminAPI.exportQuestions({ format, ...filters });
          
//           // Create download link
//           const url = window.URL.createObjectURL(blob);
//           const link = document.createElement('a');
//           link.href = url;
//           link.download = `questions.${format}`;
//           document.body.appendChild(link);
//           link.click();
//           link.remove();
//           window.URL.revokeObjectURL(url);
          
//           set({ isLoading: false });
//           return { success: true };
//         } catch (error) {
//           set({
//             isLoading: false,
//             error: error.message || 'Failed to export questions'
//           });
//           return { success: false, error: error.message };
//         }
//       },

//       exportResults: async (format = 'csv', filters = {}) => {
//         set({ isLoading: true, error: null });
//         try {
//           const blob = await adminAPI.exportResults({ format, ...filters });
          
//           // Create download link
//           const url = window.URL.createObjectURL(blob);
//           const link = document.createElement('a');
//           link.href = url;
//           link.download = `results.${format}`;
//           document.body.appendChild(link);
//           link.click();
//           link.remove();
//           window.URL.revokeObjectURL(url);
          
//           set({ isLoading: false });
//           return { success: true };
//         } catch (error) {
//           set({
//             isLoading: false,
//             error: error.message || 'Failed to export results'
//           });
//           return { success: false, error: error.message };
//         }
//       },

//       // Analytics Actions
//       fetchPerformanceAnalytics: async (timeframe = '30d') => {
//         set({ isLoading: true, error: null });
//         try {
//           const analytics = await adminAPI.getPerformanceAnalytics(timeframe);
          
//           set({ isLoading: false });
//           return { success: true, data: analytics };
//         } catch (error) {
//           set({
//             isLoading: false,
//             error: error.message || 'Failed to fetch analytics'
//           });
//           return { success: false, error: error.message };
//         }
//       },

//       // Backup Actions
//       createBackup: async () => {
//         set({ isLoading: true, error: null });
//         try {
//           const result = await adminAPI.createBackup();
          
//           set({ isLoading: false });
//           return { success: true, backup: result };
//         } catch (error) {
//           set({
//             isLoading: false,
//             error: error.message || 'Failed to create backup'
//           });
//           return { success: false, error: error.message };
//         }
//       },

//       fetchBackups: async () => {
//         set({ isLoading: true, error: null });
//         try {
//           const backups = await adminAPI.getBackups();
          
//           set({ isLoading: false });
//           return { success: true, backups };
//         } catch (error) {
//           set({
//             isLoading: false,
//             error: error.message || 'Failed to fetch backups'
//           });
//           return { success: false, error: error.message };
//         }
//       },

//       // Email Template Actions
//       fetchEmailTemplates: async () => {
//         set({ isLoading: true, error: null });
//         try {
//           const templates = await adminAPI.getEmailTemplates();
          
//           set({ isLoading: false });
//           return { success: true, templates };
//         } catch (error) {
//           set({
//             isLoading: false,
//             error: error.message || 'Failed to fetch email templates'
//           });
//           return { success: false, error: error.message };
//         }
//       },

//       updateEmailTemplate: async (templateId, template) => {
//         set({ isLoading: true, error: null });
//         try {
//           await adminAPI.updateEmailTemplate(templateId, template);
          
//           set({ isLoading: false });
//           return { success: true };
//         } catch (error) {
//           set({
//             isLoading: false,
//             error: error.message || 'Failed to update email template'
//           });
//           return { success: false, error: error.message };
//         }
//       },

//       sendTestEmail: async (templateId, email) => {
//         set({ isLoading: true, error: null });
//         try {
//           await adminAPI.sendTestEmail(templateId, email);
          
//           set({ isLoading: false });
//           return { success: true };
//         } catch (error) {
//           set({
//             isLoading: false,
//             error: error.message || 'Failed to send test email'
//           });
//           return { success: false, error: error.message };
//         }
//       },

//       // Utility Actions
//       reset: () => {
//         set({
//           dashboardStats: {
//             totalUsers: 0,
//             activeInterviews: 0,
//             completedInterviews: 0,
//             totalQuestions: 0
//           },
//           recentActivities: [],
//           users: [],
//           userStats: {
//             totalUsers: 0,
//             activeUsers: 0,
//             adminUsers: 0,
//             newThisMonth: 0
//           },
//           questions: [],
//           questionCategories: [],
//           results: [],
//           resultsStats: {
//             totalResults: 0,
//             averageScore: 0,
//             passRate: 0,
//             avgDuration: 0
//           },
//           systemSettings: null,
//           systemHealth: null,
//           systemLogs: [],
//           isLoading: false,
//           error: null
//         });
//       },

//       // Generate mock data for development
//       generateMockData: () => {
//         if (process.env.NODE_ENV !== 'development') return;
        
//         const mockStats = {
//           totalUsers: 156,
//           activeInterviews: 12,
//           completedInterviews: 234,
//           totalQuestions: 89
//         };
        
//         const mockActivities = [
//           {
//             type: 'user',
//             title: 'New user registration: John Doe',
//             time: '2 minutes ago',
//             color: 'bg-blue-100'
//           },
//           {
//             type: 'interview',
//             title: 'Interview completed by Sarah Wilson',
//             time: '15 minutes ago',
//             color: 'bg-green-100'
//           },
//           {
//             type: 'question',
//             title: 'New question added to JavaScript category',
//             time: '1 hour ago',
//             color: 'bg-purple-100'
//           }
//         ];
        
//         const mockUserStats = {
//           totalUsers: 156,
//           activeUsers: 143,
//           adminUsers: 5,
//           newThisMonth: 23
//         };
        
//         const mockResultsStats = {
//           totalResults: 234,
//           averageScore: 84.2,
//           passRate: 87,
//           avgDuration: 28 * 60
//         };
        
//         set({
//           dashboardStats: mockStats,
//           recentActivities: mockActivities,
//           userStats: mockUserStats,
//           resultsStats: mockResultsStats
//         });
        
//         console.log('Mock admin data generated for development');
//       }
//     }),
//     {
//       name: 'admin-store',
//       partialize: (state) => ({
//         dashboardStats: state.dashboardStats,
//         userStats: state.userStats,
//         resultsStats: state.resultsStats,
//         questionCategories: state.questionCategories
//       })
//     }
//   )
// );

// export { useAdminStore };




// frontend/src/store/adminStore.js - MINIMAL VERSION
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useAdminStore = create(
  persist(
    (set, get) => ({
      // State
      dashboardStats: {
        totalUsers: 0,
        activeInterviews: 0,
        completedInterviews: 0,
        totalQuestions: 0
      },
      recentActivities: [],
      dashboardLoading: false,
      error: null,
      initialized: false,

      // Actions
      setError: (error) => set({ error }),
      clearError: () => set({ error: null }),

      // Initialize mock data ONCE
      generateMockData: () => {
        const current = get();
        if (current.initialized) return; // Prevent multiple initializations
        
        console.log('Generating mock admin data...');
        
        const mockStats = {
          totalUsers: 156,
          activeInterviews: 12,
          completedInterviews: 234,
          totalQuestions: 89
        };
        
        const mockActivities = [
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
          }
        ];
        
        set({
          dashboardStats: mockStats,
          recentActivities: mockActivities,
          initialized: true
        });
      },

      // Fetch dashboard stats
      fetchDashboardStats: async () => {
        const current = get();
        if (current.dashboardLoading) return; // Prevent multiple calls
        
        set({ dashboardLoading: true, error: null });
        
        try {
          // Mock API call
          await new Promise(resolve => setTimeout(resolve, 500));
          
          const mockStats = {
            totalUsers: 156,
            activeInterviews: 12,
            completedInterviews: 234,
            totalQuestions: 89
          };
          
          const mockActivities = [
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
            }
          ];
          
          set({
            dashboardStats: mockStats,
            recentActivities: mockActivities,
            dashboardLoading: false
          });
          
          return { success: true };
        } catch (error) {
          set({
            dashboardLoading: false,
            error: error.message || 'Failed to fetch dashboard stats'
          });
          return { success: false, error: error.message };
        }
      },

      // Reset store
      reset: () => {
        set({
          dashboardStats: {
            totalUsers: 0,
            activeInterviews: 0,
            completedInterviews: 0,
            totalQuestions: 0
          },
          recentActivities: [],
          dashboardLoading: false,
          error: null,
          initialized: false
        });
      }
    }),
    {
      name: 'admin-store',
      partialize: (state) => ({
        dashboardStats: state.dashboardStats,
        recentActivities: state.recentActivities,
        initialized: state.initialized
      })
    }
  )
);

export { useAdminStore };