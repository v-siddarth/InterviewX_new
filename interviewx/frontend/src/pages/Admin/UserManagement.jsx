// frontend/src/pages/Admin/UserManagement.jsx
import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  Eye, 
  Edit2, 
  Trash2, 
  UserPlus, 
  Download,
  Mail,
  Phone,
  MapPin,
  Calendar,
  MoreVertical,
  Shield,
  ShieldOff,
  Ban,
  CheckCircle
} from 'lucide-react';
import { useAdminStore } from '../../store/adminStore';
import { getImageUrl } from '../../services/api';
import Button from '../../components/ui/Button';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import Modal from '../../components/ui/Modal';
import UserCard from '../../components/admin/UserCard';

const UserManagement = () => {
  const { 
    users, 
    userStats,
    loading, 
    fetchUsers,
    updateUserRole,
    toggleUserStatus,
    deleteUser,
    fetchUserStats
  } = useAdminStore();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [selectedUser, setSelectedUser] = useState(null);
  const [isUserDetailOpen, setIsUserDetailOpen] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState([]);

  const roles = ['admin', 'candidate', 'interviewer'];
  const statuses = ['active', 'inactive', 'banned'];

  useEffect(() => {
    fetchUsers();
    fetchUserStats();
  }, []);

  const filteredUsers = users.filter(user => {
    const searchMatch = 
      user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const roleMatch = selectedRole === '' || user.role === selectedRole;
    const statusMatch = selectedStatus === '' || user.status === selectedStatus;
    
    return searchMatch && roleMatch && statusMatch;
  });

  const sortedUsers = filteredUsers.sort((a, b) => {
    switch (sortBy) {
      case 'newest':
        return new Date(b.createdAt) - new Date(a.createdAt);
      case 'oldest':
        return new Date(a.createdAt) - new Date(b.createdAt);
      case 'name':
        return `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`);
      case 'email':
        return a.email.localeCompare(b.email);
      case 'role':
        return a.role.localeCompare(b.role);
      case 'interviews':
        return (b.totalInterviews || 0) - (a.totalInterviews || 0);
      default:
        return 0;
    }
  });

  const handleViewUser = (user) => {
    setSelectedUser(user);
    setIsUserDetailOpen(true);
  };

  const handleUpdateRole = async (userId, newRole) => {
    try {
      await updateUserRole(userId, newRole);
      await fetchUsers();
    } catch (error) {
      console.error('Error updating user role:', error);
    }
  };

  const handleToggleStatus = async (userId, currentStatus) => {
    try {
      const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
      await toggleUserStatus(userId, newStatus);
      await fetchUsers();
    } catch (error) {
      console.error('Error updating user status:', error);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      try {
        await deleteUser(userId);
        await fetchUsers();
        await fetchUserStats();
      } catch (error) {
        console.error('Error deleting user:', error);
      }
    }
  };

  const generateInitials = (firstName, lastName) => {
    return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase();
  };

  const createFallbackAvatar = (firstName, lastName) => {
    const initials = generateInitials(firstName, lastName);
    const colors = ['3B82F6', 'EF4444', '10B981', 'F59E0B', '8B5CF6', 'EC4899'];
    const color = colors[Math.floor(Math.random() * colors.length)];
    
    return `data:image/svg+xml;base64,${btoa(`
      <svg width="100" height="100" xmlns="http://www.w3.org/2000/svg">
        <rect width="100" height="100" fill="#${color}"/>
        <text x="50" y="50" font-family="Arial, sans-serif" font-size="36" font-weight="bold" text-anchor="middle" dy=".1em" fill="white">${initials}</text>
      </svg>
    `)}`;
  };

  const getUserAvatar = (user) => {
    if (user.profileImage) {
      return getImageUrl(user.profileImage);
    }
    if (user.avatar) {
      return user.avatar;
    }
    return createFallbackAvatar(user.firstName, user.lastName);
  };

  const StatCard = ({ title, value, icon: Icon, color }) => (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex items-center">
        <div className={`p-3 rounded-full ${color} mr-4`}>
          <Icon size={24} className="text-white" />
        </div>
        <div>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          <p className="text-gray-600">{title}</p>
        </div>
      </div>
    </div>
  );

  const UserRow = ({ user }) => (
    <tr className="hover:bg-gray-50">
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center">
          <img
            src={getUserAvatar(user)}
            alt={`${user.firstName} ${user.lastName}`}
            className="h-10 w-10 rounded-full object-cover"
          />
          <div className="ml-4">
            <div className="text-sm font-medium text-gray-900">
              {user.firstName} {user.lastName}
            </div>
            <div className="text-sm text-gray-500">{user.email}</div>
          </div>
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
          user.role === 'admin' ? 'bg-purple-100 text-purple-800' :
          user.role === 'interviewer' ? 'bg-blue-100 text-blue-800' :
          'bg-gray-100 text-gray-800'
        }`}>
          {user.role}
        </span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
          user.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          {user.isActive ? 'Active' : 'Inactive'}
        </span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
        {user.totalInterviews || 0}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
        {user.averageScore || 0}%
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
        {new Date(user.createdAt).toLocaleDateString()}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
        {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Never'}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={() => handleViewUser(user)}>
            <Eye size={16} />
          </Button>
          <select
            value={user.role}
            onChange={(e) => handleUpdateRole(user._id, e.target.value)}
            className="text-xs border rounded px-2 py-1"
          >
            {roles.map(role => (
              <option key={role} value={role}>{role}</option>
            ))}
          </select>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => handleToggleStatus(user._id, user.isActive ? 'active' : 'inactive')}
          >
            {user.isActive ? <Ban size={16} /> : <CheckCircle size={16} />}
          </Button>
          <Button variant="outline" size="sm" onClick={() => handleDeleteUser(user._id)}>
            <Trash2 size={16} />
          </Button>
        </div>
      </td>
    </tr>
  );

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
              <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
              <p className="text-gray-600 mt-1">Manage user accounts and permissions</p>
            </div>
            <div className="flex space-x-3">
              <Button variant="outline">
                <Download size={16} className="mr-2" />
                Export Users
              </Button>
              <Button>
                <UserPlus size={16} className="mr-2" />
                Add User
              </Button>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Total Users"
            value={userStats?.totalUsers || 0}
            icon={UserPlus}
            color="bg-blue-500"
          />
          <StatCard
            title="Active Users"
            value={userStats?.activeUsers || 0}
            icon={CheckCircle}
            color="bg-green-500"
          />
          <StatCard
            title="Admins"
            value={userStats?.adminUsers || 0}
            icon={Shield}
            color="bg-purple-500"
          />
          <StatCard
            title="New This Month"
            value={userStats?.newThisMonth || 0}
            icon={Calendar}
            color="bg-orange-500"
          />
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Roles</option>
              {roles.map(role => (
                <option key={role} value={role}>{role}</option>
              ))}
            </select>
            
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="name">Name</option>
              <option value="email">Email</option>
              <option value="role">Role</option>
              <option value="interviews">Most Interviews</option>
            </select>

            <div className="text-sm text-gray-500 flex items-center">
              {sortedUsers.length} user(s) found
            </div>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white shadow-sm rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Interviews
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Avg Score
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Joined
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Login
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sortedUsers.map(user => (
                <UserRow key={user._id} user={user} />
              ))}
            </tbody>
          </table>

          {sortedUsers.length === 0 && (
            <div className="text-center py-12">
              <UserPlus className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No users found</h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchTerm || selectedRole || selectedStatus 
                  ? 'Try adjusting your filters' 
                  : 'No users have been created yet'
                }
              </p>
            </div>
          )}
        </div>

        {/* User Detail Modal */}
        <Modal 
          isOpen={isUserDetailOpen} 
          onClose={() => setIsUserDetailOpen(false)}
          title="User Details"
          size="lg"
        >
          {selectedUser && (
            <UserCard user={selectedUser} onClose={() => setIsUserDetailOpen(false)} />
          )}
        </Modal>
      </div>
    </div>
  );
};

export default UserManagement;