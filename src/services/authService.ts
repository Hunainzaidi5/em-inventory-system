import { createClient } from '@supabase/supabase-js';
import { User, LoginCredentials, RegisterData, AuthResponse, UserRole } from '@/types/auth';

// Initialize the Supabase client with environment variables
export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY,
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
      storage: window.localStorage,
    },
  }
);

// Get the current user with profile data
export const getCurrentUser = async (): Promise<User | null> => {
  const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !authUser) {
    console.log('No authenticated user in Supabase');
    return null;
  }

  try {
    // Get the user's profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authUser.id)
      .single();

    if (profileError) {
      console.error('Error fetching user profile:', profileError);
      return null;
    }

    return {
      id: authUser.id,
      email: authUser.email || '',
      name: profile.full_name || authUser.user_metadata?.name || '',
      role: profile.role || 'technician',
      department: profile.department || '',
      employee_id: profile.employee_id || '',
      is_active: profile.is_active ?? true,
      created_at: profile.created_at || new Date().toISOString(),
      updated_at: profile.updated_at,
      avatar: profile.avatar || authUser.user_metadata?.avatar || undefined,
    };
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

// Run this on import to ensure developer user exists
ensureDeveloperUser();

export const login = async (credentials: LoginCredentials): Promise<AuthResponse> => {
  try {
    const { email, password } = credentials;
    
    // Sign in with Supabase Auth
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      throw new Error(error.message);
    }

    if (!data.user) {
      throw new Error('No user returned from authentication');
    }

    // Try to get the user's profile, but handle case where it doesn't exist
    let userProfile = null;
    try {
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .single();
      
      if (!profileError) {
        userProfile = profile;
      }
    } catch (profileError) {
      console.log('Profile not found, creating default profile');
    }

    // Create user object with available data
    const user = {
      id: data.user.id,
      email: data.user.email || '',
      name: userProfile?.full_name || data.user.user_metadata?.name || data.user.email?.split('@')[0] || 'User',
      role: userProfile?.role || data.user.user_metadata?.role || 'technician',
      department: userProfile?.department || data.user.user_metadata?.department || '',
      employee_id: userProfile?.employee_id || data.user.user_metadata?.employee_id || '',
      is_active: userProfile?.is_active ?? true,
      created_at: userProfile?.created_at || data.user.created_at || new Date().toISOString(),
      updated_at: userProfile?.updated_at,
      avatar: userProfile?.avatar || data.user.user_metadata?.avatar || undefined,
    };

    return {
      user,
      token: data.session?.access_token || '',
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
export const updateProfile = async (updates: Partial<User>): Promise<User> => {
  const { data: { user: authUser } } = await supabase.auth.getUser();
  
  if (!authUser) {
    throw new Error('User not authenticated');
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
    const { data, error } = await supabase
      .from('profiles')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', authUser.id)
      .select()
      .single();

    if (error) throw error;

    return {
      id: authUser.id,
      email: authUser.email || '',
      name: data.full_name || authUser.user_metadata?.name || '',
      role: data.role || 'technician',
      department: data.department || '',
      employee_id: data.employee_id || '',
      is_active: data.is_active ?? true,
      created_at: data.created_at || new Date().toISOString(),
      updated_at: data.updated_at,
    };
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
