-- Make created_by nullable to allow system-generated invitation codes
ALTER TABLE invitation_codes 
ALTER COLUMN created_by DROP NOT NULL;
