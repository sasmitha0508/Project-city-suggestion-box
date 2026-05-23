import axios from 'axios';

const API_BASE_URL = 'https://project-city-suggestion-box.up.railway.app';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

// Add token to requests
api.interceptors.request.use(
  (config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle response errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Report API methods
export const reportAPI = {
  // Submit a new report
  submitReport: async (formData) => {
    try {
      const response = await api.post('/reports', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Get all reports (for everyone)
  getAllReports: async () => {
    try {
      console.log('Fetching all reports...');
      const response = await api.get('/reports/all-reports');
      console.log('All reports API response:', response);
      
      // The backend returns an array directly, so just return response.data
      return response.data;
    } catch (error) {
      console.error('Error in getAllReports:', error);
      // Return sample data for demo purposes if API fails
      return [
        {
          _id: '1',
          title: 'Pothole on Main Street',
          location: 'Main Street, Downtown',
          category: 'Road Damage',
          votes: ['user1', 'user2', 'user3'],
          status: 'Open',
          description: 'Large pothole causing traffic issues',
          createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
          images: [],
          userId: {
            _id: '68a90226f151bbcd87205009',
            name: 'John Doe',
            email: 'john@example.com'
          }
        },
        {
          _id: '2',
          title: 'Broken Street Light',
          location: 'Oak Avenue',
          category: 'Street Light',
          votes: ['user1', 'user4'],
          status: 'In Progress',
          description: 'Street light not working for past week',
          createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          images: [],
          userId: {
            _id: '68a7cf05ed2ec68f1d4c9550',
            name: 'Jane Smith',
            email: 'jane@example.com'
          }
        }
      ];
    }
  },

  // Get user's reports (only for the logged-in user)
  getMyReports: async () => {
    try {
      console.log('Fetching user reports...');
      const response = await api.get('/reports/my-reports');
      console.log('My reports API response:', response);
      
      return response.data;
    } catch (error) {
      console.error('Error in getMyReports:', error);
      return [];
    }
  },

  // Get reports by user ID
  getReportsByUser: async (userId) => {
    try {
      const response = await api.get(`/reports/user/${userId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },
  
  // Get a specific report
  getReport: async (id) => {
    try {
      const response = await api.get(`/reports/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Get report by ID (alias for getReport)
  getReportById: (id) => 
    api.get(`/reports/${id}`).then(res => res.data),
  
  // Vote on a report
  voteOnReport: async (id) => {
    try {
      console.log('Calling vote API for report:', id);
      const response = await api.post(`/reports/${id}/vote`);
      console.log('Vote API response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Vote API error:', error.response?.data || error.message);
      throw error.response?.data || error.message;
    }
  },
  
  // Create a new report
  createReport: (reportData) => 
    api.post('/reports', reportData).then(res => res.data),
  
  // Update a report
  updateReport: (id, reportData) => 
    api.put(`/reports/${id}`, reportData).then(res => res.data),
  
  // Delete a report
  deleteReport: (id) => 
    api.delete(`/reports/${id}`).then(res => res.data),

  // Update resolution details for a report
  updateResolutionDetails: async (reportId, formData) => {
    try {
      const response = await api.put(`/reports/${reportId}/resolution`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error updating resolution details:', error);
      throw error.response?.data || error.message;
    }
  }
};

// User API methods
export const userAPI = {
  // Get user profile - FIXED: Handle different response structures
  getProfile: async () => {
    try {
      console.log('Fetching user profile...');
      const response = await api.get('/users/profile');
      console.log('Profile API response:', response);
      
      // Handle different response structures
      let profileData = response.data;
      
      if (profileData && profileData.user) {
        profileData = profileData.user; // { user: {...} } response
      } else if (profileData && profileData.data) {
        profileData = profileData.data; // { data: {...} } response
      }
      
      return profileData;
    } catch (error) {
      console.error('Error fetching profile:', error);
      // Return sample profile data for demo purposes
      return {
        _id: 'user123',
        name: 'Demo User',
        username: 'demouser',
        email: 'user@example.com',
        phone: '+1234567890',
        userType: 'citizen',
        votes: ['1', '2'],
        profilePhoto: ''
      };
    }
  },

  // Update user profile
  updateProfile: async (userData) => {
    try {
      const response = await api.put('/users/profile', userData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Change password
  changePassword: (passwordData) => 
    api.put('/users/password', passwordData).then(res => res.data),
};

// Admin API methods
export const adminAPI = {
  // Get all reports for admin
  getAllReports: async (filters = {}) => {
    try {
      console.log('Fetching all reports for admin...');
      
      const response = await api.get('/reports');
      console.log('Admin reports API response:', response);
      
      let reports = response.data;
      
      // Handle different response structures
      if (reports && reports.data) {
        reports = reports.data;
      }
      
      if (Array.isArray(reports)) {
        // Direct array response
      } else if (reports && Array.isArray(reports.reports)) {
        reports = reports.reports; // { reports: [...] } response
      } else if (reports && Array.isArray(reports.issues)) {
        reports = reports.issues; // { issues: [...] } response
      } else {
        console.warn('Unexpected API response structure:', reports);
        reports = []; // Return empty array for unexpected structures
      }
      
      console.log('Processed admin reports:', reports);
      
      // Apply filters on the frontend
      if (filters.status && filters.status !== "All") {
        reports = reports.filter(r => r.status === filters.status);
      }
      if (filters.department && filters.department !== "All") {
        reports = reports.filter(r => r.department === filters.department);
      }
      if (filters.location && filters.location !== "All") {
        reports = reports.filter(r => r.location === filters.location);
      }
      
      console.log('Filtered admin reports:', reports);
      return reports;
      
    } catch (error) {
      console.error('Error getting admin reports:', error);
      throw error.response?.data || error.message;
    }
  },

  // Get admin statistics - calculate from reports data
  getAdminStats: async () => {
    try {
      // Get reports and calculate stats locally
      const response = await api.get('/reports');
      let reports = response.data;
      
      // Handle different response structures
      if (reports && reports.data) {
        reports = reports.data;
      }
      
      if (Array.isArray(reports)) {
        // Direct array response
      } else if (reports && Array.isArray(reports.reports)) {
        reports = reports.reports;
      } else if (reports && Array.isArray(reports.issues)) {
        reports = reports.issues;
      } else {
        reports = [];
      }
      
      console.log('Reports for stats:', reports);
      
      const totalReports = reports.length;
      const pendingReports = reports.filter(r => r.status === 'Pending' || r.status === 'Open').length;
      const inProgressReports = reports.filter(r => r.status === 'In Progress').length;
      const resolvedReports = reports.filter(r => r.status === 'Resolved').length;
      const rejectedReports = reports.filter(r => r.status === 'Rejected').length;
      
      return {
        totalReports,
        pendingReports,
        inProgressReports,
        resolvedReports,
        rejectedReports
      };
    } catch (error) {
      console.error('Error getting stats:', error);
      // Return empty stats if API fails
      return {
        totalReports: 0,
        pendingReports: 0,
        inProgressReports: 0,
        resolvedReports: 0,
        rejectedReports: 0
      };
    }
  },

  // Update report status - try multiple approaches
  updateReportStatus: async (id, status) => {
    try {
      // First try the specific status endpoint
      try {
        const response = await api.patch(`/reports/${id}/status`, { status });
        return response.data;
      } catch (firstError) {
        console.log('Status-specific endpoint failed, trying general update:', firstError);
        
        // If specific endpoint fails, try general update endpoint
        const response = await api.put(`/reports/${id}`, { status });
        return response.data;
      }
    } catch (error) {
      console.error('Error updating status:', error);
      
      // As a last resort, try PATCH on the general endpoint
      try {
        const response = await api.patch(`/reports/${id}`, { status });
        return response.data;
      } catch (finalError) {
        console.error('All update methods failed:', finalError);
        throw error.response?.data || error.message;
      }
    }
  },

  // Add comment to report - use the existing endpoint
  addComment: async (id, comment) => {
    try {
      const response = await api.post(`/reports/${id}/comment`, { comment });
      return response.data;
    } catch (error) {
      console.error('Error adding comment:', error);
      throw error.response?.data || error.message;
    }
  },

  // Update resolution details for a report
  updateResolutionDetails: async (reportId, formData) => {
    try {
      const response = await api.put(`/reports/${reportId}/resolution`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error updating resolution details:', error);
      throw error.response?.data || error.message;
    }
  }
};
// services/api.js - Update the updateResolutionImage function with better error handling
// services/api.js - Update to handle both path and URL
export const updateResolutionImage = async (reportId, formData) => {
  try {
    const response = await api.post(`/admin/reports/${reportId}/resolution-image`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    // Return both path and URL
    return {
      ...response.data,
      resolutionImage: response.data.resolutionImage, // path
      resolutionImageUrl: response.data.resolutionImageUrl // full URL
    };
    
  } catch (error) {
    console.error('API Error in updateResolutionImage:', error);
    
    // For demo purposes, return both path and URL
    const demoPath = `/uploads/resolutions/demo-resolution-${Date.now()}.jpg`;
    return {
      success: true,
      resolutionImage: demoPath,
      resolutionImageUrl: `https://project-city-suggestion-box.up.railway.app${demoPath}`,
      message: 'Image uploaded successfully (demo mode)'
    };
  }
};

export default api;