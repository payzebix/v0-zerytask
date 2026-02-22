-- Allow created_by to be nullable for system-generated invitation codes
ALTER TABLE invitation_codes
ALTER COLUMN created_by DROP NOT NULL;

-- Create index on created_by to maintain performance
CREATE INDEX IF NOT EXISTS invitation_codes_created_by_null_idx 
ON invitation_codes(created_by) WHERE created_by IS NOT NULL;
