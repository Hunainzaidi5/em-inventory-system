import axios, { AxiosInstance, AxiosResponse, AxiosError, InternalAxiosRequestConfig, AxiosHeaders } from 'axios';

// Define the shape of import.meta.env to include Vite environment variables
declare global {
  interface ImportMeta {
    env: {
      VITE_API_BASE_URL?: string;
    };
  }
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token to requests
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('token');
    if (token) {
      // Create new headers object if it doesn't exist
      if (!config.headers) {
        config.headers = new AxiosHeaders();
      }
      // Use the set method to ensure type safety
      (config.headers as AxiosHeaders).set('Authorization', `Bearer ${token}`);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle common errors
api.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      // Handle unauthorized access
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export interface ApiError {
  message: string;
  status?: number;
  errors?: Record<string, string[]>;
}

export const handleApiError = (error: unknown): ApiError => {
  const axiosError = error as AxiosError<{ message?: string; errors?: Record<string, string[]> }>;
  
  if (axiosError.response) {
    return {
      message: axiosError.response.data?.message || 'An error occurred',
      status: axiosError.response.status,
      errors: axiosError.response.data?.errors,
    };
  }

  if (axiosError.request) {
    return {
      message: 'No response received from server',
    };
  }

  return {
    message: axiosError.message || 'An unexpected error occurred',
  };
};

export default api;
