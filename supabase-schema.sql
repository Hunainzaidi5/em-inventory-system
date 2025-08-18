-- E&M Inventory Management System Database Schema
-- Run this SQL in your Supabase SQL Editor after setting up your project

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create custom types/enums
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type t
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE t.typname = 'user_role' AND n.nspname = 'public'
  ) THEN
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
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type t
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE t.typname = 'item_category' AND n.nspname = 'public'
  ) THEN
CREATE TYPE item_category AS ENUM ('O&M', 'PMA');
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type t
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE t.typname = 'system_type' AND n.nspname = 'public'
  ) THEN
CREATE TYPE system_type AS ENUM (
  'Elevator',
  'Escalator', 
  'PSD',
  'HVAC',
  'WSD',
  'LV',
  'FAS',
  'FES'
);
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type t
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE t.typname = 'requisition_type' AND n.nspname = 'public'
  ) THEN
CREATE TYPE requisition_type AS ENUM ('issue', 'return', 'consume');
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type t
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE t.typname = 'item_status' AND n.nspname = 'public'
  ) THEN
CREATE TYPE item_status AS ENUM ('available', 'issued', 'consumed', 'faulty');
  END IF;
END
$$;

-- Removed unused ppe_type enum

-- User profiles table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  role user_role NOT NULL DEFAULT 'dev',
  department TEXT,
  employee_id TEXT UNIQUE,
  is_active BOOLEAN DEFAULT false, -- New users are inactive by default
  last_login_at TIMESTAMP WITH TIME ZONE,
  last_login_ip INET,
  failed_login_attempts INTEGER DEFAULT 0,
  account_locked_until TIMESTAMP WITH TIME ZONE,
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE
);

-- Audit log for user management actions
CREATE TABLE IF NOT EXISTS user_audit_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  action_details JSONB,
  ip_address INET,
  user_agent TEXT,
  performed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Allowed IPs for admin/dev access
CREATE TABLE IF NOT EXISTS allowed_ips (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ip_address INET NOT NULL,
  description TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(ip_address)
);

-- Enable RLS on profiles table
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_profiles_email_lower ON profiles(LOWER(email));
CREATE INDEX IF NOT EXISTS idx_profiles_employee_id ON profiles(employee_id) WHERE employee_id IS NOT NULL;

-- Create index for audit log performance
CREATE INDEX IF NOT EXISTS idx_user_audit_log_user_id ON user_audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_user_audit_log_action ON user_audit_log(action);
CREATE INDEX IF NOT EXISTS idx_user_audit_log_performed_at ON user_audit_log(performed_at);

-- Relax email uniqueness to avoid invite/create conflicts; use non-unique index instead
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE table_schema = 'public'
      AND table_name = 'profiles'
      AND constraint_type = 'UNIQUE'
      AND constraint_name = 'profiles_email_key'
  ) THEN
    ALTER TABLE profiles DROP CONSTRAINT profiles_email_key;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_class WHERE relname = 'idx_profiles_email'
  ) THEN
    CREATE INDEX idx_profiles_email ON profiles(email);
  END IF;
END
$$;

-- Create policies for profiles
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
CREATE POLICY "Users can view their own profile" 
  ON profiles FOR SELECT 
  USING (auth.uid() = id);

-- Devs can view all profiles
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Devs can view all profiles" ON profiles;
CREATE POLICY "Devs can view all profiles"
  ON profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles p 
      WHERE p.id = auth.uid() 
      AND p.role = 'dev'
    )
  );

-- Users can update their own non-sensitive fields
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
CREATE POLICY "Users can update their own profile" 
  ON profiles FOR UPDATE 
  USING (
    auth.uid() = id AND 
    (
      -- Can only update these fields
      (
        current_setting('request.headers', true)::json->>'x-action' = 'update_profile' AND
        (
          SELECT COUNT(*) FROM jsonb_object_keys(current_setting('request.body', true)::jsonb) AS j(k)
          WHERE k NOT IN ('full_name', 'department', 'employee_id')
        ) = 0
      ) OR
      -- Or if updating last login info
      (
        current_setting('request.headers', true)::json->>'x-action' = 'update_last_login' AND
        (
          SELECT COUNT(*) FROM jsonb_object_keys(current_setting('request.body', true)::jsonb) AS j(k)
          WHERE k NOT IN ('last_login_at', 'last_login_ip', 'failed_login_attempts', 'account_locked_until')
        ) = 0
      )
    )
  );

-- Remove admin update policy; only devs have full access below
DROP POLICY IF EXISTS "Admins can update non-dev profiles" ON profiles;

-- Devs have full access to all profiles
DROP POLICY IF EXISTS "Devs have full access to profiles" ON profiles;
CREATE POLICY "Devs have full access to profiles"
  ON profiles FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles p 
      WHERE p.id = auth.uid() 
      AND p.role = 'dev'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles p 
      WHERE p.id = auth.uid() 
      AND p.role = 'dev'
    )
  );

