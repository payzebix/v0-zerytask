-- Drop broken RLS policies that cause infinite recursion
-- Execute this BEFORE running the fixed RLS script

-- Disable RLS temporarily to drop policies
ALTER TABLE missions DISABLE ROW LEVEL SECURITY;
ALTER TABLE mission_profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE mission_submissions DISABLE ROW LEVEL SECURITY;
ALTER TABLE mission_completions DISABLE ROW LEVEL SECURITY;
ALTER TABLE exchange_requests DISABLE ROW LEVEL SECURITY;
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE referrals DISABLE ROW LEVEL SECURITY;
ALTER TABLE social_networks DISABLE ROW LEVEL SECURITY;
ALTER TABLE mission_categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE invitation_codes DISABLE ROW LEVEL SECURITY;

-- Drop all existing policies on these tables
DROP POLICY IF EXISTS "Anyone can read active missions" ON missions;
DROP POLICY IF EXISTS "Only admins can insert missions" ON missions;
DROP POLICY IF EXISTS "Only admins can update missions" ON missions;
DROP POLICY IF EXISTS "Only admins can delete missions" ON missions;

DROP POLICY IF EXISTS "Anyone can read active mission profiles" ON mission_profiles;
DROP POLICY IF EXISTS "Only admins can insert mission profiles" ON mission_profiles;
DROP POLICY IF EXISTS "Only admins can update mission profiles" ON mission_profiles;
DROP POLICY IF EXISTS "Only admins can delete mission profiles" ON mission_profiles;

DROP POLICY IF EXISTS "Users can read their own submissions" ON mission_submissions;
DROP POLICY IF EXISTS "Admins can read all submissions" ON mission_submissions;
DROP POLICY IF EXISTS "Authenticated users can create submissions" ON mission_submissions;
DROP POLICY IF EXISTS "Admins can update submissions" ON mission_submissions;
DROP POLICY IF EXISTS "Admins can delete submissions" ON mission_submissions;

DROP POLICY IF EXISTS "Users can read their own completions" ON mission_completions;
DROP POLICY IF EXISTS "Admins can read all completions" ON mission_completions;
DROP POLICY IF EXISTS "Authenticated users can create completions" ON mission_completions;

DROP POLICY IF EXISTS "Users can read their own requests" ON exchange_requests;
DROP POLICY IF EXISTS "Admins can read all requests" ON exchange_requests;
DROP POLICY IF EXISTS "Authenticated users can create requests" ON exchange_requests;
DROP POLICY IF EXISTS "Admins can update requests" ON exchange_requests;

DROP POLICY IF EXISTS "Users can read their own profile" ON users;
DROP POLICY IF EXISTS "Admins can read all users" ON users;
DROP POLICY IF EXISTS "Users can update their own profile" ON users;
DROP POLICY IF EXISTS "Admins can update any user" ON users;

DROP POLICY IF EXISTS "Users can read their referrals" ON referrals;
DROP POLICY IF EXISTS "Admins can read all referrals" ON referrals;
DROP POLICY IF EXISTS "Authenticated users can create referrals" ON referrals;

DROP POLICY IF EXISTS "Anyone can read social networks" ON social_networks;
DROP POLICY IF EXISTS "Only admins can insert social networks" ON social_networks;
DROP POLICY IF EXISTS "Only admins can update social networks" ON social_networks;

DROP POLICY IF EXISTS "Anyone can read mission categories" ON mission_categories;
DROP POLICY IF EXISTS "Only admins can insert categories" ON mission_categories;
DROP POLICY IF EXISTS "Only admins can update categories" ON mission_categories;

DROP POLICY IF EXISTS "Anyone can read invitation codes" ON invitation_codes;
DROP POLICY IF EXISTS "Only admins can insert codes" ON invitation_codes;
DROP POLICY IF EXISTS "Admins and users can insert codes" ON invitation_codes;
DROP POLICY IF EXISTS "Only admins can update codes" ON invitation_codes;
