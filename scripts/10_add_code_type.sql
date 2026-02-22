-- Add code_type column to invitation_codes if it doesn't exist
ALTER TABLE invitation_codes
ADD COLUMN IF NOT EXISTS code_type VARCHAR(50) DEFAULT 'admin';

-- Create index on code_type for faster queries
CREATE INDEX IF NOT EXISTS idx_invitation_codes_type ON invitation_codes(code_type);

-- Update PAY1810 to ensure it's set as admin code
UPDATE invitation_codes
SET code_type = 'admin'
WHERE code = 'PAY1810';
