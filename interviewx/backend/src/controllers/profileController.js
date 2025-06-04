// backend/src/controllers/profileController.js
const User = require('../models/User');
const path = require('path');
const fs = require('fs').promises;

const profileController = {
  // Get user profile
  getProfile: async (req, res) => {
    try {
      const user = await User.findById(req.user.id).select('-password');
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      res.json({ user });
    } catch (error) {
      console.error('Get profile error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  },

  // Update user profile
  updateProfile: async (req, res) => {
    try {
      const {
        firstName,
        lastName,
        phone,
        location,
        dateOfBirth,
        jobTitle,
        experience,
        skills,
        education,
        about,
        profileImage,
        resumeUrl
      } = req.body;

      // Validate required fields
      if (!firstName || !lastName) {
        return res.status(400).json({ message: 'First name and last name are required' });
      }

      // Find user and update
      const user = await User.findById(req.user.id);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      // Update user fields
      user.firstName = firstName;
      user.lastName = lastName;
      user.phone = phone || user.phone;
      user.location = location || user.location;
      user.dateOfBirth = dateOfBirth || user.dateOfBirth;
      user.jobTitle = jobTitle || user.jobTitle;
      user.experience = experience || user.experience;
      user.skills = Array.isArray(skills) ? skills : user.skills;
      user.education = education || user.education;
      user.about = about || user.about;
      
      // Update file URLs if provided
      if (profileImage) user.profileImage = profileImage;
      if (resumeUrl) user.resumeUrl = resumeUrl;

      user.updatedAt = new Date();

      await user.save();

      // Return user without password
      const updatedUser = await User.findById(user._id).select('-password');
      
      res.json({
        message: 'Profile updated successfully',
        user: updatedUser
      });
    } catch (error) {
      console.error('Update profile error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  },

  // Upload profile image
  uploadProfileImage: async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'No image file provided' });
      }

      const user = await User.findById(req.user.id);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      // Delete old profile image if exists
      if (user.profileImage) {
        const oldImagePath = path.join(__dirname, '../../uploads/profiles', path.basename(user.profileImage));
        try {
          await fs.unlink(oldImagePath);
        } catch (error) {
          console.log('Old image not found or already deleted');
        }
      }

      // Save new image URL
      const imageUrl = `/uploads/profiles/${req.file.filename}`;
      user.profileImage = imageUrl;
      user.updatedAt = new Date();
      
      await user.save();

      res.json({
        message: 'Profile image uploaded successfully',
        profileImageUrl: imageUrl
      });
    } catch (error) {
      console.error('Upload profile image error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  },

  // Upload resume
  uploadResume: async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'No resume file provided' });
      }

      const user = await User.findById(req.user.id);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      // Delete old resume if exists
      if (user.resumeUrl) {
        const oldResumePath = path.join(__dirname, '../../uploads/resumes', path.basename(user.resumeUrl));
        try {
          await fs.unlink(oldResumePath);
        } catch (error) {
          console.log('Old resume not found or already deleted');
        }
      }

      // Save new resume URL
      const resumeUrl = `/uploads/resumes/${req.file.filename}`;
      user.resumeUrl = resumeUrl;
      user.resumeFileName = req.file.originalname;
      user.updatedAt = new Date();
      
      await user.save();

      res.json({
        message: 'Resume uploaded successfully',
        resumeUrl: resumeUrl,
        resumeFileName: req.file.originalname
      });
    } catch (error) {
      console.error('Upload resume error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  },

  // Delete profile image
  deleteProfileImage: async (req, res) => {
    try {
      const user = await User.findById(req.user.id);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      if (user.profileImage) {
        // Delete image file
        const imagePath = path.join(__dirname, '../../uploads/profiles', path.basename(user.profileImage));
        try {
          await fs.unlink(imagePath);
        } catch (error) {
          console.log('Image file not found or already deleted');
        }

        // Remove from database
        user.profileImage = null;
        user.updatedAt = new Date();
        await user.save();
      }

      res.json({ message: 'Profile image deleted successfully' });
    } catch (error) {
      console.error('Delete profile image error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  },

  // Delete resume
  deleteResume: async (req, res) => {
    try {
      const user = await User.findById(req.user.id);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      if (user.resumeUrl) {
        // Delete resume file
        const resumePath = path.join(__dirname, '../../uploads/resumes', path.basename(user.resumeUrl));
        try {
          await fs.unlink(resumePath);
        } catch (error) {
          console.log('Resume file not found or already deleted');
        }

        // Remove from database
        user.resumeUrl = null;
        user.resumeFileName = null;
        user.updatedAt = new Date();
        await user.save();
      }

      res.json({ message: 'Resume deleted successfully' });
    } catch (error) {
      console.error('Delete resume error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  },

  // Get user's public profile (for sharing)
  getPublicProfile: async (req, res) => {
    try {
      const { userId } = req.params;
      
      const user = await User.findById(userId).select(
        'firstName lastName profileImage jobTitle location skills education about experience'
      );
      
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      res.json({ user });
    } catch (error) {
      console.error('Get public profile error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  },

  // Search users by skills or job title
  searchUsers: async (req, res) => {
    try {
      const { query, page = 1, limit = 10 } = req.query;
      
      if (!query) {
        return res.status(400).json({ message: 'Search query is required' });
      }

      const searchRegex = new RegExp(query, 'i');
      
      const users = await User.find({
        $or: [
          { jobTitle: searchRegex },
          { skills: { $in: [searchRegex] } },
          { firstName: searchRegex },
          { lastName: searchRegex }
        ]
      })
      .select('firstName lastName profileImage jobTitle location skills')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ updatedAt: -1 });

      const total = await User.countDocuments({
        $or: [
          { jobTitle: searchRegex },
          { skills: { $in: [searchRegex] } },
          { firstName: searchRegex },
          { lastName: searchRegex }
        ]
      });

      res.json({
        users,
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalUsers: total
      });
    } catch (error) {
      console.error('Search users error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
};

module.exports = profileController;