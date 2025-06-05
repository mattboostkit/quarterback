// Debug Supabase authentication
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://igthouwddtjftxaxuhqf.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlndGhvdXdkZHRqZnR4YXh1aHFmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg5NDM1NzIsImV4cCI6MjA2NDUxOTU3Mn0.ME3Asvn6dlbCr7YPDtXO6ywbfYgv56cPy7suWJQ1Ka8';

console.log('🔍 Debugging Authentication Issues...\n');

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function debugAuth() {
  console.log('1. Testing basic connection...');
  try {
    const { data, error } = await supabase.from('clients').select('count');
    console.log('Basic query result:', { data, error });
  } catch (err) {
    console.log('Basic query error:', err);
  }

  console.log('\n2. Testing specific query (personas)...');
  try {
    const { data, error } = await supabase
      .from('personas')
      .select('*')
      .eq('project_id', '22222222-2222-2222-2222-222222222222');
    console.log('Personas query result:', { data, error });
  } catch (err) {
    console.log('Personas query error:', err);
  }

  console.log('\n3. Testing storage access...');
  try {
    const { data, error } = await supabase.storage
      .from('csv-uploads')
      .list();
    console.log('Storage list result:', { data, error });
  } catch (err) {
    console.log('Storage error:', err);
  }

  console.log('\n4. Testing auth status...');
  const { data: { user } } = await supabase.auth.getUser();
  console.log('Current user:', user);

  console.log('\n5. Key validation...');
  try {
    // Decode the JWT to check if it's valid
    const parts = supabaseAnonKey.split('.');
    if (parts.length === 3) {
      const payload = JSON.parse(atob(parts[1]));
      console.log('JWT payload:', payload);
      console.log('Expires:', new Date(payload.exp * 1000));
      console.log('Is expired:', new Date() > new Date(payload.exp * 1000));
    }
  } catch (err) {
    console.log('JWT decode error:', err);
  }
}

debugAuth();