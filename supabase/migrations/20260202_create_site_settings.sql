-- Site Settings Table
-- Stores global site configuration including theme

CREATE TABLE IF NOT EXISTS site_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key TEXT UNIQUE NOT NULL,
    value JSONB NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now(),
    updated_by UUID REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;

-- Drop existing policies first (idempotent)
DROP POLICY IF EXISTS "Anyone can read site settings" ON site_settings;
DROP POLICY IF EXISTS "Authenticated users can update site settings" ON site_settings;
DROP POLICY IF EXISTS "Authenticated users can insert site settings" ON site_settings;

-- Everyone can read site settings
CREATE POLICY "Anyone can read site settings" ON site_settings
    FOR SELECT USING (true);

-- Only authenticated users can update (admin check can be added later)
CREATE POLICY "Authenticated users can update site settings" ON site_settings
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert site settings" ON site_settings
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Insert default theme
INSERT INTO site_settings (key, value) 
VALUES ('theme', '"emerald-night"')
ON CONFLICT (key) DO NOTHING;

-- Create index for fast lookup
CREATE INDEX IF NOT EXISTS idx_site_settings_key ON site_settings(key);
