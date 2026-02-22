-- Create mission_profiles table (simplified version)
BEGIN;

CREATE TABLE mission_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  logo_url VARCHAR(500),
  status VARCHAR(50) DEFAULT 'active',
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create indexes
CREATE INDEX idx_mission_profiles_status ON mission_profiles(status);
CREATE INDEX idx_mission_profiles_created_by ON mission_profiles(created_by);

-- Enable RLS
ALTER TABLE mission_profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY admin_view_profiles ON mission_profiles
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = true
    )
  );

CREATE POLICY admin_create_profiles ON mission_profiles
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = true
    )
  );

CREATE POLICY admin_update_profiles ON mission_profiles
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

CREATE POLICY admin_delete_profiles ON mission_profiles
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = true
    )
  );

CREATE POLICY public_view_profiles ON mission_profiles
  FOR SELECT
  USING (status = 'active');

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_mission_profiles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS mission_profiles_update_timestamp ON mission_profiles;
CREATE TRIGGER mission_profiles_update_timestamp
  BEFORE UPDATE ON mission_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_mission_profiles_updated_at();

COMMIT;
