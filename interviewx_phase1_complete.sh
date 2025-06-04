# InterviewX Phase 1 - Complete Project Foundation & Setup
# Run these commands step by step

echo "🚀 Starting InterviewX Phase 1 - Project Foundation & Setup"
echo "================================================================"

# Step 1.1: Create Project Structure
echo "📁 Step 1.1: Creating project structure..."

#!/bin/bash
# Create root directory
mkdir -p interviewx
cd interviewx

# Frontend Structure
mkdir -p frontend/public
mkdir -p frontend/src/components/interview
mkdir -p frontend/src/components/evaluation  
mkdir -p frontend/src/components/ui
mkdir -p frontend/src/components/layout
mkdir -p frontend/src/pages
mkdir -p frontend/src/hooks
mkdir -p frontend/src/services
mkdir -p frontend/src/utils
mkdir -p frontend/src/store

# Backend Structure
mkdir -p backend/src/controllers
mkdir -p backend/src/middleware
mkdir -p backend/src/models
mkdir -p backend/src/routes
mkdir -p backend/src/services
mkdir -p backend/src/utils
mkdir -p backend/uploads

# AI Models Structure
mkdir -p ai-models/facial-analysis/{models,utils,data}
mkdir -p ai-models/audio-analysis/{models,utils}
mkdir -p ai-models/text-analysis/{utils}

# Config, Scripts, Docs, Tests
mkdir -p config scripts docs tests

echo "✅ Project structure created"

# Step 1.2: Frontend Package Configuration
echo "📦 Step 1.2: Creating frontend configuration..."

cat > frontend/package.json << 'EOF'
{
  "name": "interviewx-frontend",
  "private": true,
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite --host",
    "build": "vite build",
    "lint": "eslint . --ext js,jsx --report-unused-disable-directives --max-warnings 0",
    "preview": "vite preview",
    "test": "vitest"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.8.1",
    "axios": "^1.3.4",
    "socket.io-client": "^4.6.1",
    "zustand": "^4.3.6",
    "framer-motion": "^10.12.4",
    "lucide-react": "^0.263.1",
    "react-webcam": "^7.0.1",
    "recharts": "^2.6.2",
    "react-hot-toast": "^2.4.1",
    "clsx": "^1.2.1"
  },
  "devDependencies": {
    "@types/react": "^18.0.28",
    "@types/react-dom": "^18.0.11",
    "@vitejs/plugin-react": "^4.0.0",
    "autoprefixer": "^10.4.14",
    "eslint": "^8.38.0",
    "eslint-plugin-react": "^7.32.2",
    "eslint-plugin-react-hooks": "^4.6.0",
    "eslint-plugin-react-refresh": "^0.3.4",
    "postcss": "^8.4.23",
    "tailwindcss": "^3.3.2",
    "vite": "^4.3.2",
    "vitest": "^0.30.1"
  }
}
EOF

# Vite Configuration
cat > frontend/vite.config.js << 'EOF'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
    host: true,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
      },
      '/socket.io': {
        target: 'http://localhost:5000',
        ws: true,
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
  test: {
    globals: true,
    environment: 'jsdom',
  },
})
EOF

# Tailwind Configuration
cat > frontend/tailwind.config.js << 'EOF'
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
        },
        secondary: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a',
        },
        success: {
          50: '#f0fdf4',
          500: '#22c55e',
          600: '#16a34a',
        },
        warning: {
          50: '#fffbeb',
          500: '#f59e0b',
          600: '#d97706',
        },
        error: {
          50: '#fef2f2',
          500: '#ef4444',
          600: '#dc2626',
        }
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'bounce-slow': 'bounce 2s infinite',
        'fade-in': 'fadeIn 0.5s ease-in-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
EOF

# PostCSS Configuration
cat > frontend/postcss.config.js << 'EOF'
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
EOF

# Main HTML file
cat > frontend/index.html << 'EOF'
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="description" content="InterviewX - AI-Driven Interview Evaluation Platform" />
    <title>InterviewX - AI Interview Platform</title>
    
    <!-- Preconnect to external domains -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    
    <!-- Inter font -->
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
EOF

