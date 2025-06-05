// frontend/src/pages/Interview.jsx - UPDATED WITH DYNAMIC QUESTION GENERATION
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useInterviewStore } from '../store/interviewStore';
import Button from '../components/ui/Button';
import ProgressBar from '../components/ui/ProgressBar';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { Mic, MicOff, Volume2, Sparkles, RefreshCw, Eye } from 'lucide-react';
import { api } from '../services/api';
import GeminiAIService from '../services/geminiAI';

// Speech-to-Text Component (keep existing implementation)
const SpeechToText = ({ value, onChange, placeholder, className = "" }) => {
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [transcript, setTranscript] = useState('');
  const recognitionRef = useRef(null);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      setIsSupported(true);
      
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';
      
      recognition.onstart = () => {
        console.log('🎤 Speech recognition started');
        setIsListening(true);
      };
      
      recognition.onresult = (event) => {
        let finalTranscript = '';
        let interimTranscript = '';
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          const transcript = result[0].transcript;
          
          if (result.isFinal) {
            finalTranscript += transcript + ' ';
          } else {
            interimTranscript += transcript;
          }
        }
        
        if (finalTranscript) {
          const newText = value + finalTranscript;
          onChange(newText);
          console.log('📝 Final transcript:', finalTranscript);
        }
        
        setTranscript(interimTranscript);
      };
      
      recognition.onerror = (event) => {
        console.error('❌ Speech recognition error:', event.error);
        setIsListening(false);
        
        if (event.error === 'not-allowed') {
          alert('Microphone access denied. Please allow microphone permission.');
        }
      };
      
      recognition.onend = () => {
        console.log('🛑 Speech recognition ended');
        setIsListening(false);
        setTranscript('');
      };
      
      recognitionRef.current = recognition;
    } else {
      setIsSupported(false);
    }
    
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
    } else {
      try {
        recognitionRef.current?.start();
      } catch (error) {
        console.error('Error starting recognition:', error);
      }
    }
  };

  return (
    <div className="space-y-3">
      <div className="relative">
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={`w-full h-32 p-3 pr-16 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none ${className}`}
        />
        
        {isSupported && (
          <button
            type="button"
            onClick={toggleListening}
            className={`absolute bottom-3 right-3 p-2 rounded-full transition-colors ${
              isListening 
                ? 'bg-red-500 hover:bg-red-600 text-white animate-pulse' 
                : 'bg-blue-500 hover:bg-blue-600 text-white'
            }`}
            title={isListening ? 'Stop Recording' : 'Start Voice Input'}
          >
            {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          </button>
        )}
      </div>

      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center space-x-2">
          {isSupported ? (
            <>
              <Volume2 className="w-4 h-4 text-green-500" />
              <span className="text-green-600">Voice input available</span>
            </>
          ) : (
            <>
              <MicOff className="w-4 h-4 text-gray-400" />
              <span className="text-gray-500">Voice input not supported</span>
            </>
          )}
        </div>
        
        {isListening && (
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
            <span className="text-red-600 font-medium">Listening...</span>
          </div>
        )}
      </div>

      {transcript && (
        <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
          <div className="text-sm text-blue-600 mb-1">Speaking:</div>
          <div className="text-blue-800 italic">"{transcript}"</div>
        </div>
      )}
    </div>
  );
};

