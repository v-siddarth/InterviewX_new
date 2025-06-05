// frontend/src/pages/Results.jsx - WITH AI EVALUATION DISPLAY
import React, { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { CheckCircle, XCircle, AlertCircle, TrendingUp, TrendingDown, Star, Target, Brain, MessageSquare } from 'lucide-react';
import Button from '../components/ui/Button';
import ProgressBar from '../components/ui/ProgressBar';

const Results = () => {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  
  const [results, setResults] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [selectedTab, setSelectedTab] = useState('overview');
  const [selectedQuestion, setSelectedQuestion] = useState(0);

  useEffect(() => {
    // Get results from navigation state or fetch from API
    if (location.state?.results) {
      setResults(location.state.results);
      setAnswers(location.state.answers || []);
    } else {
      // Fallback mock results if no state passed
      const mockResults = {
        overallScore: 82,
        totalQuestions: 3,
        passed: true,
        recommendation: {
          decision: 'hire',
          confidence: 'medium',
          reasoning: 'Good performance with room for growth.',
          nextSteps: ['Proceed to technical round', 'Consider for mid-level position']
        }
      };
      setResults(mockResults);
    }
  }, [location.state]);

  if (!results) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading results...</p>
        </div>
      </div>
    );
  }

  const getScoreColor = (score) => {
    if (score >= 85) return 'text-green-600';
    if (score >= 70) return 'text-blue-600';
    if (score >= 50) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBgColor = (score) => {
    if (score >= 85) return 'bg-green-50 border-green-200';
    if (score >= 70) return 'bg-blue-50 border-blue-200';
    if (score >= 50) return 'bg-yellow-50 border-yellow-200';
    return 'bg-red-50 border-red-200';
  };

  const getRecommendationIcon = (decision) => {
    switch (decision) {
      case 'strong_hire':
        return <CheckCircle className="w-8 h-8 text-green-500" />;
      case 'hire':
        return <CheckCircle className="w-8 h-8 text-blue-500" />;
      case 'maybe':
        return <AlertCircle className="w-8 h-8 text-yellow-500" />;
      case 'reject':
        return <XCircle className="w-8 h-8 text-red-500" />;
      default:
        return <AlertCircle className="w-8 h-8 text-gray-500" />;
    }
  };

  const getRecommendationColor = (decision) => {
    switch (decision) {
      case 'strong_hire':
        return 'bg-green-50 border-green-200 text-green-800';
      case 'hire':
        return 'bg-blue-50 border-blue-200 text-blue-800';
      case 'maybe':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      case 'reject':
        return 'bg-red-50 border-red-200 text-red-800';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };

  const formatDecision = (decision) => {
    switch (decision) {
      case 'strong_hire':
        return 'Strong Hire';
      case 'hire':
        return 'Hire';
      case 'maybe':
        return 'Maybe';
      case 'reject':
        return 'Not Recommended';
      default:
        return 'Under Review';
    }
  };

  // Check if we have AI evaluation data
  const hasAIEvaluation = results.aiEvaluation || results.questionResults;
  const questionResults = results.questionResults || [];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Interview Results</h1>
              <p className="text-gray-600 mt-1">
                {hasAIEvaluation ? 'AI-Powered Analysis' : 'Standard Analysis'} • Completed {new Date(results.completedAt).toLocaleDateString()}
              </p>
            </div>
            <div className="flex space-x-3">
              <Button
                onClick={() => navigate('/dashboard')}
                variant="outline"
              >
                Back to Dashboard
              </Button>
              <Button
                onClick={() => window.print()}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                Download Report
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Overall Results */}
          <div className="lg:col-span-1 space-y-6">
            {/* Overall Score */}
            <div className={`bg-white rounded-xl shadow-lg p-6 border-2 ${getScoreBgColor(results.overallScore)}`}>
              <div className="text-center">
                <div className="text-6xl font-bold mb-2 ${getScoreColor(results.overallScore)}">
                  {results.overallScore}%
                </div>
                <div className="text-lg font-semibold text-gray-900 mb-2">Overall Score</div>
                <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                  results.passed ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {results.passed ? '✅ Passed' : '❌ Not Passed'}
                </div>
              </div>
            </div>

            {/* AI Recommendation */}
            {results.recommendation && (
              <div className={`bg-white rounded-xl shadow-lg p-6 border-2 ${getRecommendationColor(results.recommendation.decision)}`}>
                <div className="flex items-center mb-4">
                  {getRecommendationIcon(results.recommendation.decision)}
                  <div className="ml-3">
                    <h3 className="text-lg font-semibold">AI Recommendation</h3>
                    <p className="text-sm opacity-75">Confidence: {results.recommendation.confidence}</p>
                  </div>
                </div>
                
                <div className="mb-4">
                  <div className="text-2xl font-bold mb-2">
                    {formatDecision(results.recommendation.decision)}
                  </div>
                  <p className="text-sm">
                    {results.recommendation.reasoning}
                  </p>
                </div>

                {results.recommendation.nextSteps && (
                  <div>
                    <h4 className="font-medium mb-2">Next Steps:</h4>
                    <ul className="text-sm space-y-1">
                      {results.recommendation.nextSteps.map((step, index) => (
                        <li key={index} className="flex items-start">
                          <span className="text-xs mr-2 mt-1">•</span>
                          {step}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* Quick Stats */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Stats</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Questions Answered</span>
                  <span className="font-medium">{results.totalQuestions || answers.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Interview Duration</span>
                  <span className="font-medium">{Math.round((results.duration || 0) / 60)} min</span>
                </div>
                {hasAIEvaluation && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">AI Analysis</span>
                    <span className="font-medium text-purple-600">✨ Enabled</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column - Detailed Analysis */}
          <div className="lg:col-span-2 space-y-6">
            {/* Tab Navigation */}
            <div className="bg-white rounded-xl shadow-lg">
              <div className="border-b border-gray-200">
                <nav className="-mb-px flex space-x-8 px-6">
                  <button
                    onClick={() => setSelectedTab('overview')}
                    className={`py-4 px-1 border-b-2 font-medium text-sm ${
                      selectedTab === 'overview'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    📊 Overview
                  </button>
                  {hasAIEvaluation && (
                    <button
                      onClick={() => setSelectedTab('questions')}
                      className={`py-4 px-1 border-b-2 font-medium text-sm ${
                        selectedTab === 'questions'
                          ? 'border-blue-500 text-blue-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      🤖 Question Analysis
                    </button>
                  )}
                  <button
                    onClick={() => setSelectedTab('feedback')}
                    className={`py-4 px-1 border-b-2 font-medium text-sm ${
                      selectedTab === 'feedback'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    💡 Feedback
                  </button>
                </nav>
              </div>

              <div className="p-6">
                {/* Overview Tab */}
                {selectedTab === 'overview' && (
                  <div className="space-y-6">
                    {/* Score Breakdown */}
                    {hasAIEvaluation && results.aiEvaluation && (
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">AI Score Breakdown</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {questionResults.length > 0 && questionResults[0].evaluation && (
                            <>
                              <div className="bg-gray-50 p-4 rounded-lg">
                                <div className="flex items-center justify-between mb-2">
                                  <span className="text-sm font-medium text-gray-600">Relevance</span>
                                  <span className="text-lg font-bold text-blue-600">
                                    {Math.round(questionResults.reduce((acc, q) => acc + (q.evaluation?.relevance || 0), 0) / questionResults.length)}%
                                  </span>
                                </div>
                                <ProgressBar 
                                  progress={Math.round(questionResults.reduce((acc, q) => acc + (q.evaluation?.relevance || 0), 0) / questionResults.length)} 
                                  className="h-2"
                                />
                              </div>
                              <div className="bg-gray-50 p-4 rounded-lg">
                                <div className="flex items-center justify-between mb-2">
                                  <span className="text-sm font-medium text-gray-600">Technical Accuracy</span>
                                  <span className="text-lg font-bold text-green-600">
                                    {Math.round(questionResults.reduce((acc, q) => acc + (q.evaluation?.technical_accuracy || 0), 0) / questionResults.length)}%
                                  </span>
                                </div>
                                <ProgressBar 
                                  progress={Math.round(questionResults.reduce((acc, q) => acc + (q.evaluation?.technical_accuracy || 0), 0) / questionResults.length)} 
                                  className="h-2"
                                />
                              </div>
                              <div className="bg-gray-50 p-4 rounded-lg">
                                <div className="flex items-center justify-between mb-2">
                                  <span className="text-sm font-medium text-gray-600">Clarity</span>
                                  <span className="text-lg font-bold text-purple-600">
                                    {Math.round(questionResults.reduce((acc, q) => acc + (q.evaluation?.clarity || 0), 0) / questionResults.length)}%
                                  </span>
                                </div>
                                <ProgressBar 
                                  progress={Math.round(questionResults.reduce((acc, q) => acc + (q.evaluation?.clarity || 0), 0) / questionResults.length)} 
                                  className="h-2"
                                />
                              </div>
                              <div className="bg-gray-50 p-4 rounded-lg">
                                <div className="flex items-center justify-between mb-2">
                                  <span className="text-sm font-medium text-gray-600">Depth & Examples</span>
                                  <span className="text-lg font-bold text-orange-600">
                                    {Math.round(questionResults.reduce((acc, q) => acc + (q.evaluation?.depth || 0), 0) / questionResults.length)}%
                                  </span>
                                </div>
                                <ProgressBar 
                                  progress={Math.round(questionResults.reduce((acc, q) => acc + (q.evaluation?.depth || 0), 0) / questionResults.length)} 
                                  className="h-2"
                                />
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Legacy Score Display */}
                    {!hasAIEvaluation && (
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Metrics</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="bg-gray-50 p-4 rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm font-medium text-gray-600">Face Confidence</span>
                              <span className="text-lg font-bold text-blue-600">{results.faceConfidence}%</span>
                            </div>
                            <ProgressBar progress={results.faceConfidence} className="h-2" />
                          </div>
                          <div className="bg-gray-50 p-4 rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm font-medium text-gray-600">Audio Quality</span>
                              <span className="text-lg font-bold text-green-600">{results.audioQuality}%</span>
                            </div>
                            <ProgressBar progress={results.audioQuality} className="h-2" />
                          </div>
                          <div className="bg-gray-50 p-4 rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm font-medium text-gray-600">Answer Relevance</span>
                              <span className="text-lg font-bold text-purple-600">{results.answerRelevance}%</span>
                            </div>
                            <ProgressBar progress={results.answerRelevance} className="h-2" />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Question Analysis Tab */}
                {selectedTab === 'questions' && hasAIEvaluation && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-gray-900">Question-by-Question Analysis</h3>
                      <select
                        value={selectedQuestion}
                        onChange={(e) => setSelectedQuestion(parseInt(e.target.value))}
                        className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
                      >
                        {questionResults.map((result, index) => (
                          <option key={index} value={index}>
                            Question {index + 1} ({result.evaluation?.score || 0}%)
                          </option>
                        ))}
                      </select>
                    </div>

                    {questionResults[selectedQuestion] && (
                      <div className="space-y-4">
                        {/* Question */}
                        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                          <h4 className="font-medium text-blue-900 mb-2">Question {selectedQuestion + 1}</h4>
                          <p className="text-blue-800">{questionResults[selectedQuestion].questionText}</p>
                        </div>

                        {/* Answer */}
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <h4 className="font-medium text-gray-900 mb-2">Your Answer</h4>
                          <p className="text-gray-700">
                            {questionResults[selectedQuestion].textAnswer || 'No written answer provided'}
                          </p>
                        </div>

                        {/* AI Evaluation */}
                        {questionResults[selectedQuestion].evaluation && (
                          <div className="bg-white border border-gray-200 rounded-lg p-4">
                            <div className="flex items-center justify-between mb-4">
                              <h4 className="font-medium text-gray-900">🤖 AI Evaluation</h4>
                              <span className={`text-2xl font-bold ${getScoreColor(questionResults[selectedQuestion].evaluation.score)}`}>
                                {questionResults[selectedQuestion].evaluation.score}%
                              </span>
                            </div>

                            {/* Individual Scores */}
                            <div className="grid grid-cols-2 gap-4 mb-4">
                              <div>
                                <div className="text-sm text-gray-600">Relevance</div>
                                <div className="flex items-center">
                                  <ProgressBar progress={questionResults[selectedQuestion].evaluation.relevance} className="h-2 flex-1" />
                                  <span className="ml-2 text-sm font-medium">{questionResults[selectedQuestion].evaluation.relevance}%</span>
                                </div>
                              </div>
                              <div>
                                <div className="text-sm text-gray-600">Technical Accuracy</div>
                                <div className="flex items-center">
                                  <ProgressBar progress={questionResults[selectedQuestion].evaluation.technical_accuracy} className="h-2 flex-1" />
                                  <span className="ml-2 text-sm font-medium">{questionResults[selectedQuestion].evaluation.technical_accuracy}%</span>
                                </div>
                              </div>
                              <div>
                                <div className="text-sm text-gray-600">Clarity</div>
                                <div className="flex items-center">
                                  <ProgressBar progress={questionResults[selectedQuestion].evaluation.clarity} className="h-2 flex-1" />
                                  <span className="ml-2 text-sm font-medium">{questionResults[selectedQuestion].evaluation.clarity}%</span>
                                </div>
                              </div>
                              <div>
                                <div className="text-sm text-gray-600">Depth</div>
                                <div className="flex items-center">
                                  <ProgressBar progress={questionResults[selectedQuestion].evaluation.depth} className="h-2 flex-1" />
                                  <span className="ml-2 text-sm font-medium">{questionResults[selectedQuestion].evaluation.depth}%</span>
                                </div>
                              </div>
                            </div>

                            {/* AI Feedback */}
                            <div className="bg-purple-50 p-4 rounded-lg">
                              <h5 className="font-medium text-purple-900 mb-2">💭 AI Feedback</h5>
                              <p className="text-sm text-purple-800">
                                {questionResults[selectedQuestion].evaluation.feedback}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Feedback Tab */}
                {selectedTab === 'feedback' && (
                  <div className="space-y-6">
                    {/* Strengths */}
                    <div className="bg-green-50 p-6 rounded-lg border border-green-200">
                      <div className="flex items-center mb-4">
                        <TrendingUp className="w-6 h-6 text-green-600 mr-2" />
                        <h3 className="text-lg font-semibold text-green-900">Strengths</h3>
                      </div>
                      <ul className="space-y-2">
                        {(results.strengths || []).map((strength, index) => (
                          <li key={index} className="flex items-start">
                            <Star className="w-4 h-4 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                            <span className="text-green-800">{strength}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Areas for Improvement */}
                    <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
                      <div className="flex items-center mb-4">
                        <Target className="w-6 h-6 text-blue-600 mr-2" />
                        <h3 className="text-lg font-semibold text-blue-900">Areas for Improvement</h3>
                      </div>
                      <ul className="space-y-2">
                        {(results.improvements || []).map((improvement, index) => (
                          <li key={index} className="flex items-start">
                            <TrendingDown className="w-4 h-4 text-blue-600 mr-2 mt-0.5 flex-shrink-0" />
                            <span className="text-blue-800">{improvement}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Additional AI Insights */}
                    {hasAIEvaluation && questionResults.length > 0 && (
                      <div className="bg-purple-50 p-6 rounded-lg border border-purple-200">
                        <div className="flex items-center mb-4">
                          <Brain className="w-6 h-6 text-purple-600 mr-2" />
                          <h3 className="text-lg font-semibold text-purple-900">AI Insights</h3>
                        </div>
                        <div className="space-y-3">
                          <div>
                            <h4 className="font-medium text-purple-900 mb-2">Keywords Covered</h4>
                            <div className="flex flex-wrap gap-2">
                              {questionResults.flatMap(q => q.evaluation?.keywords_covered || [])
                                .filter((keyword, index, self) => self.indexOf(keyword) === index)
                                .slice(0, 8)
                                .map((keyword, index) => (
                                <span key={index} className="px-2 py-1 bg-purple-100 text-purple-800 rounded text-xs">
                                  {keyword}
                                </span>
                              ))}
                            </div>
                          </div>
                          <div>
                            <h4 className="font-medium text-purple-900 mb-2">Missing Points</h4>
                            <ul className="text-sm text-purple-800 space-y-1">
                              {questionResults.flatMap(q => q.evaluation?.missing_points || [])
                                .filter((point, index, self) => self.indexOf(point) === index)
                                .slice(0, 5)
                                .map((point, index) => (
                                <li key={index} className="flex items-start">
                                  <span className="text-xs mr-2 mt-1">•</span>
                                  {point}
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-8 flex justify-center space-x-4">
          <Button
            onClick={() => navigate('/interview')}
            variant="outline"
            className="px-8 py-3"
          >
            Take Another Interview
          </Button>
          <Button
            onClick={() => navigate('/dashboard')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3"
          >
            Back to Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Results;