-- Create waitlist_entries table for landing page signups
CREATE TABLE IF NOT EXISTS public.waitlist_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  twitter_handle TEXT NOT NULL UNIQUE,
  referral_code TEXT NOT NULL UNIQUE,
  position INT GENERATED ALWAYS AS (ROW_NUMBER() OVER (ORDER BY created_at)) STORED,
  referral_count INT DEFAULT 0,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create waitlist_referrals table to track referrals
CREATE TABLE IF NOT EXISTS public.waitlist_referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_code TEXT NOT NULL,
  referred_email TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT fk_referrer FOREIGN KEY (referrer_code) REFERENCES public.waitlist_entries(referral_code) ON DELETE CASCADE,
  CONSTRAINT fk_referred FOREIGN KEY (referred_email) REFERENCES public.waitlist_entries(email) ON DELETE CASCADE
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_waitlist_email ON public.waitlist_entries(email);
CREATE INDEX IF NOT EXISTS idx_waitlist_twitter ON public.waitlist_entries(twitter_handle);
CREATE INDEX IF NOT EXISTS idx_waitlist_code ON public.waitlist_entries(referral_code);
CREATE INDEX IF NOT EXISTS idx_waitlist_created ON public.waitlist_entries(created_at);

-- Enable RLS
ALTER TABLE public.waitlist_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.waitlist_referrals ENABLE ROW LEVEL SECURITY;

-- Create RLS policies - Allow anyone to read all entries
CREATE POLICY "Anyone can read waitlist entries" 
ON public.waitlist_entries 
FOR SELECT 
TO authenticated, anon
USING (true);

-- Allow anyone to insert into waitlist
CREATE POLICY "Anyone can insert into waitlist" 
ON public.waitlist_entries 
FOR INSERT 
WITH CHECK (true);

-- Allow anyone to read referrals
CREATE POLICY "Anyone can read referrals" 
ON public.waitlist_referrals 
FOR SELECT 
TO authenticated, anon
USING (true);

-- Allow anyone to insert referrals
CREATE POLICY "Anyone can insert referrals" 
ON public.waitlist_referrals 
FOR INSERT 
WITH CHECK (true);
