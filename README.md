# InterviewX - Step-by-Step Development Plan

## 🎯 Project Overview
Building an AI-driven interview evaluation system with facial analysis, audio analysis, and text evaluation capabilities.

---

## 📋 Phase-by-Phase Development Plan

### **Phase 1: Project Foundation & Setup** (Day 1-2)

#### Step 1.1: Project Structure & Dependencies
**Files to Create/Modify:**
- `create_structure.sh` (directory structure)
- `frontend/package.json`
- `backend/package.json`
- Environment files

**Dependencies:** None
**Output:** Complete project structure with package configurations

#### Step 1.2: Basic Frontend Setup
**Files to Create/Modify:**
- `frontend/vite.config.js`
- `frontend/tailwind.config.js`
- `frontend/postcss.config.js`
- `frontend/src/index.css`
- `frontend/src/main.jsx`
- `frontend/src/App.jsx`
- `frontend/public/index.html`

**Dependencies:** Step 1.1
**Output:** Working React app with Tailwind CSS

#### Step 1.3: Basic Backend Setup
**Files to Create/Modify:**
- `backend/src/server.js`
- `backend/src/utils/logger.js`
- `backend/src/utils/config.js`
- `backend/.env`

**Dependencies:** Step 1.1
**Output:** Basic Express server running on port 5000

---

### **Phase 2: Database & Authentication** (Day 3-4)

#### Step 2.1: Database Models & Connection
**Files to Create/Modify:**
- `backend/src/utils/database.js`
- `backend/src/models/User.js`
- `backend/src/models/Interview.js`
- `backend/src/models/Question.js`
- `backend/src/models/Evaluation.js`

**Dependencies:** Step 1.3
**File Connections:**
- `server.js` imports `database.js`
- All models use mongoose schemas

#### Step 2.2: Authentication System
**Files to Create/Modify:**
- `backend/src/middleware/auth.js`
- `backend/src/controllers/authController.js`
- `backend/src/routes/auth.js`

**Dependencies:** Step 2.1
**File Connections:**
- `server.js` imports auth routes
- Auth controller uses User model
- Auth middleware protects routes

**Changes to Previous Files:**
- Update `server.js` to include auth routes

#### Step 2.3: Frontend Authentication
**Files to Create/Modify:**
- `frontend/src/services/api.js`
- `frontend/src/pages/Login.jsx`
- `frontend/src/store/userStore.js`

**Dependencies:** Step 2.2, Step 1.2
**File Connections:**
- `Login.jsx` uses `api.js`
- `userStore.js` manages authentication state
- `App.jsx` imports Login page

**Changes to Previous Files:**
- Update `App.jsx` to include routing and Login page

---

### **Phase 3: Core UI Components** (Day 5-6)

#### Step 3.1: Layout Components
**Files to Create/Modify:**
- `frontend/src/components/layout/Header.jsx`
- `frontend/src/components/layout/Footer.jsx`
- `frontend/src/components/layout/Sidebar.jsx`

**Dependencies:** Step 2.3
**File Connections:**
- All components use userStore for authentication state

**Changes to Previous Files:**
- Update `App.jsx` to include Header and Footer

#### Step 3.2: UI Components
**Files to Create/Modify:**
- `frontend/src/components/ui/Button.jsx`
- `frontend/src/components/ui/Modal.jsx`
- `frontend/src/components/ui/ProgressBar.jsx`
- `frontend/src/components/ui/LoadingSpinner.jsx`

**Dependencies:** Step 1.2
**File Connections:**
- Reusable components used across the app

#### Step 3.3: Main Pages
**Files to Create/Modify:**
- `frontend/src/pages/Home.jsx`
- `frontend/src/pages/Dashboard.jsx`

**Dependencies:** Step 3.1, Step 3.2
**File Connections:**
- Pages use layout components and UI components

**Changes to Previous Files:**
- Update `App.jsx` routing to include new pages

---

### **Phase 4: Interview Management Backend** (Day 7-8)

#### Step 4.1: Interview Controllers & Routes
**Files to Create/Modify:**
- `backend/src/controllers/interviewController.js`
- `backend/src/routes/interviews.js`
- `backend/src/middleware/validation.js`

**Dependencies:** Step 2.1, Step 2.2
**File Connections:**
- Controller uses Interview and User models
- Routes use auth middleware
- Validation middleware for data validation

