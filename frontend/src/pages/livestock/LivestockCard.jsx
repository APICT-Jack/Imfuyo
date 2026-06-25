// LivestockCard.jsx - Using the same pattern as VehicleCard
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { 
  FaExclamationTriangle, 
  FaCheckCircle, 
  FaMapMarkerAlt,
  FaGavel,
  FaShoppingCart,
  FaClock,
  FaVideo,
  FaHeart,
  FaRegHeart,
  FaComment,
  FaShare,
  FaEye,
  FaShieldAlt,
  FaUserCircle,
  FaSpinner
} from 'react-icons/fa';
import { GiCow, GiChicken, GiGoat, GiPig, GiSheep } from 'react-icons/gi';
import './LivestockCard.css';

// API Base URL from environment variable
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const LivestockCard = ({ livestock }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [isLiking, setIsLiking] = useState(false);
  
  const isSellerVerified = livestock.seller?.isVerified;
  const showWarning = !isSellerVerified;
  const isBidListing = livestock.orderType === 'bid';
  const isOnBid = livestock.status === 'on_bid';
  const isSold = livestock.status === 'sold';
  
  const getCurrentPrice = () => {
    if (isBidListing && livestock.bidDetails) {
      return livestock.bidDetails.currentBid || livestock.bidDetails.startingBid;
    }
    return livestock.price;
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

  const getTypeIcon = (type) => {
    switch(type?.toLowerCase()) {
      case 'cattle': return <GiCow />;
      case 'sheep': return <GiSheep />;
      case 'goat': return <GiGoat />;
      case 'pig': return <GiPig />;
      case 'chicken': return <GiChicken />;
      default: return <GiCow />;
    }
  };

  const getRemainingTime = () => {
    if (!isBidListing || !livestock.bidDetails?.bidEndTime) return null;
    const endTime = new Date(livestock.bidDetails.bidEndTime);
    const now = new Date();
    const diff = endTime - now;
    if (diff <= 0) return 'Ended';
    const hours = Math.floor(diff / (1000 * 60 * 60));
    if (hours > 24) return `${Math.floor(hours / 24)}d left`;
    if (hours > 0) return `${hours}h left`;
    return '<1h left';
  };

  const badgeConfig = () => {
    if (isSold) return { text: 'SOLD', bg: '#dc3545' };
    if (isOnBid) return { text: 'ON BID', bg: '#ff9800' };
    if (isBidListing) return { text: 'AUCTION', bg: '#ff9800' };
    return { text: 'AVAILABLE', bg: '#28a745' };
  };

  const badge = badgeConfig();
  const remainingTime = getRemainingTime();
  const currentPrice = getCurrentPrice();
  const hasVideos = livestock.videos && livestock.videos.length > 0;

  // Handle like/unlike with API call
  const handleLike = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (isLiking) return;
    
    setIsLiking(true);
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        window.location.href = '/login';
        return;
      }

      const endpoint = isLiked ? 'unlike' : 'like';
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
        setIsLiked(!isLiked);
      }
    } catch (error) {
      console.error('Error toggling like:', error);
      if (error.response?.status === 401) {
        window.location.href = '/login';
      }
    } finally {
      setIsLiking(false);
    }
  };

  // Handle quick view
  const handleQuickView = (e) => {
    e.preventDefault();
    e.stopPropagation();
    window.location.href = `/livestock/${livestock._id}`;
  };

  // Handle contact seller
  const handleContact = (e) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('Contact seller:', livestock.seller?._id);
  };

  // Handle share
  const handleShare = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    const shareUrl = `${window.location.origin}/livestock/${livestock._id}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: livestock.breed || livestock.type || 'Livestock for sale',
          text: `Check out this ${livestock.breed || livestock.type} on Imfuyo!`,
          url: shareUrl,
        });
      } catch (error) {
        if (error.name !== 'AbortError') {
          console.error('Share error:', error);
        }
      }
    } else {
      try {
        await navigator.clipboard.writeText(shareUrl);
        alert('Link copied to clipboard!');
      } catch (err) {
        console.error('Copy error:', err);
      }
    }
  };

  // Handle tap for mobile expansion
  const handleCardClick = (e) => {
    if (window.innerWidth <= 768) {
      e.preventDefault();
      setIsExpanded(!isExpanded);
    }
  };

  return (
    <div 
      className={`livestock-card-compact ${isExpanded ? 'expanded' : ''} ${showWarning ? 'unverified-seller-card' : ''}`}
      onClick={handleCardClick}
    >
      <Link to={`/livestock/${livestock._id}`} className="card-link-compact">
        {/* IMAGE SECTION - EXACTLY LIKE VEHICLECARD */}
        <div className="card-image-compact">
          {livestock.images && livestock.images[0] ? (
            <img 
              src={livestock.images[0]} 
              alt={livestock.breed || livestock.type || 'Livestock'}
              loading="lazy"
            />
          ) : (
            <div className="no-image-compact">
              {getTypeIcon(livestock.type)}
            </div>
          )}
          
          {/* Image Badges - FULL LABELS */}
          <div className="image-badges">
            {showWarning && (
              <span className="badge-warning" title="Unverified Seller - Exercise caution">
                <FaExclamationTriangle /> Unverified Seller
              </span>
            )}
            {isSellerVerified && (
              <span className="badge-verified" title="Verified Seller - Trusted member">
                <FaCheckCircle /> Verified Seller
              </span>
            )}
            {hasVideos && (
              <span className="badge-video" title="Video preview available">
                <FaVideo /> Video
              </span>
            )}
          </div>
          
          {/* Status Badge */}
          <div className="status-badge-compact" style={{ background: badge.bg }}>
            {badge.text}
          </div>
          
          {/* Order Type Badge with Label */}
          <div className="order-badge-compact">
            {isBidListing ? <FaGavel /> : <FaShoppingCart />}
            <span>{isBidListing ? 'Auction' : 'Fixed'}</span>
          </div>

          {/* HOVER OVERLAY - Reveals additional info including warning paragraph */}
          <div className="hover-overlay">
            <div className="hover-content">
              {/* WARNING PARAGRAPH - Only shown for unverified sellers */}
              {showWarning && (
                <div className="warning-paragraph">
                  <FaExclamationTriangle />
                  <div>
                    <strong>⚠️ Unverified Seller Notice</strong>
                    <p>This seller has not completed verification. We recommend exercising caution, reviewing listings carefully, and using secure payment methods.</p>
                  </div>
                </div>
              )}
              
              {/* Description */}
              <p className="hover-description">
                {livestock.description?.substring(0, 100) || `${livestock.breed || livestock.type} - ${livestock.age || 'Adult'} ${livestock.ageUnit || 'months'} old, ready for sale.`}
              </p>
              
              {/* Details Grid */}
              <div className="hover-details">
                <div className="hover-detail-item">
                  <FaMapMarkerAlt /> {livestock.location || 'Location TBD'}
                </div>
                <div className="hover-detail-item">
                  🏥 Health: {livestock.healthStatus || 'Good'}
                </div>
                {livestock.age && (
                  <div className="hover-detail-item">
                    📅 Age: {livestock.age} {livestock.ageUnit || 'months'}
                  </div>
                )}
                {livestock.weight && (
                  <div className="hover-detail-item">
                    ⚖️ Weight: {livestock.weight}kg
                  </div>
                )}
                {livestock.vaccinated && (
                  <div className="hover-detail-item">
                    💉 Vaccinated
                  </div>
                )}
                {livestock.breed && (
                  <div className="hover-detail-item">
                    🐄 Breed: {livestock.breed}
                  </div>
                )}
              </div>
              
              {/* Seller Info */}
              <div className="hover-seller">
                <FaUserCircle /> Seller: {livestock.seller?.businessName || livestock.seller?.name || 'Anonymous Seller'}
              </div>
              
              {/* Action Buttons */}
              <div className="hover-actions">
                <button className="hover-action-btn" onClick={handleQuickView}>
                  <FaEye /> Quick View
                </button>
                <button className="hover-action-btn" onClick={handleContact}>
                  <FaComment /> Contact
                </button>
                <button 
                  className={`hover-action-btn like-btn ${isLiked ? 'liked' : ''}`} 
                  onClick={handleLike}
                  disabled={isLiking}
                >
                  {isLiking ? <FaSpinner className="spinner" /> : (isLiked ? <FaHeart /> : <FaRegHeart />)} 
                  Save
                </button>
                <button className="hover-action-btn" onClick={handleShare}>
                  <FaShare /> Share
                </button>
              </div>
            </div>
          </div>
        </div>
        
        {/* COMPACT INFO - Always visible */}
        <div className="card-info-compact">
          {/* Title & Type Row */}
          <div className="info-row">
            <h4 className="card-title-compact">
              {livestock.breed || livestock.type || 'Livestock'}
            </h4>
            <span className="type-badge-compact">
              {getTypeIcon(livestock.type)} {livestock.type || 'Stock'}
            </span>
          </div>
          
          {/* Price Row */}
          <div className="price-row">
            <span className="price-compact">{formatZARPrice(currentPrice)}</span>
            {isBidListing && isOnBid && remainingTime && (
              <span className="time-compact">
                <FaClock /> {remainingTime}
              </span>
            )}
            {isBidListing && !isOnBid && livestock.bidDetails?.bidHistory && (
              <span className="bid-count-compact">
                <FaGavel /> {livestock.bidDetails.bidHistory.length} bids
              </span>
            )}
          </div>
          
          {/* Location Row (compact) */}
          <div className="location-compact">
            <FaMapMarkerAlt /> {livestock.location?.split(',')[0] || 'Location TBD'}
          </div>
        </div>
      </Link>
      
      {/* MOBILE EXPANDABLE SECTION - Only visible when tapped on mobile */}
      <div className="mobile-expandable">
        <div className="mobile-details">
          {/* Mobile warning for unverified sellers */}
          {showWarning && (
            <div className="mobile-warning">
              <FaExclamationTriangle />
              <span>Unverified Seller - Exercise caution</span>
            </div>
          )}
          
          <div className="mobile-detail-grid">
            <div className="mobile-detail">
              <span className="detail-label">Age:</span>
              <span className="detail-value">{livestock.age || 'N/A'} {livestock.ageUnit || 'months'}</span>
            </div>
            {livestock.weight && (
              <div className="mobile-detail">
                <span className="detail-label">Weight:</span>
                <span className="detail-value">{livestock.weight} kg</span>
              </div>
            )}
            <div className="mobile-detail">
              <span className="detail-label">Health:</span>
              <span className="detail-value">{livestock.healthStatus || 'Good'}</span>
            </div>
            <div className="mobile-detail">
              <span className="detail-label">Breed:</span>
              <span className="detail-value">{livestock.breed || 'Mixed'}</span>
            </div>
            <div className="mobile-detail">
              <span className="detail-label">Seller:</span>
              <span className="detail-value">{livestock.seller?.businessName || livestock.seller?.name?.split(' ')[0] || 'Anonymous'}</span>
            </div>
            <div className="mobile-detail">
              <span className="detail-label">Verified:</span>
              <span className="detail-value">{isSellerVerified ? '✅ Yes' : '❌ No'}</span>
            </div>
          </div>
          {livestock.description && (
            <p className="mobile-description">{livestock.description.substring(0, 120)}...</p>
          )}
          <div className="mobile-actions">
            <button className="mobile-action-btn" onClick={handleQuickView}>
              <FaEye /> Quick View
            </button>
            <button className="mobile-action-btn" onClick={handleContact}>
              <FaComment /> Contact
            </button>
            <button 
              className={`mobile-action-btn ${isLiked ? 'liked' : ''}`} 
              onClick={handleLike}
              disabled={isLiking}
            >
              {isLiking ? <FaSpinner className="spinner" /> : (isLiked ? <FaHeart /> : <FaRegHeart />)} 
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LivestockCard;