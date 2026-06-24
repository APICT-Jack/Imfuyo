import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { FaSpinner, FaCloudUploadAlt, FaTrash, FaPaw, FaInfoCircle } from 'react-icons/fa';
import './AddLivestock.css';

const EditLivestock = () => {
  const { id } = useParams();
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    type: 'cattle',
    breed: '',
    age: '',
    ageUnit: 'months',
    weight: '',
    price: '',
    quantity: 1,
    description: '',
    location: '',
    healthStatus: 'good',
    vaccinated: false,
    orderType: 'once_off'
  });
  const [images, setImages] = useState([]);
  const [videos, setVideos] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  useEffect(() => {
    fetchLivestock();
  }, [id]);

  const fetchLivestock = async () => {
    try {
      const response = await axios.get(`http://localhost:5000/api/livestock/${id}`);
      const livestock = response.data;
      
      setFormData({
        type: livestock.type,
        breed: livestock.breed,
        age: livestock.age,
        ageUnit: livestock.ageUnit || 'months',
        weight: livestock.weight || '',
        price: livestock.price || '',
        quantity: livestock.quantity || 1,
        description: livestock.description,
        location: livestock.location,
        healthStatus: livestock.healthStatus || 'good',
        vaccinated: livestock.vaccinated || false,
        orderType: livestock.orderType || 'once_off'
      });
      setImages(livestock.images || []);
      setVideos(livestock.videos || []);
    } catch (error) {
      console.error('Error fetching livestock:', error);
      setError('Failed to load listing details');
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
      const response = await axios.post('http://localhost:5000/api/upload/images', formDataImg, {
        headers: {
          'Content-Type': 'multipart/form-data'
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
    
    try {
      const submitData = {
        type: formData.type,
        breed: formData.breed,
        age: parseInt(formData.age),
        ageUnit: formData.ageUnit,
        weight: formData.weight ? parseFloat(formData.weight) : null,
        price: parseFloat(formData.price),
        quantity: parseInt(formData.quantity),
        description: formData.description,
        location: formData.location,
        images: images,
        videos: videos,
        healthStatus: formData.healthStatus,
        vaccinated: formData.vaccinated,
        orderType: formData.orderType
      };
      
      const response = await axios.put(`http://localhost:5000/api/livestock/${id}`, submitData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      alert('Livestock listing updated successfully!');
      navigate('/seller/dashboard');
    } catch (error) {
      console.error('Update error:', error);
      setError(error.response?.data?.message || 'Error updating listing. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="add-livestock-container">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  return (
    <div className="add-livestock-container">
      <div className="add-livestock-card">
        <h2><FaPaw /> Edit Livestock Listing</h2>
        
        {error && <div className="error-message">{error}</div>}
        
        <form onSubmit={handleSubmit} className="livestock-form">
          <div className="form-row">
            <div className="form-group">
              <label>Type *</label>
              <select name="type" value={formData.type} onChange={handleChange} required>
                <option value="cattle">🐄 Cattle</option>
                <option value="sheep">🐑 Sheep</option>
                <option value="goat">🐐 Goat</option>
                <option value="pig">🐷 Pig</option>
                <option value="chicken">🐔 Chicken</option>
                <option value="horse">🐎 Horse</option>
                <option value="other">Other</option>
              </select>
            </div>
            
            <div className="form-group">
              <label>Breed *</label>
              <input type="text" name="breed" value={formData.breed} onChange={handleChange} required />
            </div>
          </div>
          
          <div className="form-row">
            <div className="form-group">
              <label>Age *</label>
              <input type="number" name="age" value={formData.age} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label>Age Unit</label>
              <select name="ageUnit" value={formData.ageUnit} onChange={handleChange}>
                <option value="months">Months</option>
                <option value="years">Years</option>
              </select>
            </div>
          </div>
          
          <div className="form-row">
            <div className="form-group">
              <label>Weight (kg)</label>
              <input type="number" name="weight" value={formData.weight} onChange={handleChange} step="0.1" />
            </div>
            <div className="form-group">
              <label>Price (ZAR) *</label>
              <input type="number" name="price" value={formData.price} onChange={handleChange} required />
            </div>
          </div>
          
          <div className="form-row">
            <div className="form-group">
              <label>Quantity *</label>
              <input type="number" name="quantity" value={formData.quantity} onChange={handleChange} min="1" required />
            </div>
            <div className="form-group">
              <label>Health Status</label>
              <select name="healthStatus" value={formData.healthStatus} onChange={handleChange}>
                <option value="excellent">Excellent</option>
                <option value="good">Good</option>
                <option value="fair">Fair</option>
                <option value="poor">Poor</option>
              </select>
            </div>
          </div>
          
          <div className="form-group">
            <label>Location *</label>
            <input type="text" name="location" value={formData.location} onChange={handleChange} required />
          </div>
          
          <div className="form-group">
            <label className="checkbox-label">
              <input type="checkbox" name="vaccinated" checked={formData.vaccinated} onChange={handleChange} />
              Vaccinated
            </label>
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
            <label>Images * (Up to 10 images)</label>
            <div className="image-upload-area">
              <input 
                type="file" 
                accept="image/*" 
                multiple 
                onChange={handleImageUpload} 
                disabled={uploading}
                id="livestock-image-upload"
                style={{ display: 'none' }}
              />
              <label htmlFor="livestock-image-upload" className="upload-button">
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
                'Update Listing'
              )}
            </button>
          </div>
        </form>
        
        <div className="info-note">
          <FaInfoCircle />
          <small>
            Note: If there are active bids on this listing, some fields cannot be edited.
          </small>
        </div>
      </div>
    </div>
  );
};

export default EditLivestock;