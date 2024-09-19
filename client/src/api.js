import axios from 'axios';

const API_URL = process.env.REACT_APP_SERVER_URL || 'http://localhost:5001';

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true, // Ensures cookies are sent with requests
});

export default api;
