import { User, LoginCredentials, RegisterData, AuthResponse, UserRole, AuthenticationError } from '@/types/auth';
import { getAvatarUrl, uploadAvatar } from '@/utils/avatarUtils';
import { supabase } from '@/lib/supabase';
import { env } from '@/config/env';

// Rate limiting configuration
const RATE_LIMIT = {
  MAX_ATTEMPTS: 5,
  LOCKOUT_MINUTES: 15,
  WINDOW_MS: 15 * 60 * 1000, // 15 minutes
};

// Track failed login attempts
const failedAttempts = new Map<string, { count: number; lastAttempt: number; lockedUntil: number | null }>();

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
};

const createUserObject = (authUser: any, profile: ProfileData): User => {
  const avatarPath = profile.avatar || authUser.user_metadata?.avatar || '';
  const avatarUrl = getAvatarUrl(authUser.id, avatarPath);
  
  return {
    id: profile.id || authUser.id,
    email: profile.email || authUser.email || '',
    name: profile.full_name || authUser.user_metadata?.name || authUser.email?.split('@')[0] || 'User',
    role: (profile.role as UserRole) || 'technician',
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
    
    console.log('[AUTH] Session state:', {
      hasSession: !!session,
      sessionUser: session?.user?.id || 'No user in session',
      sessionError: sessionError?.message || 'No session error',
      expiresAt: session?.expires_at ? new Date(session.expires_at * 1000).toISOString() : 'No expiration'
    });

    // 2. Get the current user
    const { data: userData, error: userError } = await supabase.auth.getUser();
    const authUser = userData?.user;
    
    console.log('[AUTH] Auth user state:', {
      hasAuthUser: !!authUser,
      authUserId: authUser?.id || 'No auth user',
      authEmail: authUser?.email || 'No email',
      authError: userError?.message || 'No auth error'
    });

    if (userError || !authUser) {
      console.error('[AUTH] Error getting current user:', userError?.message || 'No user found');
      return null;
    }

    // 3. Get user profile
    console.log('[AUTH] Fetching profile for user:', authUser.id);
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authUser.id)
      .single();

    console.log('[AUTH] Profile data:', {
      hasProfile: !!profile,
      profileError: profileError?.message || 'No profile error'
    });

    // 4. Handle profile data
    if (profileError || !profile) {
      console.error('[AUTH] Error fetching user profile:', profileError?.message || 'No profile found');
      // Create a minimal profile from auth data
      const minimalProfile = {
        id: authUser.id,
        email: authUser.email || '',
        full_name: authUser.user_metadata?.full_name || authUser.user_metadata?.name || authUser.email?.split('@')[0] || 'User',
        role: (authUser.user_metadata?.role as UserRole) || 'technician',
        department: authUser.user_metadata?.department || '',
        employee_id: authUser.user_metadata?.employee_id || '',
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      console.log('[AUTH] Created minimal profile:', minimalProfile);
      const user = createUserObject(authUser, minimalProfile);
      return user;
    }

    // 5. Create user object with profile data
    const user = createUserObject(authUser, profile);
    console.log('[AUTH] Created user object:', {
      id: user.id,
      email: user.email,
      role: user.role,
      hasAvatar: !!user.avatar
    });

    return user;
  } catch (error) {
    console.error('Error in getCurrentUser:', error);
    return null;
  }
};

// Check if account is locked
const isAccountLocked = (email: string): { locked: boolean; remainingTime?: number } => {
  const attempt = failedAttempts.get(email);
  if (!attempt || !attempt.lockedUntil) return { locked: false };
  
  if (Date.now() < attempt.lockedUntil) {
    return { 
      locked: true, 
      remainingTime: Math.ceil((attempt.lockedUntil - Date.now()) / 1000 / 60) 
    };
  }
  
  // Reset if lockout period has passed
  failedAttempts.delete(email);
  return { locked: false };
};

export const login = async (credentials: LoginCredentials): Promise<AuthResponse> => {
  const { email, password } = credentials;
  
  try {
    // Input validation
    if (!email || !password) {
      throw new AuthenticationError('Email and password are required', 'MISSING_CREDENTIALS');
    }
    
    // Check rate limiting
    const lockStatus = isAccountLocked(email);
    if (lockStatus.locked) {
      throw new AuthenticationError(
        `Account temporarily locked. Please try again in ${lockStatus.remainingTime} minutes.`,
        'ACCOUNT_LOCKED',
        { lockedUntil: failedAttempts.get(email)?.lockedUntil }
      );
    }

    console.log('[AUTH] Attempting login for:', email);
    
    // Sign in with Supabase Auth
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password: password.trim(),
    });
    
    // Reset failed attempts on successful login
    if (!error) {
      failedAttempts.delete(email);
    }
    
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
              role: 'technician',
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
      role: userProfile?.role || data.user.user_metadata?.role || 'technician',
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
    // Create user via serverless admin endpoint (dev-only control)
    const response = await fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: email.trim().toLowerCase(),
        password,
        name: name.trim(),
        role: normalizedRole,
        department: department?.trim(),
        employee_id: employee_id?.trim(),
      }),
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err?.error || err?.message || `Registration failed (${response.status})`);
    }
    return { success: true };
  } catch (error: any) {
    console.error('Registration error:', error);
    return { success: false, error: error.message || 'Failed to register user' };
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
