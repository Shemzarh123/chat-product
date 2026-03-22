import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const WhatsAppRegister = ({ isModal = false }) => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    phone: '',
    email: '',
    password: '',
    name: '',
    username: '',
    status: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleBack = () => {
    if (step === 2) setStep(1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const payload = {
        email: formData.email,
        password: formData.password,
        name: formData.name,
        phone: formData.phone,
        username: formData.username,
        status: formData.status
      };

      const result = await register(payload);
      if (result.success) {
        setSuccess(true);
        setTimeout(() => navigate('/chat'), 2000);
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError('Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="whatsapp-register">
      <div className="register-container">
        <div className="register-header">
          <div className="whatsapp-logo-login">
            <svg viewBox="0 0 24 24" fill="currentColor" aria-label="WhatsApp logo">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
          </div>
          <h1>Sign Up</h1>
          <p className="register-subtitle">Create your WhatsApp account</p>
        </div>

        {step === 1 && (
          <div className="phone-verification">
            <div className="form-group">
              <label htmlFor="phone">Phone Number</label>
              <div className="phone-input-group">
                <div className="country-code">+1</div>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  required
                  placeholder="Enter phone number"
                  aria-label="Phone Number"
                  aria-required="true"
                />
              </div>
            </div>

            <div className="form-actions">
              <button 
                type="button" 
                className="btn-primary"
                onClick={() => setStep(2)}
                disabled={!formData.phone.trim()}
                aria-label="Next step"
              >
                Next
              </button>
            </div>

            <p className="terms-text">
              By proceeding, you agree to our <a href="/terms-of-service" aria-label="Terms of Service">Terms of Service</a> and <a href="/privacy-policy" aria-label="Privacy Policy">Privacy Policy</a>
            </p>
          </div>
        )}

        {step === 2 && (
          <form onSubmit={handleSubmit} className="register-form">
            <div className="form-step">
              <div className="form-group">
                <label htmlFor="name">Name</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  placeholder="Your full name"
                  aria-label="Full Name"
                  aria-required="true"
                />
              </div>

              <div className="form-group">
                <label htmlFor="username">Username</label>
                <input
                  type="text"
                  id="username"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  required
                  placeholder="Choose a username"
                  aria-label="Username"
                  aria-required="true"
                />
              </div>

              <div className="form-group">
                <label htmlFor="email">Email</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  placeholder="your@email.com"
                  aria-label="Email"
                  aria-required="true"
                />
              </div>

              <div className="form-group">
                <label htmlFor="password">Password</label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  placeholder="At least 8 characters"
                  aria-label="Password"
                  aria-required="true"
                />
              </div>

              <div className="form-group">
                <label htmlFor="status">Status (optional)</label>
                <input
                  type="text"
                  id="status"
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  placeholder="Enter your status"
                  aria-label="Status"
                />
              </div>

              {error && (
                <div className="error-message" role="alert" aria-live="polite">
                  {error}
                </div>
              )}

              <div className="form-actions">
                <button 
                  type="button" 
                  className="btn-secondary" 
                  onClick={handleBack}
                  aria-label="Back to previous step"
                >
                  ← Back
                </button>
                <button 
                  type="submit" 
                  className="btn-primary" 
                  disabled={loading}
                  aria-label="Create Account"
                >
                  {loading ? (
                    <>
                      <div className="loader-small" aria-label="Loading"></div>
                      Creating Account...
                    </>
                  ) : (
                    'Create Account'
                  )}
                </button>
              </div>
            </div>
          </form>
        )}

        {success && (
          <div className="success-message">
            <div className="success-icon">✅</div>
            <h2>Welcome to WhatsApp!</h2>
            <p>Redirecting to your chat...</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default WhatsAppRegister;
