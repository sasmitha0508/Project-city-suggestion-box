const jwt = require('jsonwebtoken');
const User = require('../models/User');

const auth = async (req, res, next) => {
  try {
    // Get token from header
    let token = req.header('Authorization');
    
    if (!token) {
      return res.status(401).json({ message: 'No token, authorization denied' });
    }

    // Check if token starts with 'Bearer '
    if (token.startsWith('Bearer ')) {
      // Remove Bearer from string
      token = token.slice(7, token.length).trimLeft();
    }

    // Verify token
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret-key');
      
      // Get user from token
      const user = await User.findById(decoded.user.id);
      
      if (!user) {
        return res.status(401).json({ message: 'Token is not valid' });
      }

      req.user = {
        id: user._id,
        userType: user.userType
      };
      next();
    } catch (jwtError) {
      console.log('JWT verification failed:', jwtError.message);
      
      if (jwtError.name === 'JsonWebTokenError') {
        return res.status(401).json({ message: 'Invalid token format' });
      }
      
      if (jwtError.name === 'TokenExpiredError') {
        return res.status(401).json({ message: 'Token has expired' });
      }
      
      return res.status(401).json({ message: 'Token verification failed' });
    }
  } catch (error) {
    console.error('Auth middleware unexpected error:', error);
    res.status(500).json({ message: 'Server error during authentication' });
  }
};

module.exports = auth;