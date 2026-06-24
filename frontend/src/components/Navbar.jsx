// Navbar.jsx - Updated with macOS/iOS style
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FaUser, FaSignOutAlt, FaBars, FaTimes, FaCamera, FaSearch } from 'react-icons/fa';
import { GiCow } from 'react-icons/gi';
import './Navbar.css';

const Navbar = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showBgInput, setShowBgInput] = useState(false);
  const [bgUrlInput, setBgUrlInput] = useState('');

  const handleLogout = () => {
    logout();
    navigate('/');
    setIsMenuOpen(false);
  };

  const handleSetBackground = (e) => {
    const file = e.target.files[0];
    if (file) {
      const imageUrl = URL.createObjectURL(file);
      localStorage.setItem('imfuyo_background', imageUrl);
      window.dispatchEvent(new Event('backgroundChanged'));
      setShowBgInput(false);
    }
  };

  const handleBgUrlSubmit = () => {
    if (bgUrlInput.trim()) {
      localStorage.setItem('imfuyo_background', bgUrlInput.trim());
      window.dispatchEvent(new Event('backgroundChanged'));
      setShowBgInput(false);
      setBgUrlInput('');
    }
  };

  const removeBackground = () => {
    localStorage.removeItem('imfuyo_background');
    window.dispatchEvent(new Event('backgroundChanged'));
    setShowBgInput(false);
  };

  return (
    <>
      <nav className="navbar-macos">
        <div className="navbar-container-macos">
          <Link to="/" className="navbar-logo-macos">
            <GiCow className="cow-icon-macos" />
            <span>Imfuyo</span>
          </Link>
          
          <div className="search-bar-macos-nav">
            <FaSearch className="search-icon-macos" />
            <input type="text" placeholder="Search livestock, transport..." />
            
          </div>
          
          <button className="navbar-mobile-toggle-macos" onClick={() => setIsMenuOpen(!isMenuOpen)}>
            {isMenuOpen ? <FaTimes /> : <FaBars />}
          </button>
           
          <div className={`navbar-menu-macos ${isMenuOpen ? 'active' : ''}`}>
            <Link to="/livestock" className="navbar-link-macos" onClick={() => setIsMenuOpen(false)}>
              Browse
            </Link>
            
           
            
            {isAuthenticated ? (
              <div className="navbar-user-macos">
                
                {user.role === 'seller' && (
                  <Link to="/seller/dashboard" className="navbar-link-macos" onClick={() => setIsMenuOpen(false)}>
                    Dashboard
                  </Link>
                )}
                <button onClick={handleLogout} className="navbar-logout-btn-macos">
                  <FaSignOutAlt /> Logout
                </button>
              </div>
            ) : (
              <div className="navbar-user-macos">
                <Link to="/login" className="navbar-link-macos" onClick={() => setIsMenuOpen(false)}>
                  Sign In
                </Link>
                <Link to="/register" className="sell-btn-macos-nav" onClick={() => setIsMenuOpen(false)}>
                  Sell
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Background Settings Panel */}
        {showBgInput && (
          <div className="bg-panel-macos-nav" onClick={(e) => e.stopPropagation()}>
            <div className="bg-panel-header-macos">
              <h3>Change Background</h3>
              <button onClick={() => setShowBgInput(false)} className="close-panel-macos">✕</button>
            </div>
            <div className="bg-options-macos-nav">
              <label className="upload-label-macos-nav">
                <FaCamera /> Upload from device
                <input type="file" accept="image/*" onChange={handleSetBackground} hidden />
              </label>
              <div className="url-input-group-macos">
                <input 
                  type="text" 
                  placeholder="Image URL"
                  value={bgUrlInput}
                  onChange={(e) => setBgUrlInput(e.target.value)}
                  className="bg-url-input-macos-nav"
                />
                <button onClick={handleBgUrlSubmit} className="apply-bg-btn-macos-nav">Apply</button>
              </div>
              {localStorage.getItem('imfuyo_background') && (
                <button onClick={removeBackground} className="remove-bg-btn-macos-nav">
                  Reset to Default
                </button>
              )}
            </div>
          </div>
        )}
      </nav>
      
      {/* Overlay for mobile menu */}
      {isMenuOpen && <div className="mobile-overlay-macos" onClick={() => setIsMenuOpen(false)}></div>}
    </>
  );
};

export default Navbar;