import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { 
  FaPlus, FaPaw, FaTruck, FaCheckCircle, FaClock, FaExclamationTriangle, 
  FaInfoCircle, FaEdit, FaTrash, FaEye, FaChartLine, FaCalendarAlt,
  FaMapMarkerAlt, FaDollarSign, FaUsers, FaStar, FaFilter, FaSearch,
  FaTimes, FaChevronLeft, FaChevronRight, FaSync, FaDownload, FaBan,
  FaTag, FaCar, FaTractor, FaDog, FaCat, FaHorse, FaDrumstickBite
} from 'react-icons/fa';
import './SellerDashboard.css';

const SellerDashboard = () => {
  const { user, token, fetchUser } = useAuth();
  const navigate = useNavigate();
  
  // State management
  const [listings, setListings] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({
    totalListings: 0,
    totalVehicles: 0,
    totalLivestock: 0,
    activeListings: 0,
    soldRentedCount: 0,
    pendingVerification: 0,
    totalViews: 0,
    totalRevenue: 0
  });
  
  // Filter states
  const [activeTab, setActiveTab] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [showFilters, setShowFilters] = useState(false);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(8);
  
  // Delete modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [itemType, setItemType] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (user && user.verificationStatus === 'not_submitted' && !user.isVerified) {
      navigate('/seller/verify');
      return;
    }
    fetchSellerData();
  }, [user]);

  const fetchSellerData = async () => {
    try {
      setLoading(true);
      
      // Fetch authenticated user's livestock
      const livestockRes = await axios.get('http://localhost:5000/api/livestock/user/my-listings', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      // Fetch authenticated user's vehicles
      const vehiclesRes = await axios.get('http://localhost:5000/api/vehicles/me', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      const livestockData = livestockRes.data.livestock || [];
      const vehiclesData = vehiclesRes.data.vehicles || [];
      
      setListings(livestockData);
      setVehicles(vehiclesData);
      
      // Calculate stats
      const activeLivestock = livestockData.filter(l => l.status === 'available').length;
      const activeVehicles = vehiclesData.filter(v => v.available === true).length;
      const soldLivestock = livestockData.filter(l => l.status === 'sold').length;
      const rentedVehicles = vehiclesData.filter(v => v.available === false).length;
      const totalViews = [...livestockData, ...vehiclesData].reduce((sum, item) => sum + (item.viewCount || 0), 0);
      
      setStats({
        totalListings: livestockData.length + vehiclesData.length,
        totalVehicles: vehiclesData.length,
        totalLivestock: livestockData.length,
        activeListings: activeLivestock + activeVehicles,
        soldRentedCount: soldLivestock + rentedVehicles,
        pendingVerification: livestockData.filter(l => !l.sellerVerified).length + 
                            vehiclesData.filter(v => !v.ownerVerified).length,
        totalViews: totalViews,
        totalRevenue: 0
      });
      
    } catch (error) {
      console.error('Error fetching seller data:', error);
      if (error.response?.status === 401) {
        navigate('/login');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const refreshData = async () => {
    setRefreshing(true);
    await fetchSellerData();
  };

  const getAllListings = useCallback(() => {
    const livestockWithType = listings.map(item => ({
      ...item,
      listingType: 'livestock',
      displayTitle: `${item.breed} (${item.type})`,
      displayPrice: item.price,
      displayPriceText: `R ${item.price?.toLocaleString()}`,
      displayStatus: item.status === 'available' ? 'available' : 'sold',
      displayStatusText: item.status === 'available' ? 'Available' : 'Sold',
      displayImage: item.images?.[0],
      displayDate: item.createdAt,
      isVerified: item.sellerVerified,
      isActive: item.status === 'available',
      location: item.location,
      viewCount: item.viewCount || 0
    }));
    
    const vehiclesWithType = vehicles.map(item => ({
      ...item,
      listingType: 'vehicle',
      displayTitle: `${item.model} (${item.type})`,
      displayPrice: item.pricePerDay,
      displayPriceText: `R ${item.pricePerDay?.toLocaleString()}/day`,
      displayStatus: item.available ? 'available' : 'rented',
      displayStatusText: item.available ? 'Available' : 'On Duty',
      displayImage: item.images?.[0],
      displayDate: item.createdAt,
      isVerified: item.ownerVerified,
      isActive: item.available,
      location: item.location,
      viewCount: item.viewCount || 0
    }));
    
    let all = [...livestockWithType, ...vehiclesWithType];
    
    if (activeTab === 'livestock') {
      all = all.filter(item => item.listingType === 'livestock');
    } else if (activeTab === 'vehicles') {
      all = all.filter(item => item.listingType === 'vehicle');
    }
    
    if (filterStatus !== 'all') {
      all = all.filter(item => item.displayStatus === filterStatus);
    }
    
    if (searchTerm) {
      all = all.filter(item => 
        item.displayTitle.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    all.sort((a, b) => {
      switch(sortBy) {
        case 'newest':
          return new Date(b.displayDate) - new Date(a.displayDate);
        case 'oldest':
          return new Date(a.displayDate) - new Date(b.displayDate);
        case 'price-high':
          return b.displayPrice - a.displayPrice;
        case 'price-low':
          return a.displayPrice - b.displayPrice;
        case 'most-viewed':
          return (b.viewCount || 0) - (a.viewCount || 0);
        default:
          return new Date(b.displayDate) - new Date(a.displayDate);
      }
    });
    
    return all;
  }, [listings, vehicles, activeTab, filterStatus, searchTerm, sortBy]);

  const allListings = getAllListings();
  const totalPages = Math.ceil(allListings.length / itemsPerPage);
  const paginatedListings = allListings.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, filterStatus, searchTerm, sortBy]);

  const handleDeleteClick = (item, type) => {
    setItemToDelete(item);
    setItemType(type);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!itemToDelete) return;
    
    setDeleting(true);
    try {
      if (itemType === 'livestock') {
        await axios.delete(`http://localhost:5000/api/livestock/${itemToDelete._id}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        setListings(listings.filter(l => l._id !== itemToDelete._id));
      } else {
        await axios.delete(`http://localhost:5000/api/vehicles/${itemToDelete._id}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        setVehicles(vehicles.filter(v => v._id !== itemToDelete._id));
      }
      
      setStats(prev => ({
        ...prev,
        totalListings: prev.totalListings - 1,
        activeListings: itemToDelete.isActive ? prev.activeListings - 1 : prev.activeListings,
        soldRentedCount: !itemToDelete.isActive ? prev.soldRentedCount - 1 : prev.soldRentedCount
      }));
      
      setShowDeleteModal(false);
      setItemToDelete(null);
      setItemType(null);
    } catch (error) {
      console.error('Error deleting item:', error);
      alert('Failed to delete item. Please try again.');
    } finally {
      setDeleting(false);
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-ZA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getVerificationStatus = () => {
    if (user?.isVerified) {
      return {
        icon: <FaCheckCircle />,
        text: 'Verified Seller',
        color: 'verified',
        message: 'Your account is verified. Buyers trust your listings.',
        badge: 'Verified'
      };
    } else if (user?.verificationStatus === 'pending') {
      return {
        icon: <FaClock />,
        text: 'Verification Pending',
        color: 'pending',
        message: 'Your documents are being reviewed. You can list items, but they will show a warning badge.',
        badge: 'Pending'
      };
    } else if (user?.verificationStatus === 'rejected') {
      return {
        icon: <FaExclamationTriangle />,
        text: 'Verification Rejected',
        color: 'rejected',
        message: 'Your verification was rejected. Please resubmit your documents.',
        badge: 'Rejected'
      };
    } else {
      return {
        icon: <FaExclamationTriangle />,
        text: 'Verification Required',
        color: 'unverified',
        message: 'Please complete verification to start selling.',
        badge: 'Unverified'
      };
    }
  };

  const verification = getVerificationStatus();
  const canAddListings = user?.isVerified || user?.verificationStatus === 'pending';

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="loading-spinner"></div>
        <p>Loading your dashboard...</p>
      </div>
    );
  }

  // Helper function to get icon for placeholder
  const getPlaceholderIcon = (listingType) => {
    if (listingType === 'livestock') {
      return <FaPaw size={48} />;
    }
    return <FaCar size={48} />;
  };

  return (
    <div className="seller-dashboard">
      {/* Dashboard Header */}
      <div className="dashboard-header">
        <div className="header-left">
          <h1>Seller Dashboard</h1>
          <p className="dashboard-subtitle">Manage your livestock and vehicle listings</p>
        </div>
        <div className="dashboard-actions">
          <button onClick={refreshData} className="btn-refresh" disabled={refreshing}>
            <FaSync className={refreshing ? 'spinning' : ''} /> Refresh
          </button>
          {canAddListings && (
            <div className="add-buttons">
              <Link to="/seller/add-livestock" className="btn-primary">
                <FaPlus /> <span>Add Livestock</span>
              </Link>
              <Link to="/seller/add-vehicle" className="btn-secondary">
                <FaPlus /> <span>Add Vehicle</span>
              </Link>
            </div>
          )}
        </div>
      </div>
      
      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon blue">
            <FaChartLine />
          </div>
          <div className="stat-info">
            <h3>{stats.totalListings}</h3>
            <p>Total Listings</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon green">
            <FaCheckCircle />
          </div>
          <div className="stat-info">
            <h3>{stats.activeListings}</h3>
            <p>Active Listings</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon orange">
            <FaBan />
          </div>
          <div className="stat-info">
            <h3>{stats.soldRentedCount}</h3>
            <p>Sold/Rented</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon purple">
            <FaEye />
          </div>
          <div className="stat-info">
            <h3>{stats.totalViews.toLocaleString()}</h3>
            <p>Total Views</p>
          </div>
        </div>
      </div>
      
      {/* Verification Status Card */}
      <div className={`verification-card ${verification.color}`}>
        <div className="verification-icon">{verification.icon}</div>
        <div className="verification-content">
          <h3>{verification.text}</h3>
          <p>{verification.message}</p>
          {user?.verificationStatus === 'rejected' && (
            <Link to="/seller/verify" className="verification-link">
              Resubmit Documents
            </Link>
          )}
          {user?.verificationStatus === 'not_submitted' && (
            <Link to="/seller/verify" className="verification-link">
              Submit Verification
            </Link>
          )}
        </div>
      </div>
      
      {/* Info Alert for Pending Verification */}
      {user?.verificationStatus === 'pending' && (
        <div className="info-alert">
          <FaInfoCircle />
          <div>
            <strong>Good to know:</strong> While your verification is pending, you can list items for sale. 
            Your listings will show a "Seller Unverified" warning badge, and buyers will be advised to proceed at their own risk.
          </div>
        </div>
      )}
      
      {/* Filters Section */}
      <div className="filters-section">
        <div className="filters-header">
          <div className="tabs">
            <button 
              className={`tab ${activeTab === 'all' ? 'active' : ''}`}
              onClick={() => setActiveTab('all')}
            >
              All Items ({listings.length + vehicles.length})
            </button>
            <button 
              className={`tab ${activeTab === 'livestock' ? 'active' : ''}`}
              onClick={() => setActiveTab('livestock')}
            >
              <FaPaw /> Livestock ({listings.length})
            </button>
            <button 
              className={`tab ${activeTab === 'vehicles' ? 'active' : ''}`}
              onClick={() => setActiveTab('vehicles')}
            >
              <FaTruck /> Vehicles ({vehicles.length})
            </button>
          </div>
          <button className="filter-toggle" onClick={() => setShowFilters(!showFilters)}>
            <FaFilter /> Filters
          </button>
        </div>
        
        {showFilters && (
          <div className="filters-panel">
            <div className="filter-group">
              <label>Status</label>
              <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                <option value="all">All Status</option>
                <option value="available">Available</option>
                <option value="sold">Sold</option>
                <option value="rented">On Duty</option>
              </select>
            </div>
            <div className="filter-group">
              <label>Sort By</label>
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="price-high">Price: High to Low</option>
                <option value="price-low">Price: Low to High</option>
                <option value="most-viewed">Most Viewed</option>
              </select>
            </div>
            <div className="filter-group search-group">
              <label>Search</label>
              <div className="search-input">
                <FaSearch />
                <input 
                  type="text" 
                  placeholder="Search by title..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                {searchTerm && (
                  <button onClick={() => setSearchTerm('')} className="clear-search">
                    <FaTimes />
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Listings Section */}
      <div className="listings-section">
        <div className="listings-header">
          <h2>My Listings</h2>
          <span className="listings-count">{allListings.length} items</span>
        </div>
        
        <div className="listings-grid">
          {paginatedListings.map(item => (
            <div key={`${item.listingType}-${item._id}`} className="listing-card">
              {/* REMOVED: Verification warning badge for dashboard */}
              {/* The badge is intentionally removed because this is the seller's own dashboard */}
              
              {item.displayImage ? (
                <img src={item.displayImage} alt={item.displayTitle} className="listing-image" />
              ) : (
                <div className="listing-image-placeholder">
                  {getPlaceholderIcon(item.listingType)}
                </div>
              )}
              <div className="listing-info">
                <h3>{item.displayTitle}</h3>
                <div className="listing-details">
                  {item.listingType === 'livestock' ? (
                    <>
                      <span className="listing-type">{item.type}</span>
                      <span className="listing-age">{item.age} {item.ageUnit}</span>
                    </>
                  ) : (
                    <>
                      <span className="vehicle-type">{item.type}</span>
                      <span className="vehicle-capacity">Cap: {item.capacity}</span>
                    </>
                  )}
                </div>
                <p className="listing-price">{item.displayPriceText}</p>
                {item.location && (
                  <div className="listing-location">
                    <FaMapMarkerAlt size={12} /> {item.location}
                  </div>
                )}
                <div className="listing-footer">
                  <span className={`status-badge ${item.displayStatus === 'available' ? 'available' : 'sold'}`}>
                    {item.displayStatusText}
                  </span>
                  <span className="listing-date">{formatDate(item.displayDate)}</span>
                </div>
                <div className="listing-actions">
                  <Link to={`/${item.listingType === 'livestock' ? 'livestock' : 'vehicles'}/${item._id}`} className="action-btn view">
                    <FaEye /> View
                  </Link>
                  <Link to={`/seller/edit-${item.listingType}/${item._id}`} className="action-btn edit">
                    <FaEdit /> Edit
                  </Link>
                  <button onClick={() => handleDeleteClick(item, item.listingType)} className="action-btn delete">
                    <FaTrash /> Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {paginatedListings.length === 0 && (
          <div className="empty-state">
            {searchTerm || filterStatus !== 'all' ? (
              <>
                <FaSearch className="empty-icon" />
                <p>No listings match your filters.</p>
                <button onClick={() => {
                  setSearchTerm('');
                  setFilterStatus('all');
                  setSortBy('newest');
                }} className="clear-filters-btn">
                  Clear Filters
                </button>
              </>
            ) : canAddListings ? (
              <>
                <FaTractor className="empty-icon" />
                <p>You haven't created any listings yet.</p>
                <div className="empty-state-actions">
                  <Link to="/seller/add-livestock" className="empty-state-btn">
                    Add Livestock
                  </Link>
                  <Link to="/seller/add-vehicle" className="empty-state-btn secondary">
                    Add Vehicle
                  </Link>
                </div>
              </>
            ) : (
              <>
                <FaExclamationTriangle className="empty-icon" />
                <p>Complete verification to start listing items.</p>
                <Link to="/seller/verify" className="empty-state-btn">
                  Complete Verification
                </Link>
              </>
            )}
          </div>
        )}
        
        {/* Pagination */}
        {totalPages > 1 && (
          <div className="pagination">
            <button 
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="pagination-btn"
            >
              <FaChevronLeft />
            </button>
            <span className="page-info">
              Page {currentPage} of {totalPages}
            </span>
            <button 
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="pagination-btn"
            >
              <FaChevronRight />
            </button>
          </div>
        )}
      </div>
      
      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="modal-overlay" onClick={() => setShowDeleteModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Delete Listing</h3>
              <button className="modal-close" onClick={() => setShowDeleteModal(false)}>
                <FaTimes />
              </button>
            </div>
            <div className="modal-body">
              <FaExclamationTriangle className="modal-warning-icon" />
              <p>Are you sure you want to delete <strong>{itemToDelete?.displayTitle}</strong>?</p>
              <p className="modal-warning">This action cannot be undone.</p>
            </div>
            <div className="modal-footer">
              <button className="modal-btn cancel" onClick={() => setShowDeleteModal(false)}>
                Cancel
              </button>
              <button className="modal-btn confirm" onClick={handleDeleteConfirm} disabled={deleting}>
                {deleting ? 'Deleting...' : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SellerDashboard;