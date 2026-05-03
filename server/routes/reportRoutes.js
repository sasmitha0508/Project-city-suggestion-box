const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Report = require('../models/Report');
const auth = require('../middleware/auth');
const User = require('../models/User');
const mongoose = require('mongoose');

// Add notification service import
const { 
  sendEmailNotification, 
  sendSMSNotification, 
  getReportSubmissionEmail, 
  getStatusUpdateSMS, 
  getStatusUpdateEmail,
  notifyDepartmentAdmins  // NEW: Added this import
} = require('../services/notificationService');

const router = express.Router();

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, '..', 'uploads', 'reports');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Create resolutions directory if it doesn't exist
const resolutionsDir = path.join(__dirname, '..', 'uploads', 'resolutions');
if (!fs.existsSync(resolutionsDir)) {
  fs.mkdirSync(resolutionsDir, { recursive: true });
}

// Configure multer for report images
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// Configure multer for resolution images
const resolutionStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, resolutionsDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'resolution-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: function (req, file, cb) {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  }
});

const resolutionUpload = multer({
  storage: resolutionStorage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  }
});

// Get all reports (admin only)
router.get('/', auth, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.userType !== 'admin') {
      return res.status(403).json({ error: 'Access denied. Admin only.' });
    }
    
    const reports = await Report.find().sort({ createdAt: -1 }).populate('userId', 'name email phone');
    res.json(reports); // Return array directly for frontend
  } catch (error) {
    console.error('Error fetching all reports:', error);
    res.status(500).json({ error: 'Failed to fetch reports' });
  }
});

// Get all reports for everyone (not just the logged-in user)
router.get('/all-reports', auth, async (req, res) => {
  try {
    console.log('Fetching all reports for everyone...');
    
    const reports = await Report.find().sort({ createdAt: -1 }).populate('userId', 'name email phone');
    console.log('Found all reports:', reports.length);
    
    res.json(reports);
  } catch (error) {
    console.error('Error fetching all reports:', error);
    res.status(500).json({ error: 'Failed to fetch reports' });
  }
});

// Create a new report - UPDATED with department admin notifications
router.post('/', auth, upload.array('images', 5), async (req, res) => {
  try {
    const {
      title,
      description,
      category,
      urgency,
      name,
      phone,
      email,
      landmark,
      location,
      coordinates
    } = req.body;

    console.log('Creating report for user:', req.user.id);
    console.log('Report data:', req.body);

    // Parse coordinates if it's a string
    let coordData;
    try {
      coordData = coordinates ? JSON.parse(coordinates) : { lat: 0, lng: 0 };
    } catch (error) {
      coordData = { lat: 0, lng: 0 };
    }

    // Get uploaded file paths
    const images = req.files ? req.files.map(file => 
      `/uploads/reports/${file.filename}`
    ) : [];

    const report = new Report({
      title,
      description,
      category,
      urgency: urgency || 'Medium',
      name: name || req.user.name,
      phone: phone || req.user.phone,
      email: email || req.user.email,
      landmark,
      location,
      coordinates: coordData,
      images,
      userId: req.user.id
    });

    await report.save();
    
    console.log('Report created successfully:', report._id);
    
    // Send email notification to the user
    try {
      const userEmail = email || req.user.email;
      const userName = name || req.user.name;
      if (userEmail) {
        const emailContent = getReportSubmissionEmail(title, report._id, userName);
        await sendEmailNotification(
          userEmail,
          'Report Submitted Successfully',
          emailContent.html,
          emailContent.text
        );
        console.log('Email notification sent successfully');
      }
    } catch (emailError) {
      console.error('Failed to send email notification:', emailError);
      // Don't fail the request if email fails
    }
    
    // NEW: Notify department admins about the new report
    try {
      await notifyDepartmentAdmins(
        title, 
        report._id, 
        category, 
        location
      );
      console.log('Department admin notifications sent');
    } catch (adminNotifyError) {
      console.error('Failed to notify department admins:', adminNotifyError);
      // Don't fail the request if admin notification fails
    }
    
    res.status(201).json({ 
      message: 'Report submitted successfully', 
      report 
    });
  } catch (error) {
    console.error('Report submission error:', error);
    res.status(500).json({ error: 'Failed to submit report' });
  }
});

