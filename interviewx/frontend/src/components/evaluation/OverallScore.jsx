// frontend/src/components/evaluation/OverallScore.jsx
import React, { useState, useEffect } from 'react';
import { Trophy, Target, TrendingUp, Award, Star, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';

const OverallScore = ({ 
    evaluation, 
    showBreakdown = true, 
    showRecommendations = true,
    animated = true,
    className = "" 
}) => {
    const [animatedScore, setAnimatedScore] = useState(0);
    const [animatedScores, setAnimatedScores] = useState({
        facial: 0,
        audio: 0,
        text: 0
    });

    if (!evaluation) {
        return (
            <div className={`bg-gray-50 rounded-lg p-6 text-center ${className}`}>
                <AlertTriangle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <h3 className="text-lg font-medium text-gray-600 mb-2">No Evaluation Data</h3>
                <p className="text-gray-500">Complete the interview to see your results</p>
            </div>
        );
    }

    const {
        overallScore = 0,
        individualScores = {},
        thresholdsMet = {},
        passed = false,
        grade = 'N/A',
        feedback = '',
        suggestions = []
    } = evaluation;

    const { facial = 0, audio = 0, text = 0 } = individualScores;

    // Animation effect
    useEffect(() => {
        if (animated) {
            const duration = 2000; // 2 seconds
            const steps = 60;
            const increment = overallScore / steps;
            let currentStep = 0;

            const timer = setInterval(() => {
                currentStep++;
                const currentScore = Math.min(increment * currentStep, overallScore);
                setAnimatedScore(Math.round(currentScore));

                setAnimatedScores({
                    facial: Math.min((facial / steps) * currentStep, facial),
                    audio: Math.min((audio / steps) * currentStep, audio),
                    text: Math.min((text / steps) * currentStep, text)
                });

                if (currentStep >= steps) {
                    clearInterval(timer);
                }
            }, duration / steps);

            return () => clearInterval(timer);
        } else {
            setAnimatedScore(overallScore);
            setAnimatedScores({ facial, audio, text });
        }
    }, [overallScore, facial, audio, text, animated]);

    const getScoreColor = (score) => {
        if (score >= 90) return 'text-green-600';
        if (score >= 80) return 'text-blue-600';
        if (score >= 70) return 'text-yellow-600';
        if (score >= 60) return 'text-orange-600';
        return 'text-red-600';
    };

    const getScoreBgColor = (score) => {
        if (score >= 90) return 'bg-green-100';
        if (score >= 80) return 'bg-blue-100';
        if (score >= 70) return 'bg-yellow-100';
        if (score >= 60) return 'bg-orange-100';
        return 'bg-red-100';
    };

    const getGradeBgColor = (grade) => {
        switch (grade) {
            case 'A': return 'bg-green-500';
            case 'B': return 'bg-blue-500';
            case 'C': return 'bg-yellow-500';
            case 'D': return 'bg-orange-500';
            default: return 'bg-red-500';
        }
    };

    const getPerformanceLevel = (score) => {
        if (score >= 90) return { label: 'Outstanding', icon: Trophy, color: 'text-green-600' };
        if (score >= 80) return { label: 'Excellent', icon: Award, color: 'text-blue-600' };
        if (score >= 70) return { label: 'Good', icon: Star, color: 'text-yellow-600' };
        if (score >= 60) return { label: 'Fair', icon: Target, color: 'text-orange-600' };
        return { label: 'Needs Improvement', icon: TrendingUp, color: 'text-red-600' };
    };

    const performance = getPerformanceLevel(overallScore);
    const PerformanceIcon = performance.icon;

    const getThresholdIcon = (met) => {
        return met ? (
            <CheckCircle className="w-4 h-4 text-green-500" />
        ) : (
            <XCircle className="w-4 h-4 text-red-500" />
        );
    };

    const generateRecommendations = () => {
        const recommendations = [];
        
        if (facial < 80) {
            recommendations.push({
                category: 'Confidence',
                suggestion: 'Practice maintaining eye contact and confident posture during video calls',
                priority: 'high'
            });
        }
        
        if (audio < 70) {
            recommendations.push({
                category: 'Communication',
                suggestion: 'Work on speaking clearly and at an appropriate pace',
                priority: 'high'
            });
        }
        
        if (text < 80) {
            recommendations.push({
                category: 'Content',
                suggestion: 'Provide more detailed and structured responses with specific examples',
                priority: 'medium'
            });
        }
        
        if (overallScore < 75) {
            recommendations.push({
                category: 'Preparation',
                suggestion: 'Practice common interview questions and record yourself to identify areas for improvement',
                priority: 'high'
            });
        }

        return recommendations.length > 0 ? recommendations : suggestions || [];
    };

    const recommendationsList = generateRecommendations();

    return (
        <div className={`bg-white rounded-lg border shadow-sm ${className}`}>
            {/* Header */}
            <div className={`p-6 border-b ${getScoreBgColor(overallScore)}`}>
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <div className={`p-3 rounded-full bg-white shadow-sm`}>
                            <PerformanceIcon className={`w-6 h-6 ${performance.color}`} />
                        </div>
                        <div>
                            <h2 className="text-xl font-semibold text-gray-900">Interview Results</h2>
                            <p className={`${performance.color} font-medium`}>
                                {performance.label} Performance
                            </p>
                        </div>
                    </div>
                    
                    <div className="text-right">
                        <div className="flex items-center space-x-2">
                            {passed ? (
                                <CheckCircle className="w-5 h-5 text-green-500" />
                            ) : (
                                <XCircle className="w-5 h-5 text-red-500" />
                            )}
                            <span className={`font-medium text-lg ${
                                passed ? 'text-green-600' : 'text-red-600'
                            }`}>
                                {passed ? 'PASSED' : 'FAILED'}
                            </span>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">
                            Minimum score: 75%
                        </p>
                    </div>
                </div>
            </div>

            {/* Main Score Display */}
            <div className="p-6">
                <div className="text-center mb-8">
                    {/* Overall Score Circle */}
                    <div className="relative inline-block mb-4">
                        <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 120 120">
                            {/* Background circle */}
                            <circle
                                cx="60"
                                cy="60"
                                r="50"
                                stroke="#e5e7eb"
                                strokeWidth="8"
                                fill="none"
                            />
                            {/* Progress circle */}
                            <circle
                                cx="60"
                                cy="60"
                                r="50"
                                stroke={overallScore >= 80 ? '#10b981' : overallScore >= 60 ? '#f59e0b' : '#ef4444'}
                                strokeWidth="8"
                                fill="none"
                                strokeLinecap="round"
                                strokeDasharray={`${(animatedScore / 100) * 314} 314`}
                                className="transition-all duration-1000 ease-out"
                            />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="text-center">
                                <div className={`text-3xl font-bold ${getScoreColor(overallScore)}`}>
                                    {Math.round(animatedScore)}%
                                </div>
                                <div className={`w-8 h-8 ${getGradeBgColor(grade)} text-white rounded font-bold flex items-center justify-center text-sm mx-auto mt-1`}>
                                    {grade}
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">
                        Overall Score: {Math.round(animatedScore)}%
                    </h3>
                    <p className={`text-lg ${performance.color} font-medium`}>
                        {performance.label} Performance
                    </p>
                </div>

                {/* Score Breakdown */}
                {showBreakdown && (
                    <div className="mb-8">
                        <h4 className="text-lg font-medium text-gray-900 mb-4">Score Breakdown</h4>
                        <div className="grid md:grid-cols-3 gap-4">
                            {/* Facial Analysis */}
                            <div className="bg-gray-50 rounded-lg p-4">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm font-medium text-gray-700">Facial Confidence</span>
                                    {getThresholdIcon(thresholdsMet.facial)}
                                </div>
                                <div className={`text-2xl font-bold mb-2 ${getScoreColor(facial)}`}>
                                    {Math.round(animatedScores.facial)}%
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                    <div 
                                        className={`h-2 rounded-full transition-all duration-1000 ${
                                            facial >= 80 ? 'bg-green-500' : 
                                            facial >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                                        }`}
                                        style={{ width: `${Math.min(animatedScores.facial, 100)}%` }}
                                    />
                                </div>
                                <p className="text-xs text-gray-500 mt-1">Required: 80%</p>
                            </div>

                            {/* Audio Quality */}
                            <div className="bg-gray-50 rounded-lg p-4">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm font-medium text-gray-700">Audio Quality</span>
                                    {getThresholdIcon(thresholdsMet.audio)}
                                </div>
                                <div className={`text-2xl font-bold mb-2 ${getScoreColor(audio)}`}>
                                    {Math.round(animatedScores.audio)}%
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                    <div 
                                        className={`h-2 rounded-full transition-all duration-1000 ${
                                            audio >= 70 ? 'bg-green-500' : 
                                            audio >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                                        }`}
                                        style={{ width: `${Math.min(animatedScores.audio, 100)}%` }}
                                    />
                                </div>
                                <p className="text-xs text-gray-500 mt-1">Required: 60%</p>
                            </div>

                            {/* Content Quality */}
                            <div className="bg-gray-50 rounded-lg p-4">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm font-medium text-gray-700">Content Quality</span>
                                    {getThresholdIcon(thresholdsMet.text)}
                                </div>
                                <div className={`text-2xl font-bold mb-2 ${getScoreColor(text)}`}>
                                    {Math.round(animatedScores.text)}%
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                    <div 
                                        className={`h-2 rounded-full transition-all duration-1000 ${
                                            text >= 80 ? 'bg-green-500' : 
                                            text >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                                        }`}
                                        style={{ width: `${Math.min(animatedScores.text, 100)}%` }}
                                    />
                                </div>
                                <p className="text-xs text-gray-500 mt-1">Required: 80%</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Feedback Section */}
                {feedback && (
                    <div className="mb-6">
                        <h4 className="text-lg font-medium text-gray-900 mb-3">Feedback</h4>
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                            <p className="text-blue-800">{feedback}</p>
                        </div>
                    </div>
                )}

                {/* Recommendations */}
                {showRecommendations && recommendationsList.length > 0 && (
                    <div className="mt-6">
                        <h4 className="text-lg font-medium text-gray-900 mb-4">Recommendations for Improvement</h4>
                        <div className="space-y-3">
                            {recommendationsList.slice(0, 5).map((rec, index) => (
                                <div key={index} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                                    <div className={`w-2 h-2 rounded-full mt-2 ${
                                        rec.priority === 'high' ? 'bg-red-500' :
                                        rec.priority === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                                    }`} />
                                    <div className="flex-1">
                                        <div className="font-medium text-gray-900">{rec.category}</div>
                                        <p className="text-sm text-gray-600 mt-1">{rec.suggestion}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Summary Stats */}
                <div className="mt-8 pt-6 border-t">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                        <div>
                            <div className="text-2xl font-bold text-gray-900">{Math.round(overallScore)}%</div>
                            <div className="text-sm text-gray-600">Overall Score</div>
                        </div>
                        <div>
                            <div className={`text-2xl font-bold ${getGradeBgColor(grade)} text-white w-8 h-8 rounded mx-auto flex items-center justify-center`}>
                                {grade}
                            </div>
                            <div className="text-sm text-gray-600 mt-1">Grade</div>
                        </div>
                        <div>
                            <div className="text-2xl font-bold text-gray-900">
                                {Object.values(thresholdsMet).filter(Boolean).length}/{Object.keys(thresholdsMet).length}
                            </div>
                            <div className="text-sm text-gray-600">Thresholds Met</div>
                        </div>
                        <div>
                            <div className={`text-2xl font-bold ${passed ? 'text-green-600' : 'text-red-600'}`}>
                                {passed ? 'PASS' : 'FAIL'}
                            </div>
                            <div className="text-sm text-gray-600">Result</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OverallScore;