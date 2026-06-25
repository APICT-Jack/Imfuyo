import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { FaSpinner, FaCloudUploadAlt, FaTrash, FaTruck, FaInfoCircle } from 'react-icons/fa';
import './AddVehicle.css';

// API Base URL from environment variable
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const EditVehicle = () => {
  const { id } = useParams();
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    type: 'truck',
    model: '',
    capacity: '',
    licensePlate: '',
    pricePerDay: '',
    pricePerKm: '',
    description: '',
    location: '',
    features: '',
    available: true
  });
  const [images, setImages] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  useEffect(() => {
    fetchVehicle();
  }, [id]);

  const fetchVehicle = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/vehicles/${id}`);
      const vehicle = response.data;
      
      setFormData({
        type: vehicle.type,
        model: vehicle.model,
        capacity: vehicle.capacity,
        licensePlate: vehicle.licensePlate,
        pricePerDay: vehicle.pricePerDay,
        pricePerKm: vehicle.pricePerKm || '',
        description: vehicle.description,
        location: vehicle.location,
        features: vehicle.features ? vehicle.features.join(', ') : '',
        available: vehicle.available
      });
      setImages(vehicle.images || []);
    } catch (error) {
      console.error('Error fetching vehicle:', error);
      setError('Failed to load vehicle details');
      if (error.response?.status === 401) {
        setError('Your session has expired. Please login again.');
        setTimeout(() => navigate('/login'), 2000);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
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
      const currentToken = localStorage.getItem('token');
      const response = await axios.post(`${API_BASE_URL}/upload/images`, formDataImg, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${currentToken}`
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(percentCompleted);
        }
      });
      setImages([...images, ...response.data.urls]);
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
    setSubmitting(true);
    setError('');
    
    if (images.length === 0) {
      setError('Please upload at least one image');
      setSubmitting(false);
      return;
    }
    
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
        images: images,
        available: formData.available
      };
      
      const currentToken = localStorage.getItem('token');
      const response = await axios.put(`${API_BASE_URL}/vehicles/${id}`, submitData, {
        headers: {
          'Authorization': `Bearer ${currentToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      alert('Vehicle updated successfully!');
      navigate('/seller/dashboard');
    } catch (error) {
      console.error('Update error:', error);
      if (error.response?.status === 401) {
        setError('Your session has expired. Please login again.');
        setTimeout(() => navigate('/login'), 2000);
      } else {
        setError(error.response?.data?.message || 'Error updating vehicle. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="add-vehicle-container">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  return (
    <div className="add-vehicle-container">
      <div className="add-vehicle-card">
        <h2><FaTruck /> Edit Vehicle Listing</h2>
        
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
              <input type="text" name="model" value={formData.model} onChange={handleChange} required />
            </div>
          </div>
          
          <div className="form-row">
            <div className="form-group">
              <label>Capacity *</label>
              <input type="text" name="capacity" value={formData.capacity} onChange={handleChange} required />
            </div>
            
            <div className="form-group">
              <label>License Plate *</label>
              <input type="text" name="licensePlate" value={formData.licensePlate} onChange={handleChange} required />
            </div>
          </div>
          
          <div className="form-row">
            <div className="form-group">
              <label>Price per Day (ZAR) *</label>
              <input type="number" name="pricePerDay" value={formData.pricePerDay} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label>Price per KM (ZAR)</label>
              <input type="number" name="pricePerKm" value={formData.pricePerKm} onChange={handleChange} step="0.01" />
            </div>
          </div>
          
          <div className="form-group">
            <label>Location *</label>
            <input type="text" name="location" value={formData.location} onChange={handleChange} required />
          </div>
          
          <div className="form-group">
            <label>Features (comma-separated)</label>
            <input type="text" name="features" value={formData.features} onChange={handleChange} placeholder="e.g., GPS, Air Conditioning, Hydraulic Lift" />
          </div>
          
          <div className="form-group">
            <label>Description *</label>
            <textarea 
              name="description" 
              rows="4" 
              value={formData.description} 
              onChange={handleChange} 
              required
            />
          </div>
          
          <div className="form-group">
            <label className="checkbox-label">
              <input 
                type="checkbox" 
                name="available" 
                checked={formData.available} 
                onChange={handleChange} 
              />
              Available for Rent
            </label>
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
                <FaCloudUploadAlt /> Add More Images
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
          </div>
          
          <div className="form-actions">
            <button type="button" onClick={() => navigate('/seller/dashboard')} className="cancel-btn">
              Cancel
            </button>
            <button type="submit" disabled={submitting || uploading} className="submit-btn">
              {submitting ? (
                <>
                  <FaSpinner className="spinner" /> Updating...
                </>
              ) : (
                'Update Vehicle'
              )}
            </button>
          </div>
        </form>
        
        <div className="info-note">
          <FaInfoCircle />
          <small>
            Note: If your vehicle is currently rented, you cannot edit it until it's marked as available.
          </small>
        </div>
      </div>
    </div>
  );
};

export default EditVehicle;