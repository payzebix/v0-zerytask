-- Add scheduling and recurrence fields to missions table
ALTER TABLE public.missions
ADD COLUMN IF NOT EXISTS start_date DATE DEFAULT CURRENT_DATE,
ADD COLUMN IF NOT EXISTS end_date DATE,
ADD COLUMN IF NOT EXISTS recurrence TEXT DEFAULT 'once' CHECK (recurrence IN ('once', 'daily', 'weekly', 'monthly')),
ADD COLUMN IF NOT EXISTS max_completions INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS time_limited BOOLEAN DEFAULT FALSE;

-- Create index for date range queries
CREATE INDEX IF NOT EXISTS missions_start_date_idx ON public.missions(start_date);
CREATE INDEX IF NOT EXISTS missions_end_date_idx ON public.missions(end_date);
CREATE INDEX IF NOT EXISTS missions_recurrence_idx ON public.missions(recurrence);
