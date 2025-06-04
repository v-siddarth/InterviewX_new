// frontend/src/pages/Admin/ResultsManagement.jsx
import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  Eye, 
  Download,
  BarChart3,
  TrendingUp,
  Calendar,
  User,
  Clock,
  Award,
  FileText,
  RefreshCw
} from 'lucide-react';
import { useAdminStore } from '../../store/adminStore';
import Button from '../../components/ui/Button';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import Modal from '../../components/ui/Modal';

const ResultsManagement = () => {
  const { 
    results, 
    resultsStats,
    loading, 
    fetchResults,
    fetchResultsStats,
    exportData
  } = useAdminStore();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedDateRange, setSelectedDateRange] = useState('');
  const [selectedResult, setSelectedResult] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [sortBy, setSortBy] = useState('newest');
  const [exporting, setExporting] = useState(false);

  const statuses = ['completed', 'in-progress', 'failed'];
  const dateRanges = ['today', 'week', 'month', 'quarter', 'year'];

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    await Promise.all([
      fetchResults(),
      fetchResultsStats()
    ]);
  };

  const mockResults = [
    {
      _id: '1',
      interviewId: 'int_001',
      userId: '1',
      userName: 'Demo User',
      userEmail: 'demo@interviewx.com',
      interviewTitle: 'Frontend Developer Assessment',
      overallScore: 85,
      faceConfidence: 88,
      audioQuality: 90,
      answerRelevance: 82,
      status: 'completed',
      duration: 1845, // seconds
      completedAt: new Date(Date.now() - 86400000).toISOString(),
      createdAt: new Date(Date.now() - 86400000 - 1800000).toISOString(),
      passed: true,
      strengths: ['Technical knowledge', 'Communication', 'Problem solving'],
      improvements: ['More specific examples', 'Confidence in answers'],
      detailedAnalysis: {
        facial: { confidence: 88, eyeContact: 92, posture: 85 },
        audio: { clarity: 90, pace: 78, volume: 85 },
        content: { relevance: 87, depth: 82, structure: 90 }
      }
    },
    {
      _id: '2',
      interviewId: 'int_002',
      userId: '2',
      userName: 'Sarah Johnson',
      userEmail: 'sarah@example.com',
      interviewTitle: 'Backend Developer Position',
      overallScore: 76,
      faceConfidence: 82,
      audioQuality: 85,
      answerRelevance: 71,
      status: 'completed',
      duration: 2145,
      completedAt: new Date(Date.now() - 172800000).toISOString(),
      createdAt: new Date(Date.now() - 172800000 - 2100000).toISOString(),
      passed: true,
      strengths: ['System design', 'Database knowledge'],
      improvements: ['Communication clarity', 'Code optimization'],
      detailedAnalysis: {
        facial: { confidence: 82, eyeContact: 78, posture: 80 },
        audio: { clarity: 85, pace: 82, volume: 88 },
        content: { relevance: 71, depth: 75, structure: 85 }
      }
    },
    {
      _id: '3',
      interviewId: 'int_003',
      userId: '3',
      userName: 'Mike Chen',
      userEmail: 'mike@example.com',
      interviewTitle: 'Full Stack Developer Role',
      overallScore: 92,
      faceConfidence: 95,
      audioQuality: 88,
      answerRelevance: 93,
      status: 'completed',
      duration: 1923,
      completedAt: new Date(Date.now() - 259200000).toISOString(),
      createdAt: new Date(Date.now() - 259200000 - 1900000).toISOString(),
      passed: true,
      strengths: ['Excellent technical depth', 'Clear communication', 'Leadership experience'],
      improvements: ['Could provide more examples'],
      detailedAnalysis: {
        facial: { confidence: 95, eyeContact: 94, posture: 92 },
        audio: { clarity: 88, pace: 85, volume: 90 },
        content: { relevance: 93, depth: 95, structure: 88 }
      }
    }
  ];

  const filteredResults = mockResults.filter(result => {
    const searchMatch = 
      result.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      result.userEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
      result.interviewTitle.toLowerCase().includes(searchTerm.toLowerCase());
    
    const statusMatch = selectedStatus === '' || result.status === selectedStatus;
    
    return searchMatch && statusMatch;
  });

  const sortedResults = filteredResults.sort((a, b) => {
    switch (sortBy) {
      case 'newest':
        return new Date(b.completedAt) - new Date(a.completedAt);
      case 'oldest':
        return new Date(a.completedAt) - new Date(b.completedAt);
      case 'score-high':
        return b.overallScore - a.overallScore;
      case 'score-low':
        return a.overallScore - b.overallScore;
      case 'duration':
        return b.duration - a.duration;
      default:
        return 0;
    }
  });

  const handleViewResult = (result) => {
    setSelectedResult(result);
    setIsDetailModalOpen(true);
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      await exportData('results', {
        status: selectedStatus,
        dateRange: selectedDateRange,
        search: searchTerm
      });
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setExporting(false);
    }
  };

  const formatDuration = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-600 bg-green-100';
    if (score >= 60) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const StatCard = ({ title, value, icon: Icon, color, change, trend }) => (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-3xl font-bold text-gray-900">{value}</p>
          {change && (
            <p className={`text-sm ${trend === 'up' ? 'text-green-600' : 'text-red-600'} flex items-center mt-1`}>
              <TrendingUp size={16} className={`mr-1 ${trend === 'down' ? 'rotate-180' : ''}`} />
              {change}
            </p>
          )}
        </div>
        <div className={`p-3 rounded-full ${color}`}>
          <Icon size={24} className="text-white" />
        </div>
      </div>
    </div>
  );

  const ResultRow = ({ result }) => (
    <tr className="hover:bg-gray-50">
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center">
          <div className="flex-shrink-0 h-10 w-10">
            <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
              <User size={20} className="text-gray-600" />
            </div>
          </div>
          <div className="ml-4">
            <div className="text-sm font-medium text-gray-900">{result.userName}</div>
            <div className="text-sm text-gray-500">{result.userEmail}</div>
          </div>
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm text-gray-900">{result.interviewTitle}</div>
        <div className="text-sm text-gray-500">ID: {result.interviewId}</div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getScoreColor(result.overallScore)}`}>
          {result.overallScore}%
        </span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
        <div className="flex items-center">
          <Clock size={16} className="mr-1 text-gray-400" />
          {formatDuration(result.duration)}
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
          result.passed ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          {result.passed ? 'Passed' : 'Failed'}
        </span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
        {new Date(result.completedAt).toLocaleDateString()}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
        <Button variant="outline" size="sm" onClick={() => handleViewResult(result)}>
          <Eye size={16} className="mr-1" />
          View
        </Button>
      </td>
    </tr>
  );

  const ResultDetailModal = ({ result, isOpen, onClose }) => {
    if (!result) return null;

    return (
      <Modal isOpen={isOpen} onClose={onClose} title="Interview Result Details" size="xl">
        <div className="space-y-6">
          {/* Header Info */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">{result.interviewTitle}</h3>
              <p className="text-gray-600">{result.userName} ({result.userEmail})</p>
              <p className="text-sm text-gray-500">Interview ID: {result.interviewId}</p>
            </div>
            <div className="text-right">
              <div className={`inline-flex items-center px-3 py-1 rounded-full text-lg font-semibold ${getScoreColor(result.overallScore)}`}>
                {result.overallScore}% Overall Score
              </div>
              <p className="text-sm text-gray-500 mt-1">
                Completed on {new Date(result.completedAt).toLocaleDateString()}
              </p>
            </div>
          </div>

          {/* Score Breakdown */}
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{result.faceConfidence}%</div>
              <div className="text-sm text-gray-600">Face Confidence</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{result.audioQuality}%</div>
              <div className="text-sm text-gray-600">Audio Quality</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">{result.answerRelevance}%</div>
              <div className="text-sm text-gray-600">Answer Relevance</div>
            </div>
          </div>

          {/* Detailed Analysis */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-semibold text-gray-900 mb-3">Facial Analysis</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Confidence:</span>
                  <span className="text-sm font-medium">{result.detailedAnalysis.facial.confidence}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Eye Contact:</span>
                  <span className="text-sm font-medium">{result.detailedAnalysis.facial.eyeContact}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Posture:</span>
                  <span className="text-sm font-medium">{result.detailedAnalysis.facial.posture}%</span>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-semibold text-gray-900 mb-3">Audio Analysis</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Clarity:</span>
                  <span className="text-sm font-medium">{result.detailedAnalysis.audio.clarity}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Pace:</span>
                  <span className="text-sm font-medium">{result.detailedAnalysis.audio.pace}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Volume:</span>
                  <span className="text-sm font-medium">{result.detailedAnalysis.audio.volume}%</span>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-semibold text-gray-900 mb-3">Content Analysis</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Relevance:</span>
                  <span className="text-sm font-medium">{result.detailedAnalysis.content.relevance}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Depth:</span>
                  <span className="text-sm font-medium">{result.detailedAnalysis.content.depth}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Structure:</span>
                  <span className="text-sm font-medium">{result.detailedAnalysis.content.structure}%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Strengths and Improvements */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                <Award className="mr-2 text-green-600" size={20} />
                Strengths
              </h4>
              <ul className="space-y-2">
                {result.strengths.map((strength, index) => (
                  <li key={index} className="text-sm text-gray-600 flex items-center">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                    {strength}
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                <TrendingUp className="mr-2 text-orange-600" size={20} />
                Areas for Improvement
              </h4>
              <ul className="space-y-2">
                {result.improvements.map((improvement, index) => (
                  <li key={index} className="text-sm text-gray-600 flex items-center">
                    <div className="w-2 h-2 bg-orange-500 rounded-full mr-2"></div>
                    {improvement}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <Button variant="outline">
              <Download size={16} className="mr-1" />
              Export Report
            </Button>
            <Button onClick={onClose}>Close</Button>
          </div>
        </div>
      </Modal>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Results Management</h1>
              <p className="text-gray-600 mt-1">Analyze interview results and performance metrics</p>
            </div>
            <div className="flex space-x-3">
              <Button variant="outline" onClick={loadData}>
                <RefreshCw size={16} className="mr-2" />
                Refresh
              </Button>
              <Button variant="outline" onClick={handleExport} disabled={exporting}>
                <Download size={16} className="mr-2" />
                {exporting ? 'Exporting...' : 'Export Results'}
              </Button>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Total Results"
            value="156"
            icon={FileText}
            color="bg-blue-500"
            change="+12 this week"
            trend="up"
          />
          <StatCard
            title="Average Score"
            value="84.2%"
            icon={BarChart3}
            color="bg-green-500"
            change="+2.1% from last month"
            trend="up"
          />
          <StatCard
            title="Pass Rate"
            value="87%"
            icon={Award}
            color="bg-purple-500"
            change="+5% this month"
            trend="up"
          />
          <StatCard
            title="Avg Duration"
            value="28m"
            icon={Clock}
            color="bg-orange-500"
            change="-3m from average"
            trend="down"
          />
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search results..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Statuses</option>
              {statuses.map(status => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
            
            <select
              value={selectedDateRange}
              onChange={(e) => setSelectedDateRange(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Time</option>
              {dateRanges.map(range => (
                <option key={range} value={range}>{range}</option>
              ))}
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="score-high">Highest Score</option>
              <option value="score-low">Lowest Score</option>
              <option value="duration">Longest Duration</option>
            </select>

            <div className="text-sm text-gray-500 flex items-center">
              {sortedResults.length} result(s) found
            </div>
          </div>
        </div>

        {/* Results Table */}
        <div className="bg-white shadow-sm rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Candidate
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Interview
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Score
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Duration
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Result
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sortedResults.map(result => (
                <ResultRow key={result._id} result={result} />
              ))}
            </tbody>
          </table>

          {sortedResults.length === 0 && (
            <div className="text-center py-12">
              <BarChart3 className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No results found</h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchTerm || selectedStatus || selectedDateRange 
                  ? 'Try adjusting your filters' 
                  : 'No interview results available yet'
                }
              </p>
            </div>
          )}
        </div>

        {/* Result Detail Modal */}
        <ResultDetailModal
          result={selectedResult}
          isOpen={isDetailModalOpen}
          onClose={() => setIsDetailModalOpen(false)}
        />
      </div>
    </div>
  );
};

export default ResultsManagement;