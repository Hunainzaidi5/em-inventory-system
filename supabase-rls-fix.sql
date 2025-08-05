-- Fix RLS policies for profiles table
-- This script should be run in Supabase SQL Editor to fix the RLS security issue

-- First, drop existing policies
DROP POLICY IF EXISTS "Public profiles are viewable by everyone." ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile." ON profiles;

-- Ensure RLS is enabled
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create comprehensive and secure policies

-- Allow authenticated users to view all profiles (needed for user management)
CREATE POLICY "Authenticated users can view all profiles" 
  ON profiles FOR SELECT 
  USING (auth.role() = 'authenticated');

-- Allow users to update their own profile
CREATE POLICY "Users can update their own profile" 
  ON profiles FOR UPDATE 
  USING (auth.uid() = id);

-- Allow dev users to insert new profiles (for user creation)
CREATE POLICY "Dev users can insert profiles" 
  ON profiles FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role = 'dev'
    )
  );

-- Allow dev users to update any profile (for user management)
CREATE POLICY "Dev users can update any profile" 
  ON profiles FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role = 'dev'
    )
  );

-- Allow dev users to delete profiles (for user management)
CREATE POLICY "Dev users can delete profiles" 
  ON profiles FOR DELETE 
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role = 'dev'
    )
  );

-- Allow system/service role to insert profiles (for user registration triggers)
CREATE POLICY "System can insert profiles" 
  ON profiles FOR INSERT 
  WITH CHECK (auth.role() = 'service_role');

-- Allow system/service role to update profiles (for trigger functions)
CREATE POLICY "System can update profiles" 
  ON profiles FOR UPDATE 
  USING (auth.role() = 'service_role');

-- Fix RLS policies for inventory_items table
DROP POLICY IF EXISTS "Users can view all inventory items" ON inventory_items;
DROP POLICY IF EXISTS "Users can insert their own inventory items" ON inventory_items;
DROP POLICY IF EXISTS "Users can update their own inventory items" ON inventory_items;

CREATE POLICY "Authenticated users can view inventory items" 
  ON inventory_items FOR SELECT 
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert inventory items" 
  ON inventory_items FOR INSERT 
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update their own inventory items" 
  ON inventory_items FOR UPDATE 
  USING (auth.uid() = created_by OR EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role IN ('dev', 'admin', 'manager')
  ));

CREATE POLICY "Managers can delete inventory items" 
  ON inventory_items FOR DELETE 
  USING (EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role IN ('dev', 'admin', 'manager')
  ));

-- Fix RLS policies for tools table
CREATE POLICY "Authenticated users can view tools" 
  ON tools FOR SELECT 
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert tools" 
  ON tools FOR INSERT 
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update their own tools" 
  ON tools FOR UPDATE 
  USING (auth.uid() = created_by OR EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role IN ('dev', 'admin', 'manager')
  ));

CREATE POLICY "Managers can delete tools" 
  ON tools FOR DELETE 
  USING (EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role IN ('dev', 'admin', 'manager')
  ));

-- Fix RLS policies for ppe_items table
CREATE POLICY "Authenticated users can view ppe items" 
  ON ppe_items FOR SELECT 
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert ppe items" 
  ON ppe_items FOR INSERT 
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update their own ppe items" 
  ON ppe_items FOR UPDATE 
  USING (auth.uid() = created_by OR EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role IN ('dev', 'admin', 'manager')
  ));

CREATE POLICY "Managers can delete ppe items" 
  ON ppe_items FOR DELETE 
  USING (EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role IN ('dev', 'admin', 'manager')
  ));

-- Fix RLS policies for general_items table
CREATE POLICY "Authenticated users can view general items" 
  ON general_items FOR SELECT 
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert general items" 
  ON general_items FOR INSERT 
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update their own general items" 
  ON general_items FOR UPDATE 
  USING (auth.uid() = created_by OR EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role IN ('dev', 'admin', 'manager')
  ));

CREATE POLICY "Managers can delete general items" 
  ON general_items FOR DELETE 
  USING (EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role IN ('dev', 'admin', 'manager')
  ));

-- Fix RLS policies for faulty_returns table
CREATE POLICY "Authenticated users can view faulty returns" 
  ON faulty_returns FOR SELECT 
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert faulty returns" 
  ON faulty_returns FOR INSERT 
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update their own faulty returns" 
  ON faulty_returns FOR UPDATE 
  USING (auth.uid() = created_by OR EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role IN ('dev', 'admin', 'manager')
  ));

CREATE POLICY "Managers can delete faulty returns" 
  ON faulty_returns FOR DELETE 
  USING (EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role IN ('dev', 'admin', 'manager')
  ));