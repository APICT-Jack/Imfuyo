import React, { useState, useEffect } from 'react';
import { adminAPI } from '../services/api';
import LoadingSpinner from '../components/Common/LoadingSpinner';
import toast from 'react-hot-toast';
import './ListingsPage.css';

const ListingsPage = () => {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchListings();
  }, []);

  const fetchListings = async () => {
    try {
      const response = await adminAPI.getListings();
      setListings(response.data.listings);
    } catch (error) {
      toast.error('Failed to fetch listings');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this listing?')) {
      try {
        await adminAPI.deleteListing(id);
        toast.success('Listing deleted successfully');
        fetchListings();
      } catch (error) {
        toast.error('Failed to delete listing');
      }
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="listings-page fade-in">
      <div className="page-header">
        <h1>Listings Management</h1>
        <p>Manage all livestock and vehicle listings</p>
      </div>

      <div className="listings-grid">
        {listings.map(listing => (
          <div key={listing._id} className="listing-card">
            <h3>{listing.title || listing.type}</h3>
            <p><strong>Seller:</strong> {listing.seller?.name || 'Unknown'}</p>
            <p><strong>Price:</strong> ${listing.price}</p>
            <p><strong>Status:</strong> {listing.status || 'Active'}</p>
            <div className="listing-actions">
              <button className="btn-view">View</button>
              <button className="btn-delete" onClick={() => handleDelete(listing._id)}>Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ListingsPage;