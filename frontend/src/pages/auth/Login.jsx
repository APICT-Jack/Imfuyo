// src/pages/Login/Login.js
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { FaEnvelope, FaLock, FaSpinner } from 'react-icons/fa';
import config from '../../config';
import './Login.css';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const result = await login(email, password);
      
      if (result.success) {
        // Redirect based on user role and verification status
        if (result.user?.role === 'seller') {
          if (result.user?.verificationStatus === 'pending') {
            navigate('/seller/dashboard');
          } else if (result.user?.verificationStatus === 'not_submitted') {
            navigate('/seller/verify');
          } else {
            navigate('/seller/dashboard');
          }
        } else {
          navigate('/');
        }
      } else {
        setError(result.error || 'Login failed. Please check your credentials.');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <h2>Welcome Back</h2>
          <p>Login to your Imfuyo account</p>
        </div>
        
        {error && <div className="error-message">{error}</div>}
        
        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label>Email Address</label>
            <div className="input-icon">
              <FaEnvelope className="icon" />
              <input 
                type="email" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                placeholder="Enter your email"
                required 
              />
            </div>
          </div>
          
          <div className="form-group">
            <label>Password</label>
            <div className="input-icon">
              <FaLock className="icon" />
              <input 
                type="password" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                placeholder="Enter your password"
                required 
              />
            </div>
          </div>
          
          <button type="submit" disabled={loading} className="login-btn">
            {loading ? (
              <>
                <FaSpinner className="spinner" /> Logging in...
              </>
            ) : (
              'Login'
            )}
          </button>
        </form>
        
        <div className="login-footer">
          <p>
            Don't have an account? <Link to="/register" className="register-link">Register</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;