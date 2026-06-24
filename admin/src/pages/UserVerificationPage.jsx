import React, { useState, useEffect } from 'react';
import { adminAPI } from '../services/api';
import UserVerification from '../components/Users/UserVerification';
import LoadingSpinner from '../components/Common/LoadingSpinner';
import toast from 'react-hot-toast';
import './UserVerificationPage.css';

const UserVerificationPage = () => {
  const [pendingUsers, setPendingUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);

  useEffect(() => {
    fetchPendingUsers();
  }, []);

  const fetchPendingUsers = async () => {
    try {
      const response = await adminAPI.getUsers({ verificationStatus: 'pending' });
      setPendingUsers(response.data.users);
    } catch (error) {
      toast.error('Failed to fetch pending users');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (userId, status, rejectionReason = null) => {
    try {
      await adminAPI.verifyUser(userId, { status, rejectionReason });
      toast.success(`User ${status === 'approved' ? 'approved' : 'rejected'} successfully`);
      fetchPendingUsers();
      setSelectedUser(null);
    } catch (error) {
      toast.error('Failed to update verification status');
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="user-verification-page fade-in">
      <div className="page-header">
        <h1>User Verification</h1>
        <p>Review and verify seller verification requests</p>
      </div>

      {pendingUsers.length === 0 ? (
        <div className="empty-state">
          <p>No pending verification requests</p>
        </div>
      ) : (
        <div className="verification-grid">
          {pendingUsers.map(user => (
            <UserVerification
              key={user._id}
              user={user}
              onVerify={handleVerify}
              onViewDetails={() => setSelectedUser(user)}
            />
          ))}
        </div>
      )}

      {selectedUser && (
        <div className="modal" onClick={() => setSelectedUser(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h2>User Details</h2>
            <div className="user-details">
              <p><strong>Name:</strong> {selectedUser.name}</p>
              <p><strong>Email:</strong> {selectedUser.email}</p>
              <p><strong>Phone:</strong> {selectedUser.phone}</p>
              <p><strong>Business Name:</strong> {selectedUser.businessName || 'N/A'}</p>
              <p><strong>Business Address:</strong> {selectedUser.businessAddress || 'N/A'}</p>
              
              <h3>Verification Documents</h3>
              {selectedUser.verificationDocuments?.faceRecognitionImage && (
                <div className="document">
                  <strong>Face Recognition:</strong>
                  <img src={selectedUser.verificationDocuments.faceRecognitionImage} alt="Face" />
                </div>
              )}
              {selectedUser.verificationDocuments?.identityDocument && (
                <div className="document">
                  <strong>Identity Document:</strong>
                  <img src={selectedUser.verificationDocuments.identityDocument} alt="ID" />
                </div>
              )}
              {selectedUser.verificationDocuments?.residentCertificate && (
                <div className="document">
                  <strong>Resident Certificate:</strong>
                  <img src={selectedUser.verificationDocuments.residentCertificate} alt="Resident" />
                </div>
              )}
            </div>
            <button onClick={() => setSelectedUser(null)}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserVerificationPage;