-- Add mission schedule fields
ALTER TABLE missions ADD COLUMN IF NOT EXISTS schedule_type VARCHAR(50) DEFAULT 'unlimited';
-- schedule_type: 'unlimited', 'daily', 'weekly', 'monthly', 'date_specific'

ALTER TABLE missions ADD COLUMN IF NOT EXISTS schedule_start_date TIMESTAMP;
ALTER TABLE missions ADD COLUMN IF NOT EXISTS schedule_end_date TIMESTAMP;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_missions_schedule ON missions(schedule_type, schedule_start_date, schedule_end_date);

-- Add comment
COMMENT ON COLUMN missions.schedule_type IS 'Type of mission scheduling: unlimited, daily, weekly, monthly, date_specific';
COMMIT;
