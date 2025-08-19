// fix-mfa.js
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://xprqghjyofmsiepdzhto.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhwcnFnaGp5b2Ztc2llcGR6aHRvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTE2MzY1MiwiZXhwIjoyMDcwNzM5NjUyfQ.HtqCkxJvPRdYQ_AQUJr_M6WFNcEXqfwAPdB5G7Nm-eQ';

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function fixMFATable() {
  try {
    console.log('Attempting to fix MFA table...');
    
    // First, let's check if we can access the MFA table through a function
    const { data, error } = await supabase.rpc('check_mfa_table');
    
    if (error) {
      console.log('MFA table check failed, attempting to create it...');
      await createMFATable();
      return;
    }
    
    console.log('MFA table is accessible:', data);
    
  } catch (error) {
    console.error('Error in fixMFATable:', error);
  }
}

async function createMFATable() {
  try {
    console.log('Creating MFA table...');
    
    // Create the MFA table if it doesn't exist
    const { data, error } = await supabase.rpc('create_mfa_table');
    
    if (error) {
      console.error('Error creating MFA table:', error);
      return;
    }
    
    console.log('Successfully created MFA table');
    
  } catch (error) {
    console.error('Error in createMFATable:', error);
  }
}

fixMFATable();