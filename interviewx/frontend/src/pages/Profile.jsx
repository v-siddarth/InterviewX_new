// frontend/src/pages/Profile.jsx
import React, { useState, useEffect } from 'react';
import { Camera, Upload, Edit2, Save, X, User, FileText, Mail, Phone, MapPin, Calendar, Briefcase } from 'lucide-react';
import { useUserStore } from '../store/userStore';
import { api, getImageUrl } from '../services/api';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import LoadingSpinner from '../components/ui/LoadingSpinner';

const Profile = () => {
  const { user, updateUser } = useUserStore();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [profileImage, setProfileImage] = useState(null);
  const [profileImagePreview, setProfileImagePreview] = useState('');
  const [resume, setResume] = useState(null);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    location: '',
    dateOfBirth: '',
    jobTitle: '',
    experience: '',
    skills: [],
    education: '',
    about: ''
  });

  const [errors, setErrors] = useState({});

  // Helper function to generate initials for fallback avatar
  const generateInitials = (firstName, lastName) => {
    if (!firstName && !lastName) return 'U';
    return `${(firstName || '').charAt(0)}${(lastName || '').charAt(0)}`.toUpperCase();
  };

  // Helper function to create fallback avatar
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

  // Get current profile image with fallback
  const getCurrentProfileImage = () => {
    if (profileImagePreview) {
      return profileImagePreview;
    }
    if (user?.profileImage) {
      return getImageUrl(user.profileImage);
    }
    if (user?.avatar) {
      return user.avatar;
    }
    return createFallbackAvatar(formData.firstName || user?.firstName, formData.lastName || user?.lastName);
  };

  useEffect(() => {
    if (user) {
      const userData = {
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        phone: user.phone || '',
        location: user.location || '',
        dateOfBirth: user.dateOfBirth || '',
        jobTitle: user.jobTitle || '',
        experience: user.experience || '',
        skills: user.skills || [],
        education: user.education || '',
        about: user.about || ''
      };
      setFormData(userData);
      
      // Set profile image preview
      if (user.profileImage) {
        setProfileImagePreview(getImageUrl(user.profileImage));
      } else if (user.avatar) {
        setProfileImagePreview(user.avatar);
      } else {
        setProfileImagePreview('');
      }
    }
  }, [user]);

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.firstName.trim()) newErrors.firstName = 'First name is required';
    if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required';
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = 'Invalid email format';
    if (formData.phone && !/^[\+]?[1-9][\d]{0,15}$/.test(formData.phone.replace(/\s/g, ''))) {
      newErrors.phone = 'Invalid phone number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleSkillsChange = (e) => {
    const skillsArray = e.target.value.split(',').map(skill => skill.trim()).filter(skill => skill);
    setFormData(prev => ({
      ...prev,
      skills: skillsArray
    }));
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        alert('Image size should be less than 5MB');
        return;
      }
      
      if (!file.type.startsWith('image/')) {
        alert('Please select a valid image file');
        return;
      }

      setProfileImage(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setProfileImagePreview(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleResumeUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        alert('Resume size should be less than 10MB');
        return;
      }
      
      const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      if (!allowedTypes.includes(file.type)) {
        alert('Please select a PDF or DOC file');
        return;
      }

      setResume(file);
    }
  };

  const uploadFiles = async () => {
    const results = [];
    
    if (profileImage) {
      try {
        const imageFormData = new FormData();
        imageFormData.append('profileImage', profileImage);
        const imageResult = await api.uploadProfileImage(imageFormData);
        results.push(imageResult);
      } catch (error) {
        console.error('Image upload error:', error);
        throw new Error('Failed to upload profile image');
      }
    }
    
    if (resume) {
      try {
        const resumeFormData = new FormData();
        resumeFormData.append('resume', resume);
        const resumeResult = await api.uploadResume(resumeFormData);
        results.push(resumeResult);
      } catch (error) {
        console.error('Resume upload error:', error);
        throw new Error('Failed to upload resume');
      }
    }
    
    return results;
  };

  const handleSave = async () => {
    if (!validateForm()) return;
    
    setLoading(true);
    try {
      // Upload files first
      const uploadResults = await uploadFiles();
      
      // Update profile data
      const updatedData = { ...formData };
      
      // Add file URLs from upload results
      uploadResults.forEach(result => {
        if (result.profileImageUrl) {
          updatedData.profileImage = result.profileImageUrl;
        }
        if (result.resumeUrl) {
          updatedData.resumeUrl = result.resumeUrl;
          updatedData.resumeFileName = result.resumeFileName;
        }
      });
      
      // Update profile via API
      const response = await api.updateProfile(updatedData);
      
      // Update user store with complete user data
      const updatedUser = {
        ...user,
        ...response.user,
        // Ensure profile image is properly set
        profileImage: updatedData.profileImage || user.profileImage,
        avatar: updatedData.profileImage || user.avatar
      };
      
      updateUser(updatedUser);
      
      // Update local state
      setFormData({
        firstName: updatedUser.firstName || '',
        lastName: updatedUser.lastName || '',
        email: updatedUser.email || '',
        phone: updatedUser.phone || '',
        location: updatedUser.location || '',
        dateOfBirth: updatedUser.dateOfBirth || '',
        jobTitle: updatedUser.jobTitle || '',
        experience: updatedUser.experience || '',
        skills: updatedUser.skills || [],
        education: updatedUser.education || '',
        about: updatedUser.about || ''
      });
      
      // Update profile image preview
      if (updatedUser.profileImage) {
        setProfileImagePreview(getImageUrl(updatedUser.profileImage));
      } else if (updatedUser.avatar) {
        setProfileImagePreview(updatedUser.avatar);
      }
      
      setIsEditing(false);
      setProfileImage(null);
      setResume(null);
      
      // Show success message
      alert('Profile updated successfully!');
    } catch (error) {
      console.error('Profile update error:', error);
      alert(error.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    // Reset form data to original user data
    if (user) {
      setFormData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        phone: user.phone || '',
        location: user.location || '',
        dateOfBirth: user.dateOfBirth || '',
        jobTitle: user.jobTitle || '',
        experience: user.experience || '',
        skills: user.skills || [],
        education: user.education || '',
        about: user.about || ''
      });
      
      // Reset profile image preview
      if (user.profileImage) {
        setProfileImagePreview(getImageUrl(user.profileImage));
      } else if (user.avatar) {
        setProfileImagePreview(user.avatar);
      } else {
        setProfileImagePreview('');
      }
    }
    
    setProfileImage(null);
    setResume(null);
    setErrors({});
    setIsEditing(false);
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
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold text-gray-900">Profile</h1>
            {!isEditing ? (
              <Button
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-2"
              >
                <Edit2 size={16} />
                Edit Profile
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button
                  onClick={handleSave}
                  className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
                  disabled={loading}
                >
                  <Save size={16} />
                  Save Changes
                </Button>
                <Button
                  onClick={handleCancel}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <X size={16} />
                  Cancel
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Profile Image Section */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Profile Picture</h2>
          <div className="flex items-center gap-6">
            <div className="relative">
              <div className="w-32 h-32 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center">
                {getCurrentProfileImage() ? (
                  <img
                    src={getCurrentProfileImage()}
                    alt="Profile"
                    className="w-full h-full object-cover cursor-pointer"
                    onClick={() => setIsImageModalOpen(true)}
                    onError={(e) => {
                      // Fallback if image fails to load
                      e.target.src = createFallbackAvatar(formData.firstName, formData.lastName);
                    }}
                  />
                ) : (
                  <User size={48} className="text-gray-400" />
                )}
              </div>
              {isEditing && (
                <label className="absolute bottom-0 right-0 bg-blue-600 text-white p-2 rounded-full cursor-pointer hover:bg-blue-700">
                  <Camera size={16} />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </label>
              )}
            </div>
            <div>
              <h3 className="text-lg font-medium text-gray-900">
                {formData.firstName} {formData.lastName}
              </h3>
              <p className="text-gray-500">{formData.jobTitle || 'Job Title'}</p>
              {isEditing && (
                <p className="text-sm text-gray-400 mt-2">
                  Click the camera icon to upload a new photo (max 5MB)
                </p>
              )}
              {profileImage && (
                <p className="text-sm text-green-600 mt-1">
                  New image selected: {profileImage.name}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Personal Information */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Personal Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                First Name *
              </label>
              {isEditing ? (
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.firstName ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
              ) : (
                <p className="text-gray-900">{formData.firstName || 'Not provided'}</p>
              )}
              {errors.firstName && <p className="text-red-500 text-sm mt-1">{errors.firstName}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Last Name *
              </label>
              {isEditing ? (
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.lastName ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
              ) : (
                <p className="text-gray-900">{formData.lastName || 'Not provided'}</p>
              )}
              {errors.lastName && <p className="text-red-500 text-sm mt-1">{errors.lastName}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Mail className="inline w-4 h-4 mr-1" />
                Email *
              </label>
              {isEditing ? (
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.email ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
              ) : (
                <p className="text-gray-900">{formData.email || 'Not provided'}</p>
              )}
              {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Phone className="inline w-4 h-4 mr-1" />
                Phone
              </label>
              {isEditing ? (
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.phone ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
              ) : (
                <p className="text-gray-900">{formData.phone || 'Not provided'}</p>
              )}
              {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <MapPin className="inline w-4 h-4 mr-1" />
                Location
              </label>
              {isEditing ? (
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              ) : (
                <p className="text-gray-900">{formData.location || 'Not provided'}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar className="inline w-4 h-4 mr-1" />
                Date of Birth
              </label>
              {isEditing ? (
                <input
                  type="date"
                  name="dateOfBirth"
                  value={formData.dateOfBirth}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              ) : (
                <p className="text-gray-900">
                  {formData.dateOfBirth ? new Date(formData.dateOfBirth).toLocaleDateString() : 'Not provided'}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Professional Information */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Professional Information</h2>
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Briefcase className="inline w-4 h-4 mr-1" />
                Job Title
              </label>
              {isEditing ? (
                <input
                  type="text"
                  name="jobTitle"
                  value={formData.jobTitle}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              ) : (
                <p className="text-gray-900">{formData.jobTitle || 'Not provided'}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Experience (years)
              </label>
              {isEditing ? (
                <input
                  type="number"
                  name="experience"
                  value={formData.experience}
                  onChange={handleInputChange}
                  min="0"
                  max="50"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              ) : (
                <p className="text-gray-900">{formData.experience || 'Not provided'} years</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Skills (comma-separated)
              </label>
              {isEditing ? (
                <textarea
                  name="skills"
                  value={formData.skills.join(', ')}
                  onChange={handleSkillsChange}
                  rows="3"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., JavaScript, React, Node.js"
                />
              ) : (
                <div className="flex flex-wrap gap-2">
                  {formData.skills.length > 0 ? (
                    formData.skills.map((skill, index) => (
                      <span
                        key={index}
                        className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm"
                      >
                        {skill}
                      </span>
                    ))
                  ) : (
                    <p className="text-gray-900">No skills added</p>
                  )}
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Education
              </label>
              {isEditing ? (
                <textarea
                  name="education"
                  value={formData.education}
                  onChange={handleInputChange}
                  rows="3"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Your educational background"
                />
              ) : (
                <p className="text-gray-900">{formData.education || 'Not provided'}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                About Me
              </label>
              {isEditing ? (
                <textarea
                  name="about"
                  value={formData.about}
                  onChange={handleInputChange}
                  rows="4"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Tell us about yourself"
                />
              ) : (
                <p className="text-gray-900">{formData.about || 'Not provided'}</p>
              )}
            </div>
          </div>
        </div>

        {/* Resume Section */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Resume</h2>
          <div className="space-y-4">
            {user?.resumeUrl && (
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-md">
                <FileText className="text-blue-600" size={20} />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">Current Resume</p>
                  <a
                    href={user.resumeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 text-sm"
                  >
                    View Resume
                  </a>
                </div>
              </div>
            )}
            
            {isEditing && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Upload New Resume
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-md p-6 text-center">
                  <Upload className="mx-auto h-12 w-12 text-gray-400" />
                  <div className="mt-4">
                    <label className="cursor-pointer">
                      <span className="mt-2 block text-sm font-medium text-gray-900">
                        Choose file or drag and drop
                      </span>
                      <span className="block text-xs text-gray-500">
                        PDF, DOC, DOCX up to 10MB
                      </span>
                      <input
                        type="file"
                        accept=".pdf,.doc,.docx"
                        onChange={handleResumeUpload}
                        className="hidden"
                      />
                    </label>
                  </div>
                  {resume && (
                    <p className="mt-2 text-sm text-green-600">
                      Selected: {resume.name}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Image Preview Modal */}
        <Modal isOpen={isImageModalOpen} onClose={() => setIsImageModalOpen(false)}>
          <div className="text-center">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Profile Picture</h3>
            {getCurrentProfileImage() && (
              <img
                src={getCurrentProfileImage()}
                alt="Profile"
                className="max-w-full max-h-96 mx-auto rounded-lg"
              />
            )}
          </div>
        </Modal>
      </div>
    </div>
  );
};

export default Profile;