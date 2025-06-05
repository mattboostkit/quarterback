# QUARTERBACK MVP ARCHITECTURE

## System Overview

```
Frontend (Next.js) ↔ Supabase ↔ N8N ↔ Multiple LLMs + External APIs
```

## Database Schema Expansion

### Additional Tables Needed:

```sql
-- Client branding configurations
CREATE TABLE client_branding (
  id UUID PRIMARY KEY,
  client_id UUID REFERENCES clients(id),
  logo_url TEXT,
  primary_color TEXT,
  secondary_color TEXT,
  font_family TEXT,
  custom_css JSONB
);

-- Query templates and responses
CREATE TABLE query_templates (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT, -- 'content_preferences', 'purchase_motivators', etc.
  template TEXT NOT NULL,
  variables JSONB -- for dynamic insertion
);

-- Enhanced persona insights
CREATE TABLE persona_insights (
  id UUID PRIMARY KEY,
  persona_id UUID REFERENCES personas(id),
  insight_type TEXT, -- 'content_preferences', 'purchase_motivators', etc.
  content JSONB,
  confidence_score DECIMAL,
  llm_source TEXT, -- 'openai', 'gemini', 'claude'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Generated reports and exports
CREATE TABLE reports (
  id UUID PRIMARY KEY,
  project_id UUID REFERENCES projects(id),
  title TEXT,
  type TEXT, -- 'insights', 'infographic', 'campaign_ideas'
  content JSONB,
  file_url TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- N8N workflow tracking
CREATE TABLE workflow_runs (
  id UUID PRIMARY KEY,
  persona_id UUID REFERENCES personas(id),
  workflow_type TEXT,
  status TEXT, -- 'running', 'completed', 'failed'
  input_data JSONB,
  output_data JSONB,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);
```

## N8N Workflow Definitions

### 1. Persona Enrichment Workflow
```
Trigger: New CSV Upload
↓
Clean & Validate Data
↓
Parallel LLM Processing:
├── OpenAI GPT-4 (Content Preferences)
├── Google Gemini (Purchase Motivators) 
└── Claude (Campaign Ideas)
↓
Consolidate Results
↓
Store Enhanced Persona
↓
Generate Initial Report
```

### 2. Query Processing Workflow
```
Trigger: User Query
↓
Template Matching
↓
Context Injection (Persona + Brand Data)
↓
LLM Processing
↓
Response Enhancement
↓
Store & Return Results
```

### 3. Report Generation Workflow
```
Trigger: Report Request
↓
Gather Persona Insights
↓
Generate Visualizations (Canva API)
↓
Compile Document (PDF)
↓
Store & Notify User
```

## Key Components to Build

### 1. Enhanced Persona Creation
- Multi-stage processing pipeline
- LLM orchestration layer
- Confidence scoring system

### 2. Template Query System
- Pre-defined query templates
- Dynamic variable injection
- Response standardization

### 3. Client Branding Engine
- Dynamic CSS generation
- Asset management
- White-label interface

### 4. Advanced Reporting
- Insight aggregation
- Infographic generation
- Multi-format exports

### 5. External Integrations
- Data provider APIs
- Multiple LLM APIs
- Design tool APIs

## API Endpoints to Add

```
POST /api/personas/enrich-advanced
GET /api/clients/{id}/branding
POST /api/queries/template
GET /api/reports/generate
POST /api/integrations/n8n/webhook
GET /api/exports/{type}/{id}
```

## Environment Variables Needed

```
# Additional LLM APIs
GOOGLE_GEMINI_API_KEY=
ANTHROPIC_CLAUDE_API_KEY=

# N8N Integration
N8N_API_URL=
N8N_API_KEY=

# External Data Providers
FIFTY_API_KEY=
SIGNIFY_API_KEY=
CLV_API_KEY=
AUDIENSE_API_KEY=
MELTWATER_API_KEY=

# Design Tools
CANVA_API_KEY=
```

## Security & Performance
- Row Level Security for multi-tenancy
- API rate limiting
- Caching for LLM responses
- Background job processing via N8N