# Vite SVG Icon
cat > frontend/public/vite.svg << 'EOF'
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" aria-hidden="true" role="img" class="iconify iconify--logos" width="31.88" height="32" preserveAspectRatio="xMidYMid meet" viewBox="0 0 256 257">
  <defs>
    <linearGradient id="IconifyId1813088fe1fbc01fb466" x1="-.828%" x2="57.636%" y1="7.652%" y2="78.411%">
      <stop offset="0%" stop-color="#41D1FF"></stop>
      <stop offset="100%" stop-color="#BD34FE"></stop>
    </linearGradient>
  </defs>
  <path fill="url(#IconifyId1813088fe1fbc01fb466)" d="M255.153 37.938L134.897 252.976c-2.483 4.44-8.862 4.466-11.382.048L.875 37.958c-2.746-4.814 1.371-10.646 6.827-9.67l120.385 21.517a6.537 6.537 0 0 0 2.322-.004l117.867-21.483c5.438-.991 9.574 4.796 6.877 9.62Z"></path>
</svg>
EOF

# Main CSS file
cat > frontend/src/index.css << 'EOF'
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  * {
    @apply border-border;
  }
  
  body {
    @apply bg-background text-foreground font-sans;
    font-feature-settings: "rlig" 1, "calt" 1;
  }
}

@layer components {
  /* Button Styles */
  .btn-primary {
    @apply bg-primary-600 hover:bg-primary-700 active:bg-primary-800 text-white font-medium py-2 px-4 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2;
  }
  
  .btn-secondary {
    @apply bg-secondary-100 hover:bg-secondary-200 active:bg-secondary-300 text-secondary-700 font-medium py-2 px-4 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-secondary-500 focus:ring-offset-2;
  }
  
  .btn-success {
    @apply bg-success-500 hover:bg-success-600 text-white font-medium py-2 px-4 rounded-lg transition-all duration-200;
  }
  
  .btn-warning {
    @apply bg-warning-500 hover:bg-warning-600 text-white font-medium py-2 px-4 rounded-lg transition-all duration-200;
  }
  
  .btn-error {
    @apply bg-error-500 hover:bg-error-600 text-white font-medium py-2 px-4 rounded-lg transition-all duration-200;
  }
  
  /* Card Styles */
  .card {
    @apply bg-white rounded-xl shadow-lg border border-gray-100 p-6 transition-shadow duration-200 hover:shadow-xl;
  }
  
  .card-compact {
    @apply bg-white rounded-lg shadow border border-gray-100 p-4;
  }
  
  /* Input Styles */
  .input-field {
    @apply w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 disabled:bg-gray-50 disabled:cursor-not-allowed;
  }
  
  .input-error {
    @apply border-error-500 focus:ring-error-500;
  }
  
  /* Loading States */
  .loading-spinner {
    @apply animate-spin rounded-full border-2 border-gray-300 border-t-primary-600;
  }
  
  /* Status Indicators */
  .status-success {
    @apply text-success-600 bg-success-50 border-success-200;
  }
  
  .status-warning {
    @apply text-warning-600 bg-warning-50 border-warning-200;
  }
  
  .status-error {
    @apply text-error-600 bg-error-50 border-error-200;
  }
  
  /* Recording Animations */
  .recording-pulse {
    animation: recordingPulse 1.5s ease-in-out infinite;
  }
  
  @keyframes recordingPulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.3; }
  }
  
  /* Confidence Levels */
  .confidence-high {
    @apply text-success-600 bg-success-50 border-success-200;
  }
  
  .confidence-medium {
    @apply text-warning-600 bg-warning-50 border-warning-200;
  }
  
  .confidence-low {
    @apply text-error-600 bg-error-50 border-error-200;
  }
  
  /* Gradient Backgrounds */
  .gradient-primary {
    background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
  }
  
  .gradient-success {
    background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
  }
}

/* Custom Scrollbar */
::-webkit-scrollbar {
  width: 8px;
}

