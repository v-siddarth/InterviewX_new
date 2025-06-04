#!/bin/bash

# InterviewX - Complete Project Structure Creation Script
# Creates the exact directory structure as specified

echo "🚀 Creating InterviewX project structure..."

# Create root directory
mkdir -p interviewx
cd interviewx

# Frontend Structure
echo "📁 Creating frontend structure..."

# Frontend root directories
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

# Frontend files
touch frontend/public/vite.svg
touch frontend/public/index.html

# Interview components
touch frontend/src/components/interview/VideoCapture.jsx
touch frontend/src/components/interview/AudioRecorder.jsx
touch frontend/src/components/interview/QuestionDisplay.jsx
touch frontend/src/components/interview/AnswerInput.jsx
touch frontend/src/components/interview/InterviewRoom.jsx

# Evaluation components
touch frontend/src/components/evaluation/FaceAnalysisResult.jsx
touch frontend/src/components/evaluation/AudioAnalysisResult.jsx
touch frontend/src/components/evaluation/OverallScore.jsx
touch frontend/src/components/evaluation/EvaluationDashboard.jsx

# UI components
touch frontend/src/components/ui/Button.jsx
touch frontend/src/components/ui/Modal.jsx
touch frontend/src/components/ui/ProgressBar.jsx
touch frontend/src/components/ui/LoadingSpinner.jsx

# Layout components
touch frontend/src/components/layout/Header.jsx
touch frontend/src/components/layout/Footer.jsx
touch frontend/src/components/layout/Sidebar.jsx

# Pages
touch frontend/src/pages/Home.jsx
touch frontend/src/pages/Interview.jsx
touch frontend/src/pages/Results.jsx
touch frontend/src/pages/Dashboard.jsx
touch frontend/src/pages/Login.jsx

# Hooks
touch frontend/src/hooks/useCamera.js
touch frontend/src/hooks/useAudioRecorder.js
touch frontend/src/hooks/useWebSocket.js
touch frontend/src/hooks/useInterview.js

# Services
touch frontend/src/services/api.js
touch frontend/src/services/websocket.js
touch frontend/src/services/mediaUtils.js

# Utils
touch frontend/src/utils/constants.js
touch frontend/src/utils/helpers.js
touch frontend/src/utils/validators.js

# Store
touch frontend/src/store/interviewStore.js
touch frontend/src/store/userStore.js

# Main frontend files
touch frontend/src/App.jsx
touch frontend/src/main.jsx
touch frontend/src/index.css

# Frontend config files
touch frontend/package.json
touch frontend/vite.config.js
touch frontend/tailwind.config.js
touch frontend/postcss.config.js

# Backend Structure
echo "📁 Creating backend structure..."

# Backend directories
mkdir -p backend/src/controllers
mkdir -p backend/src/middleware
mkdir -p backend/src/models
mkdir -p backend/src/routes
mkdir -p backend/src/services
mkdir -p backend/src/utils

# Controllers
touch backend/src/controllers/authController.js
touch backend/src/controllers/interviewController.js
touch backend/src/controllers/evaluationController.js
touch backend/src/controllers/uploadController.js

# Middleware
touch backend/src/middleware/auth.js
touch backend/src/middleware/upload.js
touch backend/src/middleware/validation.js
touch backend/src/middleware/errorHandler.js

# Models
touch backend/src/models/User.js
touch backend/src/models/Interview.js
touch backend/src/models/Question.js
touch backend/src/models/Evaluation.js

# Routes
touch backend/src/routes/auth.js
touch backend/src/routes/interviews.js
touch backend/src/routes/evaluations.js
touch backend/src/routes/uploads.js

# Services
touch backend/src/services/aiService.js
touch backend/src/services/speechToText.js
touch backend/src/services/geminiService.js
touch backend/src/services/websocketService.js

# Utils
touch backend/src/utils/database.js
touch backend/src/utils/logger.js
touch backend/src/utils/config.js

# Main backend file
touch backend/src/server.js

# Backend config files
touch backend/package.json
touch backend/.env

# AI Models Structure
echo "🤖 Creating AI models structure..."

# Facial Analysis
mkdir -p ai-models/facial-analysis/models/mtcnn_model
mkdir -p ai-models/facial-analysis/models/face_confidence_model
mkdir -p ai-models/facial-analysis/utils
mkdir -p ai-models/facial-analysis/data/confident_faces_db