-- Only allow profile deletion by devs
DROP POLICY IF EXISTS "Only devs can delete profiles" ON profiles;
CREATE POLICY "Only devs can delete profiles"
  ON profiles FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles p 
      WHERE p.id = auth.uid() 
      AND p.role = 'dev'
    )
  );

-- Only allow profile creation through the handle_new_user function
DROP POLICY IF EXISTS "Only handle_new_user can insert profiles" ON profiles;
CREATE POLICY "Only handle_new_user can insert profiles"
  ON profiles FOR INSERT
  WITH CHECK (false); -- No direct inserts allowed

-- Allow service role to bypass RLS for migrations and admin operations
ALTER TABLE profiles FORCE ROW LEVEL SECURITY;
ALTER TABLE user_audit_log FORCE ROW LEVEL SECURITY;

-- Create function to check if IP is allowed for admin access
CREATE OR REPLACE FUNCTION is_admin_ip_allowed()
RETURNS boolean AS $$
BEGIN
  -- Allow all IPs in development
  IF current_setting('app.settings.environment', true) = 'development' THEN
    RETURN true;
  END IF;
  
  -- Check if the IP is in the allowed_ips table
  RETURN EXISTS (
    SELECT 1 
    FROM allowed_ips 
    WHERE ip_address = inet_client_addr()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to log user actions
CREATE OR REPLACE FUNCTION log_user_action(
  p_user_id UUID,
  p_action TEXT,
  p_details JSONB DEFAULT NULL
) 
RETURNS void AS $$
BEGIN
  INSERT INTO user_audit_log (
    user_id,
    action,
    action_details,
    ip_address,
    user_agent
  ) VALUES (
    p_user_id,
    p_action,
    p_details,
    inet_client_addr(),
    current_setting('request.headers', true)::json->>'user-agent'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update last login timestamp and IP
CREATE OR REPLACE FUNCTION public.update_last_login(
  p_user_id UUID,
  p_ip_address INET
) 
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE profiles
  SET 
    last_login_at = NOW(),
    last_login_ip = p_ip_address,
    updated_at = NOW()
  WHERE id = p_user_id;
  
  -- Reset failed login attempts on successful login
  UPDATE profiles
  SET 
    failed_login_attempts = 0,
    account_locked_until = NULL,
    updated_at = NOW()
  WHERE id = p_user_id;
END;
$$;

-- Function to handle new user signups
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER
AS $$
DECLARE
  inviter_id UUID;
  inviter_role user_role;
  new_user_role user_role;
  is_self_signup BOOLEAN;
  activate_now BOOLEAN;
BEGIN
  -- Set a secure search path
  SET search_path = public, pg_temp;
  
  -- Check if this is a self-signup (no inviter)
  is_self_signup := (NEW.raw_user_meta_data->>'is_self_signup')::boolean = true;
  
  -- Get inviter info if available
  IF NOT is_self_signup AND NEW.raw_user_meta_data->>'invited_by' IS NOT NULL THEN
    inviter_id := (NEW.raw_user_meta_data->>'invited_by')::UUID;
    SELECT role INTO inviter_role FROM profiles WHERE id = inviter_id;
  END IF;
  
  -- Determine user role based on inviter's role
  IF is_self_signup THEN
    new_user_role := 'dev';
    IF NOT EXISTS (SELECT 1 FROM profiles WHERE role = 'dev') THEN
      -- First user becomes dev if no devs exist
      new_user_role := 'dev';
      NEW.raw_user_meta_data := jsonb_set(
        COALESCE(NEW.raw_user_meta_data, '{}'::jsonb),
        '{role}',
        to_jsonb('dev'::text)
      );
      -- Activate the first dev account immediately
      activate_now := true;
    ELSE
      activate_now := false;
    END IF;
  ELSE
    -- Default to dev role for new users
    new_user_role := 'dev';
    
    -- Only allow creating users with equal or lower privilege
    IF inviter_role = 'admin' AND NEW.raw_user_meta_data->>'role' IS NOT NULL THEN
      new_user_role := LEAST(NEW.raw_user_meta_data->>'role', 'deputy_manager')::user_role;
    ELSIF inviter_role = 'dev' AND NEW.raw_user_meta_data->>'role' IS NOT NULL THEN
      new_user_role := (NEW.raw_user_meta_data->>'role')::user_role;
    END IF;
  END IF;
  
  -- For development, activate all users by default
  -- In production, you might want to implement email verification first
  IF current_setting('app.settings.environment', true) = 'development' THEN
    activate_now := true;
  ELSE
    -- In production, only activate if invited or first dev
    IF activate_now IS NULL THEN
      activate_now := NOT is_self_signup; -- Active if invited, inactive if self-signup
    END IF;
  END IF;

  -- Insert new user profile
  INSERT INTO public.profiles (
    id, 
    email, 
    full_name, 
    role, 
    is_active,
    created_by,
    updated_by,
    created_at, 
    updated_at
  ) VALUES (
    NEW.id, 
    COALESCE(NEW.email, ''), 
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    new_user_role,
    activate_now,
    inviter_id,
    inviter_id,
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    updated_at = NOW();
  
  -- Log the user creation
  INSERT INTO user_audit_log (
    user_id, 
    action, 
    action_details,
    ip_address,
    user_agent
  ) VALUES (
    NEW.id,
    CASE WHEN is_self_signup THEN 'self_signup' ELSE 'user_created' END,
    jsonb_build_object(
      'email', NEW.email,
      'role', new_user_role,
      'invited_by', inviter_id,
      'is_active', NOT is_self_signup
    ),
    inet_client_addr(),
    current_setting('request.headers', true)::json->>'user-agent'
  );
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error
    INSERT INTO user_audit_log (
      user_id,
      action,
      action_details,
      ip_address,
      user_agent
    ) VALUES (
      NEW.id,
      'user_creation_failed',
      jsonb_build_object(
        'error', SQLERRM,
        'email', COALESCE(NEW.email, 'unknown'),
        'stack', pg_exception_context()
      ),
      inet_client_addr(),
      current_setting('request.headers', true)::json->>'user-agent'
    );
    
    RAISE WARNING 'Error creating user profile: %', SQLERRM;
    RETURN NEW; -- Still return NEW to prevent signup failure
END;
$$;

-- Trigger the function every time a user is created
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to handle user updates
CREATE OR REPLACE FUNCTION public.handle_user_updated() 
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.profiles
  SET 
    email = NEW.email,
    updated_at = NOW()
  WHERE id = NEW.id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger the function every time a user is updated
DROP TRIGGER IF EXISTS on_auth_user_updated ON auth.users;
CREATE TRIGGER on_auth_user_updated
  AFTER UPDATE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_user_updated();

-- Locations table
CREATE TABLE IF NOT EXISTS locations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  address TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default locations
INSERT INTO locations (name, description)
SELECT v.name, v.description
FROM (VALUES
('GMG Warehouse', 'Main warehouse facility'),
('E&M Systems Ground Floor Store', 'Ground floor storage area'),
  ('E&M Systems 2nd Floor Store', 'Second floor storage area')
) AS v(name, description)
WHERE NOT EXISTS (
  SELECT 1 FROM locations l WHERE l.name = v.name
);

-- Categories table
CREATE TABLE IF NOT EXISTS categories (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name item_category NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default categories
INSERT INTO categories (name, description)
SELECT v.name::item_category, v.description
FROM (VALUES
('O&M', 'Operations and Maintenance parts'),
  ('PMA', 'Punjab Mass Transit Authority parts')
) AS v(name, description)
WHERE NOT EXISTS (
  SELECT 1 FROM categories c WHERE c.name = v.name::item_category
);

-- App settings for environment controls (dev/prod)
CREATE TABLE IF NOT EXISTS app_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

-- Default environment is 'prod'; override to 'dev' locally to enable dev-only seeds
INSERT INTO app_settings(key, value)
SELECT 'env', 'prod'
WHERE NOT EXISTS (SELECT 1 FROM app_settings WHERE key = 'env');

-- Systems table
CREATE TABLE IF NOT EXISTS systems (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name system_type NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default systems
INSERT INTO systems (name, description)
SELECT v.name::system_type, v.description
FROM (VALUES
('Elevator', 'Elevator system components'),
('Escalator', 'Escalator system components'),
('PSD', 'Platform Screen Door system components'),
('HVAC', 'Heating, Ventilation, and Air Conditioning components'),
('WSD', 'Water Supply and Drainage components'),
('LV', 'Low Voltage electrical components'),
('FAS', 'Fire Alarm System components'),
  ('FES', 'Fire Extinguishing System components')
) AS v(name, description)
WHERE NOT EXISTS (
  SELECT 1 FROM systems s WHERE s.name = v.name::system_type
);

-- Inventory items table
CREATE TABLE IF NOT EXISTS inventory_items (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  part_name TEXT NOT NULL,
  partNumber TEXT UNIQUE,
  description TEXT,
  category_id UUID REFERENCES categories(id) ON DELETE RESTRICT NOT NULL,
  system_id UUID REFERENCES systems(id) ON DELETE RESTRICT NOT NULL,
  location_id UUID REFERENCES locations(id) ON DELETE RESTRICT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 0 CHECK (quantity >= 0),
  min_stock_level INTEGER DEFAULT 0,
  max_stock_level INTEGER,
  unit_price DECIMAL(10,2),
  supplier TEXT,
  part_type TEXT,
  specifications JSONB,
  status item_status DEFAULT 'available',
  qr_code TEXT,
  notes TEXT,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on inventory_items table
ALTER TABLE inventory_items ENABLE ROW LEVEL SECURITY;

-- Example RLS policy for inventory_items (adjust as needed)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'inventory_items' AND policyname = 'Users can view all inventory items'
  ) THEN
CREATE POLICY "Users can view all inventory items" 
  ON inventory_items FOR SELECT 
  USING (true);
  END IF;
END $$;

-- Spare parts table (for bulk reseed/import and spare management)
CREATE TABLE IF NOT EXISTS spare_parts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  belongsto TEXT,
  quantity INTEGER NOT NULL DEFAULT 0 CHECK (quantity >= 0),
  location TEXT,
  itemCode TEXT,
  imis_code TEXT,
  uom TEXT,
  partNumber TEXT,
  category TEXT,
  boq_number TEXT,
  lastUpdated TIMESTAMP WITH TIME ZONE,
  last_updated TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE spare_parts ENABLE ROW LEVEL SECURITY;

-- RLS: allow read for all, writes for authenticated
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='spare_parts' AND policyname='Read spare_parts'
  ) THEN
    CREATE POLICY "Read spare_parts" ON spare_parts FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='spare_parts' AND policyname='Write spare_parts'
  ) THEN
    CREATE POLICY "Write spare_parts" ON spare_parts FOR INSERT WITH CHECK (auth.role() = 'authenticated');
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='spare_parts' AND policyname='Update spare_parts'
  ) THEN
    CREATE POLICY "Update spare_parts" ON spare_parts FOR UPDATE USING (auth.role() = 'authenticated');
  END IF;
END $$;

-- Ensure camelCase columns exist for reseed payload compatibility
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema='public' AND table_name='spare_parts'
  ) THEN
    -- itemCode
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema='public' AND table_name='spare_parts' AND column_name='itemCode'
    ) THEN
      ALTER TABLE spare_parts ADD COLUMN "itemCode" TEXT;
    END IF;
    -- partNumber
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema='public' AND table_name='spare_parts' AND column_name='partNumber'
    ) THEN
      ALTER TABLE spare_parts ADD COLUMN "partNumber" TEXT;
    END IF;
    -- lastUpdated
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema='public' AND table_name='spare_parts' AND column_name='lastUpdated'
    ) THEN
      ALTER TABLE spare_parts ADD COLUMN "lastUpdated" TIMESTAMPTZ;
    END IF;
  END IF;
