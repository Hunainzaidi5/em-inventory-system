// scripts/fix-auth-schema.ts
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function fixMFATable() {
  try {
    // Add the foreign key constraint
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE auth.mfa_amr_claims
        ADD CONSTRAINT mfa_amr_claims_session_id_fkey
        FOREIGN KEY (session_id) 
        REFERENCES auth.sessions(id) 
        ON DELETE CASCADE;
      `
    })
    
    if (error) throw error
    console.log('Successfully added foreign key constraint')
    
    // Add unique constraint
    await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE auth.mfa_amr_claims
        ADD CONSTRAINT mfa_amr_claims_session_id_authentication_method_key
        UNIQUE (session_id, authentication_method);
      `
    })
    
    console.log('Successfully added unique constraint')
    
  } catch (error) {
    console.error('Error fixing MFA table:', error)
  }
}

fixMFATable()