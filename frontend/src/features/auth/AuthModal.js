import React, { useState, useEffect } from 'react';
import LoginPage from './LoginPage';
import RegisterPage from './RegisterPage';
import { useAuth } from '../../context/AuthContext';

const AuthModal = ({ isOpen, onClose, initialTab = 'login' }) => {
  const [activeTab, setActiveTab] = useState(initialTab);
  const { user } = useAuth();

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen, onClose]);

  const handleClose = () => {
    if (!user) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-tabs-enhanced">
            <div className="tab-buttons">
              <button 
                className={`tab-btn ${activeTab === 'login' ? 'active' : ''}`}
                onClick={() => setActiveTab('login')}
              >
                Sign In
              </button>
              <button 
                className={`tab-btn ${activeTab === 'register' ? 'active' : ''}`}
                onClick={() => setActiveTab('register')}
              >
                Sign Up
              </button>
            </div>
            <div className="modal-tab-underline" style={{ transform: `translateX(${activeTab === 'register' ? '100%' : '0%'})` }}></div>
          </div>
          <button className="modal-close" onClick={handleClose} aria-label="Close">
            ×
          </button>
        </div>
        
        <div className="modal-body">
          {activeTab === 'login' ? <LoginPage isModal /> : <RegisterPage isModal />}
        </div>
      </div>
    </div>
  );
};

export default AuthModal;

