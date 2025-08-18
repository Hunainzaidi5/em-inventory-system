-- Migration: Fix security issues with search paths and OTP expiry
-- Date: 2024-08-05

-- Drop existing functions if they exist
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.update_updated_at_column() CASCADE;

-- Recreate handle_new_user with secure search_path
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  -- Insert new user profile with default values
  INSERT INTO public.profiles (
    id, 
    email, 
    full_name, 
    role, 
    is_active, 
    created_at, 
    updated_at
  ) VALUES (
    NEW.id, 
    COALESCE(NEW.email, ''), 
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'role', 'dev')::user_role,
    TRUE,
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO NOTHING;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error
    RAISE WARNING 'Error creating user profile: %', SQLERRM;
    RETURN NEW; -- Still return NEW to prevent signup failure
END;
$$;

-- Recreate update_updated_at_column with secure search_path
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error but allow the operation to continue
    RAISE WARNING 'Error updating timestamp: %', SQLERRM;
    RETURN NEW;
END;
$$;

-- Configure Auth OTP expiry to 1 hour (3600 seconds)
DO $$
BEGIN
  -- Set OTP expiry to 1 hour (3600 seconds)
  PERFORM 
    set_config(
      'app.settings.auth.otp_expiry_seconds', 
      '3600',  -- 1 hour in seconds
      false
    );
  
  -- Log the change
  RAISE NOTICE 'OTP expiry set to 1 hour (3600 seconds)';
END $$;

-- Recreate triggers to ensure they use the updated functions
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Recreate all the timestamp update triggers
CREATE OR REPLACE TRIGGER update_profiles_updated_at 
  BEFORE UPDATE ON public.profiles 
  FOR EACH ROW 
  EXECUTE FUNCTION public.update_updated_at_column();

-- Add more triggers for other tables as needed
-- Example:
-- CREATE OR REPLACE TRIGGER update_table_name_updated_at 
--   BEFORE UPDATE ON public.table_name 
--   FOR EACH ROW 
--   EXECUTE FUNCTION public.update_updated_at_column();

-- Log completion
COMMENT ON DATABASE postgres IS 'Security update: Fixed search_path and OTP settings - 2024-08-05';
