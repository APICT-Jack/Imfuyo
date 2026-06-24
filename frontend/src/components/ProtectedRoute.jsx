import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children, role, requireVerified = false }) => {
  const { user, loading, isAuthenticated } = useAuth();

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Check role
  if (role && user?.role !== role) {
    return <Navigate to="/" replace />;
  }

  // Check verification - allow pending users to access
  if (requireVerified) {
    // Allow access if verified OR pending (documents submitted)
    const canAccess = user?.isVerified === true || user?.verificationStatus === 'pending';
    if (!canAccess) {
      return <Navigate to="/seller/verify" replace />;
    }
  }

  return children;
};

export default ProtectedRoute;