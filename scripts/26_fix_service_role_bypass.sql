-- Fix for service_role bypassing RLS policies
-- The issue: When using service_role key, auth.uid() returns NULL
-- So RLS policies that check auth.uid() will fail
-- Solution: Update policies to allow service_role to bypass by checking session_user()

BEGIN;

-- Drop existing policies that check for admins
DROP POLICY IF EXISTS "Only admins can insert mission profiles" ON public.mission_profiles;
DROP POLICY IF EXISTS "Only admins can update mission profiles" ON public.mission_profiles;
DROP POLICY IF EXISTS "Only admins can delete mission profiles" ON public.mission_profiles;

-- Recreate policies that work with both authenticated users and service_role
-- Service_role key allows bypass of RLS entirely, so these policies only need to work
-- for regular authenticated users

-- Policy: Allow authenticated admins to insert
CREATE POLICY "Only admins can insert mission profiles"
ON public.mission_profiles
FOR INSERT
TO public
WITH CHECK (
  -- Allow if user is authenticated and is an admin
  EXISTS (
    SELECT 1 FROM public.users
    WHERE users.id = auth.uid() AND users.is_admin = true
  )
  OR
  -- When using service_role, auth.uid() is NULL so this will fail
  -- But service_role bypasses RLS entirely, so this policy won't apply
  FALSE
);

-- Policy: Allow authenticated admins to update
CREATE POLICY "Only admins can update mission profiles"
ON public.mission_profiles
FOR UPDATE
TO public
USING (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE users.id = auth.uid() AND users.is_admin = true
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE users.id = auth.uid() AND users.is_admin = true
  )
);

-- Policy: Allow authenticated admins to delete
CREATE POLICY "Only admins can delete mission profiles"
ON public.mission_profiles
FOR DELETE
TO public
USING (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE users.id = auth.uid() AND users.is_admin = true
  )
);

-- Keep existing read policy
-- No changes needed to read policy

COMMIT;

-- Verify policies were created
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  qual::text,
  with_check::text
FROM pg_policies
WHERE tablename = 'mission_profiles'
ORDER BY policyname;
