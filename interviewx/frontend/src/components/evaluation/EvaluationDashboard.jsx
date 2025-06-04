// frontend/src/components/evaluation/EvaluationDashboard.jsx
import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, LineChart, Line } from 'recharts';
import { Download, Share2, RotateCcw, TrendingUp, Award, Users, Clock, Target } from 'lucide-react';
import FaceAnalysisResult from './FaceAnalysisResult';
import AudioAnalysisResult from './AudioAnalysisResult';
import OverallScore from './OverallScore';
import Button from '../ui/Button';

const EvaluationDashboard = ({ 
    evaluation, 
    interview, 
    isLoading = false,
    onRetake,
    onDownloadReport,
    onShare,
    className = "" 
}) => {
    const [activeTab, setActiveTab] = useState('overview');
    const [comparisonData, setComparisonData] = useState(null);

    // Mock comparison data - in real app, this would come from API
    useEffect(() => {
        if (evaluation) {
            setComparisonData({
                industry: {
                    facial: 82,
                    audio: 75,
                    text: 78,
                    overall: 78.3
                },
                role: {
                    facial: 85,
                    audio: 77,
                    text: 82,
                    overall: 81.2
                }
            });
        }
    }, [evaluation]);

    if (isLoading) {
        return (
            <div className={`bg-white rounded-lg border shadow-sm p-8 text-center ${className}`}>
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
                <p className="text-gray-600">Loading evaluation results...</p>
            </div>
        );
    }

    if (!evaluation) {
        return (
            <div className={`bg-gray-50 rounded-lg p-8 text-center ${className}`}>
                <Target className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-600 mb-2">No Results Available</h3>
                <p className="text-gray-500 mb-4">Complete your interview to see detailed evaluation results</p>
                {onRetake && (
                    <Button onClick={onRetake} className="bg-blue-600 hover:bg-blue-700">
                        Start Interview
                    </Button>
                )}
            </div>
        );
    }

    const {
        overallScore = 0,
        individualScores = {},
        facialAnalysis = {},
        audioAnalysis = {},
        textAnalysis = {},
        passed = false,
        completedAt,
        processingTime
    } = evaluation;

    // Prepare chart data
    const scoreComparisonData = [
        {
            category: 'Facial Confidence',
            your: individualScores.facial || 0,
            industry: comparisonData?.industry.facial || 0,
            role: comparisonData?.role.facial || 0
        },
        {
            category: 'Audio Quality',
            your: individualScores.audio || 0,
            industry: comparisonData?.industry.audio || 0,
            role: comparisonData?.role.role || 0
        },
        {
            category: 'Content Quality',
            your: individualScores.text || 0,
            industry: comparisonData?.industry.text || 0,
            role: comparisonData?.role.text || 0
        }
    ];

    const radarData = [
        { skill: 'Confidence', value: individualScores.facial || 0 },
        { skill: 'Communication', value: individualScores.audio || 0 },
        { skill: 'Content', value: individualScores.text || 0 },
        { skill: 'Clarity', value: textAnalysis.clarityScore || 0 },
        { skill: 'Relevance', value: textAnalysis.relevanceScore || 0 },
        { skill: 'Technical', value: textAnalysis.technicalScore || 0 }
    ];

    const tabs = [
        { id: 'overview', label: 'Overview', icon: BarChart },
        { id: 'facial', label: 'Facial Analysis', icon: Users },
        { id: 'audio', label: 'Audio Analysis', icon: Clock },
        { id: 'detailed', label: 'Detailed Analysis', icon: Target }
    ];

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const formatDuration = (milliseconds) => {
        const seconds = Math.floor(milliseconds / 1000);
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}m ${remainingSeconds}s`;
    };

    return (
        <div className={`space-y-6 ${className}`}>
            {/* Header */}
            <div className="bg-white rounded-lg border shadow-sm p-6">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">
                            {interview?.title || 'Interview Results'}
                        </h1>
                        <p className="text-gray-600">
                            Completed on {completedAt && formatDate(completedAt)}
                        </p>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                        {onShare && (
                            <Button 
                                onClick={onShare} 
                                variant="secondary"
                                size="sm"
                            >
                                <Share2 className="w-4 h-4 mr-2" />
                                Share
                            </Button>
                        )}
                        
                        {onDownloadReport && (
                            <Button 
                                onClick={onDownloadReport} 
                                variant="secondary"
                                size="sm"
                            >
                                <Download className="w-4 h-4 mr-2" />
                                Download Report
                            </Button>
                        )}
                        
                        {onRetake && (
                            <Button 
                                onClick={onRetake}
                                size="sm"
                            >
                                <RotateCcw className="w-4 h-4 mr-2" />
                                Retake Interview
                            </Button>
                        )}
                    </div>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                        <div className={`text-3xl font-bold ${
                            overallScore >= 80 ? 'text-green-600' : 
                            overallScore >= 60 ? 'text-yellow-600' : 'text-red-600'
                        }`}>
                            {overallScore}%
                        </div>
                        <div className="text-sm text-gray-600">Overall Score</div>
                    </div>
                    <div className="text-center">
                        <div className={`text-3xl font-bold ${passed ? 'text-green-600' : 'text-red-600'}`}>
                            {passed ? 'PASS' : 'FAIL'}
                        </div>
                        <div className="text-sm text-gray-600">Result</div>
                    </div>
                    <div className="text-center">
                        <div className="text-3xl font-bold text-blue-600">
                            {interview?.questions?.length || 0}
                        </div>
                        <div className="text-sm text-gray-600">Questions</div>
                    </div>
                    <div className="text-center">
                        <div className="text-3xl font-bold text-purple-600">
                            {processingTime ? formatDuration(processingTime) : 'N/A'}
                        </div>
                        <div className="text-sm text-gray-600">Processing Time</div>
                    </div>
                </div>
            </div>

            {/* Tab Navigation */}
            <div className="bg-white rounded-lg border shadow-sm">
                <div className="border-b">
                    <nav className="flex space-x-8 px-6" aria-label="Tabs">
                        {tabs.map((tab) => {
                            const Icon = tab.icon;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                                        activeTab === tab.id
                                            ? 'border-blue-500 text-blue-600'
                                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                    }`}
                                >
                                    <div className="flex items-center space-x-2">
                                        <Icon className="w-4 h-4" />
                                        <span>{tab.label}</span>
                                    </div>
                                </button>
                            );
                        })}
                    </nav>
                </div>

                {/* Tab Content */}
                <div className="p-6">
                    {activeTab === 'overview' && (
                        <div className="space-y-6">
                            {/* Overall Score Component */}
                            <OverallScore 
                                evaluation={evaluation}
                                showBreakdown={true}
                                showRecommendations={true}
                                animated={true}
                            />

                            {/* Performance Comparison Chart */}
                            {comparisonData && (
                                <div className="bg-gray-50 rounded-lg p-6">
                                    <h3 className="text-lg font-medium text-gray-900 mb-4">
                                        Performance Comparison
                                    </h3>
                                    <div className="h-64">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={scoreComparisonData}>
                                                <CartesianGrid strokeDasharray="3 3" />
                                                <XAxis dataKey="category" />
                                                <YAxis domain={[0, 100]} />
                                                <Tooltip />
                                                <Bar dataKey="your" fill="#3b82f6" name="Your Score" />
                                                <Bar dataKey="industry" fill="#10b981" name="Industry Average" />
                                                <Bar dataKey="role" fill="#f59e0b" name="Role Average" />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                            )}

                            {/* Skills Radar Chart */}
                            <div className="bg-gray-50 rounded-lg p-6">
                                <h3 className="text-lg font-medium text-gray-900 mb-4">
                                    Skills Assessment
                                </h3>
                                <div className="h-64">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <RadarChart data={radarData}>
                                            <PolarGrid />
                                            <PolarAngleAxis dataKey="skill" />
                                            <PolarRadiusAxis domain={[0, 100]} />
                                            <Radar
                                                name="Your Performance"
                                                dataKey="value"
                                                stroke="#3b82f6"
                                                fill="#3b82f6"
                                                fillOpacity={0.1}
                                                strokeWidth={2}
                                            />
                                        </RadarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'facial' && (
                        <FaceAnalysisResult 
                            analysis={facialAnalysis}
                            showDetails={true}
                            compact={false}
                        />
                    )}

                    {activeTab === 'audio' && (
                        <AudioAnalysisResult 
                            analysis={audioAnalysis}
                            showDetails={true}
                            compact={false}
                        />
                    )}

                    {activeTab === 'detailed' && (
                        <div className="space-y-6">
                            {/* Text Analysis Details */}
                            {textAnalysis && (
                                <div className="bg-white rounded-lg border p-6">
                                    <h3 className="text-lg font-medium text-gray-900 mb-4">
                                        Content Analysis Details
                                    </h3>
                                    
                                    <div className="grid md:grid-cols-2 gap-6">
                                        <div className="space-y-4">
                                            <h4 className="font-medium text-gray-900">Quality Metrics</h4>
                                            
                                            {[
                                                { label: 'Relevance', value: textAnalysis.relevanceScore },
                                                { label: 'Clarity', value: textAnalysis.clarityScore },
                                                { label: 'Completeness', value: textAnalysis.completenessScore },
                                                { label: 'Technical Accuracy', value: textAnalysis.technicalScore },
                                                { label: 'Communication', value: textAnalysis.communicationScore }
                                            ].map((metric) => (
                                                <div key={metric.label} className="space-y-1">
                                                    <div className="flex justify-between text-sm">
                                                        <span className="text-gray-600">{metric.label}</span>
                                                        <span className="font-medium">{metric.value || 0}%</span>
                                                    </div>
                                                    <div className="w-full bg-gray-200 rounded-full h-2">
                                                        <div 
                                                            className={`h-2 rounded-full ${
                                                                (metric.value || 0) >= 80 ? 'bg-green-500' :
                                                                (metric.value || 0) >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                                                            }`}
                                                            style={{ width: `${Math.min(metric.value || 0, 100)}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        <div className="space-y-4">
                                            <h4 className="font-medium text-gray-900">Content Metrics</h4>
                                            
                                            <div className="space-y-3">
                                                <div className="flex justify-between">
                                                    <span className="text-gray-600">Word Count</span>
                                                    <span className="font-medium">{textAnalysis.wordCount || 0}</span>
                                                </div>
                                                
                                                <div className="flex justify-between">
                                                    <span className="text-gray-600">Sentiment</span>
                                                    <span className="font-medium capitalize">{textAnalysis.sentiment || 'neutral'}</span>
                                                </div>
                                                
                                                {textAnalysis.keywordMatches && textAnalysis.keywordMatches.length > 0 && (
                                                    <div>
                                                        <span className="text-gray-600 block mb-2">Keywords Matched</span>
                                                        <div className="flex flex-wrap gap-1">
                                                            {textAnalysis.keywordMatches.map((keyword, index) => (
                                                                <span 
                                                                    key={index}
                                                                    className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs"
                                                                >
                                                                    {keyword}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {textAnalysis.feedback && (
                                        <div className="mt-6 pt-6 border-t">
                                            <h4 className="font-medium text-gray-900 mb-3">AI Feedback</h4>
                                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                                <p className="text-blue-800">{textAnalysis.feedback}</p>
                                            </div>
                                        </div>
                                    )}

                                    {textAnalysis.suggestions && textAnalysis.suggestions.length > 0 && (
                                        <div className="mt-6 pt-6 border-t">
                                            <h4 className="font-medium text-gray-900 mb-3">Improvement Suggestions</h4>
                                            <ul className="space-y-2">
                                                {textAnalysis.suggestions.map((suggestion, index) => (
                                                    <li key={index} className="flex items-start space-x-2">
                                                        <TrendingUp className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                                                        <span className="text-gray-700">{suggestion}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Performance Timeline */}
                            <div className="bg-white rounded-lg border p-6">
                                <h3 className="text-lg font-medium text-gray-900 mb-4">
                                    Interview Timeline
                                </h3>
                                
                                <div className="space-y-4">
                                    {interview?.questions?.map((question, index) => {
                                        const questionEval = evaluation.questionResults?.[question._id] || {};
                                        return (
                                            <div key={question._id} className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg">
                                                <div className="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium">
                                                    {index + 1}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-medium text-gray-900 truncate">
                                                        {question.text}
                                                    </p>
                                                    <p className="text-xs text-gray-500">
                                                        {question.type} • {Math.floor((question.timeLimit || 300) / 60)} min limit
                                                    </p>
                                                </div>
                                                <div className="flex-shrink-0">
                                                    {questionEval.score ? (
                                                        <div className={`text-lg font-semibold ${
                                                            questionEval.score >= 80 ? 'text-green-600' :
                                                            questionEval.score >= 60 ? 'text-yellow-600' : 'text-red-600'
                                                        }`}>
                                                            {questionEval.score}%
                                                        </div>
                                                    ) : (
                                                        <div className="text-gray-400 text-sm">Not completed</div>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Technical Details */}
                            <div className="bg-white rounded-lg border p-6">
                                <h3 className="text-lg font-medium text-gray-900 mb-4">
                                    Technical Analysis Details
                                </h3>
                                
                                <div className="grid md:grid-cols-2 gap-6">
                                    <div>
                                        <h4 className="font-medium text-gray-900 mb-3">Facial Analysis</h4>
                                        <div className="space-y-2 text-sm">
                                            <div className="flex justify-between">
                                                <span className="text-gray-600">Frames Analyzed</span>
                                                <span>{facialAnalysis.frameCount || 0}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-600">Face Detection Rate</span>
                                                <span>{facialAnalysis.faceDetected ? '100%' : '0%'}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-600">Average Confidence</span>
                                                <span>{facialAnalysis.averageConfidence || facialAnalysis.confidenceScore || 0}%</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <h4 className="font-medium text-gray-900 mb-3">Audio Analysis</h4>
                                        <div className="space-y-2 text-sm">
                                            <div className="flex justify-between">
                                                <span className="text-gray-600">Duration</span>
                                                <span>{Math.floor((audioAnalysis.durationSeconds || 0) / 60)}m {Math.floor((audioAnalysis.durationSeconds || 0) % 60)}s</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-600">Words per Minute</span>
                                                <span>{audioAnalysis.wordsPerMinute || 'N/A'}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-600">Background Noise</span>
                                                <span className="capitalize">{audioAnalysis.backgroundNoise || 'Low'}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Action Panel */}
            <div className="bg-white rounded-lg border shadow-sm p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-lg font-medium text-gray-900">What's Next?</h3>
                        <p className="text-gray-600">
                            {passed 
                                ? 'Congratulations! You passed the interview. Consider sharing your results or downloading a detailed report.'
                                : 'Don\'t worry! Use the feedback to improve and consider retaking the interview.'
                            }
                        </p>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                        {!passed && onRetake && (
                            <Button 
                                onClick={onRetake}
                                className="bg-blue-600 hover:bg-blue-700"
                            >
                                <RotateCcw className="w-4 h-4 mr-2" />
                                Retake Interview
                            </Button>
                        )}
                        
                        {passed && (
                            <div className="flex items-center space-x-2">
                                <Award className="w-5 h-5 text-green-500" />
                                <span className="text-green-600 font-medium">Interview Passed!</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

// Make sure to export as default
export default EvaluationDashboard;