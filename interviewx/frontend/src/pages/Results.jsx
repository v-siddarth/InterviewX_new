// frontend/src/pages/Results.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import Button from '../components/ui/Button';
import ProgressBar from '../components/ui/ProgressBar';

const Results = () => {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  
  // Get results from navigation state or fetch from API
  const [results, setResults] = useState(location.state?.results || null);
  const [answers, setAnswers] = useState(location.state?.answers || []);
  const [activeTab, setActiveTab] = useState('overview');
  const [isLoading, setIsLoading] = useState(!results);

  useEffect(() => {
    if (!results) {
      // In real app: fetch results from API
      // For now, generate mock results
      setTimeout(() => {
        setResults({
          overallScore: 85,
          faceConfidence: 88,
          audioQuality: 82,
          answerRelevance: 87,
          passed: true,
          completedAt: new Date().toISOString(),
          duration: 1245, // seconds
          strengths: [
            "Excellent technical knowledge",
            "Clear communication skills",
            "Good problem-solving approach",
            "Professional demeanor"
          ],
          improvements: [
            "Could provide more specific examples",
            "Slightly rushed in technical explanations"
          ],
          detailedAnalysis: {
            facial: {
              confidence: 88,
              eyeContact: 92,
              posture: 85,
              expressiveness: 80
            },
            audio: {
              clarity: 90,
              pace: 78,
              volume: 85,
              filler_words: 15
            },
            content: {
              relevance: 87,
              depth: 82,
              structure: 90,
              examples: 75
            }
          }
        });
        setIsLoading(false);
      }, 1500);
    }
  }, [results, id]);

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBg = (score) => {
    if (score >= 80) return 'bg-green-100';
    if (score >= 60) return 'bg-yellow-100';
    return 'bg-red-100';
  };

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Analyzing Your Interview</h2>
          <p className="text-gray-600">Our AI is processing your responses...</p>
          <div className="mt-6 space-y-2 text-sm text-gray-500">
            <div>✅ Processing facial analysis...</div>
            <div>✅ Converting speech to text...</div>
            <div>🔄 Evaluating answer quality...</div>
            <div>⏳ Generating final report...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Interview Results</h1>
              <p className="text-gray-600">Completed on {new Date(results.completedAt).toLocaleDateString()}</p>
            </div>
            <div className="flex space-x-3">
              <Button
                onClick={() => navigate('/dashboard')}
                variant="outline"
              >
                📊 Dashboard
              </Button>
              <Button
                onClick={() => navigate(`/interview/${id}`)}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                🔄 Retake Interview
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Overall Score Card */}
        <div className={`rounded-xl shadow-lg p-8 mb-8 ${results.passed ? 'bg-gradient-to-r from-green-50 to-blue-50' : 'bg-gradient-to-r from-red-50 to-orange-50'}`}>
          <div className="text-center">
            <div className={`text-6xl font-bold mb-4 ${getScoreColor(results.overallScore)}`}>
              {results.overallScore}%
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {results.passed ? '🎉 Congratulations! You Passed!' : '😔 Interview Not Passed'}
            </h2>
            <p className="text-gray-600 mb-6">
              {results.passed 
                ? 'You demonstrated strong skills and confidence during the interview.'
                : 'Keep practicing! You can improve and retake the interview.'
              }
            </p>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
              <div className="text-center">
                <div className={`text-2xl font-bold ${getScoreColor(results.overallScore)}`}>
                  {results.overallScore}%
                </div>
                <div className="text-sm text-gray-600">Overall Score</div>
              </div>
              <div className="text-center">
                <div className={`text-2xl font-bold ${getScoreColor(results.faceConfidence)}`}>
                  {results.faceConfidence}%
                </div>
                <div className="text-sm text-gray-600">Face Confidence</div>
              </div>
              <div className="text-center">
                <div className={`text-2xl font-bold ${getScoreColor(results.audioQuality)}`}>
                  {results.audioQuality}%
                </div>
                <div className="text-sm text-gray-600">Audio Quality</div>
              </div>
              <div className="text-center">
                <div className={`text-2xl font-bold ${getScoreColor(results.answerRelevance)}`}>
                  {results.answerRelevance}%
                </div>
                <div className="text-sm text-gray-600">Answer Quality</div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-lg mb-8">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              {[
                { id: 'overview', name: '📊 Overview', icon: '📊' },
                { id: 'facial', name: '😊 Facial Analysis', icon: '😊' },
                { id: 'audio', name: '🎤 Audio Analysis', icon: '🎤' },
                { id: 'answers', name: '💭 Answer Review', icon: '💭' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-2 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab.name}
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* Performance Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">🎯 Performance Breakdown</h3>
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Face Confidence</span>
                          <span className={getScoreColor(results.faceConfidence)}>{results.faceConfidence}%</span>
                        </div>
                        <ProgressBar progress={results.faceConfidence} />
                      </div>
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Audio Quality</span>
                          <span className={getScoreColor(results.audioQuality)}>{results.audioQuality}%</span>
                        </div>
                        <ProgressBar progress={results.audioQuality} />
                      </div>
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Answer Relevance</span>
                          <span className={getScoreColor(results.answerRelevance)}>{results.answerRelevance}%</span>
                        </div>
                        <ProgressBar progress={results.answerRelevance} />
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">📈 Interview Stats</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-blue-50 p-4 rounded-lg">
                        <div className="text-2xl font-bold text-blue-600">{formatDuration(results.duration)}</div>
                        <div className="text-sm text-blue-800">Total Duration</div>
                      </div>
                      <div className="bg-green-50 p-4 rounded-lg">
                        <div className="text-2xl font-bold text-green-600">{answers.length}</div>
                        <div className="text-sm text-green-800">Questions Answered</div>
                      </div>
                      <div className="bg-purple-50 p-4 rounded-lg">
                        <div className="text-2xl font-bold text-purple-600">
                          {results.detailedAnalysis.audio.filler_words}
                        </div>
                        <div className="text-sm text-purple-800">Filler Words</div>
                      </div>
                      <div className="bg-orange-50 p-4 rounded-lg">
                        <div className="text-2xl font-bold text-orange-600">
                          {results.detailedAnalysis.facial.eyeContact}%
                        </div>
                        <div className="text-sm text-orange-800">Eye Contact</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Strengths and Improvements */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-green-50 p-6 rounded-lg">
                    <h3 className="text-lg font-semibold text-green-900 mb-4">✅ Strengths</h3>
                    <ul className="space-y-2">
                      {results.strengths.map((strength, index) => (
                        <li key={index} className="flex items-start">
                          <span className="text-green-600 mr-2">•</span>
                          <span className="text-green-800">{strength}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="bg-yellow-50 p-6 rounded-lg">
                    <h3 className="text-lg font-semibold text-yellow-900 mb-4">📈 Areas for Improvement</h3>
                    <ul className="space-y-2">
                      {results.improvements.map((improvement, index) => (
                        <li key={index} className="flex items-start">
                          <span className="text-yellow-600 mr-2">•</span>
                          <span className="text-yellow-800">{improvement}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {/* Facial Analysis Tab */}
            {activeTab === 'facial' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">😊 Facial Expression Analysis</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      {Object.entries(results.detailedAnalysis.facial).map(([metric, score]) => (
                        <div key={metric}>
                          <div className="flex justify-between text-sm mb-1">
                            <span className="capitalize">{metric.replace(/([A-Z])/g, ' $1')}</span>
                            <span className={getScoreColor(score)}>{score}%</span>
                          </div>
                          <ProgressBar progress={score} />
                        </div>
                      ))}
                    </div>
                    <div className="bg-gray-50 p-6 rounded-lg">
                      <h4 className="font-medium text-gray-900 mb-3">AI Analysis Insights</h4>
                      <ul className="text-sm text-gray-600 space-y-2">
                        <li>• Maintained good eye contact throughout</li>
                        <li>• Professional facial expressions detected</li>
                        <li>• Confident body language observed</li>
                        <li>• Appropriate emotional responses</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Audio Analysis Tab */}
            {activeTab === 'audio' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">🎤 Voice & Speech Analysis</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      {Object.entries(results.detailedAnalysis.audio).map(([metric, score]) => (
                        <div key={metric}>
                          <div className="flex justify-between text-sm mb-1">
                            <span className="capitalize">{metric.replace(/([A-Z])/g, ' $1').replace('_', ' ')}</span>
                            <span className={getScoreColor(typeof score === 'number' && score > 20 ? 100 - score : score)}>
                              {metric === 'filler_words' ? `${score} words` : `${score}%`}
                            </span>
                          </div>
                          {metric !== 'filler_words' && <ProgressBar progress={score} />}
                          {metric === 'filler_words' && <ProgressBar progress={Math.max(0, 100 - score * 2)} />}
                        </div>
                      ))}
                    </div>
                    <div className="bg-gray-50 p-6 rounded-lg">
                      <h4 className="font-medium text-gray-900 mb-3">Speech Analysis</h4>
                      <ul className="text-sm text-gray-600 space-y-2">
                        <li>• Clear articulation and pronunciation</li>
                        <li>• Appropriate speaking pace</li>
                        <li>• Good voice modulation</li>
                        <li>• Minimal background noise detected</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Answers Review Tab */}
            {activeTab === 'answers' && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">💭 Your Answers Review</h3>
                {answers.length > 0 ? (
                  <div className="space-y-6">
                    {answers.map((answer, index) => (
                      <div key={index} className="border border-gray-200 rounded-lg p-6">
                        <div className="flex justify-between items-start mb-4">
                          <h4 className="font-medium text-gray-900">Question {index + 1}</h4>
                          <span className="text-sm text-gray-500">
                            {Math.floor(answer.timeSpent / 60)}m {answer.timeSpent % 60}s
                          </span>
                        </div>
                        <p className="text-gray-700 mb-4">{answer.questionText}</p>
                        {answer.textAnswer && (
                          <div className="bg-blue-50 p-4 rounded-lg mb-4">
                            <h5 className="font-medium text-blue-900 mb-2">Your Written Answer:</h5>
                            <p className="text-blue-800">{answer.textAnswer}</p>
                          </div>
                        )}
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <span>🎤 Audio recorded</span>
                          <span>🎥 Video captured</span>
                          <span>🤖 AI analyzed</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <div className="text-4xl mb-4">📝</div>
                    <p>No answers recorded</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="text-center">
          <div className="space-x-4">
            <Button
              onClick={() => navigate('/dashboard')}
              variant="outline"
              className="px-8 py-3"
            >
              📊 Back to Dashboard
            </Button>
            <Button
              onClick={() => window.print()}
              variant="outline"
              className="px-8 py-3"
            >
              🖨️ Print Results
            </Button>
            <Button
              onClick={() => navigate(`/interview/${id}`)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3"
            >
              🔄 Retake Interview
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Results;



// // frontend/src/pages/Results.jsx - SIMPLIFIED FOR TESTING
// import React, { useEffect, useState } from 'react';
// import { useParams, useNavigate } from 'react-router-dom';
// import { ArrowLeft, Download, Share2, RotateCcw, AlertTriangle, Clock, Trophy, Award } from 'lucide-react';
// import useUserStore from '../store/userStore';
// import api from '../services/api';
// import Button from '../components/ui/Button';
// import LoadingSpinner from '../components/ui/LoadingSpinner';

// const Results = () => {
//     const { interviewId } = useParams();
//     const navigate = useNavigate();
//     const { user, isAuthenticated } = useUserStore();
    
//     const [evaluation, setEvaluation] = useState(null);
//     const [interview, setInterview] = useState(null);
//     const [isLoading, setIsLoading] = useState(true);
//     const [error, setError] = useState(null);

//     // Redirect if not authenticated
//     useEffect(() => {
//         if (!isAuthenticated) {
//             navigate('/login');
//         }
//     }, [isAuthenticated, navigate]);

//     // Load interview and evaluation data
//     useEffect(() => {
//         const loadResults = async () => {
//             if (!interviewId || !isAuthenticated) return;

//             try {
//                 setIsLoading(true);
//                 setError(null);

//                 // Load interview data
//                 const interviewResponse = await api.get(`/interviews/${interviewId}`);
//                 setInterview(interviewResponse.data.interview);

//                 // Load evaluation results
//                 const evaluationsResponse = await api.get(`/evaluations/interview/${interviewId}`);
//                 const evaluations = evaluationsResponse.data.evaluations;

//                 if (evaluations.length > 0) {
//                     setEvaluation(evaluations[0]);
//                 } else {
//                     setError('No evaluation found for this interview');
//                 }

//             } catch (err) {
//                 console.error('Failed to load results:', err);
//                 setError('Failed to load interview results');
//             } finally {
//                 setIsLoading(false);
//             }
//         };

//         loadResults();
//     }, [interviewId, isAuthenticated]);

//     const handleBackToDashboard = () => {
//         navigate('/dashboard');
//     };

//     const handleRetakeInterview = () => {
//         navigate(`/interview/${interviewId}`);
//     };

//     if (!isAuthenticated) {
//         return <LoadingSpinner size="lg" />;
//     }

//     if (!interviewId) {
//         return (
//             <div className="min-h-screen bg-gray-50 flex items-center justify-center">
//                 <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full mx-4">
//                     <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
//                     <h3 className="text-lg font-semibold text-gray-900 mb-2">Invalid Results</h3>
//                     <p className="text-gray-600 mb-4">No interview ID provided.</p>
//                     <Button onClick={handleBackToDashboard}>Back to Dashboard</Button>
//                 </div>
//             </div>
//         );
//     }

//     return (
//         <div className="min-h-screen bg-gray-50">
//             {/* Header */}
//             <div className="bg-white shadow-sm border-b">
//                 <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
//                     <div className="flex items-center justify-between h-16">
//                         <Button onClick={handleBackToDashboard} variant="secondary" size="sm">
//                             <ArrowLeft className="w-4 h-4 mr-2" />
//                             Dashboard
//                         </Button>
//                         <div className="text-sm text-gray-600">
//                             {user?.name || user?.email}
//                         </div>
//                     </div>
//                 </div>
//             </div>

//             {/* Main Content */}
//             <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
//                 {isLoading && (
//                     <div className="flex items-center justify-center py-12">
//                         <div className="text-center">
//                             <LoadingSpinner size="lg" />
//                             <p className="text-gray-600 mt-4">Loading your results...</p>
//                         </div>
//                     </div>
//                 )}

//                 {error && (
//                     <div className="bg-white rounded-lg shadow-lg p-8 text-center">
//                         <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
//                         <h3 className="text-lg font-semibold text-gray-900 mb-2">Unable to Load Results</h3>
//                         <p className="text-gray-600 mb-6">{error}</p>
//                         <Button onClick={handleBackToDashboard}>Back to Dashboard</Button>
//                     </div>
//                 )}

//                 {!isLoading && !error && evaluation && (
//                     <div className="space-y-6">
//                         {/* Results Header */}
//                         <div className="bg-white rounded-lg border shadow-sm p-6">
//                             <div className="flex items-center justify-between mb-6">
//                                 <div>
//                                     <h1 className="text-2xl font-bold text-gray-900">
//                                         {interview?.title || 'Interview Results'}
//                                     </h1>
//                                     <p className="text-gray-600">
//                                         Completed on {evaluation.completedAt && new Date(evaluation.completedAt).toLocaleDateString()}
//                                     </p>
//                                 </div>
//                                 <div className="flex items-center space-x-3">
//                                     <Button onClick={handleRetakeInterview} size="sm">
//                                         <RotateCcw className="w-4 h-4 mr-2" />
//                                         Retake
//                                     </Button>
//                                 </div>
//                             </div>

//                             {/* Quick Stats */}
//                             <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
//                                 <div className="text-center">
//                                     <div className={`text-3xl font-bold ${
//                                         evaluation.overallScore >= 80 ? 'text-green-600' : 
//                                         evaluation.overallScore >= 60 ? 'text-yellow-600' : 'text-red-600'
//                                     }`}>
//                                         {evaluation.overallScore}%
//                                     </div>
//                                     <div className="text-sm text-gray-600">Overall Score</div>
//                                 </div>
//                                 <div className="text-center">
//                                     <div className={`text-3xl font-bold ${evaluation.passed ? 'text-green-600' : 'text-red-600'}`}>
//                                         {evaluation.passed ? 'PASS' : 'FAIL'}
//                                     </div>
//                                     <div className="text-sm text-gray-600">Result</div>
//                                 </div>
//                                 <div className="text-center">
//                                     <div className="text-3xl font-bold text-blue-600">
//                                         {evaluation.grade}
//                                     </div>
//                                     <div className="text-sm text-gray-600">Grade</div>
//                                 </div>
//                                 <div className="text-center">
//                                     <div className="text-3xl font-bold text-purple-600">
//                                         {interview?.questions?.length || 0}
//                                     </div>
//                                     <div className="text-sm text-gray-600">Questions</div>
//                                 </div>
//                             </div>
//                         </div>

//                         {/* Overall Score Display */}
//                         <div className="bg-white rounded-lg border shadow-sm p-6">
//                             <div className="text-center mb-6">
//                                 <div className="flex items-center justify-center mb-4">
//                                     {evaluation.passed ? (
//                                         <Trophy className="w-12 h-12 text-yellow-500" />
//                                     ) : (
//                                         <Award className="w-12 h-12 text-gray-400" />
//                                     )}
//                                 </div>
//                                 <h2 className="text-2xl font-bold text-gray-900 mb-2">
//                                     {evaluation.passed ? 'Congratulations!' : 'Keep Trying!'}
//                                 </h2>
//                                 <p className="text-gray-600">
//                                     {evaluation.passed 
//                                         ? 'You successfully passed the interview with a strong performance.'
//                                         : 'Use this feedback to improve and consider retaking the interview.'}
//                                 </p>
//                             </div>

//                             {/* Score Breakdown */}
//                             <div className="grid md:grid-cols-3 gap-6">
//                                 <div className="text-center">
//                                     <div className={`text-4xl font-bold mb-2 ${
//                                         (evaluation.individualScores?.facial || 0) >= 80 ? 'text-green-600' : 'text-yellow-600'
//                                     }`}>
//                                         {evaluation.individualScores?.facial || 0}%
//                                     </div>
//                                     <div className="text-sm text-gray-600">Facial Confidence</div>
//                                     <div className="text-xs text-gray-500 mt-1">Required: 80%</div>
//                                 </div>
//                                 <div className="text-center">
//                                     <div className={`text-4xl font-bold mb-2 ${
//                                         (evaluation.individualScores?.audio || 0) >= 60 ? 'text-green-600' : 'text-yellow-600'
//                                     }`}>
//                                         {evaluation.individualScores?.audio || 0}%
//                                     </div>
//                                     <div className="text-sm text-gray-600">Audio Quality</div>
//                                     <div className="text-xs text-gray-500 mt-1">Required: 60%</div>
//                                 </div>
//                                 <div className="text-center">
//                                     <div className={`text-4xl font-bold mb-2 ${
//                                         (evaluation.individualScores?.text || 0) >= 80 ? 'text-green-600' : 'text-yellow-600'
//                                     }`}>
//                                         {evaluation.individualScores?.text || 0}%
//                                     </div>
//                                     <div className="text-sm text-gray-600">Content Quality</div>
//                                     <div className="text-xs text-gray-500 mt-1">Required: 80%</div>
//                                 </div>
//                             </div>
//                         </div>

//                         {/* Feedback */}
//                         {evaluation.feedback && (
//                             <div className="bg-white rounded-lg border shadow-sm p-6">
//                                 <h3 className="text-lg font-medium text-gray-900 mb-3">Feedback</h3>
//                                 <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
//                                     <p className="text-blue-800">{evaluation.feedback}</p>
//                                 </div>
//                             </div>
//                         )}

//                         {/* Action Panel */}
//                         <div className="bg-white rounded-lg border shadow-sm p-6">
//                             <div className="flex items-center justify-between">
//                                 <div>
//                                     <h3 className="text-lg font-medium text-gray-900">What's Next?</h3>
//                                     <p className="text-gray-600">
//                                         {evaluation.passed 
//                                             ? 'Great job! You can share your results or take another interview.'
//                                             : 'Don\'t give up! Use the feedback to improve and try again.'}
//                                     </p>
//                                 </div>
//                                 <div className="flex items-center space-x-3">
//                                     <Button onClick={handleRetakeInterview}>
//                                         <RotateCcw className="w-4 h-4 mr-2" />
//                                         {evaluation.passed ? 'Take Another' : 'Retake Interview'}
//                                     </Button>
//                                 </div>
//                             </div>
//                         </div>
//                     </div>
//                 )}

//                 {!isLoading && !error && !evaluation && (
//                     <div className="bg-white rounded-lg shadow-lg p-8 text-center">
//                         <Clock className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
//                         <h3 className="text-lg font-semibold text-gray-900 mb-2">No Results Available</h3>
//                         <p className="text-gray-600 mb-6">This interview hasn't been completed yet.</p>
//                         <Button onClick={() => navigate(`/interview/${interviewId}`)}>
//                             Take Interview
//                         </Button>
//                     </div>
//                 )}
//             </div>
//         </div>
//     );
// };

// export default Results;