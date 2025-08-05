import { createClient } from '@supabase/supabase-js';

const supabaseUrl = (import.meta.env as any).VITE_SUPABASE_URL;
const supabaseAnonKey = (import.meta.env as any).VITE_SUPABASE_ANON_KEY;
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar?: string;
  createdAt: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData extends LoginCredentials {
  name: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export const login = async (credentials: LoginCredentials): Promise<AuthResponse> => {
  const { email, password } = credentials;
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw { message: error.message };
  return {
    user: {
      id: data.user.id,
      name: data.user.user_metadata?.name || '',
      email: data.user.email || '',
      role: data.user.user_metadata?.role || '',
      avatar: data.user.user_metadata?.avatar_url || '',
      createdAt: data.user.created_at,
    },
    token: data.session?.access_token || '',
  };
};

export const register = async (userData: RegisterData): Promise<AuthResponse> => {
  const { email, password, name } = userData;
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { name },
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
      createdAt: data.user?.created_at || '',
    },
    token: data.session?.access_token || '',
  };
};

export const getCurrentUser = async (): Promise<User | null> => {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return null;
  return {
    id: data.user.id,
    name: data.user.user_metadata?.name || '',
    email: data.user.email || '',
    role: data.user.user_metadata?.role || '',
    avatar: data.user.user_metadata?.avatar_url || '',
    createdAt: data.user.created_at,
  };
};

export const logout = async (): Promise<void> => {
  await supabase.auth.signOut();
};
