// LivestockDetail.jsx - Updated with environment variables and error handling
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  FaMapMarkerAlt, FaCalendar, FaWeightHanging, FaShieldAlt, 
  FaExclamationTriangle, FaCheckCircle, FaPhone, FaEnvelope, 
  FaShare, FaHeart, FaComments, FaArrowLeft, FaBuilding,
  FaTruck, FaCar, FaMotorcycle, FaShip, FaPlane, FaInfoCircle,
  FaWhatsapp, FaRegHeart, FaHeart as FaHeartSolid, FaShareAlt,
  FaUserCheck, FaUserShield, FaStar, FaStarHalfAlt, FaRegStar,
  FaChevronLeft, FaChevronRight, FaExpand, FaTimes, FaCheck,
  FaClock, FaTag, FaStore, FaIdCard, FaSpinner
} from 'react-icons/fa';
import SidePanel from '.././SidePanel';
import './LivestockDetail.css';

// API Base URL from environment variable
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const LivestockDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  // State management
  const [livestock, setLivestock] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [isSaved, setIsSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [vehicles, setVehicles] = useState([]);
  const [vehiclesLoading, setVehiclesLoading] = useState(false);
  const [searchMessage, setSearchMessage] = useState(null);
  const [error, setError] = useState(null);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('details');
  const [showContactOptions, setShowContactOptions] = useState(false);
  const [imageErrors, setImageErrors] = useState({});
  const [imageLoading, setImageLoading] = useState({});
  
  const galleryRef = useRef(null);
  const detailRef = useRef(null);

  useEffect(() => {
    fetchLivestock();
    window.scrollTo(0, 0);
  }, [id]);

  useEffect(() => {
    if (livestock && livestock.location) {
      fetchNearbyVehicles();
    }
  }, [livestock]);

  const fetchLivestock = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/livestock/${id}`);
      setLivestock(response.data);
      setError(null);
    } catch (error) {
      console.error('Error fetching livestock:', error);
      if (error.response?.status === 404) {
        setError('Livestock listing not found');
      } else {
        setError('Failed to load livestock details. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchNearbyVehicles = async () => {
    if (!livestock?.location) return;
    
    setVehiclesLoading(true);
    setSearchMessage(null);
    try {
      const response = await axios.get(`${API_BASE_URL}/livestock/nearby/vehicles`, {
        params: {
          location: livestock.location,
          limit: 5
        }
      });
      
      setVehicles(response.data.vehicles || []);
      setSearchMessage(response.data.message);
    } catch (error) {
      console.error('Error fetching vehicles:', error);
      setVehicles([]);
      setSearchMessage('Unable to load vehicle suggestions at this time.');
    } finally {
      setVehiclesLoading(false);
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

  const getVehicleIcon = (type) => {
    if (!type) return <FaTruck />;
    if (type?.toLowerCase().includes('truck')) return <FaTruck />;
    if (type?.toLowerCase().includes('car')) return <FaCar />;
    if (type?.toLowerCase().includes('motor')) return <FaMotorcycle />;
    if (type?.toLowerCase().includes('ship')) return <FaShip />;
    if (type?.toLowerCase().includes('plane')) return <FaPlane />;
    return <FaTruck />;
  };

  const getHealthIcon = (status) => {
    switch(status?.toLowerCase()) {
      case 'excellent': return <FaCheckCircle />;
      case 'good': return <FaCheckCircle />;
      case 'fair': return <FaInfoCircle />;
      default: return <FaExclamationTriangle />;
    }
  };

  const getHealthColor = (status) => {
    switch(status?.toLowerCase()) {
      case 'excellent': return '#4CAF50';
      case 'good': return '#8BC34A';
      case 'fair': return '#FFC107';
      default: return '#F44336';
    }
  };

  const handleVehicleClick = (vehicle) => {
    navigate(`/vehicles/${vehicle._id}`);
  };

  const handleShare = async () => {
    if (!livestock) return;
    
    const shareData = {
      title: livestock.breed || 'Livestock for sale',
      text: `Check out this ${livestock.breed || 'livestock'} for ${formatZARPrice(livestock.price)} on Imfuyo!`,
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
        `${API_BASE_URL}/livestock/${livestock._id}/${endpoint}`,
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
      console.error('Error saving livestock:', error);
      if (error.response?.status === 401) {
        navigate('/login');
      } else {
        alert('Failed to save listing. Please try again.');
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleContact = (method) => {
    if (!livestock?.seller) return;
    
    if (method === 'whatsapp' && livestock.seller.phone) {
      const message = `Hi, I'm interested in your ${livestock.breed || 'livestock'} listed on Imfuyo for ${formatZARPrice(livestock.price)}`;
      const phone = livestock.seller.phone.replace(/\D/g, '');
      window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank');
    } else if (method === 'call' && livestock.seller.phone) {
      window.location.href = `tel:${livestock.seller.phone}`;
    } else if (method === 'email' && livestock.seller.email) {
      window.location.href = `mailto:${livestock.seller.email}`;
    }
    setShowContactOptions(false);
  };

  const nextImage = () => {
    if (livestock?.images?.length) {
      setSelectedImage((prev) => (prev + 1) % livestock.images.length);
    }
  };

  const prevImage = () => {
    if (livestock?.images?.length) {
      setSelectedImage((prev) => (prev - 1 + livestock.images.length) % livestock.images.length);
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

  if (loading) {
    return (
      <div className="ld_loading_container">
        <div className="ld_loading_spinner"></div>
        <p className="ld_loading_text">Loading livestock details...</p>
      </div>
    );
  }

  if (error || !livestock) {
    return (
      <div className="ld_error_container">
        <div className="ld_error_icon">🐮</div>
        <h2 className="ld_error_title">Livestock Not Found</h2>
        <p className="ld_error_message">{error || "The livestock listing you're looking for doesn't exist or has been removed."}</p>
        <button onClick={() => navigate('/livestock')} className="ld_error_button">
          Browse Listings
        </button>
      </div>
    );
  }

  const isSellerVerified = livestock.seller?.isVerified || false;
  const sellerRating = livestock.seller?.rating;
  const hasMultipleImages = livestock.images && livestock.images.length > 1;
  const displayImages = livestock.images?.filter((_, idx) => !imageErrors[idx]) || [];

  return (
    <div className="ld_page">
      {/* Header */}
      <header className="ld_header">
        <button className="ld_back_button" onClick={() => navigate(-1)} aria-label="Go back">
          <FaArrowLeft />
        </button>
        <div className="ld_header_actions">
          <button 
            className="ld_header_action" 
            onClick={handleSave} 
            aria-label="Save listing"
            disabled={isSaving}
          >
            {isSaving ? <FaSpinner className="spinner" /> : (isSaved ? <FaHeartSolid className="ld_saved" /> : <FaRegHeart />)}
          </button>
          <button className="ld_header_action" onClick={handleShare} aria-label="Share listing">
            <FaShareAlt />
          </button>
        </div>
      </header>

      {/* Image Gallery */}
      <div className="ld_gallery" ref={galleryRef}>
        <div className="ld_gallery_main" onClick={() => setIsLightboxOpen(true)}>
          {displayImages.length > 0 ? (
            <>
              {imageLoading[selectedImage] !== false && (
                <div className="ld_image_loader">
                  <FaSpinner className="spinner" />
                </div>
              )}
              <img 
                src={displayImages[selectedImage]} 
                alt={livestock.breed || 'Livestock'}
                className="ld_gallery_image"
                onError={() => handleImageError(selectedImage)}
                onLoad={() => handleImageLoad(selectedImage)}
                style={{ display: imageLoading[selectedImage] === false ? 'block' : 'none' }}
              />
            </>
          ) : (
            <div className="ld_gallery_placeholder">
              <div className="ld_placeholder_icon">🐄</div>
              <p>No image available</p>
            </div>
          )}
          
          {hasMultipleImages && displayImages.length > 1 && (
            <>
              <button className="ld_gallery_nav ld_gallery_prev" onClick={(e) => { e.stopPropagation(); prevImage(); }}>
                <FaChevronLeft />
              </button>
              <button className="ld_gallery_nav ld_gallery_next" onClick={(e) => { e.stopPropagation(); nextImage(); }}>
                <FaChevronRight />
              </button>
              <div className="ld_gallery_counter">
                {selectedImage + 1} / {displayImages.length}
              </div>
              <button className="ld_gallery_expand">
                <FaExpand />
              </button>
            </>
          )}
        </div>
        
        {hasMultipleImages && displayImages.length > 1 && (
          <div className="ld_gallery_thumbnails">
            {displayImages.map((img, idx) => (
              <div 
                key={idx} 
                className={`ld_thumbnail ${selectedImage === idx ? 'ld_thumbnail_active' : ''}`}
                onClick={() => setSelectedImage(idx)}
              >
                <img src={img} alt={`${livestock.breed || 'Livestock'} ${idx + 1}`} />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Lightbox Modal */}
      {isLightboxOpen && displayImages.length > 0 && (
        <div className="ld_lightbox" onClick={() => setIsLightboxOpen(false)}>
          <button className="ld_lightbox_close" onClick={() => setIsLightboxOpen(false)}>
            <FaTimes />
          </button>
          <img src={displayImages[selectedImage]} alt={livestock.breed || 'Livestock'} className="ld_lightbox_image" />
          {displayImages.length > 1 && (
            <>
              <button className="ld_lightbox_nav ld_lightbox_prev" onClick={(e) => { e.stopPropagation(); prevImage(); }}>
                <FaChevronLeft />
              </button>
              <button className="ld_lightbox_nav ld_lightbox_next" onClick={(e) => { e.stopPropagation(); nextImage(); }}>
                <FaChevronRight />
              </button>
            </>
          )}
        </div>
      )}

      {/* Main Content */}
      <div className="ld_content" ref={detailRef}>
        {/* Price & Status */}
        <div className="ld_price_section">
          <div>
            <span className="ld_price_label">Price</span>
            <div className="ld_price">{formatZARPrice(livestock.price)}</div>
          </div>
          <div className={`ld_status ld_status_${livestock.status || 'available'}`}>
            {livestock.status === 'available' && <FaCheck />}
            {(livestock.status || 'AVAILABLE').toUpperCase()}
          </div>
        </div>

        {/* Title & Location */}
        <h1 className="ld_title">{livestock.breed || 'Livestock'}</h1>
        {livestock.type && <p className="ld_subtitle">{livestock.type}</p>}
        
        {livestock.location && (
          <div className="ld_location">
            <FaMapMarkerAlt className="ld_location_icon" />
            <span>{livestock.location}</span>
          </div>
        )}

        {/* Key Metrics Cards */}
        <div className="ld_metrics">
          {(livestock.weight !== undefined && livestock.weight !== null) && (
            <div className="ld_metric_card">
              <FaWeightHanging className="ld_metric_icon" />
              <div>
                <div className="ld_metric_label">Weight</div>
                <div className="ld_metric_value">{livestock.weight} kg</div>
              </div>
            </div>
          )}
          
          {(livestock.age !== undefined && livestock.age !== null) && (
            <div className="ld_metric_card">
              <FaCalendar className="ld_metric_icon" />
              <div>
                <div className="ld_metric_label">Age</div>
                <div className="ld_metric_value">{livestock.age} {livestock.ageUnit || 'years'}</div>
              </div>
            </div>
          )}
          
          {livestock.healthStatus && (
            <div className="ld_metric_card">
              <div className="ld_metric_icon" style={{ color: getHealthColor(livestock.healthStatus) }}>
                {getHealthIcon(livestock.healthStatus)}
              </div>
              <div>
                <div className="ld_metric_label">Health</div>
                <div className="ld_metric_value" style={{ color: getHealthColor(livestock.healthStatus) }}>
                  {livestock.healthStatus.charAt(0).toUpperCase() + livestock.healthStatus.slice(1)}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Tags */}
        <div className="ld_tags">
          {livestock.vaccinated && (
            <span className="ld_tag ld_tag_success">
              <FaCheck /> Vaccinated
            </span>
          )}
          {livestock.quantity && livestock.quantity > 1 && (
            <span className="ld_tag ld_tag_info">
              📦 {livestock.quantity} animals available
            </span>
          )}
          {livestock.registered && (
            <span className="ld_tag ld_tag_primary">
              <FaIdCard /> Registered
            </span>
          )}
        </div>

        {/* Tabs */}
        <div className="ld_tabs">
          <button 
            className={`ld_tab ${activeTab === 'details' ? 'ld_tab_active' : ''}`}
            onClick={() => setActiveTab('details')}
          >
            Details
          </button>
          <button 
            className={`ld_tab ${activeTab === 'seller' ? 'ld_tab_active' : ''}`}
            onClick={() => setActiveTab('seller')}
          >
            Seller
          </button>
          <button 
            className={`ld_tab ${activeTab === 'transport' ? 'ld_tab_active' : ''}`}
            onClick={() => setActiveTab('transport')}
          >
            Transport
          </button>
        </div>

        {/* Tab Content */}
        <div className="ld_tab_content">
          {/* Details Tab */}
          {activeTab === 'details' && (
            <>
              {/* Description */}
              {livestock.description && (
                <div className="ld_section">
                  <h3 className="ld_section_title">Description</h3>
                  <p className="ld_description">{livestock.description}</p>
                </div>
              )}

              {/* Additional Info */}
              <div className="ld_section">
                <h3 className="ld_section_title">Additional Information</h3>
                <div className="ld_info_grid">
                  {livestock._id && (
                    <div className="ld_info_item">
                      <FaTag className="ld_info_icon" />
                      <div>
                        <div className="ld_info_label">Listing ID</div>
                        <div className="ld_info_value">#{livestock._id.slice(-8)}</div>
                      </div>
                    </div>
                  )}
                  {livestock.createdAt && (
                    <div className="ld_info_item">
                      <FaClock className="ld_info_icon" />
                      <div>
                        <div className="ld_info_label">Listed On</div>
                        <div className="ld_info_value">{formatDate(livestock.createdAt)}</div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {/* Seller Tab */}
          {activeTab === 'seller' && livestock.seller && (
            <div className="ld_seller_section">
              {/* Verification Status */}
              {isSellerVerified ? (
                <div className="ld_verified_banner">
                  <FaUserCheck />
                  <div>
                    <strong>Verified Seller</strong>
                    <p>This seller has been verified by Imfuyo</p>
                  </div>
                </div>
              ) : (
                <div className="ld_warning_banner">
                  <FaUserShield />
                  <div>
                    <strong>Unverified Seller</strong>
                    <p>Please exercise caution when dealing with unverified sellers</p>
                  </div>
                </div>
              )}

              {/* Seller Card */}
              <div className="ld_seller_card">
                <div className="ld_seller_avatar">
                  {livestock.seller.businessName?.charAt(0) || livestock.seller.name?.charAt(0) || 'S'}
                </div>
                <div className="ld_seller_info">
                  <h4 className="ld_seller_name">{livestock.seller.businessName || livestock.seller.name}</h4>
                  {sellerRating && (
                    <div className="ld_seller_rating">
                      {renderStars(sellerRating)}
                      {livestock.seller.reviewCount && (
                        <span className="ld_seller_rating_count">({livestock.seller.reviewCount} reviews)</span>
                      )}
                    </div>
                  )}
                  {livestock.seller.memberSince && (
                    <div className="ld_seller_meta">
                      <FaClock size={12} /> Member since {new Date(livestock.seller.memberSince).getFullYear()}
                    </div>
                  )}
                </div>
              </div>

              {/* Contact Info */}
              {(livestock.seller.phone || livestock.seller.email) && (
                <div className="ld_contact_section">
                  <h3 className="ld_section_title">Contact Information</h3>
                  <div className="ld_contact_options">
                    {livestock.seller.phone && (
                      <>
                        <button className="ld_contact_btn ld_contact_whatsapp" onClick={() => handleContact('whatsapp')}>
                          <FaWhatsapp /> WhatsApp
                        </button>
                        <button className="ld_contact_btn ld_contact_call" onClick={() => handleContact('call')}>
                          <FaPhone /> Call
                        </button>
                      </>
                    )}
                    {livestock.seller.email && (
                      <button className="ld_contact_btn ld_contact_email" onClick={() => handleContact('email')}>
                        <FaEnvelope /> Send Email
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Business Info */}
              {livestock.seller.businessAddress && (
                <div className="ld_business_info">
                  <h3 className="ld_section_title">Business Information</h3>
                  <div className="ld_business_address">
                    <FaStore /> {livestock.seller.businessAddress}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Transport Tab */}
          {activeTab === 'transport' && (
            <div className="ld_transport_section">
              {livestock.location && (
                <div className="ld_transport_header">
                  <p className="ld_transport_info">
                    <FaInfoCircle /> Vehicles available near {livestock.location}
                  </p>
                </div>
              )}
              
              {vehiclesLoading ? (
                <div className="ld_transport_loading">
                  <div className="ld_small_spinner"></div>
                  <p>Finding transport options...</p>
                </div>
              ) : vehicles.length > 0 ? (
                <div className="ld_vehicle_list">
                  {vehicles.map((vehicle) => (
                    <div key={vehicle._id} className="ld_vehicle_card" onClick={() => handleVehicleClick(vehicle)}>
                      <div className="ld_vehicle_icon">
                        {getVehicleIcon(vehicle.type)}
                      </div>
                      <div className="ld_vehicle_info">
                        <div className="ld_vehicle_name">{vehicle.model || vehicle.name}</div>
                        <div className="ld_vehicle_details">
                          {vehicle.type && <span>{vehicle.type}</span>}
                          {vehicle.type && vehicle.capacity && <span>•</span>}
                          {vehicle.capacity && <span>Capacity: {vehicle.capacity}</span>}
                        </div>
                        <div className="ld_vehicle_pricing">
                          {vehicle.pricePerDay && (
                            <span className="ld_vehicle_price">{formatZARPrice(vehicle.pricePerDay)}/day</span>
                          )}
                          {vehicle.pricePerKm && (
                            <span> + {formatZARPrice(vehicle.pricePerKm)}/km</span>
                          )}
                        </div>
                        {vehicle.location && (
                          <div className="ld_vehicle_location">
                            <FaMapMarkerAlt size={10} /> {vehicle.location}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="ld_empty_state">
                  <div className="ld_empty_icon">🚚</div>
                  <p>No transport options found nearby</p>
                  <p className="ld_empty_sub">Try checking back later or expand your search area</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Listing Footer */}
        {livestock.createdAt && (
          <div className="ld_footer">
            <span>Listed: {formatDate(livestock.createdAt)}</span>
            {livestock._id && <span>ID: #{livestock._id.slice(-6)}</span>}
          </div>
        )}
      </div>

      {/* Mobile Action Buttons */}
      <div className="ld_mobile_actions">
        {livestock.seller?.phone && (
          <button className="ld_action_btn ld_action_primary" onClick={() => setShowContactOptions(true)}>
            <FaWhatsapp /> Contact Seller
          </button>
        )}
        {livestock.status === 'available' && (
          <button className="ld_action_btn ld_action_secondary">
            <FaComments /> Make Offer
          </button>
        )}
      </div>

      {/* Contact Options Modal */}
      {showContactOptions && (
        <div className="ld_modal" onClick={() => setShowContactOptions(false)}>
          <div className="ld_modal_content" onClick={(e) => e.stopPropagation()}>
            <h3 className="ld_modal_title">Contact {livestock.seller?.businessName || livestock.seller?.name}</h3>
            <div className="ld_modal_options">
              {livestock.seller?.phone && (
                <>
                  <button className="ld_modal_option ld_modal_whatsapp" onClick={() => handleContact('whatsapp')}>
                    <FaWhatsapp /> WhatsApp
                  </button>
                  <button className="ld_modal_option ld_modal_call" onClick={() => handleContact('call')}>
                    <FaPhone /> Phone Call
                  </button>
                </>
              )}
              {livestock.seller?.email && (
                <button className="ld_modal_option ld_modal_email" onClick={() => handleContact('email')}>
                  <FaEnvelope /> Send Email
                </button>
              )}
              <button className="ld_modal_option ld_modal_cancel" onClick={() => setShowContactOptions(false)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      
    </div>
  );
};

export default LivestockDetail;