END
$$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'inventory_items' AND policyname = 'Users can insert their own inventory items'
  ) THEN
CREATE POLICY "Users can insert their own inventory items" 
  ON inventory_items FOR INSERT 
  WITH CHECK (auth.role() = 'authenticated');
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'inventory_items' AND policyname = 'Users can update their own inventory items'
  ) THEN
CREATE POLICY "Users can update their own inventory items" 
  ON inventory_items FOR UPDATE 
  USING (auth.uid() = created_by);
  END IF;
END $$;

-- Tools table (aligns with Tools page structure)
CREATE TABLE IF NOT EXISTS tools (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  item_name TEXT NOT NULL,
  item_description TEXT,
  item_location TEXT,
  quantity INTEGER NOT NULL DEFAULT 0 CHECK (quantity >= 0),
  -- Issued To fields
  issued_to_name TEXT,
  issued_to_olt TEXT,
  issued_to_designation TEXT,
  issued_to_group TEXT,
  status item_status DEFAULT 'available',
  notes TEXT,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on tools table
ALTER TABLE tools ENABLE ROW LEVEL SECURITY;

-- RLS policies for tools
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'tools' AND policyname = 'Users can view all tools'
  ) THEN
    CREATE POLICY "Users can view all tools" ON tools FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'tools' AND policyname = 'Authenticated users can insert tools'
  ) THEN
    CREATE POLICY "Authenticated users can insert tools" ON tools FOR INSERT WITH CHECK (auth.role() = 'authenticated');
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'tools' AND policyname = 'Creators can update their tools'
  ) THEN
    CREATE POLICY "Creators can update their tools" ON tools FOR UPDATE USING (auth.uid() = created_by);
  END IF;
