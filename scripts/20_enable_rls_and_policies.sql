-- Enable RLS on critical tables and create policies
-- This script enables Row Level Security for data access control

-- ========================================
-- 1. MISSIONS TABLE - Public READ, Admin WRITE
-- ========================================
ALTER TABLE missions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read active missions" ON missions
  FOR SELECT USING (status = 'active' OR status IS NULL);

CREATE POLICY "Only admins can insert missions" ON missions
  FOR INSERT WITH CHECK (auth.jwt() ->> 'is_admin' = 'true');

CREATE POLICY "Only admins can update missions" ON missions
  FOR UPDATE USING (auth.jwt() ->> 'is_admin' = 'true');

CREATE POLICY "Only admins can delete missions" ON missions
  FOR DELETE USING (auth.jwt() ->> 'is_admin' = 'true');

-- ========================================
-- 2. MISSION_PROFILES TABLE - Public READ, Admin WRITE
-- ========================================
ALTER TABLE mission_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read active mission profiles" ON mission_profiles
  FOR SELECT USING (status = 'active' OR status IS NULL);

CREATE POLICY "Only admins can insert mission profiles" ON mission_profiles
  FOR INSERT WITH CHECK (auth.jwt() ->> 'is_admin' = 'true');

CREATE POLICY "Only admins can update mission profiles" ON mission_profiles
  FOR UPDATE USING (auth.jwt() ->> 'is_admin' = 'true');

CREATE POLICY "Only admins can delete mission profiles" ON mission_profiles
  FOR DELETE USING (auth.jwt() ->> 'is_admin' = 'true');

-- ========================================
-- 3. MISSION_SUBMISSIONS TABLE
-- ========================================
ALTER TABLE mission_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read their own submissions" ON mission_submissions
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Admins can read all submissions" ON mission_submissions
  FOR SELECT USING (auth.jwt() ->> 'is_admin' = 'true');

CREATE POLICY "Authenticated users can create submissions" ON mission_submissions
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can update submissions" ON mission_submissions
  FOR UPDATE USING (auth.jwt() ->> 'is_admin' = 'true');

CREATE POLICY "Admins can delete submissions" ON mission_submissions
  FOR DELETE USING (auth.jwt() ->> 'is_admin' = 'true');

-- ========================================
-- 4. MISSION_COMPLETIONS TABLE
-- ========================================
ALTER TABLE mission_completions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read their own completions" ON mission_completions
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Admins can read all completions" ON mission_completions
  FOR SELECT USING (auth.jwt() ->> 'is_admin' = 'true');

CREATE POLICY "Authenticated users can create completions" ON mission_completions
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- ========================================
-- 5. EXCHANGE_REQUESTS TABLE
-- ========================================
ALTER TABLE exchange_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read their own requests" ON exchange_requests
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Admins can read all requests" ON exchange_requests
  FOR SELECT USING (auth.jwt() ->> 'is_admin' = 'true');

CREATE POLICY "Authenticated users can create requests" ON exchange_requests
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can update requests" ON exchange_requests
  FOR UPDATE USING (auth.jwt() ->> 'is_admin' = 'true');

-- ========================================
-- 6. USERS TABLE - Protected personal data
-- ========================================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read their own profile" ON users
  FOR SELECT USING (id = auth.uid());

CREATE POLICY "Admins can read all users" ON users
  FOR SELECT USING (auth.jwt() ->> 'is_admin' = 'true');

CREATE POLICY "Users can update their own profile" ON users
  FOR UPDATE USING (id = auth.uid());

CREATE POLICY "Admins can update any user" ON users
  FOR UPDATE USING (auth.jwt() ->> 'is_admin' = 'true');

-- ========================================
-- 7. REFERRALS TABLE
-- ========================================
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read their referrals" ON referrals
  FOR SELECT USING (referrer_id = auth.uid() OR referral_user_id = auth.uid());

CREATE POLICY "Admins can read all referrals" ON referrals
  FOR SELECT USING (auth.jwt() ->> 'is_admin' = 'true');

CREATE POLICY "Authenticated users can create referrals" ON referrals
  FOR INSERT WITH CHECK (
    referrer_id = auth.uid()
  );

-- ========================================
-- 8. SOCIAL_NETWORKS TABLE - Public READ, Admin WRITE
-- ========================================
ALTER TABLE social_networks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read social networks" ON social_networks
  FOR SELECT USING (true);

CREATE POLICY "Only admins can insert social networks" ON social_networks
  FOR INSERT WITH CHECK (auth.jwt() ->> 'is_admin' = 'true');

CREATE POLICY "Only admins can update social networks" ON social_networks
  FOR UPDATE USING (auth.jwt() ->> 'is_admin' = 'true');

-- ========================================
-- 9. MISSION_CATEGORIES TABLE - Public READ, Admin WRITE
-- ========================================
ALTER TABLE mission_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read mission categories" ON mission_categories
  FOR SELECT USING (true);

CREATE POLICY "Only admins can insert categories" ON mission_categories
  FOR INSERT WITH CHECK (auth.jwt() ->> 'is_admin' = 'true');

CREATE POLICY "Only admins can update categories" ON mission_categories
  FOR UPDATE USING (auth.jwt() ->> 'is_admin' = 'true');

-- ========================================
-- 10. INVITATION_CODES TABLE - Admin WRITE, Public READ (for validation)
-- ========================================
ALTER TABLE invitation_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read invitation codes" ON invitation_codes
  FOR SELECT USING (true);

CREATE POLICY "Admins and users can insert codes" ON invitation_codes
  FOR INSERT WITH CHECK (
    auth.jwt() ->> 'is_admin' = 'true' OR auth.uid() IS NOT NULL
  );

CREATE POLICY "Only admins can update codes" ON invitation_codes
  FOR UPDATE USING (auth.jwt() ->> 'is_admin' = 'true');
