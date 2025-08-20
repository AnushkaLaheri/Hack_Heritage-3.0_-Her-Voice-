// API Configuration
export const API_CONFIG = {
  // Base URL for API requests - automatically switches based on environment
  BASE_URL: process.env.REACT_APP_API_URL || 'http://localhost:5000',
  
  // Environment detection
  IS_DEVELOPMENT: process.env.NODE_ENV === 'development',
  IS_PRODUCTION: process.env.NODE_ENV === 'production',
  
  // Helper function to get full API URL
  getApiUrl: (endpoint: string) => {
    const baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
    return `${baseUrl}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
  },
  
  // Helper function to get full image URL
  getImageUrl: (imagePath: string) => {
    const baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
    const cleanPath = imagePath.startsWith('/') ? imagePath.substring(1) : imagePath;
    return `${baseUrl}/${cleanPath}`;
  }
};

export default API_CONFIG;