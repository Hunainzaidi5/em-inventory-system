import { createContext, useContext, ReactNode, useState, useEffect, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import * as authService from '@/services/authService';
import { User, LoginCredentials, RegisterData } from '@/types/auth';

interface AuthContextType {
  user: User | null;
  login: (credentials: LoginCredentials) => Promise<{ success: boolean; error?: string }>;
  register: (data: RegisterData) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  updateProfile: (updates: Partial<User>) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const queryClient = useQueryClient();

  // Load user data on initial render
  const loadUser = useCallback(async () => {
    try {
      setIsLoading(true);
      const userData = await authService.getCurrentUser();
      setUser(userData);
    } catch (error) {
      console.error('Failed to load user:', error);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    loadUser();
  }, [loadUser]);

  // Set up auth state change listener
  useEffect(() => {
    const { data: { subscription } } = authService.onAuthStateChange(async (user) => {
      setUser(user);
      
      // Clear queries when user logs out
      if (!user) {
        queryClient.clear();
      }
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, [queryClient]);

  const login = async (credentials: LoginCredentials) => {
    setIsLoading(true);
    setError(null);
    try {
      const { user } = await authService.login(credentials);
      setUser(user);
      queryClient.clear();
      return { success: true };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Login failed';
      setError(message);
      return { success: false, error: message };
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (data: RegisterData) => {
    setIsLoading(true);
    setError(null);
    try {
      const { user } = await authService.register(data);
      setUser(user);
      queryClient.clear();
      return { success: true };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Registration failed';
      setError(message);
      return { success: false, error: message };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      setIsLoading(true);
      await authService.logout();
      setUser(null);
      queryClient.clear();
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const updateProfile = async (updates: Partial<User>) => {
    if (!user) return;
    
    try {
      setIsLoading(true);
      const updatedUser = await authService.updateProfile(updates);
      setUser(updatedUser);
    } catch (error) {
      console.error('Update profile error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const resetPassword = async (email: string) => {
    try {
      setIsLoading(true);
      await authService.resetPassword(email);
    } catch (error) {
      console.error('Reset password error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const value = {
    user,
    login,
    register,
    logout,
    updateProfile,
    resetPassword,
    isAuthenticated: !!user,
    isLoading,
    error,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
