// frontend/src/components/interview/QuestionDisplay.jsx
import React, { useState, useEffect } from 'react';
import { Clock, AlertCircle, CheckCircle, HelpCircle, FileText, Mic, Video } from 'lucide-react';

const QuestionDisplay = ({
    question,
    questionIndex,
    totalQuestions,
    timeRemaining,
    questionStatus,
    evaluation,
    className = ""
}) => {
    const [isTimeWarning, setIsTimeWarning] = useState(false);
    const [isTimeCritical, setIsTimeCritical] = useState(false);

    // Monitor time warnings
    useEffect(() => {
        if (timeRemaining <= 30 && timeRemaining > 10) {
            setIsTimeWarning(true);
            setIsTimeCritical(false);
        } else if (timeRemaining <= 10) {
            setIsTimeWarning(false);
            setIsTimeCritical(true);
        } else {
            setIsTimeWarning(false);
            setIsTimeCritical(false);
        }
    }, [timeRemaining]);

    const formatTime = (seconds) => {
        const minutes = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const getStatusIcon = () => {
        switch (questionStatus) {
            case 'completed':
                return <CheckCircle className="w-5 h-5 text-green-500" />;
            case 'evaluating':
                return <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />;
            case 'time_up':
                return <AlertCircle className="w-5 h-5 text-red-500" />;
            case 'in_progress':
            case 'answering':
                return <div className="w-5 h-5 bg-blue-500 rounded-full animate-pulse" />;
            default:
                return <HelpCircle className="w-5 h-5 text-gray-400" />;
        }
    };

    const getStatusText = () => {
        switch (questionStatus) {
            case 'not_started':
                return 'Ready to start';
            case 'in_progress':
                return 'Question active';
            case 'answering':
                return 'Recording answer';
            case 'submitting':
                return 'Submitting answer...';
            case 'evaluating':
                return 'Evaluating answer...';
            case 'completed':
                return evaluation?.passed ? 'Passed' : 'Completed';
            case 'time_up':
                return 'Time expired';
            case 'paused':
                return 'Paused';
            default:
                return 'Unknown status';
        }
    };

    const getAnswerMethods = () => {
        const methods = [];
        
        if (question.allowVideo) {
            methods.push({ icon: Video, label: 'Video', type: 'video' });
        }
        
        if (question.allowAudio) {
            methods.push({ icon: Mic, label: 'Audio', type: 'audio' });
        }
        
        if (question.allowText) {
            methods.push({ icon: FileText, label: 'Text', type: 'text' });
        }
        
        return methods;
    };

    if (!question) {
        return (
            <div className={`bg-gray-100 rounded-lg p-6 text-center ${className}`}>
                <HelpCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No question available</p>
            </div>
        );
    }

    return (
        <div className={`bg-white rounded-lg shadow-sm border ${className}`}>
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b bg-gray-50">
                <div className="flex items-center space-x-3">
                    <div className="flex items-center space-x-2">
                        {getStatusIcon()}
                        <span className="text-sm font-medium text-gray-700">
                            Question {questionIndex + 1} of {totalQuestions}
                        </span>
                    </div>
                    <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded-full">
                        {question.difficulty || 'Medium'}
                    </span>
                    {question.category && (
                        <span className="text-xs px-2 py-1 bg-purple-100 text-purple-700 rounded-full">
                            {question.category}
                        </span>
                    )}
                </div>

                {/* Timer */}
                <div className={`flex items-center space-x-2 px-3 py-1 rounded-full text-sm font-medium ${
                    isTimeCritical 
                        ? 'bg-red-100 text-red-700 animate-pulse' 
                        : isTimeWarning 
                        ? 'bg-yellow-100 text-yellow-700' 
                        : 'bg-gray-100 text-gray-700'
                }`}>
                    <Clock className="w-4 h-4" />
                    <span>{formatTime(timeRemaining)}</span>
                </div>
            </div>

            {/* Status Bar */}
            <div className={`px-4 py-2 text-sm ${
                questionStatus === 'completed' && evaluation?.passed 
                    ? 'bg-green-50 text-green-700 border-b border-green-200'
                    : questionStatus === 'completed' && !evaluation?.passed
                    ? 'bg-red-50 text-red-700 border-b border-red-200'
                    : questionStatus === 'evaluating'
                    ? 'bg-blue-50 text-blue-700 border-b border-blue-200'
                    : questionStatus === 'time_up'
                    ? 'bg-red-50 text-red-700 border-b border-red-200'
                    : 'bg-gray-50 text-gray-700 border-b border-gray-200'
            }`}>
                <div className="flex items-center justify-between">
                    <span>{getStatusText()}</span>
                    {evaluation?.overallScore && (
                        <span className="font-medium">
                            Score: {evaluation.overallScore}%
                        </span>
                    )}
                </div>
            </div>

            {/* Question Content */}
            <div className="p-6">
                {/* Question Text */}
                <div className="mb-6">
                    <h2 className="text-xl font-semibold text-gray-900 mb-3 leading-relaxed">
                        {question.text}
                    </h2>
                    
                    {question.description && (
                        <p className="text-gray-600 mb-4 leading-relaxed">
                            {question.description}
                        </p>
                    )}
                </div>

                {/* Answer Methods */}
                <div className="mb-6">
                    <h3 className="text-sm font-medium text-gray-700 mb-3">
                        You can answer using:
                    </h3>
                    <div className="flex flex-wrap gap-2">
                        {getAnswerMethods().map((method) => (
                            <div
                                key={method.type}
                                className="flex items-center space-x-2 px-3 py-2 bg-blue-50 text-blue-700 rounded-lg text-sm"
                            >
                                <method.icon className="w-4 h-4" />
                                <span>{method.label}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Question Guidelines */}
                {question.guidelines && question.guidelines.length > 0 && (
                    <div className="mb-6">
                        <h3 className="text-sm font-medium text-gray-700 mb-3">
                            Guidelines:
                        </h3>
                        <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
                            {question.guidelines.map((guideline, index) => (
                                <li key={index}>{guideline}</li>
                            ))}
                        </ul>
                    </div>
                )}

                {/* Expected Keywords */}
                {question.keywords && question.keywords.length > 0 && (
                    <div className="mb-6">
                        <h3 className="text-sm font-medium text-gray-700 mb-3">
                            Key topics to address:
                        </h3>
                        <div className="flex flex-wrap gap-2">
                            {question.keywords.map((keyword, index) => (
                                <span
                                    key={index}
                                    className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs"
                                >
                                    {keyword}
                                </span>
                            ))}
                        </div>
                    </div>
                )}

                {/* Time Limit Information */}
                <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center space-x-2 text-gray-600">
                            <Clock className="w-4 h-4" />
                            <span>Time limit: {Math.floor((question.timeLimit || 300) / 60)} minutes</span>
                        </div>
                        
                        {question.minDuration && (
                            <div className="text-gray-600">
                                Minimum: {Math.floor(question.minDuration / 60)} minutes
                            </div>
                        )}
                    </div>
                    
                    {isTimeWarning && (
                        <div className="mt-2 flex items-center space-x-2 text-yellow-700">
                            <AlertCircle className="w-4 h-4" />
                            <span className="text-xs">Less than 30 seconds remaining!</span>
                        </div>
                    )}
                    
                    {isTimeCritical && (
                        <div className="mt-2 flex items-center space-x-2 text-red-700 animate-pulse">
                            <AlertCircle className="w-4 h-4" />
                            <span className="text-xs font-medium">Time almost up!</span>
                        </div>
                    )}
                </div>

                {/* Evaluation Results */}
                {questionStatus === 'completed' && evaluation && (
                    <div className="mt-6 p-4 rounded-lg border-2 border-gray-200">
                        <h3 className="text-sm font-medium text-gray-900 mb-3">
                            Evaluation Results
                        </h3>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                            {evaluation.individualScores && (
                                <>
                                    <div className="text-center">
                                        <div className="text-2xl font-bold text-blue-600">
                                            {evaluation.individualScores.facial || 0}%
                                        </div>
                                        <div className="text-xs text-gray-600">Confidence</div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-2xl font-bold text-green-600">
                                            {evaluation.individualScores.audio || 0}%
                                        </div>
                                        <div className="text-xs text-gray-600">Audio Quality</div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-2xl font-bold text-purple-600">
                                            {evaluation.individualScores.text || 0}%
                                        </div>
                                        <div className="text-xs text-gray-600">Content Quality</div>
                                    </div>
                                </>
                            )}
                        </div>
                        
                        <div className="text-center">
                            <div className={`text-3xl font-bold mb-2 ${
                                evaluation.passed ? 'text-green-600' : 'text-red-600'
                            }`}>
                                {evaluation.overallScore}%
                            </div>
                            <div className={`text-sm font-medium ${
                                evaluation.passed ? 'text-green-700' : 'text-red-700'
                            }`}>
                                {evaluation.passed ? 'PASSED' : 'NEEDS IMPROVEMENT'}
                            </div>
                            {evaluation.grade && (
                                <div className="text-lg font-semibold text-gray-700 mt-1">
                                    Grade: {evaluation.grade}
                                </div>
                            )}
                        </div>
                        
                        {evaluation.feedback && (
                            <div className="mt-4 p-3 bg-gray-50 rounded text-sm text-gray-700">
                                <strong>Feedback:</strong> {evaluation.feedback}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default QuestionDisplay;