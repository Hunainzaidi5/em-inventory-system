-- E&M Inventory Management System Database Schema
-- Run this SQL in your Supabase SQL Editor after setting up your project

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create custom types/enums (idempotent via DO blocks)
DO $$ BEGIN
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
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE item_category AS ENUM ('O&M', 'PMA');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
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
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE requisition_type AS ENUM ('issue', 'return', 'consume');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE item_status AS ENUM ('available', 'issued', 'consumed', 'faulty');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE ppe_type AS ENUM (
    'Helmet Yellow',
    'Helmet White',
    'Inner Strip',
    'Reflective Waist',
    'Safety Shoes',
    'Goggles',
    'Dust Mask',
    'Raincoat',
    'Earplugs'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- User profiles table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  role user_role NOT NULL DEFAULT 'technician',
  department TEXT,
  employee_id TEXT UNIQUE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on profiles table
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create policies for profiles (idempotent)
DO $$
BEGIN
  CREATE POLICY "Public profiles are viewable by everyone." 
    ON profiles FOR SELECT 
    USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$
BEGIN
  CREATE POLICY "Users can update their own profile." 
    ON profiles FOR UPDATE 
    USING (auth.uid() = id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Function to handle new user signups
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER
AS $$
BEGIN
  -- Set a secure search path
  SET search_path = public, pg_temp;
  
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
    COALESCE(NEW.raw_user_meta_data->>'role', 'technician')::user_role,
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

-- Trigger the function every time a user is created
CREATE OR REPLACE TRIGGER on_auth_user_created
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
CREATE OR REPLACE TRIGGER on_auth_user_updated
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
VALUES ('GMG Warehouse', 'Main warehouse facility')
ON CONFLICT (name) DO NOTHING;

INSERT INTO locations (name, description)
VALUES ('E&M Systems Ground Floor Store', 'Ground floor storage area')
ON CONFLICT (name) DO NOTHING;

INSERT INTO locations (name, description)
VALUES ('E&M Systems 2nd Floor Store', 'Second floor storage area')
ON CONFLICT (name) DO NOTHING;

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
SELECT 'O&M', 'Operations and Maintenance parts'
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = 'O&M');

INSERT INTO categories (name, description)
SELECT 'PMA', 'Punjab Mass Transit Authority parts'
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = 'PMA');

