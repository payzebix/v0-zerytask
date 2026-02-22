-- Invitation codes table
CREATE TABLE IF NOT EXISTS invitation_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  created_by UUID NOT NULL REFERENCES users(id),
  used_by UUID REFERENCES users(id) ON DELETE SET NULL,
  is_used BOOLEAN DEFAULT FALSE,
  used_at TIMESTAMP,
  expires_at TIMESTAMP,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'used', 'expired', 'revoked')),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS invitation_codes_code_idx ON invitation_codes(code);
CREATE INDEX IF NOT EXISTS invitation_codes_created_by_idx ON invitation_codes(created_by);
CREATE INDEX IF NOT EXISTS invitation_codes_used_by_idx ON invitation_codes(used_by);
CREATE INDEX IF NOT EXISTS invitation_codes_status_idx ON invitation_codes(status);
