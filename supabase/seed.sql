-- Seed data for Quarterback MVP Demo

-- Create a demo client
INSERT INTO clients (id, name, branding_config) VALUES (
  '11111111-1111-1111-1111-111111111111',
  'Demo Client',
  '{
    "primaryColor": "#1e40af",
    "secondaryColor": "#3b82f6",
    "logo": null,
    "fontFamily": "Inter"
  }'
) ON CONFLICT (id) DO NOTHING;

-- Create a demo project
INSERT INTO projects (id, client_id, name, description, status) VALUES (
  '22222222-2222-2222-2222-222222222222',
  '11111111-1111-1111-1111-111111111111',
  'Demo Project',
  'Default project for MVP testing',
  'active'
) ON CONFLICT (id) DO NOTHING;

-- For MVP demo, temporarily allow public access (remove in production!)
CREATE POLICY "Allow public access for demo" ON personas
  FOR ALL USING (project_id = '22222222-2222-2222-2222-222222222222');

CREATE POLICY "Allow public access for demo" ON conversations
  FOR ALL USING (true);

CREATE POLICY "Allow public access for demo" ON messages
  FOR ALL USING (true);