END $$;

-- General Tools table (aligns with General Tools page structure)
CREATE TABLE IF NOT EXISTS general_tools (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  item_name TEXT NOT NULL,
  item_description TEXT,
  item_location TEXT,
  quantity INTEGER NOT NULL DEFAULT 0 CHECK (quantity >= 0),
  -- Issued To fields
  issued_to_name TEXT,
  issued_to_olt TEXT,
  issued_to_designation TEXT,
  issued_to_group TEXT,
  status item_status DEFAULT 'available',
  notes TEXT,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on general_tools table
ALTER TABLE general_tools ENABLE ROW LEVEL SECURITY;

-- RLS policies for general_tools
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'general_tools' AND policyname = 'Users can view all general_tools'
  ) THEN
    CREATE POLICY "Users can view all general_tools" ON general_tools FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'general_tools' AND policyname = 'Authenticated users can insert general_tools'
  ) THEN
    CREATE POLICY "Authenticated users can insert general_tools" ON general_tools FOR INSERT WITH CHECK (auth.role() = 'authenticated');
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'general_tools' AND policyname = 'Creators can update their general_tools'
  ) THEN
    CREATE POLICY "Creators can update their general_tools" ON general_tools FOR UPDATE USING (auth.uid() = created_by);
  END IF;
END $$;

