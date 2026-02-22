-- Add new columns to missions table
BEGIN;

-- Add columns if they don't already exist
ALTER TABLE missions ADD COLUMN IF NOT EXISTS mission_profile_id UUID REFERENCES mission_profiles(id);
ALTER TABLE missions ADD COLUMN IF NOT EXISTS mission_type_id UUID REFERENCES mission_types(id);
ALTER TABLE missions ADD COLUMN IF NOT EXISTS social_network_id UUID REFERENCES social_networks(id);
ALTER TABLE missions ADD COLUMN IF NOT EXISTS website_url VARCHAR(500);
ALTER TABLE missions ADD COLUMN IF NOT EXISTS priority VARCHAR(50) DEFAULT 'medium';
ALTER TABLE missions ADD COLUMN IF NOT EXISTS verification_type VARCHAR(50) DEFAULT 'manual';

-- Add columns to mission_submissions
ALTER TABLE mission_submissions ADD COLUMN IF NOT EXISTS verified_by UUID REFERENCES auth.users(id);
ALTER TABLE mission_submissions ADD COLUMN IF NOT EXISTS verified_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE mission_submissions ADD COLUMN IF NOT EXISTS admin_notes TEXT;

-- Add columns to users
ALTER TABLE users ADD COLUMN IF NOT EXISTS xp_balance INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS zeryt_balance DECIMAL(18, 8) DEFAULT 0;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_missions_profile_id ON missions(mission_profile_id);
CREATE INDEX IF NOT EXISTS idx_missions_type_id ON missions(mission_type_id);
CREATE INDEX IF NOT EXISTS idx_missions_priority ON missions(priority);
CREATE INDEX IF NOT EXISTS idx_submissions_verified_by ON mission_submissions(verified_by);
CREATE INDEX IF NOT EXISTS idx_users_xp_balance ON users(xp_balance);
CREATE INDEX IF NOT EXISTS idx_users_zeryt_balance ON users(zeryt_balance);

COMMIT;
