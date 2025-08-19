import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { FirebaseAuthService } from '@/lib/firebaseAuth';
import { env } from '@/config/env';

interface AuthStatus {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: any;
  session: any;
  error: string | null;
  envStatus: {
    firebaseApiKey: boolean;
    firebaseAuthDomain: boolean;
    firebaseProjectId: boolean;
  };
  storageStatus: {
    hasAccessToken: boolean;
    hasRefreshToken: boolean;
    hasSession: boolean;
  };
}

export const AuthStatusChecker: React.FC = () => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [status, setStatus] = useState<AuthStatus>({
    isAuthenticated: false,
    isLoading: true,
    user: null,
    session: null,
    error: null,
    envStatus: {
      firebaseApiKey: false,
      firebaseAuthDomain: false,
      firebaseProjectId: false,
    },
    storageStatus: {
      hasAccessToken: false,
      hasRefreshToken: false,
      hasSession: false,
    },
  });

  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        // Check session
        const currentUser = FirebaseAuthService.getCurrentUser();
        
        // Check environment variables
        const envStatus = {
          firebaseApiKey: !!env.VITE_FIREBASE_API_KEY,
          firebaseAuthDomain: !!env.VITE_FIREBASE_AUTH_DOMAIN,
          firebaseProjectId: !!env.VITE_FIREBASE_PROJECT_ID,
        };

        // Check storage
        const storageStatus = {
          hasAccessToken: !!localStorage.getItem('firebase_auth_token'),
          hasRefreshToken: !!localStorage.getItem('firebase_refresh_token'),
          hasSession: !!currentUser,
        };

        setStatus({
          isAuthenticated,
          isLoading,
          user,
          session: currentUser,
          error: null,
          envStatus,
          storageStatus,
        });
      } catch (error) {
        setStatus(prev => ({
          ...prev,
          error: error instanceof Error ? error.message : 'Unknown error',
        }));
      }
    };

    checkAuthStatus();
    
    // Set up interval to check status every 5 seconds
    const interval = setInterval(checkAuthStatus, 5000);
    
    return () => clearInterval(interval);
  }, [isAuthenticated, isLoading, user]);

  const getStatusColor = (condition: boolean) => {
    return condition ? 'text-green-500' : 'text-red-500';
  };

  const getStatusIcon = (condition: boolean) => {
    return condition ? '✅' : '❌';
  };

  return (
    <div className="bg-white border border-gray-300 rounded-lg shadow-lg p-4 max-w-md">
      <h3 className="font-bold text-lg mb-4 text-gray-800">Authentication Status</h3>
      
      <div className="space-y-3 text-sm">
        {/* Auth State */}
        <div className="border-b pb-2">
          <h4 className="font-semibold text-gray-700 mb-2">Auth State</h4>
          <div className="space-y-1">
            <div className="flex justify-between">
              <span>Loading:</span>
              <span className={getStatusColor(!status.isLoading)}>
                {getStatusIcon(!status.isLoading)} {status.isLoading ? 'Yes' : 'No'}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Authenticated:</span>
              <span className={getStatusColor(status.isAuthenticated)}>
                {getStatusIcon(status.isAuthenticated)} {status.isAuthenticated ? 'Yes' : 'No'}
              </span>
            </div>
            <div className="flex justify-between">
              <span>User ID:</span>
              <span className="text-gray-600">{status.user?.id || 'None'}</span>
            </div>
            <div className="flex justify-between">
              <span>User Email:</span>
              <span className="text-gray-600">{status.user?.email || 'None'}</span>
            </div>
          </div>
        </div>

        {/* Session Info */}
        <div className="border-b pb-2">
          <h4 className="font-semibold text-gray-700 mb-2">Session</h4>
          <div className="space-y-1">
            <div className="flex justify-between">
              <span>Has Session:</span>
              <span className={getStatusColor(!!status.session)}>
                {getStatusIcon(!!status.session)} {status.session ? 'Yes' : 'No'}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Session User:</span>
              <span className="text-gray-600">{status.session?.uid || 'None'}</span>
            </div>
            <div className="flex justify-between">
              <span>User Email:</span>
              <span className="text-gray-600">{status.session?.email || 'None'}</span>
            </div>
          </div>
        </div>

        {/* Environment */}
        <div className="border-b pb-2">
          <h4 className="font-semibold text-gray-700 mb-2">Environment</h4>
          <div className="space-y-1">
            <div className="flex justify-between">
              <span>Firebase API Key:</span>
              <span className={getStatusColor(status.envStatus.firebaseApiKey)}>
                {getStatusIcon(status.envStatus.firebaseApiKey)} {status.envStatus.firebaseApiKey ? 'Set' : 'Missing'}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Firebase Auth Domain:</span>
              <span className={getStatusColor(status.envStatus.firebaseAuthDomain)}>
                {getStatusIcon(status.envStatus.firebaseAuthDomain)} {status.envStatus.firebaseAuthDomain ? 'Set' : 'Missing'}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Firebase Project ID:</span>
              <span className={getStatusColor(status.envStatus.firebaseProjectId)}>
                {getStatusIcon(status.envStatus.firebaseProjectId)} {status.envStatus.firebaseProjectId ? 'Set' : 'Missing'}
              </span>
            </div>
          </div>
        </div>

        {/* Storage */}
        <div className="border-b pb-2">
          <h4 className="font-semibold text-gray-700 mb-2">Storage</h4>
          <div className="space-y-1">
            <div className="flex justify-between">
              <span>Access Token:</span>
              <span className={getStatusColor(status.storageStatus.hasAccessToken)}>
                {getStatusIcon(status.storageStatus.hasAccessToken)} {status.storageStatus.hasAccessToken ? 'Present' : 'Missing'}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Refresh Token:</span>
              <span className={getStatusColor(status.storageStatus.hasRefreshToken)}>
                {getStatusIcon(status.storageStatus.hasRefreshToken)} {status.storageStatus.hasRefreshToken ? 'Present' : 'Missing'}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Auth Session:</span>
              <span className={getStatusColor(status.storageStatus.hasSession)}>
                {getStatusIcon(status.storageStatus.hasSession)} {status.storageStatus.hasSession ? 'Present' : 'Missing'}
              </span>
            </div>
          </div>
        </div>

        {/* Error */}
        {status.error && (
          <div className="border-b pb-2">
            <h4 className="font-semibold text-red-700 mb-2">Error</h4>
            <div className="text-red-600 text-xs bg-red-50 p-2 rounded">
              {status.error}
            </div>
          </div>
        )}

        {/* Last Updated */}
        <div className="text-xs text-gray-500 text-center">
          Last updated: {new Date().toLocaleTimeString()}
        </div>
      </div>
    </div>
  );
};
