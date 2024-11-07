// src/services/api.ts

import axios, { AxiosInstance } from 'axios';

const API_BASE_URL =
  process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000/api';

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
  (error) => Promise.reject(error)
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
  }
);

export default api;
