-- Create mission_categories table
BEGIN;

CREATE TABLE IF NOT EXISTS mission_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  icon_url VARCHAR(500),
  status VARCHAR(50) DEFAULT 'active',
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add category_id to mission_profiles if not exists
ALTER TABLE mission_profiles 
ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES mission_categories(id);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_mission_categories_status ON mission_categories(status);
CREATE INDEX IF NOT EXISTS idx_mission_categories_created_by ON mission_categories(created_by);
CREATE INDEX IF NOT EXISTS idx_mission_profiles_category ON mission_profiles(category_id);

-- Enable RLS on mission_categories
ALTER TABLE mission_categories ENABLE ROW LEVEL SECURITY;

-- RLS Policies for mission_categories
DROP POLICY IF EXISTS admin_view_categories ON mission_categories;
CREATE POLICY admin_view_categories ON mission_categories
  FOR SELECT
  USING (
    status = 'active' OR EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = true
    )
  );

DROP POLICY IF EXISTS admin_create_categories ON mission_categories;
CREATE POLICY admin_create_categories ON mission_categories
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = true
    )
  );

DROP POLICY IF EXISTS admin_update_categories ON mission_categories;
CREATE POLICY admin_update_categories ON mission_categories
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = true
    )
  );

DROP POLICY IF EXISTS admin_delete_categories ON mission_categories;
CREATE POLICY admin_delete_categories ON mission_categories
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = true
    )
  );

-- Update mission_profiles RLS to allow public users to view active profiles with missions
DROP POLICY IF EXISTS user_view_profiles ON mission_profiles;
CREATE POLICY user_view_profiles ON mission_profiles
  FOR SELECT
  USING (
    status = 'active' OR EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = true
    )
  );

COMMIT;
