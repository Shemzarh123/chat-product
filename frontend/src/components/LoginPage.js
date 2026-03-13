import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link, useLocation } from 'react-router-dom';

const LoginPage = ({ isModal = false }) => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, user } = useAuth();
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
      <div className="login-container animate-slideUp">
        <div className="auth-header">
          <h1 className="auth-title animate-bounce">Welcome Back</h1>
          <p className="auth-subtitle">Sign in to your RecoverFlow account</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group animate-slideInUp">
            <label>Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              placeholder="your@email.com"
              disabled={loading}
            />
          </div>

          <div className="form-group animate-slideInUp delay-100">
            <label>Password</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              placeholder="Enter your password"
              disabled={loading}
            />
          </div>

          {error && <div className="error-message animate-shake">{error}</div>}

          <button type="submit" className="btn-primary full-width" disabled={loading}>
            {loading ? (
              <>
                <div className="loader-small"></div>
                Signing In...
              </>
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        <div className="auth-footer animate-fadeIn">
          <Link to="/register" className="auth-link">
            Don't have an account? Create one
          </Link>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;

