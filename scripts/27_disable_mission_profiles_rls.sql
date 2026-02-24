-- Disable RLS on mission_profiles table and fix policies
-- The API already has authentication checks, so RLS policies are redundant
-- and causing issues with the service_role key

BEGIN;

-- First, let's check current RLS status
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' AND tablename = 'mission_profiles';

-- Disable RLS on mission_profiles table
-- The API layer already enforces authentication and authorization
ALTER TABLE public.mission_profiles DISABLE ROW LEVEL SECURITY;

-- Alternative: If we want to keep RLS for future, drop the problematic policies
-- and create new ones that work with both authenticated users and service_role

-- DROP POLICY IF EXISTS "Only admins can insert mission profiles" ON public.mission_profiles;
-- DROP POLICY IF EXISTS "Only admins can update mission profiles" ON public.mission_profiles;
-- DROP POLICY IF EXISTS "Only admins can delete mission profiles" ON public.mission_profiles;

-- -- Create policies that allow anyone (auth will be checked in API)
-- CREATE POLICY "Anyone can insert mission profiles"
-- ON public.mission_profiles FOR INSERT
-- WITH CHECK (true);

-- CREATE POLICY "Anyone can update mission profiles"
-- ON public.mission_profiles FOR UPDATE
-- WITH CHECK (true);

-- CREATE POLICY "Anyone can delete mission profiles"  
-- ON public.mission_profiles FOR DELETE
-- USING (true);

-- Verify RLS is disabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' AND tablename = 'mission_profiles';

-- List remaining policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles
FROM pg_policies
WHERE tablename = 'mission_profiles'
ORDER BY policyname;

COMMIT;
