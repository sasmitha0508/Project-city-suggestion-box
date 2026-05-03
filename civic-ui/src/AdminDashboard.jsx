import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { loadAdminProfile } from "./Profile.jsx";
import { adminAPI, userAPI, reportAPI } from "./services/api";
import { useLanguage } from "./contexts/LanguageContext.jsx";
import { adminen } from "./translations/admin-en.js";
import { adminta } from "./translations/admin-ta.js";
import logo from './assets/logo2.png'
import "./AdminDashboard.css";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { language, toggleLanguage, isTamil } = useLanguage();
  const translations = {
    en: adminen,
    ta: adminta
  };
  const t = translations[language];
  
  const [profile, setProfile] = useState(loadAdminProfile());
  const [filters, setFilters] = useState({
    status: "All",
    department: profile.department || "All",
    location: profile.location || "All",
  });
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [issues, setIssues] = useState([]);
  const [filteredIssues, setFilteredIssues] = useState([]);
  const [selectedIssue, setSelectedIssue] = useState(null);
  const [activeTab, setActiveTab] = useState("reports");
  const [newComment, setNewComment] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({});
  
  // New state variables for the added features
  const [resolutionDays, setResolutionDays] = useState("");
  const [resolutionImage, setResolutionImage] = useState(null);
  const [resolutionImagePreview, setResolutionImagePreview] = useState(null);
  const [isUpdatingDays, setIsUpdatingDays] = useState(false);
  const [isUpdatingImage, setIsUpdatingImage] = useState(false);

  // State for flip-flop images
  const [flippedCards, setFlippedCards] = useState({});

  // Mock data for fallback
  const initialIssues = [
    {
      id: 1,
      title: "Pothole on Main Street",
      location: "Downtown",
      votes: 15,
      image: "https://via.placeholder.com/300x200?text=Pothole",
      description: "Large pothole causing traffic issues",
      department: "Public Works",
      status: "Pending",
      date: "2023-10-15",
      comments: [],
      urgency: "High",
      landmark: "Near City Hall",
      userName: "John Doe",
      userEmail: "john@example.com",
      userPhone: "555-1234"
    },
    {
      id: 2,
      title: "Broken Street Light",
      location: "Residential Area",
      votes: 8,
      image: "https://via.placeholder.com/300x200?text=Street+Light",
      description: "Street light not working for 3 days",
      department: "Utilities",
      status: "In Progress",
      date: "2023-10-14",
      comments: [],
      urgency: "Medium",
      landmark: "Near Elementary School",
      userName: "Jane Smith",
      userEmail: "jane@example.com",
      userPhone: "555-5678"
    }
  ];

  // Check if user is admin on component mount
  useEffect(() => {
    const checkAdminStatus = async () => {
      try {
        const userData = await userAPI.getProfile();
        if (userData.userType !== 'admin') {
          alert(t.accessDenied);
          navigate('/');
        }
      } catch (error) {
        console.error('Error checking admin status:', error);
        // If we can't verify, use stored profile
        const storedProfile = loadAdminProfile();
        if (storedProfile.userType !== 'admin') {
          alert(t.accessDenied);
          navigate('/');
        }
      }
    };
    
    checkAdminStatus();
  }, [navigate, t]);

  // Fetch data on component mount
  useEffect(() => {
    fetchData();
  }, []);

  // Apply filters when they change
  useEffect(() => {
    filterIssues();
  }, [filters, issues]);

  // Add this function to your AdminDashboard
  const refreshReportsData = async () => {
    try {
      setLoading(true);
      const reportsResponse = await adminAPI.getAllReports();
      
      if (Array.isArray(reportsResponse)) {
        const transformedIssues = reportsResponse.map(report => ({
          id: report._id || report.id,
          title: report.title,
          location: report.location,
          votes: report.votes ? report.votes.length : 0,
          image: report.images && report.images.length > 0 
            ? `http://localhost:5000${report.images[0]}` 
            : 'https://via.placeholder.com/300x200?text=No+Image',
          description: report.description,
          category: report.category,
          department: report.category || 'General',
          status: report.status,
          date: new Date(report.createdAt || report.date).toLocaleDateString(),
          comments: report.comments || [],
          urgency: report.urgency,
          landmark: report.landmark,
          coordinates: report.coordinates,
          userName: report.name || 'Unknown User',
          userEmail: report.email || '',
          userPhone: report.phone || '',
          resolutionDays: report.resolutionDays || null,
          resolutionImage: report.resolutionImage || null,
          resolvedAt: report.resolvedAt || null
        }));

        setIssues(transformedIssues);
        setFilteredIssues(transformedIssues);
      }
    } catch (error) {
      console.error('Error refreshing data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchProfileData = async () => {
    try {
      console.log('Fetching profile data...');
      const userData = await userAPI.getProfile();
      console.log('Profile data received:', userData);
      
      // Check if user is admin
      if (userData.userType !== 'admin') {
        alert(t.accessDenied);
        navigate('/');
        return;
      }
      
      // Update profile state
      setProfile({
        id: userData.id || userData._id,
        name: userData.name || userData.username,
        username: userData.username,
        email: userData.email,
        phone: userData.phone,
        location: userData.location,
        userType: userData.userType,
        department: userData.department,
        profilePhoto: userData.profilePhoto
      });
      
      // Update filters based on profile data
      setFilters({
        status: "All",
        department: userData.department || "All",
        location: userData.location || "All",
      });
      
      return userData;
    } catch (error) {
      console.error('Error fetching profile:', error);
      alert(t.failedToLoadProfile);
      
      // Use stored profile as fallback
      const storedProfile = loadAdminProfile();
      setProfile(storedProfile);
      return storedProfile;
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      console.log('Starting data fetch...');
      
      let reportsData = [];
      let statsData = {};
      let userData = null;

      // Fetch profile data first
      userData = await fetchProfileData();
      
      // Only proceed if user is admin
      if (userData.userType !== 'admin') {
        setLoading(false);
        return;
      }

      try {
        // Try to get reports data - USE ADMIN API
        console.log('Fetching reports...');
        const reportsResponse = await adminAPI.getAllReports();
        console.log('Reports response:', reportsResponse);
        
        // Handle the response - it should be an array directly
        if (Array.isArray(reportsResponse)) {
          reportsData = reportsResponse;
        } else {
          console.warn('Unexpected reports response structure:', reportsResponse);
          reportsData = [];
        }
        
        console.log('Processed reports data:', reportsData);
        
        // Get stats
        try {
          console.log('Fetching stats...');
          const statsResponse = await adminAPI.getAdminStats();
          console.log('Stats response:', statsResponse);
          statsData = statsResponse;
        } catch (statsError) {
          console.warn('Failed to get stats, calculating locally:', statsError);
          // Calculate stats from reports data
          statsData = {
            totalReports: reportsData.length,
            pendingReports: reportsData.filter(r => r.status === 'Pending').length,
            inProgressReports: reportsData.filter(r => r.status === 'In Progress').length,
            resolvedReports: reportsData.filter(r => r.status === 'Resolved').length,
            rejectedReports: reportsData.filter(r => r.status === 'Rejected').length,
          };
        }

      } catch (error) {
        console.error('API Error:', error);
        // Use fallback mock data if API fails
        console.log('Using fallback mock data');
        reportsData = initialIssues;
        statsData = {
          totalReports: initialIssues.length,
          pendingReports: initialIssues.filter(r => r.status === 'Pending').length,
          inProgressReports: initialIssues.filter(r => r.status === 'In Progress').length,
          resolvedReports: initialIssues.filter(r => r.status === 'Resolved').length,
          rejectedReports: initialIssues.filter(r => r.status === 'Rejected').length,
        };
      }

      console.log('Final reports data for transformation:', reportsData);

      // SAFETY CHECK: Ensure reportsData is always an array
      const safeReportsData = Array.isArray(reportsData) ? reportsData : [];
      
      // Transform API data to match component structure - CORRECTED VERSION
      const transformedIssues = safeReportsData.map(report => ({
        id: report._id || report.id,
        title: report.title,
        location: report.location,
        votes: report.votes ? report.votes.length : 0,
        image: report.images && report.images.length > 0 
          ? `http://localhost:5000${report.images[0]}` 
          : 'https://via.placeholder.com/300x200?text=No+Image',
        description: report.description,
        category: report.category,
        department: report.category || 'General',
        status: report.status,
        date: new Date(report.createdAt || report.date).toLocaleDateString(),
        comments: report.comments || [],
        urgency: report.urgency,
        landmark: report.landmark,
        coordinates: report.coordinates,
        userName: report.name || 'Unknown User',
        userEmail: report.email || '',
        userPhone: report.phone || '',
        // New fields for resolution details
        resolutionDays: report.resolutionDays || null,
        resolutionImage: report.resolutionImage || null,
        resolvedAt: report.resolvedAt || null
      }));

      console.log('Transformed issues:', transformedIssues);

      // Update state in a single batch to avoid race conditions
      setIssues(transformedIssues);
      setFilteredIssues(transformedIssues);
      setStats(statsData);

    } catch (error) {
      console.error('Error in fetchData:', error);
      alert(t.failedToLoadData);
      
      // Fallback to initial mock data
      setIssues(initialIssues);
      setFilteredIssues(initialIssues);
      setStats({
        totalReports: initialIssues.length,
        pendingReports: initialIssues.filter(r => r.status === 'Pending').length,
        inProgressReports: initialIssues.filter(r => r.status === 'In Progress').length,
        resolvedReports: initialIssues.filter(r => r.status === 'Resolved').length,
        rejectedReports: initialIssues.filter(r => r.status === 'Rejected').length,
      });
    } finally {
      setLoading(false);
    }
  };

  // CORRECTED filterIssues function - FIXED THE "result is not defined" ERROR
  const filterIssues = () => {
    // Safety check - ensure issues is an array
    if (!Array.isArray(issues)) {
      console.warn('Issues is not an array:', issues);
      setFilteredIssues([]);
      return;
    }
    
    // Define result variable here
    let result = [...issues];
    
    // Filter by department (from profile) - use category as department
    if (filters.department && filters.department !== "All") {
      result = result.filter((issue) => issue.department === filters.department);
    }

    // Filter by status
    if (filters.status !== "All") {
      result = result.filter((issue) => issue.status === filters.status);
    }

    // Filter by location (from profile)
    if (filters.location && filters.location !== "All") {
      result = result.filter((issue) => 
        issue.location && issue.location.toLowerCase().includes(filters.location.toLowerCase())
      );
    }

    // Debug logging
    console.log('Filtering issues with:', {
      departmentFilter: filters.department,
      locationFilter: filters.location,
      statusFilter: filters.status,
      totalIssues: issues.length,
      filteredIssues: result.length
    });

    setFilteredIssues(result);
  };

  // NEW: Handle flip-flop toggle for before/after images
  const handleImageFlip = (issueId) => {
    setFlippedCards(prev => ({
      ...prev,
      [issueId]: !prev[issueId]
    }));
  };

  const handleStatusChange = (e) => {
    const { value } = e.target;
    setFilters((prev) => ({ ...prev, status: value }));
  };

  const handleViewDetails = async (issue) => {
    try {
      // Fetch detailed report data
      const reportDetail = await reportAPI.getReport(issue.id);
      
      const detailedIssue = {
        id: reportDetail._id,
        title: reportDetail.title,
        location: reportDetail.location,
        votes: reportDetail.votes ? reportDetail.votes.length : 0,
        image: reportDetail.images && reportDetail.images.length > 0 
          ? `http://localhost:5000${reportDetail.images[0]}` 
          : 'https://via.placeholder.com/300x200?text=No+Image',
        description: reportDetail.description,
        category: reportDetail.category,
        department: reportDetail.category || 'General',
        status: reportDetail.status,
        date: new Date(reportDetail.createdAt).toLocaleDateString(),
        comments: reportDetail.comments || [],
        urgency: reportDetail.urgency,
        landmark: reportDetail.landmark,
        coordinates: reportDetail.coordinates,
        userName: reportDetail.name || 'Unknown User',
        userEmail: reportDetail.email || '',
        userPhone: reportDetail.phone || '',
        // New fields for resolution details
        resolutionDays: reportDetail.resolutionDays || null,
        resolutionImage: reportDetail.resolutionImage || null,
        resolvedAt: reportDetail.resolvedAt || null
      };
      
      setSelectedIssue(detailedIssue);
      setIsModalOpen(true);
      
      // Reset resolution form fields
      setResolutionDays(detailedIssue.resolutionDays || "");
      setResolutionImage(null);
      setResolutionImagePreview(detailedIssue.resolutionImage 
        ? `http://localhost:5000${detailedIssue.resolutionImage}` 
        : null
      );
    } catch (error) {
      console.error('Error fetching report details:', error);
      alert(t.failedToLoadReport);
    }
  };

  const handleCloseDetails = () => {
    setIsModalOpen(false);
    setTimeout(() => setSelectedIssue(null), 300);
  };

  // UPDATED: handleStatusUpdate function to properly update status
  const handleStatusUpdate = async (id, newStatus) => {
    try {
      console.log('Updating status for report:', id, 'to:', newStatus);
      
      // Call API to update status
      await adminAPI.updateReportStatus(id, newStatus);
      
      // Update local state for issues list
      const updatedIssues = issues.map((issue) =>
        issue.id === id ? { ...issue, status: newStatus } : issue
      );
      
      setIssues(updatedIssues);
      
      // Update filtered issues if needed
      setFilteredIssues(prevFiltered => 
        prevFiltered.map(issue => 
          issue.id === id ? { ...issue, status: newStatus } : issue
        )
      );

      // Update selected issue in modal if it's the same one
      if (selectedIssue && selectedIssue.id === id) {
        setSelectedIssue(prev => ({ ...prev, status: newStatus }));
      }
      
      // Update stats
      setStats(prev => ({
        ...prev,
        pendingReports: updatedIssues.filter(r => r.status === 'Pending').length,
        inProgressReports: updatedIssues.filter(r => r.status === 'In Progress').length,
        resolvedReports: updatedIssues.filter(r => r.status === 'Resolved').length,
        rejectedReports: updatedIssues.filter(r => r.status === 'Rejected').length,
      }));
      
      alert(t.statusUpdated);
    } catch (error) {
      console.error('Error updating status:', error);
      alert(t.failedToUpdateStatus);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim() || !selectedIssue) return;

    try {
      await adminAPI.addComment(selectedIssue.id, newComment);
      
      // Update local state
      const updatedComment = {
        text: newComment,
        admin: true,
        createdAt: new Date()
      };

      const updatedIssues = issues.map((issue) =>
        issue.id === selectedIssue.id
          ? { ...issue, comments: [...issue.comments, updatedComment] }
          : issue
      );

      setIssues(updatedIssues);
      setSelectedIssue({
        ...selectedIssue,
        comments: [...selectedIssue.comments, updatedComment],
      });
      setNewComment("");
      
      alert(t.commentAdded);
    } catch (error) {
      console.error('Error adding comment:', error);
      alert(t.failedToAddComment);
    }
  };

  // NEW: Handle resolution image selection
  const handleResolutionImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setResolutionImage(file);
      
      // Create a preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setResolutionImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // NEW: Submit only resolution days
  const handleSubmitResolutionDays = async () => {
    if (!selectedIssue) return;
    
    // Validate days input
    if (!resolutionDays || isNaN(resolutionDays) || parseInt(resolutionDays) <= 0) {
      alert(t.enterValidDays);
      return;
    }
    
    setIsUpdatingDays(true);
    
    try {
      // Call API to update resolution days only
      await adminAPI.updateResolutionDays(selectedIssue.id, parseInt(resolutionDays));
      
      // Update local state
      const updatedIssues = issues.map((issue) =>
        issue.id === selectedIssue.id
          ? { 
              ...issue, 
              resolutionDays: parseInt(resolutionDays),
              resolvedAt: new Date().toISOString(),
            }
          : issue
      );
      
      setIssues(updatedIssues);
      
      // Update selected issue in modal
      setSelectedIssue({
        ...selectedIssue,
        resolutionDays: parseInt(resolutionDays),
        resolvedAt: new Date().toISOString(),
      });
      
      // Update filtered issues
      setFilteredIssues(prevFiltered => 
        prevFiltered.map(issue => 
          issue.id === selectedIssue.id 
            ? { ...issue, resolutionDays: parseInt(resolutionDays) }
            : issue
        )
      );
      
      alert(t.resolutionDaysUpdated);
    } catch (error) {
      console.error('Error updating resolution days:', error);
      alert(t.failedToUpdateDays);
    } finally {
      setIsUpdatingDays(false);
    }
  };

  // NEW: Submit only resolution image - CORRECTED VERSION
  const handleSubmitResolutionImage = async () => {
    if (!selectedIssue || !resolutionImage) return;
    
    setIsUpdatingImage(true);
    
    try {
      console.log('Starting image upload process...');
      
      // Create form data for file upload
      const formData = new FormData();
      formData.append('resolutionImage', resolutionImage);
      
      let imagePath;
      let uploadSuccessful = false;
      
      // First try: Use the adminAPI method
      try {
        console.log('Trying adminAPI method...');
        const response = await adminAPI.updateResolutionImage(selectedIssue.id, formData);
        console.log('adminAPI upload response:', response);
        
        imagePath = response.resolutionImage;
        uploadSuccessful = true;
        
      } catch (apiError) {
        console.log('adminAPI failed, trying direct fetch method:', apiError);
        
        // Second try: Use direct fetch as fallback
        try {
          const token = localStorage.getItem('token');
          const response = await fetch(`http://localhost:5000/api/admin/reports/${selectedIssue.id}/resolution-image`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
            },
            body: formData,
          });
          
          const data = await response.json();
          
          if (!response.ok) {
            throw new Error(data.message || 'Upload failed');
          }
          
          console.log('Direct fetch upload successful:', data);
          imagePath = data.resolutionImage;
          uploadSuccessful = true;
          
        } catch (fetchError) {
          console.log('Direct fetch also failed, using demo mode:', fetchError);
          
          // Final fallback: Demo mode
          imagePath = `/uploads/resolutions/demo-${Date.now()}.jpg`;
          alert('Image uploaded in demo mode (backend might be down)');
        }
      }
      
      console.log('Final image path to be stored:', imagePath);
      
      // Create the full URL for the image preview
      const fullImageUrl = `http://localhost:5000${imagePath}`;
      console.log('Full image URL:', fullImageUrl);
      
      // Update ALL state variables properly
      const updatedIssues = issues.map((issue) =>
        issue.id === selectedIssue.id
          ? { 
              ...issue, 
              resolutionImage: imagePath,
              resolvedAt: new Date().toISOString(),
              status: uploadSuccessful ? 'Resolved' : issue.status
            }
          : issue
      );
      
      // Update issues state
      setIssues(updatedIssues);
      
      // Update filteredIssues state
      setFilteredIssues(prevFiltered => 
        prevFiltered.map(issue => 
          issue.id === selectedIssue.id 
            ? { 
                ...issue, 
                resolutionImage: imagePath,
                resolvedAt: new Date().toISOString(),
                status: uploadSuccessful ? 'Resolved' : issue.status
              }
            : issue
        )
      );
      
      // Update selectedIssue state with the path (not full URL)
      setSelectedIssue({
        ...selectedIssue,
        resolutionImage: imagePath,
        resolvedAt: new Date().toISOString(),
        status: uploadSuccessful ? 'Resolved' : selectedIssue.status
      });
      
      // Set preview with full URL
      setResolutionImagePreview(fullImageUrl);
      
      if (uploadSuccessful) {
        alert(t.resolutionImageUpdated);
      }
      
      // Refresh the data to ensure consistency
      await refreshReportsData();
      
    } catch (error) {
      console.error('Final error in image upload:', error);
      alert(t.failedToUpdateImage + ': ' + (error.message || 'Unknown error'));
    } finally {
      setIsUpdatingImage(false);
    }
  };

  const handleProfileClick = () => {
    setActiveTab("profile");
  };

  const handleLogout = () => {
    navigate("/login");
  };

  const renderReports = () => (
    <section className="issues-section">
      <div className="section-header">
        <div>
          <h2>
            <i className="fas fa-clipboard-list"></i> {t.allReports}
          </h2>
          <p className="section-subtitle">
            {filteredIssues.length} {t.issuesFound}
            {filters.department !== "All" && ` ${t.in} ${filters.department}`}
            {filters.location !== "All" && ` ${t.at} ${filters.location}`}
          </p>
        </div>
        <div className="status-filter-mobile">
          <select value={filters.status} onChange={handleStatusChange}>
            <option value="All">{t.allStatuses}</option>
            <option value="Pending">{t.pending}</option>
            <option value="In Progress">{t.inProgress}</option>
            <option value="Resolved">{t.resolved}</option>
            <option value="Rejected">{t.rejected}</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading reports...</p>
        </div>
      ) : (
        <div className="issue-cards">
          {filteredIssues.length > 0 ? (
            filteredIssues.map((issue, index) => (
              <div 
                key={issue.id} 
                className="issue-card"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div 
                  className={`card-image-container ${flippedCards[issue.id] ? 'flipped' : ''}`}
                  onClick={() => issue.resolutionImage && handleImageFlip(issue.id)}
                  style={{ cursor: issue.resolutionImage ? 'pointer' : 'default' }}
                >
                  <div className="image-flipper">
                    {/* Before Image (Front) */}
                    <div className="image-side front">
                      <img src={issue.image} alt="Before" className="issue-image" />
                      <div className="image-label before-label">
                        <i className="fas fa-history"></i> {t.before}
                      </div>
                    </div>
                    
                    {/* After Image (Back) - Only show if resolution image exists */}
                    {issue.resolutionImage && (
                      <div className="image-side back">
                        <img 
                          src={`http://localhost:5000${issue.resolutionImage}`} 
                          alt="After" 
                          className="issue-image"
                          onError={(e) => {
                            e.target.src = issue.image;
                            e.target.classList.add('fallback-image');
                          }}
                        />
                        <div className="image-label after-label">
                          <i className="fas fa-check-circle"></i> {t.after}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Flip indicator */}
                  {issue.resolutionImage && (
                    <div className="flip-indicator">
                      <i className={`fas fa-${flippedCards[issue.id] ? 'undo' : 'exchange-alt'}`}></i>
                      {flippedCards[issue.id] ? t.showBefore : t.showAfter}
                    </div>
                  )}
                  
                  <span className={`status-badge ${issue.status.toLowerCase().replace(" ", "-")}`}>
                    {t[issue.status.toLowerCase().replace(" ", "")] || issue.status}
                  </span>
                  
                  {/* Show resolution days if resolved */}
                  {issue.status === "Resolved" && issue.resolutionDays && (
                    <span className="resolution-days-badge">
                      <i className="fas fa-clock"></i> {issue.resolutionDays} {t.days}
                    </span>
                  )}
                </div>
                <div className="card-content">
                  <h4>{issue.title}</h4>
                  <div className="meta-info">
                    <span className="location">
                      <i className="fas fa-map-marker-alt"></i> {issue.location}
                    </span>
                    <span className="votes">
                      <i className="fas fa-thumbs-up"></i> {issue.votes} {t.votes}
                    </span>
                    <span className="department">
                      <i className="fas fa-building"></i> {issue.department}
                    </span>
                  </div>
                  <div className="card-footer">
                    <span className="date">
                      <i className="far fa-calendar-alt"></i> {issue.date}
                    </span>
                    <button 
                      className="view-details-btn"
                      onClick={() => handleViewDetails(issue)}
                    >
                      {t.viewDetails}
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="no-results">
              <div className="no-results-content">
                <i className="fas fa-check-circle"></i>
                <h3>{t.noIssuesFound}</h3>
                <p>
                  {filters.department !== "All" || filters.location !== "All" 
                    ? `${t.noIssuesMatch} (${filters.department !== "All" ? filters.department : ""}${filters.department !== "All" && filters.location !== "All" ? ", " : ""}${filters.location !== "All" ? filters.location : ""})`
                    : t.noIssuesInSystem
                  }
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );

  const renderProfile = () => (
    <div className="profile-section">
      <h2>{t.adminProfile}</h2>
      {loading ? (
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading profile...</p>
        </div>
      ) : (
        <div className="profile-card">
          <div className="profile-header">
            <div className="avatar">
              {profile.profilePhoto ? (
                <img 
                  src={`http://localhost:5000${profile.profilePhoto}`} 
                  alt="Profile" 
                  className="profile-avatar-image"
                />
              ) : (
                <i className="fas fa-user-shield"></i>
              )}
            </div>
            <h3>{profile.name || profile.username}</h3>
            <p className="role">{profile.userType === 'admin' ? t.administrator : t.citizen}</p>
          </div>
          <div className="profile-details">
            <div className="detail-row">
              <span className="label">
                <i className="fas fa-user"></i> {t.username}:
              </span>
              <span className="value">{profile.username}</span>
            </div>
            <div className="detail-row">
              <span className="label">
                <i className="fas fa-envelope"></i> {t.email}:
              </span>
              <span className="value">{profile.email}</span>
            </div>
            <div className="detail-row">
              <span className="label">
                <i className="fas fa-phone"></i> {t.phone}:
              </span>
              <span className="value">{profile.phone || t.notProvided}</span>
            </div>
            <div className="detail-row">
              <span className="label">
                <i className="fas fa-building"></i> {t.department}:
              </span>
              <span className="value">
                {profile.department || t.notSpecified}
              </span>
            </div>
            <div className="detail-row">
              <span className="label">
                <i className="fas fa-map-marker-alt"></i> {t.location}:
              </span>
              <span className="value">{profile.location || t.notSpecified}</span>
            </div>
            <div className="detail-row">
              <span className="label">
                <i className="fas fa-id-card"></i> {t.userType}:
              </span>
              <span className="value">{profile.userType === 'admin' ? t.administrator : t.citizen}</span>
            </div>
          </div>
          <button
            className="edit-profile-btn"
            onClick={() => navigate("/profile")}
          >
            <i className="fas fa-edit"></i> {t.editProfile}
          </button>
        </div>
      )}
    </div>
  );

  return (
    <div className={`admin-dashboard ${isSidebarCollapsed ? 'sidebar-collapsed' : ''} ${isTamil ? 'tamil-language' : ''}`}>
      <header className="admin-header">
        <div className="header-left">
           <div className="logo" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
                <img
                  src={logo}
                  alt="City Logo"
                  className="logo-image"
                  width="40"
                  height="40"
                />
                <span className="logo-text">CitySuggestion</span>
              </div>
        </div>
        <nav className="admin-nav">
          <button
            className={activeTab === "reports" ? "active" : ""}
            onClick={() => setActiveTab("reports")}
          >
            <i className="fas fa-clipboard-list"></i>
            <span>{t.reports}</span>
          </button>
          <button
            className={activeTab === "profile" ? "active" : ""}
            onClick={handleProfileClick}
          >
            <i className="fas fa-user-cog"></i>
            <span>{t.profile}</span>
          </button>
          <button className="language-toggle" onClick={toggleLanguage}>
            <i className="fas fa-globe"></i>
            <span>{isTamil ? 'EN' : 'TA'}</span>
          </button>
          <button className="logout" onClick={handleLogout}>
            <i className="fas fa-sign-out-alt"></i>
            <span>{t.logout}</span>
          </button>
        </nav>
      </header>

      <div className="admin-content">
        <aside className="sidebar">
          <div className="admin-focus-card">
            <h3>
              <i className="fas fa-bullseye"></i> {t.myFocusArea}
            </h3>
            <div className="focus-details">
              <div className="focus-item">
                <div className="focus-icon">
                  <i className="fas fa-building"></i>
                </div>
                <div>
                  <h4>{t.department}</h4>
                  <p>{profile.department || "All"}</p>
                </div>
              </div>
              <div className="focus-item">
                <div className="focus-icon">
                  <i className="fas fa-map-marker-alt"></i>
                </div>
                <div>
                  <h4>{t.location}</h4>
                  <p>{profile.location || "All"}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="status-filter">
            <h4>
              <i className="fas fa-filter"></i> {t.filterByStatus}
            </h4>
            <select value={filters.status} onChange={handleStatusChange}>
              <option value="All">{t.allStatuses}</option>
              <option value="Pending">{t.pending}</option>
              <option value="In Progress">{t.inProgress}</option>
              <option value="Resolved">{t.resolved}</option>
              <option value="Rejected">{t.rejected}</option>
            </select>
          </div>

          <div className="stats-card">
            <h4>
              <i className="fas fa-chart-pie"></i> {t.quickStats}
            </h4>
            <div className="stats-grid">
              <div className="stat-item pending">
                <div className="stat-value">
                  {stats.pendingReports || 0}
                </div>
                <div className="stat-label">{t.pending}</div>
              </div>
              <div className="stat-item in-progress">
                <div className="stat-value">
                  {stats.inProgressReports || 0}
                </div>
                <div className="stat-label">{t.inProgress}</div>
              </div>
              <div className="stat-item resolved">
                <div className="stat-value">
                  {stats.resolvedReports || 0}
                </div>
                <div className="stat-label">{t.resolved}</div>
              </div>
            </div>
          </div>
        </aside>

        <main className="main-panel">
          {activeTab === "reports" ? renderReports() : renderProfile()}
        </main>
      </div>

      {/* Issue Details Modal */}
      {selectedIssue && (
        <div className={`modal-overlay ${isModalOpen ? "open" : ""}`}>
          <div className={`issue-details-modal ${isModalOpen ? "open" : ""}`}>
            <button className="close-modal-btn" onClick={handleCloseDetails}>
              <i className="fas fa-times"></i>
            </button>

            <div className="modal-header">
              <img
               src={selectedIssue.resolutionImage ? `http://localhost:5000${selectedIssue.resolutionImage}` : selectedIssue.image}
                alt="Issue"
                className="modal-header-image"
              />
              <div className="modal-header-content">
                <h3>{selectedIssue.title}</h3>
                <span
                  className={`status-badge ${selectedIssue.status
                    .toLowerCase()
                    .replace(" ", "-")}`}
                >
                  {t[selectedIssue.status.toLowerCase().replace(" ", "")] || selectedIssue.status}
                </span>
                {/* NEW: Show resolution days if resolved */}
                {selectedIssue.status === "Resolved" && selectedIssue.resolutionDays && (
                  <span className="resolution-days-badge">
                    <i className="fas fa-clock"></i> {t.resolved} {t.in} {selectedIssue.resolutionDays} {t.days}
                  </span>
                )}
              </div>
            </div>

            <div className="modal-content">
              <div className="details-grid">
                <div className="detail-item">
                  <span className="detail-label">
                    <i className="fas fa-map-marker-alt"></i> {t.location}:
                  </span>
                  <span className="detail-value">{selectedIssue.location}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">
                    <i className="fas fa-building"></i> {t.department}:
                  </span>
                  <span className="detail-value">
                    {selectedIssue.department}
                  </span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">
                    <i className="fas fa-calendar-alt"></i> {t.reported}:
                  </span>
                  <span className="detail-value">{selectedIssue.date}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">
                    <i className="fas fa-thumbs-up"></i> {t.votes}:
                  </span>
                  <span className="detail-value">{selectedIssue.votes}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">
                    <i className="fas fa-user"></i> {t.reportedBy}:
                  </span>
                  <span className="detail-value">{selectedIssue.userName}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">
                    <i className="fas fa-phone"></i> {t.contact}:
                  </span>
                  <span className="detail-value">{selectedIssue.userPhone || t.notProvided}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">
                    <i className="fas fa-envelope"></i> {t.email}:
                  </span>
                  <span className="detail-value">{selectedIssue.userEmail}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">
                    <i className="fas fa-exclamation-triangle"></i> {t.urgency}:
                  </span>
                  <span className="detail-value">{selectedIssue.urgency}</span>
                </div>
                {selectedIssue.landmark && (
                  <div className="detail-item">
                    <span className="detail-label">
                      <i className="fas fa-landmark"></i> {t.landmark}:
                    </span>
                    <span className="detail-value">{selectedIssue.landmark}</span>
                  </div>
                )}
              </div>

              <div className="description-section">
                <h4>
                  <i className="fas fa-align-left"></i> {t.description}
                </h4>
                <p>{selectedIssue.description}</p>
              </div>

              <div className="status-control">
                <label>
                  <i className="fas fa-sync-alt"></i> {t.updateStatus}:
                </label>
                <select
                  value={selectedIssue.status}
                  onChange={(e) =>
                    handleStatusUpdate(selectedIssue.id, e.target.value)
                  }
                >
                  <option value="Pending">{t.pending}</option>
                  <option value="In Progress">{t.inProgress}</option>
                  <option value="Resolved">{t.resolved}</option>
                  <option value="Rejected">{t.rejected}</option>
                </select>
              </div>

              {/* NEW: Days to Resolve Input - Separate from resolution details */}
              <div className="days-to-resolve-section">
                <h4>
                  <i className="fas fa-calendar-day"></i> {t.daysToResolve}
                </h4>
                <div className="form-group">
                  <input
                    type="number"
                    min="1"
                    value={resolutionDays}
                    onChange={(e) => setResolutionDays(e.target.value)}
                    placeholder={t.enterDays}
                  />
                  <button 
                    className="save-days-btn"
                    onClick={handleSubmitResolutionDays}
                    disabled={isUpdatingDays}
                  >
                    {isUpdatingDays ? (
                      <>
                        <i className="fas fa-spinner fa-spin"></i> {t.saving}
                      </>
                    ) : (
                      <>
                        <i className="fas fa-save"></i> {t.saveDays}
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* UPDATED: Resolution Details Section - Only for image */}
              {(selectedIssue.status === "Resolved" || selectedIssue.status === "In Progress") && (
                <div className="resolution-details-section">
                  <h4>
                    <i className="fas fa-check-circle"></i> {t.resolutionImage}
                  </h4>
                  
                  <div className="resolution-form">
                    <div className="form-group">
                      <label htmlFor="resolutionImage">
                        <i className="fas fa-camera"></i> {t.uploadResolutionImage}
                      </label>
                      <input
                        type="file"
                        id="resolutionImage"
                        accept="image/*"
                        onChange={handleResolutionImageChange}
                      />
                      {resolutionImagePreview && (
                        <div className="image-preview">
                          <img src={resolutionImagePreview} alt="Resolution preview" />
                          <button 
                            className="save-image-btn"
                            onClick={handleSubmitResolutionImage}
                            disabled={isUpdatingImage}
                          >
                            {isUpdatingImage ? (
                              <>
                                <i className="fas fa-spinner fa-spin"></i> {t.uploading}
                              </>
                            ) : (
                              <>
                                <i className="fas fa-upload"></i> {t.uploadImage}
                              </>
                            )}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Show existing resolution image if available - UPDATED with error handling */}
                  {selectedIssue.resolutionImage && (
                    <div className="existing-resolution-image">
                      <h5>{t.currentResolutionImage}:</h5>
                      <img 
                        src={`http://localhost:5000${selectedIssue.resolutionImage}`} 
                        alt="Resolution" 
                        onError={(e) => {
                          e.target.src = 'https://via.placeholder.com/300x200?text=Image+Not+Found';
                        }}
                      />
                    </div>
                  )}
                </div>
              )}

              <div className="comments-section">
                <h4>
                  <i className="fas fa-comments"></i> {t.comments}
                </h4>
                <div className="comments-list">
                  {selectedIssue.comments.length > 0 ? (
                    selectedIssue.comments.map((comment, index) => (
                      <div
                        key={index}
                        className={`comment ${comment.admin ? "admin-comment" : ""}`}
                      >
                        <p>{comment.text}</p>
                        <span className="comment-author">
                          {comment.admin ? (
                            <>
                              <i className="fas fa-user-shield"></i> {t.administrator}
                            </>
                          ) : (
                            t.citizen
                          )}
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="no-comments">
                      <i className="fas fa-comment-slash"></i> {t.noComments}
                    </div>
                  )}
                </div>
                <div className="add-comment">
                  <textarea
                    placeholder={t.addComment}
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                  />
                  <button onClick={handleAddComment}>
                    <i className="fas fa-paper-plane"></i> {t.postComment}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;