import { supabase } from './authService';
import { User } from '@/types/auth';

export interface UserListItem {
  id: string;
  email: string;
  full_name: string;
  role: string;
  department: string | null;
  employee_id: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string | null;
}

export const getAllUsers = async (): Promise<UserListItem[]> => {
  try {
    console.log('[DEBUG] Fetching all users from profiles table...');
    
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    console.log('[DEBUG] Raw response from getAllUsers:', { data, error });

    if (error) {
      console.error('Error fetching users:', error);
      throw new Error(error.message);
    }

    console.log('[DEBUG] Successfully fetched users count:', data?.length || 0);
    return data || [];
  } catch (error) {
    console.error('Error in getAllUsers:', error);
    throw error;
  }
};

export const updateUserStatus = async (userId: string, isActive: boolean): Promise<void> => {
  try {
    const { error } = await supabase
      .from('profiles')
      .update({ 
        is_active: isActive,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);

    if (error) {
      console.error('Error updating user status:', error);
      throw new Error(error.message);
    }
  } catch (error) {
    console.error('Error in updateUserStatus:', error);
    throw error;
  }
};

export const deleteUser = async (userId: string): Promise<void> => {
  try {
    // First delete from profiles table
    const { error: profileError } = await supabase
      .from('profiles')
      .delete()
      .eq('id', userId);

    if (profileError) {
      console.error('Error deleting user profile:', profileError);
      throw new Error(profileError.message);
    }

    // Note: Supabase auth user will be automatically deleted due to CASCADE
  } catch (error) {
    console.error('Error in deleteUser:', error);
    throw error;
  }
};