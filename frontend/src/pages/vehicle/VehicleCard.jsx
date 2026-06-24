import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  FaExclamationTriangle, 
  FaCheckCircle, 
  FaMapMarkerAlt,
  FaHeart,
  FaRegHeart,
  FaComment,
  FaShare,
  FaEye,
  FaTachometerAlt,
  FaUserCircle,
  FaWeightHanging,
  FaTruck,
  FaPhoneAlt,
  FaEnvelope
} from 'react-icons/fa';
import { GiTruck, GiTowTruck } from 'react-icons/gi';
import './VehicleCard.css';

const VehicleCard = ({ vehicle }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  
  const isOwnerVerified = vehicle.owner?.isVerified || vehicle.ownerVerified;
  const showWarning = !isOwnerVerified;
  const isAvailable = vehicle.available !== false;
  const isOnDuty = !isAvailable;
  
  // Format price in ZAR
  const formatZARPrice = (price) => {
    if (!price) return 'POA';
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(price);
  };

  // Get vehicle icon - using ONLY safe, verified icons
  const getVehicleIcon = (type, capacity) => {
    const typeLower = type?.toLowerCase() || '';
    if (typeLower.includes('tow') || typeLower.includes('towing')) return <GiTowTruck size={24} />;
    if (capacity > 5000) return <GiTruck size={24} />;
    return <FaTruck size={24} />;
  };

  // Get badge config
  const getBadgeConfig = () => {
    if (isOnDuty) return { text: 'ON DUTY', bg: '#ff9800' };
    if (isAvailable) return { text: 'AVAILABLE', bg: '#28a745' };
    return { text: 'BOOKED', bg: '#dc3545' };
  };

  const badge = getBadgeConfig();

  // Handle tap for mobile expansion
  const handleCardClick = (e) => {
    if (window.innerWidth <= 768) {
      e.preventDefault();
      setIsExpanded(!isExpanded);
    }
  };

  const handleLike = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsLiked(!isLiked);
  };

  const handleQuickView = (e) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('Quick view vehicle:', vehicle._id);
  };

  const handleContact = (e) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('Contact vehicle owner:', vehicle.owner?._id);
  };

  const handleShare = (e) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('Share vehicle:', vehicle._id);
  };

  // Get capacity display text
  const getCapacityDisplay = () => {
    if (!vehicle.capacity) return null;
    if (vehicle.capacityUnit === 'tons') {
      return `${vehicle.capacity}t`;
    }
    return `${vehicle.capacity}kg`;
  };

  return (
    <div 
      className={`vehicle-card-compact ${isExpanded ? 'expanded' : ''} ${showWarning ? 'unverified-owner-card' : ''}`}
      onClick={handleCardClick}
    >
      <Link to={`/vehicles/${vehicle._id}`} className="card-link-compact">
        {/* IMAGE SECTION */}
        <div className="card-image-compact">
          {vehicle.images && vehicle.images[0] ? (
            <img 
              src={vehicle.images[0]} 
              alt={vehicle.model}
              loading="lazy"
            />
          ) : (
            <div className="no-image-compact">
              {getVehicleIcon(vehicle.type, vehicle.capacity)}
            </div>
          )}
          
          {/* Image Badges - FULL LABELS */}
          <div className="image-badges">
            {showWarning && (
              <span className="badge-warning" title="Unverified Owner - Exercise caution">
                <FaExclamationTriangle /> Unverified Owner
              </span>
            )}
            {isOwnerVerified && (
              <span className="badge-verified" title="Verified Owner - Trusted member">
                <FaCheckCircle /> Verified Owner
              </span>
            )}
          </div>
          
          {/* Status Badge */}
          <div className="status-badge-compact" style={{ background: badge.bg }}>
            {badge.text}
          </div>

          {/* HOVER OVERLAY - Reveals additional info including warning paragraph */}
          <div className="hover-overlay">
            <div className="hover-content">
              {/* WARNING PARAGRAPH - Only shown for unverified owners */}
              {showWarning && (
                <div className="warning-paragraph">
                  <FaExclamationTriangle />
                  <div>
                    <strong>⚠️ Unverified Owner Notice</strong>
                    <p>This owner has not completed verification. We recommend exercising caution, reviewing vehicle details carefully, and inspecting the vehicle before booking.</p>
                  </div>
                </div>
              )}
              
              {/* Description */}
              <p className="hover-description">
                {vehicle.description?.substring(0, 100) || `${vehicle.model} - ${vehicle.type || 'Transport vehicle'} available for livestock transport.`}
              </p>
              
              {/* Details Grid */}
              <div className="hover-details">
                <div className="hover-detail-item">
                  <FaMapMarkerAlt /> {vehicle.location?.split(',')[0] || 'Location TBD'}
                </div>
                <div className="hover-detail-item">
                  <FaTachometerAlt /> {getCapacityDisplay() || `${vehicle.capacity || 'N/A'}`}
                </div>
                {vehicle.pricePerKm && (
                  <div className="hover-detail-item">
                    💰 +{formatZARPrice(vehicle.pricePerKm)}/km
                  </div>
                )}
                {vehicle.licensePlate && (
                  <div className="hover-detail-item">
                    🚗 {vehicle.licensePlate}
                  </div>
                )}
                {vehicle.features && vehicle.features.slice(0, 2).map((feature, idx) => (
                  <div key={idx} className="hover-detail-item">
                    ✓ {feature}
                  </div>
                ))}
              </div>
              
              {/* Owner Info */}
              <div className="hover-owner">
                <FaUserCircle /> {vehicle.owner?.businessName || vehicle.owner?.name || 'Anonymous Owner'}
              </div>
              
              {/* Action Buttons */}
              <div className="hover-actions">
                <button className="hover-action-btn" onClick={handleQuickView}>
                  <FaEye /> Quick View
                </button>
                <button className="hover-action-btn" onClick={handleContact}>
                  <FaComment /> Contact
                </button>
                <button className={`hover-action-btn like-btn ${isLiked ? 'liked' : ''}`} onClick={handleLike}>
                  {isLiked ? <FaHeart /> : <FaRegHeart />} Save
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
          {/* Title Row */}
          <div className="info-row">
            <h4 className="card-title-compact">
              {vehicle.model || 'Transport Vehicle'}
            </h4>
            <span className="type-badge-compact">
              {getVehicleIcon(vehicle.type, vehicle.capacity)} {vehicle.type || 'Truck'}
            </span>
          </div>
          
          {/* Price Row */}
          <div className="price-row">
            <span className="price-compact">{formatZARPrice(vehicle.pricePerDay)}<span className="price-period">/day</span></span>
            {vehicle.pricePerKm && (
              <span className="extra-price-compact">
                +{formatZARPrice(vehicle.pricePerKm)}/km
              </span>
            )}
          </div>
          
          {/* Location & Capacity Row */}
          <div className="details-row">
            <div className="location-compact">
              <FaMapMarkerAlt /> {vehicle.location?.split(',')[0] || 'Location TBD'}
            </div>
            <div className="capacity-compact">
              <FaWeightHanging /> {getCapacityDisplay() || `${vehicle.capacity || 'N/A'}kg`}
            </div>
          </div>
        </div>
      </Link>
      
      {/* MOBILE EXPANDABLE SECTION - Only visible when tapped on mobile */}
      <div className="mobile-expandable">
        <div className="mobile-details">
          {/* Mobile warning for unverified owners */}
          {showWarning && (
            <div className="mobile-warning">
              <FaExclamationTriangle />
              <span>Unverified Owner - Exercise caution when booking</span>
            </div>
          )}
          
          <div className="mobile-detail-grid">
            <div className="mobile-detail">
              <span className="detail-label">Type:</span>
              <span className="detail-value">{vehicle.type || 'Transport'}</span>
            </div>
            <div className="mobile-detail">
              <span className="detail-label">Capacity:</span>
              <span className="detail-value">{getCapacityDisplay() || `${vehicle.capacity || 'N/A'} kg`}</span>
            </div>
            <div className="mobile-detail">
              <span className="detail-label">Location:</span>
              <span className="detail-value">{vehicle.location || 'TBD'}</span>
            </div>
            <div className="mobile-detail">
              <span className="detail-label">Per KM:</span>
              <span className="detail-value">{vehicle.pricePerKm ? formatZARPrice(vehicle.pricePerKm) : 'Included'}</span>
            </div>
            <div className="mobile-detail">
              <span className="detail-label">Owner:</span>
              <span className="detail-value">{vehicle.owner?.businessName || vehicle.owner?.name?.split(' ')[0] || 'Anonymous'}</span>
            </div>
            <div className="mobile-detail">
              <span className="detail-label">Verified:</span>
              <span className="detail-value">{isOwnerVerified ? '✅ Yes' : '❌ No'}</span>
            </div>
          </div>
          
          {vehicle.description && (
            <p className="mobile-description">{vehicle.description.substring(0, 120)}...</p>
          )}
          
          {vehicle.features && vehicle.features.length > 0 && (
            <div className="mobile-features">
              <span className="features-label">Features:</span>
              <div className="features-list">
                {vehicle.features.slice(0, 3).map((feature, idx) => (
                  <span key={idx} className="feature-tag">{feature}</span>
                ))}
                {vehicle.features.length > 3 && (
                  <span className="feature-tag">+{vehicle.features.length - 3} more</span>
                )}
              </div>
            </div>
          )}
          
          <div className="mobile-actions">
            <button className="mobile-action-btn" onClick={handleQuickView}>
              <FaEye /> Quick View
            </button>
            <button className="mobile-action-btn" onClick={handleContact}>
              <FaComment /> Contact
            </button>
            <button className={`mobile-action-btn ${isLiked ? 'liked' : ''}`} onClick={handleLike}>
              {isLiked ? <FaHeart /> : <FaRegHeart />} Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VehicleCard;