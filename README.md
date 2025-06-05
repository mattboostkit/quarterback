# Quarterback - AI Persona Insights Platform

## Quick Setup Guide

### 1. Prerequisites
- Node.js 18+ installed
- Supabase account (free tier works)
- OpenAI API key (optional for MVP)

### 2. Supabase Setup

1. Create a new Supabase project at [supabase.com](https://supabase.com)

2. Run the database schema:
   - Go to SQL Editor in your Supabase dashboard
   - Copy the contents of `supabase/schema.sql`
   - Run the SQL to create all tables

3. Get your credentials:
   - Go to Settings → API
   - Copy your Project URL and anon key

### 3. Local Setup

1. Clone and install dependencies:
```bash
npm install
```

2. Create `.env.local` file:
```bash
cp .env.local.example .env.local
```

3. Add your credentials to `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=your_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
OPENAI_API_KEY=your_openai_key (optional)
```

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000)

### 4. Demo Flow

1. **Upload CSV**: Drag and drop your audience data CSV
2. **Name Persona**: Give your persona a meaningful name
3. **Start Chatting**: Use the query templates or ask custom questions
4. **Get Insights**: Receive persona-based responses for your campaigns

### 5. Deploy Edge Functions (Optional)

If you want to use the Edge Functions:

```bash
# Install Supabase CLI
npm install -g supabase

# Link to your project
supabase link --project-ref your-project-ref

# Deploy functions
supabase functions deploy process-csv
supabase functions deploy query-persona
```

### 6. Production Deployment

For production deployment to Vercel:

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel
```

## Key Features

- 📊 CSV Upload for audience data
- 🤖 AI-powered persona generation
- 💬 Interactive chat with personas
- 📝 Pre-built query templates
- 🎨 Clean, professional UI
- 🔒 Multi-tenant architecture ready

## Next Steps

1. Add N8N integration for workflow automation
2. Implement multiple LLM support (Claude, Gemini)
3. Add export functionality for reports
4. Implement custom branding system
5. Add more sophisticated persona enrichment

## Support

For issues or questions, please contact the development team.