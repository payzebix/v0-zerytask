-- Add columns to social_networks table if they don't exist
BEGIN;

ALTER TABLE social_networks 
ADD COLUMN IF NOT EXISTS verification_method VARCHAR(50) DEFAULT 'automatic',
ADD COLUMN IF NOT EXISTS is_custom BOOLEAN DEFAULT false;

-- Create index
CREATE INDEX IF NOT EXISTS idx_social_networks_verification_method ON social_networks(verification_method);

-- Update mission_profiles to include category information
ALTER TABLE mission_profiles
ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES mission_categories(id);

CREATE INDEX IF NOT EXISTS idx_mission_profiles_category_id ON mission_profiles(category_id);

COMMIT;
