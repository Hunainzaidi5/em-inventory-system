import { User, LoginCredentials, RegisterData, AuthResponse, UserRole, AuthenticationError } from '@/types/auth';
import { getAvatarUrl, uploadAvatar } from '@/utils/avatarUtils';
import { FirebaseAuthService } from '@/lib/firebaseAuth';
import { FirebaseService } from '@/lib/firebaseService';
import { env } from '@/config/env';
import { v4 as uuidv4 } from 'uuid';

// Rate limiting configuration
const RATE_LIMIT = {
  MAX_ATTEMPTS: 5,
  ACCOUNT_LOCKOUT_MS: 15 * 60 * 1000, // 15 minutes
  IP_WINDOW_MS: 60 * 60 * 1000, // 1 hour
  IP_MAX_ATTEMPTS: 20
};

// In-memory rate limiting (in production, use Redis or similar)
const failedAttempts = new Map<string, { count: number; lastAttempt: number; lockedUntil: number | null }>();
const ipAttempts = new Map<string, { count: number; lastAttempt: number }>();

// Cleanup old attempts
const cleanupOldAttempts = (attempts: Map<string, any>, windowMs: number) => {
  const now = Date.now();
  for (const [key, value] of attempts.entries()) {
    if (now - value.lastAttempt > windowMs) {
      attempts.delete(key);
    }
  }
};

// Log user actions
const logUserAction = async (userId: string, action: string, details: any) => {
  try {
    await FirebaseService.create('userActions', {
      userId,
      action,
      details,
      timestamp: new Date(),
      ip: details.ip || 'unknown'
    });
  } catch (error) {
    console.error('Failed to log user action:', error);
  }
};

// Get IP address (simplified for now)
const getClientIP = (): string => {
  // In a real app, this would come from request headers
  return 'localhost';
};

