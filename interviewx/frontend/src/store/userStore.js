// frontend/src/store/userStore.js
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { authAPI, profileAPI } from '../services/api';

const useUserStore = create(
  persist(
    (set, get) => ({
      // State
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      
      // Profile-specific state
      profileLoading: false,
      uploadProgress: 0,
      lastProfileUpdate: null,

      // Actions
      setUser: (user) => set({ user, isAuthenticated: !!user }),
      
      setToken: (token) => set({ token, isAuthenticated: !!token }),
      
      setLoading: (isLoading) => set({ isLoading }),
      
      setError: (error) => set({ error }),
      
      clearError: () => set({ error: null }),

      // Authentication actions
      login: async (credentials) => {
        set({ isLoading: true, error: null });
        try {
          const response = await authAPI.login(credentials);
          const { user, token } = response;
          
          set({
            user,
            token,
            isAuthenticated: true,
            isLoading: false,
            error: null
          });
          
          // Store token in localStorage
          localStorage.setItem('token', token);
          localStorage.setItem('user', JSON.stringify(user));
          
          return { success: true, user };
        } catch (error) {
          set({
            isLoading: false,
            error: error.message,
            isAuthenticated: false,
            user: null,
            token: null
          });
          
          // Clear localStorage on error
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          
          return { success: false, error: error.message };
        }
      },

      register: async (userData) => {
        set({ isLoading: true, error: null });
        try {
          const response = await authAPI.register(userData);
          const { user, token } = response;
          
          set({
            user,
            token,
            isAuthenticated: true,
            isLoading: false,
            error: null
          });
          
          // Store token in localStorage
          localStorage.setItem('token', token);
          localStorage.setItem('user', JSON.stringify(user));
          
          return { success: true, user };
        } catch (error) {
          set({
            isLoading: false,
            error: error.message,
            isAuthenticated: false,
            user: null,
            token: null
          });
          
          return { success: false, error: error.message };
        }
      },

      logout: async () => {
        set({ isLoading: true });
        try {
          await authAPI.logout();
        } catch (error) {
          console.error('Logout error:', error);
        } finally {
          // Clear state regardless of API response
          set({
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,
            profileLoading: false,
            uploadProgress: 0
          });
          
          // Clear localStorage
          localStorage.removeItem('token');
          localStorage.removeItem('user');
        }
      },

      // Profile actions
      updateUser: (userData) => {
        const currentUser = get().user;
        const updatedUser = { ...currentUser, ...userData };
        
        set({ 
          user: updatedUser,
          lastProfileUpdate: new Date().toISOString()
        });
        
        // Update localStorage
        localStorage.setItem('user', JSON.stringify(updatedUser));
      },

      fetchProfile: async () => {
        set({ profileLoading: true, error: null });
        try {
          const response = await profileAPI.getProfile();
          const { user } = response;
          
          set({
            user,
            profileLoading: false,
            error: null,
            lastProfileUpdate: new Date().toISOString()
          });
          
          // Update localStorage
          localStorage.setItem('user', JSON.stringify(user));
          
          return { success: true, user };
        } catch (error) {
          set({
            profileLoading: false,
            error: error.message
          });
          
          return { success: false, error: error.message };
        }
      },

      updateProfile: async (profileData) => {
        set({ profileLoading: true, error: null });
        try {
          const response = await profileAPI.updateProfile(profileData);
          const { user } = response;
          
          set({
            user,
            profileLoading: false,
            error: null,
            lastProfileUpdate: new Date().toISOString()
          });
          
          // Update localStorage
          localStorage.setItem('user', JSON.stringify(user));
          
          return { success: true, user };
        } catch (error) {
          set({
            profileLoading: false,
            error: error.message
          });
          
          return { success: false, error: error.message };
        }
      },

      uploadProfileImage: async (formData, onProgress) => {
        set({ profileLoading: true, error: null, uploadProgress: 0 });
        try {
          // Create a custom axios config for upload progress
          const response = await profileAPI.uploadProfileImage(formData);
          
          // Update user with new profile image
          const currentUser = get().user;
          const updatedUser = {
            ...currentUser,
            profileImage: response.profileImageUrl
          };
          
          set({
            user: updatedUser,
            profileLoading: false,
            uploadProgress: 100,
            lastProfileUpdate: new Date().toISOString()
          });
          
          // Update localStorage
          localStorage.setItem('user', JSON.stringify(updatedUser));
          
          // Reset progress after a delay
          setTimeout(() => {
            set({ uploadProgress: 0 });
          }, 2000);
          
          return { success: true, profileImageUrl: response.profileImageUrl };
        } catch (error) {
          set({
            profileLoading: false,
            error: error.message,
            uploadProgress: 0
          });
          
          return { success: false, error: error.message };
        }
      },

      uploadResume: async (formData) => {
        set({ profileLoading: true, error: null, uploadProgress: 0 });
        try {
          const response = await profileAPI.uploadResume(formData);
          
          // Update user with new resume
          const currentUser = get().user;
          const updatedUser = {
            ...currentUser,
            resumeUrl: response.resumeUrl,
            resumeFileName: response.resumeFileName
          };
          
          set({
            user: updatedUser,
            profileLoading: false,
            uploadProgress: 100,
            lastProfileUpdate: new Date().toISOString()
          });
          
          // Update localStorage
          localStorage.setItem('user', JSON.stringify(updatedUser));
          
          // Reset progress after a delay
          setTimeout(() => {
            set({ uploadProgress: 0 });
          }, 2000);
          
          return { success: true, resumeUrl: response.resumeUrl };
        } catch (error) {
          set({
            profileLoading: false,
            error: error.message,
            uploadProgress: 0
          });
          
          return { success: false, error: error.message };
        }
      },

      deleteProfileImage: async () => {
        set({ profileLoading: true, error: null });
        try {
          await profileAPI.deleteProfileImage();
          
          // Update user to remove profile image
          const currentUser = get().user;
          const updatedUser = {
            ...currentUser,
            profileImage: null
          };
          
          set({
            user: updatedUser,
            profileLoading: false,
            lastProfileUpdate: new Date().toISOString()
          });
          
          // Update localStorage
          localStorage.setItem('user', JSON.stringify(updatedUser));
          
          return { success: true };
        } catch (error) {
          set({
            profileLoading: false,
            error: error.message
          });
          
          return { success: false, error: error.message };
        }
      },

      deleteResume: async () => {
        set({ profileLoading: true, error: null });
        try {
          await profileAPI.deleteResume();
          
          // Update user to remove resume
          const currentUser = get().user;
          const updatedUser = {
            ...currentUser,
            resumeUrl: null,
            resumeFileName: null
          };
          
          set({
            user: updatedUser,
            profileLoading: false,
            lastProfileUpdate: new Date().toISOString()
          });
          
          // Update localStorage
          localStorage.setItem('user', JSON.stringify(updatedUser));
          
          return { success: true };
        } catch (error) {
          set({
            profileLoading: false,
            error: error.message
          });
          
          return { success: false, error: error.message };
        }
      },

      // Utility methods
      refreshUserData: async () => {
        return get().fetchProfile();
      },

      isProfileComplete: () => {
        const user = get().user;
        if (!user) return false;
        
        const requiredFields = ['firstName', 'lastName', 'email'];
        const recommendedFields = ['phone', 'jobTitle', 'skills', 'about'];
        
        const hasRequiredFields = requiredFields.every(field => user[field]);
        const hasRecommendedFields = recommendedFields.some(field => 
          user[field] && (Array.isArray(user[field]) ? user[field].length > 0 : true)
        );
        
        return hasRequiredFields && hasRecommendedFields;
      },

      getProfileCompletionPercentage: () => {
        const user = get().user;
        if (!user) return 0;
        
        const allFields = [
          'firstName', 'lastName', 'email', 'phone', 'location',
          'jobTitle', 'experience', 'skills', 'education', 'about',
          'profileImage', 'resumeUrl'
        ];
        
        const filledFields = allFields.filter(field => {
          const value = user[field];
          if (Array.isArray(value)) return value.length > 0;
          return value !== null && value !== undefined && value !== '';
        });
        
        return Math.round((filledFields.length / allFields.length) * 100);
      },

      // Initialize from localStorage
      initializeFromStorage: () => {
        const token = localStorage.getItem('token');
        const userStr = localStorage.getItem('user');
        
        if (token && userStr) {
          try {
            const user = JSON.parse(userStr);
            set({
              user,
              token,
              isAuthenticated: true,
              isLoading: false
            });
          } catch (error) {
            console.error('Error parsing stored user data:', error);
            localStorage.removeItem('token');
            localStorage.removeItem('user');
          }
        }
      },

      // Check if token is valid
      validateToken: async () => {
        const token = get().token;
        if (!token) return false;
        
        try {
          await profileAPI.getProfile();
          return true;
        } catch (error) {
          // Token is invalid, clear auth state
          get().logout();
          return false;
        }
      }
    }),
    {
      name: 'user-store',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
        lastProfileUpdate: state.lastProfileUpdate
      })
    }
  )
);

export { useUserStore };

