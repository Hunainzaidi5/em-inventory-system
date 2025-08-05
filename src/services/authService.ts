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

export const register = async (userData: RegisterData): Promise<AuthResponse> => {
  try {
    const { email, password, name } = userData;
    
    // Create the user in Supabase Auth
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
          full_name: name,
          email,
        },
        emailRedirectTo: `${window.location.origin}/login`,
      },
    });

    if (error) {
      throw new Error(error.message);
    }

    if (!data.user) {
      throw new Error('No user returned from registration');
    }

    // The profile is created by the trigger we set up in the database
    // But we can also update it here if needed
    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        full_name: name,
        email: email,
        role: 'technician', // Default role
        is_active: true,
      })
      .eq('id', data.user.id);

    if (profileError) {
      console.error('Error updating profile:', profileError);
      // Don't fail registration if profile update fails
    }

    // Get the full user data
    const user = await getCurrentUser();
    
    if (!user) {
      throw new Error('Failed to load user profile after registration');
    }

    return {
      user,
      token: data.session?.access_token || '',
    };
  } catch (error) {
    console.error('Registration error:', error);
    throw error instanceof Error 
      ? error 
      : new Error('An error occurred during registration');
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