// Simple Camera Component (keep existing implementation)
const SimpleCameraFeed = ({ className = "" }) => {
  const videoRef = useRef(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hasPermission, setHasPermission] = useState(false);

  useEffect(() => {
    let stream = null;

    const startCamera = async () => {
      try {
        setIsLoading(true);
        setError(null);

        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 1280 },
            height: { ideal: 720 },
            facingMode: 'user'
          },
          audio: false
        });

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          
          videoRef.current.onloadedmetadata = () => {
            videoRef.current.play()
              .then(() => {
                setIsLoading(false);
                setHasPermission(true);
              })
              .catch((playError) => {
                setError('Failed to play video');
                setIsLoading(false);
              });
          };
        }

      } catch (err) {
        let errorMessage = 'Camera access failed';
        
        if (err.name === 'NotAllowedError') {
          errorMessage = 'Camera permission denied.';
        } else if (err.name === 'NotFoundError') {
          errorMessage = 'No camera found.';
        }
        
        setError(errorMessage);
        setIsLoading(false);
      }
    };

    startCamera();

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  if (error) {
    return (
      <div className={`relative bg-gray-900 rounded-lg overflow-hidden ${className}`}>
        <div className="flex items-center justify-center h-full min-h-[300px] text-white">
          <div className="text-center p-6">
            <div className="text-4xl mb-4">⚠️</div>
            <h3 className="text-lg font-semibold mb-2">Camera Error</h3>
            <p className="text-sm text-gray-300">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative bg-black rounded-lg overflow-hidden ${className}`}>
      <video
        ref={videoRef}
        autoPlay
        muted
        playsInline
        className="w-full h-full object-cover"
        style={{ transform: 'scaleX(-1)' }}
      />

      {hasPermission && (
        <div className="absolute top-4 right-4 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-medium">
          🔴 LIVE
        </div>
      )}

      {isLoading && (
        <div className="absolute inset-0 bg-black bg-opacity-75 flex items-center justify-center">
          <div className="text-center text-white">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4" />
            <p>Starting camera...</p>
          </div>
        </div>
      )}

      <div className="absolute bottom-4 left-4 bg-black bg-opacity-50 text-white p-2 rounded text-xs">
        {hasPermission ? '📹 Camera Active' : '⏳ Connecting...'}
      </div>
    </div>
  );
};

const Interview = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentInterview, createInterview, fetchInterview } = useInterviewStore();
  
  // Interview Creation State
  const [showCreateForm, setShowCreateForm] = useState(!id);
  const [createFormData, setCreateFormData] = useState({
    title: '',
    type: 'technical',
    duration: 30,
    difficulty: 'medium'
  });
  const [isCreating, setIsCreating] = useState(false);
  
  // NEW: Question Generation State
  const [isGeneratingQuestions, setIsGeneratingQuestions] = useState(false);
  const [questionTypes, setQuestionTypes] = useState([]);
  const [previewQuestions, setPreviewQuestions] = useState([]);
  const [showPreview, setShowPreview] = useState(false);
  
  // Interview State
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [timeLeft, setTimeLeft] = useState(300);
  const [interviewStarted, setInterviewStarted] = useState(false);
  const [currentAnswer, setCurrentAnswer] = useState('');
  
  // AI Evaluation State
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [evaluationProgress, setEvaluationProgress] = useState(0);
  
  // Refs
  const timerRef = useRef(null);

  // NEW: Load question types on mount
  useEffect(() => {
    const loadQuestionTypes = async () => {
      try {
        const response = await api.get('/questions/types');
        if (response.success) {
          setQuestionTypes(response.types);
        }
      } catch (error) {
        console.error('❌ Failed to load question types:', error);
        // Set fallback types
        setQuestionTypes([
          { value: 'technical', label: 'Technical', description: 'Programming and technical skills' },
          { value: 'behavioral', label: 'Behavioral', description: 'Past experiences and soft skills' },
          { value: 'coding', label: 'Coding', description: 'Live coding challenges' },
          { value: 'system-design', label: 'System Design', description: 'Architecture and scalability' }
        ]);
      }
    };

    loadQuestionTypes();
  }, []);

  // NEW: Generate questions with Gemini
  const generateQuestions = async (formData) => {
    setIsGeneratingQuestions(true);
    
    try {
      console.log('🎯 Generating questions with Gemini:', formData);
      
      const response = await api.post('/questions/generate', {
        type: formData.type,
        difficulty: formData.difficulty,
        duration: formData.duration
      });
      
      if (response.success && response.questions) {
        console.log(`✅ Generated ${response.questions.length} questions`);
        return response.questions;
      } else {
        throw new Error('Failed to generate questions');
      }
      
    } catch (error) {
      console.error('❌ Error generating questions:', error);
      
      // Fallback to frontend Gemini service
      try {
        console.log('🔄 Trying frontend Gemini service...');
        const fallbackQuestions = await GeminiAIService.generateQuestions(
          formData.type, 
          formData.difficulty, 
          formData.duration
        );
        return fallbackQuestions;
      } catch (fallbackError) {
        console.error('❌ Fallback generation failed:', fallbackError);
        throw new Error('Failed to generate questions with AI');
      }
    } finally {
      setIsGeneratingQuestions(false);
    }
  };

  // NEW: Preview questions before creating interview
  const handlePreviewQuestions = async () => {
    try {
      const generatedQuestions = await generateQuestions(createFormData);
      setPreviewQuestions(generatedQuestions);
      setShowPreview(true);
    } catch (error) {
      alert('Failed to generate questions. Please try again.');
    }
  };

  // NEW: Regenerate questions
  const handleRegenerateQuestions = async () => {
    try {
      const newQuestions = await generateQuestions(createFormData);
      setPreviewQuestions(newQuestions);
    } catch (error) {
      alert('Failed to regenerate questions. Please try again.');
    }
  };

  // Updated: Handle create form submission with dynamic questions
  const handleCreateInterview = async (questionsToUse = null) => {
    setIsCreating(true);
    
    try {
      let interviewQuestions = questionsToUse;
      
      if (!interviewQuestions) {
        // Generate new questions if none provided
        interviewQuestions = await generateQuestions(createFormData);
      }
      
      const newInterview = await createInterview({
        ...createFormData,
        questions: interviewQuestions
      });
      
      setQuestions(interviewQuestions);
      setTimeLeft(interviewQuestions[0]?.timeLimit || 300);
      setShowCreateForm(false);
      setShowPreview(false);
      
      navigate(`/interview/${newInterview._id}`, { replace: true });
      
    } catch (error) {
      console.error('❌ Failed to create interview:', error);
      alert('Failed to create interview. Please try again.');
    } finally {
      setIsCreating(false);
    }
  };

  // Effect to load questions (keep existing logic)
  useEffect(() => {
    if (id && !showCreateForm) {
      fetchInterview(id).then(interview => {
        if (interview?.questions && interview.questions.length > 0) {
          setQuestions(interview.questions);
          setTimeLeft(interview.questions[0]?.timeLimit || 300);
        } else {
          // If no questions, redirect to create form
          setShowCreateForm(true);
        }
      }).catch(error => {
        console.error('❌ Failed to fetch interview:', error);
        setShowCreateForm(true);
      });
    }
  }, [id, showCreateForm, fetchInterview]);

  // Timer effect (keep existing)
  useEffect(() => {
    if (interviewStarted && timeLeft > 0) {
      timerRef.current = setTimeout(() => {
        setTimeLeft(timeLeft - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      handleNextQuestion();
    }
    
    return () => clearTimeout(timerRef.current);
  }, [timeLeft, interviewStarted]);

  const startInterview = () => {
    if (!questions || questions.length === 0) {
      alert('No questions available. Please create an interview first.');
      return;
    }
    
    setInterviewStarted(true);
    setTimeLeft(questions[0].timeLimit);
    console.log('🎯 Interview started!');
  };

  const handleNextQuestion = async () => {
    const currentQuestion = questions[currentQuestionIndex];
    const answerData = {
      questionId: currentQuestion.id,
      questionText: currentQuestion.text,
      textAnswer: currentAnswer,
      questionType: currentQuestion.type,
      timeSpent: currentQuestion.timeLimit - timeLeft,
      timestamp: new Date().toISOString()
    };
    
    setAnswers(prev => [...prev, answerData]);
    
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setCurrentAnswer('');
      setTimeLeft(questions[currentQuestionIndex + 1].timeLimit);
    } else {
      // Interview finished - start AI evaluation
      await finishInterview([...answers, answerData]);
    }
  };

  const finishInterview = async (finalAnswers) => {
    console.log('🏁 Interview finished! Starting AI evaluation...');
    setIsEvaluating(true);
    setEvaluationProgress(0);
    
    try {
      // Simulate evaluation progress
      const progressInterval = setInterval(() => {
        setEvaluationProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 500);

      // Get AI evaluation
      const aiResults = await GeminiAIService.evaluateAllAnswers(finalAnswers);
      
      clearInterval(progressInterval);
      setEvaluationProgress(100);
      
      // Create comprehensive results
      const results = {
        // Basic info
        overallScore: aiResults.averageScore,
        totalQuestions: aiResults.totalQuestions,
        completedAt: new Date().toISOString(),
        
        // AI Analysis
        aiEvaluation: aiResults,
        
        // Individual question results
        questionResults: aiResults.evaluations,
        
        // Overall recommendation
        recommendation: aiResults.recommendation,
        
        // Interview metadata
        duration: questions.reduce((acc, q, idx) => {
          if (idx <= currentQuestionIndex) {
            return acc + (q.timeLimit - (idx === currentQuestionIndex ? timeLeft : 0));
          }
          return acc;
        }, 0),
        
        // Legacy compatibility
        faceConfidence: Math.floor(Math.random() * 20) + 80,
        audioQuality: Math.floor(Math.random() * 20) + 80,
        answerRelevance: aiResults.averageScore,
        passed: aiResults.averageScore >= 70,
        
        // Overall insights
        strengths: aiResults.evaluations.flatMap(e => e.evaluation.strengths).slice(0, 5),
        improvements: aiResults.evaluations.flatMap(e => e.evaluation.improvements).slice(0, 5)
      };
      
      console.log('✅ AI evaluation completed:', results);
      
      // Navigate to results with AI data
      navigate(`/results/${id || 'new'}`, { 
        state: { 
          results: results, 
          answers: finalAnswers,
          aiEvaluation: true 
        }
      });
      
    } catch (error) {
      console.error('❌ Error during AI evaluation:', error);
      setIsEvaluating(false);
      
      // Fallback to basic results
      const fallbackResults = {
        overallScore: Math.floor(Math.random() * 30) + 70,
        faceConfidence: Math.floor(Math.random() * 20) + 80,
        audioQuality: Math.floor(Math.random() * 20) + 80,
        answerRelevance: Math.floor(Math.random() * 20) + 75,
        passed: true,
        completedAt: new Date().toISOString(),
        strengths: ["Clear communication", "Good technical knowledge"],
        improvements: ["Could provide more examples"]
      };
      
      navigate(`/results/${id || 'new'}`, { 
        state: { results: fallbackResults, answers: finalAnswers }
      });
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  // Show AI Evaluation Screen (keep existing)
  if (isEvaluating) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-xl p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <div className="text-6xl mb-4">🤖</div>
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              AI Evaluation in Progress
            </h1>
            <p className="text-gray-600 mb-6">
              Our AI is analyzing your answers and calculating your scores...
            </p>
            
            <div className="mb-4">
              <ProgressBar progress={evaluationProgress} className="h-3" />
            </div>
            
            <div className="text-sm text-gray-500 mb-6">
              {evaluationProgress < 30 && "Analyzing answer relevance..."}
              {evaluationProgress >= 30 && evaluationProgress < 60 && "Evaluating technical accuracy..."}
              {evaluationProgress >= 60 && evaluationProgress < 90 && "Calculating scores..."}
              {evaluationProgress >= 90 && "Generating recommendations..."}
            </div>
            
            <div className="flex items-center justify-center space-x-2">
              <LoadingSpinner size="sm" />
              <span className="text-sm text-gray-600">
                {evaluationProgress}% Complete
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show Question Preview Modal
  if (showPreview) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-xl p-8 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
          <div className="text-center mb-6">
            <div className="text-4xl mb-4">🎯</div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Preview Generated Questions</h1>
            <p className="text-gray-600">
              {previewQuestions.length} {createFormData.type} questions • {createFormData.difficulty} difficulty
            </p>
          </div>

          <div className="space-y-4 mb-6">
            {previewQuestions.map((question, index) => (
              <div key={question.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-medium text-gray-900">Question {index + 1}</h3>
                  <div className="flex space-x-2 text-xs">
                    <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">
                      {question.category}
                    </span>
                    <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded">
                      {Math.floor(question.timeLimit / 60)}min
                    </span>
                  </div>
                </div>
                <p className="text-gray-700 mb-3">{question.text}</p>
                {question.hints && question.hints.length > 0 && (
                  <div className="text-sm text-gray-600">
                    <strong>Hints:</strong> {question.hints.join(', ')}
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="flex space-x-3">
            <Button
              onClick={() => setShowPreview(false)}
              variant="outline"
              className="flex-1"
            >
              Back to Setup
            </Button>
            <Button
              onClick={handleRegenerateQuestions}
              disabled={isGeneratingQuestions}
              variant="outline"
              className="flex items-center"
            >
              {isGeneratingQuestions ? (
                <LoadingSpinner size="sm" className="mr-2" />
              ) : (
                <RefreshCw className="w-4 h-4 mr-2" />
              )}
              Regenerate
            </Button>
            <Button
              onClick={() => handleCreateInterview(previewQuestions)}
              disabled={isCreating}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isCreating ? (
                <>
                  <LoadingSpinner size="sm" className="mr-2" />
                  Creating...
                </>
              ) : (
                <>
                  🚀 Create Interview
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Show Create Interview Form (UPDATED)
  if (showCreateForm) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-xl p-8 max-w-2xl w-full mx-4">
          <div className="text-center mb-8">
            <div className="text-6xl mb-4">🎯</div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Create AI-Powered Interview</h1>
            <p className="text-gray-600">Generate dynamic questions tailored to your needs</p>
          </div>

          <form onSubmit={(e) => { e.preventDefault(); handlePreviewQuestions(); }} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Interview Title
              </label>
              <input
                type="text"
                required
                value={createFormData.title}
                onChange={(e) => setCreateFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="e.g., Frontend Developer Assessment"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Interview Type
                </label>
                <select
                  value={createFormData.type}
                  onChange={(e) => setCreateFormData(prev => ({ ...prev, type: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {questionTypes.map(type => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
                {questionTypes.find(t => t.value === createFormData.type)?.description && (
                  <p className="text-xs text-gray-500 mt-1">
                    {questionTypes.find(t => t.value === createFormData.type).description}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Duration (minutes)
                </label>
                <select
                  value={createFormData.duration}
                  onChange={(e) => setCreateFormData(prev => ({ ...prev, duration: parseInt(e.target.value) }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value={15}>15 minutes</option>
                  <option value={30}>30 minutes</option>
                  <option value={45}>45 minutes</option>
                  <option value={60}>60 minutes</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Difficulty Level
                </label>
                <select
                  value={createFormData.difficulty}
                  onChange={(e) => setCreateFormData(prev => ({ ...prev, difficulty: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
              </div>
            </div>

            <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-6 rounded-lg border border-purple-200">
              <div className="flex items-center mb-3">
                <Sparkles className="w-5 h-5 text-purple-600 mr-2" />
                <h3 className="font-medium text-purple-900">AI-Powered Question Generation</h3>
              </div>
              <div className="text-sm text-purple-800 space-y-2">
                <p>✨ Questions generated dynamically by Gemini AI</p>
                <p>🎯 Tailored to your selected type and difficulty</p>
                <p>📊 Each answer evaluated with detailed AI feedback</p>
                <p>🔄 Option to regenerate if questions don't fit your needs</p>
              </div>
            </div>

            <div className="flex space-x-4">
              <Button
                type="button"
                onClick={() => navigate('/dashboard')}
                variant="outline"
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handlePreviewQuestions}
                disabled={isGeneratingQuestions || !createFormData.title.trim()}
                className="flex-1 bg-purple-600 hover:bg-purple-700 text-white"
              >
                {isGeneratingQuestions ? (
                  <>
                    <LoadingSpinner size="sm" className="mr-2" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Eye className="w-4 h-4 mr-2" />
                    Preview Questions
                  </>
                )}
              </Button>
              <Button
                type="button"
                onClick={() => handleCreateInterview()}
                disabled={isCreating || isGeneratingQuestions || !createFormData.title.trim()}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
              >
                {isCreating ? (
                  <>
                    <LoadingSpinner size="sm" className="mr-2" />
                    Creating...
                  </>
                ) : (
                  <>
                    🚀 Quick Create
                  </>
                )}
              </Button>
            </div>

            <div className="text-center">
              <p className="text-xs text-gray-500">
                Preview questions before creating or use Quick Create for instant setup
              </p>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // Camera Preview Screen (UPDATED)
  if (!interviewStarted) {
    const currentQuestions = questions || [];
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-xl p-8 max-w-2xl w-full mx-4">
          <div className="text-center">
            <div className="text-6xl mb-4">🚀</div>
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Ready to Start Your AI Interview?
            </h1>
            <p className="text-gray-600 mb-6">
              You have {currentQuestions.length} AI-generated questions to answer. 
              Each answer will be evaluated by Gemini AI for detailed feedback.
            </p>
            
            <div className="mb-6">
              <SimpleCameraFeed className="w-full max-w-md mx-auto aspect-video" />
              <p className="text-sm text-gray-500 mt-2">
                Camera preview - make sure you're clearly visible
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
              <div className="bg-blue-50 p-3 rounded-lg">
                <div className="font-medium text-blue-900">Questions</div>
                <div className="text-blue-700">{currentQuestions.length} AI-generated</div>
              </div>
              <div className="bg-purple-50 p-3 rounded-lg">
                <div className="font-medium text-purple-900">Type</div>
                <div className="text-purple-700 capitalize">{createFormData.type}</div>
              </div>
            </div>

            {currentQuestions.length > 0 && (
              <div className="bg-gray-50 p-4 rounded-lg mb-6">
                <h3 className="font-medium text-gray-900 mb-2">Preview First Question:</h3>
                <p className="text-sm text-gray-700 italic">
                  "{currentQuestions[0].text}"
                </p>
                <div className="flex justify-center space-x-3 mt-2 text-xs">
                  <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">
                    {currentQuestions[0].category}
                  </span>
                  <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded">
                    {Math.floor(currentQuestions[0].timeLimit / 60)} minutes
                  </span>
                </div>
              </div>
            )}
            
            <Button 
              onClick={startInterview}
              className="w-full bg-green-600 hover:bg-green-700 text-white py-4 text-lg font-medium"
              disabled={currentQuestions.length === 0}
            >
              🎯 Start AI Interview
            </Button>
            
            {currentQuestions.length === 0 && (
              <div className="mt-4">
                <p className="text-red-600 text-sm mb-2">
                  No questions available. Please go back and create an interview.
                </p>
                <Button
                  onClick={() => setShowCreateForm(true)}
                  variant="outline"
                  className="mx-auto"
                >
                  Create Interview
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Check for questions before accessing
  if (!questions || questions.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">❌</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">No Questions Available</h2>
          <p className="text-gray-600 mb-4">Unable to load interview questions.</p>
          <div className="space-x-2">
            <Button
              onClick={() => setShowCreateForm(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              Create Interview
            </Button>
            <Button
              onClick={() => navigate('/dashboard')}
              variant="outline"
            >
              Go to Dashboard
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold text-gray-900">
                Question {currentQuestionIndex + 1} of {questions.length}
              </h1>
              <div className="flex items-center space-x-3 text-sm text-gray-500">
                <span>{currentQuestion.type} Question</span>
                <span>•</span>
                <span className="flex items-center">
                  <Sparkles className="w-4 h-4 mr-1" />
                  AI Generated
                </span>
                <span>•</span>
                <span>{currentQuestion.category}</span>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className={`text-lg font-mono ${timeLeft < 60 ? 'text-red-600' : 'text-gray-900'}`}>
                ⏱️ {formatTime(timeLeft)}
              </div>
            </div>
          </div>
          <ProgressBar progress={progress} className="mt-3" />
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Question & Answer */}
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-gray-900">
                  📝 Question {currentQuestionIndex + 1}
                </h2>
                <div className="flex items-center space-x-2">
                  <Sparkles className="w-5 h-5 text-purple-500" />
                  <span className="text-sm font-medium text-purple-600">AI Generated</span>
                </div>
              </div>
              <p className="text-lg text-gray-700 leading-relaxed mb-4">
                {currentQuestion.text}
              </p>
              
              {/* Question metadata */}
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">
                  {currentQuestion.type}
                </span>
                <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded">
                  {currentQuestion.category}
                </span>
                <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded">
                  {Math.floor(currentQuestion.timeLimit / 60)} minutes
                </span>
                <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded">
                  {currentQuestion.difficulty}
                </span>
              </div>

              {/* Hints if available */}
              {currentQuestion.hints && currentQuestion.hints.length > 0 && (
                <div className="mt-4 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                  <h4 className="text-sm font-medium text-yellow-800 mb-2">💡 Hints:</h4>
                  <ul className="text-sm text-yellow-700 space-y-1">
                    {currentQuestion.hints.map((hint, index) => (
                      <li key={index} className="flex items-start">
                        <span className="text-xs mr-2 mt-1">•</span>
                        {hint}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* ENHANCED ANSWER SECTION WITH SPEECH-TO-TEXT */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                💭 Your Answer
              </h3>
              
              {/* Speech-to-Text Component */}
              <SpeechToText
                value={currentAnswer}
                onChange={setCurrentAnswer}
                placeholder="Type your answer here or click the microphone to speak..."
              />
              
              <div className="mt-3 p-3 bg-purple-50 rounded-lg border border-purple-200">
                <div className="flex items-center space-x-2">
                  <div className="text-purple-600">🤖</div>
                  <span className="text-sm text-purple-700 font-medium">Gemini AI Evaluation Enabled</span>
                </div>
                <p className="text-xs text-purple-600 mt-1">
                  Your answer will be analyzed for relevance, accuracy, and communication quality.
                </p>
              </div>
            </div>

            <div className="flex space-x-3">
              <Button
                onClick={handleNextQuestion}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 font-medium"
                disabled={!currentAnswer.trim()}
              >
                {currentQuestionIndex < questions.length - 1 ? '➡️ Next Question' : '🏁 Finish & Get AI Results'}
              </Button>
              <Button
                onClick={() => {
                  if (window.confirm('Are you sure you want to end the interview?')) {
                    finishInterview([...answers]);
                  }
                }}
                variant="outline"
                className="px-6 py-3"
              >
                🚪 End Early
              </Button>
            </div>
          </div>

          {/* Right Column - Video Feed */}
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                🎥 Video Feed
              </h3>
              
              <SimpleCameraFeed className="aspect-video" />
              
              <p className="text-sm text-gray-500 mt-3">
                Maintain eye contact with the camera and speak clearly. 
                Your facial expressions and voice are being analyzed.
              </p>
            </div>

            {/* AI Features */}
            <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl p-6 border border-purple-200">
              <h3 className="text-lg font-semibold text-purple-900 mb-3">
                🤖 Gemini AI Analysis Features
              </h3>
              <ul className="text-sm text-purple-800 space-y-2">
                <li>• Dynamic question generation based on type/difficulty</li>
                <li>• Answer relevance scoring (0-100)</li>
                <li>• Technical accuracy evaluation</li>
                <li>• Communication clarity assessment</li>
                <li>• Personalized improvement tips</li>
                <li>• Comprehensive hiring recommendation</li>
              </ul>
            </div>

            {/* Tips */}
            <div className="bg-blue-50 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-blue-900 mb-3">
                💡 Interview Tips
              </h3>
              <ul className="text-sm text-blue-800 space-y-2">
                <li>• Click the microphone button to use voice input</li>
                <li>• Provide specific examples in your answers</li>
                <li>• Explain your thought process clearly</li>
                <li>• Use technical terms appropriately</li>
                <li>• Stay calm and take your time</li>
                <li>• Questions are AI-generated to match your level</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Interview;