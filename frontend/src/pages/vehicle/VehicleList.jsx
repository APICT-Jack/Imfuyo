// VehicleList.jsx - Complete Mobile-First Redesign
import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { 
  FaSlidersH, 
  FaTimes, 
  FaTruck, 
  FaSearch, 
  FaChevronDown,
  FaChevronUp,
  FaSort,
  FaSortAmountDown,
  FaSortAmountUp,
  FaThLarge,
  FaList,
  FaMapMarkerAlt
} from 'react-icons/fa';
import VehicleCard from './VehicleCard';
import './VehicleList.css';

const VehicleList = () => {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [showSort, setShowSort] = useState(false);
  const [viewMode, setViewMode] = useState('grid');
  const [filters, setFilters] = useState({
    type: '',
    minPrice: '',
    maxPrice: '',
    location: '',
    available: ''
  });
  const [sortBy, setSortBy] = useState('newest');
  const [searchQuery, setSearchQuery] = useState('');
  
  const filterPanelRef = useRef(null);
  const sortPanelRef = useRef(null);

  useEffect(() => {
    fetchVehicles();
  }, [filters, sortBy]);

  const fetchVehicles = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.type) params.append('type', filters.type);
      if (filters.minPrice) params.append('minPrice', filters.minPrice);
      if (filters.maxPrice) params.append('maxPrice', filters.maxPrice);
      if (filters.location) params.append('location', filters.location);
      if (filters.available) params.append('available', filters.available);
      if (searchQuery) params.append('search', searchQuery);
      params.append('sort', sortBy);
      params.append('limit', '20');
      
      const response = await axios.get(`http://localhost:5000/api/vehicles?${params}`);
      setVehicles(response.data.vehicles || []);
    } catch (error) {
      console.error('Error fetching vehicles:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    setFilters({
      ...filters,
      [e.target.name]: e.target.value
    });
  };

  const clearFilters = () => {
    setFilters({
      type: '',
      minPrice: '',
      maxPrice: '',
      location: '',
      available: ''
    });
    setSearchQuery('');
    setSortBy('newest');
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchVehicles();
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

  const hasActiveFilters = filters.type || filters.minPrice || filters.maxPrice || filters.location || filters.available || searchQuery;
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

  // Vehicle type options for filters
  const vehicleTypes = [
    { value: '', label: 'All Types', icon: '🚚' },
    { value: 'truck', label: 'Truck', icon: '🚚' },
    { value: 'trailer', label: 'Trailer', icon: '🚛' },
    { value: 'van', label: 'Van', icon: '🚐' },
    { value: 'pickup', label: 'Pickup', icon: '🛻' },
    { value: 'other', label: 'Other', icon: '🚛' }
  ];

  return (
    <div className="vl_page">
      {/* Hero Section */}
      <div className="vl_hero">
        <div className="vl_hero_content">
          <h1 className="vl_hero_title">Transport Vehicles for Rent</h1>
          <p className="vl_hero_subtitle">Find reliable livestock transport vehicles from trusted owners across South Africa</p>
          
          {/* Search Bar */}
          <form onSubmit={handleSearch} className="vl_search_bar">
            <FaSearch className="vl_search_icon" />
            <input 
              type="text" 
              placeholder="Search by model, type, or location..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="vl_search_input"
            />
            {searchQuery && (
              <button type="button" className="vl_search_clear" onClick={() => setSearchQuery('')}>
                <FaTimes />
              </button>
            )}
            <button type="submit" className="vl_search_button">Search</button>
          </form>
        </div>
      </div>

      {/* Sticky Control Bar */}
      <div className="vl_control_bar">
        <div className="vl_control_content">
          <button 
            className={`vl_control_btn ${showFilters ? 'active' : ''}`} 
            onClick={() => setShowFilters(!showFilters)}
          >
            <FaSlidersH />
            <span>Filters</span>
            {hasActiveFilters && <span className="vl_badge">{totalActiveFilters}</span>}
          </button>
          
          <button 
            className={`vl_control_btn ${showSort ? 'active' : ''}`} 
            onClick={() => setShowSort(!showSort)}
          >
            <FaSort />
            <span>{getSortLabel()}</span>
            {showSort ? <FaChevronUp /> : <FaChevronDown />}
          </button>
          
          <div className="vl_view_toggle">
            <button 
              className={`vl_view_btn ${viewMode === 'grid' ? 'active' : ''}`}
              onClick={() => setViewMode('grid')}
              aria-label="Grid view"
            >
              <FaThLarge />
            </button>
            <button 
              className={`vl_view_btn ${viewMode === 'list' ? 'active' : ''}`}
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
        <div className="vl_sort_panel" ref={sortPanelRef}>
          <div className="vl_sort_header">
            <h3>Sort By</h3>
            <button onClick={() => setShowSort(false)} className="vl_sort_close">
              <FaTimes />
            </button>
          </div>
          <div className="vl_sort_options">
            <button 
              className={`vl_sort_option ${sortBy === 'newest' ? 'active' : ''}`}
              onClick={() => { setSortBy('newest'); setShowSort(false); }}
            >
              <FaSortAmountDown /> Newest First
            </button>
            <button 
              className={`vl_sort_option ${sortBy === 'oldest' ? 'active' : ''}`}
              onClick={() => { setSortBy('oldest'); setShowSort(false); }}
            >
              <FaSortAmountUp /> Oldest First
            </button>
            <button 
              className={`vl_sort_option ${sortBy === 'price_asc' ? 'active' : ''}`}
              onClick={() => { setSortBy('price_asc'); setShowSort(false); }}
            >
              <FaSortAmountDown /> Price: Low to High
            </button>
            <button 
              className={`vl_sort_option ${sortBy === 'price_desc' ? 'active' : ''}`}
              onClick={() => { setSortBy('price_desc'); setShowSort(false); }}
            >
              <FaSortAmountUp /> Price: High to Low
            </button>
          </div>
        </div>
      )}

      {/* Filter Panel */}
      {showFilters && (
        <div className="vl_filter_panel" ref={filterPanelRef}>
          <div className="vl_filter_header">
            <h3>Filter Vehicles</h3>
            <button onClick={() => setShowFilters(false)} className="vl_filter_close">
              <FaTimes />
            </button>
          </div>
          
          <div className="vl_filter_content">
            {/* Type Filter */}
            <div className="vl_filter_group">
              <label className="vl_filter_label">Vehicle Type</label>
              <div className="vl_type_options">
                {vehicleTypes.map((type) => (
                  <button
                    key={type.value || 'all'}
                    className={`vl_type_option ${filters.type === type.value ? 'active' : ''}`}
                    onClick={() => setFilters({ ...filters, type: type.value })}
                  >
                    <span className="vl_type_icon">{type.icon}</span>
                    <span>{type.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Availability Filter */}
            <div className="vl_filter_group">
              <label className="vl_filter_label">Availability</label>
              <div className="vl_availability_options">
                <button
                  className={`vl_availability_option ${filters.available === '' ? 'active' : ''}`}
                  onClick={() => setFilters({ ...filters, available: '' })}
                >
                  All
                </button>
                <button
                  className={`vl_availability_option ${filters.available === 'true' ? 'active' : ''}`}
                  onClick={() => setFilters({ ...filters, available: 'true' })}
                >
                  ✅ Available Only
                </button>
                <button
                  className={`vl_availability_option ${filters.available === 'false' ? 'active' : ''}`}
                  onClick={() => setFilters({ ...filters, available: 'false' })}
                >
                  ⏳ On Duty Only
                </button>
              </div>
            </div>

            {/* Price Range */}
            <div className="vl_filter_group">
              <label className="vl_filter_label">Price per Day (ZAR)</label>
              <div className="vl_price_range">
                <input 
                  type="number" 
                  name="minPrice" 
                  value={filters.minPrice}
                  placeholder="Min" 
                  onChange={handleFilterChange} 
                  className="vl_price_input"
                />
                <span>to</span>
                <input 
                  type="number" 
                  name="maxPrice" 
                  value={filters.maxPrice}
                  placeholder="Max" 
                  onChange={handleFilterChange} 
                  className="vl_price_input"
                />
              </div>
            </div>

            {/* Location */}
            <div className="vl_filter_group">
              <label className="vl_filter_label">Location</label>
              <div className="vl_location_input_wrapper">
                <FaMapMarkerAlt className="vl_location_icon" />
                <input 
                  type="text" 
                  name="location" 
                  value={filters.location}
                  placeholder="City or Province" 
                  onChange={handleFilterChange} 
                  className="vl_location_input"
                />
              </div>
            </div>
          </div>

          <div className="vl_filter_actions">
            {hasActiveFilters && (
              <button onClick={clearFilters} className="vl_clear_btn">
                Clear All
              </button>
            )}
            <button onClick={() => setShowFilters(false)} className="vl_apply_btn">
              Apply Filters
            </button>
          </div>
        </div>
      )}

      {/* Results Count */}
      <div className="vl_results_header">
        <div className="vl_results_count">
          <span className="vl_count_number">{vehicles.length}</span>
          <span className="vl_count_text">{vehicles.length === 1 ? 'Vehicle' : 'Vehicles'} Found</span>
        </div>
        {hasActiveFilters && (
          <button onClick={clearFilters} className="vl_clear_all_btn">
            <FaTimes /> Clear All Filters
          </button>
        )}
      </div>

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div className="vl_active_filters">
          {filters.type && (
            <span className="vl_active_filter">
              {vehicleTypes.find(t => t.value === filters.type)?.icon} {vehicleTypes.find(t => t.value === filters.type)?.label}
              <button onClick={() => setFilters({ ...filters, type: '' })}>×</button>
            </span>
          )}
          {filters.available === 'true' && (
            <span className="vl_active_filter">
              ✅ Available Only
              <button onClick={() => setFilters({ ...filters, available: '' })}>×</button>
            </span>
          )}
          {filters.available === 'false' && (
            <span className="vl_active_filter">
              ⏳ On Duty Only
              <button onClick={() => setFilters({ ...filters, available: '' })}>×</button>
            </span>
          )}
          {(filters.minPrice || filters.maxPrice) && (
            <span className="vl_active_filter">
              R{filters.minPrice || '0'} - R{filters.maxPrice || '∞'}
              <button onClick={() => setFilters({ ...filters, minPrice: '', maxPrice: '' })}>×</button>
            </span>
          )}
          {filters.location && (
            <span className="vl_active_filter">
              <FaMapMarkerAlt /> {filters.location}
              <button onClick={() => setFilters({ ...filters, location: '' })}>×</button>
            </span>
          )}
          {searchQuery && (
            <span className="vl_active_filter">
              Search: "{searchQuery}"
              <button onClick={() => setSearchQuery('')}>×</button>
            </span>
          )}
        </div>
      )}

      {/* Vehicles Grid/List - Using VehicleCard component */}
      {loading ? (
        <div className="vl_loading_grid">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="vl_loading_card">
              <div className="vl_loading_image"></div>
              <div className="vl_loading_content">
                <div className="vl_loading_title"></div>
                <div className="vl_loading_price"></div>
                <div className="vl_loading_location"></div>
              </div>
            </div>
          ))}
        </div>
      ) : vehicles.length > 0 ? (
        <div className={`vl_results ${viewMode === 'grid' ? 'vl_grid_view' : 'vl_list_view'}`}>
          {vehicles.map((vehicle) => (
            <VehicleCard key={vehicle._id} vehicle={vehicle} />
          ))}
        </div>
      ) : (
        <div className="vl_empty_state">
          <div className="vl_empty_icon">🚛</div>
          <h3 className="vl_empty_title">No Vehicles Found</h3>
          <p className="vl_empty_message">Try adjusting your filters or check back later for new vehicle listings</p>
          <button onClick={clearFilters} className="vl_empty_button">
            Clear All Filters
          </button>
        </div>
      )}
    </div>
  );
};

export default VehicleList;