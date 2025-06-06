-- Setup script for anonymous access (MVP without authentication)
-- Run this after the main schema.sql

-- Disable RLS temporarily for MVP (anonymous access)
ALTER TABLE clients DISABLE ROW LEVEL SECURITY;
ALTER TABLE projects DISABLE ROW LEVEL SECURITY;
ALTER TABLE personas DISABLE ROW LEVEL SECURITY;
ALTER TABLE conversations DISABLE ROW LEVEL SECURITY;
ALTER TABLE messages DISABLE ROW LEVEL SECURITY;
ALTER TABLE reports DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_clients DISABLE ROW LEVEL SECURITY;

-- Create anonymous access policies
CREATE POLICY "Anyone can read clients" ON clients
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Anyone can read projects" ON projects
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Anyone can read personas" ON personas
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Anyone can manage conversations" ON conversations
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Anyone can manage messages" ON messages
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Anyone can read reports" ON reports
  FOR ALL USING (true) WITH CHECK (true);

-- Insert default data for MVP
INSERT INTO clients (id, name) VALUES 
  ('11111111-1111-1111-1111-111111111111', 'UNTAPPED')
ON CONFLICT (id) DO NOTHING;

INSERT INTO projects (id, client_id, name, description) VALUES 
  ('22222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', 'Tottenham Hotspur', 'Fan audience insights')
ON CONFLICT (id) DO NOTHING;