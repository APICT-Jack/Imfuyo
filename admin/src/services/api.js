import axios from 'axios';
import toast from 'react-hot-toast';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('admin_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('admin_token');
      window.location.href = '/login';
      toast.error('Session expired. Please login again.');
    }
    return Promise.reject(error);
  }
);

// Admin specific API calls
export const adminAPI = {
  // User Management
  getUsers: (params) => api.get('/admin/users', { params }),
  getUserDetails: (userId) => api.get(`/admin/users/${userId}`),
  verifyUser: (userId, data) => api.post(`/admin/users/${userId}/verify`, data),
  updateUserRole: (userId, role) => api.put(`/admin/users/${userId}/role`, { role }),
  suspendUser: (userId) => api.post(`/admin/users/${userId}/suspend`),
  activateUser: (userId) => api.post(`/admin/users/${userId}/activate`),
  
  // Listing Management
  getListings: (params) => api.get('/admin/listings', { params }),
  getListingDetails: (listingId) => api.get(`/admin/listings/${listingId}`),
  approveListing: (listingId) => api.post(`/admin/listings/${listingId}/approve`),
  rejectListing: (listingId, reason) => api.post(`/admin/listings/${listingId}/reject`, { reason }),
  deleteListing: (listingId) => api.delete(`/admin/listings/${listingId}`),
  featureListing: (listingId) => api.post(`/admin/listings/${listingId}/feature`),
  
  // System Metrics
  getSystemMetrics: () => api.get('/admin/metrics'),
  getDBStats: () => api.get('/admin/db-stats'),
  getLogs: (type, lines = 100) => api.get(`/admin/logs/${type}`, { params: { lines } }),
  
  // Dashboard Stats
  getDashboardStats: () => api.get('/admin/dashboard/stats'),
  getRecentActivities: () => api.get('/admin/dashboard/activities'),
};

export default api;