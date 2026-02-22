-- Add time fields to missions table
ALTER TABLE IF EXISTS missions
ADD COLUMN IF NOT EXISTS schedule_start_time TEXT DEFAULT '00:00';

ALTER TABLE IF EXISTS missions  
ADD COLUMN IF NOT EXISTS schedule_end_time TEXT DEFAULT '23:59';
