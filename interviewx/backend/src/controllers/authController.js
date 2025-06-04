import User from '../models/User.js';
import { logger } from '../utils/logger.js';

const sendTokenResponse = (user, statusCode, res, message = 'Success') => {
  const token = user.generateAuthToken();

  res.status(statusCode).json({
    success: true,
    message,
    token,
    user: user.toJSON()
  });
};

export const register = async (req, res) => {
  try {
    const { name, email, password, role, company } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: 'User already exists with this email'
      });
    }

    const userData = { name: name.trim(), email: email.toLowerCase().trim(), password, role: role || 'interviewer' };
    if (company) userData.company = company.trim();

    const user = await User.create(userData);
    logger.info(`New user registered: ${user.email}`);

    sendTokenResponse(user, 201, res, 'User registered successfully');
  } catch (error) {
    logger.error('Registration error:', error);
    res.status(500).json({ success: false, error: 'Server error during registration' });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findByCredentials(email, password);

    user.lastLogin = new Date();
    await user.save();

    logger.info(`User logged in: ${user.email}`);
    sendTokenResponse(user, 200, res, 'Login successful');
  } catch (error) {
    logger.error('Login error:', error);
    res.status(401).json({ success: false, error: error.message || 'Invalid login credentials' });
  }
};

export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }
    res.status(200).json({ success: true, user: user.toJSON() });
  } catch (error) {
    logger.error('Get me error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
};

export const updateMe = async (req, res) => {
  try {
    const { name, company, settings } = req.body;
    const updateData = {};
    if (name) updateData.name = name.trim();
    if (company) updateData.company = company.trim();
    if (settings) updateData.settings = { ...req.user.settings, ...settings };

    const user = await User.findByIdAndUpdate(req.user.id, updateData, { new: true, runValidators: true });
    logger.info(`User profile updated: ${user.email}`);

    res.status(200).json({ success: true, message: 'Profile updated successfully', user: user.toJSON() });
  } catch (error) {
    logger.error('Update profile error:', error);
    res.status(500).json({ success: false, error: 'Server error during profile update' });
  }
};

export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user.id).select('+password');

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ success: false, error: 'Current password is incorrect' });
    }

    user.password = newPassword;
    await user.save();

    logger.info(`Password changed for user: ${user.email}`);
    res.status(200).json({ success: true, message: 'Password changed successfully' });
  } catch (error) {
    logger.error('Change password error:', error);
    res.status(500).json({ success: false, error: 'Server error during password change' });
  }
};

export const logout = async (req, res) => {
  try {
    logger.info(`User logged out: ${req.user.email}`);
    res.status(200).json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    logger.error('Logout error:', error);
    res.status(500).json({ success: false, error: 'Server error during logout' });
  }
};