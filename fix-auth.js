// fix-auth.js
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://xprqghjyofmsiepdzhto.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhwcnFnaGp5b2Ztc2llcGR6aHRvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTE2MzY1MiwiZXhwIjoyMDcwNzM5NjUyfQ.HtqCkxJvPRdYQ_AQUJr_M6WFNcEXqfwAPdB5G7Nm-eQ';

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function fixAuthSchema() {
  try {
    console.log('Initializing Supabase Admin API...');
    
    // Use the admin API
    const adminAuthClient = supabase.auth.admin;
    
    // List users to test admin access
    const { data: users, error: listError } = await adminAuthClient.listUsers();
    
    if (listError) {
      console.error('Error accessing admin API:', listError.message);
      return;
    }
    
    console.log('Successfully connected to Supabase Admin API');
    console.log('Total users:', users.users.length);
    
    // Try to create a test user (this requires admin privileges)
    const testEmail = `test-${Date.now()}@example.com`;
    const testPassword = 'Test@1234';
    
    const { data: newUser, error: createError } = await adminAuthClient.createUser({
      email: testEmail,
      password: testPassword,
      email_confirm: true
    });
    
    if (createError) {
      console.error('Error creating test user:', createError.message);
      return;
    }
    
    console.log('Successfully created test user:', newUser.user.email);
    
    // Now try to sign in with the test user
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: testEmail,
      password: testPassword
    });
    
    if (signInError) {
      console.error('Error signing in test user:', signInError.message);
      return;
    }
    
    console.log('Successfully signed in test user:', signInData.user.email);
    
    // Clean up - delete the test user
    await adminAuthClient.deleteUser(newUser.user.id);
    console.log('Cleaned up test user');
    
  } catch (error) {
    console.error('Error in fixAuthSchema:', error);
  }
}

fixAuthSchema();