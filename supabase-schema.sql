-- E&M Inventory Management System Database Schema
-- Run this SQL in your Supabase SQL Editor after setting up your project

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create custom types/enums
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

CREATE TYPE item_category AS ENUM ('O&M', 'PMA');

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

CREATE TYPE transaction_type AS ENUM ('issue', 'return', 'consume');

CREATE TYPE item_status AS ENUM ('available', 'issued', 'consumed', 'faulty');

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

-- User profiles table (extends Supabase auth.users)
CREATE TABLE profiles (
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

-- Locations table
CREATE TABLE locations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  address TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default locations
INSERT INTO locations (name, description) VALUES 
('GMG Warehouse', 'Main warehouse facility'),
('E&M Systems Ground Floor Store', 'Ground floor storage area'),
('E&M Systems 2nd Floor Store', 'Second floor storage area');

-- Categories table
CREATE TABLE categories (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name item_category NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default categories
INSERT INTO categories (name, description) VALUES 
('O&M', 'Operations and Maintenance parts'),
('PMA', 'Planned Maintenance Activities parts');

-- Systems table
CREATE TABLE systems (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name system_type NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default systems
INSERT INTO systems (name, description) VALUES 
('Elevator', 'Elevator system components'),
('Escalator', 'Escalator system components'),
('PSD', 'Platform Screen Door system components'),
('HVAC', 'Heating, Ventilation, and Air Conditioning components'),
('WSD', 'Water Supply and Drainage components'),
('LV', 'Low Voltage electrical components'),
('FAS', 'Fire Alarm System components'),
('FES', 'Fire Extinguishing System components');

-- Inventory items table
CREATE TABLE inventory_items (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  part_name TEXT NOT NULL,
  part_number TEXT UNIQUE,
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

-- Tools table
CREATE TABLE tools (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  tool_name TEXT NOT NULL,
  tool_code TEXT UNIQUE,
  description TEXT,
  location_id UUID REFERENCES locations(id) ON DELETE RESTRICT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 0 CHECK (quantity >= 0),
  available_quantity INTEGER NOT NULL DEFAULT 0 CHECK (available_quantity >= 0),
  condition TEXT DEFAULT 'good',
  last_maintenance_date DATE,
  next_maintenance_date DATE,
  purchase_date DATE,
  warranty_expiry DATE,
  status item_status DEFAULT 'available',
  notes TEXT,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- PPE items table
CREATE TABLE ppe_items (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  item_name ppe_type NOT NULL,
  size_variant TEXT,
  description TEXT,
  location_id UUID REFERENCES locations(id) ON DELETE RESTRICT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 0 CHECK (quantity >= 0),
  available_quantity INTEGER NOT NULL DEFAULT 0 CHECK (available_quantity >= 0),
  expiry_date DATE,
  batch_number TEXT,
  manufacturer TEXT,
  status item_status DEFAULT 'available',
  notes TEXT,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- General items table
CREATE TABLE general_items (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  item_name TEXT NOT NULL,
  item_code TEXT UNIQUE,
  description TEXT,
  category TEXT, -- 'Tape', 'Stationery', 'Gifts', etc.
  location_id UUID REFERENCES locations(id) ON DELETE RESTRICT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 0 CHECK (quantity >= 0),
  available_quantity INTEGER NOT NULL DEFAULT 0 CHECK (available_quantity >= 0),
  unit_cost DECIMAL(10,2),
  supplier TEXT,
  status item_status DEFAULT 'available',
  notes TEXT,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Transactions table (for all item types)
CREATE TABLE transactions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  transaction_type transaction_type NOT NULL,
  item_type TEXT NOT NULL, -- 'inventory', 'tool', 'ppe', 'general'
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
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Faulty returns table
CREATE TABLE faulty_returns (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  transaction_id UUID REFERENCES transactions(id) ON DELETE CASCADE,
  item_type TEXT NOT NULL,
  item_id UUID NOT NULL,
  fault_description TEXT NOT NULL,
  return_location TEXT NOT NULL, -- 'Warehouse' or 'C&C'
  returned_by UUID REFERENCES profiles(id) NOT NULL,
  return_date DATE NOT NULL DEFAULT CURRENT_DATE,
  expected_resolution TEXT,
  resolution_status TEXT DEFAULT 'pending', -- 'pending', 'resolved', 'disposed'
  replacement_provided BOOLEAN DEFAULT false,
  replacement_item_id UUID,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Gate passes table
CREATE TABLE gate_passes (
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

-- Insurance records table
CREATE TABLE insurance_records (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  policy_number TEXT UNIQUE NOT NULL,
  insurance_provider TEXT NOT NULL,
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
CREATE TABLE audit_logs (
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
CREATE INDEX idx_inventory_items_category ON inventory_items(category_id);
CREATE INDEX idx_inventory_items_system ON inventory_items(system_id);
CREATE INDEX idx_inventory_items_location ON inventory_items(location_id);
CREATE INDEX idx_inventory_items_status ON inventory_items(status);
CREATE INDEX idx_inventory_items_part_number ON inventory_items(part_number);

CREATE INDEX idx_transactions_item_type_id ON transactions(item_type, item_id);
CREATE INDEX idx_transactions_issued_to ON transactions(issued_to);
CREATE INDEX idx_transactions_created_at ON transactions(created_at);
CREATE INDEX idx_transactions_type ON transactions(transaction_type);

CREATE INDEX idx_tools_location ON tools(location_id);
CREATE INDEX idx_tools_status ON tools(status);
CREATE INDEX idx_ppe_items_location ON ppe_items(location_id);
CREATE INDEX idx_ppe_items_type ON ppe_items(item_name);
CREATE INDEX idx_general_items_location ON general_items(location_id);
CREATE INDEX idx_general_items_category ON general_items(category);

CREATE INDEX idx_gate_passes_created_at ON gate_passes(created_at);
CREATE INDEX idx_gate_passes_status ON gate_passes(approval_status);
CREATE INDEX idx_insurance_records_end_date ON insurance_records(end_date);
CREATE INDEX idx_insurance_records_status ON insurance_records(status);

CREATE INDEX idx_audit_logs_table_record ON audit_logs(table_name, record_id);
CREATE INDEX idx_audit_logs_changed_at ON audit_logs(changed_at);

-- Create functions for updating timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at timestamps
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_locations_updated_at BEFORE UPDATE ON locations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON categories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_systems_updated_at BEFORE UPDATE ON systems FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_inventory_items_updated_at BEFORE UPDATE ON inventory_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_tools_updated_at BEFORE UPDATE ON tools FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_ppe_items_updated_at BEFORE UPDATE ON ppe_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_general_items_updated_at BEFORE UPDATE ON general_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_transactions_updated_at BEFORE UPDATE ON transactions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_faulty_returns_updated_at BEFORE UPDATE ON faulty_returns FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_gate_passes_updated_at BEFORE UPDATE ON gate_passes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_insurance_records_updated_at BEFORE UPDATE ON insurance_records FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create a function to automatically update available quantities
CREATE OR REPLACE FUNCTION update_available_quantity()
RETURNS TRIGGER AS $$
BEGIN
  -- Update available quantity based on issued/returned items
  IF TG_OP = 'INSERT' THEN
    IF NEW.transaction_type = 'issue' THEN
      -- Decrease available quantity
      CASE NEW.item_type
        WHEN 'tool' THEN
          UPDATE tools SET available_quantity = available_quantity - NEW.quantity WHERE id = NEW.item_id;
        WHEN 'ppe' THEN
          UPDATE ppe_items SET available_quantity = available_quantity - NEW.quantity WHERE id = NEW.item_id;
        WHEN 'general' THEN
          UPDATE general_items SET available_quantity = available_quantity - NEW.quantity WHERE id = NEW.item_id;
      END CASE;
    ELSIF NEW.transaction_type = 'return' THEN
      -- Increase available quantity
      CASE NEW.item_type
        WHEN 'tool' THEN
          UPDATE tools SET available_quantity = available_quantity + NEW.quantity WHERE id = NEW.item_id;
        WHEN 'ppe' THEN
          UPDATE ppe_items SET available_quantity = available_quantity + NEW.quantity WHERE id = NEW.item_id;
        WHEN 'general' THEN
          UPDATE general_items SET available_quantity = available_quantity + NEW.quantity WHERE id = NEW.item_id;
      END CASE;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic quantity updates
CREATE TRIGGER update_available_quantity_trigger
  AFTER INSERT ON transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_available_quantity();

-- Comments for documentation
COMMENT ON TABLE profiles IS 'User profile information extending Supabase auth.users';
COMMENT ON TABLE locations IS 'Storage locations for inventory items';
COMMENT ON TABLE categories IS 'Main categories: O&M and PMA';
COMMENT ON TABLE systems IS 'System types: Elevator, Escalator, PSD, HVAC, WSD, LV, FAS, FES';
COMMENT ON TABLE inventory_items IS 'Main inventory spare parts with full tracking';
COMMENT ON TABLE tools IS 'Tools inventory with maintenance tracking';
COMMENT ON TABLE ppe_items IS 'Personal Protective Equipment inventory';
COMMENT ON TABLE general_items IS 'General items like tape, stationery, gifts';
COMMENT ON TABLE transactions IS 'All issue/return/consume transactions across item types';
COMMENT ON TABLE faulty_returns IS 'Items returned due to faults';
COMMENT ON TABLE gate_passes IS 'Gate pass generation and tracking';
COMMENT ON TABLE insurance_records IS 'Insurance policies and coverage tracking';
COMMENT ON TABLE audit_logs IS 'Audit trail for all data changes';