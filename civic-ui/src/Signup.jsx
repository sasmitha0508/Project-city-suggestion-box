import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './SignUp.css';
import logo from './assets/logo2.png';

// Language translations
const translations = {
  en: {
    // Header
    logoText: "CitySuggestionBox",
    
    // Form header
    createAccount: "Create Account",
    joinUs: "Join us to contribute to your city's improvement",
    
    // Form fields
    username: "Username",
    usernameRequired: "Username required",
    email: "Email",
    emailRequired: "Email required",
    password: "Password (min 6 characters)",
    passwordRequired: "Password required",
    passwordMinLength: "Password must be at least 6 characters",
    confirmPassword: "Confirm Password",
    passwordsMustMatch: "Passwords must match",
    accountType: "Account Type:",
    accountTypeRequired: "Account type is required",
    citizen: "Citizen",
    cityAdmin: "City Admin",
    
    // Buttons
    signUp: "Sign Up",
    creatingAccount: "Creating Account...",
    
    // Footer
    alreadyHaveAccount: "Already have an account?",
    logIn: "Log In",
    
    // Hero section
    makeVoiceHeard: "Make Your Voice Heard",
    citizenJoin: "Join thousands of citizens working to make our city a better place.",
    adminJoin: "Join thousands of city administrators working to make our city a better place.",
    citizenFeature1: "Share your ideas",
    adminFeature1: "Review citizen suggestions",
    citizenFeature2: "Track progress",
    adminFeature2: "Manage city improvements",
    citizenFeature3: "Community driven",
    adminFeature3: "Serve your community",
    
    // Page footer
    copyright: "© {year} City Suggestion Box. All Rights Reserved.",
    privacyPolicy: "Privacy Policy",
    termsOfService: "Terms of Service",
    contactUs: "Contact Us",
    
    // API Errors
    serverNotResponding: "Server is not responding. Please check if backend is running on port 5000.",
    cannotConnect: "Cannot connect to server. Make sure backend is running.",
    userExists: "This email is already registered. Please login instead.",
    signupFailed: "Signup failed. Please try again."
  },
  ta: {
    // Header
    logoText: "நகர பரிந்துரை பெட்டி",
    
    // Form header
    createAccount: "கணக்கை உருவாக்குக",
    joinUs: "உங்கள் நகரத்தின் மேம்பாட்டிற்கு பங்களிக்க எங்களுடன் இணையுங்கள்",
    
    // Form fields
    username: "பயனர் பெயர்",
    usernameRequired: "பயனர் பெயர் தேவை",
    email: "மின்னஞ்சல்",
    emailRequired: "மின்னஞ்சல் தேவை",
    password: "கடவுச்சொல் (குறைந்தது 6 எழுத்துகள்)",
    passwordRequired: "கடவுச்சொல் தேவை",
    passwordMinLength: "கடவுச்சொல் குறைந்தது 6 எழுத்துகள் இருக்க வேண்டும்",
    confirmPassword: "கடவுச்சொல்லை உறுதிப்படுத்துக",
    passwordsMustMatch: "கடவுச்சொற்கள் பொருந்த வேண்டும்",
    accountType: "கணக்கு வகை:",
    accountTypeRequired: "கணக்கு வகை தேவை",
    citizen: "குடிமக்கள்",
    cityAdmin: "நகர நிர்வாகி",
    
    // Buttons
    signUp: "பதிவு செய்யுங்கள்",
    creatingAccount: "கணக்கு உருவாக்கப்படுகிறது...",
    
    // Footer
    alreadyHaveAccount: "ஏற்கனவே கணக்கு உள்ளதா?",
    logIn: "உள்நுழைய",
    
    // Hero section
    makeVoiceHeard: "உங்கள் குரலைக் கேட்பிக்கவும்",
    citizenJoin: "எங்கள் நகரத்தை மேம்படுத்த ஆயிரக்கணக்கான குடிமக்களுடன் இணையுங்கள்.",
    adminJoin: "எங்கள் நகரத்தை மேம்படுத்த ஆயிரக்கணக்கான நகர நிர்வாகிகளுடன் இணையுங்கள்.",
    citizenFeature1: "உங்கள் யோசனைகளைப் பகிர்ந்து கொள்ளுங்கள்",
    adminFeature1: "குடிமக்களின் பரிந்துரைகளை மதிப்பாய்வு செய்யுங்கள்",
    citizenFeature2: "முன்னேற்றத்தைக் கண்காணிக்கவும்",
    adminFeature2: "நகர மேம்பாடுகளை நிர்வகிக்கவும்",
    citizenFeature3: "சமூகம் இயக்கப்படும்",
    adminFeature3: "உங்கள் சமூகத்திற்கு சேவை செய்யுங்கள்",
    
    // Page footer
    copyright: "© {year} நகர பரிந்துரை பெட்டி. அனைத்து உரிமைகளும் பாதுகாக்கப்பட்டவை.",
    privacyPolicy: "தனியுரிமைக் கொள்கை",
    termsOfService: "சேவை விதிமுறைகள்",
    contactUs: "எங்களைத் தொடர்பு கொள்ள",
    
    // API Errors
    serverNotResponding: "சர்வர் பதிலளிக்கவில்லை. பின்னறை இயங்குகிறதா என்பதை சரிபார்க்கவும்.",
    cannotConnect: "சர்வரை இணைக்க முடியவில்லை. பின்னறை இயங்குகிறதா என்பதை உறுதிப்படுத்தவும்.",
    userExists: "இந்த மின்னஞ்சல் ஏற்கனவே பதிவு செய்யப்பட்டுள்ளது. மாறாக உள்நுழையவும்.",
    signupFailed: "பதிவு தோல்வியடைந்தது. தயவு செய்து மீண்டும் முயற்சிக்கவும்."
  }
};

