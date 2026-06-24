// HomePage.jsx - Updated with LivestockCard and VehicleCard integration
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { 
  FaComment, FaShare, FaUserCircle, FaCheckCircle,
  FaHeart, FaRegHeart, FaHome, FaArrowRight,
  FaStar, FaStarHalfAlt, FaRegStar, FaMapMarkerAlt,
  FaTruck, FaShieldAlt, FaPlay,
  FaCalendar, FaWeightHanging, FaUsers, FaStore,
  FaShoppingCart, FaChartLine, FaTractor, FaExclamationTriangle,
  FaGavel, FaClock
} from 'react-icons/fa';
import { GiCow, GiChicken, GiGoat, GiPig, GiSheep } from 'react-icons/gi';
import { useAuth } from '../context/AuthContext';
import LivestockCard from './livestock/LivestockCard';
import VehicleCard from './vehicle/VehicleCard';  
import './HomePage.css';

// Import all background images directly
import chickenBg from './Backgrounds/chicken.jpg';
import cow1Bg from './Backgrounds/cow1.jpg';
import cow2Bg from './Backgrounds/cow2.jpg';
import cowsBg from './Backgrounds/cows.jpg';
import dairyBg from './Backgrounds/dairy.jpg';
import goatBg from './Backgrounds/goat.jpg';
import pigBg from './Backgrounds/pig.jpg';
import roosterBg from './Backgrounds/rooster.jpg';
import sheepBg from './Backgrounds/sheep.jpg';
import wildlifeBg from './Backgrounds/wildlife.jpg';

// Array of background images (using imported paths)
const BACKGROUND_IMAGES = [
  chickenBg,
  cow1Bg,
  cow2Bg,
  cowsBg,
  dairyBg,
  goatBg,
  pigBg,
  roosterBg,
  sheepBg,
  wildlifeBg
];

// Fallback default background (in case images fail to load)
const DEFAULT_BG = "https://images.pexels.com/photos/4825704/beautiful-shot-of-cattle-grazing-on-a-lush-green-field-under-a-cloudy-sky/pexels-photo-4825704.jpeg";

// Slideshow interval in milliseconds (5 seconds)
const SLIDESHOW_INTERVAL = 5000;

