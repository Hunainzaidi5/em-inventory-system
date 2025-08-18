import { User, LoginCredentials, RegisterData, AuthResponse, UserRole, AuthenticationError } from '@/types/auth';
import { getAvatarUrl, uploadAvatar } from '@/utils/avatarUtils';
import { supabase } from '@/lib/supabase';
import { env } from '@/config/env';
import { v4 as uuidv4 } from 'uuid';

// Extend the Window interface to include client IP
declare global {
  interface Window {
    __IP_DEV_ONLY?: string;
  }
}

// Rate limiting configuration
const RATE_LIMIT = {
  // Account-based rate limiting
  MAX_ATTEMPTS: 5, // Max failed attempts before lockout
  LOCKOUT_MINUTES: 15, // Lockout duration in minutes
  LOCKOUT_DURATION_MS: 15 * 60 * 1000, // 15 minutes in milliseconds
  ACCOUNT_LOCKOUT_MS: 15 * 60 * 1000, // 15 minutes in milliseconds
  WINDOW_MS: 15 * 60 * 1000, // 15 minutes window for tracking attempts
  
  // IP-based rate limiting
  IP_MAX_ATTEMPTS: 100, // Max failed attempts per IP per window
  IP_WINDOW_MS: 60 * 60 * 1000, // 1 hour window for IP-based rate limiting
  
  // Cleanup intervals
  CLEANUP_INTERVAL_MS: 5 * 60 * 1000, // 5 minutes
};

// Track failed login attempts
const failedAttempts = new Map<string, { count: number; lastAttempt: number; lockedUntil: number | null }>();
const ipAttempts = new Map<string, { count: number; lastAttempt: number }>();

// Setup cleanup interval
if (typeof window !== 'undefined') {
  // Only run in browser environment
  setInterval(() => {
    try {
      cleanupOldAttempts(failedAttempts, RATE_LIMIT.ACCOUNT_LOCKOUT_MS);
      cleanupOldAttempts(ipAttempts, RATE_LIMIT.IP_WINDOW_MS);
    } catch (error) {
      console.error('Error in rate limit cleanup:', error);
    }
  }, RATE_LIMIT.CLEANUP_INTERVAL_MS);
}

// Get client IP (works with Vercel, Netlify, and other platforms)
const getClientIP = async (): Promise<string> => {
  if (typeof window !== 'undefined' && window.__IP_DEV_ONLY) {
    return window.__IP_DEV_ONLY; // For development/testing
  }

  try {
    const response = await fetch('https://api.ipify.org?format=json');
    const data = await response.json();
    return data.ip;
  } catch (error) {
    console.error('Error getting IP address:', error);
    return 'unknown';
  }
};