-- Systems table
CREATE TABLE IF NOT EXISTS systems (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name system_type NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default systems
INSERT INTO systems (name, description) VALUES ('Elevator', 'Elevator system components') ON CONFLICT (name) DO NOTHING;
INSERT INTO systems (name, description) VALUES ('Escalator', 'Escalator system components') ON CONFLICT (name) DO NOTHING;
INSERT INTO systems (name, description) VALUES ('PSD', 'Platform Screen Door system components') ON CONFLICT (name) DO NOTHING;
INSERT INTO systems (name, description) VALUES ('HVAC', 'Heating, Ventilation, and Air Conditioning components') ON CONFLICT (name) DO NOTHING;
INSERT INTO systems (name, description) VALUES ('WSD', 'Water Supply and Drainage components') ON CONFLICT (name) DO NOTHING;
INSERT INTO systems (name, description) VALUES ('LV', 'Low Voltage electrical components') ON CONFLICT (name) DO NOTHING;
INSERT INTO systems (name, description) VALUES ('FAS', 'Fire Alarm System components') ON CONFLICT (name) DO NOTHING;
INSERT INTO systems (name, description) VALUES ('FES', 'Fire Extinguishing System components') ON CONFLICT (name) DO NOTHING;

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
  CREATE POLICY "Users can view all inventory items" 
    ON inventory_items FOR SELECT 
    USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Users can insert their own inventory items" 
    ON inventory_items FOR INSERT 
    WITH CHECK (auth.role() = 'authenticated');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Users can update their own inventory items" 
    ON inventory_items FOR UPDATE 
    USING (auth.uid() = created_by);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Tools table (New)
CREATE TABLE IF NOT EXISTS tools (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  tool_name TEXT NOT NULL,
  tool_description TEXT,
  brand TEXT,
  model TEXT,
  serial_number TEXT UNIQUE,
  quantity INTEGER NOT NULL DEFAULT 0 CHECK (quantity >= 0),
  -- Issued To fields
  issued_to_name TEXT NOT NULL,
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

-- Policies for tools (idempotent)
DO $$ BEGIN
  CREATE POLICY "Users can view all tools"
    ON tools FOR SELECT
    USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Users can insert tools"
    ON tools FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Users can update their own tools"
    ON tools FOR UPDATE
    USING (auth.uid() = created_by);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- General Tools table (New)
CREATE TABLE IF NOT EXISTS general_tools (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  tool_name TEXT NOT NULL,
  tool_description TEXT,
  brand TEXT,
  model TEXT,
  quantity INTEGER NOT NULL DEFAULT 0 CHECK (quantity >= 0),
  status item_status DEFAULT 'available',
  notes TEXT,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on general_tools table
ALTER TABLE general_tools ENABLE ROW LEVEL SECURITY;

-- Policies for general_tools (idempotent)
DO $$ BEGIN
  CREATE POLICY "Users can view all general tools"
    ON general_tools FOR SELECT
    USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Users can insert general tools"
    ON general_tools FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Users can update their own general tools"
    ON general_tools FOR UPDATE
    USING (auth.uid() = created_by);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- PPE items table (Updated to match React implementation)
CREATE TABLE IF NOT EXISTS ppe_items (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  item_name TEXT NOT NULL,
  item_description TEXT,
  quantity INTEGER NOT NULL DEFAULT 0 CHECK (quantity >= 0),
  -- Issued To fields
  issued_to_name TEXT NOT NULL,
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

-- Policies for ppe_items (idempotent)
DO $$ BEGIN
  CREATE POLICY "Users can view all ppe items"
    ON ppe_items FOR SELECT
    USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Users can insert ppe items"
    ON ppe_items FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Users can update their own ppe items"
    ON ppe_items FOR UPDATE
    USING (auth.uid() = created_by);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Stationery items table (Updated to match React implementation)
CREATE TABLE IF NOT EXISTS stationery_items (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  item_name TEXT NOT NULL,
  item_description TEXT,
  item_type TEXT,
  quantity INTEGER NOT NULL DEFAULT 0 CHECK (quantity >= 0),
  -- Issued To fields
  issued_to_name TEXT NOT NULL,
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

-- Policies for stationery_items (idempotent)
DO $$ BEGIN
  CREATE POLICY "Users can view all stationery items"
    ON stationery_items FOR SELECT
    USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Users can insert stationery items"
    ON stationery_items FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Users can update their own stationery items"
    ON stationery_items FOR UPDATE
    USING (auth.uid() = created_by);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

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

-- Create indexes for better performance
-- Ensure required columns exist (upgrade-safe)
ALTER TABLE IF EXISTS requisition ADD COLUMN IF NOT EXISTS item_type TEXT;
ALTER TABLE IF EXISTS requisition ADD COLUMN IF NOT EXISTS item_id UUID;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_inventory_items_category ON inventory_items(category_id);
CREATE INDEX IF NOT EXISTS idx_inventory_items_system ON inventory_items(system_id);
CREATE INDEX IF NOT EXISTS idx_inventory_items_location ON inventory_items(location_id);
CREATE INDEX IF NOT EXISTS idx_inventory_items_status ON inventory_items(status);
CREATE INDEX IF NOT EXISTS idx_inventory_items_partNumber ON inventory_items(partNumber);

CREATE INDEX IF NOT EXISTS idx_tools_issued_to_name ON tools(issued_to_name);
CREATE INDEX IF NOT EXISTS idx_tools_issued_to_group ON tools(issued_to_group);
CREATE INDEX IF NOT EXISTS idx_tools_brand ON tools(brand);
CREATE INDEX IF NOT EXISTS idx_tools_status ON tools(status);

CREATE INDEX IF NOT EXISTS idx_general_tools_brand ON general_tools(brand);
CREATE INDEX IF NOT EXISTS idx_general_tools_status ON general_tools(status);

CREATE INDEX IF NOT EXISTS idx_ppe_items_issued_to_name ON ppe_items(issued_to_name);
CREATE INDEX IF NOT EXISTS idx_ppe_items_issued_to_group ON ppe_items(issued_to_group);
CREATE INDEX IF NOT EXISTS idx_ppe_items_status ON ppe_items(status);

CREATE INDEX IF NOT EXISTS idx_stationery_items_issued_to_name ON stationery_items(issued_to_name);
CREATE INDEX IF NOT EXISTS idx_stationery_items_issued_to_group ON stationery_items(issued_to_group);
CREATE INDEX IF NOT EXISTS idx_stationery_items_item_type ON stationery_items(item_type);
CREATE INDEX IF NOT EXISTS idx_stationery_items_status ON stationery_items(status);

CREATE INDEX IF NOT EXISTS idx_faulty_returns_pick_up_location ON faulty_returns(pick_up_location);
CREATE INDEX IF NOT EXISTS idx_faulty_returns_storage_location ON faulty_returns(storage_location);
CREATE INDEX IF NOT EXISTS idx_faulty_returns_status ON faulty_returns(status);
CREATE INDEX IF NOT EXISTS idx_faulty_returns_created_at ON faulty_returns(created_at);

CREATE INDEX IF NOT EXISTS idx_requisition_item_type_id ON requisition(item_type, item_id);
CREATE INDEX IF NOT EXISTS idx_requisition_issued_to ON requisition(issued_to);
CREATE INDEX IF NOT EXISTS idx_requisition_created_at ON requisition(created_at);
CREATE INDEX IF NOT EXISTS idx_requisition_type ON requisition(requisition_type);

CREATE INDEX IF NOT EXISTS idx_gate_passes_created_at ON gate_passes(created_at);
CREATE INDEX IF NOT EXISTS idx_gate_passes_status ON gate_passes(approval_status);
CREATE INDEX IF NOT EXISTS idx_issuance_records_end_date ON issuance_records(end_date);
CREATE INDEX IF NOT EXISTS idx_issuance_records_status ON issuance_records(status);

CREATE INDEX IF NOT EXISTS idx_audit_logs_table_record ON audit_logs(table_name, record_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_changed_at ON audit_logs(changed_at);

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

-- Create triggers for updated_at timestamps (idempotent via OR REPLACE)
CREATE OR REPLACE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE OR REPLACE TRIGGER update_locations_updated_at BEFORE UPDATE ON locations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE OR REPLACE TRIGGER update_categories_updated_at BEFORE UPDATE ON categories FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE OR REPLACE TRIGGER update_systems_updated_at BEFORE UPDATE ON systems FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE OR REPLACE TRIGGER update_inventory_items_updated_at BEFORE UPDATE ON inventory_items FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE OR REPLACE TRIGGER update_tools_updated_at BEFORE UPDATE ON tools FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE OR REPLACE TRIGGER update_general_tools_updated_at BEFORE UPDATE ON general_tools FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE OR REPLACE TRIGGER update_ppe_items_updated_at BEFORE UPDATE ON ppe_items FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE OR REPLACE TRIGGER update_stationery_items_updated_at BEFORE UPDATE ON stationery_items FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE OR REPLACE TRIGGER update_faulty_returns_updated_at BEFORE UPDATE ON faulty_returns FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE OR REPLACE TRIGGER update_requisition_updated_at BEFORE UPDATE ON requisition FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE OR REPLACE TRIGGER update_gate_passes_updated_at BEFORE UPDATE ON gate_passes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE OR REPLACE TRIGGER update_issuance_records_updated_at BEFORE UPDATE ON issuance_records FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Comments for documentation
COMMENT ON TABLE profiles IS 'User profile information extending Supabase auth.users';
COMMENT ON TABLE locations IS 'Storage locations for inventory items';
COMMENT ON TABLE categories IS 'Main categories: O&M and PMA';
COMMENT ON TABLE systems IS 'System types: Elevator, Escalator, PSD, HVAC, WSD, LV, FAS, FES';
COMMENT ON TABLE inventory_items IS 'Main inventory spare parts with full tracking';
COMMENT ON TABLE tools IS 'Tools inventory with assignment tracking';
COMMENT ON TABLE general_tools IS 'General tools listing with basic tracking';
COMMENT ON TABLE ppe_items IS 'Personal Protective Equipment inventory with assignment tracking';
COMMENT ON TABLE stationery_items IS 'Stationery items with assignment tracking';
COMMENT ON TABLE faulty_returns IS 'Faulty returns tracking with location management';
COMMENT ON TABLE requisition IS 'All issue/return/consume requisition across item types';
COMMENT ON TABLE gate_passes IS 'Gate pass generation and tracking';
COMMENT ON TABLE issuance_records IS 'issuance policies and coverage tracking';
COMMENT ON TABLE audit_logs IS 'Audit trail for all data changes';

-- Seed rows (idempotent)
-- Tools seed
INSERT INTO tools (tool_name, brand, model, serial_number, quantity, issued_to_name, status)
SELECT 'Cordless Drill', 'DeWalt', 'DCD791', 'SN-DRILL-001', 5, 'Store', 'available'
WHERE NOT EXISTS (
  SELECT 1 FROM tools WHERE serial_number = 'SN-DRILL-001'
);

-- General tools seed
INSERT INTO general_tools (tool_name, brand, model, quantity, status)
SELECT 'Hammer', 'Stanley', 'STHT0-51310', 10, 'available'
WHERE NOT EXISTS (
  SELECT 1 FROM general_tools WHERE tool_name = 'Hammer' AND brand = 'Stanley' AND model = 'STHT0-51310'
);

-- PPE items seed
INSERT INTO ppe_items (item_name, item_description, quantity, issued_to_name, status)
SELECT 'Safety Helmet', 'Yellow helmet', 20, 'Store', 'available'
WHERE NOT EXISTS (
  SELECT 1 FROM ppe_items WHERE item_name = 'Safety Helmet'
);

-- Stationery items seed
INSERT INTO stationery_items (item_name, item_description, item_type, quantity, issued_to_name, status)
SELECT 'Ballpoint Pen', 'Blue ink pen', 'Pen', 100, 'Office', 'available'
WHERE NOT EXISTS (
  SELECT 1 FROM stationery_items WHERE item_name = 'Ballpoint Pen' AND item_type = 'Pen'
);