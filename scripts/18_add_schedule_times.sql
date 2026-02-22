ALTER TABLE missions ADD COLUMN schedule_start_time TEXT DEFAULT '00:00';
ALTER TABLE missions ADD COLUMN schedule_end_time TEXT DEFAULT '23:59';
