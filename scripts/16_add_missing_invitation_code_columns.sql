-- Add missing columns to invitation_codes table

-- Add code_type column
ALTER TABLE invitation_codes
ADD COLUMN IF NOT EXISTS code_type VARCHAR(50) DEFAULT 'admin';

-- Add max_uses column for tracking invitation limits
ALTER TABLE invitation_codes
ADD COLUMN IF NOT EXISTS max_uses INTEGER DEFAULT 1;

-- Add current_uses column to track how many times a code has been used
ALTER TABLE invitation_codes
ADD COLUMN IF NOT EXISTS current_uses INTEGER DEFAULT 0;

-- Add week_reset_date to track when usage resets weekly
ALTER TABLE invitation_codes
ADD COLUMN IF NOT EXISTS week_reset_date TIMESTAMP;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_invitation_codes_type ON invitation_codes(code_type);
CREATE INDEX IF NOT EXISTS idx_invitation_codes_current_uses ON invitation_codes(current_uses);