# Facial analysis model files
touch ai-models/facial-analysis/models/mtcnn_model/weights.h5
touch ai-models/facial-analysis/models/mtcnn_model/model.json
touch ai-models/facial-analysis/models/face_confidence_model/weights.h5
touch ai-models/facial-analysis/models/face_confidence_model/model.json

# Facial analysis utils
touch ai-models/facial-analysis/utils/face_detector.py
touch ai-models/facial-analysis/utils/feature_extractor.py
touch ai-models/facial-analysis/utils/confidence_analyzer.py

# Facial analysis data
touch ai-models/facial-analysis/data/confident_faces_db/embeddings.npy
touch ai-models/facial-analysis/data/confident_faces_db/metadata.json

# Facial analysis main files
touch ai-models/facial-analysis/face_analysis_service.py
touch ai-models/facial-analysis/requirements.txt
touch ai-models/facial-analysis/Dockerfile

# Audio Analysis
mkdir -p ai-models/audio-analysis/models/speech_recognition
mkdir -p ai-models/audio-analysis/utils

# Audio analysis utils
touch ai-models/audio-analysis/utils/audio_processor.py
touch ai-models/audio-analysis/utils/speech_to_text.py
touch ai-models/audio-analysis/utils/quality_analyzer.py

# Audio analysis main files
touch ai-models/audio-analysis/audio_analysis_service.py
touch ai-models/audio-analysis/requirements.txt
touch ai-models/audio-analysis/Dockerfile

# Text Analysis
mkdir -p ai-models/text-analysis/utils

# Text analysis utils
touch ai-models/text-analysis/utils/gemini_client.py
touch ai-models/text-analysis/utils/text_processor.py
touch ai-models/text-analysis/utils/quality_scorer.py

# Text analysis main files
touch ai-models/text-analysis/text_analysis_service.py
touch ai-models/text-analysis/requirements.txt
touch ai-models/text-analysis/Dockerfile

# Database Structure
echo "💾 Creating database structure..."

# Database directories
mkdir -p database/migrations
mkdir -p database/seeds

# Migration files
touch database/migrations/001_create_users.sql
touch database/migrations/002_create_interviews.sql
touch database/migrations/003_create_questions.sql
touch database/migrations/004_create_evaluations.sql

# Seed files
touch database/seeds/users.sql
touch database/seeds/questions.sql

# Schema file
touch database/schema.sql

# Configuration Structure
echo "⚙️ Creating configuration structure..."

# Config files
touch config/docker-compose.yml
touch config/nginx.conf
touch config/redis.conf
touch config/env.example

# Scripts Structure
echo "📜 Creating scripts structure..."

# Script files
touch scripts/setup.sh
touch scripts/deploy.sh
touch scripts/backup.sh
touch scripts/test.sh

# Documentation Structure
echo "📚 Creating documentation structure..."

# Documentation files
touch docs/API.md
touch docs/SETUP.md
touch docs/DEPLOYMENT.md
touch docs/AI_MODELS.md

# Tests Structure
echo "🧪 Creating tests structure..."

# Test directories
mkdir -p tests/frontend/components
mkdir -p tests/backend/controllers
mkdir -p tests/backend/services
mkdir -p tests/ai-models/facial-analysis
mkdir -p tests/ai-models/audio-analysis

# Root files
echo "📄 Creating root files..."

# Root level files
touch .gitignore
touch README.md
touch LICENSE
touch package.json

# Make scripts executable
chmod +x scripts/*.sh

echo "✅ InterviewX project structure created successfully!"
echo ""
echo "📂 Project structure created with:"
echo "   📁 frontend/          - React.js + Vite + Tailwind CSS"
echo "   📁 backend/           - Node.js/Express API Server"
echo "   📁 ai-models/         - AI/ML Components (Facial, Audio, Text)"
echo "   📁 database/          - Database Setup & Migrations"
echo "   📁 config/            - Configuration Files"
echo "   📁 scripts/           - Utility Scripts"
echo "   📁 docs/              - Documentation"
echo "   📁 tests/             - Test Files"
echo ""
echo "🚀 Next steps:"
echo "   1. cd interviewx"
echo "   2. Start setting up your components!"
echo ""
echo "📋 Total files created: $(find . -type f | wc -l)"
echo "📋 Total directories created: $(find . -type d | wc -l)"