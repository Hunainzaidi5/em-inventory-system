import { createClient } from '@supabase/supabase-js';
import { User, LoginCredentials, RegisterData, AuthResponse, UserRole, AuthenticationError } from '@/types/auth';
import { getAvatarUrl, uploadAvatar } from '@/utils/avatarUtils';

// Debug log environment variables
console.log('Supabase URL:', import.meta.env.VITE_SUPABASE_URL ? 'Set' : 'Not set');
console.log('Supabase Anon Key:', import.meta.env.VITE_SUPABASE_ANON_KEY ? 'Set' : 'Not set');

// Initialize the Supabase client with environment variables
export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL || '',
  import.meta.env.VITE_SUPABASE_ANON_KEY || '',
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
      storage: window.localStorage,
      flowType: 'pkce',
      debug: true,
    },
    global: {
      headers: {
        'x-application-name': 'em-inventory-system',
      },
    },
  }
);

// Set the auth cookie options for production
if (import.meta.env.PROD) {
  supabase.auth.onAuthStateChange((event, session) => {
    console.log('[AUTH] Auth state changed:', event);
    if (event === 'SIGNED_IN' && session) {
      // This ensures the session is properly set in the browser
      document.cookie = `sb-${import.meta.env.VITE_SUPABASE_PROJECT_REF || 'tucphgomwmknvlleuiow'}-auth-token=${session.access_token}; path=/; secure; samesite=lax`;
    }
  });
}

// Test Supabase connection
supabase.auth.getSession().then(({ data: { session } }) => {
  console.log('Current session:', session ? 'Active' : 'No active session');
});

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
        full_name: authUser.user_metadata?.full_name || '',
        role: 'user' as UserRole,
        avatar_url: null,
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

// Hardcoded developer credentials
const DEVELOPER_CREDENTIALS = {
  email: 'syedhunainalizaidi@gmail.com',
  password: 'APPLE_1414',
  user: {
    id: 'dev-hardcoded',
    name: 'Syed Hunain Ali',
    email: 'syedhunainalizaidi@gmail.com',
    role: 'dev',
    department: 'E&M SYSTEMS',
    employee_id: 'DEV001',
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  } as User
};

// Add the developer user to the database if not exists
const ensureDeveloperUser = async () => {
  try {
    // Check if developer user exists in profiles
    const { data: existingDev } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', DEVELOPER_CREDENTIALS.email)
      .single();

    if (!existingDev) {
      // Create the developer profile in the database
      const { error } = await supabase
        .from('profiles')
        .insert([{
          id: DEVELOPER_CREDENTIALS.user.id,
          full_name: DEVELOPER_CREDENTIALS.user.name,
          email: DEVELOPER_CREDENTIALS.email,
          role: 'dev',
          department: DEVELOPER_CREDENTIALS.user.department,
          employee_id: DEVELOPER_CREDENTIALS.user.employee_id,
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }]);

      if (error) {
        console.error('Error creating developer profile:', error);
      }
    }
  } catch (error) {
    console.error('Error ensuring developer user:', error);
  }
};

// Initialize storage bucket for avatars
// const initStorage = async () => {
//   try {
//     // Check if the avatars bucket exists
//     const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
//     if (bucketsError) throw bucketsError;
//     const bucketExists = buckets.some(bucket => bucket.name === 'avatars');
//     if (!bucketExists) {
//       console.log('Creating avatars bucket...');
//       const { error: createError } = await supabase.storage.createBucket('avatars', {
//         public: true,
//         allowedMimeTypes: ['image/*'],
//         fileSizeLimit: 1024 * 1024 * 2,
//       });
//       if (createError) throw createError;
//       console.log('Avatars bucket created successfully');
//     }
//     // Set bucket policies via RPC (requires service role)
//     const { error: policyError } = await supabase.rpc('set_avatar_policies');
//     if (policyError) {
//       console.warn('Failed to set bucket policies:', policyError.message);
//     }
//   } catch (error) {
//     console.error('Error initializing storage:', error);
//   }
// };

// Run initialization (disabled in client - requires service role)
// Promise.all([
//   ensureDeveloperUser(),
//   initStorage()
// ]).catch(console.error);

