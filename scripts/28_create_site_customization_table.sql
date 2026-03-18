-- Create site_customization table for storing website appearance settings
CREATE TABLE IF NOT EXISTS public.site_customization (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Primary Colors (stored as hex strings)
  primary_color varchar DEFAULT '#3b82f6',
  primary_foreground varchar DEFAULT '#ffffff',
  secondary_color varchar DEFAULT '#8b5cf6',
  secondary_foreground varchar DEFAULT '#ffffff',
  accent_color varchar DEFAULT '#ec4899',
  accent_foreground varchar DEFAULT '#ffffff',
  
  -- Neutral Colors
  background_color varchar DEFAULT '#ffffff',
  foreground_color varchar DEFAULT '#000000',
  muted_bg varchar DEFAULT '#f3f4f6',
  muted_fg varchar DEFAULT '#6b7280',
  border_color varchar DEFAULT '#e5e7eb',
  card_bg varchar DEFAULT '#ffffff',
  
  -- Typography
  font_sans varchar DEFAULT 'Inter, sans-serif',
  font_mono varchar DEFAULT 'Fira Code, monospace',
  heading_font varchar DEFAULT 'Poppins, sans-serif',
  base_font_size integer DEFAULT 16,
  heading_line_height numeric DEFAULT 1.2,
  body_line_height numeric DEFAULT 1.6,
  
  -- Website Branding
  site_name varchar DEFAULT 'ZeryTask',
  site_description text,
  logo_url varchar,
  favicon_url varchar,
  
  -- Icons
  header_icon_url varchar,
  footer_icon_url varchar,
  
  -- Layout Options
  navbar_style varchar DEFAULT 'default',
  theme_mode varchar DEFAULT 'light',
  rounded_corners varchar DEFAULT 'medium',
  
  -- Version Control
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  last_updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Backup for rollback
  previous_version jsonb,
  version_number integer DEFAULT 1
);

-- Enable RLS
ALTER TABLE public.site_customization ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Anyone can read site customization"
  ON public.site_customization
  FOR SELECT
  USING (true);

CREATE POLICY "Only admins can update site customization"
  ON public.site_customization
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid() AND users.is_admin = true
    )
  );

CREATE POLICY "Only admins can insert site customization"
  ON public.site_customization
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid() AND users.is_admin = true
    )
  );

-- Insert default configuration
INSERT INTO public.site_customization (site_name, site_description)
VALUES ('ZeryTask', 'Complete your missions and earn rewards')
ON CONFLICT DO NOTHING;

-- Create index
CREATE INDEX IF NOT EXISTS idx_site_customization_created_at 
  ON public.site_customization(created_at DESC);
