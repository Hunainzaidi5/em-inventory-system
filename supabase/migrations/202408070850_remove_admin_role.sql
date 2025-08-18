-- Migration to remove 'admin' role and standardize on 'dev' for administrator/developer access

-- First, update any existing admin users to be dev users
UPDATE profiles 
SET role = 'dev' 
WHERE role = 'admin';

-- Create a new enum type without 'admin'
CREATE TYPE user_role_new AS ENUM (
  'dev', 
  'manager',
  'deputy_manager',
  'engineer',
  'assistant_engineer',
  'master_technician',
  'technician'
);

-- Update the column to use the new type
ALTER TABLE profiles 
  ALTER COLUMN role TYPE user_role_new 
  USING (role::text::user_role_new);

-- Drop the old enum
DROP TYPE user_role;

-- Rename the new enum to the original name
ALTER TYPE user_role_new RENAME TO user_role;

-- Update the default value for the role column
ALTER TABLE profiles 
  ALTER COLUMN role SET DEFAULT 'dev'::user_role;
