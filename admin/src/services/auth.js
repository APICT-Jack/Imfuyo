import api from './api';

export const authService = {
  login: async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    if (response.data.token) {
      localStorage.setItem('admin_token', response.data.token);
      api.defaults.headers.common['Authorization'] = `Bearer ${response.data.token}`;
    }
    return response.data;
  },

  logout: () => {
    localStorage.removeItem('admin_token');
    delete api.defaults.headers.common['Authorization'];
  },

  getCurrentUser: async () => {
    const response = await api.get('/auth/profile');
    return response.data;
  },

  isAuthenticated: () => {
    return !!localStorage.getItem('admin_token');
  },
};