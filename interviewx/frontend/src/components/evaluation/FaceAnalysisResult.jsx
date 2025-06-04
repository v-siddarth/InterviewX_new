// frontend/src/components/evaluation/FaceAnalysisResult.jsx
import React, { useState } from 'react';
import { Eye, TrendingUp, AlertCircle, CheckCircle, Info, ChevronDown, ChevronUp } from 'lucide-react';

const FaceAnalysisResult = ({ 
    analysis, 
    showDetails = true, 
    compact = false,
    className = "" 
}) => {
    const [isExpanded, setIsExpanded] = useState(!compact);

    if (!analysis) {
        return (
            <div className={`bg-gray-50 rounded-lg p-4 text-center ${className}`}>
                <AlertCircle className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-600 text-sm">No facial analysis data available</p>
            </div>
        );
    }

    const {
        confidenceScore = 0,
        faceDetected = false,
        emotions = {},
        faceLandmarks = {},
        passedThreshold = false,
        analysisTimestamp,
        frameCount = 0,
        averageConfidence = 0,
        confidenceTrend = 'stable'
    } = analysis;

    const getScoreColor = (score) => {
        if (score >= 80) return 'text-green-600';
        if (score >= 60) return 'text-yellow-600';
        return 'text-red-600';
    };

    const getScoreBgColor = (score) => {
        if (score >= 80) return 'bg-green-100';
        if (score >= 60) return 'bg-yellow-100';
        return 'bg-red-100';
    };

    const getConfidenceLevel = (score) => {
        if (score >= 90) return 'Excellent';
        if (score >= 80) return 'Good';
        if (score >= 70) return 'Fair';
        if (score >= 60) return 'Needs Improvement';
        return 'Poor';
    };

    const getTrendIcon = () => {
        switch (confidenceTrend) {
            case 'improving':
                return <TrendingUp className="w-4 h-4 text-green-500" />;
            case 'declining':
                return <TrendingUp className="w-4 h-4 text-red-500 transform rotate-180" />;
            default:
                return <div className="w-4 h-4 bg-gray-400 rounded-full" />;
        }
    };

    const formatEmotions = () => {
        if (!emotions || Object.keys(emotions).length === 0) return [];
        
        return Object.entries(emotions)
            .map(([emotion, value]) => ({
                emotion: emotion.charAt(0).toUpperCase() + emotion.slice(1),
                value: Math.round(value * 100),
                color: emotion === 'confident' ? 'bg-green-500' : 
                       emotion === 'calm' ? 'bg-blue-500' :
                       emotion === 'focused' ? 'bg-purple-500' :
                       emotion === 'nervous' ? 'bg-yellow-500' :
                       emotion === 'stressed' ? 'bg-red-500' : 'bg-gray-500'
            }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 5); // Show top 5 emotions
    };

    const emotionData = formatEmotions();

    if (compact) {
        return (
            <div className={`bg-white rounded-lg border p-4 ${className}`}>
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <div className={`p-2 rounded-full ${getScoreBgColor(confidenceScore)}`}>
                            <Eye className={`w-5 h-5 ${getScoreColor(confidenceScore)}`} />
                        </div>
                        <div>
                            <h3 className="font-medium text-gray-900">Facial Confidence</h3>
                            <div className="flex items-center space-x-2">
                                <span className={`text-2xl font-bold ${getScoreColor(confidenceScore)}`}>
                                    {confidenceScore}%
                                </span>
                                <span className={`text-xs px-2 py-1 rounded-full ${
                                    passedThreshold ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                }`}>
                                    {passedThreshold ? 'Passed' : 'Failed'}
                                </span>
                            </div>
                        </div>
                    </div>
                    
                    {showDetails && (
                        <button
                            onClick={() => setIsExpanded(!isExpanded)}
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            {isExpanded ? (
                                <ChevronUp className="w-4 h-4 text-gray-500" />
                            ) : (
                                <ChevronDown className="w-4 h-4 text-gray-500" />
                            )}
                        </button>
                    )}
                </div>
                
                {isExpanded && showDetails && (
                    <div className="mt-4 pt-4 border-t space-y-3">
                        {/* Quick Stats */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="text-center">
                                <div className="text-sm text-gray-600">Detection Rate</div>
                                <div className="text-lg font-semibold text-gray-900">
                                    {faceDetected ? '100%' : '0%'}
                                </div>
                            </div>
                            <div className="text-center">
                                <div className="text-sm text-gray-600">Confidence Level</div>
                                <div className="text-lg font-semibold text-gray-900">
                                    {getConfidenceLevel(confidenceScore)}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className={`bg-white rounded-lg border shadow-sm ${className}`}>
            {/* Header */}
            <div className="p-6 border-b">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <div className={`p-3 rounded-full ${getScoreBgColor(confidenceScore)}`}>
                            <Eye className={`w-6 h-6 ${getScoreColor(confidenceScore)}`} />
                        </div>
                        <div>
                            <h2 className="text-xl font-semibold text-gray-900">Facial Analysis</h2>
                            <p className="text-gray-600">Confidence and emotional assessment</p>
                        </div>
                    </div>
                    
                    <div className="text-right">
                        <div className="flex items-center space-x-2">
                            {passedThreshold ? (
                                <CheckCircle className="w-5 h-5 text-green-500" />
                            ) : (
                                <AlertCircle className="w-5 h-5 text-red-500" />
                            )}
                            <span className={`font-medium ${
                                passedThreshold ? 'text-green-600' : 'text-red-600'
                            }`}>
                                {passedThreshold ? 'Passed' : 'Failed'}
                            </span>
                        </div>
                        <p className="text-sm text-gray-500 mt-1">
                            Threshold: 80%
                        </p>
                    </div>
                </div>
            </div>

            {/* Main Score */}
            <div className="p-6">
                <div className="text-center mb-6">
                    <div className={`text-5xl font-bold mb-2 ${getScoreColor(confidenceScore)}`}>
                        {confidenceScore}%
                    </div>
                    <div className="text-lg text-gray-600 mb-4">
                        Overall Confidence Score
                    </div>
                    
                    {/* Progress Bar */}
                    <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
                        <div 
                            className={`h-3 rounded-full transition-all duration-1000 ${
                                confidenceScore >= 80 ? 'bg-green-500' :
                                confidenceScore >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                            }`}
                            style={{ width: `${Math.min(confidenceScore, 100)}%` }}
                        />
                    </div>
                    
                    <div className="flex items-center justify-center space-x-2 text-sm text-gray-600">
                        <span>Confidence Level: </span>
                        <span className="font-medium">{getConfidenceLevel(confidenceScore)}</span>
                        {getTrendIcon()}
                    </div>
                </div>

                {/* Detailed Metrics */}
                <div className="grid md:grid-cols-2 gap-6">
                    {/* Detection & Technical Metrics */}
                    <div className="space-y-4">
                        <h3 className="font-medium text-gray-900 mb-3">Detection Metrics</h3>
                        
                        <div className="space-y-3">
                            <div className="flex justify-between items-center">
                                <span className="text-gray-600">Face Detection</span>
                                <div className="flex items-center space-x-2">
                                    {faceDetected ? (
                                        <CheckCircle className="w-4 h-4 text-green-500" />
                                    ) : (
                                        <AlertCircle className="w-4 h-4 text-red-500" />
                                    )}
                                    <span className={faceDetected ? 'text-green-600' : 'text-red-600'}>
                                        {faceDetected ? 'Detected' : 'Not Detected'}
                                    </span>
                                </div>
                            </div>
                            
                            {averageConfidence > 0 && (
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-600">Average Confidence</span>
                                    <span className="font-medium">{averageConfidence}%</span>
                                </div>
                            )}
                            
                            {frameCount > 0 && (
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-600">Frames Analyzed</span>
                                    <span className="font-medium">{frameCount.toLocaleString()}</span>
                                </div>
                            )}
                            
                            <div className="flex justify-between items-center">
                                <span className="text-gray-600">Confidence Trend</span>
                                <div className="flex items-center space-x-1">
                                    {getTrendIcon()}
                                    <span className="font-medium capitalize">{confidenceTrend}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Emotional Analysis */}
                    <div className="space-y-4">
                        <h3 className="font-medium text-gray-900 mb-3">Emotional State</h3>
                        
                        {emotionData.length > 0 ? (
                            <div className="space-y-3">
                                {emotionData.map((emotion, index) => (
                                    <div key={emotion.emotion} className="space-y-1">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-600">{emotion.emotion}</span>
                                            <span className="font-medium">{emotion.value}%</span>
                                        </div>
                                        <div className="w-full bg-gray-200 rounded-full h-2">
                                            <div 
                                                className={`h-2 rounded-full ${emotion.color} transition-all duration-1000`}
                                                style={{ width: `${emotion.value}%` }}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-4">
                                <Info className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                                <p className="text-gray-500 text-sm">No emotional data available</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Facial Landmarks (if available) */}
                {faceLandmarks && Object.keys(faceLandmarks).length > 0 && (
                    <div className="mt-6 pt-6 border-t">
                        <h3 className="font-medium text-gray-900 mb-3">Facial Features</h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {Object.entries(faceLandmarks).map(([feature, confidence]) => (
                                <div key={feature} className="text-center">
                                    <div className="text-sm text-gray-600 mb-1 capitalize">
                                        {feature.replace(/([A-Z])/g, ' $1').trim()}
                                    </div>
                                    <div className="text-lg font-semibold text-gray-900">
                                        {Math.round(confidence * 100)}%
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Analysis Info */}
                <div className="mt-6 pt-6 border-t">
                    <div className="flex items-center justify-between text-sm text-gray-500">
                        <span>Analysis completed</span>
                        {analysisTimestamp && (
                            <span>{new Date(analysisTimestamp).toLocaleString()}</span>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FaceAnalysisResult;