-- Check current mission statuses
SELECT id, title, status FROM missions LIMIT 10;

-- Update all missions with NULL or missing status to 'active'
UPDATE missions 
SET status = 'active' 
WHERE status IS NULL OR status = '';

-- Update all mission profiles with NULL or missing status to 'active'
UPDATE mission_profiles 
SET status = 'active' 
WHERE status IS NULL OR status = '';

-- Verify updates
SELECT COUNT(*) as total_missions, COUNT(CASE WHEN status = 'active' THEN 1 END) as active_missions FROM missions;
SELECT COUNT(*) as total_profiles, COUNT(CASE WHEN status = 'active' THEN 1 END) as active_profiles FROM mission_profiles;
