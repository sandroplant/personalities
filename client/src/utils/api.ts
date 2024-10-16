import axios, { AxiosInstance } from 'axios';

const API_URL = process.env.REACT_APP_SERVER_URL || 'http://localhost:80';

const api: AxiosInstance = axios.create({
  baseURL: API_URL,
  withCredentials: true, // Ensures cookies are sent with requests
});

export default api;
