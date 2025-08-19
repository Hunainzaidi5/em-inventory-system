// check-db.js
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://xprqghjyofmsiepdzhto.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhwcnFnaGp5b2Ztc2llcGR6aHRvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTE2MzY1MiwiZXhwIjoyMDcwNzM5NjUyfQ.HtqCkxJvPRdYQ_AQUJr_M6WFNcEXqfwAPdB5G7Nm-eQ';

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function checkDatabase() {
  try {
    console.log('Testing database connection...');
    
    // Test a simple query to the public schema
    const { data: testData, error: testError } = await supabase
      .from('profiles')
      .select('*')
      .limit(1);
      
    if (testError) {
      console.error('Error querying profiles table:', testError);
    } else {
      console.log('Successfully queried profiles table');
      console.log('First profile:', testData[0]);
    }
    
    // Test auth.users table access
    const { data: authUsers, error: authError } = await supabase
      .from('users')
      .select('*')
      .limit(1);
      
    if (authError) {
      console.error('Error querying auth.users:', authError);
    } else {
      console.log('Successfully queried auth.users table');
      console.log('First user:', authUsers[0]);
    }
    
  } catch (error) {
    console.error('Error in checkDatabase:', error);
  }
}

checkDatabase();