**Changes to Previous Files:**
- Update `server.js` to include interview routes

#### Step 4.2: File Upload System
**Files to Create/Modify:**
- `backend/src/middleware/upload.js`
- `backend/src/controllers/uploadController.js`
- `backend/src/routes/uploads.js`

**Dependencies:** Step 4.1
**File Connections:**
- Upload middleware handles file processing
- Upload controller manages file storage

**Changes to Previous Files:**
- Update `server.js` to include upload routes

---

### **Phase 5: AI Services Foundation** (Day 9-11)

#### Step 5.1: Facial Analysis Service
**Files to Create/Modify:**
- `ai-models/facial-analysis/face_analysis_service.py`
- `ai-models/facial-analysis/utils/face_detector.py`
- `ai-models/facial-analysis/utils/confidence_analyzer.py`
- `ai-models/facial-analysis/requirements.txt`
- `ai-models/facial-analysis/Dockerfile`

**Dependencies:** None (independent service)
**File Connections:**
- Main service imports utility modules
- Standalone Flask/FastAPI service

#### Step 5.2: Audio Analysis Service
**Files to Create/Modify:**
- `ai-models/audio-analysis/audio_analysis_service.py`
- `ai-models/audio-analysis/utils/audio_processor.py`
- `ai-models/audio-analysis/utils/speech_to_text.py`
- `ai-models/audio-analysis/requirements.txt`
- `ai-models/audio-analysis/Dockerfile`

**Dependencies:** None (independent service)
**File Connections:**
- Main service imports utility modules
- Standalone Flask/FastAPI service

#### Step 5.3: Text Analysis Service
**Files to Create/Modify:**
- `ai-models/text-analysis/text_analysis_service.py`
- `ai-models/text-analysis/utils/gemini_client.py`
- `ai-models/text-analysis/utils/text_processor.py`
- `ai-models/text-analysis/requirements.txt`
- `ai-models/text-analysis/Dockerfile`

**Dependencies:** None (independent service)
**File Connections:**
- Main service imports utility modules
- Uses Gemini API for text analysis

---

### **Phase 6: Backend-AI Integration** (Day 12-13)

#### Step 6.1: AI Service Integration
**Files to Create/Modify:**
- `backend/src/services/aiService.js`
- `backend/src/controllers/evaluationController.js`
- `backend/src/routes/evaluations.js`

**Dependencies:** Step 5.1, Step 5.2, Step 5.3, Step 4.1
**File Connections:**
- `aiService.js` communicates with AI microservices
- Evaluation controller uses AI service and Evaluation model
- Routes use auth middleware

**Changes to Previous Files:**
- Update `server.js` to include evaluation routes

#### Step 6.2: WebSocket Integration
**Files to Create/Modify:**
- `backend/src/services/websocketService.js`

**Dependencies:** Step 6.1
**File Connections:**
- WebSocket service for real-time communication
- Integrates with AI services for live analysis

**Changes to Previous Files:**
- Update `server.js` to initialize WebSocket

---

### **Phase 7: Interview Components** (Day 14-16)

#### Step 7.1: Camera & Audio Components
**Files to Create/Modify:**
- `frontend/src/hooks/useCamera.js`
- `frontend/src/hooks/useAudioRecorder.js`
- `frontend/src/components/interview/VideoCapture.jsx`
- `frontend/src/components/interview/AudioRecorder.jsx`

**Dependencies:** Step 3.2
**File Connections:**
- Hooks manage media device access
- Components use hooks for functionality
- Components use UI components

#### Step 7.2: Interview Logic Components
**Files to Create/Modify:**
- `frontend/src/hooks/useInterview.js`
- `frontend/src/hooks/useWebSocket.js`
- `frontend/src/components/interview/QuestionDisplay.jsx`
- `frontend/src/components/interview/AnswerInput.jsx`
- `frontend/src/components/interview/InterviewRoom.jsx`

**Dependencies:** Step 7.1, Step 6.2
**File Connections:**
- Interview hook manages interview state
- WebSocket hook connects to backend
- Components use interview and WebSocket hooks

#### Step 7.3: Interview Page Integration
**Files to Create/Modify:**
- `frontend/src/pages/Interview.jsx`
- `frontend/src/services/mediaUtils.js`

