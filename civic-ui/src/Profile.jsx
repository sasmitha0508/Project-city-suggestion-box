import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Profile.css';

const ProfileSettings = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [isLoaded, setIsLoaded] = useState(false);

  // Sample departments for admin
  const departments = [
    'Road Damage',
    'Electricity',
    'Water Supply',
    'Pollution Control',
    'Public Safety',
    'Waste Management',
    'Urban Planning'
  ];

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    location: '',
    userType: '',
    department: '',
    profilePhoto: null,
    previewPhoto: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Get token from localStorage
  const getToken = () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setErrorMessage('No authentication token found. Please login again.');
      navigate('/login');
      return null;
    }
    return token;
  };

  // Load user data from API
  useEffect(() => {
    const loadUserData = async () => {
      try {
        const token = getToken();
        if (!token) return;
        
        const response = await fetch('http://localhost:5000/api/users/profile', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          if (response.status === 401) {
            localStorage.removeItem('token');
            setErrorMessage('Session expired. Please login again.');
            navigate('/login');
            return;
          }
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const userData = await response.json();
        
        setFormData(prev => ({
          ...prev,
          name: userData.name || userData.username || '',
          email: userData.email || '',
          phone: userData.phone || '',
          location: userData.location || '',
          userType: userData.userType || 'citizen',
          department: userData.department || '',
          previewPhoto: userData.profilePhoto ? `http://localhost:5000${userData.profilePhoto}` : ''
        }));
        
        setIsLoaded(true);
      } catch (error) {
        console.error('Error loading user data:', error);
        setErrorMessage('Failed to load profile data. Make sure the backend server is running.');
        setIsLoaded(true);
      }
    };

    loadUserData();
  }, [navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setErrorMessage('File size should be less than 2MB');
        return;
      }
      
      // Check if file is an image
      if (!file.type.match('image.*')) {
        setErrorMessage('Please select an image file (JPG, PNG, GIF)');
        return;
      }
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({
          ...prev,
          profilePhoto: file,
          previewPhoto: reader.result
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current.click();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const token = getToken();
      if (!token) return;
      
      // Create FormData for file upload
      const submitData = new FormData();
      submitData.append('name', formData.name);
      submitData.append('email', formData.email);
      submitData.append('phone', formData.phone);
      submitData.append('location', formData.location);
      submitData.append('userType', formData.userType);
      submitData.append('department', formData.department);
      
      if (formData.profilePhoto) {
        submitData.append('profilePhoto', formData.profilePhoto);
      }

      const response = await fetch('http://localhost:5000/api/users/profile', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: submitData
      });

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem('token');
          setErrorMessage('Session expired. Please login again.');
          navigate('/login');
          return;
        }
        
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      // Store admin profile data in localStorage for dashboard filtering
      if (formData.userType === 'admin') {
        const adminProfile = {
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          location: formData.location,
          department: formData.department,
          role: 'Administrator'
        };
        localStorage.setItem('adminProfile', JSON.stringify(adminProfile));
      }
      
      setSuccessMessage('Profile updated successfully!');
      
      setTimeout(() => {
        navigate(formData.userType === 'admin' ? '/admin-dashboard' : '/user-dashboard');
      }, 2000);
    } catch (error) {
      console.error('Error updating profile:', error);
      setErrorMessage(error.message || 'Failed to update profile. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const removeProfilePhoto = () => {
    setFormData(prev => ({
      ...prev,
      profilePhoto: null,
      previewPhoto: ''
    }));
  };

  return (
    <div className={`profile-page ${isLoaded ? 'loaded' : ''}`}>
      <div className="profile-settings-container">
        <div className="profile-settings-card">
          <div className="profile-header">
            <h2 className="profile-title">Profile Settings</h2>
            <p className="profile-subtitle">
              {formData.userType === 'admin' ? 'Administrator Profile' : 'Citizen Profile'}
            </p>
          </div>
          
          <form onSubmit={handleSubmit} className="profile-form">
            <div className="form-body">
              <div className="left-form">
                {errorMessage && (
                  <div className="error-message slide-in">
                    <svg className="error-icon" viewBox="0 0 20 20">
                      <path d="M10,1.5c-4.687,0-8.5,3.813-8.5,8.5s3.813,8.5,8.5,8.5s8.5-3.813,8.5-8.5S14.687,1.5,10,1.5z M10,17.5c-4.136,0-7.5-3.364-7.5-7.5S5.864,2.5,10,2.5s7.5,3.364,7.5-7.5S14.136,17.5,10,17.5z M10,5.5c-0.552,0-1,0.448-1,1v5c0,0.552,0.448,1,1,1s1-0.448,1-1v-5C11,5.948,10.552,5.5,10,5.5z M10,14.5c-0.552,0-1,0.448-1,1s0.448,1,1,1s1-0.448,1-1S10.552,14.5,10,14.5z"></path>
                    </svg>
                    {errorMessage}
                  </div>
                )}
                
                <div className="form-group floating-label">
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    placeholder=" "
                  />
                  <label htmlFor="name">Full Name</label>
                  <div className="underline"></div>
                </div>

                <div className="form-group floating-label">
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    placeholder=" "
                  />
                  <label htmlFor="email">Email Address</label>
                  <div className="underline"></div>
                </div>

                <div className="form-group floating-label">
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder=" "
                  />
                  <label htmlFor="phone">Phone Number</label>
                  <div className="underline"></div>
                </div>

                <div className="form-group floating-label">
                  <input
                    type="text"
                    id="location"
                    name="location"
                    value={formData.location}
                    onChange={handleChange}
                    placeholder=" "
                  />
                  <label htmlFor="location">Location/Address</label>
                  <div className="underline"></div>
                </div>

                {formData.userType === 'admin' && (
                  <div className="form-group select-group">
                    <label htmlFor="department">Department</label>
                    <select
                      id="department"
                      name="department"
                      value={formData.department}
                      onChange={handleChange}
                      className="styled-select"
                      required
                    >
                      <option value="">Select Department</option>
                      {departments.map((dept, index) => (
                        <option key={index} value={dept}>{dept}</option>
                      ))}
                    </select>
                    <div className="select-arrow"></div>
                  </div>
                )}

                <div className="form-group select-group">
                  <label htmlFor="userType">Account Type</label>
                    <select
                      id="userType"
                      name="userType"
                      value={formData.userType}
                      onChange={handleChange}
                      className="styled-select"
                    >
                      <option value="citizen">Citizen</option>
                      <option value="admin">Administrator</option>
                    </select>
                  <div className="select-arrow"></div>
                </div>

                <button
                  type="submit"
                  className="save-button"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <span className="button-spinner"></span> Saving...
                    </>
                  ) : (
                    'Save Changes'
                  )}
                </button>

                {successMessage && (
                  <div className="success-message slide-in">
                    <svg className="success-icon" viewBox="0 0 20 20">
                      <path d="M7.629,14.566c0.125,0.125,0.291,0.188,0.456,0.188c0.164,0,0.329-0.062,0.456-0.188l8.219-8.221c0.252-0.252,0.252-0.659,0-0.911c-0.252-0.252-0.659-0.252-0.911,0l-7.764,7.763L4.152,9.267c-0.252-0.251-0.66-0.251-0.911,0c-0.252,0.252-0.252,0.66,0,0.911L7.629,14.566z"></path>
                    </svg>
                    {successMessage}
                  </div>
                )}
              </div>

              <div className="photo-upload-container">
                <div className="profile-photo-wrapper" onClick={triggerFileInput}>
                  {formData.previewPhoto ? (
                    <img 
                      src={formData.previewPhoto} 
                      alt="Profile" 
                      className="profile-photo" 
                    />
                  ) : (
                    <div className="profile-photo-placeholder">
                      <svg className="user-icon" viewBox="0 0 20 20">
                        <path d="M10,10c-2.757,0-5-2.243-5-5s2.243-5,5-5s5,2.243,5,5S12.757,10,10,10z M10,2c-1.654,0-3,1.346-3,3s1.346,3,3,3s3-1.346,3-3S11.654,2,10,2z M16,20H4v-2c0-2.757,2.243-5,5-5h2c2.757,0,5,2.243,5,5V20z M11,13H9c-1.654,0-3,1.346-3,3v1h8v-1C14,14.346,12.654,13,11,13z"></path>
                      </svg>
                    </div>
                  )}
                  <div className="photo-upload-overlay">
                    <svg className="camera-icon" viewBox="0 0 20 20">
                      <path d="M9.5,3C7.567,3,6,4.567,6,6.5v7c0,1.933,1.567,3.5,3.5,3.5h5c1.933,0,3.5-1.567,3.5-3.5v-7C18,4.567,16.433,3,14.5,3H9.5z M12,6.5c0.828,0,1.5,0.672,1.5,1.5s-0.672,1.5-1.5,1.5s-1.5-0.672-1.5-1.5S11.172,6.5,12,6.5z M12,5c-1.657,0-3,1.343-3,3s1.343,3,3,3s3-1.343,3-3S13.657,5,12,5z"></path>
                    </svg>
                    <span>Change Photo</span>
                  </div>
                </div>
                
                {formData.previewPhoto && (
                  <button 
                    type="button" 
                    className="remove-photo-button"
                    onClick={removeProfilePhoto}
                  >
                    Remove Photo
                  </button>
                )}
                
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handlePhotoChange}
                  accept="image/*"
                  className="hidden-file-input"
                />
                <p className="photo-upload-hint">JPG, GIF or PNG. Max size 2MB</p>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export const loadAdminProfile = () => {
  const savedProfile = localStorage.getItem('adminProfile');
  return savedProfile ? JSON.parse(savedProfile) : {
    name: 'Admin User',
    email: 'admin@citysuggestionbox.com',
    phone: '(555) 123-4567',
    location: 'All',
    department: 'All',
    role: 'Administrator'
  };
};

export default ProfileSettings;