// backend/src/models/User.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  // Basic Information
  firstName: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50
  },
  lastName: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  
  // Role and Permissions
  role: {
    type: String,
    enum: ['admin', 'interviewer', 'candidate'],
    default: 'candidate'
  },
  permissions: [{
    type: String,
    enum: [
      'users.read', 'users.write', 'users.delete',
      'interviews.read', 'interviews.write', 'interviews.delete',
      'questions.read', 'questions.write', 'questions.delete',
      'results.read', 'results.write', 'results.delete',
      'settings.read', 'settings.write',
      'system.admin'
    ]
  }],
  
  // Contact Information
  phone: {
    type: String,
    trim: true,
    match: [/^[\+]?[1-9][\d]{0,15}$/, 'Please enter a valid phone number']
  },
  location: {
    type: String,
    trim: true,
    maxlength: 100
  },
  dateOfBirth: {
    type: Date
  },
  
  // Professional Information
  jobTitle: {
    type: String,
    trim: true,
    maxlength: 100
  },
  experience: {
    type: Number,
    min: 0,
    max: 50,
    default: 0
  },
  skills: [{
    type: String,
    trim: true,
    maxlength: 50
  }],
  education: {
    type: String,
    trim: true,
    maxlength: 1000
  },
  about: {
    type: String,
    trim: true,
    maxlength: 2000
  },
  
  // File Information
  profileImage: {
    type: String,
    default: null
  },
  resumeUrl: {
    type: String,
    default: null
  },
  resumeFileName: {
    type: String,
    default: null
  },
  
  // Account Status
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'suspended', 'banned'],
    default: 'active'
  },
  
  // Security
  emailVerificationToken: {
    type: String,
    default: null
  },
  emailVerificationExpires: {
    type: Date,
    default: null
  },
  passwordResetToken: {
    type: String,
    default: null
  },
  passwordResetExpires: {
    type: Date,
    default: null
  },
  lastLogin: {
    type: Date,
    default: null
  },
  loginAttempts: {
    type: Number,
    default: 0
  },
  lockUntil: {
    type: Date,
    default: null
  },
  
  // Two-Factor Authentication
  twoFactorSecret: {
    type: String,
    default: null
  },
  twoFactorEnabled: {
    type: Boolean,
    default: false
  },
  backupCodes: [{
    code: String,
    used: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now }
  }],
  
  // Interview Related
  interviews: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Interview'
  }],
  
  // Preferences
  preferences: {
    emailNotifications: {
      type: Boolean,
      default: true
    },
    interviewReminders: {
      type: Boolean,
      default: true
    },
    profileVisibility: {
      type: String,
      enum: ['public', 'private', 'connections'],
      default: 'public'
    },
    theme: {
      type: String,
      enum: ['light', 'dark', 'system'],
      default: 'system'
    },
    language: {
      type: String,
      default: 'en'
    },
    timezone: {
      type: String,
      default: 'UTC'
    }
  },
  
  // Statistics
  totalInterviews: {
    type: Number,
    default: 0
  },
  completedInterviews: {
    type: Number,
    default: 0
  },
  averageScore: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  highestScore: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  
  // Admin specific fields
  adminNotes: {
    type: String,
    maxlength: 2000
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  lastModifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  // Audit trail
  loginHistory: [{
    timestamp: { type: Date, default: Date.now },
    ip: String,
    userAgent: String,
    success: { type: Boolean, default: true }
  }],
  
  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true, transform: function(doc, ret) {
    delete ret.password;
    delete ret.twoFactorSecret;
    delete ret.passwordResetToken;
    delete ret.emailVerificationToken;
    delete ret.backupCodes;
    return ret;
  }},
  toObject: { virtuals: true }
});

// Virtual for full name
userSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

// Virtual for account lock status
userSchema.virtual('isLocked').get(function() {
  return !!(this.lockUntil && this.lockUntil > Date.now());
});

