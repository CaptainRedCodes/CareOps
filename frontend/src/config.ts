// Centralized frontend configuration

export const config = {
  // API Base URL
  apiUrl: import.meta.env.VITE_API_URL || "http://localhost:8000",
  
  // Frontend URL (used for public links)
  frontendUrl: import.meta.env.VITE_FRONTEND_URL || 
    (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5173'),
};

export default config;
