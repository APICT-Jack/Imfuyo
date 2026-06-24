import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  FiHome, 
  FiUsers, 
  FiCheckCircle, 
  FiList, 
  FiBarChart2, 
  FiSettings,
  FiLogOut
} from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import './Sidebar.css';

const Sidebar = () => {
  const { logout } = useAuth();

  const menuItems = [
    { path: '/dashboard', icon: FiHome, label: 'Dashboard' },
    { path: '/verifications', icon: FiCheckCircle, label: 'Verifications' },
    { path: '/users', icon: FiUsers, label: 'Users' },
    { path: '/listings', icon: FiList, label: 'Listings' },
    { path: '/metrics', icon: FiBarChart2, label: 'System Metrics' },
    { path: '/settings', icon: FiSettings, label: 'Settings' },
  ];

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <h2>IMFuyo Admin</h2>
      </div>
      <nav className="sidebar-nav">
        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => 
              isActive ? 'nav-item active' : 'nav-item'
            }
          >
            <item.icon className="nav-icon" />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>
      <div className="sidebar-footer">
        <button onClick={logout} className="logout-btn">
          <FiLogOut className="nav-icon" />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;