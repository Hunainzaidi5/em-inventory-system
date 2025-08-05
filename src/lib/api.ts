import axios, { AxiosInstance, AxiosResponse, AxiosError } from 'axios';

// If you still need to call a backend API for non-auth reasons, set the base URL here:
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export default api;
