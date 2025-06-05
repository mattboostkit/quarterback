-- Update existing database with missing components
-- Safe to run multiple times

-- First, let's add the storage bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('csv-uploads', 'csv-uploads', false)
ON CONFLICT (id) DO NOTHING;

-- Add demo client (safe to run multiple times)
INSERT INTO clients (id, name, branding_config) VALUES (
  '11111111-1111-1111-1111-111111111111',
  'Demo Client',
  '{
    "primaryColor": "#1e40af",
    "secondaryColor": "#3b82f6",
    "logo": null,
    "fontFamily": "Inter"
  }'
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  branding_config = EXCLUDED.branding_config;

-- Add demo project (safe to run multiple times)
INSERT INTO projects (id, client_id, name, description, status) VALUES (
  '22222222-2222-2222-2222-222222222222',
  '11111111-1111-1111-1111-111111111111',
  'Demo Project',
  'Default project for MVP testing',
  'active'
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description;

-- Drop any existing conflicting policies
DROP POLICY IF EXISTS "Allow public access for demo" ON personas;
DROP POLICY IF EXISTS "Allow public access for demo" ON conversations;
DROP POLICY IF EXISTS "Allow public access for demo" ON messages;

-- Create MVP demo policies (allow anonymous access)
CREATE POLICY "MVP Demo - Allow anonymous personas access" ON personas
  FOR ALL USING (project_id = '22222222-2222-2222-2222-222222222222');

CREATE POLICY "MVP Demo - Allow anonymous conversations access" ON conversations
  FOR ALL USING (true);

CREATE POLICY "MVP Demo - Allow anonymous messages access" ON messages
  FOR ALL USING (true);

-- Storage policies for anonymous uploads
DROP POLICY IF EXISTS "Users can upload CSV files" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their CSV files" ON storage.objects;

CREATE POLICY "MVP Demo - Allow anonymous CSV uploads" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'csv-uploads');

CREATE POLICY "MVP Demo - Allow anonymous CSV reads" ON storage.objects
  FOR SELECT USING (bucket_id = 'csv-uploads');

CREATE POLICY "MVP Demo - Allow anonymous CSV updates" ON storage.objects
  FOR UPDATE USING (bucket_id = 'csv-uploads');

-- Grant necessary permissions to anonymous users
GRANT USAGE ON SCHEMA public TO anon;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon;

-- Output success message
SELECT 'Setup completed successfully! Demo client ID: 11111111-1111-1111-1111-111111111111' AS status;