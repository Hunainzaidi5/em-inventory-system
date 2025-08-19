// check-db-settings.js
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://xprqghjyofmsiepdzhto.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhwcnFnaGp5b2Ztc2llcGR6aHRvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTE2MzY1MiwiZXhwIjoyMDcwNzM5NjUyfQ.HtqCkxJvPRdYQ_AQUJr_M6WFNcEXqfwAPdB5G7Nm-eQ';

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function checkDbSettings() {
  try {
    console.log('Checking database settings...');
    
    // Check database connection
    const { data: dbVersion, error: versionError } = await supabase.rpc('version');
    
    if (versionError) {
      console.error('Error getting database version:', versionError);
    } else {
      console.log('Database version:', dbVersion);
    }
    
    // Check if we can query the auth schema
    const { data: authTables, error: tablesError } = await supabase
      .from('pg_tables')
      .select('tablename')
      .eq('schemaname', 'auth');
      
    if (tablesError) {
      console.error('Error querying auth tables:', tablesError);
    } else {
      console.log('Auth tables:', authTables.map(t => t.tablename).join(', '));
    }
    
  } catch (error) {
    console.error('Error in checkDbSettings:', error);
  }
}

checkDbSettings();