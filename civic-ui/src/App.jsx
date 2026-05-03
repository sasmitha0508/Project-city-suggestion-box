// src/App.jsx
import React from 'react'
import { Routes, Route } from 'react-router-dom';

// Import LanguageProvider
import { LanguageProvider } from './contexts/LanguageContext';

// Import Components
import Landing from './Landing.jsx';
import SignUp from './Signup.jsx';
import Login from './Login.jsx';
import AdminDashboard from './AdminDashboard.jsx';
import UserDashboard from './UserDashboard.jsx';
import Profile from './Profile.jsx';
import ReportForm from './ReportForm.jsx';

// Styles
import 'leaflet/dist/leaflet.css';
import 'leaflet-control-geocoder/dist/Control.Geocoder.css';
import './Landing.css';
import './AdminDashboard.css';
import './UserDashboard.css';
import './Profile.css';
import './ReportForm.css';

const App = () => {
  return (
    <LanguageProvider>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/login" element={<Login />} />
        <Route path="/admin-dashboard" element={<AdminDashboard />} />
        <Route path="/user-dashboard" element={<UserDashboard />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/report-form" element={<ReportForm/>} />
      </Routes>
    </LanguageProvider>
  )
}

export default App;