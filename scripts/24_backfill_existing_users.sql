-- ============================================================================
-- Backfill existing auth.users into public.users table
-- ============================================================================
-- This script creates records in public.users for any auth.users that don't 
-- have a corresponding entry (in case they registered before the trigger was created)

INSERT INTO public.users (
  id,
  email,
  username,
  password_hash,
  is_admin,
  xp_balance,
  zeryt_balance,
  current_level,
  referral_code,
  status,
  created_at,
  updated_at
)
SELECT
  au.id,
  au.email,
  COALESCE(au.raw_user_meta_data->>'username', SPLIT_PART(au.email, '@', 1)),
  '', -- Empty password hash, actual password is in auth.users
  (au.email = 'remgoficial@gmail.com'),
  0,
  0,
  1,
  NULL,
  'active',
  au.created_at,
  au.updated_at
FROM auth.users au
WHERE NOT EXISTS (
  SELECT 1 FROM public.users pu WHERE pu.id = au.id
)
ON CONFLICT (id) DO NOTHING;

-- Log results
SELECT 
  COUNT(*) as users_backfilled
FROM auth.users au
WHERE NOT EXISTS (
  SELECT 1 FROM public.users pu WHERE pu.id = au.id
);

-- Show summary
SELECT 
  'Backfill complete' as message,
  (SELECT COUNT(*) FROM auth.users) as total_auth_users,
  (SELECT COUNT(*) FROM public.users) as total_public_users;
