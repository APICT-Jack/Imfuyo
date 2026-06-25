import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { FaExclamationTriangle, FaInfoCircle, FaCheckCircle, FaSpinner, FaCloudUploadAlt, FaTrash, FaTruck } from 'react-icons/fa';
import './AddVehicle.css';

// API Base URL from environment variable
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const AddVehicle = () => {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    type: 'truck',
    model: '',
    capacity: '',
    licensePlate: '',
    pricePerDay: '',
    pricePerKm: '',
    description: '',
    location: '',
    features: ''
  });
  const [images, setImages] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);

  // Check if user can list items
  const isPending = user?.verificationStatus === 'pending' && !user?.isVerified;
  const isNotSubmitted = user?.verificationStatus === 'not_submitted' && !user?.isVerified;

  // If user hasn't submitted verification at all, show message instead of auto-redirect
  if (isNotSubmitted) {
    return (
      <div className="add-vehicle-container">
        <div className="add-vehicle-card">
          <h2><FaTruck /> Add Vehicle Listing</h2>
          <div className="warning-banner not-submitted">
            <FaExclamationTriangle />
            <div>
              <strong>Verification Required</strong>
              <p>Please complete verification before listing vehicles. This helps build trust with renters.</p>
              <button onClick={() => navigate('/seller/verify')} className="verify-link">
                Complete Verification Now →
              </button>
            </div>
          </div>
          <div className="info-note">
            <FaInfoCircle />
            <small>Verification helps protect both renters and owners.</small>
          </div>
        </div>
      </div>
    );
  }

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (images.length + files.length > 10) {
      setError('Maximum 10 images allowed');
      return;
    }
    
    setUploading(true);
    setUploadProgress(0);
    
    const formDataImg = new FormData();
    files.forEach(file => {
      formDataImg.append('images', file);
    });
    
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(`${API_BASE_URL}/upload/images`, formDataImg, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token}`
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(percentCompleted);
        }
      });
      setImages(response.data.urls);
      setError('');
    } catch (error) {
      console.error('Upload error:', error);
      setError('Error uploading images. Please try again.');
      if (error.response?.status === 401) {
        setError('Your session has expired. Please login again.');
        setTimeout(() => navigate('/login'), 2000);
      }
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const removeImage = (indexToRemove) => {
    setImages(images.filter((_, index) => index !== indexToRemove));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    // FIXED: Check images state, not formData.images
    if (images.length === 0) {
      setError('Please upload at least one image');
      setLoading(false);
      return;
    }
    
    // Parse features from comma-separated string to array
    const featuresArray = formData.features 
      ? formData.features.split(',').map(f => f.trim()).filter(f => f)
      : [];
    
    try {
      const submitData = {
        type: formData.type,
        model: formData.model,
        capacity: formData.capacity,
        licensePlate: formData.licensePlate,
        pricePerDay: parseFloat(formData.pricePerDay),
        pricePerKm: formData.pricePerKm ? parseFloat(formData.pricePerKm) : undefined,
        description: formData.description,
        location: formData.location,
        features: featuresArray,
        images: images
      };
      
      console.log('Submitting vehicle data:', submitData);
      
      const currentToken = localStorage.getItem('token');
      const response = await axios.post(`${API_BASE_URL}/vehicles`, submitData, {
        headers: {
          'Authorization': `Bearer ${currentToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('Response:', response.data);
      
      const message = isPending
        ? '✓ Vehicle listed successfully!\n\nNote: Your account verification is pending. Your listing will show a "Owner Unverified" warning badge until your account is verified.'
        : '✓ Vehicle listed successfully!';
      
      alert(message);
      navigate('/seller/dashboard');
      
    } catch (error) {
      console.error('Submit error:', error);
      console.error('Error response:', error.response?.data);
      
      if (error.response?.status === 400) {
        const errorMessage = error.response?.data?.message || error.response?.data?.errors?.[0]?.msg || 'Invalid data. Please check all fields.';
        setError(errorMessage);
      } else if (error.response?.status === 401) {
        setError('Your session has expired. Please login again.');
        setTimeout(() => navigate('/login'), 2000);
      } else if (error.response?.status === 403) {
        setError(error.response?.data?.message || 'Please complete verification first');
      } else {
        setError(error.response?.data?.message || 'Error creating listing. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Show loading while checking
  if (!user) {
    return (
      <div className="add-vehicle-container">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  return (
    <div className="add-vehicle-container">
      <div className="add-vehicle-card">
        <h2><FaTruck /> Add Vehicle Listing</h2>
        
        {/* Verification Status Banner */}
        {isPending && (
          <div className="warning-banner pending">
            <FaExclamationTriangle />
            <div>
              <strong>Verification Pending</strong>
              <p>Your verification documents are being reviewed. Your listing will show an "Unverified Owner" warning badge until verified.</p>
              <button onClick={() => navigate('/seller/verify')} className="verify-link">
                Check Verification Status →
              </button>
            </div>
          </div>
        )}
        
        {user?.isVerified && (
          <div className="success-banner">
            <FaCheckCircle />
            <div>
              <strong>Verified Seller</strong>
              <p>Your account is verified. Renters trust verified owners!</p>
            </div>
          </div>
        )}
        
        {error && <div className="error-message">{error}</div>}
        
        <form onSubmit={handleSubmit} className="vehicle-form">
          <div className="form-row">
            <div className="form-group">
              <label>Vehicle Type *</label>
              <select name="type" onChange={handleChange} value={formData.type} required>
                <option value="truck">🚚 Truck</option>
                <option value="trailer">🚛 Trailer</option>
                <option value="van">🚐 Van</option>
                <option value="pickup">🛻 Pickup</option>
                <option value="other">Other</option>
              </select>
            </div>
            
            <div className="form-group">
              <label>Model *</label>
              <input type="text" name="model" value={formData.model} onChange={handleChange} placeholder="e.g., Ford F-150, Mercedes Sprinter" required />
            </div>
          </div>
          
          <div className="form-row">
            <div className="form-group">
              <label>Capacity *</label>
              <input type="text" name="capacity" value={formData.capacity} onChange={handleChange} placeholder="e.g., 2 tons, 10 livestock, 5 passengers" required />
            </div>
            
            <div className="form-group">
              <label>License Plate *</label>
              <input type="text" name="licensePlate" value={formData.licensePlate} onChange={handleChange} placeholder="License plate number" required />
            </div>
          </div>
          
          <div className="form-row">
            <div className="form-group">
              <label>Price per Day (ZAR) *</label>
              <input type="number" name="pricePerDay" value={formData.pricePerDay} onChange={handleChange} placeholder="Daily rental rate in Rands" required />
            </div>
            <div className="form-group">
              <label>Price per KM (ZAR)</label>
              <input type="number" name="pricePerKm" value={formData.pricePerKm} onChange={handleChange} placeholder="Optional: per kilometer rate" step="0.01" />
            </div>
          </div>
          
          <div className="form-group">
            <label>Location *</label>
            <input type="text" name="location" value={formData.location} onChange={handleChange} placeholder="City, Province" required />
          </div>
          
          <div className="form-group">
            <label>Features (comma-separated)</label>
            <input type="text" name="features" value={formData.features} onChange={handleChange} placeholder="e.g., GPS, Air Conditioning, Hydraulic Lift, Refrigerated" />
            <small className="helper-text">Separate features with commas</small>
          </div>
          
          <div className="form-group">
            <label>Description *</label>
            <textarea 
              name="description" 
              rows="4" 
              value={formData.description} 
              onChange={handleChange} 
              placeholder="Describe your vehicle - condition, special equipment, insurance, availability, etc."
              required
            ></textarea>
          </div>
          
          <div className="form-group">
            <label>Images * (Up to 10 images)</label>
            <div className="image-upload-area">
              <input 
                type="file" 
                accept="image/*" 
                multiple 
                onChange={handleImageUpload} 
                disabled={uploading}
                id="vehicle-image-upload"
                style={{ display: 'none' }}
              />
              <label htmlFor="vehicle-image-upload" className="upload-button">
                <FaCloudUploadAlt /> Choose Images
              </label>
              {uploading && (
                <div className="upload-progress-bar">
                  <div className="progress-fill" style={{ width: `${uploadProgress}%` }}></div>
                  <span>{uploadProgress}%</span>
                </div>
              )}
              {images.length > 0 && (
                <div className="image-previews">
                  {images.map((url, idx) => (
                    <div key={idx} className="preview-container">
                      <img src={url} alt={`Preview ${idx}`} className="preview-image" />
                      <button type="button" onClick={() => removeImage(idx)} className="remove-image">
                        <FaTrash />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <small className="helper-text">Upload clear photos of exterior, interior, and any special features</small>
          </div>
          
          <button type="submit" disabled={loading || uploading} className="submit-btn">
            {loading ? (
              <>
                <FaSpinner className="spinner" /> Creating Listing...
              </>
            ) : (
              'List Vehicle for Rent'
            )}
          </button>
        </form>
        
        <div className="info-note">
          <FaInfoCircle />
          <small>
            {isPending 
              ? 'Your listing will be visible to renters immediately but will show a verification warning badge until your account is verified.'
              : 'All vehicle listings are reviewed. Verified owners get priority placement and trust badges.'}
          </small>
        </div>
      </div>
    </div>
  );
};

export default AddVehicle;