// Virtual for admin status
userSchema.virtual('isAdmin').get(function() {
  return this.role === 'admin';
});

// Virtual for active status based on multiple factors
userSchema.virtual('isActiveUser').get(function() {
  return this.isActive && this.status === 'active' && !this.isLocked;
});

// Index for search functionality
userSchema.index({ 
  firstName: 'text', 
  lastName: 'text', 
  email: 'text',
  jobTitle: 'text', 
  skills: 'text' 
});

userSchema.index({ email: 1 });
userSchema.index({ role: 1 });
userSchema.index({ status: 1 });
userSchema.index({ skills: 1 });
userSchema.index({ jobTitle: 1 });
userSchema.index({ location: 1 });
userSchema.index({ createdAt: -1 });
userSchema.index({ lastLogin: -1 });

// Pre-save middleware to hash password
userSchema.pre('save', async function(next) {
  // Only hash password if it's modified
  if (!this.isModified('password')) return next();
  
  try {
    // Hash password with cost of 12
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Pre-save middleware to update timestamps and permissions
userSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  
  // Auto-assign permissions based on role
  if (this.isModified('role')) {
    switch (this.role) {
      case 'admin':
        this.permissions = [
          'users.read', 'users.write', 'users.delete',
          'interviews.read', 'interviews.write', 'interviews.delete',
          'questions.read', 'questions.write', 'questions.delete',
          'results.read', 'results.write', 'results.delete',
          'settings.read', 'settings.write',
          'system.admin'
        ];
        break;
      case 'interviewer':
        this.permissions = [
          'users.read',
          'interviews.read', 'interviews.write',
          'questions.read', 'questions.write',
          'results.read', 'results.write'
        ];
        break;
      case 'candidate':
        this.permissions = [
          'interviews.read',
          'results.read'
        ];
        break;
    }
  }
  
  next();
});

// Instance method to check password
userSchema.methods.comparePassword = async function(candidatePassword) {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw error;
  }
};

// Instance method to check permissions
userSchema.methods.hasPermission = function(permission) {
  return this.permissions.includes(permission) || this.role === 'admin';
};

// Instance method to increment login attempts
userSchema.methods.incLoginAttempts = function() {
  // Reset attempts if lock has expired
  if (this.lockUntil && this.lockUntil < Date.now()) {
    return this.updateOne({
      $unset: {
        loginAttempts: 1,
        lockUntil: 1
      }
    });
  }
  
  const updates = { $inc: { loginAttempts: 1 } };
  
  // Lock account after 5 failed attempts for 2 hours
  if (this.loginAttempts + 1 >= 5 && !this.isLocked) {
    updates.$set = {
      lockUntil: Date.now() + 2 * 60 * 60 * 1000 // 2 hours
    };
  }
  
  return this.updateOne(updates);
};

// Instance method to reset login attempts
userSchema.methods.resetLoginAttempts = function() {
  return this.updateOne({
    $unset: {
      loginAttempts: 1,
      lockUntil: 1
    },
    $set: {
      lastLogin: new Date()
    }
  });
};

// Instance method to record login
userSchema.methods.recordLogin = function(ip, userAgent, success = true) {
  const loginRecord = {
    timestamp: new Date(),
    ip,
    userAgent,
    success
  };
  
  // Keep only last 50 login records
  if (this.loginHistory.length >= 50) {
    this.loginHistory = this.loginHistory.slice(-49);
  }
  
  this.loginHistory.push(loginRecord);
  
  if (success) {
    this.lastLogin = new Date();
  }
  
  return this.save();
};

