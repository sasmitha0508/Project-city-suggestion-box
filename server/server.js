require('dotenv').config();
const express = require('express');
const connectDB = require('./config/db');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const multer = require('multer');

// Initialize Express app
const app = express();

// Connect to Database
connectDB();

// ========== EMAIL & SMS SETUP ==========
// Initialize SendGrid
let sendGridClient = null;
let twilioClient = null;

try {
  if (process.env.SENDGRID_API_KEY) {
    const sgMail = require('@sendgrid/mail');
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    sendGridClient = sgMail;
    console.log('SendGrid client initialized successfully');
    console.log('SendGrid configured: true');
  } else {
    console.log('SendGrid API key not found. Email notifications will be disabled.');
    console.log('SendGrid configured: false');
  }
} catch (error) {
  console.log('Error initializing SendGrid:', error.message);
  console.log('SendGrid configured: false');
}

try {
  if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
    const twilio = require('twilio');
    twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
    console.log('Twilio client initialized successfully');
    console.log('Twilio configured: true');
  } else {
    console.log('Twilio credentials not found. SMS notifications will be disabled.');
    console.log('Twilio configured: false');
  }
} catch (error) {
  console.log('Error initializing Twilio:', error.message);
  console.log('Twilio configured: false');
}

// Make them available to routes
app.set('sendGridClient', sendGridClient);
app.set('twilioClient', twilioClient);
app.set('emailFrom', process.env.EMAIL_FROM || 'noreply@citysuggestion.com');
app.set('emailFromName', process.env.EMAIL_FROM_NAME || 'City Suggestion System');
app.set('twilioPhoneNumber', process.env.TWILIO_PHONE_NUMBER);
app.set('frontendUrl', process.env.FRONTEND_URL || 'http://localhost:3000');
// ========== END EMAIL & SMS SETUP ==========

// Middleware
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:5173','https://project-city-suggestion-box-98vj.vercel.app/'], // Allow both ports
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Create uploads directories if they don't exist
const uploadsDir = path.join(__dirname, 'uploads', 'profiles');
const resolutionsDir = path.join(__dirname, 'uploads', 'resolutions');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
if (!fs.existsSync(resolutionsDir)) {
  fs.mkdirSync(resolutionsDir, { recursive: true });
}

// Serve uploaded files statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/reports', require('./routes/reportRoutes'));
app.use('/api/admin', require('./routes/admin'));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    mongodb: 'Connected',
    sendgrid: sendGridClient ? 'Configured' : 'Disabled',
    twilio: twilioClient ? 'Configured' : 'Disabled',
    timestamp: new Date().toISOString()
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'City Suggestion Backend API',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      users: '/api/users',
      reports: '/api/reports',
      admin: '/api/admin',
      health: '/api/health'
    }
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ message: 'File too large' });
    }
  }
  
  res.status(500).json({ error: 'Something went wrong!' });
});

const PORT = process.env.PORT || 8080;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server started on port ${PORT}`);
});