// Get all reports for the logged-in user - FIXED: Better debugging
router.get('/my-reports', auth, async (req, res) => {
  try {
    console.log('Fetching reports for user:', req.user.id);
    console.log('User ID type:', typeof req.user.id);
    
    // Convert to ObjectId if it's a string
    const userId = mongoose.Types.ObjectId.isValid(req.user.id) 
      ? new mongoose.Types.ObjectId(req.user.id) 
      : req.user.id;
    
    console.log('Converted user ID:', userId);
    
    const reports = await Report.find({ userId: userId }).sort({ createdAt: -1 });
    console.log('Found reports:', reports.length);
    
    if (reports.length === 0) {
      console.log('No reports found for user. Checking database...');
      
      // Check if there are any reports in the database
      const allReports = await Report.find().limit(5);
      console.log('Sample reports in DB:', allReports.map(r => ({
        id: r._id,
        userId: r.userId,
        title: r.title
      })));
    }
    
    // Return consistent response structure
    res.json(reports); // Return array directly for frontend compatibility
  } catch (error) {
    console.error('Error fetching user reports:', error);
    res.status(500).json({ error: 'Failed to fetch reports' });
  }
});

// Get reports by user ID
router.get('/user/:userId', auth, async (req, res) => {
  try {
    const { userId } = req.params;
    
    console.log('Fetching reports for user ID:', userId);
    
    // Check if user is admin or requesting their own reports
    if (req.user.userType !== 'admin' && req.user.id !== userId) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    const reports = await Report.find({ userId }).sort({ createdAt: -1 });
    console.log('Found reports for user:', reports.length);
    
    res.json(reports);
  } catch (error) {
    console.error('Error fetching user reports:', error);
    res.status(500).json({ error: 'Failed to fetch reports' });
  }
});

// Get a single report
router.get('/:id', auth, async (req, res) => {
  try {
    const report = await Report.findById(req.params.id).populate('userId', 'name email phone');
    if (!report) {
      return res.status(404).json({ error: 'Report not found' });
    }
    
    // Check if user owns the report or is admin
    if (report.userId._id.toString() !== req.user.id && req.user.userType !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    res.json(report);
  } catch (error) {
    console.error('Error fetching report:', error);
    res.status(500).json({ error: 'Failed to fetch report' });
  }
});

// Update report status - UPDATED with improved notifications
router.patch('/:id/status', auth, async (req, res) => {
  try {
    const { status } = req.body;
    const { id } = req.params;

    // Check if user is admin
    if (req.user.userType !== 'admin') {
      return res.status(403).json({ error: 'Access denied. Admin only.' });
    }

    // Validate status
    const validStatuses = ['Pending', 'In Progress', 'Resolved', 'Rejected', 'Open'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const report = await Report.findByIdAndUpdate(
      id,
      { status },
      { new: true, runValidators: true }
    ).populate('userId', 'name email phone');

    if (!report) {
      return res.status(404).json({ error: 'Report not found' });
    }

    // Send notifications to the user who reported the issue - UPDATED CODE
    try {
      if (report.userId && report.userId.phone) {
        await sendSMSNotification(
          report.userId.phone,
          getStatusUpdateSMS(report.title, status, report._id)
        );
        console.log('SMS notification sent successfully');
      }
      
      // Also send email notification for status updates
      if (report.userId && report.userId.email) {
        const emailContent = getStatusUpdateEmail(report.title, status, report._id, report.userId.name);
        await sendEmailNotification(
          report.userId.email,
          `Report Status Updated: ${status}`,
          emailContent.html,
          emailContent.text
        );
        console.log('Email status update sent successfully');
      }
    } catch (notificationError) {
      console.error('Failed to send notifications:', notificationError);
      // Don't fail the request if notifications fail
    }

    res.json({ message: 'Status updated successfully', report });
  } catch (error) {
    console.error('Error updating status:', error);
    res.status(500).json({ error: 'Failed to update status' });
  }
});

// @desc    Update resolution details for a report
// @route   PUT /api/reports/:id/resolution
// @access  Private (Admin only)
router.put('/:id/resolution', auth, resolutionUpload.single('resolutionImage'), async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.userType !== 'admin') {
      return res.status(403).json({ error: 'Access denied. Admin only.' });
    }

    const { resolutionDays } = req.body;
    const reportId = req.params.id;

    // Validate input
    if (!resolutionDays || isNaN(resolutionDays) || parseInt(resolutionDays) <= 0) {
      return res.status(400).json({ error: 'Please provide a valid number of days' });
    }

    // Find the report
    const report = await Report.findById(reportId);
    if (!report) {
      return res.status(404).json({ error: 'Report not found' });
    }

    // Prepare update data
    const updateData = {
      resolutionDays: parseInt(resolutionDays),
      resolvedAt: new Date()
    };

    // If there's a new image, add it to update data
    if (req.file) {
      updateData.resolutionImage = `/uploads/resolutions/${req.file.filename}`;
      
      // If there was a previous image, delete it
      if (report.resolutionImage) {
        const oldImagePath = path.join(__dirname, '..', report.resolutionImage);
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath);
        }
      }
    }

    // Update the report
    const updatedReport = await Report.findByIdAndUpdate(
      reportId,
      updateData,
      { new: true, runValidators: true }
    );

    res.json({
      message: 'Resolution details updated successfully',
      report: updatedReport
    });
  } catch (error) {
    console.error('Error updating resolution details:', error);
    res.status(500).json({ error: 'Failed to update resolution details' });
  }
});

