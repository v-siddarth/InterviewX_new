// frontend/src/components/interview/InterviewRoom.jsx - COMPLETE VERSION
import React, { useState, useEffect, useCallback } from 'react';
import { Play, Pause, Square, ChevronRight, ChevronLeft, Settings, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import { useInterview } from '../hooks/useInterview';
import { useWebSocket } from '../hooks/useWebSocket';
import VideoCapture from '../components/interview/VideoCapture';
import AudioRecorder from '../components/interview/AudioRecorder';
import QuestionDisplay from '../components/interview/QuestionDisplay';
import AnswerInput from '../components/interview/AnswerInput';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import ProgressBar from '../components/ui/ProgressBar';

const InterviewRoom = ({ interviewId }) => {
    const [isRecording, setIsRecording] = useState(false);
    const [recordingMode, setRecordingMode] = useState('both'); // 'both', 'video', 'audio', 'text'
    const [showSettings, setShowSettings] = useState(false);
    const [showExitConfirm, setShowExitConfirm] = useState(false);
    const [realTimeFeedback, setRealTimeFeedback] = useState({
        facial: null,
        audio: null
    });

    const {
        interview,
        currentQuestion,
        currentQuestionIndex,
        evaluation,
        isLoading,
        error,
        timeRemaining,
        interviewStatus,
        questionStatus,
        startInterview,
        startAnswering,
        updateAnswer,
        submitAnswer,
        nextQuestion,
        previousQuestion,
        pauseInterview,
        resumeInterview,
        exitInterview,
        hasNextQuestion,
        hasPreviousQuestion,
        getProgress,
        getQuestionProgress,
        formatTimeRemaining,
        getCurrentSubmission,
        getCurrentEvaluation,
        isQuestionAnswered
    } = useInterview(interviewId);

    const {
        isConnected,
        startFacialAnalysis,
        sendFacialFrame,
        stopFacialAnalysis,
        startAudioAnalysis,
        sendAudioChunk,
        stopAudioAnalysis,
        realTimeAnalysis,
        aiServicesHealth
    } = useWebSocket();

    // Handle real-time feedback updates
    useEffect(() => {
        setRealTimeFeedback(realTimeAnalysis);
    }, [realTimeAnalysis]);

    // Handle interview start
    const handleStartInterview = useCallback(async () => {
        try {
            await startInterview();
        } catch (err) {
            console.error('Failed to start interview:', err);
        }
    }, [startInterview]);

    // Handle start answering
    const handleStartAnswering = useCallback(async () => {
        try {
            await startAnswering();
            
            // Start real-time analysis if evaluation exists
            if (evaluation?.id) {
                if (currentQuestion?.allowVideo) {
                    startFacialAnalysis(evaluation.id);
                }
                if (currentQuestion?.allowAudio) {
                    startAudioAnalysis(evaluation.id);
                }
            }
        } catch (err) {
            console.error('Failed to start answering:', err);
        }
    }, [startAnswering, evaluation, currentQuestion, startFacialAnalysis, startAudioAnalysis]);

    // Handle recording start
    const handleRecordingStart = useCallback(() => {
        setIsRecording(true);
        if (questionStatus === 'in_progress') {
            handleStartAnswering();
        }
    }, [questionStatus, handleStartAnswering]);

    // Handle recording stop
    const handleRecordingStop = useCallback(() => {
        setIsRecording(false);
        
        // Stop real-time analysis
        stopFacialAnalysis();
        stopAudioAnalysis();
    }, [stopFacialAnalysis, stopAudioAnalysis]);

    // Handle video recording complete
    const handleVideoComplete = useCallback((videoBlob) => {
        updateAnswer('videoBlob', videoBlob);
    }, [updateAnswer]);

    // Handle audio recording complete
    const handleAudioComplete = useCallback((audioBlob) => {
        updateAnswer('audioBlob', audioBlob);
    }, [updateAnswer]);

    // Handle text answer change
    const handleTextChange = useCallback((text) => {
        updateAnswer('answerText', text);
    }, [updateAnswer]);

    // Handle frame capture for real-time analysis
    const handleFrameCapture = useCallback((frameData) => {
        if (isRecording && evaluation?.id) {
            sendFacialFrame(frameData);
        }
    }, [isRecording, evaluation, sendFacialFrame]);

    // Handle audio chunk for real-time analysis
    const handleAudioChunk = useCallback((audioChunk) => {
        if (isRecording && evaluation?.id) {
            sendAudioChunk(audioChunk);
        }
    }, [isRecording, evaluation, sendAudioChunk]);

    // Handle submit answer
    const handleSubmitAnswer = useCallback(async () => {
        try {
            setIsRecording(false);
            stopFacialAnalysis();
            stopAudioAnalysis();
            
            await submitAnswer();
        } catch (err) {
            console.error('Failed to submit answer:', err);
        }
    }, [submitAnswer, stopFacialAnalysis, stopAudioAnalysis]);

    // Handle pause/resume
    const handlePauseResume = useCallback(() => {
        if (interviewStatus === 'in_progress') {
            pauseInterview();
        } else if (interviewStatus === 'paused') {
            resumeInterview();
        }
    }, [interviewStatus, pauseInterview, resumeInterview]);

    // Handle exit interview
    const handleExitInterview = useCallback(() => {
        setShowExitConfirm(true);
    }, []);

    const confirmExit = useCallback(() => {
        exitInterview();
    }, [exitInterview]);

    // Get current submission
    const currentSubmission = getCurrentSubmission();
    const currentEvaluation = getCurrentEvaluation();

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-100 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
                    <p className="text-gray-600">Loading interview...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gray-100 flex items-center justify-center">
                <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full mx-4">
                    <div className="text-center">
                        <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                            Interview Error
                        </h3>
                        <p className="text-gray-600 mb-4">{error}</p>
                        <Button onClick={() => window.location.reload()} className="bg-blue-600 hover:bg-blue-700">
                            Retry
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    if (!interview || !currentQuestion) {
        return (
            <div className="min-h-screen bg-gray-100 flex items-center justify-center">
                <div className="text-center">
                    <p className="text-gray-600">No interview data available</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-100">
            {/* Header */}
            <div className="bg-white shadow-sm border-b sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        {/* Interview Info */}
                        <div className="flex items-center space-x-4">
                            <h1 className="text-xl font-semibold text-gray-900">
                                {interview.title}
                            </h1>
                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                                interviewStatus === 'in_progress' 
                                    ? 'bg-green-100 text-green-700'
                                    : interviewStatus === 'paused'
                                    ? 'bg-yellow-100 text-yellow-700'
                                    : 'bg-gray-100 text-gray-700'
                            }`}>
                                {interviewStatus === 'in_progress' ? 'In Progress' :
                                 interviewStatus === 'paused' ? 'Paused' : 'Ready'}
                            </span>
                        </div>

                        {/* Controls */}
                        <div className="flex items-center space-x-3">
                            {/* Time Display */}
                            <div className="flex items-center space-x-2 text-sm text-gray-600">
                                <Clock className="w-4 h-4" />
                                <span>{formatTimeRemaining()}</span>
                            </div>

                            {/* Connection Status */}
                            {isConnected ? (
                                <div className="flex items-center space-x-1 text-green-600">
                                    <div className="w-2 h-2 bg-green-500 rounded-full" />
                                    <span className="text-xs">Connected</span>
                                </div>
                            ) : (
                                <div className="flex items-center space-x-1 text-red-600">
                                    <div className="w-2 h-2 bg-red-500 rounded-full" />
                                    <span className="text-xs">Disconnected</span>
                                </div>
                            )}

                            {/* Settings */}
                            <Button
                                onClick={() => setShowSettings(true)}
                                variant="secondary"
                                size="sm"
                            >
                                <Settings className="w-4 h-4" />
                            </Button>

                            {/* Pause/Resume */}
                            {interviewStatus !== 'not_started' && (
                                <Button
                                    onClick={handlePauseResume}
                                    variant="secondary"
                                    size="sm"
                                >
                                    {interviewStatus === 'paused' ? (
                                        <Play className="w-4 h-4" />
                                    ) : (
                                        <Pause className="w-4 h-4" />
                                    )}
                                </Button>
                            )}

                            {/* Exit */}
                            <Button
                                onClick={handleExitInterview}
                                variant="secondary"
                                size="sm"
                                className="text-red-600 hover:text-red-700"
                            >
                                Exit
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Progress Bar */}
                <div className="bg-gray-50 px-4 py-2">
                    <div className="max-w-7xl mx-auto">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-gray-600">
                                Question {currentQuestionIndex + 1} of {interview.questions?.length || 0}
                            </span>
                            <span className="text-sm text-gray-600">
                                {getProgress()}% Complete
                            </span>
                        </div>
                        <ProgressBar 
                            progress={getProgress()} 
                            className="h-2"
                        />
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                {/* Start Interview Screen */}
                {interviewStatus === 'not_started' && (
                    <div className="text-center py-12">
                        <div className="bg-white rounded-lg shadow-lg p-8 max-w-2xl mx-auto">
                            <h2 className="text-2xl font-bold text-gray-900 mb-4">
                                Ready to Start Your Interview?
                            </h2>
                            <p className="text-gray-600 mb-6">
                                This interview contains {interview.questions?.length || 0} questions. 
                                Make sure you have a quiet environment and good internet connection.
                            </p>
                            
                            {/* AI Services Health Check */}
                            {aiServicesHealth && (
                                <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                                    <h3 className="text-sm font-medium text-gray-900 mb-3">System Status</h3>
                                    <div className="grid grid-cols-3 gap-4 text-sm">
                                        {aiServicesHealth.services?.map((service) => (
                                            <div key={service.service} className="text-center">
                                                <div className={`w-3 h-3 rounded-full mx-auto mb-1 ${
                                                    service.status === 'healthy' ? 'bg-green-500' : 'bg-red-500'
                                                }`} />
                                                <div className="font-medium capitalize">{service.service}</div>
                                                <div className={`text-xs ${
                                                    service.status === 'healthy' ? 'text-green-600' : 'text-red-600'
                                                }`}>
                                                    {service.status}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <Button 
                                onClick={handleStartInterview}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 text-lg"
                                disabled={!isConnected}
                            >
                                <Play className="w-5 h-5 mr-2" />
                                Start Interview
                            </Button>
                            
                            {!isConnected && (
                                <p className="text-red-600 text-sm mt-2">
                                    Please wait for connection to be established
                                </p>
                            )}
                        </div>
                    </div>
                )}

                {/* Interview Interface */}
                {interviewStatus !== 'not_started' && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Left Column - Question and Controls */}
                        <div className="space-y-6">
                            {/* Question Display */}
                            <QuestionDisplay
                                question={currentQuestion}
                                questionIndex={currentQuestionIndex}
                                totalQuestions={interview.questions?.length || 0}
                                timeRemaining={timeRemaining}
                                questionStatus={questionStatus}
                                evaluation={currentEvaluation}
                            />

                            {/* Navigation Controls */}
                            <div className="bg-white rounded-lg shadow-sm border p-4">
                                <div className="flex items-center justify-between">
                                    <Button
                                        onClick={previousQuestion}
                                        disabled={!hasPreviousQuestion()}
                                        variant="secondary"
                                        size="sm"
                                    >
                                        <ChevronLeft className="w-4 h-4 mr-1" />
                                        Previous
                                    </Button>

                                    {/* Question Status */}
                                    <div className="flex items-center space-x-2">
                                        {questionStatus === 'completed' ? (
                                            <CheckCircle className="w-5 h-5 text-green-500" />
                                        ) : questionStatus === 'evaluating' ? (
                                            <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                                        ) : (
                                            <div className="w-5 h-5 bg-gray-300 rounded-full" />
                                        )}
                                        <span className="text-sm text-gray-600">
                                            {questionStatus === 'completed' ? 'Completed' :
                                             questionStatus === 'evaluating' ? 'Evaluating...' :
                                             questionStatus === 'in_progress' ? 'Active' : 'Ready'}
                                        </span>
                                    </div>

                                    <Button
                                        onClick={nextQuestion}
                                        disabled={!hasNextQuestion() || questionStatus !== 'completed'}
                                        variant="secondary"
                                        size="sm"
                                    >
                                        Next
                                        <ChevronRight className="w-4 h-4 ml-1" />
                                    </Button>
                                </div>
                            </div>

                            {/* Answer Controls */}
                            {questionStatus !== 'completed' && (
                                <div className="bg-white rounded-lg shadow-sm border p-4">
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="font-medium text-gray-900">Answer Controls</h3>
                                        <div className="flex items-center space-x-2">
                                            {isRecording && (
                                                <div className="flex items-center space-x-2 text-red-600">
                                                    <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                                                    <span className="text-sm">Recording</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        {/* Start Answering */}
                                        {questionStatus === 'in_progress' && (
                                            <Button
                                                onClick={handleStartAnswering}
                                                className="w-full bg-green-600 hover:bg-green-700"
                                            >
                                                <Play className="w-4 h-4 mr-2" />
                                                Start Answering
                                            </Button>
                                        )}

                                        {/* Submit Answer */}
                                        {questionStatus === 'answering' && currentSubmission && (
                                            <Button
                                                onClick={handleSubmitAnswer}
                                                className="w-full bg-blue-600 hover:bg-blue-700"
                                                disabled={!currentSubmission.answerText && !currentSubmission.videoBlob && !currentSubmission.audioBlob}
                                            >
                                                <Square className="w-4 h-4 mr-2" />
                                                Submit Answer
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Real-time Feedback */}
                            {isRecording && realTimeFeedback && (
                                <div className="bg-white rounded-lg shadow-sm border p-4">
                                    <h3 className="font-medium text-gray-900 mb-3">Live Feedback</h3>
                                    
                                    {realTimeFeedback.facial && (
                                        <div className="mb-3 p-3 bg-blue-50 rounded-lg">
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm font-medium text-blue-900">
                                                    Confidence Score
                                                </span>
                                                <span className="text-lg font-bold text-blue-700">
                                                    {realTimeFeedback.facial.confidence_score}%
                                                </span>
                                            </div>
                                            <div className="text-xs text-blue-700 mt-1">
                                                {realTimeFeedback.facial.face_detected ? 'Face detected' : 'No face detected'}
                                            </div>
                                        </div>
                                    )}

                                    {realTimeFeedback.audio && (
                                        <div className="p-3 bg-green-50 rounded-lg">
                                            <div className="text-sm font-medium text-green-900 mb-2">
                                                Live Transcription
                                            </div>
                                            <p className="text-sm text-green-800 italic">
                                                {realTimeFeedback.audio.text || realTimeFeedback.audio.full_transcription}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Right Column - Recording Interface */}
                        <div className="space-y-6">
                            {/* Video Capture */}
                            {currentQuestion?.allowVideo && (
                                <VideoCapture
                                    onRecordingComplete={handleVideoComplete}
                                    onRecordingStart={handleRecordingStart}
                                    onRecordingStop={handleRecordingStop}
                                    onFrameCapture={handleFrameCapture}
                                    isInterviewActive={questionStatus === 'answering'}
                                    maxDuration={timeRemaining}
                                    className="aspect-video"
                                />
                            )}

                            {/* Audio Recorder */}
                            {currentQuestion?.allowAudio && (
                                <AudioRecorder
                                    onRecordingComplete={handleAudioComplete}
                                    onRecordingStart={handleRecordingStart}
                                    onRecordingStop={handleRecordingStop}
                                    onAudioChunk={handleAudioChunk}
                                    isInterviewActive={questionStatus === 'answering'}
                                    maxDuration={timeRemaining}
                                    visualFeedback={true}
                                />
                            )}

                            {/* Text Input */}
                            {currentQuestion?.allowText && (
                                <AnswerInput
                                    question={currentQuestion}
                                    currentAnswer={currentSubmission?.answerText || ''}
                                    onAnswerChange={handleTextChange}
                                    questionStatus={questionStatus}
                                    autoSave={true}
                                    showWordCount={true}
                                />
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Settings Modal */}
            {showSettings && (
                <Modal
                    isOpen={showSettings}
                    onClose={() => setShowSettings(false)}
                    title="Interview Settings"
                >
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Recording Mode
                            </label>
                            <select
                                value={recordingMode}
                                onChange={(e) => setRecordingMode(e.target.value)}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            >
                                <option value="both">Video + Audio</option>
                                <option value="video">Video Only</option>
                                <option value="audio">Audio Only</option>
                                <option value="text">Text Only</option>
                            </select>
                        </div>

                        {aiServicesHealth && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    AI Services Status
                                </label>
                                <div className="space-y-2">
                                    {aiServicesHealth.services?.map((service) => (
                                        <div key={service.service} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                                            <span className="capitalize">{service.service}</span>
                                            <span className={`px-2 py-1 rounded text-xs ${
                                                service.status === 'healthy' 
                                                    ? 'bg-green-100 text-green-700' 
                                                    : 'bg-red-100 text-red-700'
                                            }`}>
                                                {service.status}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </Modal>
            )}

            {/* Exit Confirmation Modal */}
            {showExitConfirm && (
                <Modal
                    isOpen={showExitConfirm}
                    onClose={() => setShowExitConfirm(false)}
                    title="Exit Interview"
                >
                    <div className="space-y-4">
                        <p className="text-gray-600">
                            Are you sure you want to exit the interview? Your progress will be saved, 
                            but you may not be able to resume from where you left off.
                        </p>
                        <div className="flex space-x-3">
                            <Button
                                onClick={() => setShowExitConfirm(false)}
                                variant="secondary"
                                className="flex-1"
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={confirmExit}
                                className="flex-1 bg-red-600 hover:bg-red-700"
                            >
                                Exit Interview
                            </Button>
                        </div>
                    </div>
                </Modal>
            )}
        </div>
    );
};