// Static method to find by credentials
userSchema.statics.findByCredentials = async function(email, password) {
  const user = await this.findOne({ email });
  
  if (!user) {
    throw new Error('Invalid login credentials');
  }
  
  if (user.isLocked) {
    throw new Error('Account is temporarily locked. Please try again later.');
  }
  
  if (!user.isActive || user.status !== 'active') {
    throw new Error('Account is deactivated. Please contact support.');
  }
  
  const isMatch = await user.comparePassword(password);
  
  if (!isMatch) {
    await user.incLoginAttempts();
    throw new Error('Invalid login credentials');
  }
  
  // Reset login attempts on successful login
  if (user.loginAttempts > 0) {
    await user.resetLoginAttempts();
  }
  
  return user;
};

// Static method to search users with advanced filters
userSchema.statics.searchUsers = async function(query, options = {}) {
  const {
    page = 1,
    limit = 10,
    sortBy = 'updatedAt',
    sortOrder = -1,
    filters = {},
    role = null,
    status = null
  } = options;
  
  let searchCriteria = {};
  
  if (query) {
    const searchRegex = new RegExp(query, 'i');
    searchCriteria.$or = [
      { firstName: searchRegex },
      { lastName: searchRegex },
      { email: searchRegex },
      { jobTitle: searchRegex },
      { skills: { $in: [searchRegex] } }
    ];
  }
  
  if (role) {
    searchCriteria.role = role;
  }
  
  if (status) {
    searchCriteria.status = status;
  }
  
  // Apply additional filters
  Object.assign(searchCriteria, filters);
  
  const users = await this.find(searchCriteria)
    .select('-password -twoFactorSecret -passwordResetToken -emailVerificationToken')
    .limit(limit * 1)
    .skip((page - 1) * limit)
    .sort({ [sortBy]: sortOrder });
  
  const total = await this.countDocuments(searchCriteria);
  
  return {
    users,
    totalPages: Math.ceil(total / limit),
    currentPage: page,
    totalUsers: total
  };
};

// Static method to get user statistics
userSchema.statics.getUserStats = async function(userId) {
  const user = await this.findById(userId)
    .populate('interviews', 'score completedAt status')
    .select('totalInterviews averageScore interviews highestScore');
    
  if (!user) {
    throw new Error('User not found');
  }
  
  const completedInterviews = user.interviews.filter(
    interview => interview.status === 'completed'
  );
  
  const totalScore = completedInterviews.reduce(
    (sum, interview) => sum + (interview.score || 0), 0
  );
  
  const averageScore = completedInterviews.length > 0 
    ? totalScore / completedInterviews.length 
    : 0;
    
  const highestScore = completedInterviews.length > 0
    ? Math.max(...completedInterviews.map(i => i.score || 0))
    : 0;
  
  return {
    totalInterviews: user.totalInterviews,
    completedInterviews: completedInterviews.length,
    averageScore: Math.round(averageScore * 100) / 100,
    highestScore,
    lastInterviewDate: completedInterviews.length > 0 
      ? completedInterviews[completedInterviews.length - 1].completedAt 
      : null
  };
};

// Static method to get admin statistics
userSchema.statics.getAdminStats = async function() {
  const totalUsers = await this.countDocuments();
  const activeUsers = await this.countDocuments({ status: 'active', isActive: true });
  const adminUsers = await this.countDocuments({ role: 'admin' });
  const candidateUsers = await this.countDocuments({ role: 'candidate' });
  const interviewerUsers = await this.countDocuments({ role: 'interviewer' });
  
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const newThisMonth = await this.countDocuments({ createdAt: { $gte: thirtyDaysAgo } });
  
  return {
    totalUsers,
    activeUsers,
    adminUsers,
    candidateUsers,
    interviewerUsers,
    newThisMonth,
    inactiveUsers: totalUsers - activeUsers
  };
};

// Static method to create admin user
userSchema.statics.createAdmin = async function(userData) {
  const adminData = {
    ...userData,
    role: 'admin',
    isEmailVerified: true,
    status: 'active'
  };
  
  const admin = new this(adminData);
  await admin.save();
  
  return admin;
};

module.exports = mongoose.model('User', userSchema);