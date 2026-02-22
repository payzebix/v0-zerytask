-- Create Default Admin User
-- Email: admin@zerytask.ve
-- Password: admin123 (hashed with bcrypt)
-- Hash: $2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcg7b3XeKeUxWdeS86E36P4/cOm

INSERT INTO public.users (
  email,
  password_hash,
  username,
  is_admin,
  xp_balance,
  zeryt_balance,
  current_level,
  referral_code,
  status,
  created_at,
  updated_at
) VALUES (
  'admin@zerytask.ve',
  '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcg7b3XeKeUxWdeS86E36P4/cOm',
  'admin',
  TRUE,
  0,
  0,
  1,
  'ADMIN000000',
  'active',
  NOW(),
  NOW()
)
ON CONFLICT (email) DO NOTHING;
