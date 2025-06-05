-- Fix permissions for MVP demo
-- Run this in your Supabase SQL editor after the schema.sql

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Allow public access for demo" ON personas;
DROP POLICY IF EXISTS "Allow public access for demo" ON conversations;
DROP POLICY IF EXISTS "Allow public access for demo" ON messages;

-- Allow anonymous access to personas for MVP
CREATE POLICY "Allow anonymous read personas" ON personas
  FOR SELECT USING (true);

CREATE POLICY "Allow anonymous create personas" ON personas
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow anonymous update personas" ON personas
  FOR UPDATE USING (true);

-- Allow anonymous access to conversations for MVP
CREATE POLICY "Allow anonymous access conversations" ON conversations
  FOR ALL USING (true);

-- Allow anonymous access to messages for MVP
CREATE POLICY "Allow anonymous access messages" ON messages
  FOR ALL USING (true);

-- Fix storage policies for CSV uploads
CREATE POLICY "Allow anonymous uploads 1" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'csv-uploads'
  );

CREATE POLICY "Allow anonymous uploads 2" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'csv-uploads'
  );

CREATE POLICY "Allow anonymous uploads 3" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'csv-uploads'
  );

CREATE POLICY "Allow anonymous uploads 4" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'csv-uploads'
  );

-- Ensure buckets exist and are configured correctly
INSERT INTO storage.buckets (id, name, public)
VALUES ('csv-uploads', 'csv-uploads', false)
ON CONFLICT (id) DO UPDATE SET public = false;

-- Grant usage on schemas
GRANT USAGE ON SCHEMA public TO anon;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon;

-- Important: After running this, you may need to:
-- 1. Go to Authentication > Policies in Supabase dashboard
-- 2. Make sure "Enable RLS" is ON for all tables
-- 3. Check that the policies are active