::-webkit-scrollbar-track {
  @apply bg-gray-100 rounded-lg;
}

::-webkit-scrollbar-thumb {
  @apply bg-gray-300 rounded-lg hover:bg-gray-400;
}

/* Dark mode support (future) */
@media (prefers-color-scheme: dark) {
  :root {
    color-scheme: dark;
  }
}

/* Focus visible for accessibility */
.focus-visible:focus {
  @apply outline-none ring-2 ring-primary-500 ring-offset-2;
}

/* Print styles */
@media print {
  .no-print {
    display: none !important;
  }
}
EOF

# Main React Entry Point
cat > frontend/src/main.jsx << 'EOF'
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

// Error Boundary Component
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null, errorInfo: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true }
  }

  componentDidCatch(error, errorInfo) {
    this.setState({
      error: error,
      errorInfo: errorInfo
    })
    
    // Log error to console in development
    if (import.meta.env.DEV) {
      console.error('React Error Boundary caught an error:', error, errorInfo)
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6 text-center">
            <div className="text-red-500 mb-4">
              <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Oops! Something went wrong</h2>
            <p className="text-gray-600 mb-4">
              We're sorry, but something unexpected happened. Please refresh the page and try again.
            </p>
            <button 
              onClick={() => window.location.reload()}
              className="btn-primary w-full"
            >
              Refresh Page
            </button>
            {import.meta.env.DEV && (
              <details className="mt-4 text-left">
                <summary className="cursor-pointer text-sm text-gray-500">Error Details (Dev Mode)</summary>
                <pre className="mt-2 text-xs bg-gray-100 p-2 rounded overflow-auto">
                  {this.state.error && this.state.error.toString()}
                  <br />
                  {this.state.errorInfo.componentStack}
                </pre>
              </details>
            )}
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

// Render the application
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>,
)
EOF

# Main App Component
cat > frontend/src/App.jsx << 'EOF'
import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'

// Basic Layout for Phase 1
const Header = () => (
  <header className="bg-white shadow-sm border-b border-gray-200">
    <div className="container mx-auto px-4">
      <div className="flex items-center justify-between h-16">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">IX</span>
          </div>
          <span className="text-xl font-bold text-gray-900">InterviewX</span>
        </div>
        <nav className="hidden md:flex items-center space-x-6">
          <a href="/" className="text-gray-600 hover:text-primary-600 transition-colors">
            Home
          </a>
          <a href="#features" className="text-gray-600 hover:text-primary-600 transition-colors">
            Features
          </a>
          <a href="#about" className="text-gray-600 hover:text-primary-600 transition-colors">
            About
          </a>
        </nav>
      </div>
    </div>
  </header>
)

const Footer = () => (
  <footer className="bg-gray-900 text-white py-8">
    <div className="container mx-auto px-4 text-center">
      <p>&copy; 2024 InterviewX. All rights reserved.</p>
      <p className="text-gray-400 text-sm mt-2">AI-Powered Interview Platform</p>
    </div>
  </footer>
)

// Simple Home Page for Phase 1
const HomePage = () => (
  <div className="min-h-screen bg-gray-50">
    {/* Hero Section */}
    <section className="bg-gradient-to-br from-primary-600 via-primary-700 to-primary-800 text-white py-20">
      <div className="container mx-auto px-4 text-center">
        <h1 className="text-4xl md:text-6xl font-bold mb-6">
          Welcome to InterviewX
        </h1>
        <p className="text-xl md:text-2xl mb-8 text-primary-100 max-w-3xl mx-auto">
          AI-Driven Interview Evaluation Platform - Revolutionizing how interviews are conducted and evaluated.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button className="btn-primary text-lg px-8 py-4">
            Get Started
          </button>
          <button className="bg-white text-primary-600 hover:bg-primary-50 text-lg px-8 py-4 rounded-lg font-medium transition-colors">
            Learn More
          </button>
        </div>
      </div>
    </section>

    {/* Features Section */}
    <section className="py-20">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Powered by Advanced AI
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Our platform analyzes facial expressions, voice quality, and answer content to provide comprehensive interview evaluations.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {/* Facial Analysis Feature */}
          <div className="card text-center">
            <div className="text-primary-600 mb-4 flex justify-center">
              <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-3">Facial Analysis</h3>
            <p className="text-gray-600">
              Advanced CNN and MTCNN models analyze facial expressions and confidence levels in real-time.
            </p>
          </div>

          {/* Audio Analysis Feature */}
          <div className="card text-center">
            <div className="text-primary-600 mb-4 flex justify-center">
              <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-3">Voice Analysis</h3>
            <p className="text-gray-600">
              Speech-to-text conversion with voice quality assessment and clarity scoring using advanced algorithms.
            </p>
          </div>

          {/* Text Analysis Feature */}
          <div className="card text-center">
            <div className="text-primary-600 mb-4 flex justify-center">
              <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-3">Answer Evaluation</h3>
            <p className="text-gray-600">
              Gemini Pro powered analysis evaluates answer relevance, quality, and communication effectiveness.
            </p>
          </div>
        </div>
      </div>
    </section>

    {/* Status Section for Phase 1 */}
    <section className="py-16 bg-primary-50">
      <div className="container mx-auto px-4 text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-8">
          Platform Status
        </h2>
        <div className="grid md:grid-cols-2 gap-8 max-w-2xl mx-auto">
          <div className="bg-white rounded-lg p-6 shadow">
            <div className="text-2xl font-bold text-success-600 mb-2">✅ Frontend</div>
            <p className="text-gray-600">React + Vite + Tailwind CSS ready</p>
          </div>
          <div className="bg-white rounded-lg p-6 shadow">
            <div className="text-2xl font-bold text-warning-600 mb-2">🔧 Backend</div>
            <p className="text-gray-600">Express server coming next</p>
          </div>
        </div>
      </div>
    </section>
  </div>
)

// Main App Component
function App() {
  return (
    <Router>
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<HomePage />} />
            {/* More routes will be added in later phases */}
          </Routes>
        </main>
        <Footer />
      </div>
    </Router>
  )
}

