-- Create app_settings table if it doesn't exist
CREATE TABLE IF NOT EXISTS app_settings (
  id TEXT PRIMARY KEY DEFAULT 'main',
  maintenance_mode BOOLEAN DEFAULT FALSE,
  maintenance_message TEXT DEFAULT 'System under maintenance. We will be back soon.',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default settings if they don't exist
INSERT INTO app_settings (id, maintenance_mode, maintenance_message)
VALUES ('main', FALSE, 'System under maintenance. We will be back soon.')
ON CONFLICT (id) DO NOTHING;
