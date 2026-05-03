// routes/admin.js - Simplified version with full URL response
const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Report = require('../models/Report');
const auth = require('../middleware/auth');

const router = express.Router();

// Test route
router.get('/test', (req, res) => {
  res.json({ message: 'Admin routes are working!' });
});

// Simple multer configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '../uploads/resolutions');
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `resolution-${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only images are allowed'), false);
    }
  }
});

// Upload resolution image
router.post('/reports/:id/resolution-image', auth, upload.single('resolutionImage'), async (req, res) => {
  try {
    console.log('Resolution image upload request received');
    
    if (!req.file) {
      return res.status(400).json({ 
        success: false, 
        message: 'No image file provided' 
      });
    }

    const report = await Report.findById(req.params.id);
    if (!report) {
      return res.status(404).json({ 
        success: false, 
        message: 'Report not found' 
      });
    }

    // Update report
    report.resolutionImage = `/uploads/resolutions/${req.file.filename}`;
    report.resolvedAt = new Date();
    await report.save();

    console.log('Resolution image saved successfully:', report.resolutionImage);
    
    // Send both path and full URL in response
    res.json({
      success: true,
      resolutionImage: report.resolutionImage, // relative path
      resolutionImageUrl: `http://localhost:5000${report.resolutionImage}`, // full URL
      message: 'Resolution image uploaded successfully'
    });

  } catch (error) {
    console.error('Resolution upload error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error during image upload',
      error: error.message 
    });
  }
});

module.exports = router;