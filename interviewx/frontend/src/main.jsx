// frontend/src/main.jsx - FIXED VERSION
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';

// Initialize user authentication check after app renders
import { useUserStore } from './store/userStore';

// Check authentication after the store is created
const initializeAuth = () => {
  try {
    const { checkAuth } = useUserStore.getState();
    if (checkAuth) {
      checkAuth();
    }
  } catch (error) {
    console.log('Auth initialization skipped:', error.message);
  }
};

// Render the app
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Initialize auth after a short delay to ensure stores are ready
setTimeout(initializeAuth, 100);