const SignUp = () => {
  const navigate = useNavigate();
  const [language, setLanguage] = useState('en');
  const [form, setForm] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    userType: ''
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState('');

  // Load saved language preference from localStorage
  useEffect(() => {
    const savedLanguage = localStorage.getItem('preferredLanguage');
    if (savedLanguage) {
      setLanguage(savedLanguage);
    }
  }, []);

  // Save language preference to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('preferredLanguage', language);
  }, [language]);

  const t = (key) => {
    return translations[language][key] || translations['en'][key] || key;
  };

  const validate = () => {
    const newErrors = {};
    if (!form.username) newErrors.username = t('usernameRequired');
    if (!form.email) newErrors.email = t('emailRequired');
    if (!form.password) newErrors.password = t('passwordRequired');
    if (form.password.length < 6) newErrors.password = t('passwordMinLength');
    if (form.password !== form.confirmPassword) newErrors.confirmPassword = t('passwordsMustMatch');
    if (!form.userType) newErrors.userType = t('accountTypeRequired');
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    setForm({...form, [e.target.name]: e.target.value});
    if (errors[e.target.name]) setErrors({...errors, [e.target.name]: ''});
    if (apiError) setApiError('');
  };

  const toggleLanguage = () => {
    setLanguage(prevLang => prevLang === 'en' ? 'ta' : 'en');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    
    setIsSubmitting(true);
    setApiError('');

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    try {
      const userData = {
        username: form.username,
        email: form.email,
        password: form.password,
        userType: form.userType
      };

      console.log('Sending signup request:', userData);

      const response = await fetch('http://localhost:5000/api/auth/signup', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify(userData),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      console.log('Response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Server error:', errorText);
        throw new Error(errorText || `Server error: ${response.status}`);
      }

      const data = await response.json();
      console.log('Signup successful:', data);
      
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify({
        username: form.username,
        email: form.email,
        userType: form.userType
      }));

      navigate('/profile');

    } catch (error) {
      clearTimeout(timeoutId);
      console.error('Error details:', error);
      
      if (error.name === 'AbortError') {
        setApiError(t('serverNotResponding'));
      } else if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
        setApiError(t('cannotConnect'));
      } else if (error.message.includes('User already exists')) {
        setApiError(t('userExists'));
      } else {
        setApiError(t('signupFailed'));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="signup-page">
      <header className="signup-header">
        <div className="logo" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
          <img
            src={logo}
            alt="City Logo"
            className="logo-image"
            width="40"
            height="40"
          />
          <span className="logo-text">{t('logoText')}</span>
        </div>
        
        <div className="language-toggle-container">
          <button 
            className="language-toggle"
            onClick={toggleLanguage}
            aria-label={language === 'en' ? 'Switch to Tamil' : 'Switch to English'}
          >
            <span className={language === 'en' ? 'active' : ''}>EN</span>
            <span className="toggle-slider"></span>
            <span className={language === 'ta' ? 'active' : ''}>தமிழ்</span>
          </button>
        </div>
      </header>

      <main className="signup-container">
        <div className="signup-card-container">
          <div className="signup-card">
            <div className="card-inner">
              <div className="signup-form-header">
                <h2>{t('createAccount')}</h2>
                <p>{t('joinUs')}</p>
              </div>
              
              {apiError && (
                <div className="api-error-message">
                  {apiError}
                </div>
              )}

              <form onSubmit={handleSubmit} className="signup-form">

                <div className="form-group">
                  <input
                    type="text"
                    name="username"
                    placeholder={t('username')}
                    value={form.username}
                    onChange={handleChange}
                    className={`form-input ${errors.username ? 'error' : ''}`}
                  />
                  {errors.username && <span className="error-message">{errors.username}</span>}
                </div>

                <div className="form-group">
                  <input
                    type="email"
                    name="email"
                    placeholder={t('email')}
                    value={form.email}
                    onChange={handleChange}
                    className={`form-input ${errors.email ? 'error' : ''}`}
                  />
                  {errors.email && <span className="error-message">{errors.email}</span>}
                </div>

                <div className="form-group">
                  <input
                    type="password"
                    name="password"
                    placeholder={t('password')}
                    value={form.password}
                    onChange={handleChange}
                    className={`form-input ${errors.password ? 'error' : ''}`}
                  />
                  {errors.password && <span className="error-message">{errors.password}</span>}
                </div>

                <div className="form-group">
                  <input
                    type="password"
                    name="confirmPassword"
                    placeholder={t('confirmPassword')}
                    value={form.confirmPassword}
                    onChange={handleChange}
                    className={`form-input ${errors.confirmPassword ? 'error' : ''}`}
                  />
                  {errors.confirmPassword && <span className="error-message">{errors.confirmPassword}</span>}
                </div>

                <div className="form-group role-selection">
                  <label className="role-label">{t('accountType')}</label>
                  <div className="role-options">
                    <label className="role-option">
                      <input
                        type="radio"
                        name="userType"
                        value="citizen"
                        checked={form.userType === 'citizen'}
                        onChange={handleChange}
                        required
                      />
                      <span className="role-option-text">{t('citizen')}</span>
                    </label>
                    <label className="role-option">
                      <input
                        type="radio"
                        name="userType"
                        value="admin"
                        checked={form.userType === 'admin'}
                        onChange={handleChange}
                        required
                      />
                      <span className="role-option-text">{t('cityAdmin')}</span>
                    </label>
                  </div>
                  {errors.userType && <span className="error-message">{errors.userType}</span>}
                </div>

                <div className="signup-button-container">
                  <button 
                    type="submit" 
                    className={`signup-button ${isSubmitting ? 'submitting' : ''}`}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <span className="spinner"></span>
                        {t('creatingAccount')}
                      </>
                    ) : (
                      t('signUp')
                    )}
                  </button>
                </div>
              </form>

              <div className="auth-footer">
                <p className="login-link">
                  {t('alreadyHaveAccount')}{' '}
                  <span onClick={() => navigate('/login')}>{t('logIn')}</span>
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="signup-hero">
          <h2>{t('makeVoiceHeard')}</h2>
          <p>{form.userType === 'citizen' ? t('citizenJoin') : t('adminJoin')}</p>
          
          <div className="features">
            <div className="feature">
              <i className="fas fa-lightbulb"></i>
              <span>{form.userType === 'citizen' ? t('citizenFeature1') : t('adminFeature1')}</span>
            </div>
            <div className="feature">
              <i className="fas fa-chart-line"></i>
              <span>{form.userType === 'citizen' ? t('citizenFeature2') : t('adminFeature2')}</span>
            </div>
            <div className="feature">
              <i className="fas fa-users"></i>
              <span>{form.userType === 'citizen' ? t('citizenFeature3') : t('adminFeature3')}</span>
            </div>
          </div>
        </div>
      </main>

      <footer className="signup-footer">
        <div>{t('copyright').replace('{year}', new Date().getFullYear())}</div>
        <div className="footer-links">
          <span onClick={() => navigate('/privacy')}>{t('privacyPolicy')}</span>
          <span onClick={() => navigate('/terms')}>{t('termsOfService')}</span>
          <span onClick={() => navigate('/contact')}>{t('contactUs')}</span>
        </div>
      </footer>
    </div>
  );
};

export default SignUp;