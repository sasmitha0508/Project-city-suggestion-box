const sgMail = require('@sendgrid/mail');
const twilio = require('twilio');
const User = require('../models/User');

// Configure SendGrid
if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
  console.log('SendGrid client initialized successfully');
} else {
  console.warn('SendGrid API key not found. Email notifications will be disabled.');
}

// Initialize Twilio client with validation
let twilioClient = null;
let twilioConfigured = false;

if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
  // Validate that Account SID starts with AC (Twilio format)
  if (process.env.TWILIO_ACCOUNT_SID.startsWith('AC')) {
    try {
      twilioClient = twilio(
        process.env.TWILIO_ACCOUNT_SID,
        process.env.TWILIO_AUTH_TOKEN
      );
      twilioConfigured = true;
      console.log('Twilio client initialized successfully');
    } catch (error) {
      console.error('Error initializing Twilio client:', error.message);
      twilioConfigured = false;
    }
  } else {
    console.warn('Invalid Twilio Account SID format. Should start with "AC"');
    twilioConfigured = false;
  }
} else {
  console.warn('Twilio credentials not found. SMS notifications will be in demo mode.');
}

// Send email notification using SendGrid
exports.sendEmailNotification = async (to, subject, html, textVersion = null) => {
  try {
    if (!process.env.SENDGRID_API_KEY) {
      console.warn('SendGrid not configured. Would send email to:', to);
      console.log('Email content:', html);
      return false;
    }

    const msg = {
      to,
      from: {
        email: process.env.EMAIL_FROM || 'noreply@citysuggestion.com',
        name: process.env.EMAIL_FROM_NAME || 'City Suggestion Box'
      },
      subject,
      html,
      text: textVersion || html.replace(/<[^>]*>/g, ''), // Plain text version
      // Add headers to improve deliverability
      headers: {
        'List-Unsubscribe': '<mailto:unsubscribe@citysuggestion.com?subject=Unsubscribe>',
        'X-Entity-Ref-ID': Date.now().toString()
      },
      // Add categories for better tracking
      categories: ['notification', 'report-update'],
      // Set important tracking options
      trackingSettings: {
        clickTracking: {
          enable: true,
          enableText: true
        },
        openTracking: {
          enable: true
        },
        subscriptionTracking: {
          enable: true
        }
      },
      // Set send at to avoid being marked as bulk
      sendAt: Math.floor(Date.now() / 1000) + 10 // Send 10 seconds from now
    };

    await sgMail.send(msg);
    console.log('Email sent via SendGrid to:', to);
    return true;
  } catch (error) {
    console.error('SendGrid error:', error.response?.body || error.message);
    
    // If it's an authentication error, suggest checking domain verification
    if (error.response && error.response.body && error.response.body.errors) {
      error.response.body.errors.forEach(err => {
        if (err.message.includes('authenticate')) {
          console.error('Authentication issue: Please verify your domain in SendGrid');
        }
      });
    }
    
    return false;
  }
};

// SMS notification using Twilio
exports.sendSMSNotification = async (to, message) => {
  try {
    // Check if Twilio is properly configured
    if (!twilioConfigured || !process.env.TWILIO_PHONE_NUMBER) {
      console.log('DEMO MODE: SMS would be sent to:', to);
      console.log('DEMO MODE: SMS content:', message);
      console.log('DEMO MODE: Configure Twilio in .env to send real SMS');
      return true; // Return true for demo purposes
    }

    // Format phone number (add country code if needed)
    const formattedTo = to.startsWith('+') ? to : `+91${to}`;
    
    console.log('Attempting to send SMS via Twilio to:', formattedTo);
    
    // Send SMS using Twilio
    const result = await twilioClient.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: formattedTo
    });

    console.log('SMS sent successfully via Twilio to:', formattedTo);
    console.log('Twilio message SID:', result.sid);
    return true;
  } catch (error) {
    console.error('Error sending SMS via Twilio:', error.message);
    
    // Check if it's a trial account limitation
    if (error.code === 21211 || error.message.includes('trial account')) {
      console.error('Trial account limitation: You can only send SMS to verified numbers');
      console.log('Verify your number at: https://www.twilio.com/console/phone-numbers/verified');
    }
    
    console.log('SMS content (not sent):', message);
    return false;
  }
};

