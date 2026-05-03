const jwt = require('jsonwebtoken');

// Function to check if a token is valid
function checkToken(token) {
  try {
    console.log('Token to check:', token);
    console.log('Token length:', token.length);
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret-key');
    console.log('Token is valid:', decoded);
    return true;
  } catch (error) {
    console.log('Token is invalid:', error.message);
    return false;
  }
}

// Check if a token was provided as argument
if (process.argv.length > 2) {
  const token = process.argv[2];
  checkToken(token);
} else {
  console.log('Please provide a token as an argument: node debugToken.js YOUR_TOKEN_HERE');
}