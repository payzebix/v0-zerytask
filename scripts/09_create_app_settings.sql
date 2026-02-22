-- Create app_settings table for system configuration
CREATE TABLE IF NOT EXISTS public.app_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  maintenance_mode BOOLEAN DEFAULT FALSE,
  maintenance_message TEXT DEFAULT 'System under maintenance. Please try again later.',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create initial settings record
INSERT INTO public.app_settings (maintenance_mode, maintenance_message)
VALUES (FALSE, 'System under maintenance. Please try again later.')
ON CONFLICT DO NOTHING;

-- Enable RLS
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to read settings
CREATE POLICY "Anyone can read app settings"
  ON public.app_settings
  FOR SELECT
  TO authenticated
  USING (TRUE);

-- Only admins can update settings
CREATE POLICY "Only admins can update app settings"
  ON public.app_settings
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE public.users.id = auth.uid()
      AND public.users.is_admin = TRUE
    )
  );
