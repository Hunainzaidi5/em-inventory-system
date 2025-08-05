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
    id: 'dev-user-uuid-hardcoded-12345678',
    name: 'Syed Hunain Ali',
    email: 'syedhunainalizaidi@gmail.com',
    role: 'dev' as const,
    department: 'E&M SYSTEMS',
    employee_id: 'DEV001',
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  } as User
};

export const login = async (credentials: LoginCredentials): Promise<AuthResponse> => {
  try {
    const { email, password } = credentials;
    
    // Check for hardcoded developer credentials
    if (email === DEVELOPER_CREDENTIALS.email && password === DEVELOPER_CREDENTIALS.password) {
      // Store dev user flag in localStorage for persistence
      localStorage.setItem('devUser', 'true');
      localStorage.setItem('devUserData', JSON.stringify(DEVELOPER_CREDENTIALS.user));
      
      return {
        user: DEVELOPER_CREDENTIALS.user,
        token: 'dev-token-' + Math.random().toString(36).substring(2, 15)
      };
    }
    
    // Clear dev user flag for regular users
    localStorage.removeItem('devUser');
    localStorage.removeItem('devUserData');
    
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

export const register = async (userData: RegisterData): Promise<AuthResponse> => {
  const { email, password, name, role, department, employee_id } = userData;
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        name,
        full_name: name,
        email,
        role,
        department,
        employee_id,
      },
    },
  });
  if (error) throw { message: error.message };
  return {
    user: {
      id: data.user?.id || '',
      name: data.user?.user_metadata?.name || '',
      email: data.user?.email || '',
      role: data.user?.user_metadata?.role || '',
      avatar: data.user?.user_metadata?.avatar_url || '',
      created_at: data.user?.created_at || '',
      is_active: true, // default to true on registration
    },
    token: data.session?.access_token || '',
  };
};

// Admin function to create users without switching sessions
export const createUserAsAdmin = async (userData: RegisterData): Promise<{ success: boolean; error?: string }> => {
  try {
    const { email, password, name, role, department, employee_id } = userData;
    
    console.log('[DEBUG] Creating user as admin:', { email, name, role });
    
    // Store current session info to restore later
    const { data: currentSession } = await supabase.auth.getSession();
    const currentUser = await getCurrentUser();
    
    console.log('[DEBUG] Current session stored:', !!currentSession?.session);
    console.log('[DEBUG] Current user stored:', currentUser?.email);

    // Create user using the main client but handle session carefully
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
          full_name: name,
          email,
          role,
          department,
          employee_id,
        },
      },
    });

    if (error) {
      console.error('[DEBUG] SignUp error:', error);
      throw new Error(error.message);
    }

    if (!data.user) {
      throw new Error('Failed to create user');
    }

    console.log('[DEBUG] User created successfully:', data.user.id);

    // Immediately sign out the new user to prevent session switch
    await supabase.auth.signOut();
    
    // Restore the original session if it was a dev user
    if (currentUser?.role === 'dev') {
      // For dev users, restore from localStorage
      localStorage.setItem('devUser', 'true');
      localStorage.setItem('devUserData', JSON.stringify(currentUser));
      console.log('[DEBUG] Dev session restored from localStorage');
    } else if (currentSession?.session) {
      // For regular users, restore the session
      await supabase.auth.setSession(currentSession.session);
      console.log('[DEBUG] Regular session restored');
    }

    return { success: true };
  } catch (error) {
    console.error('Admin create user error:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to create user' 
    };
  }
};

export const logout = async (): Promise<void> => {
  // Clear dev user flags
  localStorage.removeItem('devUser');
  localStorage.removeItem('devUserData');
  
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
