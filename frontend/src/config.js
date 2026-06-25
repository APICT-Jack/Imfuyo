// src/config.js
const config = {
  // API URL from environment variable with fallback
  apiUrl: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
  wsUrl: process.env.REACT_APP_WS_URL || 'ws://localhost:5000',
  isProduction: process.env.NODE_ENV === 'production',
  siteName: 'Imfuyo',
  // Add other configuration as needed
};

export default config;