const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    let mongoURI = process.env.MONGO_URI ;
    
    // If using MongoDB Atlas, add certificate bypass for development
    if (mongoURI.includes('mongodb.net') && process.env.NODE_ENV !== 'production') {
      const separator = mongoURI.includes('?') ? '&' : '?';
      if (!mongoURI.includes('tlsAllowInvalidCertificates')) {
        mongoURI += `${separator}tlsAllowInvalidCertificates=true`;
      }
      if (!mongoURI.includes('tlsAllowInvalidHostnames')) {
        mongoURI += `&tlsAllowInvalidHostnames=true`;
      }
    }
    
    const options = {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    };
    
    await mongoose.connect(mongoURI, options);
    
    console.log('✅ MongoDB Connected Successfully');
    console.log(`📊 Database: ${mongoose.connection.name}`);
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    // Don't exit immediately for better debugging
    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    }
  }
};

module.exports = connectDB;