**Dependencies:** Step 7.2
**File Connections:**
- Interview page combines all interview components
- Media utils handle file processing

**Changes to Previous Files:**
- Update `App.jsx` routing for Interview page

---

### **Phase 8: Evaluation & Results** (Day 17-18)

#### Step 8.1: Evaluation Components
**Files to Create/Modify:**
- `frontend/src/components/evaluation/FaceAnalysisResult.jsx`
- `frontend/src/components/evaluation/AudioAnalysisResult.jsx`
- `frontend/src/components/evaluation/OverallScore.jsx`
- `frontend/src/components/evaluation/EvaluationDashboard.jsx`

**Dependencies:** Step 3.2, Step 6.1
**File Connections:**
- Components display evaluation results
- Use UI components for styling
- Fetch data from evaluation API

#### Step 8.2: Results Page
**Files to Create/Modify:**
- `frontend/src/pages/Results.jsx`

**Dependencies:** Step 8.1
**File Connections:**
- Results page uses evaluation components
- Fetches data from backend API

**Changes to Previous Files:**
- Update `App.jsx` routing for Results page

---

### **Phase 9: Data Management** (Day 19-20)

#### Step 9.1: Store Management
**Files to Create/Modify:**
- `frontend/src/store/interviewStore.js`
- `frontend/src/utils/constants.js`
- `frontend/src/utils/helpers.js`
- `frontend/src/utils/validators.js`

**Dependencies:** Step 2.3
**File Connections:**
- Interview store manages application state
- Utils provide common functionality
- Multiple components use store

**Changes to Previous Files:**
- Update components to use interview store instead of local state

#### Step 9.2: API Service Layer
**Files to Create/Modify:**
- `frontend/src/services/websocket.js`

**Dependencies:** Step 9.1, Step 6.2
**File Connections:**
- WebSocket service connects to backend
- Interview store uses WebSocket service

**Changes to Previous Files:**
- Update `api.js` with complete API methods
- Update components to use centralized API service

---

### **Phase 10: Testing & Configuration** (Day 21-22)

#### Step 10.1: Configuration Files
**Files to Create/Modify:**
- `config/docker-compose.yml`
- `config/nginx.conf`
- `scripts/setup.sh`
- `scripts/deploy.sh`

**Dependencies:** All previous phases
**File Connections:**
- Docker compose orchestrates all services
- Scripts automate deployment

#### Step 10.2: Error Handling & Logging
**Files to Create/Modify:**
- `backend/src/middleware/errorHandler.js`

**Dependencies:** Step 1.3
**File Connections:**
- Error handler middleware catches all errors
- Uses logger utility

**Changes to Previous Files:**
- Update `server.js` to use error handler
- Add error handling to all controllers

---

## 🔄 Development Workflow

### For Each Step:
1. **Review Dependencies** - Ensure previous steps are complete
2. **Identify File Connections** - Understand which files interact
3. **Create New Files** - Build the specific functionality
4. **Update Connected Files** - Modify existing files as needed
5. **Test Integration** - Verify everything works together
6. **Document Changes** - Record what was modified

### File Connection Patterns:
- **Frontend Components** → Use hooks, stores, and services
- **Backend Controllers** → Use models, middleware, and services
- **AI Services** → Independent but communicate via HTTP/WebSocket
- **Database Models** → Used by controllers and services
- **Routes** → Connect controllers with middleware

### Testing Strategy:
- **Unit Tests** - Test individual components/functions
- **Integration Tests** - Test file connections
- **E2E Tests** - Test complete user flows

---

## 🚨 Critical Dependencies to Track

### Frontend Dependencies:
```
App.jsx → All Pages → Components → Hooks → Services/Store
```

### Backend Dependencies:
```
server.js → Routes → Controllers → Models/Services → Utils
```

### AI Service Dependencies:
```
main_service.py → utils/ → models/ (independent services)
```

### Cross-Service Dependencies:
```
Frontend ↔ Backend API ↔ AI Services
Frontend ↔ Backend WebSocket ↔ AI Services
```

---

## 📝 Next Steps

**Ready to start with Phase 1?** 

I'll provide:
1. Complete code for each file
2. Explicit list of files that need updates
3. Step-by-step modification instructions
4. Testing guidance for each phase

Would you like to begin with **Phase 1: Project Foundation & Setup**?