export default App
EOF

echo "✅ Frontend setup completed"

# Step 1.3: Backend Setup
echo "🔧 Step 1.3: Creating backend configuration..."

# Backend Package.json
cat > backend/package.json << 'EOF'
{
  "name": "interviewx-backend",
  "version": "1.0.0",
  "description": "Backend API for InterviewX AI Interview Platform",
  "main": "src/server.js",
  "type": "module",
  "scripts": {
    "start": "node src/server.js",
    "dev": "nodemon src/server.js",
    "test": "jest",
    "test:watch": "jest --watch",
    "lint": "eslint src/",
    "lint:fix": "eslint src/ --fix"
  },
  "keywords": ["interview", "ai", "api", "evaluation"],
  "author": "InterviewX Team",
  "license": "MIT",
  "dependencies": {
    "express": "^4.18.2",
    "cors": "^2.8.5",
    "helmet": "^6.1.5",
    "morgan": "^1.10.0",
    "dotenv": "^16.0.3",
    "bcryptjs": "^2.4.3",
    "jsonwebtoken": "^9.0.0",
    "mongoose": "^7.0.3",
    "multer": "^1.4.5-lts.1",
    "socket.io": "^4.6.1",
    "axios": "^1.3.4",
    "form-data": "^4.0.0",
    "uuid": "^9.0.0",
    "joi": "^17.9.1",
    "winston": "^3.8.2",
    "compression": "^1.7.4",
    "express-rate-limit": "^6.7.0"
  },
  "devDependencies": {
    "nodemon": "^2.0.22",
    "jest": "^29.5.0",
    "supertest": "^6.3.3",
    "eslint": "^8.38.0"
  },
  "engines": {
    "node": ">=16.0.0"
  }
}
EOF

# Backend Environment File
cat > backend/.env.example << 'EOF'
# Server Configuration
NODE_ENV=development
PORT=5000
FRONTEND_URL=http://localhost:3000

