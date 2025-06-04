// backend/src/middleware/adminAuth.js
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Middleware to require admin role
const requireAdmin = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ 
        success: false,
        message: 'Access denied. No token provided.' 
      });
    }

    // In development, we'll use a simple check
    // In production, properly verify JWT and check user role
    if (process.env.NODE_ENV === 'development') {
      // Mock admin check for development
      const mockAdmin = {
        _id: '2',
        firstName: 'Admin',
        lastName: 'User',
        email: 'admin@interviewx.com',
        role: 'admin',
        isActive: true
      };
      
      req.user = mockAdmin;
      return next();
    }

    // Production JWT verification
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user) {
      return res.status(401).json({ 
        success: false,
        message: 'Invalid token. User not found.' 
      });
    }

    if (!user.isActive) {
      return res.status(401).json({ 
        success: false,
        message: 'Account is deactivated.' 
      });
    }

    if (user.role !== 'admin') {
      return res.status(403).json({ 
        success: false,
        message: 'Access denied. Admin role required.' 
      });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Admin auth error:', error);
    return res.status(401).json({ 
      success: false,
      message: 'Invalid token.' 
    });
  }
};

// Middleware to check specific admin permissions
const requirePermission = (permission) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({ 
          success: false,
          message: 'Authentication required.' 
        });
      }

      // Admins have all permissions
      if (req.user.role === 'admin') {
        return next();
      }

      // Check if user has specific permission
      if (!req.user.permissions?.includes(permission)) {
        return res.status(403).json({ 
          success: false,
          message: `Permission '${permission}' required.` 
        });
      }

      next();
    } catch (error) {
      console.error('Permission check error:', error);
      return res.status(500).json({ 
        success: false,
        message: 'Server error during permission check.' 
      });
    }
  };
};

// Middleware to log admin actions
const logAdminAction = (action) => {
  return (req, res, next) => {
    // Log the admin action
    console.log(`[ADMIN ACTION] ${action} by user ${req.user?.email} at ${new Date().toISOString()}`);
    
    // Store in audit log (implement as needed)
    // AuditLog.create({
    //   userId: req.user._id,
    //   action,
    //   ip: req.ip,
    //   userAgent: req.get('User-Agent'),
    //   timestamp: new Date()
    // });
    
    next();
  };
};

// Rate limiting for admin actions
const adminRateLimit = {
  maxRequests: 100,
  windowMs: 15 * 60 * 1000, // 15 minutes
  requests: new Map()
};

const limitAdminRequests = (req, res, next) => {
  const userId = req.user?._id?.toString();
  if (!userId) return next();
  
  const now = Date.now();
  const windowStart = now - adminRateLimit.windowMs;
  
  if (!adminRateLimit.requests.has(userId)) {
    adminRateLimit.requests.set(userId, []);
  }
  
  const userRequests = adminRateLimit.requests.get(userId);
  const recentRequests = userRequests.filter(time => time > windowStart);
  
  if (recentRequests.length >= adminRateLimit.maxRequests) {
    return res.status(429).json({
      success: false,
      message: 'Too many admin requests. Please try again later.'
    });
  }
  
  recentRequests.push(now);
  adminRateLimit.requests.set(userId, recentRequests);
  
  next();
};

module.exports = {
  requireAdmin,
  requirePermission,
  logAdminAction,
  limitAdminRequests
};