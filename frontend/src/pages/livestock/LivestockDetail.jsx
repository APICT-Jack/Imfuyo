// LivestockDetail.jsx - Updated with bidding functionality, no save button, verification in details tab
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  FaMapMarkerAlt, FaCalendar, FaWeightHanging, FaShieldAlt, 
  FaExclamationTriangle, FaCheckCircle, FaPhone, FaEnvelope, 
  FaShare, FaComments, FaArrowLeft, FaBuilding,
  FaTruck, FaCar, FaMotorcycle, FaShip, FaPlane, FaInfoCircle,
  FaWhatsapp, FaUserCheck, FaUserShield, FaStar, FaStarHalfAlt, FaRegStar,
  FaChevronLeft, FaChevronRight, FaExpand, FaTimes, FaCheck,
  FaClock, FaTag, FaStore, FaIdCard, FaSpinner, FaGavel, 
  FaHistory, FaTrophy, FaUser, FaBolt
} from 'react-icons/fa';
import SidePanel from '.././SidePanel';
import './LivestockDetail.css';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const LivestockDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  // State management
  const [livestock, setLivestock] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [vehicles, setVehicles] = useState([]);
  const [vehiclesLoading, setVehiclesLoading] = useState(false);
  const [searchMessage, setSearchMessage] = useState(null);
  const [error, setError] = useState(null);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('details');
  const [showContactOptions, setShowContactOptions] = useState(false);
  const [imageErrors, setImageErrors] = useState({});
  const [imageLoading, setImageLoading] = useState({});
  const [user, setUser] = useState(null);
  
  // Bidding state
  const [bidAmount, setBidAmount] = useState('');
  const [isPlacingBid, setIsPlacingBid] = useState(false);
  const [bidError, setBidError] = useState(null);
  const [bidSuccess, setBidSuccess] = useState(null);
  const [bidHistory, setBidHistory] = useState([]);
  const [showBidHistory, setShowBidHistory] = useState(false);
  const [currentBid, setCurrentBid] = useState(null);
  const [timeRemaining, setTimeRemaining] = useState(null);
  const [isBidEnded, setIsBidEnded] = useState(false);
  const [showBidConfirmation, setShowBidConfirmation] = useState(false);
  const [confirmBidAmount, setConfirmBidAmount] = useState(null);
  
  // Refs
  const galleryRef = useRef(null);
  const detailRef = useRef(null);
  const bidInputRef = useRef(null);
  const timerIntervalRef = useRef(null);

  // Fetch user on mount
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const userData = JSON.parse(localStorage.getItem('user') || '{}');
        setUser(userData);
      } catch (e) {
        console.error('Error parsing user data:', e);
      }
    }
  }, []);

  // Main data fetch
  useEffect(() => {
    fetchLivestock();
    fetchBidHistory();
    window.scrollTo(0, 0);
    
    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, [id]);

  // Fetch nearby vehicles when livestock loads
  useEffect(() => {
    if (livestock && livestock.location) {
      fetchNearbyVehicles();
    }
  }, [livestock]);

  // Timer for bid countdown
  useEffect(() => {
    if (livestock && livestock.orderType === 'bid' && livestock.bidDetails) {
      const endTime = new Date(livestock.bidDetails.bidEndTime);
      const now = new Date();
      
      if (endTime > now) {
        setIsBidEnded(false);
        updateTimeRemaining();
        
        if (timerIntervalRef.current) {
          clearInterval(timerIntervalRef.current);
        }
        
        timerIntervalRef.current = setInterval(() => {
          updateTimeRemaining();
        }, 1000);
      } else {
        setIsBidEnded(true);
        setTimeRemaining('Ended');
        if (timerIntervalRef.current) {
          clearInterval(timerIntervalRef.current);
        }
      }
    }
    
    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, [livestock]);

  // Real-time bid updates via polling
  useEffect(() => {
    if (livestock && livestock.orderType === 'bid' && !isBidEnded) {
      const pollInterval = setInterval(() => {
        fetchLatestBidInfo();
      }, 10000); // Poll every 10 seconds
      
      return () => clearInterval(pollInterval);
    }
  }, [livestock, isBidEnded]);

  const updateTimeRemaining = () => {
    if (!livestock || !livestock.bidDetails) return;
    
    const endTime = new Date(livestock.bidDetails.bidEndTime);
    const now = new Date();
    const diff = endTime - now;
    
    if (diff <= 0) {
      setIsBidEnded(true);
      setTimeRemaining('Ended');
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
      return;
    }
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
    
    let timeStr = '';
    if (days > 0) {
      timeStr = `${days}d ${hours}h ${minutes}m ${seconds}s`;
    } else if (hours > 0) {
      timeStr = `${hours}h ${minutes}m ${seconds}s`;
    } else {
      timeStr = `${minutes}m ${seconds}s`;
    }
    
    setTimeRemaining(timeStr);
  };

  const fetchLatestBidInfo = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/livestock/${id}/bidding-history`);
      if (response.data) {
        setCurrentBid(response.data.currentBid);
        setBidHistory(response.data.bidHistory || []);
        
        // Check if bid end time has passed
        if (response.data.bidEndTime) {
          const endTime = new Date(response.data.bidEndTime);
          if (new Date() > endTime) {
            setIsBidEnded(true);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching latest bid info:', error);
    }
  };

  const fetchLivestock = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/livestock/${id}`);
      setLivestock(response.data);
      setError(null);
      
      // Initialize bid state
      if (response.data.orderType === 'bid') {
        setCurrentBid(response.data.bidDetails?.currentBid || response.data.bidDetails?.startingBid);
        setBidHistory(response.data.bidDetails?.bidHistory || []);
        setBidAmount(response.data.bidDetails?.currentBid ? 
          (response.data.bidDetails.currentBid + (response.data.bidDetails.minimumIncrement || 0)).toString() : 
          (response.data.bidDetails?.startingBid || 0).toString()
        );
        
        // Check if bid ended
        if (response.data.bidDetails?.bidEndTime) {
          const endTime = new Date(response.data.bidDetails.bidEndTime);
          if (new Date() > endTime) {
            setIsBidEnded(true);
            setTimeRemaining('Ended');
          }
        }
      }
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

  const fetchBidHistory = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/livestock/${id}/bidding-history`);
      setBidHistory(response.data.bidHistory || []);
    } catch (error) {
      console.error('Error fetching bid history:', error);
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
    if (!price && price !== 0) return 'POA';
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

  const formatDateTime = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleString('en-ZA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
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

  // ==================== BIDDING FUNCTIONS ====================
  
  const handleBidInputChange = (e) => {
    const value = e.target.value.replace(/[^0-9.]/g, '');
    setBidAmount(value);
    setBidError(null);
    setBidSuccess(null);
  };

  const getMinimumBid = () => {
    if (!livestock || livestock.orderType !== 'bid') return 0;
    
    const currentBidValue = livestock.bidDetails?.currentBid || livestock.bidDetails?.startingBid || 0;
    const increment = livestock.bidDetails?.minimumIncrement || (currentBidValue * 0.05);
    return currentBidValue + increment;
  };

  const getStartingBid = () => {
    return livestock?.bidDetails?.startingBid || 0;
  };

  const handlePlaceBid = () => {
    const amount = parseFloat(bidAmount);
    const minBid = getMinimumBid();
    
    if (!amount || isNaN(amount) || amount <= 0) {
      setBidError('Please enter a valid bid amount');
      return;
    }
    
    if (amount < minBid) {
      setBidError(`Minimum bid is ${formatZARPrice(minBid)}`);
      return;
    }
    
    // Show confirmation
    setConfirmBidAmount(amount);
    setShowBidConfirmation(true);
  };

  const confirmPlaceBid = async () => {
    if (!confirmBidAmount) return;
    
    setIsPlacingBid(true);
    setBidError(null);
    setBidSuccess(null);
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      const response = await axios.post(
        `${API_BASE_URL}/livestock/${livestock._id}/bid`,
        { bidAmount: confirmBidAmount },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      
      if (response.data) {
        setBidSuccess(`Bid of ${formatZARPrice(confirmBidAmount)} placed successfully!`);
        setCurrentBid(confirmBidAmount);
        setShowBidConfirmation(false);
        setConfirmBidAmount(null);
        
        // Update livestock data
        await fetchLivestock();
        
        // Update bid history
        await fetchBidHistory();
        
        // Set new bid amount for next bid
        const newMinBid = confirmBidAmount + (livestock.bidDetails?.minimumIncrement || (confirmBidAmount * 0.05));
        setBidAmount(newMinBid.toString());
        
        // Clear success message after 5 seconds
        setTimeout(() => {
          setBidSuccess(null);
        }, 5000);
      }
    } catch (error) {
      console.error('Error placing bid:', error);
      setBidError(error.response?.data?.message || 'Failed to place bid. Please try again.');
    } finally {
      setIsPlacingBid(false);
    }
  };

  const cancelBidConfirmation = () => {
    setShowBidConfirmation(false);
    setConfirmBidAmount(null);
  };

  // Calculate bidder rank
  const getBidderRank = (index) => {
    if (index === 0) return '🏆';
    if (index === 1) return '🥈';
    if (index === 2) return '🥉';
    return `#${index + 1}`;
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

  const isOwnListing = () => {
    if (!user || !livestock) return false;
    return user._id === livestock.seller?._id || user._id === livestock.seller;
  };

  const canBid = () => {
    if (!user) return false;
    if (isOwnListing()) return false;
    if (isBidEnded) return false;
    if (livestock?.status === 'sold') return false;
    if (livestock?.status === 'reserved') return false;
    return true;
  };

  const canViewBidHistory = () => {
    return bidHistory && bidHistory.length > 0;
  };

  // Check if seller is verified
  const isSellerVerified = livestock?.seller?.isVerified || false;

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

  const sellerRating = livestock.seller?.rating;
  const hasMultipleImages = livestock.images && livestock.images.length > 1;
  const displayImages = livestock.images?.filter((_, idx) => !imageErrors[idx]) || [];
  const isBidType = livestock.orderType === 'bid';
  const minBid = getMinimumBid();
  const isSold = livestock.status === 'sold' || livestock.status === 'reserved';

  return (
    <div className="ld_page">
      {/* Header */}
      <header className="ld_header">
        <button className="ld_back_button" onClick={() => navigate(-1)} aria-label="Go back">
          <FaArrowLeft />
        </button>
        <div className="ld_header_actions">
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
            <span className="ld_price_label">
              {isBidType ? 'Current Bid' : 'Price'}
            </span>
            <div className="ld_price">
              {isBidType ? formatZARPrice(currentBid || livestock.bidDetails?.startingBid) : formatZARPrice(livestock.price)}
              {isBidType && livestock.bidDetails?.startingBid && (
                <span className="ld_starting_bid_label">
                  (Starting: {formatZARPrice(livestock.bidDetails.startingBid)})
                </span>
              )}
            </div>
            {isBidType && livestock.bidDetails?.reservePrice && (
              <div className="ld_reserve_info">
                {livestock.bidDetails.reserveMet ? (
                  <span className="ld_reserve_met">✅ Reserve met</span>
                ) : (
                  <span className="ld_reserve_not_met">⚠️ Reserve not yet met</span>
                )}
              </div>
            )}
          </div>
          <div className={`ld_status ld_status_${livestock.status || 'available'}`}>
            {livestock.status === 'available' && <FaCheck />}
            {livestock.status === 'on_bid' && <FaGavel />}
            {(livestock.status || 'AVAILABLE').toUpperCase()}
          </div>
        </div>

        {/* Verification Warning - Now in Details Tab */}
        {!isSellerVerified && (
          <div className="ld_warning_banner ld_warning_in_details">
            <FaUserShield />
            <div>
              <strong>⚠️ Unverified Seller</strong>
              <p>Please exercise caution when dealing with unverified sellers. Verify the seller's identity before making any payments.</p>
            </div>
          </div>
        )}

        {/* Bid Timer - Show for bid listings */}
        {isBidType && !isSold && (
          <div className={`ld_bid_timer ${isBidEnded ? 'ld_bid_ended' : ''}`}>
            <div className="ld_timer_icon">
              <FaClock />
            </div>
            <div className="ld_timer_info">
              <span className="ld_timer_label">{isBidEnded ? 'Bidding Ended' : 'Time Remaining'}</span>
              <span className="ld_timer_value">
                {isBidEnded ? 'This auction has ended' : timeRemaining || 'Loading...'}
              </span>
            </div>
            {!isBidEnded && (
              <div className="ld_bid_count">
                <FaGavel />
                <span>{bidHistory?.length || 0} bids</span>
              </div>
            )}
          </div>
        )}

        {/* Bidding Section */}
        {isBidType && !isSold && (
          <div className="ld_bid_section">
            <div className="ld_bid_header">
              <h3 className="ld_bid_title">
                <FaGavel className="ld_bid_icon" /> Place Your Bid
              </h3>
              {canViewBidHistory() && (
                <button 
                  className="ld_view_history_btn" 
                  onClick={() => setShowBidHistory(!showBidHistory)}
                >
                  <FaHistory /> {showBidHistory ? 'Hide History' : 'View History'}
                </button>
              )}
            </div>

            {/* Bid History */}
            {showBidHistory && canViewBidHistory() && (
              <div className="ld_bid_history_panel">
                <h4>Bidding History</h4>
                <div className="ld_bid_history_list">
                  {bidHistory.slice().reverse().map((bid, idx) => (
                    <div key={idx} className="ld_bid_history_item">
                      <span className="ld_bidder_rank">{getBidderRank(bidHistory.length - 1 - idx)}</span>
                      <span className="ld_bidder_name">
                        {bid.bidder?.businessName || bid.bidder?.name || 'Anonymous'}
                      </span>
                      <span className="ld_bid_amount">{formatZARPrice(bid.amount)}</span>
                      <span className="ld_bid_time">{formatDateTime(bid.timestamp)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Bid Error/Success Messages */}
            {bidError && (
              <div className="ld_bid_error">{bidError}</div>
            )}
            {bidSuccess && (
              <div className="ld_bid_success">{bidSuccess}</div>
            )}

            {/* Bid Input */}
            {!isBidEnded && !isSold && (
              <div className="ld_bid_input_group">
                <div className="ld_bid_input_wrapper">
                  <span className="ld_bid_currency">R</span>
                  <input
                    ref={bidInputRef}
                    type="text"
                    className="ld_bid_input"
                    value={bidAmount}
                    onChange={handleBidInputChange}
                    placeholder={`Min: ${formatZARPrice(minBid)}`}
                    disabled={isPlacingBid || !canBid() || isBidEnded || isSold}
                  />
                </div>
                <button
                  className="ld_bid_button"
                  onClick={handlePlaceBid}
                  disabled={isPlacingBid || !canBid() || isBidEnded || isSold}
                >
                  {isPlacingBid ? (
                    <><FaSpinner className="spinner" /> Placing Bid...</>
                  ) : (
                    <><FaGavel /> Place Bid</>
                  )}
                </button>
              </div>
            )}

            {/* Bid Info */}
            <div className="ld_bid_info">
              {!isBidEnded && !isSold && (
                <>
                  <div className="ld_bid_info_item">
                    <span>Minimum bid</span>
                    <strong>{formatZARPrice(minBid)}</strong>
                  </div>
                  <div className="ld_bid_info_item">
                    <span>Current highest</span>
                    <strong>{formatZARPrice(currentBid || livestock.bidDetails?.startingBid)}</strong>
                  </div>
                </>
              )}
              {isBidEnded && !isSold && (
                <div className="ld_bid_ended_message">
                  <FaExclamationTriangle /> This auction has ended. The highest bidder will be contacted.
                </div>
              )}
              {isSold && (
                <div className="ld_bid_sold_message">
                  <FaCheckCircle /> This item has been sold.
                </div>
              )}
              {isOwnListing() && isBidType && !isSold && (
                <div className="ld_own_listing_warning">
                  <FaInfoCircle /> You cannot bid on your own listing.
                </div>
              )}
              {!user && isBidType && !isSold && (
                <div className="ld_login_to_bid">
                  <button 
                    className="ld_login_bid_btn"
                    onClick={() => navigate('/login')}
                  >
                    Login to place a bid
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

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

          {isBidType && (
            <div className="ld_metric_card">
              <FaGavel className="ld_metric_icon" />
              <div>
                <div className="ld_metric_label">Bids</div>
                <div className="ld_metric_value">{bidHistory?.length || 0}</div>
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
          {isBidType && (
            <span className="ld_tag ld_tag_bid">
              <FaGavel /> Auction
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
          {isBidType && canViewBidHistory() && (
            <button 
              className={`ld_tab ${activeTab === 'bids' ? 'ld_tab_active' : ''}`}
              onClick={() => setActiveTab('bids')}
            >
              <FaHistory /> Bids
            </button>
          )}
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
                  {isBidType && livestock.bidDetails?.bidEndTime && (
                    <div className="ld_info_item">
                      <FaGavel className="ld_info_icon" />
                      <div>
                        <div className="ld_info_label">Auction Ends</div>
                        <div className="ld_info_value">{formatDateTime(livestock.bidDetails.bidEndTime)}</div>
                      </div>
                    </div>
                  )}
                  {/* Verification Status in Details */}
                  <div className="ld_info_item">
                    <FaUserShield className="ld_info_icon" />
                    <div>
                      <div className="ld_info_label">Seller Verification</div>
                      <div className="ld_info_value">
                        {isSellerVerified ? (
                          <span style={{ color: '#38a169' }}>✅ Verified</span>
                        ) : (
                          <span style={{ color: '#dd6b20' }}>⚠️ Unverified</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Seller Tab */}
          {activeTab === 'seller' && livestock.seller && (
            <div className="ld_seller_section">
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

          {/* Bids Tab */}
          {activeTab === 'bids' && isBidType && (
            <div className="ld_bids_tab">
              <div className="ld_bids_summary">
                <div className="ld_bids_stat">
                  <span>Total Bids</span>
                  <strong>{bidHistory?.length || 0}</strong>
                </div>
                <div className="ld_bids_stat">
                  <span>Current Bid</span>
                  <strong>{formatZARPrice(currentBid || livestock.bidDetails?.startingBid)}</strong>
                </div>
                <div className="ld_bids_stat">
                  <span>Starting Bid</span>
                  <strong>{formatZARPrice(livestock.bidDetails?.startingBid)}</strong>
                </div>
              </div>

              {canViewBidHistory() ? (
                <div className="ld_bid_history_full">
                  <h4>All Bids</h4>
                  <div className="ld_bid_history_list_full">
                    {bidHistory.slice().reverse().map((bid, idx) => (
                      <div key={idx} className="ld_bid_history_item_full">
                        <div className="ld_bid_history_bidder">
                          <span className="ld_bid_history_rank">{getBidderRank(bidHistory.length - 1 - idx)}</span>
                          <span className="ld_bid_history_name">
                            {bid.bidder?.businessName || bid.bidder?.name || 'Anonymous'}
                          </span>
                        </div>
                        <div className="ld_bid_history_details">
                          <span className="ld_bid_history_amount">{formatZARPrice(bid.amount)}</span>
                          <span className="ld_bid_history_time">{formatDateTime(bid.timestamp)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="ld_no_bids">
                  <FaGavel />
                  <p>No bids have been placed yet</p>
                  <p className="ld_no_bids_sub">Be the first to bid on this item!</p>
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
        {isBidType && !isSold && !isBidEnded && canBid() && (
          <button 
            className="ld_action_btn ld_action_bid" 
            onClick={() => {
              if (bidInputRef.current) {
                bidInputRef.current.focus();
              }
            }}
          >
            <FaGavel /> Place Bid
          </button>
        )}
        {livestock.seller?.phone && (
          <button className="ld_action_btn ld_action_primary" onClick={() => setShowContactOptions(true)}>
            <FaWhatsapp /> Contact Seller
          </button>
        )}
      </div>

      {/* Bid Confirmation Modal */}
      {showBidConfirmation && (
        <div className="ld_modal" onClick={cancelBidConfirmation}>
          <div className="ld_modal_content ld_modal_bid" onClick={(e) => e.stopPropagation()}>
            <h3 className="ld_modal_title">Confirm Your Bid</h3>
            <div className="ld_modal_bid_details">
              <p>You are about to place a bid of</p>
              <div className="ld_modal_bid_amount">{formatZARPrice(confirmBidAmount)}</div>
              {livestock.bidDetails?.reservePrice && !livestock.bidDetails.reserveMet && (
                <div className="ld_modal_reserve_warning">
                  <FaExclamationTriangle /> 
                  Reserve price of {formatZARPrice(livestock.bidDetails.reservePrice)} not yet met
                </div>
              )}
              <p className="ld_modal_bid_note">
                By placing this bid, you agree to purchase this item if you win the auction.
              </p>
            </div>
            <div className="ld_modal_options">
              <button className="ld_modal_option ld_modal_cancel" onClick={cancelBidConfirmation}>
                Cancel
              </button>
              <button 
                className="ld_modal_option ld_modal_confirm" 
                onClick={confirmPlaceBid}
                disabled={isPlacingBid}
              >
                {isPlacingBid ? (
                  <><FaSpinner className="spinner" /> Placing...</>
                ) : (
                  'Confirm Bid'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

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