# Database Configuration
MONGODB_URI=mongodb://localhost:27017/interviewx

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRE=7d

# AI Services URLs (will be configured in Phase 5)
FACIAL_ANALYSIS_URL=http://localhost:8001
AUDIO_ANALYSIS_URL=http://localhost:8002
TEXT_ANALYSIS_URL=http://localhost:8003

# API Keys (will be configured later)
GEMINI_API_KEY=your-gemini-api-key-here
GOOGLE_CLOUD_API_KEY=your-google-cloud-api-key-here

# File Upload Configuration
MAX_FILE_SIZE=50MB
UPLOAD_PATH=./uploads

# Logging Configuration
LOG_LEVEL=info
LOG_FILE=logs/app.log

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
EOF

# Copy example to actual .env file
cp backend/.env.example backend/.env

# Backend Logger Utility
cat > backend/src/utils/logger.js << 'EOF'
import winston from 'winston';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create logs directory if it doesn't exist
import fs from 'fs';
const logsDir = path.join(path.dirname(__dirname), '..', 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Define log format
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.prettyPrint()
);

// Create logger instance
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  defaultMeta: { service: 'interviewx-api' },
  transports: [
    // Write all logs with level 'error' and below to error.log
    new winston.transports.File({ 
      filename: path.join(logsDir, 'error.log'), 
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    
    // Write all logs to combined.log
    new winston.transports.File({ 
      filename: path.join(logsDir, 'combined.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
  ],
});

// Add console transport in development
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple(),
      winston.format.printf(({ timestamp, level, message, ...meta }) => {
        const metaStr = Object.keys(meta).length ? JSON.stringify(meta, null, 2) : '';
        return `${timestamp} [${level}]: ${message} ${metaStr}`;
      })
    )
  }));
}

// Create a stream object for morgan
logger.stream = {
  write: function(message) {
    logger.info(message.trim());
  },
};

export { logger };
EOF

# Backend Configuration Utility
cat > backend/src/utils/config.js << 'EOF'
import dotenv from 'dotenv';
import { logger } from './logger.js';

// Load environment variables
dotenv.config();

// Configuration object
const config = {
  // Server Configuration
  server: {
    port: parseInt(process.env.PORT) || 5000,
    env: process.env.NODE_ENV || 'development',
    frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
  },
  
  // Database Configuration
  database: {
    mongoUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/interviewx',
  },
  
  // JWT Configuration
  jwt: {
    secret: process.env.JWT_SECRET || 'fallback-secret-change-this',
    expiresIn: process.env.JWT_EXPIRE || '7d',
  },
  
  // AI Services Configuration
  aiServices: {
    facialAnalysisUrl: process.env.FACIAL_ANALYSIS_URL || 'http://localhost:8001',
    audioAnalysisUrl: process.env.AUDIO_ANALYSIS_URL || 'http://localhost:8002',
    textAnalysisUrl: process.env.TEXT_ANALYSIS_URL || 'http://localhost:8003',
  },
  
  // API Keys
  apiKeys: {
    gemini: process.env.GEMINI_API_KEY,
    googleCloud: process.env.GOOGLE_CLOUD_API_KEY,
  },
  
  // File Upload Configuration
  upload: {
    maxFileSize: process.env.MAX_FILE_SIZE || '50MB',
    uploadPath: process.env.UPLOAD_PATH || './uploads',
  },
  
  // Rate Limiting Configuration
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  },
  
  // Logging Configuration
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    file: process.env.LOG_FILE || 'logs/app.log',
  },
};

// Validate required configuration
const validateConfig = () => {
  const requiredEnvVars = ['JWT_SECRET'];
  
  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      logger.warn(`Missing required environment variable: ${envVar}`);
    }
  }
  
  // Log current configuration (excluding secrets)
  const safeConfig = {
    ...config,
    jwt: { ...config.jwt, secret: '***' },
    apiKeys: Object.keys(config.apiKeys).reduce((acc, key) => {
      acc[key] = config.apiKeys[key] ? '***' : 'not set';
      return acc;
    }, {}),
  };
  
  logger.info('Configuration loaded:', safeConfig);
};

