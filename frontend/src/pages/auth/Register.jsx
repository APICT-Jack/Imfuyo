import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { FaUser, FaEnvelope, FaLock, FaPhone, FaStore, FaAddressCard, FaSpinner } from 'react-icons/fa';
import './Register.css';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    role: 'buyer',
    businessName: '',
    businessAddress: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    // Basic validation
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      setLoading(false);
      return;
    }
    
    const result = await register(formData);
    setLoading(false);
    
    if (result.success) {
      if (formData.role === 'seller') {
        navigate('/seller/verify');
      } else {
        navigate('/');
      }
    } else {
      setError(result.error || 'Registration failed. Please try again.');
    }
  };

  return (
    <div className="register-container">
      <div className="register-card">
        <div className="register-header">
          <h2>Create an Account</h2>
          <p>Join Imfuyo - Africa's premier livestock marketplace</p>
        </div>
        
        {error && <div className="error-message">{error}</div>}
        
        <form onSubmit={handleSubmit} className="register-form">
          <div className="form-group">
            <label>Full Name *</label>
            <div className="input-icon">
              <FaUser className="icon" />
              <input type="text" name="name" value={formData.name} onChange={handleChange} placeholder="Enter your full name" required />
            </div>
          </div>
          
          <div className="form-group">
            <label>Email Address *</label>
            <div className="input-icon">
              <FaEnvelope className="icon" />
              <input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="Enter your email" required />
            </div>
          </div>
          
          <div className="form-group">
            <label>Password *</label>
            <div className="input-icon">
              <FaLock className="icon" />
              <input type="password" name="password" value={formData.password} onChange={handleChange} placeholder="Minimum 6 characters" required />
            </div>
          </div>
          
          <div className="form-group">
            <label>Phone Number *</label>
            <div className="input-icon">
              <FaPhone className="icon" />
              <input type="tel" name="phone" value={formData.phone} onChange={handleChange} placeholder="Enter your phone number" required />
            </div>
          </div>
          
          <div className="form-group">
            <label>I want to register as: *</label>
            <select name="role" value={formData.role} onChange={handleChange} className="role-select">
              <option value="buyer">Buyer - I want to purchase livestock</option>
              <option value="seller">Seller - I want to sell livestock or rent vehicles</option>
            </select>
          </div>
          
          {formData.role === 'seller' && (
            <div className="seller-fields">
              <div className="form-group">
                <label>Business Name</label>
                <div className="input-icon">
                  <FaStore className="icon" />
                  <input type="text" name="businessName" value={formData.businessName} onChange={handleChange} placeholder="Your farm or business name" />
                </div>
              </div>
              
              <div className="form-group">
                <label>Business Address</label>
                <div className="input-icon">
                  <FaAddressCard className="icon" />
                  <textarea name="businessAddress" value={formData.businessAddress} onChange={handleChange} placeholder="Your business address" rows="3"></textarea>
                </div>
              </div>
              
              <div className="info-note">
                <p>ℹ️ As a seller, you'll need to complete identity verification before listing items. This helps build trust with buyers.</p>
              </div>
            </div>
          )}
          
          <button type="submit" disabled={loading} className="register-btn">
            {loading ? (
              <>
                <FaSpinner className="spinner" /> Creating Account...
              </>
            ) : (
              'Create Account'
            )}
          </button>
        </form>
        
        <div className="register-footer">
          <p>
            Already have an account? <Link to="/login" className="login-link">Login</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;