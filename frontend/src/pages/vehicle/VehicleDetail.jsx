// VehicleDetail.jsx - Complete Mobile-First Redesign with Render Compatibility
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  FaArrowLeft, FaShareAlt, FaRegHeart, FaHeart as FaHeartSolid,
  FaTachometerAlt, FaMapMarkerAlt, FaCheckCircle, FaClock,
  FaExclamationTriangle, FaUserCheck, FaPhoneAlt, FaBuilding,
  FaIdCard, FaCalendarAlt, FaTractor, FaInfoCircle, FaWhatsapp,
  FaEnvelope, FaGasPump, FaCog, FaSnowflake, FaWifi, FaTv,
  FaChevronLeft, FaChevronRight, FaExpand, FaTimes, FaCheck,
  FaTag, FaStore, FaShieldAlt, FaStar, FaStarHalfAlt, FaRegStar,
  FaSpinner
} from 'react-icons/fa';
import { GiChicken, GiCow, GiGoat, GiSheep } from 'react-icons/gi';
import SidePanel from '.././SidePanel';
import './VehicleDetail.css';

// API Base URL from environment variable
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const VehicleDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  // State management
  const [vehicle, setVehicle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedImage, setSelectedImage] = useState(0);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [livestock, setLivestock] = useState([]);
  const [livestockLoading, setLivestockLoading] = useState(false);
  const [searchMessage, setSearchMessage] = useState(null);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('details');
  const [showContactOptions, setShowContactOptions] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [booking, setBooking] = useState({
    startDate: '',
    endDate: '',
    customerName: '',
    customerEmail: '',
    customerPhone: ''
  });
  const [bookingLoading, setBookingLoading] = useState(false);
  const [imageLoading, setImageLoading] = useState({});
  const [imageErrors, setImageErrors] = useState({});
  
  const galleryRef = useRef(null);

  useEffect(() => {
    fetchVehicle();
    window.scrollTo(0, 0);
  }, [id]);

  useEffect(() => {
    if (vehicle && vehicle.location) {
      fetchNearbyLivestock();
    }
  }, [vehicle]);

  const fetchVehicle = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/vehicles/${id}`);
      setVehicle(response.data);
      setError(null);
    } catch (error) {
      console.error('Error fetching vehicle:', error);
      if (error.response?.status === 404) {
        setError('Vehicle not found');
      } else {
        setError('Failed to load vehicle details. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchNearbyLivestock = async () => {
    setLivestockLoading(true);
    setSearchMessage(null);
    try {
      const response = await axios.get(`${API_BASE_URL}/vehicles/nearby/livestock`, {
        params: {
          location: vehicle.location,
          limit: 5
        }
      });
      
      setLivestock(response.data.livestock || []);
      setSearchMessage(response.data.message);
    } catch (error) {
      console.error('Error fetching livestock:', error);
      setLivestock([]);
      setSearchMessage('Unable to load livestock suggestions at this time.');
    } finally {
      setLivestockLoading(false);
    }
  };

  const handleBookingChange = (e) => {
    setBooking({
      ...booking,
      [e.target.name]: e.target.value
    });
  };

  const handleBooking = async (e) => {
    e.preventDefault();
    
    if (!vehicle.available) {
      alert('This vehicle is currently on duty/rented and not available for booking.');
      return;
    }
    
    setBookingLoading(true);
    try {
      const currentToken = localStorage.getItem('token');
      const response = await axios.post(`${API_BASE_URL}/vehicles/book`, {
        vehicleId: id,
        ...booking
      }, {
        headers: {
          'Authorization': `Bearer ${currentToken}`
        }
      });
      alert('Booking request submitted successfully! The owner will contact you shortly.');
      setBooking({ 
        startDate: '', 
        endDate: '', 
        customerName: '', 
        customerEmail: '', 
        customerPhone: '' 
      });
      setShowBookingModal(false);
      fetchVehicle();
    } catch (error) {
      console.error('Booking error:', error);
      alert('Error booking vehicle: ' + (error.response?.data?.message || 'Please try again'));
    } finally {
      setBookingLoading(false);
    }
  };

  const getStatusInfo = (available) => {
    if (available) {
      return {
        text: 'Available',
        class: 'vd_status_available',
        icon: <FaCheckCircle />
      };
    } else {
      return {
        text: 'On Duty',
        class: 'vd_status_rented',
        icon: <FaClock />
      };
    }
  };

  const handleContactOwner = (method) => {
    if (!vehicle?.owner) return;
    
    if (method === 'whatsapp' && vehicle.owner.phone) {
      const message = `Hi, I'm interested in your ${vehicle.model} listed on Imfuyo for R${vehicle.pricePerDay}/day`;
      const phone = vehicle.owner.phone.replace(/\D/g, '');
      window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank');
    } else if (method === 'call' && vehicle.owner.phone) {
      window.location.href = `tel:${vehicle.owner.phone}`;
    } else if (method === 'email' && vehicle.owner.email) {
      window.location.href = `mailto:${vehicle.owner.email}`;
    }
    setShowContactOptions(false);
  };

  const handleLivestockClick = (livestockItem) => {
    navigate(`/livestock/${livestockItem._id}`);
  };

  const handleShare = async () => {
    if (!vehicle) return;
    
    const shareData = {
      title: vehicle.model,
      text: `Check out this ${vehicle.model} for R${vehicle.pricePerDay}/day`,
      url: window.location.href,
    };
    
    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.error('Share error:', err);
        }
      }
    } else {
      try {
        await navigator.clipboard.writeText(window.location.href);
        alert('Link copied to clipboard!');
      } catch (err) {
        console.error('Copy error:', err);
        // Fallback
        const input = document.createElement('input');
        input.value = window.location.href;
        document.body.appendChild(input);
        input.select();
        document.execCommand('copy');
        document.body.removeChild(input);
        alert('Link copied to clipboard!');
      }
    }
  };

  const handleSave = async () => {
    if (isSaving) return;
    
    setIsSaving(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      const endpoint = isSaved ? 'unlike' : 'like';
      const response = await axios.post(
        `${API_BASE_URL}/vehicles/${vehicle._id}/${endpoint}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      
      if (response.data.success) {
        setIsSaved(!isSaved);
      }
    } catch (error) {
      console.error('Error saving vehicle:', error);
      if (error.response?.status === 401) {
        navigate('/login');
      } else {
        alert('Failed to save listing. Please try again.');
      }
    } finally {
      setIsSaving(false);
    }
  };

  const formatZARPrice = (price) => {
    if (!price) return 'POA';
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(price);
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-ZA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getLivestockIcon = (type) => {
    const lowerType = type?.toLowerCase() || '';
    if (lowerType.includes('cattle') || lowerType.includes('cow')) return <GiCow size={28} />;
    if (lowerType.includes('sheep')) return <GiSheep size={28} />;
    if (lowerType.includes('goat')) return <GiGoat size={28} />;
    if (lowerType.includes('pig')) return <GiCow size={28} />;
    if (lowerType.includes('chicken') || lowerType.includes('poultry')) return <GiChicken size={28} />;
    return <FaTractor size={24} />;
  };

  const getFeatureIcon = (feature) => {
    const lowerFeature = feature?.toLowerCase() || '';
    if (lowerFeature.includes('air')) return <FaSnowflake />;
    if (lowerFeature.includes('gps')) return <FaMapMarkerAlt />;
    if (lowerFeature.includes('wifi')) return <FaWifi />;
    if (lowerFeature.includes('tv') || lowerFeature.includes('entertainment')) return <FaTv />;
    return <FaCog />;
  };

  const nextImage = () => {
    if (vehicle?.images?.length) {
      setSelectedImage((prev) => (prev + 1) % vehicle.images.length);
    }
  };

  const prevImage = () => {
    if (vehicle?.images?.length) {
      setSelectedImage((prev) => (prev - 1 + vehicle.images.length) % vehicle.images.length);
    }
  };

  const handleImageError = (index) => {
    setImageErrors(prev => ({ ...prev, [index]: true }));
    setImageLoading(prev => ({ ...prev, [index]: false }));
  };

  const handleImageLoad = (index) => {
    setImageLoading(prev => ({ ...prev, [index]: false }));
  };

  const renderStars = (rating) => {
    if (!rating) return null;
    
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    
    for (let i = 0; i < fullStars; i++) {
      stars.push(<FaStar key={i} color="#FFD700" />);
    }
    if (hasHalfStar) {
      stars.push(<FaStarHalfAlt key="half" color="#FFD700" />);
    }
    while (stars.length < 5) {
      stars.push(<FaRegStar key={stars.length} color="#FFD700" />);
    }
    return stars;
  };

  const renderLivestockItem = (livestockItem) => (
    <div className="vd_side_panel_item">
      {livestockItem.images && livestockItem.images[0] ? (
        <img src={livestockItem.images[0]} alt={livestockItem.breed} className="vd_side_panel_image" />
      ) : (
        <div className="vd_side_panel_placeholder">
          {getLivestockIcon(livestockItem.type)}
        </div>
      )}
      <div className="vd_side_panel_info">
        <div className="vd_side_panel_name">
          {livestockItem.type} - {livestockItem.breed}
        </div>
        <div className="vd_side_panel_price">
          {formatZARPrice(livestockItem.price)}
        </div>
        <div className="vd_side_panel_location">
          <FaMapMarkerAlt size={10} /> {livestockItem.location}
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="vd_loading_container">
        <div className="vd_loading_spinner"></div>
        <p className="vd_loading_text">Loading vehicle details...</p>
      </div>
    );
  }

  if (error || !vehicle) {
    return (
      <div className="vd_error_container">
        <div className="vd_error_icon">🚛</div>
        <h2 className="vd_error_title">Vehicle Not Found</h2>
        <p className="vd_error_message">{error || 'The vehicle listing you\'re looking for doesn\'t exist or has been removed.'}</p>
        <button onClick={() => navigate('/vehicles')} className="vd_error_button">
          Browse Vehicles
        </button>
      </div>
    );
  }

  const statusInfo = getStatusInfo(vehicle.available);
  const images = vehicle.images || [];
  const displayImages = images.filter((_, idx) => !imageErrors[idx]);
  const hasMultipleImages = displayImages.length > 1;
  const isOwnerVerified = vehicle.ownerVerified || false;
  const ownerRating = vehicle.owner?.rating;

  return (
    <div className="vd_page">
      {/* Header */}
      <header className="vd_header">
        <button className="vd_back_button" onClick={() => navigate('/vehicles')} aria-label="Go back">
          <FaArrowLeft />
        </button>
        <div className="vd_header_actions">
          <button 
            className="vd_header_action" 
            onClick={handleSave} 
            aria-label="Save listing"
            disabled={isSaving}
          >
            {isSaving ? <FaSpinner className="spinner" /> : (isSaved ? <FaHeartSolid className="vd_saved" /> : <FaRegHeart />)}
          </button>
          <button className="vd_header_action" onClick={handleShare} aria-label="Share listing">
            <FaShareAlt />
          </button>
        </div>
      </header>

      {/* Image Gallery */}
      <div className="vd_gallery" ref={galleryRef}>
        <div className="vd_gallery_main" onClick={() => setIsLightboxOpen(true)}>
          {displayImages.length > 0 ? (
            <>
              {imageLoading[selectedImage] !== false && (
                <div className="vd_image_loader">
                  <FaSpinner className="spinner" />
                </div>
              )}
              <img 
                src={displayImages[selectedImage]} 
                alt={vehicle.model} 
                className="vd_gallery_image"
                onError={() => handleImageError(selectedImage)}
                onLoad={() => handleImageLoad(selectedImage)}
                style={{ display: imageLoading[selectedImage] === false ? 'block' : 'none' }}
              />
            </>
          ) : (
            <div className="vd_gallery_placeholder">
              <FaTractor size={64} />
              <p>No Image Available</p>
            </div>
          )}
          {hasMultipleImages && displayImages.length > 1 && (
            <>
              <button className="vd_gallery_nav vd_gallery_prev" onClick={(e) => { e.stopPropagation(); prevImage(); }}>
                <FaChevronLeft />
              </button>
              <button className="vd_gallery_nav vd_gallery_next" onClick={(e) => { e.stopPropagation(); nextImage(); }}>
                <FaChevronRight />
              </button>
              <div className="vd_gallery_counter">
                {selectedImage + 1} / {displayImages.length}
              </div>
              <button className="vd_gallery_expand">
                <FaExpand />
              </button>
            </>
          )}
        </div>
        
        {hasMultipleImages && displayImages.length > 1 && (
          <div className="vd_gallery_thumbnails">
            {displayImages.map((img, idx) => (
              <div 
                key={idx} 
                className={`vd_thumbnail ${selectedImage === idx ? 'vd_thumbnail_active' : ''}`}
                onClick={() => setSelectedImage(idx)}
              >
                <img src={img} alt={`View ${idx + 1}`} />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Lightbox Modal */}
      {isLightboxOpen && displayImages.length > 0 && (
        <div className="vd_lightbox" onClick={() => setIsLightboxOpen(false)}>
          <button className="vd_lightbox_close" onClick={() => setIsLightboxOpen(false)}>
            <FaTimes />
          </button>
          <img src={displayImages[selectedImage]} alt={vehicle.model} className="vd_lightbox_image" />
          {displayImages.length > 1 && (
            <>
              <button className="vd_lightbox_nav vd_lightbox_prev" onClick={(e) => { e.stopPropagation(); prevImage(); }}>
                <FaChevronLeft />
              </button>
              <button className="vd_lightbox_nav vd_lightbox_next" onClick={(e) => { e.stopPropagation(); nextImage(); }}>
                <FaChevronRight />
              </button>
            </>
          )}
        </div>
      )}

      {/* Main Content */}
      <div className="vd_content">
        {/* Price & Status */}
        <div className="vd_price_section">
          <div>
            <span className="vd_price_label">Price per Day</span>
            <div className="vd_price">{formatZARPrice(vehicle.pricePerDay)}</div>
            {vehicle.pricePerKm && (
              <div className="vd_price_note">+{formatZARPrice(vehicle.pricePerKm)}/km</div>
            )}
          </div>
          <div className={`vd_status ${statusInfo.class}`}>
            {statusInfo.icon} {statusInfo.text}
          </div>
        </div>

        {/* Title */}
        <h1 className="vd_title">{vehicle.model}</h1>
        {vehicle.type && <p className="vd_subtitle">{vehicle.type}</p>}

        {/* Location */}
        {vehicle.location && (
          <div className="vd_location">
            <FaMapMarkerAlt className="vd_location_icon" />
            <span>{vehicle.location}</span>
          </div>
        )}

        {/* Key Metrics */}
        <div className="vd_metrics">
          {vehicle.capacity && (
            <div className="vd_metric_card">
              <FaTachometerAlt className="vd_metric_icon" />
              <div>
                <div className="vd_metric_label">Capacity</div>
                <div className="vd_metric_value">{vehicle.capacity}</div>
              </div>
            </div>
          )}
          
          {vehicle.licensePlate && (
            <div className="vd_metric_card">
              <FaIdCard className="vd_metric_icon" />
              <div>
                <div className="vd_metric_label">License Plate</div>
                <div className="vd_metric_value">{vehicle.licensePlate}</div>
              </div>
            </div>
          )}
          
          {vehicle.fuelType && (
            <div className="vd_metric_card">
              <FaGasPump className="vd_metric_icon" />
              <div>
                <div className="vd_metric_label">Fuel Type</div>
                <div className="vd_metric_value">{vehicle.fuelType}</div>
              </div>
            </div>
          )}
        </div>

        {/* Features Tags */}
        {vehicle.features && vehicle.features.length > 0 && (
          <div className="vd_tags">
            {vehicle.features.map((feature, idx) => (
              <span key={idx} className="vd_tag">
                {getFeatureIcon(feature)} {feature}
              </span>
            ))}
          </div>
        )}

        {/* Tabs */}
        <div className="vd_tabs">
          <button 
            className={`vd_tab ${activeTab === 'details' ? 'vd_tab_active' : ''}`}
            onClick={() => setActiveTab('details')}
          >
            Details
          </button>
          <button 
            className={`vd_tab ${activeTab === 'owner' ? 'vd_tab_active' : ''}`}
            onClick={() => setActiveTab('owner')}
          >
            Owner
          </button>
          <button 
            className={`vd_tab ${activeTab === 'livestock' ? 'vd_tab_active' : ''}`}
            onClick={() => setActiveTab('livestock')}
          >
            Nearby Livestock
          </button>
        </div>

        {/* Tab Content */}
        <div className="vd_tab_content">
          {/* Details Tab */}
          {activeTab === 'details' && (
            <>
              {/* Description */}
              {vehicle.description && (
                <div className="vd_section">
                  <h3 className="vd_section_title">Description</h3>
                  <p className="vd_description">{vehicle.description}</p>
                </div>
              )}

              {/* Additional Info */}
              <div className="vd_section">
                <h3 className="vd_section_title">Additional Information</h3>
                <div className="vd_info_grid">
                  {vehicle._id && (
                    <div className="vd_info_item">
                      <FaTag className="vd_info_icon" />
                      <div>
                        <div className="vd_info_label">Listing ID</div>
                        <div className="vd_info_value">#{vehicle._id.slice(-8)}</div>
                      </div>
                    </div>
                  )}
                  {vehicle.createdAt && (
                    <div className="vd_info_item">
                      <FaCalendarAlt className="vd_info_icon" />
                      <div>
                        <div className="vd_info_label">Listed On</div>
                        <div className="vd_info_value">{formatDate(vehicle.createdAt)}</div>
                      </div>
                    </div>
                  )}
                  {vehicle.year && (
                    <div className="vd_info_item">
                      <FaCalendarAlt className="vd_info_icon" />
                      <div>
                        <div className="vd_info_label">Year</div>
                        <div className="vd_info_value">{vehicle.year}</div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {/* Owner Tab */}
          {activeTab === 'owner' && vehicle.owner && (
            <div className="vd_owner_section">
              {/* Verification Status */}
              {isOwnerVerified ? (
                <div className="vd_verified_banner">
                  <FaUserCheck />
                  <div>
                    <strong>Verified Owner</strong>
                    <p>This owner is verified. Book with confidence!</p>
                  </div>
                </div>
              ) : (
                <div className="vd_warning_banner">
                  <FaExclamationTriangle />
                  <div>
                    <strong>Unverified Owner</strong>
                    <p>This owner has not completed verification. Please exercise caution when booking.</p>
                  </div>
                </div>
              )}

              {/* Owner Card */}
              <div className="vd_owner_card">
                <div className="vd_owner_avatar">
                  {vehicle.owner.businessName?.charAt(0) || vehicle.owner.name?.charAt(0) || 'O'}
                </div>
                <div className="vd_owner_info">
                  <h4 className="vd_owner_name">{vehicle.owner.businessName || vehicle.owner.name}</h4>
                  {ownerRating && (
                    <div className="vd_owner_rating">
                      {renderStars(ownerRating)}
                      {vehicle.owner.reviewCount && (
                        <span className="vd_owner_rating_count">({vehicle.owner.reviewCount} reviews)</span>
                      )}
                    </div>
                  )}
                  {vehicle.owner.memberSince && (
                    <div className="vd_owner_meta">
                      <FaClock size={12} /> Member since {new Date(vehicle.owner.memberSince).getFullYear()}
                    </div>
                  )}
                </div>
              </div>

              {/* Contact Info */}
              {(vehicle.owner.phone || vehicle.owner.email) && (
                <div className="vd_contact_section">
                  <h3 className="vd_section_title">Contact Information</h3>
                  <div className="vd_contact_options">
                    {vehicle.owner.phone && (
                      <>
                        <button className="vd_contact_btn vd_contact_whatsapp" onClick={() => handleContactOwner('whatsapp')}>
                          <FaWhatsapp /> WhatsApp
                        </button>
                        <button className="vd_contact_btn vd_contact_call" onClick={() => handleContactOwner('call')}>
                          <FaPhoneAlt /> Call
                        </button>
                      </>
                    )}
                    {vehicle.owner.email && (
                      <button className="vd_contact_btn vd_contact_email" onClick={() => handleContactOwner('email')}>
                        <FaEnvelope /> Send Email
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Business Info */}
              {vehicle.owner.businessAddress && (
                <div className="vd_business_info">
                  <h3 className="vd_section_title">Business Information</h3>
                  <div className="vd_business_address">
                    <FaStore /> {vehicle.owner.businessAddress}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Nearby Livestock Tab */}
          {activeTab === 'livestock' && (
            <div className="vd_livestock_section">
              {vehicle.location && (
                <div className="vd_livestock_header">
                  <p className="vd_livestock_info">
                    <FaInfoCircle /> Livestock available near {vehicle.location}
                  </p>
                </div>
              )}
              
              {livestockLoading ? (
                <div className="vd_livestock_loading">
                  <div className="vd_small_spinner"></div>
                  <p>Finding nearby livestock...</p>
                </div>
              ) : livestock.length > 0 ? (
                <div className="vd_livestock_list">
                  {livestock.map((item) => (
                    <div key={item._id} className="vd_livestock_card" onClick={() => handleLivestockClick(item)}>
                      {item.images && item.images[0] ? (
                        <img src={item.images[0]} alt={item.breed} className="vd_livestock_image" />
                      ) : (
                        <div className="vd_livestock_placeholder">
                          {getLivestockIcon(item.type)}
                        </div>
                      )}
                      <div className="vd_livestock_info">
                        <div className="vd_livestock_name">
                          {item.type} - {item.breed}
                        </div>
                        <div className="vd_livestock_price">
                          {formatZARPrice(item.price)}
                        </div>
                        <div className="vd_livestock_location">
                          <FaMapMarkerAlt size={10} /> {item.location}
                        </div>
                        {item.weight && (
                          <div className="vd_livestock_weight">
                            ⚖️ {item.weight}kg
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="vd_empty_state">
                  <div className="vd_empty_icon">🐮</div>
                  <p>No livestock found nearby</p>
                  <p className="vd_empty_sub">Try checking back later for new listings</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        {vehicle.createdAt && (
          <div className="vd_footer">
            <span>Listed: {formatDate(vehicle.createdAt)}</span>
            {vehicle._id && <span>ID: #{vehicle._id.slice(-6)}</span>}
          </div>
        )}
      </div>

      {/* Mobile Action Buttons */}
      <div className="vd_mobile_actions">
        {vehicle.owner?.phone && (
          <button className="vd_action_btn vd_action_primary" onClick={() => setShowContactOptions(true)}>
            <FaWhatsapp /> Contact Owner
          </button>
        )}
        {vehicle.available && (
          <button className="vd_action_btn vd_action_secondary" onClick={() => setShowBookingModal(true)}>
            <FaCalendarAlt /> Book Now
          </button>
        )}
      </div>

      {/* Contact Options Modal */}
      {showContactOptions && (
        <div className="vd_modal" onClick={() => setShowContactOptions(false)}>
          <div className="vd_modal_content" onClick={(e) => e.stopPropagation()}>
            <h3 className="vd_modal_title">Contact {vehicle.owner?.businessName || vehicle.owner?.name}</h3>
            <div className="vd_modal_options">
              {vehicle.owner?.phone && (
                <>
                  <button className="vd_modal_option vd_modal_whatsapp" onClick={() => handleContactOwner('whatsapp')}>
                    <FaWhatsapp /> WhatsApp
                  </button>
                  <button className="vd_modal_option vd_modal_call" onClick={() => handleContactOwner('call')}>
                    <FaPhoneAlt /> Phone Call
                  </button>
                </>
              )}
              {vehicle.owner?.email && (
                <button className="vd_modal_option vd_modal_email" onClick={() => handleContactOwner('email')}>
                  <FaEnvelope /> Send Email
                </button>
              )}
              <button className="vd_modal_option vd_modal_cancel" onClick={() => setShowContactOptions(false)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Booking Modal */}
      {showBookingModal && (
        <div className="vd_modal" onClick={() => setShowBookingModal(false)}>
          <div className="vd_modal_content vd_booking_modal" onClick={(e) => e.stopPropagation()}>
            <div className="vd_modal_header">
              <h3 className="vd_modal_title">Book {vehicle.model}</h3>
              <button className="vd_modal_close" onClick={() => setShowBookingModal(false)}>
                <FaTimes />
              </button>
            </div>
            <form onSubmit={handleBooking} className="vd_booking_form">
              <input 
                type="text" 
                name="customerName" 
                placeholder="Your Full Name" 
                value={booking.customerName}
                required 
                onChange={handleBookingChange} 
                className="vd_form_input"
              />
              <input 
                type="email" 
                name="customerEmail" 
                placeholder="Your Email" 
                value={booking.customerEmail}
                required 
                onChange={handleBookingChange} 
                className="vd_form_input"
              />
              <input 
                type="tel" 
                name="customerPhone" 
                placeholder="Your Phone Number" 
                value={booking.customerPhone}
                required 
                onChange={handleBookingChange} 
                className="vd_form_input"
              />
              <div className="vd_date_range">
                <input 
                  type="date" 
                  name="startDate" 
                  placeholder="Start Date"
                  value={booking.startDate}
                  required 
                  onChange={handleBookingChange} 
                  min={new Date().toISOString().split('T')[0]}
                  className="vd_form_input"
                />
                <input 
                  type="date" 
                  name="endDate" 
                  placeholder="End Date"
                  value={booking.endDate}
                  required 
                  onChange={handleBookingChange} 
                  min={booking.startDate || new Date().toISOString().split('T')[0]}
                  className="vd_form_input"
                />
              </div>
              <button type="submit" disabled={bookingLoading} className="vd_submit_btn">
                {bookingLoading ? <><FaSpinner className="spinner" /> Submitting...</> : 'Submit Booking Request'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Side Panel for Desktop */}
      
    </div>
  );
};

export default VehicleDetail;