import { createClient } from '@supabase/supabase-js';
import { User, LoginCredentials, RegisterData, AuthResponse, UserRole } from '@/types/auth';
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
    },
  }
);

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
  console.log('[AUTH] Getting current user from Supabase');
  
  // First check if we have an active session
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  console.log('[AUTH] Session check:', { hasSession: !!session, error: sessionError });
  
  // Get the current authenticated user
  const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
  console.log('[AUTH] Current user from auth:', { 
    hasUser: !!authUser, 
    userId: authUser?.id,
    email: authUser?.email,
    error: authError 
  });
  
  if (authError || !authUser) {
    console.error('[AUTH] No authenticated user in Supabase:', authError?.message || 'No user found');
    return null;
  }

  try {
    console.log('[AUTH] Fetching user profile for ID:', authUser.id);
    
    // Get the user's profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authUser.id)
      .single();

    console.log('[AUTH] Profile fetch result:', { 
      hasProfile: !!profile, 
      error: profileError,
      profile: profile ? { 
        id: profile.id, 
        email: profile.email, 
        role: profile.role 
      } : null
    });

    if (profileError) {
      console.error('[AUTH] Error fetching user profile:', profileError);
      // Don't return null here, create a minimal profile from auth data
      const minimalProfile = {
        id: authUser.id,
        email: authUser.email || '',
        full_name: authUser.user_metadata?.name || '',
        role: 'technician', // Default role
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      console.log('[AUTH] Created minimal profile from auth data');
      return createUserObject(authUser, minimalProfile);
    }

    // Create the user object using the helper function
    const userData = createUserObject(authUser, {
      ...profile,
      full_name: profile.full_name,
      role: profile.role,
      department: profile.department,
      employee_id: profile.employee_id,
      is_active: profile.is_active,
      created_at: profile.created_at,
      updated_at: profile.updated_at,
      avatar: profile.avatar
    });

    console.log('[AUTH] User data with avatar URL:', userData);
    return userData;
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
const initStorage = async () => {
  try {
    // Check if the avatars bucket exists
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (bucketsError) throw bucketsError;
    
    const bucketExists = buckets.some(bucket => bucket.name === 'avatars');
    
    if (!bucketExists) {
      console.log('Creating avatars bucket...');
      const { error: createError } = await supabase.storage.createBucket('avatars', {
        public: true,
        allowedMimeTypes: ['image/*'],
        fileSizeLimit: 1024 * 1024 * 2, // 2MB limit
      });
      
      if (createError) throw createError;
      console.log('Avatars bucket created successfully');
    }
    
    // Set bucket policies
    const { error: policyError } = await supabase.rpc('set_avatar_policies');
    if (policyError) {
      console.warn('Failed to set bucket policies:', policyError.message);
    }
    
  } catch (error) {
    console.error('Error initializing storage:', error);
  }
};

// Run initialization
Promise.all([
  ensureDeveloperUser(),
  initStorage()
]).catch(console.error);

export const login = async (credentials: LoginCredentials): Promise<AuthResponse> => {
  try {
    const { email, password } = credentials;
    console.log(`[AUTH] Attempting login for email: ${email}`);
    
    if (!email || !password) {
      const errorMsg = 'Email and password are required';
      console.error(`[AUTH] ${errorMsg}`);
      throw new Error(errorMsg);
    }

    // Sign in with Supabase Auth
    console.log('[AUTH] Calling supabase.auth.signInWithPassword');
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password: password.trim(),
    });

    console.log('[AUTH] Login response:', { 
      hasUser: !!data?.user, 
      session: !!data?.session,
      error: error?.message 
    });

    if (error) {
      let errorMessage = error.message;
      
      // Provide more user-friendly error messages
      if (error.message.includes('Invalid login credentials')) {
        errorMessage = 'Invalid email or password. Please try again.';
      } else if (error.message.includes('Email not confirmed')) {
        errorMessage = 'Please verify your email address before logging in.';
      } else if (error.message.includes('Network request failed')) {
        errorMessage = 'Unable to connect to the server. Please check your internet connection.';
      }
      
      console.error('[AUTH] Login error:', { 
        originalError: error.message,
        friendlyMessage: errorMessage 
      });
      
      throw new Error(errorMessage);
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
export const onAuthStateChange = (callback: (user: User | null) => void) => {
  return supabase.auth.onAuthStateChange(async (event, session) => {
    if (event === 'SIGNED_IN' || event === 'USER_UPDATED') {
      const user = await getCurrentUser();
      callback(user);
    } else if (event === 'SIGNED_OUT') {
      callback(null);
    }
  });
};
