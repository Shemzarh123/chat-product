import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import PasswordStrengthMeter from './PasswordStrengthMeter';

const RegisterPage = ({ isModal = false }) => {
  const [step, setStep] = useState(1);
  const [role, setRole] = useState('');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    business_name: '',
    phone_number: '',
    industry: '',
    address: '',
    website: '',
    description: '',
    logo: null,
    termsAccepted: false
  });
  const [progress, setProgress] = useState(0);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleRoleSelect = (selectedRole) => {
    setRole(selectedRole);
    setStep(2);
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
        role,
        name: formData.name,
      };

      if (role === 'business') {
        payload.businessDetails = {
          business_name: formData.business_name,
          phone_number: formData.phone_number,
          industry: formData.industry,
          address: formData.address,
          website: formData.website,
          description: formData.description
        };
      }

      const result = await register(payload);
      if (result.success) {
        setSuccess(true);
        setTimeout(() => navigate('/admin'), 2000);
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
    <div className="register-page">
      <div className="register-container animate-slideUp">
        <div className="register-header">
          <h1 className="register-title animate-bounce">Join RecoverFlow</h1>
          <p className="register-subtitle">Sign up as Client or Business Owner/Agency</p>
        </div>

        {step === 1 && (
          <div className="role-selector">
            <h2>Choose your role</h2>
            <div className="role-cards">
              <div 
                className={`role-card client-card animate-scale ${role === 'client' ? 'selected' : ''}`}
                onClick={() => handleRoleSelect('client')}
              >
                <div className="role-icon">👤</div>
                <h3>Client</h3>
                <p>Service seeker looking for businesses</p>
              </div>
              <div 
                className={`role-card business-card animate-scale ${role === 'business' ? 'selected' : ''}`}
                onClick={() => handleRoleSelect('business')}
              >
                <div className="role-icon">🏢</div>
                <h3>Business Owner / Agency / Investor</h3>
                <p>Sign up your company to recover revenue</p>
              </div>
            </div>
            <button className="back-btn invisible">← Back</button>
          </div>
        )}

        {step === 2 && (
          <form onSubmit={handleSubmit} className="register-form">
            <div className="form-step animate-slideInRight">
              <h2>{role === 'client' ? 'Client Details' : 'Business Details'}</h2>
              
              {/* Common fields */}
              <div className="form-group animate-slideInUp">
                <label>Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  placeholder="your@email.com"
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
                  placeholder="At least 8 characters"
                />
              </div>

              <div className="form-group animate-slideInUp delay-200">
                <label>Name</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  placeholder="Your full name"
                />
              </div>

              {role === 'business' && (
                <>
                  <div className="form-group animate-slideInUp delay-300">
                    <label>Business Name</label>
                    <input
                      type="text"
                      name="business_name"
                      value={formData.business_name}
                      onChange={handleChange}
                      required
                      placeholder="Your company name"
                    />
                  </div>

                  <div className="form-group animate-slideInUp delay-400">
                    <label>Phone Number</label>
                    <input
                      type="tel"
                      name="phone_number"
                      value={formData.phone_number}
                      onChange={handleChange}
                      required
                      placeholder="+1 (555) 123-4567"
                    />
                  </div>

                  <div className="form-group animate-slideInUp delay-500">
                    <label>Industry</label>
                    <select name="industry" value={formData.industry} onChange={handleChange} required>
                      <option value="">Select industry</option>
                      <option value="dental">Dental Clinic</option>
                      <option value="law">Legal Services</option>
                      <option value="auto">Auto Repair</option>
                      <option value="salon">Beauty Salon</option>
                      <option value="agency">Marketing Agency</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div className="form-group animate-slideInUp delay-600">
                    <label>Address (Optional)</label>
                    <input
                      type="text"
                      name="address"
                      value={formData.address}
                      onChange={handleChange}
                      placeholder="Business address"
                    />
                  </div>

                  <div className="form-group animate-slideInUp delay-700">
                    <label>Website (Optional)</label>
                    <input
                      type="url"
                      name="website"
                      value={formData.website}
                      onChange={handleChange}
                      placeholder="https://yourbusiness.com"
                    />
                  </div>

                  <div className="form-group animate-slideInUp delay-800">
                    <label>Description (Optional)</label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleChange}
                      rows="3"
                      placeholder="Tell us about your business..."
                    />
                  </div>
                </>
              )}

              {error && <div className="error-message animate-shake">{error}</div>}

              <div className="form-actions">
                <button type="button" className="btn-secondary" onClick={handleBack}>
                  ← Back
                </button>
                <button type="submit" className="btn-primary" disabled={loading}>
                  {loading ? (
                    <>
                      <div className="loader-small"></div>
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
          <div className="success-message animate-scale">
            <div className="success-icon">✅</div>
            <h2>Welcome aboard!</h2>
            <p>Redirecting to your dashboard...</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default RegisterPage;

