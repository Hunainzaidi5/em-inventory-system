import { supabase } from './authService';

export const testDatabaseAccess = async () => {
  try {
    console.log('[TEST] Testing database access...');
    
    // Test auth state
    const { data: authData, error: authError } = await supabase.auth.getUser();
    console.log('[TEST] Auth state:', { user: authData.user?.email, error: authError });
    
    // Test session
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    console.log('[TEST] Session state:', { 
      hasSession: !!sessionData.session, 
      error: sessionError 
    });
    
    // Test profiles table access
    const { data: profilesData, error: profilesError } = await supabase
      .from('profiles')
      .select('id, email, full_name, role')
      .limit(5);
    
    console.log('[TEST] Profiles query result:', { 
      count: profilesData?.length || 0, 
      data: profilesData,
      error: profilesError 
    });
    
    // Test with count
    const { count, error: countError } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true });
    
    console.log('[TEST] Profiles count:', { count, error: countError });
    
    return {
      auth: { user: authData.user?.email, error: authError },
      session: { hasSession: !!sessionData.session, error: sessionError },
      profiles: { count: profilesData?.length || 0, error: profilesError },
      totalCount: { count, error: countError }
    };
  } catch (error) {
    console.error('[TEST] Exception during database test:', error);
    return { error: error instanceof Error ? error.message : 'Unknown error' };
  }
};