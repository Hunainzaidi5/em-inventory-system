-- Fix user_role enum to include 'dev' role
-- Run this in Supabase SQL Editor

-- First, check if 'dev' role already exists
DO $$
BEGIN
    -- Try to add 'dev' to the enum if it doesn't exist
    BEGIN
        ALTER TYPE user_role ADD VALUE 'dev';
        RAISE NOTICE 'Added dev role to user_role enum';
    EXCEPTION
        WHEN duplicate_object THEN
            RAISE NOTICE 'dev role already exists in user_role enum';
    END;
END $$;

-- Alternative approach: Recreate the enum with all values
-- Uncomment the following lines if the above doesn't work:

/*
-- Drop existing enum and recreate (use with caution in production)
DROP TYPE IF EXISTS user_role CASCADE;

CREATE TYPE user_role AS ENUM (
  'admin',
  'dev', 
  'manager',
  'deputy_manager',
  'engineer',
  'assistant_engineer',
  'master_technician',
  'technician'
);

-- Recreate the profiles table role column
ALTER TABLE profiles 
ALTER COLUMN role TYPE user_role 
USING role::text::user_role;
*/