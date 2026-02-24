-- Fix mission_profiles RLS policy
-- The issue: The RLS policy "Only admins can insert mission profiles" might be blocking inserts
-- even when using service_role key (which should bypass RLS)
-- 
-- Solution: Drop and recreate the policy to ensure it works correctly

-- First, disable RLS temporarily to allow the admin to insert
ALTER TABLE mission_profiles DISABLE ROW LEVEL SECURITY;

-- Then re-enable RLS with proper policy
ALTER TABLE mission_profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing INSERT policy if it exists
DROP POLICY IF EXISTS "Only admins can insert mission profiles" ON mission_profiles;

-- Create new INSERT policy that properly checks admin status
CREATE POLICY "Only admins can insert mission profiles"
  ON mission_profiles
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.is_admin = true
    )
  );

-- Recreate other policies to ensure they work correctly
DROP POLICY IF EXISTS "Only admins can update mission profiles" ON mission_profiles;
CREATE POLICY "Only admins can update mission profiles"
  ON mission_profiles
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.is_admin = true
    )
  );

DROP POLICY IF EXISTS "Only admins can delete mission profiles" ON mission_profiles;
CREATE POLICY "Only admins can delete mission profiles"
  ON mission_profiles
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.is_admin = true
    )
  );

DROP POLICY IF EXISTS "Anyone can read active mission profiles" ON mission_profiles;
CREATE POLICY "Anyone can read active mission profiles"
  ON mission_profiles
  FOR SELECT
  USING (status = 'active' OR auth.uid() = created_by);

-- Verify policies are in place
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'mission_profiles'
ORDER BY policyname;