export const authService = {
  // Login user
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const emailLower = credentials.email.toLowerCase().trim();
    const now = Date.now();
    const ip = getClientIP();
    const userAgent = navigator.userAgent;

    try {
      console.log('[AUTH] Attempting login for:', emailLower);

      // Check if account is locked
      const lockedAccount = failedAttempts.get(emailLower);
      if (lockedAccount?.lockedUntil && now < lockedAccount.lockedUntil) {
        const remainingTime = Math.ceil((lockedAccount.lockedUntil - now) / 60000);
        throw new AuthenticationError(
          `Account locked due to too many failed attempts. Please try again in ${remainingTime} minute${remainingTime !== 1 ? 's' : ''}.`,
          'ACCOUNT_LOCKED'
        );
      }

      // Check IP-based rate limiting
      const ipAttempt = ipAttempts.get(ip);
      if (ipAttempt && now - ipAttempt.lastAttempt < RATE_LIMIT.IP_WINDOW_MS && ipAttempt.count >= RATE_LIMIT.IP_MAX_ATTEMPTS) {
        throw new AuthenticationError(
          'Too many login attempts from this IP. Please try again later.',
          'IP_RATE_LIMITED'
        );
      }

      // Attempt to authenticate with Firebase
      const firebaseUser = await FirebaseAuthService.signIn(credentials.email, credentials.password);

      // Get user profile from Firestore
      const userProfile = await FirebaseService.getById('users', firebaseUser.uid);
      
      if (!userProfile) {
        throw new AuthenticationError('User profile not found', 'PROFILE_NOT_FOUND');
      }

      // Clear failed attempts on successful login
      failedAttempts.delete(emailLower);

      // Log successful login
      await logUserAction(firebaseUser.uid, 'login_success', {
        email: emailLower,
        ip,
        userAgent,
        timestamp: new Date().toISOString()
      });

      return {
        success: true,
        user: userProfile as User,
        message: 'Login successful'
      };

    } catch (error) {
      // Handle Firebase auth errors
      if (error instanceof AuthenticationError) {
        throw error;
      }

      // Update failed attempts counter
      const current = failedAttempts.get(emailLower) || { 
        count: 0, 
        lastAttempt: 0, 
        lockedUntil: null 
      };
      
      const failedAttemptsCount = current.count + 1;
      const hitLock = failedAttemptsCount >= RATE_LIMIT.MAX_ATTEMPTS;
      
      // Update in-memory tracking
      failedAttempts.set(emailLower, { 
        count: failedAttemptsCount, 
        lastAttempt: now, 
        lockedUntil: hitLock ? now + RATE_LIMIT.ACCOUNT_LOCKOUT_MS : null 
      });

      // Update IP-based rate limiting
      const ipAttempt = ipAttempts.get(ip) || { count: 0, lastAttempt: 0 };
      ipAttempts.set(ip, {
        count: ipAttempt.count + 1,
        lastAttempt: now
      });

      // Log the failed attempt
      await logUserAction('system', 'login_failed', {
        email: emailLower,
        ip,
        userAgent,
        reason: error instanceof Error ? error.message : 'Unknown error',
        failedAttempts: failedAttemptsCount,
        accountLocked: hitLock,
        timestamp: new Date().toISOString()
      });

      // Clean up old attempts
      cleanupOldAttempts(failedAttempts, RATE_LIMIT.ACCOUNT_LOCKOUT_MS);
      cleanupOldAttempts(ipAttempts, RATE_LIMIT.IP_WINDOW_MS);

      // Map Firebase error messages to user-friendly versions
      const errorMessages: Record<string, string> = {
        'auth/user-not-found': 'No account found with this email address',
        'auth/wrong-password': 'Invalid email or password',
        'auth/invalid-email': 'Invalid email address',
        'auth/user-disabled': 'This account has been disabled',
        'auth/too-many-requests': 'Too many failed attempts. Please try again later',
        'auth/network-request-failed': 'Unable to connect to the server. Please check your internet connection'
      };

      const errorCode = error instanceof Error ? error.message : 'unknown';
      const errorMessage = errorMessages[errorCode] || 'An unexpected error occurred during login';

      // Calculate remaining attempts
      const remainingAttempts = Math.max(0, RATE_LIMIT.MAX_ATTEMPTS - failedAttemptsCount);
      
      // Format the final error message
      let finalMessage = errorMessage;
      if (errorMessage === 'Invalid email or password' && remainingAttempts > 0) {
        finalMessage += `. ${remainingAttempts} attempt${remainingAttempts !== 1 ? 's' : ''} remaining.`;
      } else if (hitLock) {
        const lockoutMinutes = Math.ceil(RATE_LIMIT.ACCOUNT_LOCKOUT_MS / 60000);
        finalMessage = `Account locked due to too many failed attempts. Please try again in ${lockoutMinutes} minute${lockoutMinutes !== 1 ? 's' : ''}.`;
      }

      throw new AuthenticationError(
        finalMessage,
        hitLock ? 'ACCOUNT_LOCKED' : 'INVALID_CREDENTIALS',
        { 
          failedAttempts: failedAttemptsCount,
          remainingAttempts,
          lockedUntil: hitLock ? now + RATE_LIMIT.ACCOUNT_LOCKOUT_MS : null
        }
      );
    }
  },

  // Register new user
  async register(data: RegisterData): Promise<AuthResponse> {
    try {
      console.log('[AUTH] Attempting registration for:', data.email);

      // Create user in Firebase Auth
      const firebaseUser = await FirebaseAuthService.signUp(data.email, data.password, data.displayName);

      // Create user profile in Firestore
      const userProfile: User = {
        id: firebaseUser.uid,
        email: data.email.toLowerCase().trim(),
        display_name: data.displayName.trim(),
        role: data.role || 'technician',
        avatar_url: undefined,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        last_login: new Date().toISOString(),
        is_active: true,
        email_verified: false
      };

      // Save to Firestore
      await FirebaseService.create('users', userProfile);

      // Log successful registration
      await logUserAction(firebaseUser.uid, 'registration_success', {
        email: data.email,
        role: data.role,
        timestamp: new Date().toISOString()
      });

      return {
        success: true,
        user: userProfile,
        message: 'Registration successful. Please check your email to verify your account.'
      };

    } catch (error) {
      console.error('[AUTH] Registration failed:', error);

      // Map Firebase error messages
      const errorMessages: Record<string, string> = {
        'auth/email-already-in-use': 'An account with this email already exists',
        'auth/invalid-email': 'Invalid email address',
        'auth/weak-password': 'Password is too weak. Please choose a stronger password',
        'auth/operation-not-allowed': 'Registration is currently disabled',
        'auth/network-request-failed': 'Unable to connect to the server. Please check your internet connection'
      };

      const errorCode = error instanceof Error ? error.message : 'unknown';
      const errorMessage = errorMessages[errorCode] || 'Registration failed. Please try again.';

      throw new AuthenticationError(errorMessage, 'REGISTRATION_FAILED');
    }
  },

  // Logout user
  async logout(): Promise<void> {
    try {
      await FirebaseAuthService.signOut();
      console.log('[AUTH] User logged out successfully');
    } catch (error) {
      console.error('[AUTH] Logout failed:', error);
      throw new AuthenticationError('Logout failed', 'LOGOUT_FAILED');
    }
  },

  // Get current user
  async getCurrentUser(): Promise<User | null> {
    try {
      const currentUser = FirebaseAuthService.getCurrentUser();
      if (!currentUser) {
        return null;
      }

      const userProfile = await FirebaseService.getById('users', currentUser.uid);
      return userProfile as User;
    } catch (error) {
      console.error('[AUTH] Failed to get current user:', error);
      return null;
    }
  },

  // Update user profile
  async updateProfile(userId: string, updates: Partial<User>): Promise<void> {
    try {
      await FirebaseService.update('users', userId, {
        ...updates,
        updated_at: new Date().toISOString()
      });

      // Log profile update
      await logUserAction(userId, 'profile_updated', {
        updates: Object.keys(updates),
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('[AUTH] Failed to update profile:', error);
      throw new AuthenticationError('Failed to update profile', 'PROFILE_UPDATE_FAILED');
    }
  },

  // Reset password
  async resetPassword(email: string): Promise<void> {
    try {
      await FirebaseAuthService.resetPassword(email);
      console.log('[AUTH] Password reset email sent');
    } catch (error) {
      console.error('[AUTH] Password reset failed:', error);
      throw new AuthenticationError('Failed to send password reset email', 'PASSWORD_RESET_FAILED');
    }
  },

  // Verify email
  async verifyEmail(): Promise<void> {
    try {
      const currentUser = FirebaseAuthService.getCurrentUser();
      if (!currentUser) {
        throw new AuthenticationError('No user logged in', 'NO_USER');
      }

      // Firebase automatically sends verification email on signup
      // This function can be used to resend if needed
      console.log('[AUTH] Email verification handled by Firebase');
    } catch (error) {
      console.error('[AUTH] Email verification failed:', error);
      throw new AuthenticationError('Email verification failed', 'EMAIL_VERIFICATION_FAILED');
    }
  },

  // Check if user is authenticated
  async isAuthenticated(): Promise<boolean> {
    try {
      const currentUser = FirebaseAuthService.getCurrentUser();
      return !!currentUser;
    } catch (error) {
      return false;
    }
  },

  // Get user by ID
  async getUserById(userId: string): Promise<User | null> {
    try {
      const userProfile = await FirebaseService.getById('users', userId);
      return userProfile as User;
    } catch (error) {
      console.error('[AUTH] Failed to get user by ID:', error);
      return null;
    }
  },

  // Get all users (admin only)
  async getAllUsers(): Promise<User[]> {
    try {
      const users = await FirebaseService.query('users');
      return users as User[];
    } catch (error) {
      console.error('[AUTH] Failed to get all users:', error);
      throw new AuthenticationError('Failed to get users', 'USERS_FETCH_FAILED');
    }
  },

  // Delete user (admin only)
  async deleteUser(userId: string): Promise<void> {
    try {
      await FirebaseService.delete('users', userId);
      
      // Log user deletion
      await logUserAction('system', 'user_deleted', {
        deletedUserId: userId,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('[AUTH] Failed to delete user:', error);
      throw new AuthenticationError('Failed to delete user', 'USER_DELETION_FAILED');
    }
  },

  // Set up auth state change listener
  onAuthStateChange(callback: (event: string, session: any) => void) {
    const unsubscribe = FirebaseAuthService.onAuthStateChange((user) => {
      if (user) {
        callback('SIGNED_IN', { user });
      } else {
        callback('SIGNED_OUT', null);
      }
    });

    return {
      subscription: { unsubscribe }
    };
  }
};

export default authService;
