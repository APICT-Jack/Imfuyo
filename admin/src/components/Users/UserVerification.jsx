import React, { useState } from 'react';
import { formatDate } from '../../utils/formatters';
import './UserVerification.css';

const UserVerification = ({ user, onVerify, onViewDetails }) => {
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectionModal, setShowRejectionModal] = useState(false);

  const handleApprove = () => {
    onVerify(user._id, 'approved');
  };

  const handleReject = () => {
    if (rejectionReason.trim()) {
      onVerify(user._id, 'rejected', rejectionReason);
      setShowRejectionModal(false);
      setRejectionReason('');
    }
  };

  return (
    <div className="verification-card">
      <div className="card-header">
        <h3>{user.name}</h3>
        <span className="status-badge pending">Pending</span>
      </div>
      <div className="card-body">
        <p><strong>Email:</strong> {user.email}</p>
        <p><strong>Phone:</strong> {user.phone}</p>
        <p><strong>Business:</strong> {user.businessName || 'N/A'}</p>
        <p><strong>Submitted:</strong> {formatDate(user.verificationDocuments?.submittedAt)}</p>
      </div>
      <div className="card-actions">
        <button className="btn-view" onClick={onViewDetails}>
          View Documents
        </button>
        <button className="btn-approve" onClick={handleApprove}>
          Approve
        </button>
        <button className="btn-reject" onClick={() => setShowRejectionModal(true)}>
          Reject
        </button>
      </div>

      {showRejectionModal && (
        <div className="modal" onClick={() => setShowRejectionModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h3>Rejection Reason</h3>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Please provide a reason for rejection..."
              rows="4"
            />
            <div className="modal-actions">
              <button onClick={() => setShowRejectionModal(false)}>Cancel</button>
              <button onClick={handleReject} disabled={!rejectionReason.trim()}>
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserVerification;