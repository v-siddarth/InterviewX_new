# 🎯 InterviewX - AI-Powered Interview Practice Platform

InterviewX is a comprehensive AI-driven interview evaluation system that analyzes candidates based on facial expressions, voice quality, and answer relevance to help users ace their next job interview.

## 🚀 Features

### 🎥 **Facial Analysis**
- Real-time facial expression analysis using CNN and MTCNN
- Confidence level detection with 80%+ accuracy
- Professional demeanor assessment
- Eye contact and posture evaluation

### 🎤 **Voice Analysis**
- Speech-to-text conversion with high accuracy
- Voice quality and clarity assessment
- Speaking pace and volume analysis
- Filler word detection and counting

### 📝 **Text Analysis**
- Answer relevance scoring using Gemini Pro LLM
- Grammar and structure evaluation
- Content depth and clarity analysis
- Real-time feedback and suggestions

### 📊 **Comprehensive Reports**
- Multi-dimensional performance analysis
- Detailed feedback with improvement areas
- Progress tracking across multiple interviews
- Downloadable reports and analytics

## 🛠️ Technology Stack

### Frontend
- **React 18** with Vite
- **Tailwind CSS** for styling
- **Zustand** for state management
- **React Router** for navigation
- **Axios** for API calls
- **WebRTC** for media capture

### Backend
- **Node.js** with Express.js
- **MongoDB** with Mongoose ODM
- **JWT** authentication
- **Socket.io** for real-time communication
- **Multer** for file uploads
- **bcryptjs** for password hashing

### AI Services (Planned)
- **Python** with FastAPI
- **TensorFlow/PyTorch** for ML models
- **OpenCV** for video processing
- **MTCNN** for facial detection
- **Gemini Pro API** for text analysis

## 📁 Project Structure

```
interviewx/
├── frontend/                 # React frontend application
│   ├── src/
│   │   ├── components/      # Reusable UI components
│   │   ├── pages/           # Page components
│   │   ├── store/           # State management
│   │   ├── services/        # API services
│   │   └── utils/           # Utility functions
│   └── public/              # Static assets
├── backend/                 # Node.js backend API
│   ├── src/
│   │   ├── controllers/     # Route controllers
│   │   ├── middleware/      # Custom middleware
│   │   ├── models/          # Database models
│   │   ├── routes/          # API routes
│   │   ├── services/        # Business logic
│   │   └── utils/           # Utility functions
│   └── uploads/             # File storage
├── ai-models/               # AI/ML services (planned)
│   ├── facial-analysis/     # Facial analysis service
│   ├── audio-analysis/      # Audio analysis service
│   └── text-analysis/       # Text analysis service
├── config/                  # Configuration files
├── scripts/                 # Development scripts
└── docs/                    # Documentation
```

## 🚀 Quick Start

### Prerequisites
- **Node.js** 18+ and npm
- **MongoDB** 6.0+
- **Git**

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/interviewx.git
   cd interviewx
   ```

2. **Run the setup script**
   ```bash
   chmod +x scripts/setup.sh
   ./scripts/setup.sh
   ```

3. **Start development servers**
   ```bash
   ./scripts/dev.sh
   ```

4. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000

### Demo Account
```
Email: demo@interviewx.com
Password: demo123
```

## 🔧 Development

### Starting Development Environment
```bash
./scripts/dev.sh
```

### Building for Production
```bash
./scripts/build.sh
```

### Running Tests
```bash
./scripts/test.sh
```

### Manual Setup (if scripts fail)

**Backend:**
```bash
cd backend
npm install
npm run dev
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

## 📱 Usage

1. **Register/Login** - Create account or use demo credentials
2. **Dashboard** - View interview history and create new interviews
3. **Interview Setup** - Choose interview type and duration
4. **Camera/Audio Permissions** - Grant necessary permissions
5. **Start Interview** - Answer questions while being analyzed
6. **View Results** - Get detailed feedback and scores
7. **Track Progress** - Monitor improvement over time

## 🤖 AI Analysis Flow

```
User Input → Real-time Processing → AI Analysis → Results
    ↓              ↓                    ↓           ↓
Video Feed → Face Detection → CNN Analysis → Confidence Score
Audio Feed → Speech-to-Text → NLP Analysis → Quality Score  
Text Input → Content Review → LLM Analysis → Relevance Score
```

## 📊 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user

### Interviews
- `GET /api/interviews` - Get user interviews
- `POST /api/interviews` - Create new interview
- `POST /api/interviews/:id/start` - Start interview
- `POST /api/interviews/:id/complete` - Complete interview

### Evaluations
- `POST /api/evaluations/analyze` - Analyze answer
- `GET /api/evaluations/:id/results` - Get results

## 🌍 Environment Variables

### Frontend (.env)
```env
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_ENVIRONMENT=development
```

### Backend (.env)
```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/interviewx
JWT_SECRET=your-secret-key
FRONTEND_URL=http://localhost:3000
```

## 🧪 Testing

### Backend Tests
```bash
cd backend
npm test
```

### Frontend Tests
```bash
cd frontend
npm test
```

## 🚀 Deployment

### Using Docker (Recommended)
```bash
docker-compose up -d
```

### Manual Deployment
1. Build frontend: `npm run build`
2. Copy build files to backend public folder
3. Set production environment variables
4. Start backend: `npm start`

## 🤝 Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- OpenAI for AI inspiration
- React team for amazing framework
- MongoDB for reliable database
- All contributors and testers

## 📞 Support

- 📧 Email: support@interviewx.com
- 💬 Discord: [Join our community](https://discord.gg/interviewx)
- 📖 Documentation: [docs.interviewx.com](https://docs.interviewx.com)
- 🐛 Issues: [GitHub Issues](https://github.com/your-username/interviewx/issues)

---

**Built with ❤️ for helping people succeed in interviews**
