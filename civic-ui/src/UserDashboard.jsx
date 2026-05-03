import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaHome, FaSignOutAlt, FaPlus, FaFilter, FaThumbsUp, FaEye, FaMapMarkerAlt, FaTag, FaCalendarAlt, FaEnvelope, FaPhone, FaUserTag, FaUserShield, FaPencilAlt, FaTimes, FaInfoCircle, FaSync, FaUser, FaClock, FaCamera, FaGlobe, FaExchangeAlt } from 'react-icons/fa';
import { reportAPI, userAPI } from './services/api';
import { useLanguage } from './contexts/LanguageContext';
import { translations, getCategoryTranslation, getStatusTranslation } from './translations/languages';
import './UserDashboard.css';
import logo from './assets/logo2.png';

const UserDashboard = () => {
  const navigate = useNavigate();
  const { language, toggleLanguage, isTamil } = useLanguage();
  const [issues, setIssues] = useState([]);
  const [filters, setFilters] = useState({
    category: '',
    status: '',
    sort: 'votes'
  });
  const [selectedIssue, setSelectedIssue] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showLogoutSuccess, setShowLogoutSuccess] = useState(false);
  const [activeView, setActiveView] = useState('reports');
  const [profile, setProfile] = useState({
    name: '',
    email: '',
    phone: '',
    userType: '',
    accountType: 'User',
    reportsSubmitted: 0,
    issuesVoted: 0,
    profileImage: 'https://randomuser.me/api/portraits/women/44.jpg'
  });
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState('');
  const [resolutionImagePreview, setResolutionImagePreview] = useState(null);
  const [flippedCards, setFlippedCards] = useState({});
  
  // Store scroll position before language change
  const scrollPositionRef = useRef(0);

  // Force LTR direction for Tamil language
  useEffect(() => {
    if (isTamil) {
      document.documentElement.setAttribute('dir', 'ltr');
      document.body.classList.add('tamil-ltr');
    } else {
      document.documentElement.removeAttribute('dir');
      document.body.classList.remove('tamil-ltr');
    }
    
    return () => {
      document.documentElement.removeAttribute('dir');
      document.body.classList.remove('tamil-ltr');
    };
  }, [isTamil]);

  // Translation function
  const t = (key, params = {}) => {
    let translation = translations[language][key] || translations['en'][key] || key;
    
    // Replace placeholders with actual values
    Object.keys(params).forEach(param => {
      translation = translation.replace(`{${param}}`, params[param]);
    });
    
    // Handle pluralization
    if (params.count !== undefined && params.s !== undefined) {
      translation = translation.replace('{s}', params.count === 1 ? '' : 's');
    }
    
    return translation;
  };

  // Store scroll position before language change
  const handleLanguageToggle = () => {
    // Save current scroll position
    scrollPositionRef.current = window.scrollY || document.documentElement.scrollTop;
    
    // Toggle language
    toggleLanguage();
  };

  // Restore scroll position after language change
  useEffect(() => {
    // Restore scroll position after language change
    if (scrollPositionRef.current > 0) {
      window.scrollTo(0, scrollPositionRef.current);
    }
  }, [language]);

  // Fetch data on component mount
  useEffect(() => {
    fetchData();
  }, []);

  // Debug profile state changes
  useEffect(() => {
    console.log('Current profile state:', profile);
    
    // Check if user is admin and redirect to admin dashboard
    if (profile.userType === 'Admin' || profile.accountType === 'Admin') {
      console.log('User is admin, redirecting to admin dashboard');
      navigate('/admin-dashboard');
    }
  }, [profile, navigate]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setApiError('');
      
      console.log('Fetching user data...');
      
      // Fetch all reports and profile data
      const [reportsData, userProfileData] = await Promise.all([
        reportAPI.getAllReports(),
        userAPI.getProfile()
      ]);

      console.log('All reports data from API:', reportsData);
      console.log('Profile data from API:', userProfileData);

      // Transform API data to match your component structure
      const transformedIssues = Array.isArray(reportsData) ? reportsData.map(report => ({
        id: report._id || report.id || Math.random().toString(36).substr(2, 9),
        title: report.title || 'Untitled Report',
        location: report.location || t('locationNotSpecified'),
        category: report.category || t('uncategorized'),
        votes: report.votes ? (Array.isArray(report.votes) ? report.votes.length : parseInt(report.votes) || 0) : 0,
        status: report.status || t('open'),
        description: report.description || t('noDescription'),
        dateReported: report.createdAt ? new Date(report.createdAt).toLocaleDateString() : new Date().toLocaleDateString(),
        image: (report.images && report.images.length > 0) 
          ? `http://localhost:5000${report.images[0]}` 
          : (report.image || 'https://via.placeholder.com/300x200?text=No+Image'),
        userVoted: report.votes ? report.votes.includes(userProfileData._id || userProfileData.id) : false,
        userName: report.userId?.name || t('unknownUser'),
        userEmail: report.userId?.email || t('noEmail'),
        resolutionDays: report.resolutionDays || null,
        resolutionImage: report.resolutionImage || null,
        resolvedAt: report.resolvedAt || null
      })) : [];

      console.log('Transformed issues:', transformedIssues);
      setIssues(transformedIssues);
      
      // Set user profile data
      setProfile({
        name: userProfileData.name || userProfileData.username || 'User',
        email: userProfileData.email || t('noEmail'),
        phone: userProfileData.phone || t('notProvided'),
        userType: userProfileData.userType === 'admin' ? t('admin') : t('standardUser'),
        accountType: userProfileData.userType === 'admin' ? t('admin') : t('standardUser'),
        reportsSubmitted: Array.isArray(reportsData) ? reportsData.filter(report => 
          report.userId && report.userId._id === (userProfileData._id || userProfileData.id)
        ).length : 0,
        issuesVoted: userProfileData.votes ? (Array.isArray(userProfileData.votes) ? userProfileData.votes.length : parseInt(userProfileData.votes) || 0) : 0,
        profileImage: userProfileData.profilePhoto 
          ? `http://localhost:5000${userProfileData.profilePhoto}` 
          : (userProfileData.profileImage || 'https://randomuser.me/api/portraits/women/44.jpg')
      });
    } catch (error) {
      console.error('Error fetching data:', error);
      setApiError(t('failedToLoad'));
      
     console.log('Using sample data:', sampleIssues);
      setIssues(sampleIssues);
      setProfile(prev => ({
        ...prev,
        reportsSubmitted: 2,
        name: 'Demo User',
        email: 'user@example.com',
        userType: t('standardUser')
      }));
    } finally {
      setLoading(false);
    }
  };

  const handleGoToHome = () => {
    navigate('/');
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setShowLogoutSuccess(true);
    setTimeout(() => {
      navigate('/');
    }, 2000);
  };

  const handleSubmitReport = () => {
    navigate('/report-form');
  };

  const handleViewDetails = (issue) => {
    const detailedIssue = {
      ...issue,
      landmark: issue.landmark || t('notProvided'),
      urgency: issue.urgency || 'Medium',
      assignedTo: issue.assignedTo || t('notProvided'),
      coordinates: issue.coordinates || t('notAvailable')
    };
    
    setSelectedIssue(detailedIssue);
    setShowModal(true);
    
    // Set resolution image preview if available
    if (detailedIssue.resolutionImage) {
      setResolutionImagePreview(`http://localhost:5000${detailedIssue.resolutionImage}`);
    } else {
      setResolutionImagePreview(null);
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setTimeout(() => setSelectedIssue(null), 300);
    setResolutionImagePreview(null);
  };

  const handleVote = async (issueId) => {
    try {
      console.log('Attempting to vote on issue:', issueId);
      
      // Try to call the API first
      try {
        const response = await reportAPI.voteOnReport(issueId);
        console.log('Vote API response:', response);
      } catch (error) {
        console.log('API vote failed, using local update:', error);
      }
      
      // Update the issues list with new vote data
      setIssues(issues.map(issue => {
        if (issue.id === issueId) {
          const newVotes = issue.userVoted ? issue.votes - 1 : issue.votes + 1;
          return {
            ...issue,
            votes: newVotes,
            userVoted: !issue.userVoted
          };
        }
        return issue;
      }));
      
      // Also update the selected issue if it's the one being voted on
      if (selectedIssue && selectedIssue.id === issueId) {
        setSelectedIssue({
          ...selectedIssue,
          votes: selectedIssue.userVoted ? selectedIssue.votes - 1 : selectedIssue.votes + 1,
          userVoted: !selectedIssue.userVoted
        });
      }
      
      // Update profile vote count
      setProfile(prev => ({
        ...prev,
        issuesVoted: prev.issuesVoted + (selectedIssue && selectedIssue.id === issueId && !selectedIssue.userVoted ? 1 : -1)
      }));
    } catch (error) {
      console.error('Error voting:', error);
      alert('Failed to vote on issue. Please try again.');
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters({
      ...filters,
      [name]: value
    });
  };

  const handleViewProfile = async () => {
    try {
      // Refresh profile data when switching to profile view
      const userProfileData = await userAPI.getProfile();
      console.log('Refreshed profile data:', userProfileData);
      
      const userData = userProfileData.user || userProfileData;
      setProfile(prev => ({
        ...prev,
        name: userData.name || userData.username || 'User',
        email: userData.email || t('noEmail'),
        phone: userData.phone || t('notProvided'),
        userType: userData.userType === 'admin' ? t('admin') : t('standardUser'),
        accountType: userData.userType === 'admin' ? t('admin') : t('standardUser'),
        profileImage: userData.profilePhoto 
          ? `http://localhost:5000${userData.profilePhoto}` 
          : (userData.profileImage || prev.profileImage)
      }));
      
      setActiveView('profile');
    } catch (error) {
      console.error('Error refreshing profile:', error);
      setActiveView('profile');
    }
  };

  const handleViewReports = () => {
    setActiveView('reports');
  };

  const handleEditProfile = () => {
    navigate('/profile');
  };

  // Toggle image flip for before/after view
  const toggleImageFlip = (issueId, e) => {
    e.stopPropagation(); // Prevent triggering the view details click
    setFlippedCards(prev => ({
      ...prev,
      [issueId]: !prev[issueId]
    }));
  };

  const filteredIssues = issues
    .filter(issue => 
      (filters.category === '' || issue.category === filters.category) &&
      (filters.status === '' || issue.status === filters.status)
    )
    .sort((a, b) => {
      if (filters.sort === 'votes') return b.votes - a.votes;
      if (filters.sort === 'newest') return new Date(b.dateReported) - new Date(a.dateReported);
      if (filters.sort === 'oldest') return new Date(a.dateReported) - new Date(b.dateReported);
      return 0;
    });

  if (loading || profile.userType === t('admin') || profile.accountType === t('admin')) {
    return (
      <div className="dashboard">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>{t('loadingDashboard')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`dashboard ${isTamil ? 'tamil-ltr' : ''}`}>
      {showLogoutSuccess && (
        <div className="logout-success-message show">
          <FaSignOutAlt className="message-icon" />
          {t('logoutSuccess')}
        </div>
      )}

      {apiError && (
        <div className="api-error-message">
          <span className="error-icon">⚠️</span>
          {apiError}
          <button onClick={fetchData} className="retry-button">
            <FaSync /> {t('retry')}
          </button>
        </div>
      )}

      <header className="dashboard-header">
        <div className="logo-container">
            <img
            src={logo}
            alt="City Logo"
            className="logo-image"
            width="40"
            height="40"
          />
          <h1 className="logo-text">{t('logoText')}</h1>
        </div>
        <nav className="nav-links">
          <button className="nav-link" onClick={handleGoToHome}>
            <FaHome className="nav-icon" /> {t('home')}
          </button>
          <button 
            className={`nav-link ${activeView === 'reports' ? 'active' : ''}`}
            onClick={handleViewReports}
          >
            <FaFilter className="nav-icon" /> {t('reports')}
          </button>
          <button 
            className={`nav-link ${activeView === 'profile' ? 'active' : ''}`}
            onClick={handleViewProfile}
          >
            <FaUserTag className="nav-icon" /> {t('profile')}
          </button>
          <button className="language-toggle-button" onClick={handleLanguageToggle}>
            {isTamil ? 'EN' : 'தமிழ்'}
          </button>
          <button className="nav-link logout" onClick={handleLogout}>
            <FaSignOutAlt className="nav-icon" /> {t('logout')}
          </button>
        </nav>
      </header>

      <div className="dashboard-layout">
        {activeView === 'reports' && (
          <aside className="dashboard-sidebar">
            <div className="sidebar-section">
              <h3 className="sidebar-title">
                <FaFilter className="sidebar-icon" /> {t('dashboardFilters')}
              </h3>
              <div className="filter-group">
                <label htmlFor="category-filter">{t('category')}</label>
                <select 
                  id="category-filter" 
                  className="filter-select"
                  name="category"
                  value={filters.category}
                  onChange={handleFilterChange}
                >
                  <option value="">{t('selectCategory')}</option>
                  <option value="Drainage">{t('drainage')}</option>
                  <option value="Street Light">{t('streetLight')}</option>
                  <option value="Road Damage">{t('roadDamage')}</option>
                  <option value="Water Supply">{t('waterSupply')}</option>
                  <option value="Electricity">{t('electricity')}</option>
                  <option value="Garbage">{t('garbage')}</option>
                  <option value="Public Transport">{t('publicTransport')}</option>
                  <option value="Noise Pollution">{t('noisePollution')}</option>
                  <option value="Other">{t('other')}</option>
                </select>
              </div>
              
              <div className="filter-group">
                <label htmlFor="status-filter">{t('status')}</label>
                <select 
                  id="status-filter" 
                  className="filter-select"
                  name="status"
                  value={filters.status}
                  onChange={handleFilterChange}
                >
                  <option value="">{t('allStatuses')}</option>
                  <option value="Open">{t('open')}</option>
                  <option value="In Progress">{t('inProgress')}</option>
                  <option value="Resolved">{t('resolved')}</option>
                </select>
              </div>
              
              <div className="filter-group">
                <label htmlFor="sort-filter">{t('sortBy')}</label>
                <select 
                  id="sort-filter" 
                  className="filter-select"
                  name="sort"
                  value={filters.sort}
                  onChange={handleFilterChange}
                >
                  <option value="votes">{t('mostVoted')}</option>
                  <option value="newest">{t('newest')}</option>
                  <option value="oldest">{t('oldest')}</option>
                </select>
              </div>
            </div>
            
            <button 
              className="submit-button" 
              onClick={handleSubmitReport}
            >
              <FaPlus className="button-icon" /> {t('submitReport')}
            </button>
          </aside>
        )}

        <main className={`dashboard-content ${activeView === 'reports' ? 'scrollable' : ''}`}>
          {activeView === 'reports' ? (
            <>
              <h2 className="section-title">{t('communityIssues')}</h2>
              {filteredIssues.length === 0 ? (
                <div className="no-issues-message">
                  <p>{t('noIssues')}</p>
                  <button className="submit-report-btn" onClick={handleSubmitReport}>
                    <FaPlus /> {t('submitFirstReport')}
                  </button>
                </div>
              ) : (
                <>
                  <div className="issues-count">
                    {t('showingIssues', { count: filteredIssues.length, s: 's' })}
                  </div>
                  <div className="issues-grid">
                    {filteredIssues.map(issue => (
                      <div className="issue-card" key={issue.id} onClick={() => handleViewDetails(issue)}>
                        <div className={`card-image-container ${flippedCards[issue.id] ? 'flipped' : ''}`}>
                          <div className="image-flip-inner">
                            <div className="image-flip-front">
                              <img src={issue.image} alt={issue.title} className="card-image" />
                              <span className={`status-badge ${issue.status.toLowerCase().replace(' ', '-')}`}>
                                {getStatusTranslation(issue.status, language)}
                              </span>
                              {/* Resolution days badge */}
                              {issue.status === "Resolved" && issue.resolutionDays && (
                                <span className="resolution-days-badge">
                                  <FaClock className="badge-icon" /> {issue.resolutionDays} {t('days')}
                                </span>
                              )}
                              {/* Flip button for resolved issues with resolution image */}
                              {issue.status === "Resolved" && issue.resolutionImage && (
                                <button 
                                  className="flip-image-button"
                                  onClick={(e) => toggleImageFlip(issue.id, e)}
                                  title={t('flipImage')}
                                >
                                  <FaExchangeAlt />
                                </button>
                              )}
                            </div>
                            <div className="image-flip-back">
                              <img 
                                src={`http://localhost:5000${issue.resolutionImage}`} 
                                alt={`Resolution of ${issue.title}`} 
                                className="card-image" 
                              />
                              <span className="resolution-label">{t('After Image')}</span>
                              {/* Flip button */}
                              <button 
                                className="flip-image-button"
                                onClick={(e) => toggleImageFlip(issue.id, e)}
                                title={t('flipImage')}
                              >
                                <FaExchangeAlt />
                              </button>
                            </div>
                          </div>
                        </div>
                        
                        <div className="card-content">
                          <h3 className="card-title">{issue.title}</h3>
                          <div className="card-meta">
                            <span className="meta-item">
                              <FaMapMarkerAlt className="meta-icon" /> {issue.location}
                            </span>
                            <span className="meta-item">
                              <FaTag className="meta-icon" /> {getCategoryTranslation(issue.category, language)}
                            </span>
                            <span className="meta-item">
                              <FaCalendarAlt className="meta-icon" /> {issue.dateReported}
                            </span>
                            <span className="meta-item">
                              <FaUser className="meta-icon" /> {issue.userName}
                            </span>
                          </div>
                          
                          <div className="card-footer">
                            <button 
                              className={`vote-button ${issue.userVoted ? 'voted' : ''}`}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleVote(issue.id);
                              }}
                            >
                              <FaThumbsUp className={`vote-icon ${issue.userVoted ? 'bounce' : ''}`} />
                              <span className="vote-count">{issue.votes}</span>
                            </button>
                            
                            <button 
                              className="view-button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleViewDetails(issue);
                              }}
                            >
                              <FaEye className="button-icon" /> {t('details')}
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </>
          ) : (
            <div className="profile-view">
              <h2 className="section-title">{t('myProfile')}</h2>
              
              <div className="profile-card">
                <div className="profile-card-header">
                  <div className="profile-image-container">
                    <img 
                      src={profile.profileImage} 
                      alt="Profile" 
                      className="profile-image" 
                      onError={(e) => {
                        e.target.src = 'https://randomuser.me/api/portraits/women/44.jpg';
                      }}
                    />
                    <span className="account-type-badge">{profile.accountType}</span>
                  </div>
                  
                  <div className="profile-basic-info">
                    <h2 className="profile-name">{profile.name || 'User'}</h2>
                    <p className="profile-email">
                      <FaEnvelope className="profile-icon" /> {profile.email || t('noEmail')}
                    </p>
                    <p className="profile-phone">
                      <FaPhone className="profile-icon" /> {profile.phone || t('notProvided')}
                    </p>
                  </div>
                  
                  <a 
                    className="edit-profile-button"
                    onClick={handleEditProfile}
                  >
                    <FaPencilAlt />
                  </a>
                </div>
                
                <div className="profile-card-body">
                  <div className="profile-detail-item">
                    <div className="detail-icon">
                      <FaUserTag />
                    </div>
                    <div className="detail-content">
                      <h4>{t('userType')}</h4>
                      <p>{profile.userType || t('standardUser')}</p>
                    </div>
                  </div>
                  
                  <div className="profile-detail-item">
                    <div className="detail-icon">
                      <FaPlus />
                    </div>
                    <div className="detail-content">
                      <h4>{t('reportsSubmitted')}</h4>
                      <p>{profile.reportsSubmitted}</p>
                    </div>
                  </div>
                  
                  <div className="profile-detail-item">
                    <div className="detail-icon">
                      <FaThumbsUp />
                    </div>
                    <div className="detail-content">
                      <h4>{t('issuesVoted')}</h4>
                      <p>{profile.issuesVoted}</p>
                    </div>
                  </div>
                  
                  <div className="profile-detail-item">
                    <div className="detail-icon">
                      <FaUserShield />
                    </div>
                    <div className="detail-content">
                      <h4>{t('accountStatus')}</h4>
                      <p>{t('active')}</p>
                    </div>
                  </div>
                </div>
                
                <div className="profile-card-footer">
                  <button className="profile-action-button" onClick={handleEditProfile}>
                    <FaPencilAlt /> {t('editProfile')}
                  </button>
                  <button 
                    className="profile-action-button secondary" 
                    onClick={() => handleViewProfile()}
                    style={{marginLeft: '10px'}}
                  >
                    <FaSync /> {t('refreshData')}
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {selectedIssue && (
        <div className={`modal-overlay ${showModal ? 'show' : ''}`} onClick={closeModal}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{selectedIssue.title}</h2>
              <button className="modal-close" onClick={closeModal}>
                <FaTimes />
              </button>
            </div>
            
            <div className="modal-body">
              <div className="modal-image-container">
                <img src={selectedIssue.image} alt={selectedIssue.title} className="modal-image" />
              </div>
              
              <div className="modal-details-container">
                <div className="modal-details-grid">
                  <div className="detail-card">
                    <h3>{t('reportedBy')}</h3>
                    <p><FaUser className="detail-icon" /> {selectedIssue.userName}</p>
                    <p><FaEnvelope className="detail-icon" /> {selectedIssue.userEmail}</p>
                  </div>
                  <div className="detail-card">
                    <h3>{t('location')}</h3>
                    <p><FaMapMarkerAlt className="detail-icon" /> {selectedIssue.location}</p>
                  </div>
                  <div className="detail-card">
                    <h3>{t('category')}</h3>
                    <p><FaTag className="detail-icon" /> {getCategoryTranslation(selectedIssue.category, language)}</p>
                  </div>
                  <div className="detail-card">
                    <h3>{t('dateReported')}</h3>
                    <p><FaCalendarAlt className="detail-icon" /> {selectedIssue.dateReported}</p>
                  </div>
                  <div className="detail-card">
                    <h3>{t('votes')}</h3>
                    <p><FaThumbsUp className="detail-icon" /> {selectedIssue.votes}</p>
                  </div>
                  <div className="detail-card">
                    <h3>{t('status')}</h3>
                    <p><FaInfoCircle className="detail-icon" /> {getStatusTranslation(selectedIssue.status, language)}</p>
                  </div>
                  
                  {/* Resolution details */}
                  {selectedIssue.status === "Resolved" && selectedIssue.resolutionDays && (
                    <div className="detail-card">
                      <h3>{t('resolutionTime')}</h3>
                      <p><FaClock className="detail-icon" /> {selectedIssue.resolutionDays} {t('days')}</p>
                    </div>
                  )}
                </div>
                
                <div className="modal-description">
                  <h3><FaInfoCircle className="description-icon" /> {t('description')}</h3>
                  <p>{selectedIssue.description}</p>
                </div>

                {/* Resolution Image Section */}
                {selectedIssue.status === "Resolved" && (resolutionImagePreview || selectedIssue.resolutionImage) && (
                  <div className="resolution-image-section">
                    <h3><FaCamera className="description-icon" /> {t('resolutionImage')}</h3>
                    <div className="resolution-image-container">
                      <img 
                        src={resolutionImagePreview || `http://localhost:5000${selectedIssue.resolutionImage}`} 
                        alt="Resolution" 
                        className="resolution-image"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            <div className="modal-footer">
              <button 
                className={`vote-button ${selectedIssue.userVoted ? 'voted' : ''}`}
                onClick={() => {
                  handleVote(selectedIssue.id);
                  setTimeout(closeModal, 300);
                }}
              >
                <FaThumbsUp className="vote-icon" /> 
                {selectedIssue.userVoted ? t('voted') : t('vote')} ({selectedIssue.votes})
              </button>
            </div>
          </div>
        </div>
      )}

      <footer className="admin-footer">
        <div className="footer-content">
          <div className="footer-section">
            <h4>{t('contactUs')}</h4>
            <p>Email: <a href="mailto:info@citysuggestionbox.com">info@citysuggestionbox.com</a></p>
            <p>Phone: (555) 987-6543</p>
          </div>
          <div className="footer-section">
            <h4>{t('quickLinks')}</h4>
            <ul>
              <li><a href="#">{t('privacyPolicy')}</a></li>
              <li><a href="#">{t('termsOfService')}</a></li>
              <li><a href="#">{t('helpCenter')}</a></li>
            </ul>
          </div>
          <div className="footer-section">
            <h4>{t('about')}</h4>
            <p>City Suggestion Box Admin Portal v1.0</p>
            <p>© 2024 City Corporation. {t('rightsReserved')}</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default UserDashboard;