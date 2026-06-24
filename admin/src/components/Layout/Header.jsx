import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { formatDate } from '../../utils/formatters';
import './Header.css';

const Header = () => {
  const { user } = useAuth();

  return (
    <header className="header">
      <div className="header-left">
        <h1>Welcome back, {user?.name || 'Admin'}!</h1>
        <p>{formatDate(new Date())}</p>
      </div>
      <div className="header-right">
        <div className="admin-info">
          <div className="admin-avatar">
            {user?.name?.charAt(0) || 'A'}
          </div>
          <div className="admin-details">
            <span className="admin-name">{user?.name || 'Admin'}</span>
            <span className="admin-role">Administrator</span>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;