// frontend/src/App.jsx - Updated with admin store initialization
import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useUserStore } from './store/userStore';
import { useAdminStore } from './store/adminStore';

// Import components
import Header from './components/layout/Header';
import Footer from './components/layout/Footer';
import LoadingSpinner from './components/ui/LoadingSpinner';

// Import pages
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import Interview from './pages/Interview';
import Results from './pages/Results';

// Import admin pages
import AdminDashboard from './pages/Admin/AdminDashboard';
import QuestionManagement from './pages/Admin/QuestionManagement';
import UserManagement from './pages/Admin/UserManagement';
import ResultsManagement from './pages/Admin/ResultsManagement';
import SystemSettings from './pages/Admin/SystemSettings';

// Import styles
import './index.css';

function App() {
  const { 
    isAuthenticated, 
    isLoading, 
    user, 
    initializeFromStorage, 
    validateToken 
  } = useUserStore();

  const { generateMockData } = useAdminStore();

  useEffect(() => {
    // Initialize user data from localStorage on app start
    initializeFromStorage();
    
    // Initialize admin mock data for development
    if (process.env.NODE_ENV === 'development') {
      generateMockData();
    }
  }, [initializeFromStorage, generateMockData]);

  useEffect(() => {
    // Validate token when user is authenticated
    if (isAuthenticated && user) {
      validateToken();
    }
  }, [isAuthenticated, user, validateToken]);

  // Protected Route Component
  const ProtectedRoute = ({ children }) => {
    if (!isAuthenticated) {
      return <Navigate to="/login" replace />;
    }
    return children;
  };

  // Admin Route Component
  const AdminRoute = ({ children }) => {
    if (!isAuthenticated) {
      return <Navigate to="/login" replace />;
    }
    if (user?.role !== 'admin') {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <div className="text-6xl mb-4">🚫</div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
            <p className="text-gray-600 mb-4">You need admin privileges to access this page.</p>
            <button
              onClick={() => window.history.back()}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
            >
              Go Back
            </button>
          </div>
        </div>
      );
    }
    return children;
  };

  // Public Route Component (redirect to appropriate dashboard if authenticated)
  const PublicRoute = ({ children }) => {
    if (isAuthenticated) {
      if (user?.role === 'admin') {
        return <Navigate to="/admin" replace />;
      }
      return <Navigate to="/dashboard" replace />;
    }
    return children;
  };

  // Show loading spinner during initial load
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <LoadingSpinner size="lg" text="Loading InterviewX..." />
      </div>
    );
  }

  return (
    <Router>
      <div className="min-h-screen bg-gray-50 flex flex-col">
        {/* Header - Show on all pages */}
        <Header />
        
        {/* Main content */}
        <main className="flex-1">
          <Routes>
            {/* Public Routes */}
            <Route 
              path="/" 
              element={
                <PublicRoute>
                  <Home />
                </PublicRoute>
              } 
            />
            <Route 
              path="/login" 
              element={
                <PublicRoute>
                  <Login />
                </PublicRoute>
              } 
            />
            <Route 
              path="/register" 
              element={
                <PublicRoute>
                  <Register />
                </PublicRoute>
              } 
            />

            {/* Protected User Routes */}
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/profile" 
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/interview" 
              element={
                <ProtectedRoute>
                  <Interview />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/interview/:id" 
              element={
                <ProtectedRoute>
                  <Interview />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/results" 
              element={
                <ProtectedRoute>
                  <Results />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/results/:id" 
              element={
                <ProtectedRoute>
                  <Results />
                </ProtectedRoute>
              } 
            />

            {/* Admin Routes */}
            <Route 
              path="/admin" 
              element={
                <AdminRoute>
                  <AdminDashboard />
                </AdminRoute>
              } 
            />
            <Route 
              path="/admin/questions" 
              element={
                <AdminRoute>
                  <QuestionManagement />
                </AdminRoute>
              } 
            />
            <Route 
              path="/admin/users" 
              element={
                <AdminRoute>
                  <UserManagement />
                </AdminRoute>
              } 
            />
            <Route 
              path="/admin/results" 
              element={
                <AdminRoute>
                  <ResultsManagement />
                </AdminRoute>
              } 
            />
            <Route 
              path="/admin/settings" 
              element={
                <AdminRoute>
                  <SystemSettings />
                </AdminRoute>
              } 
            />

            {/* Catch all route - 404 */}
            <Route 
              path="*" 
              element={
                <div className="min-h-screen flex items-center justify-center">
                  <div className="text-center">
                    <h1 className="text-6xl font-bold text-gray-900 mb-4">404</h1>
                    <p className="text-xl text-gray-600 mb-8">Page not found</p>
                    <button
                      onClick={() => window.history.back()}
                      className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                    >
                      Go Back
                    </button>
                  </div>
                </div>
              } 
            />
          </Routes>
        </main>

        {/* Footer - Show on all pages */}
        <Footer />
      </div>
    </Router>
  );
}

export default App;