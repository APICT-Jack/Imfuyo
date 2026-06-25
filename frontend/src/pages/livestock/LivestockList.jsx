// LivestockList.jsx - Updated with environment variables and error handling
import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { 
  FaFilter, 
  FaTimes, 
  FaSlidersH, 
  FaSearch, 
  FaChevronDown,
  FaChevronUp,
  FaSort,
  FaSortAmountDown,
  FaSortAmountUp,
  FaThLarge,
  FaList,
  FaMapMarkerAlt,
  FaSpinner
} from 'react-icons/fa';
import { GiCow, GiChicken, GiGoat, GiSheep, GiPig } from 'react-icons/gi';
import LivestockCard from './LivestockCard';
import './LivestockList.css';

// API Base URL from environment variable
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const LivestockList = () => {
  const [livestock, setLivestock] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [showSort, setShowSort] = useState(false);
  const [viewMode, setViewMode] = useState('grid');
  const [filters, setFilters] = useState({
    type: '',
    minPrice: '',
    maxPrice: '',
    location: ''
  });
  const [sortBy, setSortBy] = useState('newest');
  const [searchQuery, setSearchQuery] = useState('');
  const [totalCount, setTotalCount] = useState(0);
  
  const filterPanelRef = useRef(null);
  const sortPanelRef = useRef(null);

  useEffect(() => {
    fetchLivestock();
  }, [filters, sortBy, searchQuery]);

  const fetchLivestock = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (filters.type) params.append('type', filters.type);
      if (filters.minPrice) params.append('minPrice', filters.minPrice);
      if (filters.maxPrice) params.append('maxPrice', filters.maxPrice);
      if (filters.location) params.append('location', filters.location);
      if (searchQuery) params.append('search', searchQuery);
      params.append('sort', sortBy);
      params.append('limit', '20');
      
      const response = await axios.get(`${API_BASE_URL}/livestock?${params}`);
      setLivestock(response.data.livestock || []);
      setTotalCount(response.data.total || response.data.livestock?.length || 0);
    } catch (error) {
      console.error('Error fetching livestock:', error);
      setError('Failed to load livestock listings. Please try again.');
      if (error.response?.status === 500) {
        setError('Server error. Please try again later.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const clearFilters = () => {
    setFilters({
      type: '',
      minPrice: '',
      maxPrice: '',
      location: ''
    });
    setSearchQuery('');
    setSortBy('newest');
  };

  const handleSearch = (e) => {
    e.preventDefault();
    // Search is already triggered by useEffect when searchQuery changes
  };

  const handleSearchInputChange = (e) => {
    setSearchQuery(e.target.value);
  };

  const clearSearch = () => {
    setSearchQuery('');
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

  const getSortLabel = () => {
    switch(sortBy) {
      case 'price_asc': return 'Price: Low to High';
      case 'price_desc': return 'Price: High to Low';
      case 'newest': return 'Newest First';
      case 'oldest': return 'Oldest First';
      default: return 'Sort By';
    }
  };

  const hasActiveFilters = filters.type || filters.minPrice || filters.maxPrice || filters.location || searchQuery;
  const totalActiveFilters = Object.values(filters).filter(f => f).length + (searchQuery ? 1 : 0);

  // Close panels when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (filterPanelRef.current && !filterPanelRef.current.contains(event.target) && showFilters) {
        setShowFilters(false);
      }
      if (sortPanelRef.current && !sortPanelRef.current.contains(event.target) && showSort) {
        setShowSort(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showFilters, showSort]);

  return (
    <div className="ll_page">
      {/* Hero Section */}
      <div className="ll_hero">
        <div className="ll_hero_content">
          <h1 className="ll_hero_title">Available Livestock</h1>
          <p className="ll_hero_subtitle">Find quality livestock from trusted sellers across South Africa</p>
          
          {/* Search Bar */}
          <form onSubmit={handleSearch} className="ll_search_bar">
            <FaSearch className="ll_search_icon" />
            <input 
              type="text" 
              placeholder="Search by breed, type, or location..." 
              value={searchQuery}
              onChange={handleSearchInputChange}
              className="ll_search_input"
            />
            {searchQuery && (
              <button type="button" className="ll_search_clear" onClick={clearSearch}>
                <FaTimes />
              </button>
            )}
            <button type="submit" className="ll_search_button">Search</button>
          </form>
        </div>
      </div>

      {/* Sticky Control Bar */}
      <div className="ll_control_bar">
        <div className="ll_control_content">
          <button 
            className={`ll_control_btn ${showFilters ? 'active' : ''}`} 
            onClick={() => setShowFilters(!showFilters)}
          >
            <FaSlidersH />
            <span>Filters</span>
            {hasActiveFilters && <span className="ll_badge">{totalActiveFilters}</span>}
          </button>
          
          <button 
            className={`ll_control_btn ${showSort ? 'active' : ''}`} 
            onClick={() => setShowSort(!showSort)}
          >
            <FaSort />
            <span>{getSortLabel()}</span>
            {showSort ? <FaChevronUp /> : <FaChevronDown />}
          </button>
          
          <div className="ll_view_toggle">
            <button 
              className={`ll_view_btn ${viewMode === 'grid' ? 'active' : ''}`}
              onClick={() => setViewMode('grid')}
              aria-label="Grid view"
            >
              <FaThLarge />
            </button>
            <button 
              className={`ll_view_btn ${viewMode === 'list' ? 'active' : ''}`}
              onClick={() => setViewMode('list')}
              aria-label="List view"
            >
              <FaList />
            </button>
          </div>
        </div>
      </div>

      {/* Sort Panel */}
      {showSort && (
        <div className="ll_sort_panel" ref={sortPanelRef}>
          <div className="ll_sort_header">
            <h3>Sort By</h3>
            <button onClick={() => setShowSort(false)} className="ll_sort_close">
              <FaTimes />
            </button>
          </div>
          <div className="ll_sort_options">
            <button 
              className={`ll_sort_option ${sortBy === 'newest' ? 'active' : ''}`}
              onClick={() => { setSortBy('newest'); setShowSort(false); }}
            >
              <FaSortAmountDown /> Newest First
            </button>
            <button 
              className={`ll_sort_option ${sortBy === 'oldest' ? 'active' : ''}`}
              onClick={() => { setSortBy('oldest'); setShowSort(false); }}
            >
              <FaSortAmountUp /> Oldest First
            </button>
            <button 
              className={`ll_sort_option ${sortBy === 'price_asc' ? 'active' : ''}`}
              onClick={() => { setSortBy('price_asc'); setShowSort(false); }}
            >
              <FaSortAmountDown /> Price: Low to High
            </button>
            <button 
              className={`ll_sort_option ${sortBy === 'price_desc' ? 'active' : ''}`}
              onClick={() => { setSortBy('price_desc'); setShowSort(false); }}
            >
              <FaSortAmountUp /> Price: High to Low
            </button>
          </div>
        </div>
      )}

      {/* Filter Panel */}
      {showFilters && (
        <div className="ll_filter_panel" ref={filterPanelRef}>
          <div className="ll_filter_header">
            <h3>Filter Livestock</h3>
            <button onClick={() => setShowFilters(false)} className="ll_filter_close">
              <FaTimes />
            </button>
          </div>
          
          <div className="ll_filter_content">
            {/* Type Filter */}
            <div className="ll_filter_group">
              <label className="ll_filter_label">Animal Type</label>
              <div className="ll_type_options">
                {['', 'cattle', 'sheep', 'goat', 'pig', 'chicken'].map((type) => (
                  <button
                    key={type || 'all'}
                    className={`ll_type_option ${filters.type === type ? 'active' : ''}`}
                    onClick={() => setFilters(prev => ({ ...prev, type }))}
                  >
                    {type ? getTypeIcon(type) : <GiCow />}
                    <span>{type ? type.charAt(0).toUpperCase() + type.slice(1) : 'All'}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Price Range */}
            <div className="ll_filter_group">
              <label className="ll_filter_label">Price Range (ZAR)</label>
              <div className="ll_price_range">
                <input 
                  type="number" 
                  name="minPrice" 
                  value={filters.minPrice}
                  placeholder="Min" 
                  onChange={handleFilterChange} 
                  className="ll_price_input"
                  min="0"
                />
                <span>to</span>
                <input 
                  type="number" 
                  name="maxPrice" 
                  value={filters.maxPrice}
                  placeholder="Max" 
                  onChange={handleFilterChange} 
                  className="ll_price_input"
                  min="0"
                />
              </div>
            </div>

            {/* Location */}
            <div className="ll_filter_group">
              <label className="ll_filter_label">Location</label>
              <div className="ll_location_input_wrapper">
                <FaMapMarkerAlt className="ll_location_icon" />
                <input 
                  type="text" 
                  name="location" 
                  value={filters.location}
                  placeholder="City or Province" 
                  onChange={handleFilterChange} 
                  className="ll_location_input"
                />
              </div>
            </div>
          </div>

          <div className="ll_filter_actions">
            {hasActiveFilters && (
              <button onClick={clearFilters} className="ll_clear_btn">
                Clear All
              </button>
            )}
            <button onClick={() => setShowFilters(false)} className="ll_apply_btn">
              Apply Filters
            </button>
          </div>
        </div>
      )}

      {/* Results Count */}
      <div className="ll_results_header">
        <div className="ll_results_count">
          <span className="ll_count_number">{totalCount}</span>
          <span className="ll_count_text">{totalCount === 1 ? 'Listing' : 'Listings'} Found</span>
        </div>
        {hasActiveFilters && (
          <button onClick={clearFilters} className="ll_clear_all_btn">
            <FaTimes /> Clear All Filters
          </button>
        )}
      </div>

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div className="ll_active_filters">
          {filters.type && (
            <span className="ll_active_filter">
              {getTypeIcon(filters.type)} {filters.type}
              <button onClick={() => setFilters(prev => ({ ...prev, type: '' }))}>×</button>
            </span>
          )}
          {(filters.minPrice || filters.maxPrice) && (
            <span className="ll_active_filter">
              R{filters.minPrice || '0'} - R{filters.maxPrice || '∞'}
              <button onClick={() => setFilters(prev => ({ ...prev, minPrice: '', maxPrice: '' }))}>×</button>
            </span>
          )}
          {filters.location && (
            <span className="ll_active_filter">
              <FaMapMarkerAlt /> {filters.location}
              <button onClick={() => setFilters(prev => ({ ...prev, location: '' }))}>×</button>
            </span>
          )}
          {searchQuery && (
            <span className="ll_active_filter">
              Search: "{searchQuery}"
              <button onClick={clearSearch}>×</button>
            </span>
          )}
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="ll_error_container">
          <div className="ll_error_icon">⚠️</div>
          <p className="ll_error_message">{error}</p>
          <button onClick={fetchLivestock} className="ll_retry_btn">
            Try Again
          </button>
        </div>
      )}

      {/* Livestock Grid/List - Using the same LivestockCard component */}
      {!error && loading ? (
        <div className="ll_loading_grid">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="ll_loading_card">
              <div className="ll_loading_image"></div>
              <div className="ll_loading_content">
                <div className="ll_loading_title"></div>
                <div className="ll_loading_price"></div>
                <div className="ll_loading_location"></div>
              </div>
            </div>
          ))}
        </div>
      ) : !error && livestock.length > 0 ? (
        <div className={`ll_results ${viewMode === 'grid' ? 'll_grid_view' : 'll_list_view'}`}>
          {livestock.map((item) => (
            <LivestockCard key={item._id} livestock={item} />
          ))}
        </div>
      ) : !error && livestock.length === 0 && !loading ? (
        <div className="ll_empty_state">
          <div className="ll_empty_icon">🐮</div>
          <h3 className="ll_empty_title">No Livestock Found</h3>
          <p className="ll_empty_message">Try adjusting your filters or check back later for new listings</p>
          <button onClick={clearFilters} className="ll_empty_button">
            Clear All Filters
          </button>
        </div>
      ) : null}
    </div>
  );
};

export default LivestockList;