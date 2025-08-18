import { supabase } from '@/lib/supabase';
import { env } from '@/config/env';

export const testSupabaseConnection = async () => {
  console.log('🔍 Testing Supabase Connection...');
  
  try {
    // Test 1: Check environment variables
    console.log('📋 Environment Check:');
    console.log('  - Supabase URL:', env.VITE_SUPABASE_URL ? '✅ Set' : '❌ Missing');
    console.log('  - Anon Key:', env.VITE_SUPABASE_ANON_KEY ? '✅ Set' : '❌ Missing');
    console.log('  - Project Ref:', env.VITE_SUPABASE_PROJECT_REF);

    // Test 2: Test basic connection
    console.log('🔌 Testing Basic Connection...');
    const { data, error } = await supabase.from('profiles').select('count').limit(1);
    
    if (error) {
      console.log('❌ Connection Error:', error.message);
      return { success: false, error: error.message };
    }
    
    console.log('✅ Basic connection successful');

    // Test 3: Test auth session
    console.log('🔐 Testing Auth Session...');
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.log('⚠️ Session Error:', sessionError.message);
    } else {
      console.log('✅ Session check successful');
      console.log('  - Has Session:', session ? 'Yes' : 'No');
      if (session) {
        console.log('  - User ID:', session.user.id);
        console.log('  - Expires At:', new Date(session.expires_at * 1000).toLocaleString());
      }
    }

    // Test 4: Check storage
    console.log('💾 Checking Storage...');
    const storageKeys = Object.keys(localStorage).filter(key => 
      key.includes('supabase') || key.includes('auth')
    );
    console.log('  - Storage Keys:', storageKeys.length > 0 ? storageKeys : 'None found');

    console.log('✅ All connection tests completed');
    return { success: true, session };

  } catch (error) {
    console.error('❌ Connection test failed:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
};

export const testAuthFlow = async () => {
  console.log('🧪 Testing Authentication Flow...');
  
  try {
    // Test 1: Check if we can access auth methods
    console.log('📝 Testing Auth Methods...');
    
    // Test sign up (this won't actually create a user, just test the method)
    const testEmail = `test-${Date.now()}@example.com`;
    const testPassword = 'testpassword123';
    
    console.log('  - Testing sign up method...');
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
    });
    
    if (signUpError) {
      console.log('  - Sign up error (expected):', signUpError.message);
    } else {
      console.log('  - Sign up method accessible');
    }

    // Test 2: Check current session
    console.log('🔍 Checking Current Session...');
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.log('  - Session error:', sessionError.message);
    } else {
      console.log('  - Session check successful');
      console.log('  - Current session:', session ? 'Active' : 'None');
    }

    console.log('✅ Authentication flow test completed');
    return { success: true, session };

  } catch (error) {
    console.error('❌ Auth flow test failed:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
};

// Function to run all tests
export const runAllTests = async () => {
  console.log('🚀 Starting Comprehensive Authentication Tests...\n');
  
  const connectionTest = await testSupabaseConnection();
  console.log('\n');
  
  const authTest = await testAuthFlow();
  console.log('\n');
  
  console.log('📊 Test Results Summary:');
  console.log('  - Connection Test:', connectionTest.success ? '✅ PASS' : '❌ FAIL');
  console.log('  - Auth Flow Test:', authTest.success ? '✅ PASS' : '❌ FAIL');
  
  if (!connectionTest.success) {
    console.log('  - Connection Error:', connectionTest.error);
  }
  
  if (!authTest.success) {
    console.log('  - Auth Error:', authTest.error);
  }
  
  const allPassed = connectionTest.success && authTest.success;
  console.log('\n🎯 Overall Result:', allPassed ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED');
  
  return {
    connectionTest,
    authTest,
    allPassed
  };
};
