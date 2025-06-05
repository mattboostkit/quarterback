# Quarterback Setup Guide - Fixing "Failed to create persona" Error

## The Issue
The "Failed to create persona" error occurs because:
1. The database schema hasn't been applied to Supabase
2. There's no demo project in the database (personas require a valid project_id)
3. Row Level Security (RLS) policies may be blocking inserts

## Quick Fix Steps

### 1. Apply Database Schema
1. Go to your Supabase dashboard
2. Navigate to SQL Editor
3. Copy and paste the contents of `supabase/schema.sql`
4. Run the query

### 2. Add Demo Data
1. In the SQL Editor, run the contents of `supabase/seed.sql`
2. This creates:
   - A demo client
   - A demo project with ID 'demo-project-id'
   - Public access policies for testing

### 3. Verify Environment Variables
Make sure your `.env.local` file has:
```
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 4. Test the Application
1. Restart your development server: `npm run dev`
2. Try uploading a CSV file again
3. The persona should now be created successfully

## For Production
Remove the public access policies from `seed.sql` and implement proper authentication:
- Set up Supabase Auth
- Create user accounts
- Associate users with clients via the `user_clients` table
- The existing RLS policies will then properly restrict access

## Troubleshooting
If you still get errors:
1. Check browser console for specific error messages
2. Verify your Supabase connection in the Supabase dashboard
3. Ensure the tables were created successfully
4. Check that your environment variables are correct