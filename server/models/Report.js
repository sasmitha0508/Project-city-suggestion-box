const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  category: {
    type: String,
    required: true,
    enum: ['Drainage', 'Street Light', 'Road Damage', 'Water Supply', 'Electricity', 'Garbage', 'Public Transport', 'Noise Pollution', 'Other']
  },
  urgency: {
    type: String,
    required: true,
    enum: ['Low', 'Moderate', 'High', 'Emergency']
  },
  name: {
    type: String,
    default: ''
  },
  phone: {
    type: String,
    required: true
  },
  email: {
    type: String,
    default: ''
  },
  landmark: {
    type: String,
    default: ''
  },
  location: {
    type: String,
    required: true
  },
  coordinates: {
    lat: {
      type: Number,
      required: true
    },
    lng: {
      type: Number,
      required: true
    }
  },
  images: [{
    type: String // Will store file paths
  }],
  status: {
    type: String,
    enum: ['Pending', 'In Progress', 'Resolved', 'Rejected'],
    default: 'Pending'
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  votes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  comments: [{
    text: {
      type: String,
      required: true
    },
    admin: {
      type: Boolean,
      default: false
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  department: {
    type: String,
    default: ''
  },

  // NEW: Resolution details fields
  resolutionDays: {
    type: Number,
    min: 1
  },
  resolutionImage: {
    type: String
  },
  resolvedAt: {
    type: Date
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Add virtual for vote count
reportSchema.virtual('voteCount').get(function() {
  return this.votes.length;
});

reportSchema.virtual('resolutionImageUrl').get(function() {
  if (!this.resolutionImage) return null;
  return `http://localhost:5000${this.resolutionImage}`;
});
module.exports = mongoose.model('Report', reportSchema);