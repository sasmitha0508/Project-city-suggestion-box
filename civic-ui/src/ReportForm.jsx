import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-control-geocoder/dist/Control.Geocoder.css"; 
import "leaflet-control-geocoder"; 
import "./ReportForm.css";
import { reportAPI } from './services/api';
import { useLanguage } from './contexts/LanguageContext';
import { en } from './translations/en';
import { ta } from './translations/ta';

// Fix for default markers in Leaflet
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

// Custom marker icon
const customIcon = L.divIcon({
  className: 'map-marker',
  html: `
    <div class="marker-pulse"></div>
    <div class="marker-pin">
      <i class="fas fa-map-marker-alt"></i>
    </div>
  `,
  iconSize: [30, 42],
  iconAnchor: [15, 42]
});

// Current location marker icon
const currentLocationIcon = L.divIcon({
  className: 'current-location-marker',
  html: `
    <div class="current-location-pulse"></div>
    <div class="current-location-pin">
      <i class="fas fa-crosshairs"></i>
    </div>
  `,
  iconSize: [30, 42],
  iconAnchor: [15, 42]
});

// Fix for default markers in Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

function ReportForm() {
  const mapRef = useRef(null);
  const mapContainerRef = useRef(null);
  const markerRef = useRef(null);
  const currentLocationMarkerRef = useRef(null);
  const formRef = useRef(null);
  const [location, setLocation] = useState("");
  const [latlng, setLatlng] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [activeSection, setActiveSection] = useState(0);
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [manualLocationInput, setManualLocationInput] = useState("");
  const [isLocating, setIsLocating] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "",
    urgency: "",
    name: "",
    phone: "",
    email: "",
    landmark: ""
  });
  const navigate = useNavigate();
  const { language, toggleLanguage, isTamil } = useLanguage();
  
  // Get translations based on current language
  const t = language === 'ta' ? ta : en;

  // Google Maps API Key
  const GOOGLE_MAPS_API_KEY = "AIzaSyDdLWu4QwxrMqBePqnlcQL0TWD5nxca3vo";

  // Initialize map when component mounts
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;
    
    // Ensure the map container has proper dimensions
    const mapContainer = mapContainerRef.current;
    mapContainer.style.height = '400px';
    mapContainer.style.width = '100%';
    
    const map = L.map(mapContainer, {
      zoomControl: false,
      fadeAnimation: true,
      zoomAnimation: true
    }).setView([11.0168, 76.9558], 12);
    
    mapRef.current = map;

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      detectRetina: true
    }).addTo(map);

    // Add zoom control with custom position
    L.control.zoom({
      position: 'topright'
    }).addTo(map);

    const geocoder = L.Control.geocoder({
      defaultMarkGeocode: false,
      placeholder: isTamil ? "இடத்தைத் தேடுங்கள்..." : "Search location...",
      errorMessage: isTamil ? "இடம் கிடைக்கவில்லை" : "Location not found",
      suggestTimeout: 200,
      keepOpen: false,
      collapsed: true,
      position: 'topright'
    })
      .on("markgeocode", function (e) {
        const center = e.geocode.center;
        updateMapLocation(center, e.geocode.name);
      })
      .addTo(map);

    // Add custom locate control
    const locateControl = L.control({position: 'topright'});
    locateControl.onAdd = function(map) {
      const div = L.DomUtil.create('div', 'leaflet-bar leaflet-control');
      const link = L.DomUtil.create('a', 'leaflet-control-locate', div);
      link.href = '#';
      link.title = isTamil ? "எனது இடத்தைக் காட்டு" : "Show my location";
      link.innerHTML = '<i class="fas fa-crosshairs"></i>';
      
      L.DomEvent.on(link, 'click', function(e) {
        L.DomEvent.stopPropagation(e);
        L.DomEvent.preventDefault(e);
        getCurrentLocation();
      });
      
      return div;
    };
    locateControl.addTo(map);

    map.on("click", async (e) => {
      const { lat, lng } = e.latlng;
      
      try {
        // Use Google Maps API for reverse geocoding with the provided API key
        const res = await fetch(
          `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${GOOGLE_MAPS_API_KEY}`
        );
        const data = await res.json();

        if (data.status === "OK" && data.results.length > 0) {
          const name = data.results[0].formatted_address;
          updateMapLocation([lat, lng], name);
        } else {
          updateMapLocation([lat, lng], t.couldNotFetchLocation);
        }
      } catch (error) {
        console.error("Reverse geocoding failed", error);
        updateMapLocation([lat, lng], t.couldNotFetchLocation);
      }
    });

    // Add map loaded event
    map.whenReady(() => {
      setIsMapLoaded(true);
    });

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [isTamil, t]);

  // Update map location with marker
  const updateMapLocation = (coords, locationName, isCurrentLocation = false) => {
    const map = mapRef.current;
    if (!map) return;

    map.setView(coords, 16);

    // Remove existing marker
    if (markerRef.current) {
      map.removeLayer(markerRef.current);
    }

    // Remove current location marker if adding a new regular marker
    if (!isCurrentLocation && currentLocationMarkerRef.current) {
      map.removeLayer(currentLocationMarkerRef.current);
      currentLocationMarkerRef.current = null;
    }

    // Create new marker
    const newMarker = L.marker(coords, { 
      icon: isCurrentLocation ? currentLocationIcon : customIcon 
    }).addTo(map);
    
    newMarker
      .bindPopup(
        `<div class="map-popup">
          <b>${t.selectedLocationPopup}</b><br>
          ${locationName}<br>
          <a href='https://www.google.com/maps?q=&layer=c&cbll=${coords[0]},${coords[1]}' target='_blank'>
            <i class="fas fa-street-view"></i> ${t.viewStreetView}
          </a>
        </div>`,
        { className: 'custom-popup' }
      )
      .openPopup();

    if (isCurrentLocation) {
      currentLocationMarkerRef.current = newMarker;
    } else {
      markerRef.current = newMarker;
    }
    
    setLocation(locationName);
    setLatlng([coords[0], coords[1]]);
  };

  // Get current location
  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert(t.geolocationError);
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        updateMapLocation([latitude, longitude], t.yourCurrentLocation, true);
        setIsLocating(false);
      },
      (error) => {
        setIsLocating(false);
        alert(t.locationError + error.message);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  };

  // Search for location by address
  const searchLocation = async () => {
    if (!manualLocationInput.trim()) {
      alert(t.enterLocation);
      return;
    }

    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(manualLocationInput)}&key=${GOOGLE_MAPS_API_KEY}`
      );
      const data = await response.json();

      if (data.status === "OK" && data.results.length > 0) {
        const location = data.results[0];
        const coords = [
          location.geometry.location.lat,
          location.geometry.location.lng
        ];
        updateMapLocation(coords, location.formatted_address);
      } else {
        alert(t.locationNotFound);
      }
    } catch (error) {
      console.error("Geocoding error:", error);
      alert(t.geocodingError);
    }
  };

  // Handle map visibility when section changes
  useEffect(() => {
    if (!mapRef.current || !mapContainerRef.current) return;

    if (activeSection === 2) {
      // Small delay to ensure the container is visible before invalidating size
      setTimeout(() => {
        if (mapRef.current) {
          mapRef.current.invalidateSize(true);
          
          // Reset the view to ensure proper rendering
          if (latlng) {
            mapRef.current.setView(latlng, 16);
          } else {
            mapRef.current.setView([11.0168, 76.9558], 12);
          }
        }
      }, 50);
    }
  }, [activeSection, latlng]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files);
    if (files.length + uploadedFiles.length > 5) {
      alert(t.maxFilesError);
      return;
    }
    setUploadedFiles([...uploadedFiles, ...files]);
  };

  const removeFile = (index) => {
    const newFiles = [...uploadedFiles];
    newFiles.splice(index, 1);
    setUploadedFiles(newFiles);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate required fields
    if (!formData.title || !formData.description || !formData.category || 
        !formData.urgency || !formData.phone || !location || !latlng || uploadedFiles.length === 0) {
      alert(t.fillAllRequired);
      return;
    }
    
    // Validate coordinates specifically
    if (!latlng || latlng.length !== 2) {
      alert(t.selectLocation);
      setActiveSection(2);
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Create FormData object
      const submitData = new FormData();
      
      // Append all form data
      submitData.append('title', formData.title);
      submitData.append('description', formData.description);
      submitData.append('category', formData.category);
      submitData.append('urgency', formData.urgency);
      submitData.append('name', formData.name);
      submitData.append('phone', formData.phone);
      submitData.append('email', formData.email);
      submitData.append('landmark', formData.landmark);
      submitData.append('location', location);
      
      // Append coordinates correctly (not as JSON string)
      submitData.append('coordinates[lat]', latlng[0]);
      submitData.append('coordinates[lng]', latlng[1]);
      
      // Append all uploaded files
      uploadedFiles.forEach((file, index) => {
        submitData.append('images', file);
      });
      
      // Submit to backend
      const response = await reportAPI.submitReport(submitData);
      
      // Show success animation
      document.querySelector('.report-form-container').classList.add('submit-success');
      
      // Navigate after animation
      setTimeout(() => {
        navigate('/user-dashboard');
        
        // Reset form
        formRef.current.reset();
        setFormData({
          title: "",
          description: "",
          category: "",
          urgency: "",
          name: "",
          phone: "",
          email: "",
          landmark: ""
        });
        setLocation('');
        setLatlng(null);
        setUploadedFiles([]);
        setManualLocationInput("");
        if (markerRef.current && mapRef.current) {
          mapRef.current.removeLayer(markerRef.current);
        }
        if (currentLocationMarkerRef.current && mapRef.current) {
          mapRef.current.removeLayer(currentLocationMarkerRef.current);
        }
      }, 2000);
      
    } catch (error) {
      console.error('Submission error:', error);
      alert(error.error || 'Failed to submit report. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const nextSection = () => {
    // Validate current section before proceeding
    if (activeSection === 0) {
      if (!formData.title || !formData.description || !formData.category || !formData.urgency) {
        alert(t.fillRequired);
        return;
      }
    } else if (activeSection === 1) {
      if (!formData.phone) {
        alert(t.providePhone);
        return;
      }
    } else if (activeSection === 2) {
      if (!location) {
        alert(t.selectLocation);
        return;
      }
    }
    
    setActiveSection(prev => Math.min(prev + 1, 3));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const prevSection = () => {
    setActiveSection(prev => Math.max(prev - 1, 0));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="report-form-container">
      <div className="language-switcher">
        <button 
          onClick={toggleLanguage} 
          className={`language-btn ${isTamil ? 'active' : ''}`}
          title={isTamil ? "Switch to English" : "தமிழில் மாற்றுக"}
        >
          {isTamil ? 'EN' : 'தமிழ்'}
        </button>
      </div>
      
      <div className="form-header">
        <div className="header-content">
          <h1 className="header-title">
            <span className="header-icon">
              <i className="fas fa-bullhorn"></i>
            </span>
            {t.reportPublicIssue}
          </h1>
          <p className="header-subtitle">
            {t.helpImprove}
          </p>
          
          <div className="progress-container">
            <div className="progress-bar">
              <div 
                className="progress" 
                style={{ width: `${(activeSection + 1) * 25}%` }}
              ></div>
            </div>
            <div className="progress-steps">
              {[1, 2, 3, 4].map((step) => (
                <div 
                  key={step} 
                  className={`progress-step ${activeSection >= step - 1 ? 'active' : ''}`}
                >
                  <div className="step-number">{step}</div>
                  <div className="step-label">
                    {step === 1 && t.details}
                    {step === 2 && t.contact}
                    {step === 3 && t.location}
                    {step === 4 && t.media}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      
      <div className="form-wrapper">
        <div className="form-decoration">
          <div className="decoration-circle circle-1"></div>
          <div className="decoration-circle circle-2"></div>
          <div className="decoration-circle circle-3"></div>
        </div>
        
        <form ref={formRef} onSubmit={handleSubmit} className="report-form">
          {/* Success message overlay */}
          <div className="submit-overlay">
            <div className="success-animation">
              <svg className="checkmark" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52">
                <circle className="checkmark__circle" cx="26" cy="26" r="25" fill="none"/>
                <path className="checkmark__check" fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8"/>
              </svg>
              <h3>{t.successTitle}</h3>
              <p>{t.successMessage}</p>
            </div>
          </div>
          
          <div className={`form-section ${activeSection === 0 ? 'active' : ''}`}>
            <div className="section-header">
              <h2 className="section-title">
                <span className="step-number">1</span>
                {t.issueDetails}
              </h2>
              <p className="section-description">
                {t.provideDetails}
              </p>
            </div>
            
            <div className="form-group">
              <label>{t.complaintTitle}</label>
              <div className="input-with-icon">
                <i className="fas fa-heading"></i>
                <input 
                  type="text" 
                  name="title"
                  placeholder={t.titlePlaceholder} 
                  required 
                  className="form-input"
                  value={formData.title}
                  onChange={handleInputChange}
                />
              </div>
            </div>

            <div className="form-group">
              <label>{t.description}</label>
              <div className="textarea-with-icon">
                <i className="fas fa-align-left"></i>
                <textarea 
                  rows="4" 
                  name="description"
                  placeholder={t.descriptionPlaceholder} 
                  required 
                  className="form-textarea"
                  value={formData.description}
                  onChange={handleInputChange}
                ></textarea>
              </div>
              <div className="input-hint">
                {t.beSpecific}
              </div>
            </div>

            <div className="form-row">
              <div className="form-group half-width">
                <label>{t.category}</label>
                <div className="select-with-icon">
                  <i className="fas fa-tag"></i>
                  <select 
                    name="category"
                    required 
                    className="form-select"
                    value={formData.category}
                    onChange={handleInputChange}
                  >
                    <option value="">{t.selectCategory}</option>
                    <option value="Drainage">{t.drainage}</option>
                    <option value="Street Light">{t.streetLight}</option>
                    <option value="Road Damage">{t.roadDamage}</option>
                    <option value="Water Supply">{t.waterSupply}</option>
                    <option value="Electricity">{t.electricity}</option>
                    <option value="Garbage">{t.garbage}</option>
                    <option value="Public Transport">{t.publicTransport}</option>
                    <option value="Noise Pollution">{t.noisePollution}</option>
                    <option value="Other">{t.other}</option>
                  </select>
                </div>
              </div>

              <div className="form-group half-width">
                <label>{t.urgencyLevel}</label>
                <div className="select-with-icon">
                  <i className="fas fa-exclamation-triangle"></i>
                  <select 
                    name="urgency"
                    required 
                    className="form-select"
                    value={formData.urgency}
                    onChange={handleInputChange}
                  >
                    <option value="">{t.selectLevel}</option>
                    <option value="Low">{t.low}</option>
                    <option value="Moderate">{t.moderate}</option>
                    <option value="High">{t.high}</option>
                    <option value="Emergency">{t.emergery}</option>
                  </select>
                </div>
              </div>
            </div>
            
            <div className="form-navigation">
              <button type="button" className="next-btn" onClick={nextSection}>
                {t.next} <i className="fas fa-arrow-right"></i>
              </button>
            </div>
          </div>

          <div className={`form-section ${activeSection === 1 ? 'active' : ''}`}>
            <div className="section-header">
              <h2 className="section-title">
                <span className="step-number">2</span>
                {t.yourInformation}
              </h2>
              <p className="section-description">
                {t.contactDetails}
              </p>
            </div>
            
            <div className="form-row">
              <div className="form-group half-width">
                <label>{t.yourName} <span className="optional">{t.optional}</span></label>
                <div className="input-with-icon">
                  <i className="fas fa-user"></i>
                  <input 
                    type="text" 
                    name="name"
                    placeholder={t.namePlaceholder} 
                    className="form-input"
                    value={formData.name}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              <div className="form-group half-width">
                <label>{t.phoneNumber}</label>
                <div className="input-with-icon">
                  <i className="fas fa-phone-alt"></i>
                  <input 
                    type="tel" 
                    name="phone"
                    placeholder={t.phonePlaceholder} 
                    required 
                    className="form-input"
                    value={formData.phone}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
            </div>

            <div className="form-group">
              <label>{t.contactEmail} <span className="optional">{t.optional}</span></label>
              <div className="input-with-icon">
                <i className="fas fa-envelope"></i>
                <input 
                  type="email" 
                  name="email"
                  placeholder={t.emailPlaceholder} 
                  className="form-input"
                  value={formData.email}
                  onChange={handleInputChange}
                />
              </div>
              <div className="input-hint">
                {t.emailHint}
              </div>
            </div>
            
            <div className="form-navigation">
              <button type="button" className="prev-btn" onClick={prevSection}>
                <i className="fas fa-arrow-left"></i> {t.previous}
              </button>
              <button type="button" className="next-btn" onClick={nextSection}>
                {t.next} <i className="fas fa-arrow-right"></i>
              </button>
            </div>
          </div>

          <div className={`form-section ${activeSection === 2 ? 'active' : ''}`}>
            <div className="section-header">
              <h2 className="section-title">
                <span className="step-number">3</span>
                {t.locationDetails}
              </h2>
              <p className="section-description">
                {t.pinpointLocation}
              </p>
            </div>
            
            <div className="location-search-container">
              <div className="form-group">
                <label>{t.searchLocation}</label>
                <div className="location-search-input">
                  <input 
                    type="text" 
                    placeholder={t.searchPlaceholder} 
                    value={manualLocationInput}
                    onChange={(e) => setManualLocationInput(e.target.value)}
                    className="form-input"
                  />
                  <button 
                    type="button" 
                    className="search-location-btn"
                    onClick={searchLocation}
                  >
                    <i className="fas fa-search"></i> {t.searchLocation}
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label>{t.selectedLocation}</label>
                <div className="input-with-icon">
                  <i className="fas fa-map-marker-alt"></i>
                  <input 
                    type="text" 
                    value={location} 
                    readOnly 
                    required 
                    className="form-input location-input"
                  />
                </div>
              </div>

              <div className="location-buttons">
                <button 
                  type="button" 
                  className="current-location-btn"
                  onClick={getCurrentLocation}
                  disabled={isLocating}
                >
                  {isLocating ? (
                    <>
                      <span className="spinner-small"></span>
                      {t.locating}
                    </>
                  ) : (
                    <>
                      <i className="fas fa-crosshairs"></i> {t.useCurrentLocation}
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="form-group">
              <label>{t.landmarkNearby}</label>
              <div className="input-with-icon">
                <i className="fas fa-landmark"></i>
                <input 
                  type="text" 
                  name="landmark"
                  placeholder={t.landmarkPlaceholder} 
                  className="form-input"
                  value={formData.landmark}
                  onChange={handleInputChange}
                />
              </div>
            </div>

            <div 
              id="map" 
              ref={mapContainerRef}
              className={`map-container ${isMapLoaded ? 'loaded' : ''}`}
              style={{ display: activeSection === 2 ? 'block' : 'none' }}
            >
              {!isMapLoaded && (
                <div className="map-loading">
                  <div className="loading-spinner"></div>
                  <p>{t.loadingMap}</p>
                </div>
              )}
            </div>
            
            <div className="form-navigation">
              <button type="button" className="prev-btn" onClick={prevSection}>
                <i className="fas fa-arrow-left"></i> {t.previous}
              </button>
              <button type="button" className="next-btn" onClick={nextSection}>
                {t.next} <i className="fas fa-arrow-right"></i>
              </button>
            </div>
          </div>

          <div className={`form-section ${activeSection === 3 ? 'active' : ''}`}>
            <div className="section-header">
              <h2 className="section-title">
                <span className="step-number">4</span>
                {t.attachments}
              </h2>
              <p className="section-description">
                {t.addPhotos}
              </p>
            </div>
            
            <div className="form-group">
              <label>{t.uploadImages}</label>
              <div className="file-upload-wrapper">
                <input 
                  type="file" 
                  id="file-upload"
                  accept="image/*" 
                  multiple 
                  onChange={handleFileUpload}
                  required={uploadedFiles.length === 0}
                  className="file-upload"
                />
                <label htmlFor="file-upload" className="file-upload-label">
                  <div className="upload-icon">
                    <i className="fas fa-cloud-upload-alt"></i>
                  </div>
                  <div className="upload-text">
                    <h4>{t.dragDrop}</h4>
                    <p>{t.orClick}</p>
                  </div>
                </label>
              </div>
              <div className="file-upload-hint">{t.maxFiles}</div>
              
              {uploadedFiles.length > 0 && (
                <div className="uploaded-files">
                  <h4>{t.uploadedFiles}</h4>
                  <div className="file-previews">
                    {uploadedFiles.map((file, index) => (
                      <div key={index} className="file-preview">
                        <div className="file-thumbnail">
                          {file.type.startsWith('image/') ? (
                            <img src={URL.createObjectURL(file)} alt={file.name} />
                          ) : (
                            <i className="fas fa-file-image"></i>
                          )}
                        </div>
                        <div className="file-info">
                          <span className="file-name">{file.name}</span>
                          <span className="file-size">
                            {(file.size / 1024 / 1024).toFixed(2)} MB
                          </span>
                        </div>
                        <button 
                          type="button" 
                          className="remove-file-btn"
                          onClick={() => removeFile(index)}
                          title="Remove file"
                        >
                          <i className="fas fa-times"></i>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            <div className="form-navigation">
              <button type="button" className="prev-btn" onClick={prevSection}>
                <i className="fas fa-arrow-left"></i> {t.previous}
              </button>
              <button 
                type="submit" 
                className={`submit-btn ${isSubmitting ? 'submitting' : ''}`}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <span className="spinner"></span>
                    {t.submitting}
                  </>
                ) : (
                  <>
                    <i className="fas fa-paper-plane"></i> {t.submitReport}
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
      
      <div className="form-footer">
        <div className="footer-content">
          <div className="footer-links">
            <a href="/privacy-policy">{t.privacyPolicy}</a>
            <a href="/terms">{t.terms}</a>
            <a href="/faq">{t.faq}</a>
          </div>
          <p className="support-text">
            {t.needHelp} <a href="mailto:support@tamilnadureports.gov.in">
              <i className="fas fa-envelope"></i> support@tamilnadureports.gov.in
            </a> {t.orCall} <a href="tel:+9118001234567">
              <i className="fas fa-phone-alt"></i> 1800-123-4567
            </a>
          </p>
          <p className="copyright">
            © {new Date().getFullYear()} {t.copyright}
          </p>
        </div>
      </div>
    </div>
  );
}

export default ReportForm;