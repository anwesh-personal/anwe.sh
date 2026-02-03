# ORA Integration Guide

> Complete step-by-step guide for connecting ORA to any website or AI service

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Connecting ORA to anwe.sh](#connecting-ora-to-anwesh)
3. [Connecting ORA to Any Website](#connecting-ora-to-any-website)
4. [Connecting to Any AI Provider](#connecting-to-any-ai-provider)
5. [Security Best Practices](#security-best-practices)
6. [Quick Reference](#quick-reference)

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                              ORA                                         │
│   ┌──────────────┐  ┌──────────────┐  ┌──────────────┐                  │
│   │    Brain     │  │    Memory    │  │  Resonance   │                  │
│   │  (Reasoning) │  │ (Persistent) │  │  (Context)   │                  │
│   └──────┬───────┘  └──────┬───────┘  └──────┬───────┘                  │
│          │                 │                 │                           │
│          └─────────────────┼─────────────────┘                           │
│                            │                                             │
│                    ┌───────▼───────┐                                     │
│                    │ HTTP Client   │                                     │
│                    │ (Connections) │                                     │
│                    └───────┬───────┘                                     │
└────────────────────────────┼────────────────────────────────────────────┘
                             │
           ┌─────────────────┼─────────────────┐
           │                 │                 │
    ┌──────▼──────┐   ┌──────▼──────┐   ┌──────▼──────┐
    │  anwe.sh    │   │  Other Site │   │ AI Provider │
    │  /api/ora   │   │  /api/agent │   │   /v1/chat  │
    └─────────────┘   └─────────────┘   └─────────────┘
```

**Key Principle:** ORA's brain, memory, and reasoning stay on her side. External services just provide:
- Data access (read/write)
- Tool execution (actions)
- LLM inference (when needed)

---

## Connecting ORA to anwe.sh

### Step 1: Generate a Secret

Create a secure secret for ORA to authenticate:

```bash
# Generate a 64-character random secret
openssl rand -hex 32
# Example output: a1b2c3d4e5f6...
```

### Step 2: Configure anwe.sh Environment

Add to `.env.local` (local) and Vercel environment variables (production):

```env
ORA_SECRET=your-generated-secret-here
```

### Step 3: Configure ORA

In ORA's connection settings, add anwe.sh as a target:

```yaml
# ORA Connection Configuration
connections:
  anwe_sh:
    name: "anwe.sh Personal Site"
    type: "ora-api"
    base_url: "https://anwe.sh/api/ora"
    # For local dev: "http://localhost:3000/api/ora"
    auth:
      type: "bearer"
      token: "${ORA_SECRET}"  # Reference to stored secret
    capabilities:
      - posts
      - analytics
      - leads
      - settings
      - memory
      - files
    rate_limit: 100/minute
```

### Step 4: Test Connection

ORA can verify connection:

```bash
# Status check
curl -X GET https://anwe.sh/api/ora \
  -H "Authorization: Bearer ${ORA_SECRET}"

# Expected response:
{
  "status": "online",
  "timestamp": "2026-02-03T03:30:00.000Z",
  "stats": {
    "totalPosts": 5,
    "totalLeads": 12,
    "totalPageViews": 1250
  },
  "version": "1.0.0"
}
```

### Step 5: Use the API

#### Create a Post
```bash
curl -X POST https://anwe.sh/api/ora \
  -H "Authorization: Bearer ${ORA_SECRET}" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "posts.create",
    "data": {
      "title": "Building AI Agents",
      "content": "# Introduction\n\nAI agents are...",
      "tags": ["ai", "agents", "tutorial"],
      "status": "draft"
    }
  }'
```

#### Get Analytics
```bash
curl -X POST https://anwe.sh/api/ora \
  -H "Authorization: Bearer ${ORA_SECRET}" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "analytics.summary",
    "data": {"days": 30}
  }'
```

#### Store Site-Specific Memory
```bash
curl -X POST https://anwe.sh/api/ora \
  -H "Authorization: Bearer ${ORA_SECRET}" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "memory.store",
    "data": {
      "key": "content.strategy.2026",
      "value": {
        "focus": ["AI", "architecture", "psychology"],
        "frequency": "weekly",
        "style": "technical-narrative"
      },
      "type": "context",
      "importance": 0.9
    }
  }'
```

#### Recall Memory
```bash
curl -X POST https://anwe.sh/api/ora \
  -H "Authorization: Bearer ${ORA_SECRET}" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "memory.recall",
    "data": {"type": "context"}
  }'
```

### Complete Action Reference for anwe.sh

| Action | Description | Required Data |
|--------|-------------|---------------|
| `posts.list` | List all posts | `{status?, limit?, offset?}` |
| `posts.get` | Get single post | `{id}` or `{slug}` |
| `posts.create` | Create new post | `{title, content, slug?, tags?, status?}` |
| `posts.update` | Update post | `{id, ...fields}` |
| `posts.delete` | Delete post | `{id}` |
| `posts.publish` | Publish draft | `{id}` |
| `analytics.summary` | Get analytics overview | `{days?}` |
| `analytics.pageviews` | Get page view data | `{days?, path?, limit?}` |
| `analytics.heatmaps` | Get heatmap events | `{path?, days?}` |
| `leads.list` | List leads | `{status?, classification?, limit?}` |
| `leads.get` | Get lead details | `{id}` |
| `leads.update` | Update lead | `{id, ...fields}` |
| `leads.analyze` | Get lead for analysis | `{id}` |
| `settings.get` | Get site settings | `{}` |
| `settings.update` | Update settings | `{settings: {...}}` |
| `memory.store` | Store data for ORA | `{key, value, type?, importance?}` |
| `memory.recall` | Retrieve stored data | `{key?, type?, limit?}` |
| `memory.search` | Search memory | `{query, type?, limit?}` |
| `memory.clear` | Clear memory | `{key?, type?, all?}` |
| `files.upload` | Upload file (base64) | `{name, content, type, folder?}` |
| `files.list` | List uploaded files | `{folder?}` |
| `system.status` | Check system status | `{}` |
| `system.log` | Log an action | `{action, details?}` |

---

## Connecting ORA to Any Website

### Pattern 1: ORA-Compatible API (Recommended)

Deploy this endpoint to any website:

```typescript
// /api/ora/route.ts (Next.js) or equivalent

import { NextRequest, NextResponse } from 'next/server';

// Auth validation
function validateAuth(request: NextRequest): boolean {
    const token = request.headers.get('Authorization')?.replace('Bearer ', '');
    return token === process.env.ORA_SECRET;
}

export async function POST(request: NextRequest) {
    if (!validateAuth(request)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { action, data } = await request.json();

    // Route to handlers based on action
    switch (action) {
        case 'data.read':
            // Read from database
            return handleRead(data);
        case 'data.write':
            // Write to database
            return handleWrite(data);
        case 'action.execute':
            // Execute an action
            return handleAction(data);
        default:
            return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
    }
}

export async function GET(request: NextRequest) {
    if (!validateAuth(request)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    return NextResponse.json({ 
        status: 'online',
        capabilities: ['data.read', 'data.write', 'action.execute']
    });
}
```

**ORA Configuration:**
```yaml
connections:
  my_site:
    base_url: "https://mysite.com/api/ora"
    auth:
      type: "bearer"
      token: "${MY_SITE_SECRET}"
```

### Pattern 2: Standard REST API

If the site has a standard REST API:

```yaml
connections:
  rest_api:
    name: "Generic REST API"
    type: "rest"
    base_url: "https://api.somesite.com/v1"
    auth:
      type: "bearer"  # or "basic", "api_key", "oauth2"
      token: "${API_TOKEN}"
    endpoints:
      list_items: "GET /items"
      get_item: "GET /items/{id}"
      create_item: "POST /items"
      update_item: "PUT /items/{id}"
      delete_item: "DELETE /items/{id}"
```

**ORA Usage:**
```python
# In ORA's code
response = ora.connections.rest_api.create_item({
    "title": "New Item",
    "data": {...}
})
```

### Pattern 3: GraphQL API

```yaml
connections:
  graphql_api:
    type: "graphql"
    base_url: "https://api.site.com/graphql"
    auth:
      type: "bearer"
      token: "${GRAPHQL_TOKEN}"
```

**ORA Usage:**
```python
query = """
  query GetPosts($limit: Int) {
    posts(limit: $limit) {
      id
      title
      content
    }
  }
"""
response = ora.connections.graphql_api.query(query, {"limit": 10})
```

### Pattern 4: Webhooks (Site → ORA)

For sites to push data to ORA:

```yaml
webhooks:
  new_lead:
    path: "/webhooks/new-lead"
    secret: "${WEBHOOK_SECRET}"
    actions:
      - process_lead
      - notify_if_hot
```

The site sends:
```bash
curl -X POST https://ora.local/webhooks/new-lead \
  -H "X-Webhook-Secret: ${WEBHOOK_SECRET}" \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "source": "contact_form"}'
```

---

## Connecting to Any AI Provider

### Standard Configuration

```yaml
ai_providers:
  openai:
    type: "openai"
    base_url: "https://api.openai.com/v1"
    api_key: "${OPENAI_API_KEY}"
    models:
      - gpt-4-turbo
      - gpt-4o
      - gpt-3.5-turbo
    default_model: "gpt-4-turbo"
    
  anthropic:
    type: "anthropic"
    base_url: "https://api.anthropic.com"
    api_key: "${ANTHROPIC_API_KEY}"
    models:
      - claude-3-5-sonnet-20241022
      - claude-3-opus-20240229
      - claude-3-haiku-20240307
    default_model: "claude-3-5-sonnet-20241022"
    
  google:
    type: "google"
    api_key: "${GOOGLE_API_KEY}"
    models:
      - gemini-1.5-pro
      - gemini-1.5-flash
    default_model: "gemini-1.5-pro"
    
  groq:
    type: "openai-compatible"
    base_url: "https://api.groq.com/openai/v1"
    api_key: "${GROQ_API_KEY}"
    models:
      - llama-3.1-70b-versatile
      - mixtral-8x7b-32768
    default_model: "llama-3.1-70b-versatile"
    
  mistral:
    type: "openai-compatible"
    base_url: "https://api.mistral.ai/v1"
    api_key: "${MISTRAL_API_KEY}"
    models:
      - mistral-large-latest
      - mistral-medium-latest
    default_model: "mistral-large-latest"
    
  local_ollama:
    type: "openai-compatible"
    base_url: "http://localhost:11434/v1"
    api_key: "ollama"  # Not used but required
    models:
      - llama3.1:70b
      - codellama:34b
      - mistral:7b
    default_model: "llama3.1:70b"
    
  together:
    type: "openai-compatible"
    base_url: "https://api.together.xyz/v1"
    api_key: "${TOGETHER_API_KEY}"
    models:
      - meta-llama/Llama-3.1-70B-Instruct-Turbo
    default_model: "meta-llama/Llama-3.1-70B-Instruct-Turbo"
    
  deepseek:
    type: "openai-compatible"
    base_url: "https://api.deepseek.com"
    api_key: "${DEEPSEEK_API_KEY}"
    models:
      - deepseek-chat
      - deepseek-coder
    default_model: "deepseek-chat"
```

### Provider Selection Logic

```yaml
provider_selection:
  # Default priority (fallback order)
  priority:
    - anthropic
    - openai
    - groq
    - local_ollama
    
  # Task-specific routing
  task_routing:
    coding:
      preferred: deepseek
      fallback: anthropic
      models: ["deepseek-coder", "claude-3-5-sonnet-20241022"]
      
    writing:
      preferred: anthropic
      fallback: openai
      models: ["claude-3-5-sonnet-20241022", "gpt-4-turbo"]
      
    analysis:
      preferred: openai
      fallback: anthropic
      models: ["gpt-4-turbo", "claude-3-opus-20240229"]
      
    quick_response:
      preferred: groq
      fallback: local_ollama
      models: ["llama-3.1-70b-versatile", "llama3.1:70b"]
      
    vision:
      preferred: openai
      fallback: anthropic
      models: ["gpt-4o", "claude-3-5-sonnet-20241022"]
      
  # Cost optimization
  cost_aware: true
  max_cost_per_request: 0.50  # USD
  
  # Failover settings  
  failover:
    enabled: true
    max_retries: 3
    retry_delay_ms: 1000
```

### Universal Chat Completion Interface

```python
# ORA's internal interface for any provider

class AIProvider:
    async def complete(
        self,
        messages: list[Message],
        model: str = None,
        temperature: float = 0.7,
        max_tokens: int = None,
        tools: list[Tool] = None,
        provider: str = None  # Force specific provider
    ) -> CompletionResult:
        """
        Universal completion interface.
        ORA's brain decides WHAT to ask.
        This just handles HOW to ask it.
        """
        
        # Select provider based on config
        selected = self._select_provider(provider, model)
        
        # Normalize message format
        normalized = self._normalize_messages(messages, selected.type)
        
        # Execute with retry/failover
        try:
            return await selected.execute(normalized, temperature, max_tokens, tools)
        except ProviderError as e:
            return await self._failover(e, messages, temperature, max_tokens, tools)
```

### Adding a New Provider

To add any new AI provider:

```yaml
ai_providers:
  new_provider:
    type: "openai-compatible"  # Most providers support this
    base_url: "https://api.newprovider.com/v1"
    api_key: "${NEW_PROVIDER_KEY}"
    models:
      - model-name
    default_model: "model-name"
    
    # Provider-specific settings
    settings:
      supports_tools: true
      supports_vision: false
      max_context_tokens: 128000
      cost_per_1k_input: 0.001
      cost_per_1k_output: 0.002
```

For non-OpenAI-compatible providers:

```yaml
ai_providers:
  custom_provider:
    type: "custom"
    base_url: "https://api.custom.com"
    api_key: "${CUSTOM_KEY}"
    adapter: "adapters/custom_provider.py"  # Custom adapter code
```

---

## Security Best Practices

### 1. Secret Management

```yaml
# Never hardcode secrets
# Use environment variables or secret manager

secrets:
  storage: "keychain"  # macos keychain
  # or: "env", "vault", "1password", "aws-secrets"
  
  references:
    ORA_SECRET: "keychain://ora/anwesh-site"
    OPENAI_API_KEY: "keychain://ora/openai"
```

### 2. Connection Security

```yaml
connections:
  secure_site:
    base_url: "https://..."  # Always HTTPS
    verify_ssl: true
    timeout_seconds: 30
    
    # IP whitelist (if supported by site)
    allowed_ips:
      - "your.server.ip"
      
    # Rate limiting
    rate_limit:
      requests_per_minute: 60
      burst: 10
```

### 3. Audit Logging

```yaml
logging:
  enabled: true
  level: "info"
  
  # Log all API calls
  log_requests: true
  log_responses: false  # Avoid logging sensitive data
  
  # Destinations
  destinations:
    - type: "file"
      path: "~/.ora/logs/connections.log"
    - type: "supabase"
      table: "ora_audit_log"
```

### 4. Permission Scopes

```yaml
connections:
  limited_access:
    base_url: "https://..."
    auth: "..."
    
    # Limit what ORA can do
    permissions:
      read: true
      write: false
      delete: false
      admin: false
```

---

## Quick Reference

### Environment Variables Template

```bash
# ~/.ora/env or .env

# Site Connections
ORA_SECRET=<64-char-hex>
ANWESH_SITE_URL=https://anwe.sh/api/ora

# AI Providers
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
GOOGLE_API_KEY=...
GROQ_API_KEY=gsk_...
MISTRAL_API_KEY=...
TOGETHER_API_KEY=...
DEEPSEEK_API_KEY=...

# Local
OLLAMA_HOST=http://localhost:11434
```

### Connection Test Script

```bash
#!/bin/bash
# test-connections.sh

# Test anwe.sh
echo "Testing anwe.sh..."
curl -s -o /dev/null -w "%{http_code}" \
  -H "Authorization: Bearer $ORA_SECRET" \
  https://anwe.sh/api/ora

# Test OpenAI
echo "Testing OpenAI..."
curl -s -o /dev/null -w "%{http_code}" \
  -H "Authorization: Bearer $OPENAI_API_KEY" \
  https://api.openai.com/v1/models

# Test Anthropic
echo "Testing Anthropic..."
curl -s -o /dev/null -w "%{http_code}" \
  -H "x-api-key: $ANTHROPIC_API_KEY" \
  -H "anthropic-version: 2023-06-01" \
  https://api.anthropic.com/v1/messages
```

### Minimal ORA Config

```yaml
# ~/.ora/config.yaml

version: "1.0"

# Primary site connection
connections:
  anwesh:
    base_url: "https://anwe.sh/api/ora"
    auth:
      type: "bearer"
      token: "${ORA_SECRET}"

# AI providers (at least one)
ai_providers:
  anthropic:
    type: "anthropic"
    api_key: "${ANTHROPIC_API_KEY}"
    default_model: "claude-3-5-sonnet-20241022"

# Provider selection
provider_selection:
  priority: [anthropic]
```

---

## Summary

| What | How |
|------|-----|
| **Connect ORA → anwe.sh** | Bearer token auth to `/api/ora` |
| **Connect ORA → any site** | Deploy ORA-compatible endpoint or use REST/GraphQL adapter |
| **Connect to any AI** | Add to `ai_providers` config (most are OpenAI-compatible) |
| **Security** | Secrets in keychain/env, HTTPS only, audit logging |

ORA's brain stays with her. External services are just data + tools + inference when needed.
