import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { 
  FaExclamationTriangle, 
  FaInfoCircle, 
  FaCheckCircle, 
  FaSpinner, 
  FaTrash, 
  FaCloudUploadAlt,
  FaGavel,
  FaShoppingCart,
  FaClock,
  FaDollarSign,
  FaArrowUp,
  FaCalendarAlt
} from 'react-icons/fa';
import './AddLivestock.css';

const AddLivestock = () => {
  const { user, token, fetchUser } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    type: 'cattle',
    breed: '',
    age: '',
    ageUnit: 'months',
    weight: '',
    price: '',
    quantity: 1,
    description: '',
    healthStatus: 'good',
    vaccinated: false,
    location: '',
    images: [],
    orderType: 'once_off',
    // Bid-specific fields (direct, not nested)
    startingBid: '',
    reservePrice: '',
    minimumIncrement: '',
    bidEndTime: ''
  });
  const [uploadingImages, setUploadingImages] = useState(false);
  const [uploadingVideos, setUploadingVideos] = useState(false);
  const [error, setError] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [videos, setVideos] = useState([]);
  const [debugInfo, setDebugInfo] = useState('');

  // Debug logging
  console.log('AddLivestock - User:', user);
  console.log('AddLivestock - verificationStatus:', user?.verificationStatus);

  // Check if user can list items
  const isPending = user?.verificationStatus === 'pending' && !user?.isVerified;
  const isNotSubmitted = user?.verificationStatus === 'not_submitted' && !user?.isVerified;

  // If user hasn't submitted verification at all, show message instead of auto-redirect
  if (isNotSubmitted) {
    return (
      <div className="add-livestock-container">
        <div className="add-livestock-card">
          <h2>Add Livestock for Sale</h2>
          <div className="warning-banner not-submitted">
            <FaExclamationTriangle />
            <div>
              <strong>Verification Required</strong>
              <p>Please complete verification before listing items. This helps build trust with buyers.</p>
              <button onClick={() => navigate('/seller/verify')} className="verify-link">
                Complete Verification Now →
              </button>
            </div>
          </div>
          <div className="info-note">
            <FaInfoCircle />
            <small>Verification helps protect both buyers and sellers.</small>
          </div>
        </div>
      </div>
    );
  }

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    // Handle checkbox inputs
    if (type === 'checkbox') {
      setFormData({
        ...formData,
        [name]: checked
      });
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
  };

  const handleOrderTypeChange = (type) => {
    setFormData({
      ...formData,
      orderType: type,
      // Reset bid-specific fields when switching to once_off
      ...(type === 'once_off' && {
        startingBid: '',
        reservePrice: '',
        minimumIncrement: '',
        bidEndTime: ''
      })
    });
  };

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (formData.images.length + files.length > 10) {
      setError('Maximum 10 images allowed');
      return;
    }
    
    setUploadingImages(true);
    setUploadProgress(0);
    
    try {
      const uploadedUrls = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const formDataImg = new FormData();
        formDataImg.append('image', file);
        
        const response = await axios.post(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/upload/image`, formDataImg, {
          headers: {
            'Content-Type': 'multipart/form-data',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        uploadedUrls.push(response.data.url);
        setUploadProgress(((i + 1) / files.length) * 100);
      }
      
      setFormData({
        ...formData,
        images: [...formData.images, ...uploadedUrls]
      });
      setError('');
    } catch (error) {
      console.error('Upload error:', error);
      setError('Error uploading images. Please try again.');
    } finally {
      setUploadingImages(false);
      setUploadProgress(0);
    }
  };

  const handleVideoUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (videos.length + files.length > 3) {
      setError('Maximum 3 videos allowed');
      return;
    }
    
    setUploadingVideos(true);
    setUploadProgress(0);
    
    try {
      const uploadedUrls = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const formDataVideo = new FormData();
        formDataVideo.append('video', file);
        
        const response = await axios.post(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/upload/video`, formDataVideo, {
          headers: {
            'Content-Type': 'multipart/form-data',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        uploadedUrls.push(response.data.url);
        setUploadProgress(((i + 1) / files.length) * 100);
      }
      
      setVideos([...videos, ...uploadedUrls]);
      setError('');
    } catch (error) {
      console.error('Video upload error:', error);
      setError('Error uploading videos. Please try again.');
    } finally {
      setUploadingVideos(false);
      setUploadProgress(0);
    }
  };

  const removeImage = (indexToRemove) => {
    setFormData({
      ...formData,
      images: formData.images.filter((_, index) => index !== indexToRemove)
    });
  };

  const removeVideo = (indexToRemove) => {
    setVideos(videos.filter((_, index) => index !== indexToRemove));
  };

  const validateBidDetails = () => {
    if (formData.orderType === 'bid') {
      const { startingBid, bidEndTime, reservePrice, minimumIncrement } = formData;
      
      if (!startingBid || parseFloat(startingBid) <= 0) {
        setError('Please enter a valid starting bid amount');
        return false;
      }
      
      if (!bidEndTime) {
        setError('Please select an end date/time for the bidding');
        return false;
      }
      
      const endDate = new Date(bidEndTime);
      if (endDate <= new Date()) {
        setError('Bid end time must be in the future');
        return false;
      }
      
      if (reservePrice && parseFloat(reservePrice) < parseFloat(startingBid)) {
        setError('Reserve price cannot be lower than starting bid');
        return false;
      }
      
      if (minimumIncrement && parseFloat(minimumIncrement) <= 0) {
        setError('Minimum increment must be greater than 0');
        return false;
      }
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setDebugInfo('');
    
    if (formData.images.length === 0) {
      setError('Please upload at least one image');
      setLoading(false);
      return;
    }
    
    // Validate bid details if order type is bid
    if (formData.orderType === 'bid' && !validateBidDetails()) {
      setLoading(false);
      return;
    }
    
    try {
      // Prepare submit data based on order type
      let submitData = {
        type: formData.type,
        breed: formData.breed,
        age: parseInt(formData.age),
        ageUnit: formData.ageUnit,
        description: formData.description,
        healthStatus: formData.healthStatus,
        vaccinated: formData.vaccinated,
        location: formData.location,
        images: formData.images,
        orderType: formData.orderType
      };
      
      // Add optional fields only if they have values
      if (formData.weight && formData.weight !== '') {
        submitData.weight = parseFloat(formData.weight);
      }
      
      // Add quantity for once_off or set to 1 for bid
      if (formData.orderType === 'once_off') {
        submitData.quantity = parseInt(formData.quantity);
        submitData.price = parseFloat(formData.price);
      } else {
        submitData.quantity = 1;
        // For bid listings, create the bidDetails object as expected by backend
        submitData.bidDetails = {
          startingBid: parseFloat(formData.startingBid),
          bidEndTime: formData.bidEndTime
        };
        
        // Add optional bid details only if provided
        if (formData.minimumIncrement && formData.minimumIncrement !== '') {
          submitData.bidDetails.minimumIncrement = parseFloat(formData.minimumIncrement);
        }
        if (formData.reservePrice && formData.reservePrice !== '') {
          submitData.bidDetails.reservePrice = parseFloat(formData.reservePrice);
        }
      }
      
      // Add videos only if there are any
      if (videos.length > 0) {
        submitData.videos = videos;
      }
      
      // Log the complete request for debugging
      console.log('Submitting data:', JSON.stringify(submitData, null, 2));
      setDebugInfo(`Sending: ${JSON.stringify(submitData, null, 2)}`);
      
      const currentToken = localStorage.getItem('token');
      const response = await axios.post(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/livestock`, submitData, {
        headers: {
          'Authorization': `Bearer ${currentToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('Success response:', response.data);
      
      const message = formData.orderType === 'bid' 
        ? `✓ Livestock listed for auction!\n\nStarting bid: R${formData.startingBid}\nAuction ends: ${new Date(formData.bidEndTime).toLocaleString()}`
        : '✓ Livestock listed successfully!';
      
      if (isPending) {
        alert(message + '\n\nNote: Your account verification is pending. Your listing will show a "Seller Unverified" warning badge until your account is verified.');
      } else {
        alert(message);
      }
      
      navigate('/seller/dashboard');
    } catch (error) {
      console.error('Submit error:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      console.error('Error headers:', error.response?.headers);
      
      // Display detailed error message from server
      let errorMessage = 'Error creating listing. Please try again.';
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.data?.errors) {
        errorMessage = JSON.stringify(error.response.data.errors);
      }
      
      setError(errorMessage);
      setDebugInfo(`Server error: ${JSON.stringify(error.response?.data, null, 2)}`);
      
      if (error.response?.status === 401) {
        setError('Your session has expired. Please login again.');
        setTimeout(() => navigate('/login'), 2000);
      } else if (error.response?.status === 403) {
        setError(error.response?.data?.message || 'Please complete verification first');
      }
    } finally {
      setLoading(false);
    }
  };

  // Show loading while checking
  if (!user) {
    return (
      <div className="add-livestock-container">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  return (
    <div className="add-livestock-container">
      <div className="add-livestock-card">
        <h2>Add Livestock for Sale</h2>
        
        {/* Verification Status Banner */}
        {isPending && (
          <div className="warning-banner pending">
            <FaExclamationTriangle />
            <div>
              <strong>Verification Pending</strong>
              <p>Your verification documents are being reviewed. You can still list items, but your listings will show a "Seller Unverified" warning badge.</p>
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
              <p>Your account is verified. Buyers trust verified sellers!</p>
            </div>
          </div>
        )}
        
        {error && (
          <div className="error-message">
            <strong>Error:</strong> {error}
          </div>
        )}
        
        {debugInfo && (
          <div className="debug-info" style={{ background: '#f0f0f0', padding: '10px', margin: '10px 0', fontSize: '12px', overflow: 'auto', maxHeight: '200px' }}>
            <strong>Debug Info:</strong>
            <pre>{debugInfo}</pre>
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="livestock-form">
          {/* Order Type Selection */}
          <div className="order-type-section">
            <label className="section-label">Listing Type *</label>
            <div className="order-type-buttons">
              <button
                type="button"
                className={`order-type-btn ${formData.orderType === 'once_off' ? 'active' : ''}`}
                onClick={() => handleOrderTypeChange('once_off')}
              >
                <FaShoppingCart /> Fixed Price
              </button>
              <button
                type="button"
                className={`order-type-btn ${formData.orderType === 'bid' ? 'active' : ''}`}
                onClick={() => handleOrderTypeChange('bid')}
              >
                <FaGavel /> Auction / Bid
              </button>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Type *</label>
              <select name="type" value={formData.type} onChange={handleChange} required>
                <option value="cattle">🐄 Cattle</option>
                <option value="sheep">🐑 Sheep</option>
                <option value="goat">🐐 Goat</option>
                <option value="pig">🐷 Pig</option>
                <option value="chicken">🐔 Chicken</option>
                <option value="horse">🐴 Horse</option>
                <option value="other">Other</option>
              </select>
            </div>
            
            <div className="form-group">
              <label>Breed *</label>
              <input type="text" name="breed" value={formData.breed} onChange={handleChange} placeholder="e.g., Holstein, Angus" required />
            </div>
          </div>
          
          <div className="form-row">
            <div className="form-group">
              <label>Age *</label>
              <input type="number" name="age" value={formData.age} onChange={handleChange} placeholder="Age" required />
            </div>
            <div className="form-group">
              <label>Unit</label>
              <select name="ageUnit" value={formData.ageUnit} onChange={handleChange}>
                <option value="months">Months</option>
                <option value="years">Years</option>
              </select>
            </div>
          </div>
          
          <div className="form-row">
            <div className="form-group">
              <label>Weight (kg)</label>
              <input type="number" name="weight" value={formData.weight} onChange={handleChange} placeholder="Weight in kg" step="0.1" />
            </div>
            
            {/* Price field - changes based on order type */}
            {formData.orderType === 'once_off' && (
              <div className="form-group">
                <label>Price (R) *</label>
                <input type="number" name="price" value={formData.price} onChange={handleChange} placeholder="Price in ZAR" required step="0.01" />
              </div>
            )}
          </div>

          {/* Bid Details Section */}
          {formData.orderType === 'bid' && (
            <div className="bid-details-section">
              <h3>Auction Details</h3>
              <div className="form-row">
                <div className="form-group">
                  <label><FaDollarSign /> Starting Bid (R) *</label>
                  <input 
                    type="number" 
                    name="startingBid"
                    value={formData.startingBid} 
                    onChange={handleChange} 
                    placeholder="Minimum starting bid"
                    required
                    step="0.01"
                  />
                </div>
                
                <div className="form-group">
                  <label><FaArrowUp /> Reserve Price (R)</label>
                  <input 
                    type="number" 
                    name="reservePrice"
                    value={formData.reservePrice} 
                    onChange={handleChange} 
                    placeholder="Optional - Minimum acceptable price"
                    step="0.01"
                  />
                  <small>If not met, item won't sell</small>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Minimum Increment (R)</label>
                  <input 
                    type="number" 
                    name="minimumIncrement"
                    value={formData.minimumIncrement} 
                    onChange={handleChange} 
                    placeholder="Leave empty for 5% auto"
                    step="0.01"
                  />
                  <small>Minimum bid increase amount</small>
                </div>
                
                <div className="form-group">
                  <label><FaCalendarAlt /> Auction End Date/Time *</label>
                  <input 
                    type="datetime-local" 
                    name="bidEndTime"
                    value={formData.bidEndTime} 
                    onChange={handleChange} 
                    required
                  />
                </div>
              </div>

              <div className="bid-info">
                <FaInfoCircle />
                <small>
                  Auctions typically attract more buyers and can result in higher selling prices.
                  Set a reasonable starting bid to encourage participation.
                </small>
              </div>
            </div>
          )}
          
          <div className="form-row">
            <div className="form-group">
              <label>Quantity *</label>
              <input 
                type="number" 
                name="quantity" 
                value={formData.quantity} 
                onChange={handleChange} 
                min="1" 
                required 
                disabled={formData.orderType === 'bid'}
              />
              {formData.orderType === 'bid' && (
                <small>Quantity fixed at 1 for auction listings</small>
              )}
            </div>
            <div className="form-group">
              <label>Location *</label>
              <input type="text" name="location" value={formData.location} onChange={handleChange} placeholder="City, State/Province" required />
            </div>
          </div>
          
          <div className="form-row">
            <div className="form-group">
              <label>Health Status</label>
              <select name="healthStatus" value={formData.healthStatus} onChange={handleChange}>
                <option value="excellent">Excellent - Healthy and strong</option>
                <option value="good">Good - Minor issues</option>
                <option value="fair">Fair - Some concerns</option>
                <option value="poor">Poor - Health issues</option>
              </select>
            </div>
            <div className="form-group">
              <label className="checkbox-label">
                <input type="checkbox" name="vaccinated" checked={formData.vaccinated} onChange={handleChange} />
                <span>✓ Vaccinated</span>
              </label>
            </div>
          </div>
          
          <div className="form-group">
            <label>Description *</label>
            <textarea 
              name="description" 
              value={formData.description} 
              onChange={handleChange} 
              rows="4" 
              placeholder="Describe your livestock - health history, temperament, special features, etc."
              required
            ></textarea>
          </div>
          
          {/* Images Upload */}
          <div className="form-group">
            <label>Images * (Up to 10 images)</label>
            <div className="image-upload-area">
              <input 
                type="file" 
                accept="image/*" 
                multiple 
                onChange={handleImageUpload} 
                disabled={uploadingImages}
                id="image-upload"
                style={{ display: 'none' }}
              />
              <label htmlFor="image-upload" className="upload-button">
                <FaCloudUploadAlt /> Choose Images
              </label>
              {uploadingImages && (
                <div className="upload-progress-bar">
                  <div className="progress-fill" style={{ width: `${uploadProgress}%` }}></div>
                  <span>{Math.round(uploadProgress)}%</span>
                </div>
              )}
              {formData.images.length > 0 && (
                <div className="image-previews">
                  {formData.images.map((url, idx) => (
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
            <small className="helper-text">Upload clear, well-lit photos of the livestock from different angles</small>
          </div>

          {/* Videos Upload (Optional) */}
          <div className="form-group">
            <label>Videos (Optional - Up to 3 videos)</label>
            <div className="video-upload-area">
              <input 
                type="file" 
                accept="video/*" 
                multiple 
                onChange={handleVideoUpload} 
                disabled={uploadingVideos}
                id="video-upload"
                style={{ display: 'none' }}
              />
              <label htmlFor="video-upload" className="upload-button">
                <FaCloudUploadAlt /> Choose Videos
              </label>
              {uploadingVideos && (
                <div className="upload-progress-bar">
                  <div className="progress-fill" style={{ width: `${uploadProgress}%` }}></div>
                  <span>{Math.round(uploadProgress)}%</span>
                </div>
              )}
              {videos.length > 0 && (
                <div className="video-previews">
                  {videos.map((url, idx) => (
                    <div key={idx} className="preview-container">
                      <video src={url} className="preview-video" controls />
                      <button type="button" onClick={() => removeVideo(idx)} className="remove-image">
                        <FaTrash />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <small className="helper-text">Add videos to show livestock movement and behavior (MP4, MOV, max 50MB each)</small>
          </div>
          
          <button type="submit" disabled={loading || uploadingImages || uploadingVideos} className="submit-btn">
            {loading ? (
              <>
                <FaSpinner className="spinner" /> Listing...
              </>
            ) : (
              formData.orderType === 'bid' ? 'List for Auction' : 'List Livestock for Sale'
            )}
          </button>
        </form>
        
        <div className="info-note">
          <FaInfoCircle />
          <small>
            {formData.orderType === 'bid' 
              ? 'Auction listings run for the specified duration. The highest bidder at the end wins, provided reserve price is met.'
              : isPending 
                ? 'Your listing will be visible to buyers immediately but will show a verification warning badge until your account is verified.'
                : 'All listings are reviewed for compliance. Verified sellers get priority placement and trust badges.'}
          </small>
        </div>
      </div>
    </div>
  );
};

export default AddLivestock;