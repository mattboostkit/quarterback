-- Quarterback Database Setup - Idempotent Script
-- This script can be run multiple times safely
-- It checks what exists before creating/updating

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Helper function to check if a table exists
CREATE OR REPLACE FUNCTION table_exists(table_name text) 
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = $1
  );
END;
$$ LANGUAGE plpgsql;

-- Helper function to check if a policy exists
CREATE OR REPLACE FUNCTION policy_exists(table_name text, policy_name text) 
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = $1 
    AND policyname = $2
  );
END;
$$ LANGUAGE plpgsql;

-- Helper function to check if an index exists
CREATE OR REPLACE FUNCTION index_exists(index_name text) 
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT FROM pg_indexes 
    WHERE schemaname = 'public' 
    AND indexname = $1
  );
END;
$$ LANGUAGE plpgsql;

-- Create tables if they don't exist

-- Clients table
DO $$ 
BEGIN
  IF NOT table_exists('clients') THEN
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
    RAISE NOTICE 'Created table: clients';
  END IF;
END $$;

-- Projects table
DO $$ 
BEGIN
  IF NOT table_exists('projects') THEN
    CREATE TABLE projects (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      description TEXT,
      status TEXT DEFAULT 'active' CHECK (status IN ('active', 'archived')),
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
    RAISE NOTICE 'Created table: projects';
  END IF;
END $$;

-- Personas table
DO $$ 
BEGIN
  IF NOT table_exists('personas') THEN
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
    RAISE NOTICE 'Created table: personas';
  END IF;
END $$;

-- Conversations table
DO $$ 
BEGIN
  IF NOT table_exists('conversations') THEN
    CREATE TABLE conversations (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      persona_id UUID REFERENCES personas(id) ON DELETE CASCADE,
      user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
      title TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
    RAISE NOTICE 'Created table: conversations';
  END IF;
END $$;

-- Messages table
DO $$ 
BEGIN
  IF NOT table_exists('messages') THEN
    CREATE TABLE messages (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
      role TEXT CHECK (role IN ('user', 'assistant', 'system')) NOT NULL,
      content TEXT NOT NULL,
      metadata JSONB DEFAULT '{}',
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
    RAISE NOTICE 'Created table: messages';
  END IF;
END $$;

-- Reports table
DO $$ 
BEGIN
  IF NOT table_exists('reports') THEN
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
    RAISE NOTICE 'Created table: reports';
  END IF;
END $$;

-- User-client relationship table
DO $$ 
BEGIN
  IF NOT table_exists('user_clients') THEN
    CREATE TABLE user_clients (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
      client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
      role TEXT DEFAULT 'member' CHECK (role IN ('admin', 'member', 'viewer')),
      created_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(user_id, client_id)
    );
    RAISE NOTICE 'Created table: user_clients';
  END IF;
END $$;

-- Create indexes if they don't exist
DO $$ 
BEGIN
  IF NOT index_exists('idx_projects_client_id') THEN
    CREATE INDEX idx_projects_client_id ON projects(client_id);
    RAISE NOTICE 'Created index: idx_projects_client_id';
  END IF;
  
  IF NOT index_exists('idx_personas_project_id') THEN
    CREATE INDEX idx_personas_project_id ON personas(project_id);
    RAISE NOTICE 'Created index: idx_personas_project_id';
  END IF;
  
  IF NOT index_exists('idx_conversations_persona_id') THEN
    CREATE INDEX idx_conversations_persona_id ON conversations(persona_id);
    RAISE NOTICE 'Created index: idx_conversations_persona_id';
  END IF;
  
  IF NOT index_exists('idx_conversations_user_id') THEN
    CREATE INDEX idx_conversations_user_id ON conversations(user_id);
    RAISE NOTICE 'Created index: idx_conversations_user_id';
  END IF;
  
  IF NOT index_exists('idx_messages_conversation_id') THEN
    CREATE INDEX idx_messages_conversation_id ON messages(conversation_id);
    RAISE NOTICE 'Created index: idx_messages_conversation_id';
  END IF;
  
  IF NOT index_exists('idx_messages_created_at') THEN
    CREATE INDEX idx_messages_created_at ON messages(created_at);
    RAISE NOTICE 'Created index: idx_messages_created_at';
  END IF;
  
  IF NOT index_exists('idx_reports_project_id') THEN
    CREATE INDEX idx_reports_project_id ON reports(project_id);
    RAISE NOTICE 'Created index: idx_reports_project_id';
  END IF;
  
  IF NOT index_exists('idx_user_clients_user_id') THEN
    CREATE INDEX idx_user_clients_user_id ON user_clients(user_id);
    RAISE NOTICE 'Created index: idx_user_clients_user_id';
  END IF;
  
  IF NOT index_exists('idx_user_clients_client_id') THEN
    CREATE INDEX idx_user_clients_client_id ON user_clients(client_id);
    RAISE NOTICE 'Created index: idx_user_clients_client_id';
  END IF;
END $$;

-- Enable Row Level Security (RLS) on all tables
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE personas ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_clients ENABLE ROW LEVEL SECURITY;

-- Create RLS Policies if they don't exist

-- Clients policies
DO $$ 
BEGIN
  IF NOT policy_exists('clients', 'Users can view their clients') THEN
    CREATE POLICY "Users can view their clients" ON clients
      FOR SELECT USING (
        id IN (
          SELECT client_id FROM user_clients 
          WHERE user_id = auth.uid()
        )
      );
    RAISE NOTICE 'Created policy: Users can view their clients';
  END IF;
END $$;

-- Projects policies
DO $$ 
BEGIN
  IF NOT policy_exists('projects', 'Users can view their client''s projects') THEN
    CREATE POLICY "Users can view their client's projects" ON projects
      FOR SELECT USING (
        client_id IN (
          SELECT client_id FROM user_clients 
          WHERE user_id = auth.uid()
        )
      );
    RAISE NOTICE 'Created policy: Users can view their client''s projects';
  END IF;
  
  IF NOT policy_exists('projects', 'Users can create projects for their clients') THEN
    CREATE POLICY "Users can create projects for their clients" ON projects
      FOR INSERT WITH CHECK (
        client_id IN (
          SELECT client_id FROM user_clients 
          WHERE user_id = auth.uid() AND role IN ('admin', 'member')
        )
      );
    RAISE NOTICE 'Created policy: Users can create projects for their clients';
  END IF;
END $$;

-- Personas policies
DO $$ 
BEGIN
  IF NOT policy_exists('personas', 'Users can view personas') THEN
    CREATE POLICY "Users can view personas" ON personas
      FOR SELECT USING (
        project_id IN (
          SELECT id FROM projects WHERE client_id IN (
            SELECT client_id FROM user_clients WHERE user_id = auth.uid()
          )
        )
      );
    RAISE NOTICE 'Created policy: Users can view personas';
  END IF;
  
  IF NOT policy_exists('personas', 'Users can create personas') THEN
    CREATE POLICY "Users can create personas" ON personas
      FOR INSERT WITH CHECK (
        project_id IN (
          SELECT id FROM projects WHERE client_id IN (
            SELECT client_id FROM user_clients 
            WHERE user_id = auth.uid() AND role IN ('admin', 'member')
          )
        )
      );
    RAISE NOTICE 'Created policy: Users can create personas';
  END IF;
  
  -- Demo policy for MVP
  IF NOT policy_exists('personas', 'Allow public access for demo') THEN
    CREATE POLICY "Allow public access for demo" ON personas
      FOR ALL USING (project_id = '22222222-2222-2222-2222-222222222222');
    RAISE NOTICE 'Created policy: Allow public access for demo (personas)';
  END IF;
END $$;

-- Conversations policies
DO $$ 
BEGIN
  IF NOT policy_exists('conversations', 'Users can view their conversations') THEN
    CREATE POLICY "Users can view their conversations" ON conversations
      FOR SELECT USING (user_id = auth.uid());
    RAISE NOTICE 'Created policy: Users can view their conversations';
  END IF;
  
  IF NOT policy_exists('conversations', 'Users can create conversations') THEN
    CREATE POLICY "Users can create conversations" ON conversations
      FOR INSERT WITH CHECK (user_id = auth.uid());
    RAISE NOTICE 'Created policy: Users can create conversations';
  END IF;
  
  -- Demo policy for MVP
  IF NOT policy_exists('conversations', 'Allow public access for demo') THEN
    CREATE POLICY "Allow public access for demo" ON conversations
      FOR ALL USING (true);
    RAISE NOTICE 'Created policy: Allow public access for demo (conversations)';
  END IF;
END $$;

-- Messages policies
DO $$ 
BEGIN
  IF NOT policy_exists('messages', 'Users can view messages') THEN
    CREATE POLICY "Users can view messages" ON messages
      FOR SELECT USING (
        conversation_id IN (
          SELECT id FROM conversations WHERE user_id = auth.uid()
        )
      );
    RAISE NOTICE 'Created policy: Users can view messages';
  END IF;
  
  IF NOT policy_exists('messages', 'Users can create messages') THEN
    CREATE POLICY "Users can create messages" ON messages
      FOR INSERT WITH CHECK (
        conversation_id IN (
          SELECT id FROM conversations WHERE user_id = auth.uid()
        )
      );
    RAISE NOTICE 'Created policy: Users can create messages';
  END IF;
  
  -- Demo policy for MVP
  IF NOT policy_exists('messages', 'Allow public access for demo') THEN
    CREATE POLICY "Allow public access for demo" ON messages
      FOR ALL USING (true);
    RAISE NOTICE 'Created policy: Allow public access for demo (messages)';
  END IF;
END $$;

-- Reports policies
DO $$ 
BEGIN
  IF NOT policy_exists('reports', 'Users can view reports') THEN
    CREATE POLICY "Users can view reports" ON reports
      FOR SELECT USING (
        project_id IN (
          SELECT id FROM projects WHERE client_id IN (
            SELECT client_id FROM user_clients WHERE user_id = auth.uid()
          )
        )
      );
    RAISE NOTICE 'Created policy: Users can view reports';
  END IF;
END $$;

-- User-clients policies
DO $$ 
BEGIN
  IF NOT policy_exists('user_clients', 'Users can view their client relationships') THEN
    CREATE POLICY "Users can view their client relationships" ON user_clients
      FOR SELECT USING (user_id = auth.uid());
    RAISE NOTICE 'Created policy: Users can view their client relationships';
  END IF;
END $$;

-- Create or replace the update_updated_at function
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers if they don't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT FROM pg_trigger 
    WHERE tgname = 'update_clients_updated_at'
  ) THEN
    CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON clients
      FOR EACH ROW EXECUTE FUNCTION update_updated_at();
    RAISE NOTICE 'Created trigger: update_clients_updated_at';
  END IF;
  
  IF NOT EXISTS (
    SELECT FROM pg_trigger 
    WHERE tgname = 'update_projects_updated_at'
  ) THEN
    CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects
      FOR EACH ROW EXECUTE FUNCTION update_updated_at();
    RAISE NOTICE 'Created trigger: update_projects_updated_at';
  END IF;
  
  IF NOT EXISTS (
    SELECT FROM pg_trigger 
    WHERE tgname = 'update_personas_updated_at'
  ) THEN
    CREATE TRIGGER update_personas_updated_at BEFORE UPDATE ON personas
      FOR EACH ROW EXECUTE FUNCTION update_updated_at();
    RAISE NOTICE 'Created trigger: update_personas_updated_at';
  END IF;
  
  IF NOT EXISTS (
    SELECT FROM pg_trigger 
    WHERE tgname = 'update_conversations_updated_at'
  ) THEN
    CREATE TRIGGER update_conversations_updated_at BEFORE UPDATE ON conversations
      FOR EACH ROW EXECUTE FUNCTION update_updated_at();
    RAISE NOTICE 'Created trigger: update_conversations_updated_at';
  END IF;
END $$;

-- Storage buckets setup (safe to run multiple times)
DO $$ 
BEGIN
  -- Check and create csv-uploads bucket
  IF NOT EXISTS (
    SELECT FROM storage.buckets WHERE id = 'csv-uploads'
  ) THEN
    INSERT INTO storage.buckets (id, name, public) 
    VALUES ('csv-uploads', 'csv-uploads', false);
    RAISE NOTICE 'Created storage bucket: csv-uploads';
  END IF;
  
  -- Check and create reports bucket
  IF NOT EXISTS (
    SELECT FROM storage.buckets WHERE id = 'reports'
  ) THEN
    INSERT INTO storage.buckets (id, name, public) 
    VALUES ('reports', 'reports', false);
    RAISE NOTICE 'Created storage bucket: reports';
  END IF;
  
  -- Check and create branding-assets bucket
  IF NOT EXISTS (
    SELECT FROM storage.buckets WHERE id = 'branding-assets'
  ) THEN
    INSERT INTO storage.buckets (id, name, public) 
    VALUES ('branding-assets', 'branding-assets', true);
    RAISE NOTICE 'Created storage bucket: branding-assets';
  END IF;
END $$;

-- Storage policies
DO $$ 
BEGIN
  -- Check if storage schema and objects table exist
  IF EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'storage' 
    AND table_name = 'objects'
  ) THEN
    -- CSV upload policy
    IF NOT EXISTS (
      SELECT FROM pg_policies 
      WHERE schemaname = 'storage' 
      AND tablename = 'objects' 
      AND policyname = 'Users can upload CSV files'
    ) THEN
      CREATE POLICY "Users can upload CSV files" ON storage.objects
        FOR INSERT WITH CHECK (
          bucket_id = 'csv-uploads' AND
          auth.uid() IS NOT NULL
        );
      RAISE NOTICE 'Created storage policy: Users can upload CSV files';
    END IF;
    
    -- CSV view policy
    IF NOT EXISTS (
      SELECT FROM pg_policies 
      WHERE schemaname = 'storage' 
      AND tablename = 'objects' 
      AND policyname = 'Users can view their CSV files'
    ) THEN
      CREATE POLICY "Users can view their CSV files" ON storage.objects
        FOR SELECT USING (
          bucket_id = 'csv-uploads' AND
          auth.uid() IS NOT NULL
        );
      RAISE NOTICE 'Created storage policy: Users can view their CSV files';
    END IF;
  END IF;
END $$;

-- Insert demo data (safe to run multiple times)

-- Demo client
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

-- Demo project
INSERT INTO projects (id, client_id, name, description, status) VALUES (
  '22222222-2222-2222-2222-222222222222',
  '11111111-1111-1111-1111-111111111111',
  'Demo Project',
  'Default project for MVP testing',
  'active'
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  status = EXCLUDED.status;

-- Clean up helper functions
DROP FUNCTION IF EXISTS table_exists(text);
DROP FUNCTION IF EXISTS policy_exists(text, text);
DROP FUNCTION IF EXISTS index_exists(text);

-- Final status message
DO $$ 
BEGIN
  RAISE NOTICE '======================================';
  RAISE NOTICE 'Quarterback database setup complete!';
  RAISE NOTICE '======================================';
  RAISE NOTICE 'Demo client ID: 11111111-1111-1111-1111-111111111111';
  RAISE NOTICE 'Demo project ID: 22222222-2222-2222-2222-222222222222';
  RAISE NOTICE '';
  RAISE NOTICE 'Note: Demo policies are enabled for MVP testing.';
  RAISE NOTICE 'Remember to remove demo policies before production!';
END $$;