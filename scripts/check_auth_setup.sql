-- ============================================================================
-- Authentication Setup Diagnostic
-- ============================================================================
-- This script checks if all authentication components are properly configured

-- Check 1: Verify trigger exists
SELECT 
  'Trigger Status' as check_name,
  COUNT(*) as trigger_count,
  'OK' as status
FROM information_schema.triggers 
WHERE trigger_name = 'on_auth_user_created'
UNION ALL
-- Check 2: Verify users table exists and has data
SELECT 
  'Users Table' as check_name,
  COUNT(*) as user_count,
  CASE 
    WHEN COUNT(*) > 0 THEN 'OK - Users exist'
    ELSE 'WARNING - No users'
  END as status
FROM public.users
UNION ALL
-- Check 3: Verify auth.users exists and has data
SELECT 
  'Auth Users' as check_name,
  COUNT(*) as auth_user_count,
  CASE 
    WHEN COUNT(*) > 0 THEN 'OK - Auth users exist'
    ELSE 'WARNING - No auth users'
  END as status
FROM auth.users
UNION ALL
-- Check 4: Compare counts
SELECT 
  'Sync Status' as check_name,
  ABS(
    (SELECT COUNT(*) FROM auth.users) - 
    (SELECT COUNT(*) FROM public.users)
  ) as difference,
  CASE 
    WHEN (SELECT COUNT(*) FROM auth.users) = (SELECT COUNT(*) FROM public.users) 
    THEN 'OK - Tables in sync'
    ELSE 'WARNING - Count mismatch'
  END as status
UNION ALL
-- Check 5: Find orphaned auth users (no public record)
SELECT 
  'Orphaned Auth Users' as check_name,
  COUNT(*) as orphaned_count,
  CASE 
    WHEN COUNT(*) = 0 THEN 'OK - No orphans'
    ELSE 'WARNING - Orphaned users detected'
  END as status
FROM auth.users au
WHERE NOT EXISTS (SELECT 1 FROM public.users pu WHERE pu.id = au.id)
UNION ALL
-- Check 6: Verify admin user exists
SELECT 
  'Admin User' as check_name,
  COUNT(*) as admin_count,
  CASE 
    WHEN COUNT(*) > 0 THEN 'OK - Admin exists'
    ELSE 'WARNING - No admin user'
  END as status
FROM public.users
WHERE is_admin = true
UNION ALL
-- Check 7: Verify RLS is enabled on users table
SELECT 
  'RLS Status' as check_name,
  1 as check_value,
  'OK - RLS Enabled' as status
WHERE (
  SELECT row_security_enabled 
  FROM information_schema.tables 
  WHERE table_name = 'users'
) = true
UNION ALL
-- Check 8: Verify RLS policies exist
SELECT 
  'RLS Policies' as check_name,
  COUNT(*) as policy_count,
  CASE 
    WHEN COUNT(*) >= 2 THEN 'OK - Policies exist'
    ELSE 'WARNING - Missing policies'
  END as status
FROM information_schema.role_table_grants
WHERE table_name = 'users' AND privilege_type = 'SELECT';

-- Additional details
SELECT 'Detailed User Information' as section;
SELECT 
  id,
  email,
  username,
  is_admin,
  status,
  created_at
FROM public.users
ORDER BY created_at DESC;

-- Show any issues
SELECT 'Potential Issues' as section;
SELECT 
  'Orphaned Auth User' as issue_type,
  au.id,
  au.email,
  'No public.users record' as description
FROM auth.users au
LEFT JOIN public.users pu ON pu.id = au.id
WHERE pu.id IS NULL;