-- PPE items table (Updated to match React implementation)
CREATE TABLE IF NOT EXISTS ppe_items (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  item_name TEXT NOT NULL,
  item_description TEXT,
  item_location TEXT,
  quantity INTEGER NOT NULL DEFAULT 0 CHECK (quantity >= 0),
  -- Issued To fields
  issued_to_name TEXT,
  issued_to_olt TEXT,
  issued_to_designation TEXT,
  issued_to_group TEXT,
  status item_status DEFAULT 'available',
  notes TEXT,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on ppe_items table
ALTER TABLE ppe_items ENABLE ROW LEVEL SECURITY;

-- RLS policies for ppe_items
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'ppe_items' AND policyname = 'Users can view all ppe items'
  ) THEN
    CREATE POLICY "Users can view all ppe items" ON ppe_items FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'ppe_items' AND policyname = 'Authenticated users can insert ppe items'
  ) THEN
    CREATE POLICY "Authenticated users can insert ppe items" ON ppe_items FOR INSERT WITH CHECK (auth.role() = 'authenticated');
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'ppe_items' AND policyname = 'Creators can update their ppe items'
  ) THEN
    CREATE POLICY "Creators can update their ppe items" ON ppe_items FOR UPDATE USING (auth.uid() = created_by);
  END IF;
END $$;

-- Stationery items table (Updated to match React implementation)
CREATE TABLE IF NOT EXISTS stationery_items (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  item_name TEXT NOT NULL,
  item_description TEXT,
  item_type TEXT,
  item_location TEXT,
  quantity INTEGER NOT NULL DEFAULT 0 CHECK (quantity >= 0),
  -- Issued To fields
  issued_to_name TEXT,
  issued_to_olt TEXT,
  issued_to_designation TEXT,
  issued_to_group TEXT,
  status item_status DEFAULT 'available',
  notes TEXT,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on stationery_items table
ALTER TABLE stationery_items ENABLE ROW LEVEL SECURITY;

-- RLS policies for stationery_items
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'stationery_items' AND policyname = 'Users can view all stationery items'
  ) THEN
    CREATE POLICY "Users can view all stationery items" ON stationery_items FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'stationery_items' AND policyname = 'Authenticated users can insert stationery items'
  ) THEN
    CREATE POLICY "Authenticated users can insert stationery items" ON stationery_items FOR INSERT WITH CHECK (auth.role() = 'authenticated');
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'stationery_items' AND policyname = 'Creators can update their stationery items'
  ) THEN
    CREATE POLICY "Creators can update their stationery items" ON stationery_items FOR UPDATE USING (auth.uid() = created_by);
  END IF;
END $$;