const HomePage = () => {
  const { isAuthenticated, user } = useAuth();
  const [currentBackgroundIndex, setCurrentBackgroundIndex] = useState(0);
  const [backgroundImage, setBackgroundImage] = useState(BACKGROUND_IMAGES[0] || DEFAULT_BG);
  const [imageErrors, setImageErrors] = useState({});
  
  // Livestock state
  const [livestock, setLivestock] = useState([]);
  const [loadingLivestock, setLoadingLivestock] = useState(true);
  const [vehicles, setVehicles] = useState([]);
  const [loadingVehicles, setLoadingVehicles] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    totalLivestock: 0,
    totalVehicles: 0,
    activeAuctions: 0,
    verifiedSellers: 0
  });

  // Automatic background slideshow
  useEffect(() => {
    // Set initial background
    if (BACKGROUND_IMAGES[0]) {
      setBackgroundImage(BACKGROUND_IMAGES[0]);
    }
    
    // Set up interval to change background
    const intervalId = setInterval(() => {
      setCurrentBackgroundIndex((prevIndex) => {
        const nextIndex = (prevIndex + 1) % BACKGROUND_IMAGES.length;
        if (BACKGROUND_IMAGES[nextIndex]) {
          setBackgroundImage(BACKGROUND_IMAGES[nextIndex]);
        }
        return nextIndex;
      });
    }, SLIDESHOW_INTERVAL);
    
    // Cleanup interval on component unmount
    return () => clearInterval(intervalId);
  }, []);

  // Handle image loading errors
  const handleImageError = (index) => {
    setImageErrors(prev => ({ ...prev, [index]: true }));
    // If current image fails, try to use default or next image
    if (index === currentBackgroundIndex && BACKGROUND_IMAGES[currentBackgroundIndex + 1]) {
      setBackgroundImage(BACKGROUND_IMAGES[currentBackgroundIndex + 1]);
    } else if (index === currentBackgroundIndex) {
      setBackgroundImage(DEFAULT_BG);
    }
  };

  // Fetch real livestock data
  useEffect(() => {
    const fetchLivestock = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/livestock?limit=6');
        const livestockData = response.data.livestock || [];
        setLivestock(livestockData);
        
        // Calculate stats
        const activeAuctions = livestockData.filter(l => l.orderType === 'bid' && l.status === 'on_bid').length;
        const verifiedSellers = livestockData.filter(l => l.seller?.isVerified).length;
        
        setStats(prev => ({
          ...prev,
          totalLivestock: response.data.total || livestockData.length,
          activeAuctions,
          verifiedSellers
        }));
      } catch (error) {
        console.error('Error fetching livestock:', error);
        setError('Failed to load livestock listings');
      } finally {
        setLoadingLivestock(false);
      }
    };
    
    fetchLivestock();
  }, []);

  // Fetch real vehicle data
  useEffect(() => {
    const fetchVehicles = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/vehicles?limit=3');
        const vehiclesData = response.data.vehicles || [];
        setVehicles(vehiclesData);
        setStats(prev => ({
          ...prev,
          totalVehicles: response.data.total || vehiclesData.length
        }));
      } catch (error) {
        console.error('Error fetching vehicles:', error);
      } finally {
        setLoadingVehicles(false);
      }
    };
    
    fetchVehicles();
  }, []);

  // Optional: Add slideshow indicators
  const goToSlide = (index) => {
    if (BACKGROUND_IMAGES[index] && !imageErrors[index]) {
      setCurrentBackgroundIndex(index);
      setBackgroundImage(BACKGROUND_IMAGES[index]);
    }
  };

  // Get current display image (with fallback)
  const currentDisplayImage = imageErrors[currentBackgroundIndex] ? DEFAULT_BG : backgroundImage;

  // Determine sell button destination
  const getSellButtonLink = () => {
    if (!isAuthenticated) {
      return "/register";
    }
    if (user?.role === 'seller') {
      return "/seller/dashboard";
    }
    return "/register?upgrade=seller";
  };

  return (
    <div className="homepage-full">
      {/* Hero Section with Slideshow Background */}
      <div 
        className="hero-compact"
        style={{ 
          backgroundImage: `linear-gradient(rgba(0,0,0,0.6), rgba(0,0,0,0.65)), url(${currentDisplayImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      >
        <div className="hero-content-compact">
          <div className="hero-badge-compact">
            <span>🐄 Trusted Marketplace Since 2026</span>
          </div>
          <h1 className="hero-title-compact">
            Buy & Sell Livestock <span className="hero-highlight">With Confidence</span>
          </h1>
          <p className="hero-subtitle-compact">
            South Africa's premier platform for livestock trading and agricultural transport
          </p>
          
          
          
          <div className="hero-buttons-compact">
            <Link to="/livestock" className="btn-primary-compact">
              Browse Livestock <FaArrowRight />
            </Link>
            <Link to="/vehicles" className="btn-outline-compact">
              <FaTruck /> Find Transport
            </Link>
            <Link to={getSellButtonLink()} className="btn-secondary-compact">
              Start Selling <FaPlay />
            </Link>
          </div>

          {/* Slideshow Indicators */}
          <div className="slideshow-indicators">
            {BACKGROUND_IMAGES.map((_, index) => (
              <button
                key={index}
                className={`indicator-dot ${index === currentBackgroundIndex ? 'active' : ''}`}
                onClick={() => goToSlide(index)}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Main Feed Content */}
      <div className="feed-content">
        <div className="feed-container">
          {/* Livestock For Sale Section */}
          <div className="section-header">
            <div className="section-title">
              <GiCow className="section-icon" />
              <h2>Available Livestock</h2>
            </div>
            <Link to="/livestock" className="view-all-link">
              View All <FaArrowRight />
            </Link>
          </div>

          {loadingLivestock ? (
            <div className="loading-grid">
              <div className="loading-card"></div>
              <div className="loading-card"></div>
              <div className="loading-card"></div>
              <div className="loading-card"></div>
              <div className="loading-card"></div>
              <div className="loading-card"></div>
            </div>
          ) : livestock.length > 0 ? (
            <div className="livestock-grid">
              {livestock.map(item => (
                <LivestockCard key={item._id} livestock={item} />
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <GiCow className="empty-icon" />
              <h3>No livestock listed yet</h3>
              <p>Be the first to list your livestock for sale on Imfuyo</p>
              {isAuthenticated ? (
                <Link to="/seller/add-livestock" className="empty-state-btn">
                  Add Livestock
                </Link>
              ) : (
                <Link to="/register" className="empty-state-btn">
                  Sign up to start selling
                </Link>
              )}
            </div>
          )}

          {/* Transport Vehicles Section - Using new compact VehicleCard */}
          <div className="section-header">
            <div className="section-title">
              <FaTruck className="section-icon" />
              <h2>Transport Vehicles</h2>
            </div>
            <Link to="/vehicles" className="view-all-link">
              View All <FaArrowRight />
            </Link>
          </div>

          {loadingVehicles ? (
            <div className="loading-grid">
              <div className="loading-card"></div>
              <div className="loading-card"></div>
              <div className="loading-card"></div>
            </div>
          ) : vehicles.length > 0 ? (
            <div className="vehicles-grid">
              {vehicles.map(vehicle => (
                <VehicleCard key={vehicle._id} vehicle={vehicle} />
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <FaTruck className="empty-icon" />
              <h3>No vehicles listed yet</h3>
              <p>Be the first to list a vehicle for livestock transport</p>
              {isAuthenticated ? (
                <Link to="/seller/add-vehicle" className="empty-state-btn">
                  Add Vehicle
                </Link>
              ) : (
                <Link to="/register" className="empty-state-btn">
                  Sign up to list vehicles
                </Link>
              )}
            </div>
          )}

          {/* Features Section */}
          <div className="features-section">
            <h2 className="features-title">Why Choose Imfuyo?</h2>
            <div className="features-grid">
              <div className="feature-card">
                <div className="feature-icon">
                  <FaShieldAlt size={32} />
                </div>
                <h3>Secure Transactions</h3>
                <p>Safe and secure payment processing for all transactions with buyer protection</p>
              </div>
              <div className="feature-card">
                <div className="feature-icon">
                  <FaCheckCircle size={32} />
                </div>
                <h3>Verified Sellers</h3>
                <p>All sellers undergo thorough identity and business verification process</p>
              </div>
              <div className="feature-card">
                <div className="feature-icon">
                  <FaTruck size={32} />
                </div>
                <h3>Transport Services</h3>
                <p>Reliable livestock transportation across all provinces in South Africa</p>
              </div>
              <div className="feature-card">
                <div className="feature-icon">
                  <FaGavel size={32} />
                </div>
                <h3>Live Auctions</h3>
                <p>Participate in real-time livestock auctions from anywhere</p>
              </div>
            </div>
          </div>

          {/* CTA Banner */}
          <div className="cta-banner">
            <div className="cta-content">
              <h3>Ready to grow your livestock business?</h3>
              <p>Join thousands of successful farmers and traders on Imfuyo today</p>
              <Link to={getSellButtonLink()} className="cta-button">
                Become a Seller Today <FaArrowRight />
              </Link>
            </div>
            <GiCow className="cta-icon" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;