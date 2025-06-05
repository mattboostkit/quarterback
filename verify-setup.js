// Verify Supabase setup
const { createClient } = require('@supabase/supabase-js');

console.log('🔍 Verifying Quarterback Setup...\n');

// Check environment variables
const supabaseUrl = 'https://igthouwddtjftxaxuhqf.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlndGhvdXdkZHRqZnR4YXh1aHFmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg5NDM1NzIsImV4cCI6MjA2NDUxOTU3Mn0.ME3Asvn6dlbCr7YPDtXO6ywbfYgv56cPy7suWJQ1Ka8';

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function verifySetup() {
  console.log('1️⃣ Checking Supabase connection...');
  
  try {
    // Test basic connection
    const { data: test, error: connError } = await supabase
      .from('clients')
      .select('count');
    
    if (connError) {
      console.error('❌ Connection error:', connError.message);
      if (connError.message.includes('JWS') || connError.message.includes('JWT')) {
        console.log('\n⚠️  Your Supabase keys appear to be invalid.');
        console.log('Please check:');
        console.log('1. Go to your Supabase project settings');
        console.log('2. Copy the correct anon key from Settings > API');
        console.log('3. Update your .env.local file');
      }
      return;
    }
    
    console.log('✅ Supabase connection successful');
    
    // Check tables exist
    console.log('\n2️⃣ Checking database tables...');
    const tables = ['clients', 'projects', 'personas', 'conversations', 'messages'];
    let allTablesExist = true;
    
    for (const table of tables) {
      const { error } = await supabase.from(table).select('count');
      if (error && error.message.includes('does not exist')) {
        console.log(`❌ Table '${table}' not found`);
        allTablesExist = false;
      } else {
        console.log(`✅ Table '${table}' exists`);
      }
    }
    
    if (!allTablesExist) {
      console.log('\n⚠️  Some tables are missing.');
      console.log('Please run the schema.sql file in your Supabase SQL editor.');
      return;
    }
    
    // Check storage buckets
    console.log('\n3️⃣ Checking storage buckets...');
    const { data: buckets, error: bucketError } = await supabase
      .storage
      .listBuckets();
    
    if (bucketError) {
      console.log('⚠️  Cannot check storage buckets (requires service role key)');
    } else {
      const csvBucket = buckets?.find(b => b.name === 'csv-uploads');
      if (csvBucket) {
        console.log('✅ Storage bucket "csv-uploads" exists');
      } else {
        console.log('❌ Storage bucket "csv-uploads" not found');
        console.log('Please run the schema.sql file to create it.');
      }
    }
    
    // Check demo data
    console.log('\n4️⃣ Checking demo data...');
    const { data: demoClient } = await supabase
      .from('clients')
      .select('*')
      .eq('id', '11111111-1111-1111-1111-111111111111')
      .single();
    
    if (demoClient) {
      console.log('✅ Demo client exists');
    } else {
      console.log('⚠️  Demo client not found');
      console.log('Run the seed.sql file to create demo data.');
    }
    
    console.log('\n✨ Setup verification complete!');
    console.log('\nIf you\'re seeing authentication errors:');
    console.log('1. Run fix-permissions.sql in your Supabase SQL editor');
    console.log('2. Make sure RLS is enabled on all tables');
    console.log('3. Check that your anon key is correct');
    
  } catch (error) {
    console.error('\n❌ Unexpected error:', error.message);
  }
}

verifySetup();