-- Faulty Returns table (New table to match React implementation)
CREATE TABLE IF NOT EXISTS faulty_returns (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  item_name TEXT NOT NULL,
  boq_number TEXT,
  partNumber TEXT,
  uom TEXT,
  quantity INTEGER NOT NULL DEFAULT 0 CHECK (quantity >= 0),
  used_against TEXT NOT NULL,
  pick_up_location TEXT NOT NULL,
  storage_location TEXT NOT NULL,
  status TEXT DEFAULT 'pending', -- 'pending', 'resolved', 'disposed'
  notes TEXT,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on faulty_returns table
ALTER TABLE faulty_returns ENABLE ROW LEVEL SECURITY;

-- Requisition table (for all item types)
CREATE TABLE IF NOT EXISTS requisition (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  requisition_type requisition_type NOT NULL,
  item_type TEXT NOT NULL, -- 'inventory', 'tool', 'ppe', 'stationery'
  item_id UUID NOT NULL, -- references the specific item table
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  issued_to UUID REFERENCES profiles(id),
  issued_by UUID REFERENCES profiles(id) NOT NULL,
  department TEXT,
  purpose TEXT,
  return_date DATE,
  actual_return_date DATE,
  condition_on_return TEXT,
  notes TEXT,
  reference_number TEXT UNIQUE,
  status TEXT DEFAULT 'pending', -- 'pending', 'completed', 'overdue'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Gate passes table
CREATE TABLE IF NOT EXISTS gate_passes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  pass_number TEXT UNIQUE NOT NULL,
  requester_name TEXT NOT NULL,
  department TEXT NOT NULL,
  destination TEXT NOT NULL,
  purpose TEXT NOT NULL,
  items_description TEXT NOT NULL,
  quantity_summary TEXT,
  expected_return_date DATE,
  approval_status TEXT DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
  approved_by UUID REFERENCES profiles(id),
  approval_date DATE,
  qr_code TEXT,
  pdf_url TEXT,
  is_active BOOLEAN DEFAULT true,
  notes TEXT,
  created_by UUID REFERENCES profiles(id) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- issuance records table
CREATE TABLE IF NOT EXISTS issuance_records (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  policy_number TEXT UNIQUE NOT NULL,
  issuance_provider TEXT NOT NULL,
  policy_type TEXT NOT NULL,
  coverage_description TEXT,
  premium_amount DECIMAL(10,2),
  coverage_amount DECIMAL(12,2),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  renewal_date DATE,
  linked_item_type TEXT, -- 'inventory', 'tool', etc.
  linked_item_id UUID,
  status TEXT DEFAULT 'active', -- 'active', 'expired', 'cancelled'
  renewal_reminder_sent BOOLEAN DEFAULT false,
  documents JSONB, -- store document URLs/references
  notes TEXT,
  created_by UUID REFERENCES profiles(id) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Audit log table for tracking all changes
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  table_name TEXT NOT NULL,
  record_id UUID NOT NULL,
  action TEXT NOT NULL, -- 'INSERT', 'UPDATE', 'DELETE'
  old_values JSONB,
  new_values JSONB,
  changed_by UUID REFERENCES profiles(id),
  changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ensure required columns exist on legacy tables (idempotent)
DO $$
BEGIN
  -- tools.item_location
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'tools'
  ) THEN
    -- tools.issued_to_* and status
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' AND table_name = 'tools' AND column_name = 'issued_to_name'
    ) THEN
      ALTER TABLE tools ADD COLUMN issued_to_name TEXT;
    END IF;
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' AND table_name = 'tools' AND column_name = 'issued_to_olt'
    ) THEN
      ALTER TABLE tools ADD COLUMN issued_to_olt TEXT;
    END IF;
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' AND table_name = 'tools' AND column_name = 'issued_to_designation'
    ) THEN
      ALTER TABLE tools ADD COLUMN issued_to_designation TEXT;
    END IF;
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' AND table_name = 'tools' AND column_name = 'issued_to_group'
    ) THEN
      ALTER TABLE tools ADD COLUMN issued_to_group TEXT;
    END IF;
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' AND table_name = 'tools' AND column_name = 'status'
    ) THEN
      ALTER TABLE tools ADD COLUMN status item_status DEFAULT 'available';
    END IF;
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' AND table_name = 'tools' AND column_name = 'item_location'
    ) THEN
      ALTER TABLE tools ADD COLUMN item_location TEXT;
    END IF;
  END IF;

  -- general_tools.item_location
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'general_tools'
  ) THEN
    -- general_tools.issued_to_* and status
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' AND table_name = 'general_tools' AND column_name = 'issued_to_name'
    ) THEN
      ALTER TABLE general_tools ADD COLUMN issued_to_name TEXT;
    END IF;
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' AND table_name = 'general_tools' AND column_name = 'issued_to_olt'
    ) THEN
      ALTER TABLE general_tools ADD COLUMN issued_to_olt TEXT;
    END IF;
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' AND table_name = 'general_tools' AND column_name = 'issued_to_designation'
    ) THEN
      ALTER TABLE general_tools ADD COLUMN issued_to_designation TEXT;
    END IF;
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' AND table_name = 'general_tools' AND column_name = 'issued_to_group'
    ) THEN
      ALTER TABLE general_tools ADD COLUMN issued_to_group TEXT;
    END IF;
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' AND table_name = 'general_tools' AND column_name = 'status'
    ) THEN
      ALTER TABLE general_tools ADD COLUMN status item_status DEFAULT 'available';
    END IF;
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' AND table_name = 'general_tools' AND column_name = 'item_location'
    ) THEN
      ALTER TABLE general_tools ADD COLUMN item_location TEXT;
    END IF;
  END IF;

  -- ppe_items.item_location
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'ppe_items'
  ) THEN
    -- ppe_items.issued_to_* and status
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' AND table_name = 'ppe_items' AND column_name = 'issued_to_name'
    ) THEN
      ALTER TABLE ppe_items ADD COLUMN issued_to_name TEXT;
    END IF;
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' AND table_name = 'ppe_items' AND column_name = 'issued_to_olt'
    ) THEN
      ALTER TABLE ppe_items ADD COLUMN issued_to_olt TEXT;
    END IF;
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' AND table_name = 'ppe_items' AND column_name = 'issued_to_designation'
    ) THEN
      ALTER TABLE ppe_items ADD COLUMN issued_to_designation TEXT;
    END IF;
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' AND table_name = 'ppe_items' AND column_name = 'issued_to_group'
    ) THEN
      ALTER TABLE ppe_items ADD COLUMN issued_to_group TEXT;
    END IF;
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' AND table_name = 'ppe_items' AND column_name = 'status'
    ) THEN
      ALTER TABLE ppe_items ADD COLUMN status item_status DEFAULT 'available';
    END IF;
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' AND table_name = 'ppe_items' AND column_name = 'item_location'
    ) THEN
      ALTER TABLE ppe_items ADD COLUMN item_location TEXT;
    END IF;
  END IF;

  -- stationery_items.item_location
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'stationery_items'
  ) THEN
    -- stationery_items.issued_to_* and status
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' AND table_name = 'stationery_items' AND column_name = 'issued_to_name'
    ) THEN
      ALTER TABLE stationery_items ADD COLUMN issued_to_name TEXT;
    END IF;
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' AND table_name = 'stationery_items' AND column_name = 'issued_to_olt'
    ) THEN
      ALTER TABLE stationery_items ADD COLUMN issued_to_olt TEXT;
    END IF;
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' AND table_name = 'stationery_items' AND column_name = 'issued_to_designation'
    ) THEN
      ALTER TABLE stationery_items ADD COLUMN issued_to_designation TEXT;
    END IF;
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' AND table_name = 'stationery_items' AND column_name = 'issued_to_group'
    ) THEN
      ALTER TABLE stationery_items ADD COLUMN issued_to_group TEXT;
    END IF;
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' AND table_name = 'stationery_items' AND column_name = 'status'
    ) THEN
      ALTER TABLE stationery_items ADD COLUMN status item_status DEFAULT 'available';
    END IF;
    -- stationery_items.item_type
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' AND table_name = 'stationery_items' AND column_name = 'item_type'
    ) THEN
      ALTER TABLE stationery_items ADD COLUMN item_type TEXT;
    END IF;
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' AND table_name = 'stationery_items' AND column_name = 'item_location'
    ) THEN
      ALTER TABLE stationery_items ADD COLUMN item_location TEXT;
    END IF;
  END IF;
