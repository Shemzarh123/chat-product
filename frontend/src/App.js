import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ChatProvider } from './context/ChatContext';
import { PnLProvider } from './context/PnLContext';
import { Toaster } from 'react-hot-toast';

import AdminDashboard from './components/AdminDashboard';
import ChatWidget from './components/ChatWidget';
import RegisterPage from './components/RegisterPage';
import LoginPage from './components/LoginPage';
import ProtectedRoute from './components/ProtectedRoute';
import AuthModal from './components/AuthModal';
import WhatsAppLayout from './components/WhatsAppLayout';
import WhatsAppLogin from './components/WhatsAppLogin';
import WhatsAppRegister from './components/WhatsAppRegister';
import BusinessProfile from './components/BusinessProfile';
import TermsOfService from './components/TermsOfService';
import PrivacyPolicy from './components/PrivacyPolicy';
import StatusView from './components/StatusView';
import Notifications from './components/Notifications';
import SubscriptionPlans from './components/SubscriptionPlans';
import BusinessLoginPage from './components/BusinessLoginPage';
import BusinessRegisterPage from './components/BusinessRegisterPage';
import PnLDashboard from './components/PnLDashboard';
import MeetingList from './components/MeetingList';
import MeetingScheduler from './components/MeetingScheduler';
import VideoCall from './components/VideoCall';
import './App.css';

const AppContent = () => {
  const { user } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then(reg => console.log('SW registered:', reg))
        .catch(err => console.log('SW registration failed'));
    }
  }, []);

  const closeModal = () => setShowAuthModal(false);

  return (
    <ChatProvider>
      <PnLProvider>
        <div className="App">
          <AuthModal 
            isOpen={showAuthModal} 
            onClose={closeModal}
            initialTab='login'
          />
          <Toaster />
          <Routes>
            {/* WhatsApp-style Chat App */}
            <Route 
              path="/chat" 
              element={
                <ProtectedRoute>
                  <WhatsAppLayout />
                </ProtectedRoute>
              } 
            />

            {/* WhatsApp-style Login & Register */}
            <Route path="/whatsapp-login" element={<WhatsAppLogin />} />
            <Route path="/whatsapp-register" element={<WhatsAppRegister />} />
            <Route path="/terms-of-service" element={<TermsOfService />} />
            <Route path="/privacy-policy" element={<PrivacyPolicy />} />
            <Route path="/pnl" element={<ProtectedRoute><PnLDashboard /></ProtectedRoute>} />
            <Route path="/status" element={<StatusView />} />
<Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
            <Route path="/subscription" element={<ProtectedRoute><SubscriptionPlans /></ProtectedRoute>} />
            <Route path="/meetings" element={<ProtectedRoute><MeetingList /></ProtectedRoute>} />
            <Route path="/schedule/:userId" element={<ProtectedRoute><MeetingScheduler /></ProtectedRoute>} />
            <Route path="/call/:meetingId" element={<ProtectedRoute><VideoCall /></ProtectedRoute>} />

            {/* PnL in chat */}
            <Route 
              path="/chat/:chatId" 
              element={
                <ProtectedRoute>
                  <WhatsAppLayout />
                </ProtectedRoute>
              } 
            />

            {/* Original RecoverFlow Routes */}
            <Route path="/" element={<Navigate to="/chat" replace />} />
            <Route path="/login" element={user ? <Navigate to="/chat" /> : <LoginPage />} />
<Route path="/register" element={user ? <Navigate to="/chat" /> : <RegisterPage />} />
            <Route path="/business-login" element={user ? <Navigate to="/chat" /> : <BusinessLoginPage />} />
<Route path="/business-register" element={user ? <Navigate to="/chat" /> : <BusinessRegisterPage />} />
            <Route path="/business/:id" element={<ProtectedRoute><BusinessProfile /></ProtectedRoute>} />
            <Route path="/admin" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
            <Route path="/widget" element={<ChatWidget />} />
            <Route path="*" element={<Navigate to="/chat" replace />} />
          </Routes>
        </div>
      </PnLProvider>
    </ChatProvider>
  );
};

const App = () => (
  <AuthProvider>
    <AppContent />
  </AuthProvider>
);

export default App;



