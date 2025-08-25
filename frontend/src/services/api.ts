import axios, { AxiosInstance } from 'axios';

// Base URL for the API. If REACT_APP_API_BASE_URL is provided in the
// environment, it will be used; otherwise default to the Django backend
// running at http://localhost:8000 (without the /api prefix). This ensures
// that requests to endpoints like /questions/ will map correctly when the
// questions app is mounted at the project root.
const API_BASE_URL: string =
  process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000';

const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // Ensures cookies are sent with requests (useful for authentication)
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token to headers if needed
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// Response interceptor to handle global errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized access, e.g., redirect to login
      window.location.href = '/login';
    }
    return Promise.reject(error);
  },
);

export default api;