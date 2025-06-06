# Supabase Setup Instructions

## Quick Setup

1. Go to your Supabase project SQL Editor:
   https://supabase.com/dashboard/project/igthouwddtjftxaxuhqf/sql

2. Run these SQL scripts in order:

### Step 1: Create Schema
Copy and paste the entire contents of `supabase/schema.sql` into the SQL editor and run it.

### Step 2: Setup Anonymous Access
Copy and paste the entire contents of `supabase/setup-anon.sql` into the SQL editor and run it.

This will:
- Create all necessary tables
- Disable Row Level Security for anonymous access (MVP)
- Insert default client and project data

## Troubleshooting

If you get errors:
1. Make sure you're running the scripts in order
2. If tables already exist, you may see "already exists" errors - that's fine
3. Check the test endpoint: http://localhost:3000/api/test-db

## API Status

- ✅ Supabase - Connected and working
- ✅ Google Sheets - API key is valid
- ✅ OpenAI - API key is valid
- ❌ N8N - Webhook needs to be configured at https://n8n.tradescale.ai