// Validate configuration on import
validateConfig();

export default config;
EOF

# Main Backend Server
cat > backend/src/server.js << 'EOF'
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { createServer } from 'http';
import path from 'path';
import { fileURLToPath } from 'url';

// Import utilities
import { logger } from './utils/logger.js';
import config from './utils/config.js';

// Get __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create Express app
const app = express();
const server = createServer(app);

// Trust proxy for accurate IP addresses
app.set('trust proxy', 1);

// Rate limiting
const limiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.maxRequests,
  message: {
    error: 'Too many requests from this IP, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:"],
      scriptSrc: ["'self'"],
      connectSrc: ["'self'", config.server.frontendUrl],
    },
  },
  crossOriginEmbedderPolicy: false,
}));

// CORS configuration
app.use(cors({
  origin: [
    config.server.frontendUrl,
    'http://localhost:3000',
    'http://127.0.0.1:3000',
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// General middleware
app.use(compression());
app.use(morgan('combined', { stream: logger.stream }));
app.use(express.json({ 
  limit: '10mb',
  strict: true,
}));
app.use(express.urlencoded({ 
  extended: true, 
  limit: '10mb',
}));

// Apply rate limiting to all requests
app.use(limiter);

// Health check endpoint
app.get('/api/health', (req, res) => {
  const healthCheck = {
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: config.server.env,
    version: process.env.npm_package_version || '1.0.0',
    node: process.version,
    memory: process.memoryUsage(),
  };
  
  res.status(200).json(healthCheck);
});

// API status endpoint
app.get('/api/status', (req, res) => {
  res.json({
    message: 'InterviewX API Server is running!',
    version: '1.0.0',
    phase: 'Phase 1 - Foundation Setup',
    features: {
      frontend: '✅ React + Vite + Tailwind',
      backend: '✅ Express + Security',
      database: '⏳ Coming in Phase 2',
      ai_services: '⏳ Coming in Phase 5',
    },
    endpoints: {
      health: '/api/health',
      status: '/api/status',
    },
  });
});

// API routes placeholder (will be added in future phases)
app.get('/api', (req, res) => {
  res.json({
    message: 'Welcome to InterviewX API',
    documentation: '/api/docs',
    version: '1.0.0',
  });
});

// Serve static files (for uploaded content in future phases)
const uploadsPath = path.join(__dirname, '..', 'uploads');
app.use('/uploads', express.static(uploadsPath));

// 404 handler for API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({
    error: 'API endpoint not found',
    path: req.path,
    method: req.method,
    timestamp: new Date().toISOString(),
  });
});

// Global error handler
app.use((err, req, res, next) => {
  logger.error('Unhandled error:', {
    error: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
  });

  res.status(err.status || 500).json({
    error: config.server.env === 'production' 
      ? 'Internal server error' 
      : err.message,
    timestamp: new Date().toISOString(),
  });
});

