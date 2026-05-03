const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const upload = require('../middleware/upload');
const {
  getProfile,
  updateProfile,
  getAllUsers
} = require('../controllers/userController');
const User = require('../models/User'); // Add this import

// Get user profile
router.get('/profile', auth, getProfile);

// Update user profile
router.put('/profile', auth, upload.single('profilePhoto'), updateProfile);

// Get all users (admin only)
router.get('/', auth, getAllUsers);

// Update admin department (admin only)
router.put('/admin/:id/department', auth, async (req, res) => {
  try {
    // Check if current user is admin
    if (req.user.userType !== 'admin') {
      return res.status(403).json({ error: 'Access denied. Admin only.' });
    }
    
    const { id } = req.params;
    const { department } = req.body;
    
    // Check if user exists and is an admin
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    if (user.userType !== 'admin') {
      return res.status(400).json({ error: 'Can only assign departments to admin users' });
    }
    
    // Update the department
    const updatedUser = await User.findByIdAndUpdate(
      id,
      { department },
      { new: true, runValidators: true }
    );
    
    res.json({ message: 'Department updated successfully', user: updatedUser });
  } catch (error) {
    console.error('Error updating department:', error);
    res.status(500).json({ error: 'Failed to update department' });
  }
});

module.exports = router;