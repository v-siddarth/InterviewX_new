// frontend/src/pages/Dashboard.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUserStore } from '../store/userStore';
import { useInterviewStore } from '../store/interviewStore';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import LoadingSpinner from '../components/ui/LoadingSpinner';

const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useUserStore();
  const { interviews, isLoading, fetchInterviews, createInterview } = useInterviewStore();
  
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newInterview, setNewInterview] = useState({
    title: '',
    type: 'technical',
    duration: 30,
    questions: []
  });

  useEffect(() => {
    fetchInterviews();
  }, [fetchInterviews]);

  const handleCreateInterview = async () => {
    try {
      const interview = await createInterview(newInterview);
      setShowCreateModal(false);
      setNewInterview({ title: '', type: 'technical', duration: 30, questions: [] });
      navigate(`/interview/${interview._id}`);
    } catch (error) {
      console.error('Failed to create interview:', error);
    }
  };

  const handleStartInterview = (interviewId) => {
    navigate(`/interview/${interviewId}`);
  };

  const handleViewResults = (interviewId) => {
    navigate(`/results/${interviewId}`);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-100';
      case 'in-progress': return 'text-yellow-600 bg-yellow-100';
      case 'pending': return 'text-blue-600 bg-blue-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header Section */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Welcome back, {user?.name || 'User'}!
        </h1>
        <p className="text-gray-600 mt-2">
          Manage your interviews and track your progress
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-medium text-gray-500">Total Interviews</h3>
          <p className="text-2xl font-bold text-gray-900">{interviews.length}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-medium text-gray-500">Completed</h3>
          <p className="text-2xl font-bold text-green-600">
            {interviews.filter(i => i.status === 'completed').length}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-medium text-gray-500">In Progress</h3>
          <p className="text-2xl font-bold text-yellow-600">
            {interviews.filter(i => i.status === 'in-progress').length}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-medium text-gray-500">Average Score</h3>
          <p className="text-2xl font-bold text-blue-600">
            {interviews.length > 0 
              ? Math.round(interviews.reduce((acc, i) => acc + (i.score || 0), 0) / interviews.length)
              : 0}%
          </p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-4 mb-8">
        <Button 
          onClick={() => setShowCreateModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium"
        >
          🎯 Start New Interview
        </Button>
        <Button 
          onClick={() => navigate('/profile')}
          variant="outline"
          className="border-gray-300 text-gray-700 hover:bg-gray-50 px-6 py-3 rounded-lg font-medium"
        >
          ⚙️ Settings
        </Button>
      </div>

      {/* Interviews List */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Your Interviews</h2>
        </div>
        
        {interviews.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">📝</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No interviews yet</h3>
            <p className="text-gray-600 mb-6">Get started by creating your first interview</p>
            <Button 
              onClick={() => setShowCreateModal(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              Create Interview
            </Button>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {interviews.map((interview) => (
              <div key={interview._id} className="px-6 py-4 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg font-medium text-gray-900">
                      {interview.title}
                    </h3>
                    <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                      <span>📋 {interview.type}</span>
                      <span>⏱️ {interview.duration} minutes</span>
                      <span>📅 {formatDate(interview.createdAt)}</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(interview.status)}`}>
                        {interview.status}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex space-x-3">
                    {interview.status === 'completed' ? (
                      <>
                        <Button
                          onClick={() => handleViewResults(interview._id)}
                          variant="outline"
                          size="sm"
                        >
                          📊 View Results
                        </Button>
                        <Button
                          onClick={() => handleStartInterview(interview._id)}
                          size="sm"
                        >
                          🔄 Retake
                        </Button>
                      </>
                    ) : (
                      <Button
                        onClick={() => handleStartInterview(interview._id)}
                        className="bg-green-600 hover:bg-green-700 text-white"
                        size="sm"
                      >
                        {interview.status === 'in-progress' ? '▶️ Continue' : '🚀 Start'}
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Interview Modal */}
      <Modal 
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create New Interview"
      >
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Interview Title
            </label>
            <input
              type="text"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., Frontend Developer Assessment"
              value={newInterview.title}
              onChange={(e) => setNewInterview({...newInterview, title: e.target.value})}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Interview Type
            </label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={newInterview.type}
              onChange={(e) => setNewInterview({...newInterview, type: e.target.value})}
            >
              <option value="technical">Technical Interview</option>
              <option value="behavioral">Behavioral Interview</option>
              <option value="coding">Coding Challenge</option>
              <option value="system-design">System Design</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Duration (minutes)
            </label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={newInterview.duration}
              onChange={(e) => setNewInterview({...newInterview, duration: parseInt(e.target.value)})}
            >
              <option value={15}>15 minutes</option>
              <option value={30}>30 minutes</option>
              <option value={45}>45 minutes</option>
              <option value={60}>60 minutes</option>
            </select>
          </div>

          <div className="flex space-x-3 pt-4">
            <Button
              onClick={handleCreateInterview}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
              disabled={!newInterview.title.trim()}
            >
              🚀 Create & Start
            </Button>
            <Button
              onClick={() => setShowCreateModal(false)}
              variant="outline"
              className="flex-1"
            >
              Cancel
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Dashboard;




// import React from 'react';
// import { motion } from 'framer-motion';
// import { Users, Calendar, TrendingUp, Clock, CheckCircle, XCircle, Plus } from 'lucide-react';
// import useUserStore from '../store/userStore.js';

// const Dashboard = () => {
//   const { user, getDisplayName, hasRole } = useUserStore();

//   // Mock data for demonstration
//   const stats = [
//     {
//       title: "Total Interviews",
//       value: "0",
//       icon: Users,
//       color: "text-blue-600",
//       bgColor: "bg-blue-100"
//     },
//     {
//       title: "Completed",
//       value: "0", 
//       icon: CheckCircle,
//       color: "text-green-600",
//       bgColor: "bg-green-100"
//     },
//     {
//       title: "Pending",
//       value: "0",
//       icon: Clock,
//       color: "text-yellow-600", 
//       bgColor: "bg-yellow-100"
//     },
//     {
//       title: "Success Rate",
//       value: "0%",
//       icon: TrendingUp,
//       color: "text-purple-600",
//       bgColor: "bg-purple-100"
//     }
//   ];

//   const recentActivities = [
//     {
//       id: 1,
//       type: "info",
//       message: "Welcome to InterviewX! Your dashboard will show activity once you start conducting interviews.",
//       time: "Just now"
//     }
//   ];

//   return (
//     <div className="min-h-screen bg-gray-50 py-8">
//       <div className="container mx-auto px-4 max-w-7xl">
//         {/* Header */}
//         <motion.div
//           initial={{ opacity: 0, y: 20 }}
//           animate={{ opacity: 1, y: 0 }}
//           className="mb-8"
//         >
//           <div className="flex flex-col md:flex-row md:items-center md:justify-between">
//             <div>
//               <h1 className="text-3xl font-bold text-gray-900">
//                 Welcome back, {getDisplayName()}!
//               </h1>
//               <p className="text-gray-600 mt-1">
//                 Here's what's happening with your interviews today.
//               </p>
//             </div>
//             <div className="mt-4 md:mt-0">
//               <button className="btn-primary flex items-center space-x-2">
//                 <Plus size={20} />
//                 <span>New Interview</span>
//               </button>
//             </div>
//           </div>
//         </motion.div>

//         {/* Stats Grid */}
//         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
//           {stats.map((stat, index) => {
//             const Icon = stat.icon;
//             return (
//               <motion.div
//                 key={stat.title}
//                 initial={{ opacity: 0, y: 20 }}
//                 animate={{ opacity: 1, y: 0 }}
//                 transition={{ delay: index * 0.1 }}
//                 className="card hover:shadow-xl transition-shadow"
//               >
//                 <div className="flex items-center justify-between">
//                   <div>
//                     <p className="text-sm font-medium text-gray-600 mb-1">
//                       {stat.title}
//                     </p>
//                     <p className="text-2xl font-bold text-gray-900">
//                       {stat.value}
//                     </p>
//                   </div>
//                   <div className={`p-3 rounded-full ${stat.bgColor}`}>
//                     <Icon className={`w-6 h-6 ${stat.color}`} />
//                   </div>
//                 </div>
//               </motion.div>
//             );
//           })}
//         </div>

//         <div className="grid lg:grid-cols-3 gap-8">
//           {/* User Profile Card */}
//           <motion.div
//             initial={{ opacity: 0, x: -20 }}
//             animate={{ opacity: 1, x: 0 }}
//             transition={{ delay: 0.3 }}
//             className="lg:col-span-1"
//           >
//             <div className="card">
//               <h3 className="text-lg font-semibold mb-4 flex items-center">
//                 <Users className="w-5 h-5 mr-2 text-primary-600" />
//                 Profile Information
//               </h3>
//               <div className="space-y-4">
//                 <div className="flex items-center space-x-3">
//                   <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
//                     <span className="text-primary-600 font-semibold text-lg">
//                       {getDisplayName().charAt(0).toUpperCase()}
//                     </span>
//                   </div>
//                   <div>
//                     <p className="font-medium text-gray-900">{user?.name || 'User'}</p>
//                     <p className="text-sm text-gray-500">{user?.email}</p>
//                   </div>
//                 </div>
                
//                 <div className="space-y-3 pt-4 border-t border-gray-100">
//                   <div className="flex justify-between">
//                     <span className="text-sm text-gray-600">Role:</span>
//                     <span className="text-sm font-medium capitalize text-primary-600">
//                       {user?.role || 'interviewer'}
//                     </span>
//                   </div>
                  
//                   {user?.company && (
//                     <div className="flex justify-between">
//                       <span className="text-sm text-gray-600">Company:</span>
//                       <span className="text-sm font-medium">{user.company}</span>
//                     </div>
//                   )}
                  
//                   <div className="flex justify-between">
//                     <span className="text-sm text-gray-600">Member since:</span>
//                     <span className="text-sm font-medium">Today</span>
//                   </div>
//                 </div>

//                 <button className="w-full btn-secondary mt-4">
//                   Edit Profile
//                 </button>
//               </div>
//             </div>
//           </motion.div>

//           {/* Main Content Area */}
//           <motion.div
//             initial={{ opacity: 0, x: 20 }}
//             animate={{ opacity: 1, x: 0 }}
//             transition={{ delay: 0.4 }}
//             className="lg:col-span-2 space-y-6"
//           >
//             {/* Quick Actions */}
//             <div className="card">
//               <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
//               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                 <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-left transition-colors">
//                   <Calendar className="w-6 h-6 text-primary-600 mb-2" />
//                   <h4 className="font-medium text-gray-900">Schedule Interview</h4>
//                   <p className="text-sm text-gray-600">Set up a new interview session</p>
//                 </button>
                
//                 <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-left transition-colors">
//                   <Users className="w-6 h-6 text-primary-600 mb-2" />
//                   <h4 className="font-medium text-gray-900">Manage Questions</h4>
//                   <p className="text-sm text-gray-600">Create and organize interview questions</p>
//                 </button>
//               </div>
//             </div>

//             {/* Recent Activity */}
//             <div className="card">
//               <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
//               <div className="space-y-3">
//                 {recentActivities.map((activity) => (
//                   <div key={activity.id} className="flex items-start space-x-3 p-3 bg-blue-50 rounded-lg">
//                     <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
//                     <div className="flex-1">
//                       <p className="text-sm text-gray-700">{activity.message}</p>
//                       <p className="text-xs text-gray-500 mt-1">{activity.time}</p>
//                     </div>
//                   </div>
//                 ))}
//               </div>
//             </div>

//             {/* Phase Status */}
//             <div className="card">
//               <h3 className="text-lg font-semibold mb-4">Development Status</h3>
//               <div className="space-y-3">
//                 <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
//                   <div className="flex items-center space-x-3">
//                     <CheckCircle className="w-5 h-5 text-green-600" />
//                     <span className="font-medium text-green-800">Phase 1: Foundation</span>
//                   </div>
//                   <span className="text-sm text-green-600">Complete</span>
//                 </div>
                
//                 <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
//                   <div className="flex items-center space-x-3">
//                     <CheckCircle className="w-5 h-5 text-green-600" />
//                     <span className="font-medium text-green-800">Phase 2: Authentication</span>
//                   </div>
//                   <span className="text-sm text-green-600">Complete</span>
//                 </div>
                
//                 <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
//                   <div className="flex items-center space-x-3">
//                     <Clock className="w-5 h-5 text-yellow-600" />
//                     <span className="font-medium text-yellow-800">Phase 3: UI Components</span>
//                   </div>
//                   <span className="text-sm text-yellow-600">Coming Next</span>
//                 </div>
//               </div>
//             </div>
//           </motion.div>
//         </div>

//         {/* Additional Features */}
//         <motion.div
//           initial={{ opacity: 0, y: 20 }}
//           animate={{ opacity: 1, y: 0 }}
//           transition={{ delay: 0.6 }}
//           className="mt-8"
//         >
//           <div className="card text-center">
//             <h2 className="text-2xl font-semibold mb-4">Ready to Start Interviewing?</h2>
//             <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
//               Your authentication system is now complete! In Phase 3, we'll add interview creation, 
//               question management, and candidate evaluation features.
//             </p>
//             <div className="flex flex-col sm:flex-row gap-4 justify-center">
//               <button className="btn-primary">
//                 Explore Features
//               </button>
//               <button className="btn-secondary">
//                 View Documentation
//               </button>
//             </div>
//           </div>
//         </motion.div>
//       </div>
//     </div>
//   );
// };

// export default Dashboard;