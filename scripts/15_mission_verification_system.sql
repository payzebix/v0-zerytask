-- Mission Verification System
-- This migration adds support for multiple verification types:
-- 1. AUTOMATIC - Mission completes when user clicks "Go to Mission"
-- 2. TEXT - User must submit text (admin provides example with placeholder like @user)
-- 3. IMAGE - User uploads image proof (admin provides example image)
-- 4. LINK - User submits link that must match domain pattern (admin sets domain)

-- 1. Create mission_verifications table to store verification configuration per mission
CREATE TABLE IF NOT EXISTS mission_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mission_id UUID NOT NULL REFERENCES missions(id) ON DELETE CASCADE,
  verification_type TEXT NOT NULL CHECK (verification_type IN ('automatic', 'text', 'image', 'link')),
  
  -- For TEXT verification
  text_label TEXT, -- e.g., "Enter your Twitter handle"
  text_example TEXT, -- e.g., "@yourhandle"
  
  -- For IMAGE verification
  image_example_url TEXT, -- URL to example image uploaded by admin
  
  -- For LINK verification
  link_domain TEXT, -- e.g., "https://x.com" - user's link must start with this
  link_description TEXT, -- e.g., "Share this mission on X"
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Update mission_submissions to support multiple verification data
ALTER TABLE mission_submissions ADD COLUMN IF NOT EXISTS 
  verification_data JSONB DEFAULT '{}';

-- This JSONB field stores:
-- For TEXT: { "submitted_text": "user's text input" }
-- For IMAGE: { "image_url": "uploaded image url" }
-- For LINK: { "submitted_link": "user's link", "verified_link": true/false }
-- For AUTOMATIC: { "auto_completed": true }

-- 3. Create mission_verifications_pending for manual verification approval
CREATE TABLE IF NOT EXISTS mission_verifications_pending (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mission_submission_id UUID NOT NULL REFERENCES mission_submissions(id) ON DELETE CASCADE,
  mission_id UUID NOT NULL REFERENCES missions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  verification_type TEXT NOT NULL CHECK (verification_type IN ('text', 'image', 'link')),
  
  -- Submitted data
  submitted_text TEXT,
  submitted_link TEXT,
  submitted_image_url TEXT,
  
  -- Admin review
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_by UUID REFERENCES users(id),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  admin_notes TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Enable Row Level Security
ALTER TABLE mission_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE mission_verifications_pending ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies for mission_verifications
CREATE POLICY "Anyone can read mission verifications"
  ON mission_verifications
  FOR SELECT
  USING (TRUE);

CREATE POLICY "Only admins can create mission verifications"
  ON mission_verifications
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.is_admin = TRUE
    )
  );

CREATE POLICY "Only admins can update mission verifications"
  ON mission_verifications
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.is_admin = TRUE
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.is_admin = TRUE
    )
  );

-- 6. RLS Policies for mission_verifications_pending
CREATE POLICY "Users can read their own pending verifications"
  ON mission_verifications_pending
  FOR SELECT
  USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.is_admin = TRUE
    )
  );

CREATE POLICY "Users can create pending verifications"
  ON mission_verifications_pending
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Only admins can approve verifications"
  ON mission_verifications_pending
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.is_admin = TRUE
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.is_admin = TRUE
    )
  );

-- 7. Create indexes
CREATE INDEX IF NOT EXISTS idx_mission_verifications_mission_id ON mission_verifications(mission_id);
CREATE INDEX IF NOT EXISTS idx_mission_verifications_pending_mission_id ON mission_verifications_pending(mission_id);
CREATE INDEX IF NOT EXISTS idx_mission_verifications_pending_user_id ON mission_verifications_pending(user_id);
CREATE INDEX IF NOT EXISTS idx_mission_verifications_pending_status ON mission_verifications_pending(status);

COMMIT;
