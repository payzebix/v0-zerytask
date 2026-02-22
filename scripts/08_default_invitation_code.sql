-- Add max_uses column to invitation_codes if it doesn't exist
ALTER TABLE invitation_codes ADD COLUMN IF NOT EXISTS max_uses INTEGER DEFAULT 1;
ALTER TABLE invitation_codes ADD COLUMN IF NOT EXISTS use_count INTEGER DEFAULT 0;

-- Create a system user for default codes if needed
INSERT INTO users (email, is_admin, password_hash, created_at)
SELECT 'system@admin.local', TRUE, 'system_generated_code', NOW()
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'system@admin.local');

-- Create the default invitation code PAY1810 with 1 max use (single-use for admin)
INSERT INTO invitation_codes (code, created_by, max_uses, status, created_at)
SELECT 'PAY1810', (SELECT id FROM users WHERE email = 'system@admin.local' LIMIT 1), 1, 'active', NOW()
WHERE NOT EXISTS (SELECT 1 FROM invitation_codes WHERE code = 'PAY1810');

-- Update if already exists
UPDATE invitation_codes 
SET max_uses = 1, status = 'active', use_count = 0
WHERE code = 'PAY1810';