// Update a report
router.put('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const report = await Report.findById(id);
    if (!report) {
      return res.status(404).json({ error: 'Report not found' });
    }

    // Check if user owns the report or is admin
    if (report.userId.toString() !== req.user.id && req.user.userType !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Update the report
    const updatedReport = await Report.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).populate('userId', 'name email phone');

    res.json({ message: 'Report updated successfully', report: updatedReport });
  } catch (error) {
    console.error('Error updating report:', error);
    res.status(500).json({ error: 'Failed to update report' });
  }
});

// Vote on a report
router.post('/:id/vote', auth, async (req, res) => {
  try {
    console.log('Vote endpoint called');
    console.log('Report ID:', req.params.id);
    console.log('User ID:', req.user.id);

    const report = await Report.findById(req.params.id);
    if (!report) {
      console.log('Report not found');
      return res.status(404).json({ error: 'Report not found' });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      console.log('User not found');
      return res.status(404).json({ error: 'User not found' });
    }

    console.log('Report votes before:', report.votes);
    console.log('User votes before:', user.votes);

    // Check if user already voted
    const hasVoted = report.votes.includes(req.user.id);
    console.log('User has voted:', hasVoted);

    if (hasVoted) {
      // Remove vote
      report.votes.pull(req.user.id);
      user.votes.pull(report._id);
      console.log('Vote removed');
    } else {
      // Add vote
      report.votes.push(req.user.id);
      user.votes.push(report._id);
      console.log('Vote added');
    }

    // Save both documents
    await report.save();
    await user.save();

    console.log('Report votes after:', report.votes);
    console.log('User votes after:', user.votes);

    // Return the updated report with vote count
    const updatedReport = await Report.findById(req.params.id);
    
    res.json({ 
      message: 'Vote updated successfully', 
      votes: updatedReport.votes.length,
      userVoted: !hasVoted,
      report: updatedReport
    });

  } catch (error) {
    console.error('ERROR in vote route:');
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    console.error('Error name:', error.name);
    
    res.status(500).json({ error: 'Failed to update vote' });
  }
});

// Add comment to a report
router.post('/:id/comment', auth, async (req, res) => {
  try {
    const { comment } = req.body;
    const { id } = req.params;

    const report = await Report.findById(id);
    if (!report) {
      return res.status(404).json({ error: 'Report not found' });
    }

    // Add comment
    report.comments.push({
      userId: req.user.id,
      comment,
      userName: req.user.name || 'Anonymous'
    });

    await report.save();
    
    // Populate user data for response
    await report.populate('userId', 'name email phone');
    
    res.json({ message: 'Comment added successfully', report });
  } catch (error) {
    console.error('Error adding comment:', error);
    res.status(500).json({ error: 'Failed to add comment' });
  }
});

// Delete a report
router.delete('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;

    const report = await Report.findById(id);
    if (!report) {
      return res.status(404).json({ error: 'Report not found' });
    }

    // Check if user owns the report or is admin
    if (report.userId.toString() !== req.user.id && req.user.userType !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Delete associated images
    if (report.images && report.images.length > 0) {
      report.images.forEach(imagePath => {
        const fullPath = path.join(__dirname, '..', imagePath);
        if (fs.existsSync(fullPath)) {
          fs.unlinkSync(fullPath);
        }
      });
    }

    await Report.findByIdAndDelete(id);
    res.json({ message: 'Report deleted successfully' });
  } catch (error) {
    console.error('Error deleting report:', error);
    res.status(500).json({ error: 'Failed to delete report' });
  }
});

// Debug endpoint to check all reports
router.get('/debug/all-reports', auth, async (req, res) => {
  try {
    if (req.user.userType !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }
    
    const reports = await Report.find().populate('userId', 'name email');
    console.log('All reports in database:', reports.length);
    
    res.json({
      totalReports: reports.length,
      reports: reports.map(r => ({
        id: r._id,
        title: r.title,
        userId: r.userId,
        userName: r.userId?.name,
        createdAt: r.createdAt
      }))
    });
  } catch (error) {
    console.error('Debug error:', error);
    res.status(500).json({ error: 'Debug failed' });
  }
});

module.exports = router;