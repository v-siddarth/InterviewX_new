# scripts/setup.sh
#!/bin/bash

echo "🚀 Setting up InterviewX - AI-Powered Interview System"
echo "=================================================="

# Create main project structure
echo "📁 Creating project structure..."
mkdir -p {frontend,backend,ai-models,config,scripts,docs}
mkdir -p frontend/src/{components/{ui,layout,interview,evaluation},pages,store,services,hooks,utils}
mkdir -p frontend/public
mkdir -p backend/src/{controllers,middleware,models,routes,services,utils}
mkdir -p backend/uploads/{videos,audio,documents}
mkdir -p ai-models/{facial-analysis,audio-analysis,text-analysis}
mkdir -p config

echo "✅ Project structure created!"

# Frontend setup
echo "⚛️ Setting up Frontend..."
cd frontend

# Create package.json if it doesn't exist
if [ ! -f package.json ]; then
cat > package.json << 'EOL'
{
  "name": "interviewx-frontend",
  "private": true,
  "version": "1.0.0",
  "type": "module",
  "description": "AI-powered interview evaluation system - Frontend",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "lint": "eslint . --ext js,jsx --report-unused-disable-directives --max-warnings 0",
    "preview": "vite preview",
    "start": "vite"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.20.1",
    "zustand": "^4.4.7",
    "axios": "^1.6.2"
  },
  "devDependencies": {
    "@types/react": "^18.2.43",
    "@types/react-dom": "^18.2.17",
    "@vitejs/plugin-react": "^4.2.1",
    "autoprefixer": "^10.4.16",
    "eslint": "^8.55.0",
    "eslint-plugin-react": "^7.33.2",
    "eslint-plugin-react-hooks": "^4.6.0",
    "eslint-plugin-react-refresh": "^0.4.5",
    "postcss": "^8.4.32",
    "tailwindcss": "^3.3.6",
    "vite": "^5.0.8"
  }
}
EOL
fi

echo "📦 Installing frontend dependencies..."
npm install

# Initialize Tailwind CSS
echo "🎨 Setting up Tailwind CSS..."
npx tailwindcss init -p

cd ..

# Backend setup
echo "🔧 Setting up Backend..."
cd backend

# Create package.json if it doesn't exist
if [ ! -f package.json ]; then
cat > package.json << 'EOL'
{
  "name": "interviewx-backend",
  "version": "1.0.0",
  "description": "AI-powered interview evaluation system - Backend API",
  "main": "src/server.js",
  "type": "module",
  "scripts": {
    "start": "node src/server.js",
    "dev": "nodemon src/server.js",
    "test": "jest"
  },
  "dependencies": {
    "express": "^4.18.2",
    "mongoose": "^8.0.3",
    "bcryptjs": "^2.4.3",
    "jsonwebtoken": "^9.0.2",
    "cors": "^2.8.5",
    "helmet": "^7.1.0",
    "morgan": "^1.10.0",
    "dotenv": "^16.3.1",
    "multer": "^1.4.5-lts.1",
    "express-validator": "^7.0.1",
    "express-rate-limit": "^7.1.5",
    "socket.io": "^4.7.4",
    "axios": "^1.6.2",
    "compression": "^1.7.4",
    "express-async-errors": "^3.1.1"
  },
  "devDependencies": {
    "nodemon": "^3.0.2",
    "jest": "^29.7.0",
    "supertest": "^6.3.3"
  }
}
EOL
fi

echo "📦 Installing backend dependencies..."
npm install

cd ..

# Create environment files
echo "🌍 Creating environment files..."

# Frontend .env
cat > frontend/.env << 'EOL'
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_ENVIRONMENT=development
REACT_APP_APP_NAME=InterviewX
REACT_APP_VERSION=1.0.0
EOL

# Backend .env
cat > backend/.env << 'EOL'
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/interviewx
JWT_SECRET=your-super-secret-jwt-key-change-in-production-this-should-be-very-long-and-random
JWT_EXPIRE=7d
FRONTEND_URL=http://localhost:3000

# AI Service URLs (when AI services are ready)
FACIAL_ANALYSIS_URL=http://localhost:8001
AUDIO_ANALYSIS_URL=http://localhost:8002
TEXT_ANALYSIS_URL=http://localhost:8003

# File upload settings
MAX_FILE_SIZE=52428800
UPLOAD_PATH=./uploads

# Rate limiting
RATE_LIMIT_WINDOW=900000
RATE_LIMIT_MAX=100
EOL

# Create development scripts
echo "📝 Creating development scripts..."
