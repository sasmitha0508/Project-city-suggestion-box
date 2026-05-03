const User = require('../models/User');
const path = require('path');
const fs = require('fs');

// Get user profile
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      id: user._id,
      name: user.name || user.username,
      username: user.username,
      email: user.email,
      phone: user.phone,
      location: user.location,
      userType: user.userType,
      department: user.department,
      profilePhoto: user.profilePhoto ? `/uploads/profiles/${path.basename(user.profilePhoto)}` : ''
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update user profile
exports.updateProfile = async (req, res) => {
  try {
    const { name, phone, location, department, userType } = req.body;
    
    const updateData = { 
      name, 
      phone, 
      location, 
      department, 
      userType 
    };
    
    // Handle file upload if exists
    if (req.file) {
      // Delete old profile photo if exists
      const user = await User.findById(req.user.id);
      if (user.profilePhoto && fs.existsSync(user.profilePhoto)) {
        fs.unlinkSync(user.profilePhoto);
      }
      
      updateData.profilePhoto = req.file.path;
    }
    
    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');
    
    res.json({
      message: 'Profile updated successfully',
      user: {
        id: updatedUser._id,
        name: updatedUser.name || updatedUser.username,
        username: updatedUser.username,
        email: updatedUser.email,
        phone: updatedUser.phone,
        location: updatedUser.location,
        userType: updatedUser.userType,
        department: updatedUser.department,
        profilePhoto: updatedUser.profilePhoto ? `/uploads/profiles/${path.basename(updatedUser.profilePhoto)}` : ''
      }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(val => val.message);
      return res.status(400).json({ message: errors.join(', ') });
    }
    
    res.status(500).json({ message: 'Server error' });
  }
};

// Get all users (for admin)
exports.getAllUsers = async (req, res) => {
  try {
    if (req.user.userType !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }
    
    const users = await User.find().select('-password');
    res.json(users);
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};