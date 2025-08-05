import { createClient } from '@supabase/supabase-js';
import { User, LoginCredentials, RegisterData, AuthResponse } from '@/types/auth';

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
    console.error('Error getting auth user:', authError);
    return null;
  }

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
    avatar: authUser.user_metadata?.avatar_url
  };
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
    
    // Check for hardcoded developer credentials
    if (email === DEVELOPER_CREDENTIALS.email && password === DEVELOPER_CREDENTIALS.password) {
      return {
        user: DEVELOPER_CREDENTIALS.user,
        token: 'dev-token-' + Math.random().toString(36).substring(2, 15)
      };
    }
    
    // Regular Supabase authentication for other users
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

    // Get the user's profile
    const user = await getCurrentUser();
    
    if (!user) {
      throw new Error('Failed to load user profile');
    }

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

export const register = async (userData: RegisterData): Promise<{ success: boolean; message: string }> => {
  try {
    // First, check if user already exists
    const { data: existingUser } = await supabase
      .from('profiles')
      .select('email')
      .eq('email', userData.email)
      .single();

    if (existingUser) {
      return { success: false, message: 'A user with this email already exists' };
    }

    // Create the user with Supabase Auth
    const { data: authData, error: signUpError } = await supabase.auth.admin.createUser({
      email: userData.email,
      password: userData.password,
      email_confirm: true, // Auto-confirm the email
      user_metadata: {
        name: userData.name,
      },
    });

    if (signUpError) {
      console.error('Error creating auth user:', signUpError);
      return { success: false, message: signUpError.message };
    }

    if (!authData.user) {
      return { success: false, message: 'No user returned from registration' };
    }

    // Create the user's profile in the database
    const { error: profileError } = await supabase
      .from('profiles')
      .insert([
        {
          id: authData.user.id,
          full_name: userData.name,
          email: userData.email,
          role: userData.role || 'technician',
          department: userData.department || '',
          employee_id: userData.employee_id || '',
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ]);

    if (profileError) {
      console.error('Error creating profile:', profileError);
      // Clean up the auth user if profile creation fails
      await supabase.auth.admin.deleteUser(authData.user.id);
      return { success: false, message: 'Failed to create user profile' };
    }

    return { success: true, message: 'User created successfully' };
  } catch (error) {
    console.error('Registration error:', error);
    return { 
      success: false, 
      message: error instanceof Error ? error.message : 'An unknown error occurred' 
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

  const { data, error } = await supabase
    .from('profiles')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', authUser.id)
    .select()
    .single();

  if (error) {
    console.error('Error updating profile:', error);
    throw error;
  }

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
