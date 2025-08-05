import api, { handleApiError } from '@/lib/api';

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar?: string;
  createdAt: string;
  updatedAt: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData extends LoginCredentials {
  name: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export const login = async (credentials: LoginCredentials): Promise<AuthResponse> => {
  try {
    const response = await api.post<AuthResponse>('/auth/login', credentials);
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

export const register = async (userData: RegisterData): Promise<AuthResponse> => {
  try {
    const response = await api.post<AuthResponse>('/auth/register', userData);
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

export const getCurrentUser = async (): Promise<User> => {
  try {
    const response = await api.get<User>('/auth/me');
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

export const logout = async (): Promise<void> => {
  try {
    await api.post('/auth/logout');
  } catch (error) {
    // Even if the logout API call fails, we want to clear the token
    console.error('Logout failed:', error);
  } finally {
    // Always clear the token from local storage
    localStorage.removeItem('token');
  }
};

export const refreshToken = async (): Promise<{ token: string }> => {
  try {
    const response = await api.post<{ token: string }>('/auth/refresh-token');
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};