// Check if IP is allowed for admin access
const isAdminIPAllowed = async (ip: string): Promise<boolean> => {
  // In development, allow all IPs if no specific IPs are set
  if (process.env.NODE_ENV === 'development' && !process.env.REQUIRE_IP_RESTRICTION) {
    console.log('[AUTH] Development mode: IP restrictions are disabled');
    return true;
  }
  
  try {
    // First check IP ranges in the format '192.168.1.*' or '192.168.*.*'
    const ipParts = ip.split('.');
    const ipPatterns = [
      ip, // Exact match
      `${ipParts[0]}.${ipParts[1]}.${ipParts[2]}.*`, // /24 subnet
      `${ipParts[0]}.${ipParts[1]}.*.*`, // /16 subnet
      `${ipParts[0]}.*.*.*` // /8 subnet
    ];
    
    // Check if any of the IP patterns match allowed IPs
    const { data, error } = await supabase
      .from('allowed_ips')
      .select('ip_address')
      .in('ip_address', ipPatterns);
      
    if (error) {
      console.error('Error querying allowed IPs:', error);
      return false;
    }
    
    const isAllowed = Array.isArray(data) && data.length > 0;
    
    if (!isAllowed) {
      console.log(`[AUTH] IP ${ip} is not in the allowed IPs list`);
      // Log the failed admin access attempt
      await logUserAction('system', 'admin_ip_denied', {
        ip,
        timestamp: new Date().toISOString(),
        matchedPatterns: data?.map(item => item.ip_address) || []
      });
    }
    
    return isAllowed;
  } catch (error) {
    console.error('Error checking admin IP:', error);
    // Log the error but don't block access to prevent locking out all admins if there's a DB issue
    await logUserAction('system', 'admin_ip_check_error', {
      ip,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
    return false; // Default to deny on error
  }
};

// Log user action via RPC (lets the DB handle IP/user-agent; avoids RLS issues)
const logUserAction = async (userId: string, action: string, details: Record<string, any> = {}) => {
  try {
    const { error } = await supabase.rpc('log_user_action', {
      p_user_id: userId,
      p_action: action,
      p_details: details,
    });
    if (error) {
      console.error('Failed to log user action to database:', error);
    }
  } catch (error) {
    console.error('Error in logUserAction:', error);
  }
};

// Helper function to clean up old attempts from rate limiting maps
const cleanupOldAttempts = <T extends { lastAttempt: number }>(
  attempts: Map<string, T>,
  windowMs: number
): void => {
  const now = Date.now();
  for (const [key, value] of attempts.entries()) {
    if (now - value.lastAttempt > windowMs) {
      attempts.delete(key);
    }
  }
};

// Helper function to create a consistent user object
type ProfileData = {
  id: string;
  email: string;
  full_name?: string;
  role?: string;
  department?: string;
  employee_id?: string;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
  avatar?: string;
  last_login_at?: string;
  last_login_ip?: string;
  failed_login_attempts?: number;
  account_locked_until?: string | null;
  created_by?: string | null;
  updated_by?: string | null;
  deleted_at?: string | null;
};

const createUserObject = (authUser: any, profile: ProfileData): User => {
  const avatarPath = profile.avatar || authUser.user_metadata?.avatar || '';
  const avatarUrl = getAvatarUrl(authUser.id, avatarPath);
  
  return {
    id: profile.id || authUser.id,
    email: profile.email || authUser.email || '',
    name: profile.full_name || authUser.user_metadata?.name || authUser.email?.split('@')[0] || 'User',
    role: (profile.role as UserRole) || 'dev',
    department: profile.department || '',
    employee_id: profile.employee_id || '',
    is_active: profile.is_active ?? true,
    created_at: profile.created_at || new Date().toISOString(),
    updated_at: profile.updated_at,
    avatar: avatarUrl || undefined,
  };
};

// Get the current user with profile data
export const getCurrentUser = async (): Promise<User | null> => {
  console.log('[AUTH] === getCurrentUser() started ===');
  
  try {
    // 1. Get the current session
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    const session = sessionData?.session;
    
    if (sessionError || !session) {
      console.error('[AUTH] No active session:', sessionError?.message || 'No session found');
      return null;
    }

    // 2. Get the current user
    const { data: userData, error: userError } = await supabase.auth.getUser();
    const authUser = userData?.user;
    
    if (userError || !authUser) {
      console.error('[AUTH] Error getting current user:', userError?.message || 'No user found');
      // Log failed auth attempt
      await logUserAction(null as unknown as string, 'auth_failed', {
        reason: 'invalid_session',
        sessionId: session.user?.id || 'unknown'
      });
      return null;
    }

    // 3. Get user profile with additional security checks
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authUser.id)
      .single();

    // 4. Handle profile data
    if (profileError || !profile) {
      console.error('[AUTH] Error fetching user profile:', profileError?.message || 'No profile found');
      
      // Log the missing profile
      await logUserAction(authUser.id, 'profile_missing', {
        email: authUser.email,
        authProvider: authUser.app_metadata?.provider
      });
      
      // Sign out the user since their profile is missing
      await supabase.auth.signOut();
      return null;
    }
    
    // 5. Check if account is active
    if (!profile.is_active) {
      console.error('[AUTH] Account is inactive:', authUser.id);
      await logUserAction(authUser.id, 'login_attempt_inactive_account', {
        email: authUser.email
      });
      await supabase.auth.signOut();
      throw new AuthenticationError('Account is inactive. Please contact an administrator.');
    }
    
    // 6. Update last login info
    // 7. Log successful login (no direct profile update here)
    await logUserAction(authUser.id, 'login_success', {});
    
    // 8. Create and return user object
    return createUserObject(authUser, {
      id: authUser.id,
      email: authUser.email || '',
      full_name: profile.full_name || authUser.user_metadata?.full_name || authUser.user_metadata?.name || authUser.email?.split('@')[0] || 'User',
      role: profile.role as UserRole || 'dev',
      department: profile.department || '',
      employee_id: profile.employee_id || '',
      is_active: profile.is_active ?? true,
      created_at: profile.created_at || new Date().toISOString(),
      updated_at: profile.updated_at || new Date().toISOString(),
      avatar: profile.avatar,
      last_login_at: profile.last_login_at,
      last_login_ip: profile.last_login_ip,
      failed_login_attempts: profile.failed_login_attempts,
      account_locked_until: profile.account_locked_until,
      created_by: profile.created_by,
      updated_by: profile.updated_by
    });
  } catch (error) {
    console.error('Error in getCurrentUser:', error);
    return null;
  }
};

// Check if account is locked
const isAccountLocked = async (email: string): Promise<{ 
  locked: boolean; 
  remainingTime?: number; 
  reason?: string 
}> => {
  const now = Date.now();
  const emailLower = email.toLowerCase();
  
  try {
    // 1. Check in-memory rate limiting first
    const attemptInfo = failedAttempts.get(emailLower) || { 
      count: 0, 
      lastAttempt: 0, 
      lockedUntil: null 
    };
    
    if (attemptInfo.lockedUntil && attemptInfo.lockedUntil > now) {
      return {
        locked: true,
        remainingTime: Math.ceil((attemptInfo.lockedUntil - now) / 1000), // in seconds
        reason: 'too_many_attempts'
      };
    }
    
    // 2. Check IP-based rate limiting
    const ip = await getClientIP();
    const ipAttemptInfo = ipAttempts.get(ip) || { count: 0, lastAttempt: 0 };
    
    if (ipAttemptInfo && 
        now - ipAttemptInfo.lastAttempt < RATE_LIMIT.IP_WINDOW_MS && 
        ipAttemptInfo.count >= RATE_LIMIT.IP_MAX_ATTEMPTS) {
      return {
        locked: true,
        remainingTime: Math.ceil((RATE_LIMIT.IP_WINDOW_MS - (now - ipAttemptInfo.lastAttempt)) / 1000),
        reason: 'ip_rate_limit'
      };
    }
    
    // 3. Check database for account lock
    const { data: profile } = await supabase
      .from('profiles')
      .select('account_locked_until, failed_login_attempts')
      .eq('email', emailLower)
      .single();
      
    if (profile?.account_locked_until) {
      const lockTime = new Date(profile.account_locked_until).getTime();
      if (lockTime > now) {
        return {
          locked: true,
          remainingTime: Math.ceil((lockTime - now) / 1000),
          reason: 'account_locked'
        };
      }
    }
    
    return { 
      locked: false 
    };
  } catch (error) {
    console.error('Error checking account lock status:', error);
    // Fail open in case of error to not block legitimate users
    return { 
      locked: false 
    };
  }
};

export const login = async (credentials: LoginCredentials): Promise<AuthResponse> => {
  const { email, password } = credentials;
  const ip = await getClientIP();
  const userAgent = typeof window !== 'undefined' ? window.navigator.userAgent : 'server';
  const now = Date.now();
  
  try {
    // Input validation
    if (!email || !password) {
      await logUserAction(null as unknown as string, 'login_attempt_missing_credentials', { ip, userAgent });
      throw new AuthenticationError('Email and password are required', 'MISSING_CREDENTIALS');
    }
    
    const emailLower = email.toLowerCase();
    
    // Check rate limiting
    const lockStatus = await isAccountLocked(emailLower);
    if (lockStatus.locked) {
      const timeLeft = lockStatus.remainingTime ? Math.ceil(lockStatus.remainingTime / 60) : 1; // Convert to minutes
      const message = `Account temporarily locked. Please try again in ${timeLeft} minute${timeLeft !== 1 ? 's' : ''}.`;
      
      await logUserAction(null as unknown as string, 'login_attempt_locked', {
        email: emailLower,
        ip,
        userAgent,
        reason: lockStatus.reason || 'account_locked',
        remainingTime: lockStatus.remainingTime
      });
      
      throw new AuthenticationError(
        message,
        lockStatus.reason || 'ACCOUNT_LOCKED',
        { lockedUntil: failedAttempts.get(emailLower)?.lockedUntil }
      );
    }

    console.log('[AUTH] Attempting login for:', email);
    
    // Optional: enforce IP restrictions for dev accounts based on allowed IP list
    // If you need this, re-enable with actual rule, e.g., check profile.role === 'dev' after sign-in
    
    // Sign in with Supabase Auth
    const { data, error } = await supabase.auth.signInWithPassword({
      email: emailLower,
      password: password.trim(),
    });
    
    // Handle failed login
    if (error) {
      // Get current profile to update failed attempts
      const { data: profile } = await supabase
        .from('profiles')
        .select('failed_login_attempts')
        .eq('email', emailLower)
        .single();
      
      const failedAttemptsCount = (profile?.failed_login_attempts || 0) + 1;
      const isAccountLocked = failedAttemptsCount >= RATE_LIMIT.MAX_ATTEMPTS;
      const lockoutUntil = isAccountLocked 
        ? new Date(now + RATE_LIMIT.LOCKOUT_DURATION_MS).toISOString() 
        : null;
      
      // Update failed attempts in database
      await supabase
        .from('profiles')
        .update({
          failed_login_attempts: failedAttemptsCount,
          account_locked_until: lockoutUntil,
          updated_at: new Date().toISOString()
        })
        .eq('email', emailLower);
      
      // Update in-memory tracking
      if (isAccountLocked) {
        failedAttempts.set(emailLower, {
          count: failedAttemptsCount,
          lastAttempt: now,
          lockedUntil: now + RATE_LIMIT.LOCKOUT_DURATION_MS
        });
      } else {
        const existing = failedAttempts.get(emailLower) || { count: 0 };
        failedAttempts.set(emailLower, {
          count: failedAttemptsCount,
          lastAttempt: now,
          lockedUntil: null
        });
      }
      
      // Log the failed attempt
      await logUserAction(null as unknown as string, 'login_failed', {
        email: emailLower,
        ip,
        userAgent,
        reason: error.message,
        failedAttempts: failedAttemptsCount,
        accountLocked: isAccountLocked
      });
      
      // Clean up old attempts
      cleanupOldAttempts(failedAttempts, RATE_LIMIT.ACCOUNT_LOCKOUT_MS);
      cleanupOldAttempts(ipAttempts, RATE_LIMIT.IP_WINDOW_MS);
      
      throw new AuthenticationError(
        isAccountLocked 
          ? `Account locked due to too many failed attempts. Please try again in ${Math.ceil(RATE_LIMIT.LOCKOUT_DURATION_MS / 60000)} minutes.`
          : 'Invalid email or password',
        isAccountLocked ? 'ACCOUNT_LOCKED' : 'INVALID_CREDENTIALS'
      );
    }
    
    // Reset failed attempts on successful login
    failedAttempts.delete(emailLower);
    ipAttempts.delete(ip);
    
    // Reset failed attempts in database
    await supabase
      .from('profiles')
      .update({
        failed_login_attempts: 0,
        account_locked_until: null,
        last_login_at: new Date().toISOString(),
        last_login_ip: ip,
        updated_at: new Date().toISOString()
      })
      .eq('email', emailLower);
    
    console.log('[AUTH] Login response:', { 
      hasUser: !!data?.user,
      userId: data?.user?.id,
      hasSession: !!data?.session,
      sessionExpiresAt: data?.session?.expires_at ? new Date(data.session.expires_at * 1000).toISOString() : 'none',
      error: error?.message 
    });

    if (error) {
      // Handle failed login attempts
      const attempt = failedAttempts.get(email) || { count: 0, lastAttempt: 0, lockedUntil: null };
      const newCount = attempt.count + 1;
      
      // Update failed attempts
      failedAttempts.set(email, {
        count: newCount,
        lastAttempt: Date.now(),
        lockedUntil: newCount >= RATE_LIMIT.MAX_ATTEMPTS 
          ? Date.now() + (RATE_LIMIT.LOCKOUT_MINUTES * 60 * 1000)
          : null
      });
      
      const attemptsLeft = RATE_LIMIT.MAX_ATTEMPTS - newCount;
      
      // Map error messages to user-friendly versions
      const errorMessages: Record<string, string> = {
        'Invalid login credentials': `Invalid email or password. ${attemptsLeft > 0 ? `${attemptsLeft} attempts remaining.` : 'Account locked for 15 minutes.'}`,
        'Email not confirmed': 'Please verify your email address before logging in.',
        'Network request failed': 'Unable to connect to the server. Please check your internet connection.',
        '400': 'Invalid request. Please check your input and try again.',
        '401': 'Authentication failed. Please check your credentials.',
        '403': 'Access denied. You do not have permission to access this resource.',
        '429': 'Too many login attempts. Please try again later.',
        '500': 'Server error. Please try again later.'
      };
      
      // Get the most specific error message
      const errorMessage = errorMessages[error.status] || 
                         errorMessages[error.message] || 
                         'An unexpected error occurred during login.';
      
      // Log detailed error information (without sensitive data)
      const errorDetails = {
        code: error.status || 'AUTH_ERROR',
        status: error.status,
        timestamp: new Date().toISOString(),
        failedAttempts: newCount,
        remainingAttempts: Math.max(0, RATE_LIMIT.MAX_ATTEMPTS - newCount)
      };
      
      console.error('[AUTH] Login error:', errorDetails);
      
      throw new AuthenticationError(
        errorMessage,
        error.status || 'AUTH_ERROR',
        errorDetails
      );
    }

    if (!data?.user) {
      const errorMsg = 'No user data received from authentication service';
      console.error(`[AUTH] ${errorMsg}`);
      throw new Error(errorMsg);
    }

    // Ensure we have a valid session
    if (!data.session) {
      const errorMsg = 'No active session created during login';
      console.error(`[AUTH] ${errorMsg}`);
      throw new Error(errorMsg);
    }

    // Get or create user profile
    let userProfile = null;
    try {
      console.log('[AUTH] Fetching user profile for ID:', data.user.id);
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .single();
      
      if (profileError) {
        console.log('[AUTH] Profile not found, will create one');
        // Create a default profile if it doesn't exist
        const { data: newProfile, error: createError } = await supabase
          .from('profiles')
          .insert([
            {
              id: data.user.id,
              email: data.user.email,
              full_name: data.user.user_metadata?.name || data.user.email?.split('@')[0] || 'User',
              role: 'dev',
              is_active: true
            }
          ])
          .select()
          .single();
          
        if (createError) {
          console.error('[AUTH] Error creating profile:', createError);
          throw new Error('Failed to create user profile');
        }
        
        userProfile = newProfile;
      } else {
        userProfile = profile;
      }
      
      console.log('[AUTH] User profile:', { 
        id: userProfile?.id,
        email: userProfile?.email,
        role: userProfile?.role 
      });
    } catch (error) {
      console.error('[AUTH] Error handling user profile:', error);
      // Continue with minimal user data if profile handling fails
    }

    // Create user object with available data
    const user = createUserObject(data.user, {
      id: data.user.id,
      email: data.user.email || '',
      full_name: userProfile?.full_name || data.user.user_metadata?.name || data.user.email?.split('@')[0] || 'User',
      role: userProfile?.role || data.user.user_metadata?.role || 'dev',
      department: userProfile?.department || data.user.user_metadata?.department || '',
      employee_id: userProfile?.employee_id || data.user.user_metadata?.employee_id || '',
      is_active: userProfile?.is_active ?? true,
      created_at: userProfile?.created_at || data.user.created_at || new Date().toISOString(),
      updated_at: userProfile?.updated_at,
      avatar: userProfile?.avatar || data.user.user_metadata?.avatar || undefined,
    });

    console.log('[AUTH] Login successful, returning user:', { 
      id: user.id, 
      email: user.email,
      role: user.role 
    });

    return {
      user,
      token: data.session.access_token,
      session: data.session
    };
  } catch (error) {
    console.error('Login error:', error);
    throw error instanceof Error 
      ? error 
      : new Error('An error occurred during login');
  }
};

export const register = async (userData: RegisterData): Promise<{ success: boolean; error?: string }> => {
  // Input validation
  if (!userData.email || !userData.password) {
    return { success: false, error: 'Email and password are required' };
  }
  
  // Email format validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(userData.email)) {
    return { success: false, error: 'Please enter a valid email address' };
  }
  
  // Password strength validation
  if (userData.password.length < 8) {
    return { 
      success: false, 
      error: 'Password must be at least 8 characters long' 
    };
  }
  const { email, password, name, role, department, employee_id } = userData;
  
  // Standardize on 'dev' for admin/developer access
  const roleString = role as string;
  const normalizedRole = (roleString === 'admin') ? 'dev' : role as UserRole;
  
  // Validate the role against the database enum
  const validRoles = [
    'dev',
    'manager',
    'deputy_manager',
    'engineer',
    'assistant_engineer',
    'master_technician',
    'technician'
  ];

  if (!validRoles.includes(normalizedRole)) {
    return { 
      success: false, 
      error: `Invalid role. Must be one of: ${validRoles.join(', ')}` 
    };
  }

  try {
    // Ensure only a dev can register new users
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (!authUser) {
      return { success: false, error: 'Not authenticated' };
    }
    const { data: inviterProfile, error: inviterError } = await supabase
      .from('profiles')
      .select('id, role')
      .eq('id', authUser.id)
      .single();
    if (inviterError || !inviterProfile) {
      return { success: false, error: 'Unable to verify inviter permissions' };
    }
    if (inviterProfile.role !== 'dev') {
      return { success: false, error: 'Only developers can create new users' };
    }

    // First create the auth user
    const { data, error } = await supabase.auth.signUp({
      email: email.trim().toLowerCase(),
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
        data: {
          name: name.trim(),
          full_name: name.trim(),
          email: email.trim().toLowerCase(),
          role: normalizedRole,
          department: department?.trim(),
          employee_id: employee_id?.trim(),
          invited_by: inviterProfile.id,
          is_self_signup: false,
        },
      },
    });
    
    // Send email verification
    if (data.user && !data.user.email_confirmed_at) {
      const { error: verifyError } = await supabase.auth.resend({
        type: 'signup',
        email: data.user.email!,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`
        }
      });
      
      if (verifyError) {
        console.error('Error sending verification email:', verifyError);
      }
    }

    if (error) throw error;
    return { success: true };
  } catch (error: any) {
    console.error('Registration error:', error);
    return { 
      success: false, 
      error: error.message || 'Failed to register user' 
    };
  }
};

export const logout = async (): Promise<void> => {
  const { error } = await supabase.auth.signOut();
  if (error) {
    console.error('Error during logout:', error);
    throw error;
  }
};

// Password reset
export const resetPassword = async (email: string): Promise<void> => {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reset-password`,
  });
  
  if (error) {
    console.error('Error sending password reset email:', error);
    throw error;
  }
};

// Update user profile
export const updateProfile = async (updates: Partial<User> & { avatarFile?: File }): Promise<User> => {
  const { data: { user: authUser } } = await supabase.auth.getUser();
  
  if (!authUser) {
    throw new Error('User not authenticated');
  }

  // Handle avatar file upload if provided
  if (updates.avatarFile) {
    try {
      const publicUrl = await uploadAvatar(updates.avatarFile, authUser.id);
      // Update the avatar URL in the updates object
      updates.avatar = publicUrl;
    } catch (error) {
      console.error('Error uploading avatar:', error);
      throw new Error('Failed to upload avatar');
    }
  }

  // If updating role, standardize 'admin' to 'dev' and validate against database enum
  if (updates.role) {
    // Convert role to string for comparison
    const roleString = updates.role as string;
    
    // Standardize 'admin' to 'dev'
    if (roleString === 'admin') {
      updates.role = 'dev' as UserRole;
    }
    
    const validRoles: UserRole[] = [
      'dev',
      'manager',
      'deputy_manager',
      'engineer',
      'assistant_engineer',
      'master_technician',
      'technician'
    ];

    if (!validRoles.includes(updates.role as UserRole)) {
      throw new Error(`Invalid role. Must be one of: ${validRoles.join(', ')}`);
    }
  }

  try {
    // Remove the avatarFile from updates before saving to the database
    const { avatarFile, ...profileUpdates } = updates;
    
    // Map interface fields to database fields
    const dbUpdates: any = {
      updated_at: new Date().toISOString(),
    };
    
    // Map name to full_name for database
    if (profileUpdates.name !== undefined) {
      dbUpdates.full_name = profileUpdates.name;
    }
    
    // Map other fields directly
    if (profileUpdates.email !== undefined) dbUpdates.email = profileUpdates.email;
    if (profileUpdates.role !== undefined) dbUpdates.role = profileUpdates.role;
    if (profileUpdates.department !== undefined) dbUpdates.department = profileUpdates.department;
    if (profileUpdates.employee_id !== undefined) dbUpdates.employee_id = profileUpdates.employee_id;
    if (profileUpdates.avatar !== undefined) dbUpdates.avatar = profileUpdates.avatar;
    
    const { data, error } = await supabase
      .from('profiles')
      .update(dbUpdates)
      .eq('id', authUser.id)
      .select()
      .single();

    if (error) throw error;

    // Get the updated user data
    const updatedUser = await getCurrentUser();
    if (!updatedUser) {
      throw new Error('Failed to fetch updated user data');
    }

    return updatedUser;
  } catch (error: any) {
    console.error('Error updating profile:', error);
    throw new Error(error.message || 'Failed to update profile');
  }
};

// Subscribe to auth state changes
export const onAuthStateChange = (callback: (event: string, session: any) => void) => {
  const { data } = supabase.auth.onAuthStateChange((event, session) => {
    try {
      console.log(`[AUTH] Auth state changed: ${event}`);
      callback(event, session);
    } catch (error) {
      console.error('[AUTH] Error in auth state change callback:', error);
    }
  });
  
  return { data };
};