export const login = async (credentials: LoginCredentials): Promise<AuthResponse> => {
  console.log('[AUTH] Attempting login for email:', credentials.email);
  
  // Log environment for debugging
  console.log('[AUTH] Environment:', {
    isProduction: import.meta.env.PROD,
    supabaseUrl: import.meta.env.VITE_SUPABASE_URL ? 'Set' : 'Not set',
    domain: window.location.hostname
  });
  
  try {
    const { email, password } = credentials;
    console.log(`[AUTH] Attempting login for email: ${email}`);
    
    if (!email || !password) {
      const errorMsg = 'Email and password are required';
      console.error(`[AUTH] ${errorMsg}`);
      throw new Error(errorMsg);
    }

    // Log storage state before authentication
    console.log('[AUTH] Pre-authentication storage state:', {
      accessToken: localStorage.getItem(`sb-${import.meta.env.VITE_SUPABASE_PROJECT_REF || 'tucphgomwmknvlleuiow'}-auth-token`),
      refreshToken: localStorage.getItem(`sb-${import.meta.env.VITE_SUPABASE_PROJECT_REF || 'tucphgomwmknvlleuiow'}-refresh-token`)
    });
    
    // Sign in with Supabase Auth
    console.log('[AUTH] Calling supabase.auth.signInWithPassword');
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password: password.trim(),
    });
    
    // Log storage state after authentication attempt
    console.log('[AUTH] Post-authentication storage state:', {
      accessToken: localStorage.getItem(`sb-${import.meta.env.VITE_SUPABASE_PROJECT_REF || 'tucphgomwmknvlleuiow'}-auth-token`),
      refreshToken: localStorage.getItem(`sb-${import.meta.env.VITE_SUPABASE_PROJECT_REF || 'tucphgomwmknvlleuiow'}-refresh-token`)
    });

    console.log('[AUTH] Login response:', { 
      hasUser: !!data?.user,
      userId: data?.user?.id,
      hasSession: !!data?.session,
      sessionExpiresAt: data?.session?.expires_at ? new Date(data.session.expires_at * 1000).toISOString() : 'none',
      accessToken: data?.session?.access_token ? `${data.session.access_token.substring(0, 10)}...` : 'none',
      refreshToken: data?.session?.refresh_token ? `${data.session.refresh_token.substring(0, 10)}...` : 'none',
      error: error?.message 
    });
    
    // Debug: Log storage state
    console.log('[AUTH] Storage state:', {
      accessToken: localStorage.getItem('sb-tucphgomwmknvlleuiow-auth-token'),
      refreshToken: localStorage.getItem('sb-tucphgomwmknvlleuiow-auth-token')
    });

    if (error) {
      const errorCode = error.status || 'AUTH_ERROR';
      let errorMessage = error.message;
      
      // Map error messages to user-friendly versions
      const errorMessages: Record<string, string> = {
        'Invalid login credentials': 'Invalid email or password. Please try again.',
        'Email not confirmed': 'Please verify your email address before logging in.',
        'Network request failed': 'Unable to connect to the server. Please check your internet connection.',
        '400': 'Invalid request. Please check your input and try again.',
        '401': 'Authentication failed. Please check your credentials.',
        '403': 'Access denied. You do not have permission to access this resource.',
        '500': 'Server error. Please try again later.'
      };
      
      // Get the most specific error message
      errorMessage = errorMessages[error.status] || 
                    errorMessages[error.message] || 
                    'An unexpected error occurred during login.';
      
      // Log detailed error information
      const errorDetails = {
        code: errorCode,
        status: error.status,
        message: error.message,
        timestamp: new Date().toISOString(),
        path: window.location.pathname
      };
      
      console.error('[AUTH] Login error details:', errorDetails);
      
      // Throw our custom error
      throw new AuthenticationError(
        errorMessage,
        errorCode,
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
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
          full_name: name,
          email,
          role: normalizedRole,
          department,
          employee_id,
        },
      },
    });

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
    
    const { data, error } = await supabase
      .from('profiles')
      .update({
        ...profileUpdates,
        updated_at: new Date().toISOString(),
      })
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
  return supabase.auth.onAuthStateChange((event, session) => {
    try {
      console.log(`[AUTH] Auth state changed: ${event}`);
      callback(event, session);
  } catch (error) {
      console.error('[AUTH] Error in auth state change callback:', error);
  }
  });
};
