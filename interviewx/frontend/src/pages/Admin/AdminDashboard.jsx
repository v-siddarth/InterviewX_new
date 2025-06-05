// frontend/src/pages/Admin/AdminDashboard.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Users, 
  FileQuestion, 
  BarChart3, 
  Settings, 
  TrendingUp, 
  AlertCircle,
  CheckCircle,
  Clock,
  Eye,
  Download,
  RefreshCw
} from 'lucide-react';
import { useAdminStore } from '../../store/adminStore';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import Button from '../../components/ui/Button';

const AdminDashboard = () => {
  const { 
    dashboardStats,
    recentActivities, 
    dashboardLoading,
    fetchDashboardStats
  } = useAdminStore();
  
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (!dashboardStats.totalUsers && !dashboardLoading) {
      loadDashboardData();
    }
  }, [dashboardStats.totalUsers, dashboardLoading]);

  const loadDashboardData = async () => {
    await fetchDashboardStats();
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  };

  const StatCard = ({ title, value, change, icon: Icon, color, trend }) => (
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

  const QuickActionCard = ({ title, description, icon: Icon, to, color }) => (
    <Link to={to} className="block">
      <div className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow">
        <div className="flex items-center space-x-4">
          <div className={`p-3 rounded-full ${color}`}>
            <Icon size={24} className="text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
            <p className="text-gray-600">{description}</p>
          </div>
        </div>
      </div>
    </Link>
  );

  if (dashboardLoading && !dashboardStats.totalUsers) {
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
              <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
              <p className="text-gray-600 mt-1">Welcome back! Here's what's happening on InterviewX.</p>
            </div>
            <Button
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center gap-2"
            >
              <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Total Users"
            value={dashboardStats?.totalUsers || '0'}
            change="+12 this month"
            icon={Users}
            color="bg-blue-500"
            trend="up"
          />
          <StatCard
            title="Active Interviews"
            value={dashboardStats?.activeInterviews || '0'}
            change="+5 today"
            icon={Clock}
            color="bg-orange-500"
            trend="up"
          />
          <StatCard
            title="Completed Interviews"
            value={dashboardStats?.completedInterviews || '0'}
            change="+23 this week"
            icon={CheckCircle}
            color="bg-green-500"
            trend="up"
          />
          <StatCard
            title="Questions Bank"
            value={dashboardStats?.totalQuestions || '0'}
            change="+8 new questions"
            icon={FileQuestion}
            color="bg-purple-500"
            trend="up"
          />
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <QuickActionCard
              title="Manage Questions"
              description="Add, edit, or organize interview questions"
              icon={FileQuestion}
              to="/admin/questions"
              color="bg-purple-500"
            />
            <QuickActionCard
              title="View Users"
              description="Manage user accounts and permissions"
              icon={Users}
              to="/admin/users"
              color="bg-blue-500"
            />
            <QuickActionCard
              title="Review Results"
              description="Analyze interview results and performance"
              icon={BarChart3}
              to="/admin/results"
              color="bg-green-500"
            />
            <QuickActionCard
              title="System Settings"
              description="Configure platform settings"
              icon={Settings}
              to="/admin/settings"
              color="bg-gray-500"
            />
          </div>
        </div>

        {/* Recent Activities & Analytics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Activities */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activities</h3>
            <div className="space-y-4">
              {recentActivities?.length > 0 ? (
                recentActivities.map((activity, index) => (
                  <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                    <div className={`p-2 rounded-full ${activity.color || 'bg-blue-100'}`}>
                      {activity.type === 'user' && <Users size={16} className="text-blue-600" />}
                      {activity.type === 'interview' && <Clock size={16} className="text-orange-600" />}
                      {activity.type === 'question' && <FileQuestion size={16} className="text-purple-600" />}
                      {activity.type === 'result' && <BarChart3 size={16} className="text-green-600" />}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{activity.title}</p>
                      <p className="text-xs text-gray-500">{activity.time}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <AlertCircle className="mx-auto h-12 w-12 text-gray-400" />
                  <p className="text-gray-500 mt-2">No recent activities</p>
                </div>
              )}
            </div>
          </div>

          {/* System Health */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">System Health</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="text-green-600" size={20} />
                  <span className="text-sm font-medium text-gray-900">API Server</span>
                </div>
                <span className="text-sm text-green-600">Online</span>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="text-green-600" size={20} />
                  <span className="text-sm font-medium text-gray-900">Database</span>
                </div>
                <span className="text-sm text-green-600">Connected</span>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="text-green-600" size={20} />
                  <span className="text-sm font-medium text-gray-900">AI Services</span>
                </div>
                <span className="text-sm text-green-600">Running</span>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                <div className="flex items-center space-x-2">
                  <AlertCircle className="text-yellow-600" size={20} />
                  <span className="text-sm font-medium text-gray-900">Storage</span>
                </div>
                <span className="text-sm text-yellow-600">85% Full</span>
              </div>
            </div>
          </div>
        </div>

        {/* Performance Charts */}
        <div className="mt-8">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Interview Performance Overview</h3>
              <div className="flex space-x-2">
                <Button variant="outline" size="sm">
                  <Eye size={16} className="mr-1" />
                  View Details
                </Button>
                <Button variant="outline" size="sm">
                  <Download size={16} className="mr-1" />
                  Export
                </Button>
              </div>
            </div>
            
            {/* Placeholder for charts */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600">87%</div>
                <div className="text-sm text-gray-600">Average Pass Rate</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600">12m 34s</div>
                <div className="text-sm text-gray-600">Average Duration</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-600">4.2/5</div>
                <div className="text-sm text-gray-600">User Satisfaction</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;



// // frontend/src/pages/Admin/AdminDashboard.jsx
// import React, { useState, useEffect } from 'react';
// import { Link } from 'react-router-dom';
// import { 
//   Users, 
//   FileQuestion, 
//   BarChart3, 
//   Settings, 
//   TrendingUp, 
//   AlertCircle,
//   CheckCircle,
//   Clock,
//   Eye,
//   Download,
//   RefreshCw
// } from 'lucide-react';
// import { useAdminStore } from '../../store/adminStore';
// import { adminAPI } from '../../services/api';
// import LoadingSpinner from '../../components/ui/LoadingSpinner';
// import Button from '../../components/ui/Button';

// const AdminDashboard = () => {
//   const { 
//     stats, 
//     recentActivities, 
//     loading, 
//     fetchDashboardStats,
//     fetchRecentActivities 
//   } = useAdminStore();
  
//   const [refreshing, setRefreshing] = useState(false);

//   useEffect(() => {
//     loadDashboardData();
//   }, []);

//   const loadDashboardData = async () => {
//     await Promise.all([
//       fetchDashboardStats(),
//       fetchRecentActivities()
//     ]);
//   };

//   const handleRefresh = async () => {
//     setRefreshing(true);
//     await loadDashboardData();
//     setRefreshing(false);
//   };

//   const StatCard = ({ title, value, change, icon: Icon, color, trend }) => (
//     <div className="bg-white rounded-lg shadow-sm p-6">
//       <div className="flex items-center justify-between">
//         <div>
//           <p className="text-sm font-medium text-gray-600">{title}</p>
//           <p className="text-3xl font-bold text-gray-900">{value}</p>
//           {change && (
//             <p className={`text-sm ${trend === 'up' ? 'text-green-600' : 'text-red-600'} flex items-center mt-1`}>
//               <TrendingUp size={16} className={`mr-1 ${trend === 'down' ? 'rotate-180' : ''}`} />
//               {change}
//             </p>
//           )}
//         </div>
//         <div className={`p-3 rounded-full ${color}`}>
//           <Icon size={24} className="text-white" />
//         </div>
//       </div>
//     </div>
//   );

//   const QuickActionCard = ({ title, description, icon: Icon, to, color }) => (
//     <Link to={to} className="block">
//       <div className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow">
//         <div className="flex items-center space-x-4">
//           <div className={`p-3 rounded-full ${color}`}>
//             <Icon size={24} className="text-white" />
//           </div>
//           <div>
//             <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
//             <p className="text-gray-600">{description}</p>
//           </div>
//         </div>
//       </div>
//     </Link>
//   );

//   if (loading) {
//     return (
//       <div className="min-h-screen flex items-center justify-center">
//         <LoadingSpinner size="lg" />
//       </div>
//     );
//   }

//   return (
//     <div className="min-h-screen bg-gray-50 py-8">
//       <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
//         {/* Header */}
//         <div className="mb-8">
//           <div className="flex items-center justify-between">
//             <div>
//               <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
//               <p className="text-gray-600 mt-1">Welcome back! Here's what's happening on InterviewX.</p>
//             </div>
//             <Button
//               onClick={handleRefresh}
//               disabled={refreshing}
//               className="flex items-center gap-2"
//             >
//               <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
//               Refresh
//             </Button>
//           </div>
//         </div>

//         {/* Stats Overview */}
//         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
//           <StatCard
//             title="Total Users"
//             value={stats?.totalUsers || '0'}
//             change="+12 this month"
//             icon={Users}
//             color="bg-blue-500"
//             trend="up"
//           />
//           <StatCard
//             title="Active Interviews"
//             value={stats?.activeInterviews || '0'}
//             change="+5 today"
//             icon={Clock}
//             color="bg-orange-500"
//             trend="up"
//           />
//           <StatCard
//             title="Completed Interviews"
//             value={stats?.completedInterviews || '0'}
//             change="+23 this week"
//             icon={CheckCircle}
//             color="bg-green-500"
//             trend="up"
//           />
//           <StatCard
//             title="Questions Bank"
//             value={stats?.totalQuestions || '0'}
//             change="+8 new questions"
//             icon={FileQuestion}
//             color="bg-purple-500"
//             trend="up"
//           />
//         </div>

//         {/* Quick Actions */}
//         <div className="mb-8">
//           <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
//           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
//             <QuickActionCard
//               title="Manage Questions"
//               description="Add, edit, or organize interview questions"
//               icon={FileQuestion}
//               to="/admin/questions"
//               color="bg-purple-500"
//             />
//             <QuickActionCard
//               title="View Users"
//               description="Manage user accounts and permissions"
//               icon={Users}
//               to="/admin/users"
//               color="bg-blue-500"
//             />
//             <QuickActionCard
//               title="Review Results"
//               description="Analyze interview results and performance"
//               icon={BarChart3}
//               to="/admin/results"
//               color="bg-green-500"
//             />
//             <QuickActionCard
//               title="System Settings"
//               description="Configure platform settings"
//               icon={Settings}
//               to="/admin/settings"
//               color="bg-gray-500"
//             />
//           </div>
//         </div>

//         {/* Recent Activities & Analytics */}
//         <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
//           {/* Recent Activities */}
//           <div className="bg-white rounded-lg shadow-sm p-6">
//             <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activities</h3>
//             <div className="space-y-4">
//               {recentActivities?.length > 0 ? (
//                 recentActivities.map((activity, index) => (
//                   <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
//                     <div className={`p-2 rounded-full ${activity.color || 'bg-blue-100'}`}>
//                       {activity.type === 'user' && <Users size={16} className="text-blue-600" />}
//                       {activity.type === 'interview' && <Clock size={16} className="text-orange-600" />}
//                       {activity.type === 'question' && <FileQuestion size={16} className="text-purple-600" />}
//                       {activity.type === 'result' && <BarChart3 size={16} className="text-green-600" />}
//                     </div>
//                     <div className="flex-1">
//                       <p className="text-sm font-medium text-gray-900">{activity.title}</p>
//                       <p className="text-xs text-gray-500">{activity.time}</p>
//                     </div>
//                   </div>
//                 ))
//               ) : (
//                 <div className="text-center py-8">
//                   <AlertCircle className="mx-auto h-12 w-12 text-gray-400" />
//                   <p className="text-gray-500 mt-2">No recent activities</p>
//                 </div>
//               )}
//             </div>
//           </div>

//           {/* System Health */}
//           <div className="bg-white rounded-lg shadow-sm p-6">
//             <h3 className="text-lg font-semibold text-gray-900 mb-4">System Health</h3>
//             <div className="space-y-4">
//               <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
//                 <div className="flex items-center space-x-2">
//                   <CheckCircle className="text-green-600" size={20} />
//                   <span className="text-sm font-medium text-gray-900">API Server</span>
//                 </div>
//                 <span className="text-sm text-green-600">Online</span>
//               </div>
              
//               <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
//                 <div className="flex items-center space-x-2">
//                   <CheckCircle className="text-green-600" size={20} />
//                   <span className="text-sm font-medium text-gray-900">Database</span>
//                 </div>
//                 <span className="text-sm text-green-600">Connected</span>
//               </div>
              
//               <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
//                 <div className="flex items-center space-x-2">
//                   <CheckCircle className="text-green-600" size={20} />
//                   <span className="text-sm font-medium text-gray-900">AI Services</span>
//                 </div>
//                 <span className="text-sm text-green-600">Running</span>
//               </div>
              
//               <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
//                 <div className="flex items-center space-x-2">
//                   <AlertCircle className="text-yellow-600" size={20} />
//                   <span className="text-sm font-medium text-gray-900">Storage</span>
//                 </div>
//                 <span className="text-sm text-yellow-600">85% Full</span>
//               </div>
//             </div>
//           </div>
//         </div>

//         {/* Performance Charts */}
//         <div className="mt-8">
//           <div className="bg-white rounded-lg shadow-sm p-6">
//             <div className="flex items-center justify-between mb-4">
//               <h3 className="text-lg font-semibold text-gray-900">Interview Performance Overview</h3>
//               <div className="flex space-x-2">
//                 <Button variant="outline" size="sm">
//                   <Eye size={16} className="mr-1" />
//                   View Details
//                 </Button>
//                 <Button variant="outline" size="sm">
//                   <Download size={16} className="mr-1" />
//                   Export
//                 </Button>
//               </div>
//             </div>
            
//             {/* Placeholder for charts */}
//             <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
//               <div className="text-center">
//                 <div className="text-3xl font-bold text-green-600">87%</div>
//                 <div className="text-sm text-gray-600">Average Pass Rate</div>
//               </div>
//               <div className="text-center">
//                 <div className="text-3xl font-bold text-blue-600">12m 34s</div>
//                 <div className="text-sm text-gray-600">Average Duration</div>
//               </div>
//               <div className="text-center">
//                 <div className="text-3xl font-bold text-purple-600">4.2/5</div>
//                 <div className="text-sm text-gray-600">User Satisfaction</div>
//               </div>
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default AdminDashboard;