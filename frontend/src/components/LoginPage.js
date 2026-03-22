import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import PasswordStrengthMeter from './PasswordStrengthMeter';


const LoginPage = ({ isModal = false }) => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [showResetModal, setShowResetModal] = useState(false);
  const { login, forgotPassword, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  useEffect(() => {
    if (isModal && location.state?.fromModal && user) {
      navigate('/');
    }
  }, [user, navigate, location, isModal]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const togglePassword = () => setShowPassword(!showPassword);

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    const result = await forgotPassword(resetEmail);
    if (result.success) {
      setError('');
      alert('Reset link sent! Check your email.');
      setShowResetModal(false);
    } else {
      setError(result.error);
    }
    setLoading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const result = await login(formData.email, formData.password);
    
    if (result.success) {
      navigate('/admin');
    } else {
      setError(result.error);
    }
    setLoading(false);
  };

  return (
    <div className="login-page">
      <div className="auth-illustration">
        <svg viewBox="0 0 200 200" fill="none">
          <circle cx="100" cy="100" r="80" stroke="currentColor" strokeWidth="2" opacity="0.3" />
          <circle cx="100" cy="100" r="60" stroke="currentColor" strokeWidth="2" opacity="0.2" />
          <path d="M50 80 Q100 50 150 80 Q130 120 100 140 Q70 120 50 80" stroke="currentColor" strokeWidth="4" fill="none" />
        </svg>
      </div>
      <div className="login-container animate-slideUp glass-effect">
        <div className="auth-header">
          <h1 className="auth-title neon-text animate-bounce">Welcome Back</h1>
          <p className="auth-subtitle">Secure sign in to your RecoverFlow dashboard</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group animate-slideInUp">
            <label>Email Address</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              placeholder="business@company.com"
              disabled={loading}
              autoComplete="email"
            />
          </div>

          <div className="form-group animate-slideInUp delay-100 password-group">
            <label>Password</label>
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              placeholder="Minimum 8 characters"
              disabled={loading}
              autoComplete="current-password"
            />
            <button type="button" className="password-toggle" onClick={togglePassword} disabled={loading} tabIndex="-1">
              {showPassword ? '🙈' : '👁️'}
            </button>
            <PasswordStrengthMeter password={formData.password} />
          </div>

          {error && <div className="error-message animate-shake">{error}</div>}

          <button type="submit" className="btn-primary full-width neon-hover" disabled={loading}>
            {loading ? (
              <>
                <div className="loader-small"></div>
                Signing In Securely...
              </>
            ) : (
              <>
                🔐 Sign In
              </>
            )}
          </button>
        </form>

        <div className="auth-actions">
          <a href="#" onClick={(e) => { e.preventDefault(); setShowResetModal(true); }} className="forgot-password">
            Forgot Password?
          </a>
          <Link to="/register" className="auth-link">
            New to RecoverFlow? Create Account
          </Link>
        </div>

        {showResetModal && (
          <div className="reset-modal-overlay">
            <div className="reset-modal glass-effect">
              <h3>Reset Password</h3>
              <form onSubmit={handleForgotPassword}>
                <div className="form-group">
                  <label>Email</label>
                  <input
                    type="email"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    placeholder="Enter email to reset"
                    required
                  />
                </div>
                {error && <div className="error-message">{error}</div>}
                <div className="form-actions">
                  <button type="button" onClick={() => setShowResetModal(false)} className="btn-secondary">
                    Cancel
                  </button>
                  <button type="submit" disabled={loading} className="btn-primary">
                    {loading ? 'Sending...' : 'Send Reset Link'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LoginPage;

