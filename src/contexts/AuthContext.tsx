import { createContext, useContext, ReactNode, useState, useEffect, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import * as authService from '@/services/authService';
import { supabase } from '@/lib/supabase';
import { env } from '@/config/env';
import { User, LoginCredentials, RegisterData, UserRole, AuthenticationError } from '@/types/auth';

interface AuthContextType {
  user: User | null;
  login: (credentials: LoginCredentials) => Promise<{ success: boolean; error?: string }>;
  register: (data: RegisterData) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  updateProfile: (updates: Partial<User>) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  refreshUser: () => Promise<User | null>;
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
  const DEV_USER: User = {
    id: 'dev-hardcoded',
    name: 'Syed Hunain Ali',
    email: DEV_EMAIL,
    role: 'dev' as UserRole,
    department: 'E&M SYSTEMS',
    employee_id: 'DEV001',
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    avatar: undefined,
  };

  // Single source of truth for loading user data
  const loadUser = useCallback(async () => {
    try {
      console.log('[AUTH] Loading user data...');
      setIsLoading(true);
      
      // Check for hardcoded developer first (feature flag or localStorage)
      if (env.VITE_FORCE_DEV_USER || localStorage.getItem('devUser') === 'true') {
        console.log('[AUTH] Using hardcoded developer user');
        setUser(DEV_USER);
        return DEV_USER;
      }
      
      // Check for existing session
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        console.log('[AUTH] Session found, fetching user data');
        const userData = await authService.getCurrentUser();
        setUser(userData);
        return userData;
      }
      
      console.log('[AUTH] No active session found');
      setUser(null);
      return null;
    } catch (error) {
      console.error('[AUTH] Failed to load user:', error);
      setUser(null);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Refresh user data
  const refreshUser = useCallback(async () => {
    console.log('[AUTH] Refreshing user data...');
    return loadUser();
  }, [loadUser]);

  // Initial load and auth state changes
  useEffect(() => {
    let mounted = true;
    let unsubscribe: (() => void) | null = null;

    const initializeAuth = async () => {
      // Initial load
      await loadUser();

      // Only set up auth state listener if not using hardcoded developer
      if (localStorage.getItem('devUser') !== 'true') {
        console.log('[AUTH] Setting up auth state listener');
        
        const handleAuthChange = async (event: string, session: any) => {
          console.log(`[AUTH] Auth state changed: ${event}`);
          
          if (!mounted) return;
          
          if (event === 'SIGNED_IN' && session) {
            try {
              const userData = await authService.getCurrentUser();
              console.log('[AUTH] User signed in:', userData?.email);
              setUser(userData);
              queryClient.clear();
            } catch (error) {
              console.error('[AUTH] Failed to get user after sign in:', error);
              setUser(null);
            }
          } else if (event === 'SIGNED_OUT') {
            console.log('[AUTH] User signed out');
            setUser(null);
            queryClient.clear();
          } else if (event === 'USER_UPDATED') {
            try {
              const userData = await authService.getCurrentUser();
              console.log('[AUTH] User updated:', userData?.email);
              setUser(userData);
            } catch (error) {
              console.error('[AUTH] Failed to get updated user:', error);
            }
          }
        };

        // Set up auth state change listener using authService
        const { data } = authService.onAuthStateChange(handleAuthChange);
        unsubscribe = () => {
          console.log('[AUTH] Unsubscribing from auth state changes');
          if (data?.subscription) {
            data.subscription.unsubscribe();
          }
        };
      }
    };

    initializeAuth();

    return () => {
      mounted = false;
      if (unsubscribe) {
        console.log('[AUTH] Cleaning up auth state listener');
        unsubscribe();
      }
    };
  }, [loadUser, queryClient]);

  // Handle developer login state changes
  useEffect(() => {
    if (localStorage.getItem('devUser') === 'true' && !user) {
      console.log('[AUTH] Developer mode enabled');
      setUser(DEV_USER);
    } else if (localStorage.getItem('devUser') !== 'true' && user?.id === 'dev-hardcoded') {
      console.log('[AUTH] Developer mode disabled');
      setUser(null);
    }
  }, [user]);

  const login = async (credentials: LoginCredentials) => {
    console.log('[AUTH_CONTEXT] Login initiated for:', credentials.email);
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('[AUTH_CONTEXT] Calling authService.login');
      const response = await authService.login(credentials);
      console.log('[AUTH_CONTEXT] authService.login response:', {
        hasUser: !!response?.user,
        hasSession: !!response?.session,
        userId: response?.user?.id
      });
      
      if (response?.user) {
        console.log('[AUTH_CONTEXT] Login successful, setting user');
        setUser(response.user);
        
        // Clear any cached queries
        queryClient.clear();
        
        // Store session info if available
        if (response.session) {
          console.log('[AUTH_CONTEXT] Storing session data');
          localStorage.setItem('auth_session', JSON.stringify({
            access_token: response.session.access_token,
            refresh_token: response.session.refresh_token,
            expires_at: response.session.expires_at
          }));
        }
        
        return { success: true };
      } else {
        const errorMsg = 'Login failed: No user data received';
        console.error('[AUTH_CONTEXT]', errorMsg);
        throw new Error(errorMsg);
      }
    } catch (error) {
      // Handle our custom AuthenticationError
      if (error instanceof AuthenticationError) {
        console.error('[AUTH_CONTEXT] Authentication error:', {
          message: error.message,
          code: error.code,
          details: error.details
        });
        setError(error.message);
        return { success: false, error: error.message };
      }
      
      // Handle other errors
      const message = error instanceof Error ? error.message : 'Login failed';
      console.error('[AUTH_CONTEXT] Unexpected login error:', { error, message });
      setError(message);
      return { success: false, error: message };
    } finally {
      console.log('[AUTH_CONTEXT] Login process completed');
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
    refreshUser,
    isAuthenticated: !!user,
    isLoading,
    error,
    setUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
