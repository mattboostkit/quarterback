# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Quarterback is a web-based platform that allows users to interact with and query AI-generated personas created from audience data. The platform is designed for UNTAPPED to gain data-driven insights into audiences on behalf of sports rightsholder clients.

## Key Architecture Decisions

### Tech Stack
- **Frontend**: Next.js 14+ with TypeScript, Tailwind CSS, Shadcn/ui
- **Backend**: Supabase (PostgreSQL, Auth, Storage, Edge Functions)
- **Workflow Automation**: N8N for CSV processing and LLM orchestration
- **LLM Integration**: OpenAI, Anthropic Claude, Google Gemini APIs

### Database Schema
The core tables in Supabase:
- `clients` - Multi-tenant client management with branding configs
- `projects` - Client projects containing personas
- `personas` - AI personas with CSV data and enriched insights
- `conversations` - Chat sessions with personas
- `messages` - Individual messages in conversations
- `reports` - Generated insights and exports

### Core User Flow
1. Upload CSV with audience data
2. System generates persona from data using LLMs
3. Users query persona through chat interface
4. System provides insights for marketing campaigns
5. Export reports and recommendations

## Development Commands

Since this is a new project, standard Next.js commands will apply once initialized:

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Run linting
npm run lint

# Type checking
npm run typecheck
```

## Key Implementation Notes

### Persona Generation
- Always start with: "I'm going to upload a CSV file which has a number of categorised data points..."
- Personas must respond from their perspective, not as an AI
- Use structured prompts for consistency across LLMs

### Query Templates
Essential queries that should be available:
1. Content preferences and consumption habits
2. Purchase motivators by product category
3. Content types to avoid
4. Campaign ideas for specific brand/sponsor combinations

### Supabase Edge Functions
Key functions to implement:
- `process-csv` - Parse uploads and trigger enrichment
- `query-persona` - Handle chat interactions with streaming
- `generate-report` - Create exportable insights

### N8N Workflows
Critical workflows:
- CSV processing pipeline
- Multi-LLM persona enrichment
- Report generation with visualizations

### Security Considerations
- Implement Row Level Security (RLS) for multi-tenancy
- Store API keys in environment variables
- Use Supabase service role key only in Edge Functions
- Never expose LLM API keys to frontend

## MVP Priorities

For rapid MVP development focus on:
1. Single-page upload → chat → export flow
2. One LLM integration initially (OpenAI recommended)
3. Basic persona switching without full multi-tenancy
4. Predefined query templates over free-form chat
5. Simple JSON export before complex reporting

## Testing Approach

Test with the provided Tottenham Hotspur "Informed Professionals" persona data to ensure:
- Persona maintains consistent voice
- Responses align with demographic data
- Campaign suggestions are relevant to audience characteristics