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
  setUser?: (user: User | null) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const DEV_EMAIL = 'syedhunainalizaidi@gmail.com';
  const DEV_USER = {
    id: 'dev-hardcoded',
    name: 'Syed Hunain Ali',
    email: DEV_EMAIL,
    role: 'dev',
    department: 'E&M SYSTEMS',
    employee_id: 'DEV001',
    is_active: true,
    created_at: new Date().toISOString(),
    avatar: undefined,
  };

  // Load user data on initial render
  const loadUser = useCallback(async () => {
    try {
      console.log('[DEBUG] Loading user...');
      setIsLoading(true);
        const userData = await authService.getCurrentUser();
      console.log('[DEBUG] User loaded:', userData);
        setUser(userData);
    } catch (error) {
      console.error('Failed to load user:', error);
      setUser(null);
    } finally {
      console.log('[DEBUG] Finished loading user, setting isLoading to false');
      setIsLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    const checkAuth = async () => {
      try {
        setIsLoading(true);
        // Check for hardcoded developer first
        if (localStorage.getItem('devUser') === 'true') {
          setUser(DEV_USER);
          setIsLoading(false);
          return;
        }
        // Then check Supabase session
        const userData = await authService.getCurrentUser();
        setUser(userData);
      } catch (error) {
        console.error('Failed to load user:', error);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };
    checkAuth();
  }, []);

  // Handle developer login state changes
  useEffect(() => {
    const handleStorageChange = () => {
      if (localStorage.getItem('devUser') === 'true' && !user) {
        setUser(DEV_USER);
      } else if (localStorage.getItem('devUser') !== 'true' && user?.id === 'dev-hardcoded') {
        setUser(null);
      }
    };

    // Check on mount
    handleStorageChange();

    // Listen for storage changes
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [user]);

  // Set up auth state change listener (only for Supabase users)
  useEffect(() => {
    // Only set up listener if not using hardcoded developer
    if (localStorage.getItem('devUser') === 'true') {
      return;
    }
    
    const { data: { subscription } } = authService.onAuthStateChange(async (user) => {
      if (user) {
        setUser(user);
      } else {
        setUser(null);
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
      const result = await authService.register(data);
      if (result.success) {
      return { success: true };
      } else {
        setError(result.error || 'Registration failed');
        return { success: false, error: result.error };
      }
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
      // Clear developer flag on logout
      localStorage.removeItem('devUser');
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
    setUser,
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
