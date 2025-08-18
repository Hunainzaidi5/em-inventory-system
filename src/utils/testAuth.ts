import { supabase } from '@/lib/supabase';

// Test user credentials for development
export const TEST_USER = {
  email: 'test@example.com',
  password: 'testpassword123',
  name: 'Test User',
  role: 'technician' as const,
  department: 'Testing',
  employee_id: 'TEST001'
};

// Create a test user for development
export const createTestUser = async () => {
  try {
    console.log('[TEST] Creating test user...');
    
    // Check if user already exists
    const { data: existingUser } = await supabase.auth.signInWithPassword({
      email: TEST_USER.email,
      password: TEST_USER.password,
    });

    if (existingUser.user) {
      console.log('[TEST] Test user already exists');
      return { success: true, user: existingUser.user };
    }

    // Create new test user
    const { data, error } = await supabase.auth.signUp({
      email: TEST_USER.email,
      password: TEST_USER.password,
      options: {
        data: {
          name: TEST_USER.name,
          full_name: TEST_USER.name,
          role: TEST_USER.role,
          department: TEST_USER.department,
          employee_id: TEST_USER.employee_id,
        },
      },
    });

    if (error) {
      console.error('[TEST] Error creating test user:', error);
      return { success: false, error: error.message };
    }

    console.log('[TEST] Test user created successfully');
    return { success: true, user: data.user };
  } catch (error) {
    console.error('[TEST] Unexpected error creating test user:', error);
    return { success: false, error: 'Unexpected error' };
  }
};

// Sign in with test user
export const signInTestUser = async () => {
  try {
    console.log('[TEST] Signing in with test user...');
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email: TEST_USER.email,
      password: TEST_USER.password,
    });

    if (error) {
      console.error('[TEST] Error signing in test user:', error);
      return { success: false, error: error.message };
    }

    console.log('[TEST] Test user signed in successfully');
    return { success: true, user: data.user, session: data.session };
  } catch (error) {
    console.error('[TEST] Unexpected error signing in test user:', error);
    return { success: false, error: 'Unexpected error' };
  }
};

// Clear test user session
export const clearTestSession = async () => {
  try {
    console.log('[TEST] Clearing test session...');
    
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      console.error('[TEST] Error clearing session:', error);
      return { success: false, error: error.message };
    }

    console.log('[TEST] Test session cleared successfully');
    return { success: true };
  } catch (error) {
    console.error('[TEST] Unexpected error clearing session:', error);
    return { success: false, error: 'Unexpected error' };
  }
};
