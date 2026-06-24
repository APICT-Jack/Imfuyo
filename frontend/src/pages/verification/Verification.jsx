import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { 
  FaCheckCircle, 
  FaCamera, 
  FaIdCard, 
  FaHome, 
  FaExclamationTriangle, 
  FaSpinner, 
  FaArrowRight,
  FaInfoCircle
} from 'react-icons/fa';
import './Verification.css';

const Verification = () => {
  const { user, token, fetchUser, logout, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [files, setFiles] = useState({
    faceRecognition: null,
    identityDoc: null,
    residentCert: null
  });
  const [previews, setPreviews] = useState({
    faceRecognition: null,
    identityDoc: null,
    residentCert: null
  });
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({});
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Debug logging
  useEffect(() => {
    console.log('=== Verification Component Debug ===');
    console.log('User object:', user);
    console.log('User verificationStatus:', user?.verificationStatus);
    console.log('User isVerified:', user?.isVerified);
    console.log('Token exists:', !!token);
  }, [user]);

  // Redirect if already verified
  useEffect(() => {
    if (user?.isVerified) {
      console.log('User is verified, redirecting to dashboard');
      navigate('/seller/dashboard');
    }
  }, [user, navigate]);

  const handleFileChange = (e, type) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setError('Please upload an image file');
        return;
      }
      
      if (file.size > 5 * 1024 * 1024) {
        setError('File size must be less than 5MB');
        return;
      }
      
      setFiles({
        ...files,
        [type]: file
      });
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviews({
          ...previews,
          [type]: reader.result
        });
      };
      reader.readAsDataURL(file);
      setError('');
    }
  };

  const uploadToCloudinary = async (file, type) => {
    const formData = new FormData();
    formData.append('image', file);
    
    const response = await axios.post('http://localhost:5000/api/upload/image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      },
      onUploadProgress: (progressEvent) => {
        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        setUploadProgress(prev => ({ ...prev, [type]: percentCompleted }));
      }
    });
    return response.data.url;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const storedToken = localStorage.getItem('token');
    if (!storedToken) {
      setError('You must be logged in. Please login again.');
      navigate('/login');
      return;
    }
    
    if (!files.faceRecognition || !files.identityDoc || !files.residentCert) {
      setError('Please upload all required documents');
      return;
    }
    
    setUploading(true);
    setError('');
    
    try {
      console.log('Uploading documents to Cloudinary...');
      const [faceUrl, identityUrl, residentUrl] = await Promise.all([
        uploadToCloudinary(files.faceRecognition, 'face'),
        uploadToCloudinary(files.identityDoc, 'identity'),
        uploadToCloudinary(files.residentCert, 'resident')
      ]);
      
      console.log('Uploads complete. Submitting verification...');
      
      const currentToken = localStorage.getItem('token');
      const response = await axios.post('http://localhost:5000/api/auth/verify', {
        faceRecognitionImage: faceUrl,
        identityDocument: identityUrl,
        residentCertificate: residentUrl
      }, {
        headers: { 
          'Authorization': `Bearer ${currentToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('Verification API response:', response.data);
      
      // IMPORTANT: Force refresh user data
      console.log('Refreshing user data...');
      const refreshedUser = await refreshUser();
      console.log('Refreshed user:', refreshedUser);
      console.log('New verificationStatus:', refreshedUser?.verificationStatus);
      
      setSuccess(true);
      
      // Show success message and redirect after delay
      setTimeout(() => {
        console.log('Redirecting to dashboard...');
        navigate('/seller/dashboard');
      }, 3000);
      
    } catch (error) {
      console.error('Error details:', error);
      console.error('Error response:', error.response);
      
      if (error.response?.status === 401) {
        setError('Your session has expired. Please login again.');
        localStorage.removeItem('token');
        setTimeout(() => {
          logout();
          navigate('/login');
        }, 2000);
      } else if (error.response?.status === 403) {
        setError('You do not have permission to verify. Please ensure you are logged in as a seller.');
      } else {
        setError(error.response?.data?.message || 'Error submitting verification. Please try again.');
      }
    } finally {
      setUploading(false);
    }
  };

  // Success state
  if (success) {
    return (
      <div className="verification-container">
        <div className="verification-card success-card">
          <FaCheckCircle className="success-icon-large" />
          <h2>Verification Submitted Successfully!</h2>
          <p>Your documents have been submitted for review.</p>
          <div className="success-info">
            <h3>What happens next?</h3>
            <ul>
              <li>✓ Our team will review your documents within 24-48 hours</li>
              <li>✓ You can start listing items immediately while verification is pending</li>
              <li>✓ Your listings will show a "Seller Unverified" badge until approved</li>
              <li>✓ You'll receive an email once your account is verified</li>
            </ul>
          </div>
          <button onClick={() => navigate('/seller/dashboard')} className="btn-primary">
            Go to Dashboard <FaArrowRight />
          </button>
        </div>
      </div>
    );
  }

  // Already verified - redirect
  if (user?.isVerified) {
    return null;
  }

  // Pending verification
  if (user?.verificationStatus === 'pending') {
    console.log('Rendering PENDING state - buttons should work');
    return (
      <div className="verification-container">
        <div className="verification-card pending-card">
          <FaExclamationTriangle className="pending-icon" />
          <h2>Verification Pending</h2>
          <p>Your verification documents are being reviewed by our team.</p>
          <div className="pending-info">
            <h3>While you wait:</h3>
            <ul>
              <li>✓ You can already list items for sale</li>
              <li>✓ Your listings will show a "Seller Unverified" badge</li>
              <li>✓ Buyers will be advised to proceed at their own risk</li>
              <li>✓ Once verified, the badge will change to "Verified Seller"</li>
            </ul>
          </div>
          <div className="button-group">
            <button 
              onClick={() => {
                console.log('Start Listing Items clicked - navigating to /seller/add-livestock');
                navigate('/seller/add-livestock');
              }} 
              className="btn-primary"
            >
              Start Listing Items
            </button>
            <button 
              onClick={() => {
                console.log('Go to Dashboard clicked - navigating to /seller/dashboard');
                navigate('/seller/dashboard');
              }} 
              className="btn-secondary"
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Rejected verification
  if (user?.verificationStatus === 'rejected') {
    return (
      <div className="verification-container">
        <div className="verification-card rejected-card">
          <FaExclamationTriangle className="rejected-icon" />
          <h2>Verification Rejected</h2>
          <p>Your verification documents were not approved. Please submit new documents.</p>
          <button onClick={() => window.location.reload()} className="btn-primary">
            Resubmit Documents
          </button>
        </div>
      </div>
    );
  }

  // Main verification form
  return (
    <div className="verification-container">
      <div className="verification-card">
        <div className="verification-header">
          <h2>Seller Verification</h2>
          <p>Complete verification to unlock full features and build trust with buyers</p>
        </div>
        
        <div className="benefits-section">
          <h3>Benefits of Verification:</h3>
          <div className="benefits-grid">
            <div className="benefit-item">
              <FaCheckCircle className="benefit-icon" />
              <span>Verified Seller Badge</span>
            </div>
            <div className="benefit-item">
              <FaCheckCircle className="benefit-icon" />
              <span>Increased Buyer Trust</span>
            </div>
            <div className="benefit-item">
              <FaCheckCircle className="benefit-icon" />
              <span>Priority Listing Placement</span>
            </div>
            <div className="benefit-item">
              <FaCheckCircle className="benefit-icon" />
              <span>Higher Sales Conversion</span>
            </div>
          </div>
        </div>
        
        <div className="info-box">
          <FaInfoCircle />
          <div>
            <strong>Note:</strong> You can start listing items immediately after submitting these documents. 
            Your listings will show a "Seller Unverified" badge until your verification is approved.
          </div>
        </div>
        
        {error && <div className="error-message">{error}</div>}
        
        <form onSubmit={handleSubmit} className="verification-form">
          <div className="upload-section">
            <div className="upload-header">
              <FaCamera className="upload-icon" />
              <div>
                <h4>Face Recognition Photo</h4>
                <p>Upload a clear photo of your face</p>
              </div>
            </div>
            <input 
              type="file" 
              accept="image/*" 
              onChange={(e) => handleFileChange(e, 'faceRecognition')} 
              required 
              id="face-upload"
              style={{ display: 'none' }}
            />
            <label htmlFor="face-upload" className="file-label">
              {previews.faceRecognition ? 'Change Photo' : 'Choose Photo'}
            </label>
            {previews.faceRecognition && (
              <div className="preview-container">
                <img src={previews.faceRecognition} alt="Face preview" className="preview-image" />
                {uploadProgress.face && uploadProgress.face < 100 && (
                  <div className="upload-progress">Uploading: {uploadProgress.face}%</div>
                )}
              </div>
            )}
          </div>
          
          <div className="upload-section">
            <div className="upload-header">
              <FaIdCard className="upload-icon" />
              <div>
                <h4>Identity Document</h4>
                <p>ID card, passport, or driver's license</p>
              </div>
            </div>
            <input 
              type="file" 
              accept="image/*" 
              onChange={(e) => handleFileChange(e, 'identityDoc')} 
              required 
              id="identity-upload"
              style={{ display: 'none' }}
            />
            <label htmlFor="identity-upload" className="file-label">
              {previews.identityDoc ? 'Change Document' : 'Choose Document'}
            </label>
            {previews.identityDoc && (
              <div className="preview-container">
                <img src={previews.identityDoc} alt="Identity preview" className="preview-image" />
                {uploadProgress.identity && uploadProgress.identity < 100 && (
                  <div className="upload-progress">Uploading: {uploadProgress.identity}%</div>
                )}
              </div>
            )}
          </div>
          
          <div className="upload-section">
            <div className="upload-header">
              <FaHome className="upload-icon" />
              <div>
                <h4>Resident Certificate</h4>
                <p>Proof of residence or utility bill</p>
              </div>
            </div>
            <input 
              type="file" 
              accept="image/*" 
              onChange={(e) => handleFileChange(e, 'residentCert')} 
              required 
              id="resident-upload"
              style={{ display: 'none' }}
            />
            <label htmlFor="resident-upload" className="file-label">
              {previews.residentCert ? 'Change Certificate' : 'Choose Certificate'}
            </label>
            {previews.residentCert && (
              <div className="preview-container">
                <img src={previews.residentCert} alt="Resident preview" className="preview-image" />
                {uploadProgress.resident && uploadProgress.resident < 100 && (
                  <div className="upload-progress">Uploading: {uploadProgress.resident}%</div>
                )}
              </div>
            )}
          </div>
          
          <button type="submit" disabled={uploading} className="submit-btn">
            {uploading ? (
              <>
                <FaSpinner className="spinner" /> Submitting Verification...
              </>
            ) : (
              'Submit Verification & Start Selling'
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Verification;