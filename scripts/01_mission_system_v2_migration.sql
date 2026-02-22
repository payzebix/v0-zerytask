-- Mission System v2 Migration Script
-- Creates mission profiles table and updates missions table with new fields

-- 1. Create mission_profiles table
CREATE TABLE IF NOT EXISTS mission_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  logo_url VARCHAR(500),
  status VARCHAR(50) DEFAULT 'active',
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 2. Create indexes for mission_profiles
CREATE INDEX IF NOT EXISTS idx_mission_profiles_status ON mission_profiles(status);
CREATE INDEX IF NOT EXISTS idx_mission_profiles_created_by ON mission_profiles(created_by);

-- 3. Update missions table with new columns (if they don't exist)
ALTER TABLE missions ADD COLUMN IF NOT EXISTS mission_profile_id UUID REFERENCES mission_profiles(id);
ALTER TABLE missions ADD COLUMN IF NOT EXISTS mission_type_id UUID REFERENCES mission_types(id);
ALTER TABLE missions ADD COLUMN IF NOT EXISTS social_network_id UUID REFERENCES social_networks(id);
ALTER TABLE missions ADD COLUMN IF NOT EXISTS website_url VARCHAR(500);
ALTER TABLE missions ADD COLUMN IF NOT EXISTS priority VARCHAR(50) DEFAULT 'medium';
ALTER TABLE missions ADD COLUMN IF NOT EXISTS verification_type VARCHAR(50) DEFAULT 'manual';

-- 4. Update mission_submissions table if needed
ALTER TABLE mission_submissions ADD COLUMN IF NOT EXISTS verified_by UUID REFERENCES auth.users(id);
ALTER TABLE mission_submissions ADD COLUMN IF NOT EXISTS verified_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE mission_submissions ADD COLUMN IF NOT EXISTS admin_notes TEXT;

-- 5. Create indexes for missions updates
CREATE INDEX IF NOT EXISTS idx_missions_profile_id ON missions(mission_profile_id);
CREATE INDEX IF NOT EXISTS idx_missions_type_id ON missions(mission_type_id);
CREATE INDEX IF NOT EXISTS idx_missions_priority ON missions(priority);

-- 6. Create indexes for mission_submissions updates
CREATE INDEX IF NOT EXISTS idx_submissions_verified_by ON mission_submissions(verified_by);
CREATE INDEX IF NOT EXISTS idx_submissions_verified_at ON mission_submissions(verified_at);

-- 7. Enable RLS on mission_profiles
ALTER TABLE mission_profiles ENABLE ROW LEVEL SECURITY;

-- 8. RLS Policy: Admins can create profiles
CREATE POLICY IF NOT EXISTS admin_create_profiles ON mission_profiles
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = true
    )
  );

-- 9. RLS Policy: Admins can view all profiles
CREATE POLICY IF NOT EXISTS admin_view_profiles ON mission_profiles
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = true
    )
  );

-- 10. RLS Policy: Admins can update profiles
CREATE POLICY IF NOT EXISTS admin_update_profiles ON mission_profiles
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

-- 11. RLS Policy: Admins can delete profiles
CREATE POLICY IF NOT EXISTS admin_delete_profiles ON mission_profiles
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = true
    )
  );

-- 12. Public can view active profiles
CREATE POLICY IF NOT EXISTS public_view_profiles ON mission_profiles
  FOR SELECT
  USING (status = 'active');

-- 13. Update RLS on missions table to consider new fields
CREATE POLICY IF NOT EXISTS admin_manage_missions ON missions
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = true
    )
  );

-- 14. Update RLS on mission_submissions
CREATE POLICY IF NOT EXISTS admin_verify_submissions ON mission_submissions
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

-- 15. Update users table to add reward balance columns if they don't exist
ALTER TABLE users ADD COLUMN IF NOT EXISTS xp_balance INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS zeryt_balance DECIMAL(18, 8) DEFAULT 0;

-- 16. Create indexes for user rewards
CREATE INDEX IF NOT EXISTS idx_users_xp_balance ON users(xp_balance);
CREATE INDEX IF NOT EXISTS idx_users_zeryt_balance ON users(zeryt_balance);

-- 17. Create a trigger to update mission_profiles updated_at
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

-- 18. Add comment to tables
COMMENT ON TABLE mission_profiles IS 'Brand profiles that group related missions';
COMMENT ON COLUMN mission_profiles.name IS 'Name of the profile (brand)';
COMMENT ON COLUMN mission_profiles.logo_url IS 'URL to the profile logo in blob storage';
COMMENT ON COLUMN mission_profiles.status IS 'Profile status: active, inactive, or archived';
COMMENT ON COLUMN mission_profiles.created_by IS 'Admin user who created this profile';

COMMENT ON COLUMN missions.mission_profile_id IS 'Foreign key to mission_profiles table';
COMMENT ON COLUMN missions.mission_type_id IS 'Foreign key to mission_types table';
COMMENT ON COLUMN missions.social_network_id IS 'Foreign key to social_networks table (for social missions)';
COMMENT ON COLUMN missions.website_url IS 'URL for website-type missions';
COMMENT ON COLUMN missions.priority IS 'Mission priority: low, medium, or high';
COMMENT ON COLUMN missions.verification_type IS 'How mission is verified: manual or auto';

COMMENT ON COLUMN mission_submissions.verified_by IS 'Admin user who verified this submission';
COMMENT ON COLUMN mission_submissions.verified_at IS 'Timestamp when submission was verified';
COMMENT ON COLUMN mission_submissions.admin_notes IS 'Notes added by admin during verification';

-- Migration completed successfully
