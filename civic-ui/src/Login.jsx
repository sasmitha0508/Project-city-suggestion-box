import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Login.css'; // Reusing the same CSS file
import logo from './assets/logo2.png';
import api from './services/api';

// Language translations
const translations = {
  en: {
    // Header
    logoText: "CitySuggestionBox",
    
    // Form header
    welcomeBack: "Welcome Back",
    signInToContinue: "Sign in to continue contributing to your city",
    
    // Form fields
    usernameOrEmail: "Username or Email",
    usernameOrEmailRequired: "Username or email required",
    usingEmail: "Using email",
    usingUsername: "Using username",
    password: "Password",
    passwordRequired: "Password required",
    accountType: "Account Type:",
    accountTypeRequired: "User type is required",
    citizen: "Citizen",
    cityAdmin: "City Admin",
    
    // Buttons
    login: "Login",
    loggingIn: "Logging In...",
    
    // Footer
    noAccount: "Don't have an account?",
    signUp: "Sign Up",
    
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
    
    // Error messages
    loginFailed: "Login failed",
    networkError: "Network error. Please try again."
  },
  ta: {
    // Header
    logoText: "நகர பரிந்துரை பெட்டி",
    
    // Form header
    welcomeBack: "மீண்டும் வருக",
    signInToContinue: "உங்கள் நகரத்திற்கு பங்களிக்கத் தொடர உள்நுழையவும்",
    
    // Form fields
    usernameOrEmail: "பயனர் பெயர் அல்லது மின்னஞ்சல்",
    usernameOrEmailRequired: "பயனர் பெயர் அல்லது மின்னஞ்சல் தேவை",
    usingEmail: "மின்னஞ்சல் பயன்படுத்துகிறது",
    usingUsername: "பயனர் பெயரைப் பயன்படுத்துகிறது",
    password: "கடவுச்சொல்",
    passwordRequired: "கடவுச்சொல் தேவை",
    accountType: "கணக்கு வகை:",
    accountTypeRequired: "பயனர் வகை தேவை",
    citizen: "குடிமக்கள்",
    cityAdmin: "நகர நிர்வாகி",
    
    // Buttons
    login: "உள்நுழைய",
    loggingIn: "உள்நுழைகிறது...",
    
    // Footer
    noAccount: "கணக்கு இல்லையா?",
    signUp: "பதிவு செய்யுங்கள்",
    
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
    
    // Error messages
    loginFailed: "உள்நுழைவு தோல்வியடைந்தது",
    networkError: "பிணையப் பிழை. தயவு செய்து மீண்டும் முயற்சிக்கவும்."
  }
};

const Login = () => {
  const navigate = useNavigate();
  const [language, setLanguage] = useState('en');
  const [form, setForm] = useState({
    loginInput: '', // Single field for both username or email
    password: '',
    userType: 'citizen'
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

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
    
    if (!form.loginInput) newErrors.loginInput = t('usernameOrEmailRequired');
    if (!form.password) newErrors.password = t('passwordRequired');
    if (!form.userType) newErrors.userType = t('accountTypeRequired');
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    setForm({...form, [e.target.name]: e.target.value});
    if (errors[e.target.name]) setErrors({...errors, [e.target.name]: ''});
  };

  const toggleLanguage = () => {
    setLanguage(prevLang => prevLang === 'en' ? 'ta' : 'en');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    
    setIsSubmitting(true);
    
    try {
      // Prepare login data
      const loginData = {
        loginInput: form.loginInput,
        password: form.password,
        userType: form.userType
      };

      const response = await api.post('/auth/login', loginData);
      const data = response.data;
      if (response.ok) {
        // Save token and user data - FIXED: Properly store token
        localStorage.setItem('token', data.token);
        
        // Redirect based on user type from response, not form
        if (data.user.userType === 'admin') {
          navigate('/admin-dashboard', { state: { user: data.user } });
        } else {
          navigate('/user-dashboard', { state: { user: data.user } });
        }
      } else {
        setErrors({ submit: data.message || data.msg || t('loginFailed') });
      }
    } catch (error) {
      setErrors({ submit: t('networkError') });
      console.error('Login error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper function to detect if input looks like an email
  const isEmail = (input) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(input);
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
                <h2>{t('welcomeBack')}</h2>
                <p>{t('signInToContinue')}</p>
              </div>
              
              <form onSubmit={handleSubmit} className="signup-form">
                
                <div className="form-group">
                  <input
                    type="text"
                    name="loginInput"
                    placeholder={t('usernameOrEmail')}
                    value={form.loginInput}
                    onChange={handleChange}
                    className={`form-input ${errors.loginInput ? 'error' : ''}`}
                  />
                  {errors.loginInput && <span className="error-message">{errors.loginInput}</span>}
                  {form.loginInput && (
                    <div className="input-hint">
                      {isEmail(form.loginInput) ? t('usingEmail') : t('usingUsername')}
                    </div>
                  )}
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
                      />
                      <span className="role-option-text">{t('cityAdmin')}</span>
                    </label>
                  </div>
                  {errors.userType && <span className="error-message">{errors.userType}</span>}
                </div>

                {errors.submit && (
                  <div className="error-message submit-error">
                    {errors.submit}
                  </div>
                )}

                <div className="signup-button-container">
                  <button 
                    type="submit" 
                    className={`signup-button ${isSubmitting ? 'submitting' : ''}`}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <span className="spinner"></span>
                        {t('loggingIn')}
                      </>
                    ) : (
                      t('login')
                    )}
                  </button>
                </div>
              </form>

              <div className="auth-footer">
                <p className="login-link">
                  {t('noAccount')}{' '}
                  <span onClick={() => navigate('/signup')}>{t('signUp')}</span>
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

export default Login;