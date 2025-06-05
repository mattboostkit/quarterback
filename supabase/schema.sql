-- Quarterback Database Schema
-- Run this in your Supabase SQL editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Clients table for multi-tenancy
CREATE TABLE clients (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  branding_config JSONB DEFAULT '{
    "primaryColor": "#1e40af",
    "secondaryColor": "#3b82f6",
    "logo": null,
    "fontFamily": "Inter"
  }',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Projects table
CREATE TABLE projects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'archived')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Personas table
CREATE TABLE personas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  csv_file_path TEXT,
  raw_data JSONB,
  enriched_data JSONB,
  summary TEXT,
  demographics JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Conversations table
CREATE TABLE conversations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  persona_id UUID REFERENCES personas(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Messages table
CREATE TABLE messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  role TEXT CHECK (role IN ('user', 'assistant', 'system')) NOT NULL,
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Reports table
CREATE TABLE reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  persona_id UUID REFERENCES personas(id) ON DELETE SET NULL,
  type TEXT NOT NULL CHECK (type IN ('insights', 'campaign', 'media_planning', 'infographic')),
  title TEXT NOT NULL,
  content JSONB NOT NULL,
  file_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User-client relationship table for multi-tenancy
CREATE TABLE user_clients (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member' CHECK (role IN ('admin', 'member', 'viewer')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, client_id)
);

-- Indexes for performance
CREATE INDEX idx_projects_client_id ON projects(client_id);
CREATE INDEX idx_personas_project_id ON personas(project_id);
CREATE INDEX idx_conversations_persona_id ON conversations(persona_id);
CREATE INDEX idx_conversations_user_id ON conversations(user_id);
CREATE INDEX idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX idx_messages_created_at ON messages(created_at);
CREATE INDEX idx_reports_project_id ON reports(project_id);
CREATE INDEX idx_user_clients_user_id ON user_clients(user_id);
CREATE INDEX idx_user_clients_client_id ON user_clients(client_id);

-- Enable Row Level Security (RLS)
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE personas ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_clients ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Clients: Users can only see clients they belong to
CREATE POLICY "Users can view their clients" ON clients
  FOR SELECT USING (
    id IN (
      SELECT client_id FROM user_clients 
      WHERE user_id = auth.uid()
    )
  );

-- Projects: Users can see projects from their clients
CREATE POLICY "Users can view their client's projects" ON projects
  FOR SELECT USING (
    client_id IN (
      SELECT client_id FROM user_clients 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create projects for their clients" ON projects
  FOR INSERT WITH CHECK (
    client_id IN (
      SELECT client_id FROM user_clients 
      WHERE user_id = auth.uid() AND role IN ('admin', 'member')
    )
  );

-- Personas: Users can see personas from their client's projects
CREATE POLICY "Users can view personas" ON personas
  FOR SELECT USING (
    project_id IN (
      SELECT id FROM projects WHERE client_id IN (
        SELECT client_id FROM user_clients WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can create personas" ON personas
  FOR INSERT WITH CHECK (
    project_id IN (
      SELECT id FROM projects WHERE client_id IN (
        SELECT client_id FROM user_clients 
        WHERE user_id = auth.uid() AND role IN ('admin', 'member')
      )
    )
  );

-- Conversations: Users can only see their own conversations
CREATE POLICY "Users can view their conversations" ON conversations
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create conversations" ON conversations
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Messages: Users can see messages from their conversations
CREATE POLICY "Users can view messages" ON messages
  FOR SELECT USING (
    conversation_id IN (
      SELECT id FROM conversations WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create messages" ON messages
  FOR INSERT WITH CHECK (
    conversation_id IN (
      SELECT id FROM conversations WHERE user_id = auth.uid()
    )
  );

-- Reports: Users can see reports from their client's projects
CREATE POLICY "Users can view reports" ON reports
  FOR SELECT USING (
    project_id IN (
      SELECT id FROM projects WHERE client_id IN (
        SELECT client_id FROM user_clients WHERE user_id = auth.uid()
      )
    )
  );

-- User-clients: Users can see their own relationships
CREATE POLICY "Users can view their client relationships" ON user_clients
  FOR SELECT USING (user_id = auth.uid());

-- Storage buckets setup
INSERT INTO storage.buckets (id, name, public) VALUES 
  ('csv-uploads', 'csv-uploads', false),
  ('reports', 'reports', false),
  ('branding-assets', 'branding-assets', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies
CREATE POLICY "Users can upload CSV files" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'csv-uploads' AND
    auth.uid() IS NOT NULL
  );

CREATE POLICY "Users can view their CSV files" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'csv-uploads' AND
    auth.uid() IS NOT NULL
  );

-- Functions
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON clients
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
  
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
  
CREATE TRIGGER update_personas_updated_at BEFORE UPDATE ON personas
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
  
CREATE TRIGGER update_conversations_updated_at BEFORE UPDATE ON conversations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();