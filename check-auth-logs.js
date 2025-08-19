// check-auth-logs.js
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://xprqghjyofmsiepdzhto.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhwcnFnaGp5b2Ztc2llcGR6aHRvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTE2MzY1MiwiZXhwIjoyMDcwNzM5NjUyfQ.HtqCkxJvPRdYQ_AQUJr_M6WFNcEXqfwAPdB5G7Nm-eQ';

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function checkAuthLogs() {
  try {
    console.log('Checking auth logs...');
    
    // Check the most recent auth logs
    const { data: logs, error } = await supabase
      .from('auth_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);
      
    if (error) {
      console.error('Error fetching auth logs:', error);
      return;
    }
    
    console.log('Recent auth logs:', JSON.stringify(logs, null, 2));
    
    // Check if the users table is accessible
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('*')
      .limit(1);
      
    if (usersError) {
      console.error('Error accessing users table:', usersError);
    } else {
      console.log('Successfully accessed users table');
    }
    
  } catch (error) {
    console.error('Error in checkAuthLogs:', error);
  }
}

checkAuthLogs();