// frontend/src/components/admin/UserCard.jsx
import React from 'react';
import { 
  Mail, 
  Phone, 
  MapPin, 
  Calendar, 
  Briefcase, 
  Award, 
  Clock, 
  User,
  Shield,
  CheckCircle,
  XCircle,
  FileText,
  Download
} from 'lucide-react';
import { getImageUrl } from '../../services/api';
import Button from '../ui/Button';

const UserCard = ({ user, onClose }) => {
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

  const getUserAvatar = () => {
    if (user.profileImage) {
      return getImageUrl(user.profileImage);
    }
    if (user.avatar) {
      return user.avatar;
    }
    return createFallbackAvatar(user.firstName, user.lastName);
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'admin':
        return 'bg-purple-100 text-purple-800';
      case 'interviewer':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (isActive) => {
    return isActive ? 'text-green-600' : 'text-red-600';
  };

  const InfoItem = ({ icon: Icon, label, value, valueClassName = '' }) => (
    <div className="flex items-start space-x-3">
      <Icon size={20} className="text-gray-400 mt-0.5" />
      <div className="flex-1">
        <dt className="text-sm font-medium text-gray-500">{label}</dt>
        <dd className={`text-sm text-gray-900 ${valueClassName}`}>{value || 'Not provided'}</dd>
      </div>
    </div>
  );

  const StatCard = ({ label, value, icon: Icon, color = 'text-gray-600' }) => (
    <div className="text-center p-4 bg-gray-50 rounded-lg">
      <Icon size={24} className={`mx-auto mb-2 ${color}`} />
      <div className="text-2xl font-bold text-gray-900">{value}</div>
      <div className="text-sm text-gray-600">{label}</div>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-t-lg p-6 text-white">
        <div className="flex items-center space-x-4">
          <img
            src={getUserAvatar()}
            alt={`${user.firstName} ${user.lastName}`}
            className="w-20 h-20 rounded-full border-4 border-white object-cover"
          />
          <div className="flex-1">
            <h2 className="text-2xl font-bold">{user.firstName} {user.lastName}</h2>
            <p className="text-blue-100">{user.email}</p>
            <div className="flex items-center space-x-4 mt-2">
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleColor(user.role)}`}>
                <Shield size={12} className="mr-1" />
                {user.role}
              </span>
              <span className={`flex items-center text-sm ${getStatusColor(user.isActive)}`}>
                {user.isActive ? <CheckCircle size={16} className="mr-1" /> : <XCircle size={16} className="mr-1" />}
                {user.isActive ? 'Active' : 'Inactive'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="bg-white rounded-b-lg p-6 space-y-8">
        {/* Statistics */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Statistics</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <StatCard
              label="Total Interviews"
              value={user.totalInterviews || 0}
              icon={FileText}
              color="text-blue-600"
            />
            <StatCard
              label="Average Score"
              value={`${user.averageScore || 0}%`}
              icon={Award}
              color="text-green-600"
            />
            <StatCard
              label="Account Age"
              value={`${Math.floor((new Date() - new Date(user.createdAt)) / (1000 * 60 * 60 * 24))} days`}
              icon={Calendar}
              color="text-purple-600"
            />
          </div>
        </div>

        {/* Personal Information */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Personal Information</h3>
          <dl className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <InfoItem
              icon={Mail}
              label="Email Address"
              value={user.email}
            />
            <InfoItem
              icon={Phone}
              label="Phone Number"
              value={user.phone}
            />
            <InfoItem
              icon={MapPin}
              label="Location"
              value={user.location}
            />
            <InfoItem
              icon={Calendar}
              label="Date of Birth"
              value={user.dateOfBirth ? new Date(user.dateOfBirth).toLocaleDateString() : null}
            />
          </dl>
        </div>

        {/* Professional Information */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Professional Information</h3>
          <dl className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <InfoItem
              icon={Briefcase}
              label="Job Title"
              value={user.jobTitle}
            />
            <InfoItem
              icon={Clock}
              label="Experience"
              value={user.experience ? `${user.experience} years` : null}
            />
          </dl>
          
          {user.skills && user.skills.length > 0 && (
            <div className="mt-4">
              <dt className="text-sm font-medium text-gray-500 mb-2">Skills</dt>
              <dd className="flex flex-wrap gap-2">
                {user.skills.map((skill, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                  >
                    {skill}
                  </span>
                ))}
              </dd>
            </div>
          )}

          {user.education && (
            <div className="mt-4">
              <dt className="text-sm font-medium text-gray-500 mb-2">Education</dt>
              <dd className="text-sm text-gray-900">{user.education}</dd>
            </div>
          )}

          {user.about && (
            <div className="mt-4">
              <dt className="text-sm font-medium text-gray-500 mb-2">About</dt>
              <dd className="text-sm text-gray-900">{user.about}</dd>
            </div>
          )}
        </div>

        {/* Account Information */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Account Information</h3>
          <dl className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <InfoItem
              icon={Calendar}
              label="Member Since"
              value={new Date(user.createdAt).toLocaleDateString()}
            />
            <InfoItem
              icon={Clock}
              label="Last Login"
              value={user.lastLogin ? new Date(user.lastLogin).toLocaleString() : 'Never'}
            />
            <InfoItem
              icon={Shield}
              label="Account Status"
              value={user.isActive ? 'Active' : 'Inactive'}
              valueClassName={getStatusColor(user.isActive)}
            />
            <InfoItem
              icon={CheckCircle}
              label="Email Verified"
              value={user.isEmailVerified ? 'Yes' : 'No'}
              valueClassName={user.isEmailVerified ? 'text-green-600' : 'text-red-600'}
            />
          </dl>
        </div>

        {/* Files */}
        {(user.resumeUrl || user.profileImage) && (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Files</h3>
            <div className="space-y-3">
              {user.resumeUrl && (
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <FileText className="text-blue-600" size={20} />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Resume</p>
                      <p className="text-sm text-gray-500">{user.resumeFileName || 'resume.pdf'}</p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm">
                    <Download size={16} className="mr-1" />
                    Download
                  </Button>
                </div>
              )}
              
              {user.profileImage && (
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <User className="text-green-600" size={20} />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Profile Image</p>
                      <p className="text-sm text-gray-500">User profile picture</p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm">
                    <Download size={16} className="mr-1" />
                    View
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Interview History Preview */}
        {user.totalInterviews > 0 && (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Interview Activity</h3>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-blue-600">{user.totalInterviews}</div>
                  <div className="text-sm text-gray-600">Total Interviews</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-600">{user.stats?.completedInterviews || 0}</div>
                  <div className="text-sm text-gray-600">Completed</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-purple-600">{user.averageScore}%</div>
                  <div className="text-sm text-gray-600">Average Score</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Preferences */}
        {user.preferences && (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Preferences</h3>
            <dl className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <InfoItem
                icon={Mail}
                label="Email Notifications"
                value={user.preferences.emailNotifications ? 'Enabled' : 'Disabled'}
                valueClassName={user.preferences.emailNotifications ? 'text-green-600' : 'text-red-600'}
              />
              <InfoItem
                icon={Clock}
                label="Interview Reminders"
                value={user.preferences.interviewReminders ? 'Enabled' : 'Disabled'}
                valueClassName={user.preferences.interviewReminders ? 'text-green-600' : 'text-red-600'}
              />
              <InfoItem
                icon={User}
                label="Profile Visibility"
                value={user.preferences.profileVisibility}
              />
            </dl>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end space-x-3 pt-6 border-t">
          <Button variant="outline">
            <Mail size={16} className="mr-2" />
            Send Email
          </Button>
          <Button variant="outline">
            <FileText size={16} className="mr-2" />
            View Interviews
          </Button>
          <Button onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
};

export default UserCard;