END
$$;

-- Create indexes for better performance
-- First ensure the is_active column exists before creating the index
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'is_active'
  ) THEN
    IF NOT EXISTS (
      SELECT 1 
      FROM pg_indexes 
      WHERE indexname = 'idx_profiles_role_active'
    ) THEN
      CREATE INDEX idx_profiles_role_active ON profiles(role) WHERE is_active = true;
    END IF;
  END IF;
END $$;

-- Other indexes
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relname = 'idx_inventory_items_category') THEN CREATE INDEX idx_inventory_items_category ON inventory_items(category_id); END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relname = 'idx_inventory_items_system') THEN CREATE INDEX idx_inventory_items_system ON inventory_items(system_id); END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relname = 'idx_inventory_items_location') THEN CREATE INDEX idx_inventory_items_location ON inventory_items(location_id); END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relname = 'idx_inventory_items_status') THEN CREATE INDEX idx_inventory_items_status ON inventory_items(status); END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relname = 'idx_inventory_items_partnumber') THEN CREATE INDEX idx_inventory_items_partNumber ON inventory_items(partNumber); END IF; END $$;

-- Tools indexes
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relname = 'idx_tools_issued_to_name') THEN CREATE INDEX idx_tools_issued_to_name ON tools(issued_to_name); END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relname = 'idx_tools_issued_to_group') THEN CREATE INDEX idx_tools_issued_to_group ON tools(issued_to_group); END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relname = 'idx_tools_status') THEN CREATE INDEX idx_tools_status ON tools(status); END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relname = 'idx_tools_location') THEN CREATE INDEX idx_tools_location ON tools(item_location); END IF; END $$;

-- General Tools indexes
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relname = 'idx_general_tools_issued_to_name') THEN CREATE INDEX idx_general_tools_issued_to_name ON general_tools(issued_to_name); END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relname = 'idx_general_tools_issued_to_group') THEN CREATE INDEX idx_general_tools_issued_to_group ON general_tools(issued_to_group); END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relname = 'idx_general_tools_status') THEN CREATE INDEX idx_general_tools_status ON general_tools(status); END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relname = 'idx_general_tools_location') THEN CREATE INDEX idx_general_tools_location ON general_tools(item_location); END IF; END $$;

DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relname = 'idx_ppe_items_issued_to_name') THEN CREATE INDEX idx_ppe_items_issued_to_name ON ppe_items(issued_to_name); END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relname = 'idx_ppe_items_issued_to_group') THEN CREATE INDEX idx_ppe_items_issued_to_group ON ppe_items(issued_to_group); END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relname = 'idx_ppe_items_status') THEN CREATE INDEX idx_ppe_items_status ON ppe_items(status); END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relname = 'idx_ppe_items_location') THEN CREATE INDEX idx_ppe_items_location ON ppe_items(item_location); END IF; END $$;

DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relname = 'idx_stationery_items_issued_to_name') THEN CREATE INDEX idx_stationery_items_issued_to_name ON stationery_items(issued_to_name); END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relname = 'idx_stationery_items_issued_to_group') THEN CREATE INDEX idx_stationery_items_issued_to_group ON stationery_items(issued_to_group); END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relname = 'idx_stationery_items_item_type') THEN CREATE INDEX idx_stationery_items_item_type ON stationery_items(item_type); END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relname = 'idx_stationery_items_status') THEN CREATE INDEX idx_stationery_items_status ON stationery_items(status); END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relname = 'idx_stationery_items_location') THEN CREATE INDEX idx_stationery_items_location ON stationery_items(item_location); END IF; END $$;

DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relname = 'idx_faulty_returns_pick_up_location') THEN CREATE INDEX idx_faulty_returns_pick_up_location ON faulty_returns(pick_up_location); END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relname = 'idx_faulty_returns_storage_location') THEN CREATE INDEX idx_faulty_returns_storage_location ON faulty_returns(storage_location); END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relname = 'idx_faulty_returns_status') THEN CREATE INDEX idx_faulty_returns_status ON faulty_returns(status); END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relname = 'idx_faulty_returns_created_at') THEN CREATE INDEX idx_faulty_returns_created_at ON faulty_returns(created_at); END IF; END $$;

DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relname = 'idx_requisition_item_type_id') THEN CREATE INDEX idx_requisition_item_type_id ON requisition(item_type, item_id); END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relname = 'idx_requisition_issued_to') THEN CREATE INDEX idx_requisition_issued_to ON requisition(issued_to); END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relname = 'idx_requisition_created_at') THEN CREATE INDEX idx_requisition_created_at ON requisition(created_at); END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relname = 'idx_requisition_type') THEN CREATE INDEX idx_requisition_type ON requisition(requisition_type); END IF; END $$;

DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relname = 'idx_gate_passes_created_at') THEN CREATE INDEX idx_gate_passes_created_at ON gate_passes(created_at); END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relname = 'idx_gate_passes_status') THEN CREATE INDEX idx_gate_passes_status ON gate_passes(approval_status); END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relname = 'idx_issuance_records_end_date') THEN CREATE INDEX idx_issuance_records_end_date ON issuance_records(end_date); END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relname = 'idx_issuance_records_status') THEN CREATE INDEX idx_issuance_records_status ON issuance_records(status); END IF; END $$;

DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relname = 'idx_audit_logs_table_record') THEN CREATE INDEX idx_audit_logs_table_record ON audit_logs(table_name, record_id); END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relname = 'idx_audit_logs_changed_at') THEN CREATE INDEX idx_audit_logs_changed_at ON audit_logs(changed_at); END IF; END $$;

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER
AS $$
BEGIN
  -- Set a secure search path
  SET search_path = public, pg_temp;
  
  NEW.updated_at = NOW();
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error but allow the operation to continue
    RAISE WARNING 'Error updating timestamp: %', SQLERRM;
    RETURN NEW;
END;
$$;

-- Create triggers for updated_at timestamps (idempotent)
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_profiles_updated_at') THEN CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column(); END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_locations_updated_at') THEN CREATE TRIGGER update_locations_updated_at BEFORE UPDATE ON locations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column(); END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_categories_updated_at') THEN CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON categories FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column(); END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_systems_updated_at') THEN CREATE TRIGGER update_systems_updated_at BEFORE UPDATE ON systems FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column(); END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_inventory_items_updated_at') THEN CREATE TRIGGER update_inventory_items_updated_at BEFORE UPDATE ON inventory_items FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column(); END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_tools_updated_at') THEN CREATE TRIGGER update_tools_updated_at BEFORE UPDATE ON tools FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column(); END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_general_tools_updated_at') THEN CREATE TRIGGER update_general_tools_updated_at BEFORE UPDATE ON general_tools FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column(); END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_ppe_items_updated_at') THEN CREATE TRIGGER update_ppe_items_updated_at BEFORE UPDATE ON ppe_items FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column(); END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_stationery_items_updated_at') THEN CREATE TRIGGER update_stationery_items_updated_at BEFORE UPDATE ON stationery_items FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column(); END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_faulty_returns_updated_at') THEN CREATE TRIGGER update_faulty_returns_updated_at BEFORE UPDATE ON faulty_returns FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column(); END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_requisition_updated_at') THEN CREATE TRIGGER update_requisition_updated_at BEFORE UPDATE ON requisition FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column(); END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_gate_passes_updated_at') THEN CREATE TRIGGER update_gate_passes_updated_at BEFORE UPDATE ON gate_passes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column(); END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_issuance_records_updated_at') THEN CREATE TRIGGER update_issuance_records_updated_at BEFORE UPDATE ON issuance_records FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column(); END IF; END $$;

-- Removed hardcoded dev seed; manage dev user via Supabase auth directly

-- Comments for documentation
COMMENT ON TABLE profiles IS 'User profile information extending Supabase auth.users';
COMMENT ON TABLE locations IS 'Storage locations for inventory items';
COMMENT ON TABLE categories IS 'Main categories: O&M and PMA';
COMMENT ON TABLE systems IS 'System types: Elevator, Escalator, PSD, HVAC, WSD, LV, FAS, FES';
COMMENT ON TABLE inventory_items IS 'Main inventory spare parts with full tracking';
COMMENT ON TABLE tools IS 'Tools inventory with assignment tracking';
COMMENT ON TABLE general_tools IS 'General tools and miscellaneous equipment with assignment tracking';
COMMENT ON TABLE ppe_items IS 'Personal Protective Equipment inventory with assignment tracking';
COMMENT ON TABLE stationery_items IS 'Stationery items with assignment tracking';
COMMENT ON TABLE faulty_returns IS 'Faulty returns tracking with location management';
COMMENT ON TABLE requisition IS 'All issue/return/consume requisition across item types';
COMMENT ON TABLE gate_passes IS 'Gate pass generation and tracking';
COMMENT ON TABLE issuance_records IS 'issuance policies and coverage tracking';
COMMENT ON TABLE audit_logs IS 'Audit trail for all data changes';