// Improved email template for report submission (less spammy)
exports.getReportSubmissionEmail = (reportTitle, reportId, userName = 'User') => {
  const plainText = `
    Thank You for Your Report!
    
    Your report "${reportTitle}" has been successfully submitted to the City Suggestion Box.
    
    We will review your report and take appropriate action. You can track the status of your report using the following ID: ${reportId}
    
    We'll notify you when there are updates to your report.
    
    Best regards,
    City Suggestion Box Team
  `;
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Report Submission Confirmation</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(to right, #4CAF50, #45a049); padding: 20px; text-align: center; border-radius: 5px 5px 0 0;">
        <h1 style="color: white; margin: 0;">City Suggestion Box</h1>
      </div>
      
      <div style="background: #f9f9f9; padding: 20px; border-radius: 0 0 5px 5px; border: 1px solid #ddd; border-top: none;">
        <h2 style="color: #2c3e50; margin-top: 0;">Thank You for Your Report, ${userName}!</h2>
        
        <p>Your report <strong>"${reportTitle}"</strong> has been successfully submitted to the City Suggestion Box.</p>
        
        <div style="background: #e8f5e9; padding: 15px; border-left: 4px solid #4CAF50; margin: 20px 0;">
          <p style="margin: 0;">Report ID: <strong>${reportId}</strong></p>
        </div>
        
        <p>We will review your report and take appropriate action. You can track the status of your report using the ID above.</p>
        
        <p>We'll notify you when there are updates to your report.</p>
        
        <hr style="border: none; border-top: 1px solid #eee; margin: 25px 0;">
        
        <p style="font-size: 14px; color: #777;">If you did not submit this report, please ignore this email or contact our support team.</p>
        
        <div style="text-align: center; margin-top: 25px;">
          <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}" style="background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; display: inline-block;">View Your Reports</a>
        </div>
      </div>
      
      <div style="text-align: center; margin-top: 20px; color: #777; font-size: 12px;">
        <p>© ${new Date().getFullYear()} City Suggestion Box. All rights reserved.</p>
        <p><a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/privacy" style="color: #4CAF50;">Privacy Policy</a> | <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/terms" style="color: #4CAF50;">Terms of Service</a></p>
        <p>You're receiving this email because you submitted a report on our platform.</p>
        <p><a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/unsubscribe" style="color: #4CAF50;">Unsubscribe</a> from these notifications</p>
      </div>
    </body>
    </html>
  `;
  
  return { html, text: plainText };
};

// SMS template for status update
exports.getStatusUpdateSMS = (reportTitle, status, reportId) => {
  return `CitySuggestion: Your report "${reportTitle}" status updated to: ${status}. ID: ${reportId}. Reply STOP to unsubscribe.`;
};

// Add this function to get department admins
exports.getDepartmentAdmins = async (department) => {
  try {
    const admins = await User.find({ 
      userType: 'admin',
      department: department 
    });
    return admins;
  } catch (error) {
    console.error('Error fetching department admins:', error);
    return [];
  }
};

// Add this function to notify department admins
exports.notifyDepartmentAdmins = async (reportTitle, reportId, department, reportLocation) => {
  try {
    // Get all admins for this department
    const admins = await exports.getDepartmentAdmins(department);
    
    if (admins.length === 0) {
      console.log(`No admins found for department: ${department}`);
      return false;
    }
    
    console.log(`Found ${admins.length} admins for department: ${department}`);
    
    // Send SMS to each admin
    let successCount = 0;
    for (const admin of admins) {
      if (admin.phone) {
        const message = `New report in ${department}: "${reportTitle}" at ${reportLocation}. Report ID: ${reportId}. Please review.`;
        const smsSent = await exports.sendSMSNotification(admin.phone, message);
        
        if (smsSent) {
          successCount++;
          console.log(`SMS sent to admin: ${admin.name} (${admin.phone})`);
        }
      }
    }
    
    console.log(`Sent notifications to ${successCount} out of ${admins.length} department admins`);
    return successCount > 0;
  } catch (error) {
    console.error('Error notifying department admins:', error);
    return false;
  }
};

// SMS template for department admin notification
exports.getDepartmentAdminSMS = (reportTitle, department, reportLocation, reportId) => {
  return `New ${department} report: "${reportTitle}" at ${reportLocation}. ID: ${reportId}. Please review.`;
};

// Test function to verify Twilio configuration
exports.testTwilioConfig = async () => {
  try {
    if (!twilioConfigured) {
      console.log('Twilio not properly configured');
      return false;
    }
    
    // Try to list your Twilio account details
    const account = await twilioClient.api.accounts(process.env.TWILIO_ACCOUNT_SID).fetch();
    console.log('Twilio configuration is valid');
    console.log('Account friendly name:', account.friendlyName);
    return true;
  } catch (error) {
    console.error('Twilio configuration error:', error.message);
    return false;
  }
};

// Check configurations on startup
console.log('SendGrid configured:', !!process.env.SENDGRID_API_KEY);
console.log('Twilio configured:', twilioConfigured);