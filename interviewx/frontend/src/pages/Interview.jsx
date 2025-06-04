// frontend/src/pages/Interview.jsx - FIXED VIDEO REF ISSUE
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useInterviewStore } from '../store/interviewStore';
import Button from '../components/ui/Button';
import ProgressBar from '../components/ui/ProgressBar';
import LoadingSpinner from '../components/ui/LoadingSpinner';

const Interview = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentInterview, fetchInterview, submitAnswer } = useInterviewStore();
  
  // Interview State
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [isRecording, setIsRecording] = useState(false);
  const [timeLeft, setTimeLeft] = useState(300);
  const [interviewStarted, setInterviewStarted] = useState(false);
  const [permissionsGranted, setPermissionsGranted] = useState(false);
  
  // Media State
  const [stream, setStream] = useState(null);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [recordedChunks, setRecordedChunks] = useState([]);
  const [currentAnswer, setCurrentAnswer] = useState('');
  
  // Debug state
  const [debugInfo, setDebugInfo] = useState({
    hasStream: false,
    videoReady: false,
    videoError: null,
    streamActive: false
  });
  
  // Refs
  const videoRef = useRef(null);
  const timerRef = useRef(null);
  
  const mockQuestions = [
    {
      id: 1,
      text: "Tell me about yourself and your background in technology.",
      type: "behavioral",
      timeLimit: 300
    },
    {
      id: 2,
      text: "Describe a challenging project you worked on and how you overcame obstacles.",
      type: "behavioral",
      timeLimit: 300
    },
    {
      id: 3,
      text: "Explain the difference between let, const, and var in JavaScript.",
      type: "technical",
      timeLimit: 180
    },
    {
      id: 4,
      text: "How would you optimize the performance of a web application?",
      type: "technical",
      timeLimit: 240
    },
    {
      id: 5,
      text: "Where do you see yourself in the next 5 years?",
      type: "behavioral",
      timeLimit: 180
    }
  ];

  // Effect to handle stream and video setup
  useEffect(() => {
    if (stream && videoRef.current) {
      console.log('🔄 Setting up video with stream...');
      console.log('📺 Video ref:', videoRef.current);
      console.log('🌊 Stream:', stream);
      
      try {
        videoRef.current.srcObject = stream;
        
        // Set up all event listeners
        const video = videoRef.current;
        
        const handleLoadedMetadata = () => {
          console.log('📺 Metadata loaded - dimensions:', video.videoWidth, 'x', video.videoHeight);
          setDebugInfo(prev => ({ ...prev, videoReady: true }));
          
          video.play()
            .then(() => {
              console.log('✅ Video playing successfully');
            })
            .catch(error => {
              console.error('❌ Video play error:', error);
              setDebugInfo(prev => ({ ...prev, videoError: error.message }));
            });
        };
        
        const handleCanPlay = () => {
          console.log('📺 Video can play');
        };
        
        const handlePlaying = () => {
          console.log('▶️ Video is playing');
        };
        
        const handleError = (e) => {
          console.error('❌ Video error:', e);
          setDebugInfo(prev => ({ ...prev, videoError: 'Video playback error' }));
        };
        
        // Add event listeners
        video.addEventListener('loadedmetadata', handleLoadedMetadata);
        video.addEventListener('canplay', handleCanPlay);
        video.addEventListener('playing', handlePlaying);
        video.addEventListener('error', handleError);
        
        // Force load
        video.load();
        
        // Cleanup function
        return () => {
          video.removeEventListener('loadedmetadata', handleLoadedMetadata);
          video.removeEventListener('canplay', handleCanPlay);
          video.removeEventListener('playing', handlePlaying);
          video.removeEventListener('error', handleError);
        };
      } catch (error) {
        console.error('❌ Error setting up video:', error);
        setDebugInfo(prev => ({ ...prev, videoError: error.message }));
      }
    }
  }, [stream, videoRef.current]);

  useEffect(() => {
    if (id) {
      // In real app: fetchInterview(id);
    }
  }, [id]);

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

  const requestPermissions = async () => {
    try {
      console.log('🎥 Requesting camera permissions...');
      
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { 
          width: { ideal: 1280 },
          height: { ideal: 720 },
          frameRate: { ideal: 30 }
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });
      
      console.log('✅ Media stream obtained:', mediaStream);
      console.log('📹 Video tracks:', mediaStream.getVideoTracks());
      console.log('🎵 Audio tracks:', mediaStream.getAudioTracks());
      
      // Update debug info
      setDebugInfo(prev => ({
        ...prev,
        hasStream: true,
        streamActive: mediaStream.active
      }));
      
      // Set stream - this will trigger the useEffect above
      setStream(mediaStream);
      setPermissionsGranted(true);
      
      // Setup media recorder
      console.log('🎬 Setting up MediaRecorder...');
      const recorder = new MediaRecorder(mediaStream, {
        mimeType: 'video/webm;codecs=vp8,opus'
      });
      
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          setRecordedChunks(prev => [...prev, event.data]);
        }
      };
      
      recorder.onerror = (event) => {
        console.error('❌ MediaRecorder error:', event.error);
      };
      
      setMediaRecorder(recorder);
      console.log('✅ MediaRecorder setup complete');
      
    } catch (error) {
      console.error('❌ Error accessing media devices:', error);
      
      let errorMessage = 'Camera and microphone access is required for the interview.';
      
      if (error.name === 'NotAllowedError') {
        errorMessage = 'Camera access denied. Please allow camera permission and refresh the page.';
      } else if (error.name === 'NotFoundError') {
        errorMessage = 'No camera found. Please connect a camera and try again.';
      } else if (error.name === 'NotReadableError') {
        errorMessage = 'Camera is being used by another application. Please close other applications and try again.';
      } else if (error.name === 'OverconstrainedError') {
        errorMessage = 'Camera does not support the required settings. Trying with default settings...';
        
        // Try with simpler constraints
        try {
          const simpleStream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: true
          });
          
          console.log('✅ Simple media stream obtained:', simpleStream);
          setStream(simpleStream);
          setPermissionsGranted(true);
          return;
        } catch (simpleError) {
          console.error('❌ Simple constraints also failed:', simpleError);
        }
      }
      
      setDebugInfo(prev => ({ ...prev, videoError: error.message }));
      alert(errorMessage);
    }
  };

  const startInterview = () => {
    setInterviewStarted(true);
    setTimeLeft(mockQuestions[0].timeLimit);
    startRecording();
  };

  const startRecording = () => {
    if (mediaRecorder && mediaRecorder.state === 'inactive') {
      setRecordedChunks([]);
      mediaRecorder.start(1000);
      setIsRecording(true);
      console.log('🎬 Recording started');
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && mediaRecorder.state === 'recording') {
      mediaRecorder.stop();
      setIsRecording(false);
      console.log('⏹️ Recording stopped');
    }
  };

  const handleNextQuestion = async () => {
    stopRecording();
    
    const answerData = {
      questionId: mockQuestions[currentQuestionIndex].id,
      questionText: mockQuestions[currentQuestionIndex].text,
      textAnswer: currentAnswer,
      audioBlob: recordedChunks.length > 0 ? new Blob(recordedChunks, { type: 'video/webm' }) : null,
      timeSpent: mockQuestions[currentQuestionIndex].timeLimit - timeLeft,
      timestamp: new Date().toISOString()
    };
    
    setAnswers(prev => [...prev, answerData]);
    console.log('🤖 Analyzing answer with AI...', answerData);
    
    if (currentQuestionIndex < mockQuestions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setCurrentAnswer('');
      setTimeLeft(mockQuestions[currentQuestionIndex + 1].timeLimit);
      setTimeout(startRecording, 1000);
    } else {
      finishInterview();
    }
  };

  const finishInterview = async () => {
    stopRecording();
    
    if (stream) {
      stream.getTracks().forEach(track => {
        track.stop();
        console.log('🛑 Stopped track:', track.kind);
      });
    }
    
    const mockResults = {
      overallScore: Math.floor(Math.random() * 30) + 70,
      faceConfidence: Math.floor(Math.random() * 20) + 80,
      audioQuality: Math.floor(Math.random() * 20) + 80,
      answerRelevance: Math.floor(Math.random() * 20) + 75,
      answers: answers
    };
    
    console.log('🎯 Interview completed! Results:', mockResults);
    navigate(`/results/${id}`, { 
      state: { results: mockResults, answers: [...answers] }
    });
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [stream]);

  // Debug function to manually trigger video play
  const debugPlayVideo = () => {
    if (videoRef.current) {
      console.log('🔧 Debug: Manually triggering video play');
      console.log('🔧 Video element:', videoRef.current);
      console.log('🔧 Video srcObject:', videoRef.current.srcObject);
      console.log('🔧 Video readyState:', videoRef.current.readyState);
      console.log('🔧 Video networkState:', videoRef.current.networkState);
      
      videoRef.current.play()
        .then(() => console.log('✅ Manual play successful'))
        .catch(err => console.error('❌ Manual play failed:', err));
    } else {
      console.log('❌ Video ref is null');
    }
  };

  if (!permissionsGranted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-xl p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <div className="text-6xl mb-4">🎥</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Camera & Audio Permission Required
            </h2>
            <p className="text-gray-600 mb-6">
              We need access to your camera and microphone to conduct the interview. 
              Your privacy is protected and recordings are only used for evaluation.
            </p>
            <Button 
              onClick={requestPermissions}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3"
            >
              🔑 Grant Permissions
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!interviewStarted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-xl p-8 max-w-2xl w-full mx-4">
          <div className="text-center">
            <div className="text-6xl mb-4">🚀</div>
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Ready to Start Your Interview?
            </h1>
            <p className="text-gray-600 mb-6">
              You have {mockQuestions.length} questions to answer. 
              Each question has a time limit. Make sure you're in a quiet environment.
            </p>
            
            {/* Camera Preview with Debug Info */}
            <div className="mb-6">
              <div className="relative bg-gray-900 rounded-lg overflow-hidden mx-auto" style={{width: '400px', height: '300px'}}>
                <video 
                  ref={videoRef}
                  autoPlay 
                  muted 
                  playsInline
                  controls={false}
                  className="w-full h-full object-cover"
                  style={{ transform: 'scaleX(-1)' }}
                />
                <div className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded text-sm">
                  LIVE
                </div>
                
                {/* Debug Overlay */}
                <div className="absolute top-2 left-2 bg-black bg-opacity-75 text-white p-2 rounded text-xs">
                  <div>Stream: {debugInfo.hasStream ? '✅' : '❌'}</div>
                  <div>Active: {debugInfo.streamActive ? '✅' : '❌'}</div>
                  <div>Video: {debugInfo.videoReady ? '✅' : '❌'}</div>
                  {debugInfo.videoError && <div className="text-red-300">Error: {debugInfo.videoError}</div>}
                </div>
                
                {/* Loading overlay */}
                {debugInfo.hasStream && !debugInfo.videoReady && (
                  <div className="absolute inset-0 flex items-center justify-center bg-gray-800 bg-opacity-50">
                    <div className="text-white text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
                      <p className="text-sm">Loading camera...</p>
                    </div>
                  </div>
                )}
              </div>
              <p className="text-sm text-gray-500 mt-2">Camera preview - make sure you're clearly visible</p>
              
              {/* Debug Controls
              <div className="mt-4 space-y-2">
                <Button 
                  onClick={debugPlayVideo}
                  variant="outline"
                  size="sm"
                  className="text-xs"
                >
                  🔧 Debug: Force Play Video
                </Button>
                
                {/* Debug Info Display */}
                {/* <div className="text-xs text-gray-600 bg-gray-100 p-2 rounded">
                  <div><strong>Debug Info:</strong></div>
                  <div>Has Stream: {debugInfo.hasStream ? 'Yes' : 'No'}</div>
                  <div>Stream Active: {debugInfo.streamActive ? 'Yes' : 'No'}</div>
                  <div>Video Ready: {debugInfo.videoReady ? 'Yes' : 'No'}</div>
                  {debugInfo.videoError && <div>Error: {debugInfo.videoError}</div>}
                  <div>Video Element: {videoRef.current ? 'Present' : 'Missing'}</div>
                  {videoRef.current && (
                    <>
                      <div>Ready State: {videoRef.current.readyState}</div>
                      <div>Network State: {videoRef.current.networkState}</div>
                      <div>Paused: {videoRef.current.paused ? 'Yes' : 'No'}</div>
                      <div>Has Source: {videoRef.current.srcObject ? 'Yes' : 'No'}</div>
                    </>
                  )}
                </div>
              </div>  */}
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
              <div className="bg-blue-50 p-3 rounded-lg">
                <div className="font-medium text-blue-900">Questions</div>
                <div className="text-blue-700">{mockQuestions.length} questions</div>
              </div>
              <div className="bg-green-50 p-3 rounded-lg">
                <div className="font-medium text-green-900">Total Time</div>
                <div className="text-green-700">~{Math.round(mockQuestions.reduce((acc, q) => acc + q.timeLimit, 0) / 60)} minutes</div>
              </div>
            </div>
            
            <Button 
              onClick={startInterview}
              className="w-full bg-green-600 hover:bg-green-700 text-white py-4 text-lg font-medium"
              disabled={!debugInfo.hasStream}
            >
              🎯 Start Interview
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const currentQuestion = mockQuestions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / mockQuestions.length) * 100;

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold text-gray-900">
                Question {currentQuestionIndex + 1} of {mockQuestions.length}
              </h1>
              <p className="text-sm text-gray-500">{currentQuestion.type} Question</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className={`text-lg font-mono ${timeLeft < 60 ? 'text-red-600' : 'text-gray-900'}`}>
                ⏱️ {formatTime(timeLeft)}
              </div>
              <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                isRecording ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'
              }`}>
                {isRecording ? '🔴 Recording' : '⏸️ Paused'}
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
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                📝 Question {currentQuestionIndex + 1}
              </h2>
              <p className="text-lg text-gray-700 leading-relaxed">
                {currentQuestion.text}
              </p>
              <div className="mt-4 flex items-center text-sm text-gray-500">
                <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">
                  {currentQuestion.type}
                </span>
                <span className="ml-3">⏰ {Math.floor(currentQuestion.timeLimit / 60)} minutes</span>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                💭 Your Answer (Optional)
              </h3>
              <textarea
                value={currentAnswer}
                onChange={(e) => setCurrentAnswer(e.target.value)}
                placeholder="Type your answer here or just speak to the camera..."
                className="w-full h-32 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
              <p className="text-sm text-gray-500 mt-2">
                You can type notes or your full answer here. Voice recording is also captured.
              </p>
            </div>

            <div className="flex space-x-3">
              <Button
                onClick={handleNextQuestion}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 font-medium"
              >
                {currentQuestionIndex < mockQuestions.length - 1 ? '➡️ Next Question' : '🏁 Finish Interview'}
              </Button>
              <Button
                onClick={() => {
                  if (window.confirm('Are you sure you want to end the interview?')) {
                    finishInterview();
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
              <div className="relative bg-gray-900 rounded-lg overflow-hidden aspect-video">
                <video 
                  ref={videoRef}
                  autoPlay 
                  muted 
                  playsInline
                  className="w-full h-full object-cover"
                  style={{ transform: 'scaleX(-1)' }}
                />
                <div className="absolute top-4 right-4 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                  🔴 LIVE
                </div>
                {isRecording && (
                  <div className="absolute bottom-4 left-4 bg-black bg-opacity-50 text-white px-3 py-1 rounded-full text-sm">
                    Recording...
                  </div>
                )}
              </div>
              <p className="text-sm text-gray-500 mt-3">
                Maintain eye contact with the camera and speak clearly. 
                Your facial expressions and voice are being analyzed.
              </p>
            </div>

            {/* AI Analysis Status */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                🤖 AI Analysis Status
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Face Detection</span>
                  <span className={`text-sm font-medium ${stream ? 'text-green-600' : 'text-gray-500'}`}>
                    {stream ? '✅ Active' : '⏳ Waiting'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Voice Recording</span>
                  <span className={`text-sm font-medium ${isRecording ? 'text-green-600' : 'text-gray-500'}`}>
                    {isRecording ? '✅ Recording' : '⏸️ Standby'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Confidence Level</span>
                  <span className="text-sm font-medium text-blue-600">📊 Analyzing...</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Speech Quality</span>
                  <span className="text-sm font-medium text-blue-600">📊 Analyzing...</span>
                </div>
              </div>
            </div>

            {/* Tips */}
            <div className="bg-blue-50 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-blue-900 mb-3">
                💡 Interview Tips
              </h3>
              <ul className="text-sm text-blue-800 space-y-2">
                <li>• Maintain good posture and eye contact</li>
                <li>• Speak clearly and at a moderate pace</li>
                <li>• Use specific examples in your answers</li>
                <li>• Stay calm and take your time to think</li>
                <li>• Don't worry if you need to pause</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Interview;