// Graceful shutdown handlers
const gracefulShutdown = (signal) => {
  logger.info(`${signal} received, shutting down gracefully...`);
  
  server.close(() => {
    logger.info('HTTP server closed');
    process.exit(0);
  });
  
  // Force close after 10 seconds
  setTimeout(() => {
    logger.error('Forced shutdown after timeout');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  logger.error('Uncaught Exception:', err);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Start server
const startServer = async () => {
  try {
    const PORT = config.server.port;
    
    server.listen(PORT, () => {
      logger.info(`🚀 InterviewX API Server started successfully!`);
      logger.info(`📍 Server running on port ${PORT}`);
      logger.info(`🌍 Environment: ${config.server.env}`);
      logger.info(`🔗 Frontend URL: ${config.server.frontendUrl}`);
      logger.info(`📊 Health check: http://localhost:${PORT}/api/health`);
      logger.info(`📋 Status endpoint: http://localhost:${PORT}/api/status`);
      
      if (config.server.env === 'development') {
        logger.info(`🔧 Development mode - detailed logging enabled`);
      }
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Start the server
startServer();

export default app;
EOF

echo "✅ Backend setup completed"

# Root Package.json for workspace management
cat > package.json << 'EOF'
{
  "name": "interviewx-workspace",
  "version": "1.0.0",
  "description": "InterviewX - AI-Driven Interview Evaluation Platform",
  "private": true,
  "workspaces": [
    "frontend",
    "backend"
  ],
  "scripts": {
    "dev": "concurrently \"npm run dev:backend\" \"npm run dev:frontend\"",
    "dev:frontend": "cd frontend && npm run dev",
    "dev:backend": "cd backend && npm run dev",
    "build": "npm run build:frontend",
    "build:frontend": "cd frontend && npm run build",
    "install:all": "npm install && cd frontend && npm install && cd ../backend && npm install",
    "clean": "rm -rf node_modules frontend/node_modules backend/node_modules frontend/dist",
    "test": "npm run test:frontend && npm run test:backend",
    "test:frontend": "cd frontend && npm run test",
    "test:backend": "cd backend && npm run test"
  },
  "devDependencies": {
    "concurrently": "^8.0.1"
  },
  "engines": {
    "node": ">=16.0.0",
    "npm": ">=8.0.0"
  },
  "keywords": [
    "interview",
    "ai",
    "evaluation",
    "platform",
    "react",
    "express",
    "machine-learning"
  ],
  "author": "InterviewX Team",
  "license": "MIT"
}
EOF

# Create gitignore
cat > .gitignore << 'EOF'
# Dependencies
node_modules/
*/node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Production builds
frontend/dist/
frontend/build/
backend/dist/

# Environment variables
.env
.env.local
.env.development.local
.env.test.local
.env.production.local
backend/.env
frontend/.env

# Logs
logs/
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*
lerna-debug.log*

# OS generated files
.DS_Store
.DS_Store?
._*
.Spotlight-V100
.Trashes
ehthumbs.db
Thumbs.db

# IDE
.vscode/
.idea/
*.swp
*.swo
*~

# Temporary files
tmp/
temp/
*.tmp
*.temp

# Database
*.sqlite
*.sqlite3
*.db

# Uploads (will be handled differently in production)
backend/uploads/
uploads/

# AI Model files (will be downloaded/trained separately)
ai-models/*/models/*.h5
ai-models/*/models/*.pkl
ai-models/*/data/*.npy

# Python
__pycache__/
*.py[cod]
*$py.class
*.so
.Python
build/
develop-eggs/
dist/
downloads/
eggs/
.eggs/
lib/
lib64/
parts/
sdist/
var/
wheels/
*.egg-info/
.installed.cfg
*.egg
MANIFEST

# Python virtual environments
.env
.venv
env/
venv/
ENV/
env.bak/
venv.bak/

# Coverage reports
htmlcov/
.tox/
.coverage
.coverage.*
.cache
nosetests.xml
coverage.xml
*.cover
.hypothesis/
.pytest_cache/

# Jupyter Notebook
.ipynb_checkpoints

# Docker
.dockerignore

# Backup files
*.bak
*.backup
*.old

# Lock files (keep these)
# package-lock.json
# yarn.lock
EOF

echo "✅ All Phase 1 files created successfully!"

echo ""
echo "🎉 Phase 1 Complete! Next steps:"
echo "================================"
echo ""
echo "1. Install dependencies:"
echo "   npm install"
echo "   cd frontend && npm install"
echo "   cd ../backend && npm install"
echo ""
echo "2. Start development servers:"
echo "   npm run dev"
echo ""
echo "3. Visit your application:"
echo "   Frontend: http://localhost:3000"
echo "   Backend: http://localhost:5000/api/status"
echo ""
echo "4. Verify everything works:"
echo "   - Frontend should show InterviewX homepage"
echo "   - Backend should respond with status"
echo "   - No console errors"
echo ""
echo "Ready for Phase 2? 🚀"