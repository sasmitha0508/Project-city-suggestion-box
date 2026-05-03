const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

/**
 * @desc    Register a new user
 * @route   POST /api/auth/signup
 * @access  Public
 */
const signup = async (req, res) => {
  try {
    let { username, email, password, userType, department } = req.body;

    // Basic validation
    if (!username || !email || !password || !userType) {
      return res.status(400).json({ msg: 'All required fields must be provided' });
    }

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ email }, { username }]
    });

    if (existingUser) {
      return res.status(400).json({ msg: 'User already exists' });
    }

    // ✅ IMPORTANT FIX:
    // department is REQUIRED for admin users (as per schema)
    if (userType === 'admin') {
      department = department || 'General Administration';
    }

    // Create new user
    const user = new User({
      username,
      email,
      password,
      userType,
      department
    });

    // Save user (password hashing handled in schema)
    await user.save();

    // JWT payload
    const payload = {
      user: {
        id: user._id,
        role: user.userType
      }
    };

    // Sign token
    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: '7d' },
      (err, token) => {
        if (err) {
          console.error('JWT Error:', err);
          return res.status(500).json({ msg: 'Token generation failed' });
        }

        res.status(201).json({
          token,
          user: {
            id: user._id,
            username: user.username,
            email: user.email,
            userType: user.userType,
            department: user.department || null
          }
        });
      }
    );
  } catch (error) {
    console.error('Signup Error:', error);
    res.status(500).json({ msg: 'Server error during signup' });
  }
};

/**
 * @desc    Login user
 * @route   POST /api/auth/login
 * @access  Public
 */
const login = async (req, res) => {
  try {
    const { loginInput, password, userType } = req.body;

    // Validate input
    if (!loginInput || !password || !userType) {
      return res.status(400).json({ msg: 'Login input, password, and user type are required' });
    }

    // Determine if loginInput is email or username
    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(loginInput);

    let user;
    if (isEmail) {
      user = await User.findOne({ email: loginInput });
    } else {
      user = await User.findOne({ username: loginInput });
    }

    if (!user) {
      return res.status(400).json({ msg: 'Invalid credentials' });
    }

    // Validate user type
    if (user.userType !== userType) {
      return res.status(400).json({ msg: 'Invalid user type' });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ msg: 'Invalid credentials' });
    }

    // JWT payload
    const payload = {
      user: {
        id: user._id,
        role: user.userType
      }
    };

    // Sign token
    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: '7d' },
      (err, token) => {
        if (err) {
          console.error('JWT Error:', err);
          return res.status(500).json({ msg: 'Token generation failed' });
        }

        res.json({
          token,
          user: {
            id: user._id,
            username: user.username,
            email: user.email,
            userType: user.userType,
            department: user.department || null
          }
        });
      }
    );
  } catch (error) {
    console.error('Login Error:', error);
    res.status(500).json({ msg: 'Server error during login' });
  }
};

module.exports = {
  signup,
  login
};
