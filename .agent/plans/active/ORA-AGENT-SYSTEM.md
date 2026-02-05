# ORA Agent System - Full Implementation Plan

**Created:** 2026-02-04  
**Status:** 📋 PLANNED  
**Priority:** CRITICAL  
**Estimated Effort:** 2-3 weeks

---

## Executive Summary

Build a production-grade agent orchestration system where:

1. **ORA** is the central brain/orchestrator living on your desktop
2. **ORA's memory** syncs bidirectionally with Supabase for server-side persistence
3. **Sub-agents** (Writer, Imager, SEO, Social, Analyst) execute specialized tasks
4. **ORA commands sub-agents** - she's the boss, they're the workers
5. **Full API access** - ORA can do anything on anwe.sh via secure endpoints

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              YOUR DESKTOP                                    │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                           ORA (Desktop App)                          │   │
│  │  • Local SQLite/JSON memory (instant access)                        │   │
│  │  • Command parsing & delegation                                      │   │
│  │  • Conversation context                                              │   │
│  │  • Background sync engine                                            │   │
│  └───────────────────────────────┬─────────────────────────────────────┘   │
└──────────────────────────────────┼──────────────────────────────────────────┘
                                   │ HTTPS (Bearer Token Auth)
                                   │ Bidirectional Sync
                                   ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                              ANWE.SH SERVER                                  │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                         /api/ora (External API)                      │   │
│  │  • Bearer token auth (ORA_SECRET)                                   │   │
│  │  • Full site access (posts, leads, analytics, settings)            │   │
│  │  • Memory sync endpoints                                            │   │
│  │  • Agent delegation                                                 │   │
│  └───────────────────────────────┬─────────────────────────────────────┘   │
│                                  │                                          │
│  ┌───────────────────────────────▼─────────────────────────────────────┐   │
│  │                      Agent Orchestration Core                        │   │
│  │  • Queue management                                                  │   │
│  │  • Tool execution                                                    │   │
│  │  • Provider routing (OpenAI, Anthropic, etc.)                       │   │
│  │  • Run tracking & audit                                             │   │
│  └───────────────────────────────┬─────────────────────────────────────┘   │
│                                  │                                          │
│  ┌───────────────┬───────────────┼───────────────┬───────────────┐         │
│  │               │               │               │               │         │
│  ▼               ▼               ▼               ▼               ▼         │
│ ┌─────┐       ┌─────┐       ┌─────┐       ┌─────┐       ┌─────┐           │
│ │Writer│      │Imager│      │ SEO │       │Social│      │Analyst│          │
│ │  ✍️  │      │  🎨  │      │  📊 │       │  📱  │      │  📈  │           │
│ └──┬──┘       └──┬──┘       └──┬──┘       └──┬──┘       └──┬──┘            │
│    │             │             │             │             │               │
│    └─────────────┴──────┬──────┴─────────────┴─────────────┘               │
│                         │                                                   │
│  ┌──────────────────────▼──────────────────────────────────────────────┐   │
│  │                          Supabase                                    │   │
│  │  • agents                (agent definitions)                        │   │
│  │  • agent_runs            (execution history)                        │   │
│  │  • agent_memory          (persistent memory - NEW)                  │   │
│  │  • agent_conversations   (conversation threads - NEW)               │   │
│  │  • agent_tasks           (task queue - NEW)                         │   │
│  │  • api_keys              (key management - NEW)                     │   │
│  │  • webhooks              (event subscriptions - NEW)                │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Database Schema

### 1. Agent Memory Table

```sql
-- =====================================================
-- AGENT MEMORY TABLE
-- Persistent memory storage with sync support
-- =====================================================

CREATE TABLE IF NOT EXISTS agent_memory (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Ownership
    agent_id UUID REFERENCES agents(id) ON DELETE CASCADE,
    -- NULL agent_id = ORA's external memory
    
    -- Memory categorization
    memory_type TEXT NOT NULL CHECK (memory_type IN (
        'fact',           -- Persistent facts about the world/user
        'preference',     -- User preferences
        'context',        -- Situational context
        'skill',          -- Learned behaviors/patterns
        'instruction',    -- Standing instructions
        'reflection',     -- Agent's own reflections/learnings
        'task',           -- Task-related memory
        'entity'          -- Entity information (person, company, etc.)
    )),
    
    -- Memory content
    key TEXT NOT NULL,
    content JSONB NOT NULL,
    summary TEXT,                         -- Human-readable summary
    
    -- Importance and retrieval
    importance FLOAT DEFAULT 0.5,         -- 0.0 to 1.0
    access_count INTEGER DEFAULT 0,
    last_accessed_at TIMESTAMPTZ,
    
    -- Embedding for semantic search
    embedding VECTOR(1536),               -- OpenAI ada-002 dimensions
    
    -- Sync tracking
    source TEXT NOT NULL DEFAULT 'server' CHECK (source IN (
        'server',         -- Created on server
        'desktop',        -- Created on ORA desktop
        'sync'            -- Created during sync reconciliation
    )),
    sync_id UUID,                         -- For conflict detection
    synced_at TIMESTAMPTZ,
    is_dirty BOOLEAN DEFAULT false,       -- Needs sync
    
    -- Lifecycle
    expires_at TIMESTAMPTZ,
    is_archived BOOLEAN DEFAULT false,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Unique constraint for memory keys per agent
CREATE UNIQUE INDEX IF NOT EXISTS idx_agent_memory_unique_key 
    ON agent_memory(COALESCE(agent_id, '00000000-0000-0000-0000-000000000000'), memory_type, key)
    WHERE is_archived = false;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_agent_memory_agent ON agent_memory(agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_memory_type ON agent_memory(memory_type);
CREATE INDEX IF NOT EXISTS idx_agent_memory_importance ON agent_memory(importance DESC);
CREATE INDEX IF NOT EXISTS idx_agent_memory_sync ON agent_memory(is_dirty, synced_at);
CREATE INDEX IF NOT EXISTS idx_agent_memory_embedding ON agent_memory 
    USING ivfflat (embedding vector_cosine_ops) 
    WITH (lists = 100);

-- RLS
ALTER TABLE agent_memory ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access" ON agent_memory
    FOR ALL USING (true) WITH CHECK (true);

-- Trigger for updated_at
CREATE TRIGGER agent_memory_updated_at
    BEFORE UPDATE ON agent_memory
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
```

### 2. Agent Conversations Table

```sql
-- =====================================================
-- AGENT CONVERSATIONS TABLE
-- Conversation threads with message history
-- =====================================================

CREATE TABLE IF NOT EXISTS agent_conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Ownership
    agent_id UUID REFERENCES agents(id) ON DELETE CASCADE,
    -- NULL = ORA external conversation
    
    -- Conversation metadata
    title TEXT,
    summary TEXT,
    
    -- Message history (JSONB array)
    messages JSONB NOT NULL DEFAULT '[]',
    -- Format: [{ role: 'user'|'assistant'|'system'|'tool', content: string, ... }]
    
    -- Stats
    message_count INTEGER DEFAULT 0,
    token_count INTEGER DEFAULT 0,
    
    -- Status
    status TEXT DEFAULT 'active' CHECK (status IN (
        'active',
        'completed',
        'archived',
        'error'
    )),
    
    -- Sync
    source TEXT NOT NULL DEFAULT 'server',
    sync_id UUID,
    synced_at TIMESTAMPTZ,
    is_dirty BOOLEAN DEFAULT false,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_conversations_agent ON agent_conversations(agent_id);
CREATE INDEX IF NOT EXISTS idx_conversations_status ON agent_conversations(status);
CREATE INDEX IF NOT EXISTS idx_conversations_sync ON agent_conversations(is_dirty, synced_at);
CREATE INDEX IF NOT EXISTS idx_conversations_updated ON agent_conversations(updated_at DESC);

-- RLS
ALTER TABLE agent_conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access" ON agent_conversations
    FOR ALL USING (true) WITH CHECK (true);
```

### 3. Agent Tasks Table (Task Queue)

```sql
-- =====================================================
-- AGENT TASKS TABLE
-- Task queue for agent delegation
-- =====================================================

CREATE TABLE IF NOT EXISTS agent_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Assignment
    assigned_to UUID REFERENCES agents(id) ON DELETE SET NULL,
    delegated_by UUID REFERENCES agents(id) ON DELETE SET NULL,
    -- delegated_by = NULL means ORA delegated from desktop
    
    -- Task definition
    task_type TEXT NOT NULL,              -- 'write_post', 'generate_image', 'analyze_seo', etc.
    title TEXT NOT NULL,
    description TEXT,
    instructions JSONB,                   -- Detailed instructions
    
    -- Input/Output
    input JSONB DEFAULT '{}',
    output JSONB,
    
    -- Priority & scheduling
    priority INTEGER DEFAULT 0,           -- Higher = more urgent
    scheduled_for TIMESTAMPTZ,            -- When to execute (null = ASAP)
    deadline_at TIMESTAMPTZ,              -- Soft deadline
    
    -- Status
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
        'pending',        -- Waiting to be picked up
        'queued',         -- In execution queue
        'running',        -- Currently executing
        'waiting',        -- Waiting for human input or external event
        'success',        -- Completed successfully
        'error',          -- Failed with error
        'cancelled',      -- Cancelled by user or system
        'expired'         -- Past deadline without completion
    )),
    status_message TEXT,
    error_message TEXT,
    
    -- Execution tracking
    attempt_count INTEGER DEFAULT 0,
    max_attempts INTEGER DEFAULT 3,
    last_attempt_at TIMESTAMPTZ,
    
    -- Performance
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    duration_ms INTEGER,
    tokens_used INTEGER,
    estimated_cost DECIMAL(10, 6),
    
    -- Linking to other resources
    parent_task_id UUID REFERENCES agent_tasks(id),
    related_run_id UUID REFERENCES agent_runs(id),
    related_post_id UUID REFERENCES blog_posts(id),
    
    -- Source tracking
    source TEXT DEFAULT 'server' CHECK (source IN ('server', 'desktop', 'api', 'webhook')),
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_tasks_assigned ON agent_tasks(assigned_to, status);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON agent_tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_priority ON agent_tasks(priority DESC, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_tasks_scheduled ON agent_tasks(scheduled_for) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_tasks_parent ON agent_tasks(parent_task_id);

-- RLS
ALTER TABLE agent_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access" ON agent_tasks
    FOR ALL USING (true) WITH CHECK (true);
```

### 4. API Keys Table

```sql
-- =====================================================
-- API KEYS TABLE
-- For ORA and external agent authentication
-- =====================================================

CREATE TABLE IF NOT EXISTS api_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Key identity
    name TEXT NOT NULL,
    description TEXT,
    key_hash TEXT NOT NULL,               -- SHA-256 hash of the key
    key_prefix TEXT NOT NULL,             -- First 8 chars for identification
    
    -- Permissions
    scopes TEXT[] DEFAULT ARRAY['*'],     -- ['posts:read', 'posts:write', 'leads:read', etc.]
    -- '*' = full access
    
    -- Rate limiting
    rate_limit_per_minute INTEGER DEFAULT 60,
    rate_limit_per_day INTEGER DEFAULT 10000,
    
    -- Usage tracking
    total_requests INTEGER DEFAULT 0,
    last_used_at TIMESTAMPTZ,
    last_used_ip TEXT,
    
    -- Security
    allowed_ips TEXT[],                   -- Empty = allow all
    expires_at TIMESTAMPTZ,
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    revoked_at TIMESTAMPTZ,
    revoked_reason TEXT,
    
    -- Agent association
    agent_id UUID REFERENCES agents(id) ON DELETE SET NULL,
    -- NULL = general purpose key (like ORA's desktop)
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for key lookup
CREATE UNIQUE INDEX IF NOT EXISTS idx_api_keys_hash ON api_keys(key_hash);
CREATE INDEX IF NOT EXISTS idx_api_keys_prefix ON api_keys(key_prefix);
CREATE INDEX IF NOT EXISTS idx_api_keys_agent ON api_keys(agent_id);

-- RLS
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access" ON api_keys
    FOR ALL USING (true) WITH CHECK (true);
```

### 5. Webhooks Table

```sql
-- =====================================================
-- WEBHOOKS TABLE
-- Event subscriptions for async notifications
-- =====================================================

CREATE TABLE IF NOT EXISTS webhooks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Webhook definition
    name TEXT NOT NULL,
    url TEXT NOT NULL,
    secret TEXT,                          -- For signature verification
    
    -- Events to subscribe to
    events TEXT[] NOT NULL,               -- ['post.published', 'lead.created', 'task.completed']
    
    -- Filtering
    filters JSONB DEFAULT '{}',           -- Event-specific filters
    
    -- Retry configuration
    max_retries INTEGER DEFAULT 3,
    retry_delay_seconds INTEGER[] DEFAULT ARRAY[60, 300, 3600],
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    
    -- Stats
    total_deliveries INTEGER DEFAULT 0,
    successful_deliveries INTEGER DEFAULT 0,
    failed_deliveries INTEGER DEFAULT 0,
    last_triggered_at TIMESTAMPTZ,
    last_success_at TIMESTAMPTZ,
    last_failure_at TIMESTAMPTZ,
    last_error TEXT,
    
    -- Owner
    api_key_id UUID REFERENCES api_keys(id) ON DELETE CASCADE,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_webhooks_events ON webhooks USING GIN(events);
CREATE INDEX IF NOT EXISTS idx_webhooks_active ON webhooks(is_active);

-- RLS
ALTER TABLE webhooks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access" ON webhooks
    FOR ALL USING (true) WITH CHECK (true);
```

---

## API Endpoints

### Enhanced `/api/ora` Endpoint

Extend the existing ORA API with new actions:

```typescript
// NEW Actions to add to /api/ora

// ========== TASKS ==========
case 'tasks.create':     // Create a task for an agent
case 'tasks.list':       // List tasks (filtered)
case 'tasks.get':        // Get task details
case 'tasks.update':     // Update task status
case 'tasks.cancel':     // Cancel a task
case 'tasks.retry':      // Retry a failed task

// ========== AGENTS ==========
case 'agents.list':      // List all agents with status
case 'agents.get':       // Get agent details
case 'agents.run':       // Directly run an agent with input
case 'agents.status':    // Get agent current status

// ========== SYNC ==========
case 'sync.push':        // Push local memory/conversations to server
case 'sync.pull':        // Pull server changes since timestamp
case 'sync.status':      // Get sync status and pending changes
case 'sync.resolve':     // Resolve sync conflicts

// ========== KEYS ==========
case 'keys.list':        // List API keys (masked)
case 'keys.create':      // Create new API key
case 'keys.revoke':      // Revoke an API key
case 'keys.rotate':      // Generate new key, revoke old

// ========== WEBHOOKS ==========
case 'webhooks.create':  // Register a webhook
case 'webhooks.list':    // List webhooks
case 'webhooks.delete':  // Remove a webhook
case 'webhooks.test':    // Test webhook delivery
```

### New `/api/agent` Endpoint (Internal)

For server-side agent execution:

```typescript
// POST /api/agent
{
  action: 'execute',
  agentSlug: 'writer',
  input: { ... },
  options: {
    priority: 'high',
    timeout: 30000,
    parentTaskId: 'uuid'
  }
}

// Response
{
  taskId: 'uuid',
  status: 'queued',
  estimatedStart: '2026-02-04T18:00:00Z'
}
```

---

## Memory Sync Protocol

### Sync Flow

```
┌─────────────────────┐                    ┌─────────────────────┐
│   ORA Desktop       │                    │   Supabase Server   │
│   (Local SQLite)    │                    │   (PostgreSQL)      │
└─────────┬───────────┘                    └──────────┬──────────┘
          │                                           │
          │ 1. Get sync status                        │
          ├──────────────────────────────────────────►│
          │    { lastSyncAt, serverVersion }          │
          │◄──────────────────────────────────────────┤
          │                                           │
          │ 2. Push local changes (delta)             │
          ├──────────────────────────────────────────►│
          │    { memories: [...], conversations: [...] }
          │                                           │
          │ 3. Server returns conflicts & acks        │
          │◄──────────────────────────────────────────┤
          │    { acked: [...], conflicts: [...] }     │
          │                                           │
          │ 4. Pull server changes since lastSync     │
          ├──────────────────────────────────────────►│
          │                                           │
          │ 5. Server returns delta                   │
          │◄──────────────────────────────────────────┤
          │    { memories: [...], conversations: [...] }
          │                                           │
          │ 6. Apply changes locally, update lastSync │
          │                                           │
```

### Conflict Resolution Strategy

```typescript
interface SyncConflict {
  type: 'memory' | 'conversation';
  id: string;
  key: string;
  localVersion: {
    content: unknown;
    updatedAt: string;
    syncId: string;
  };
  serverVersion: {
    content: unknown;
    updatedAt: string;
    syncId: string;
  };
}

// Resolution strategies:
// 1. LAST_WRITE_WINS - Most recent timestamp wins (default)
// 2. SERVER_WINS - Server always wins
// 3. LOCAL_WINS - Local always wins
// 4. MERGE - Attempt to merge (for memories with structured content)
// 5. MANUAL - Flag for manual resolution
```

### Sync API Endpoints

```typescript
// POST /api/ora { action: 'sync.push' }
{
  action: 'sync.push',
  data: {
    lastSyncAt: '2026-02-04T12:00:00Z',
    memories: [
      {
        syncId: 'local-uuid',
        action: 'upsert', // or 'delete'
        data: { key: 'user_name', content: ..., updatedAt: ... }
      }
    ],
    conversations: [
      {
        syncId: 'local-uuid',
        action: 'upsert',
        data: { id: ..., messages: [...], updatedAt: ... }
      }
    ]
  }
}

// Response
{
  success: true,
  results: {
    memories: {
      acked: ['sync-id-1', 'sync-id-2'],
      conflicts: [{ syncId: ..., conflict: ... }]
    },
    conversations: {
      acked: ['sync-id-3'],
      conflicts: []
    }
  },
  serverTime: '2026-02-04T12:01:00Z'
}

// POST /api/ora { action: 'sync.pull' }
{
  action: 'sync.pull',
  data: {
    since: '2026-02-04T12:00:00Z'
  }
}

// Response
{
  memories: [
    { id: '...', key: '...', content: ..., updatedAt: ... }
  ],
  conversations: [
    { id: '...', messages: [...], updatedAt: ... }
  ],
  serverTime: '2026-02-04T12:01:00Z'
}
```

---

## Agent Orchestration Flow

### ORA → Sub-Agent Delegation

```
User → ORA Desktop
         │
         │ "Write a blog post about AI safety"
         ▼
┌─────────────────────────────────────────────────────────────┐
│ ORA parses intent:                                          │
│   • Task: "Write blog post"                                 │
│   • Topic: "AI safety"                                      │
│   • Required agents: Writer                                  │
│   • Optional: SEO, Imager                                   │
└─────────────────────────────────────────────────────────────┘
         │
         │ POST /api/ora { action: 'tasks.create' }
         ▼
┌─────────────────────────────────────────────────────────────┐
│ Server creates task chain:                                  │
│                                                             │
│   Task 1: Write draft (assigned: Writer)                   │
│      ↓                                                      │
│   Task 2: Optimize SEO (assigned: SEO, depends on Task 1)  │
│      ↓                                                      │
│   Task 3: Generate image (assigned: Imager, depends on 1)  │
│      ↓                                                      │
│   Task 4: Publish (system, depends on 2,3)                 │
└─────────────────────────────────────────────────────────────┘
         │
         │ Agents execute in order via agent-runs
         ▼
┌─────────────────────────────────────────────────────────────┐
│ Webhook/poll notifies ORA desktop of completion            │
│ ORA receives result: { postId: '...', url: '...' }         │
└─────────────────────────────────────────────────────────────┘
         │
         ▼
ORA → User: "Done! I've published your AI safety post."
```

### Task Execution Worker

Server-side background worker for executing tasks:

```typescript
// Pseudo-code for task worker
async function processTaskQueue() {
  while (true) {
    // Get next pending task
    const task = await getNextTask();
    if (!task) {
      await sleep(1000);
      continue;
    }
    
    // Check dependencies
    if (!await areDependenciesMet(task)) {
      await markTaskQueued(task.id);
      continue;
    }
    
    // Get assigned agent
    const agent = await getAgent(task.assigned_to);
    
    // Execute
    await markTaskRunning(task.id);
    try {
      const result = await executeAgentTask(agent, task);
      await markTaskSuccess(task.id, result);
      
      // Trigger webhooks
      await triggerWebhook('task.completed', { taskId: task.id, result });
    } catch (error) {
      await markTaskError(task.id, error);
      
      // Retry if applicable
      if (task.attempt_count < task.max_attempts) {
        await scheduleRetry(task);
      }
    }
  }
}
```

---

## Implementation Phases

### Phase 1: Database Foundation (2-3 days)
- [ ] Create `agent_memory` migration
- [ ] Create `agent_conversations` migration
- [ ] Create `agent_tasks` migration
- [ ] Create `api_keys` migration
- [ ] Create `webhooks` migration
- [ ] Add `pgvector` extension for embeddings
- [ ] Apply all migrations to Supabase

### Phase 2: API Layer (3-4 days)
- [ ] Extend `/api/ora` with new actions:
  - [ ] Task management (create, list, update, cancel)
  - [ ] Agent management (list, status, run)
  - [ ] Sync endpoints (push, pull, status, resolve)
  - [ ] API key management
  - [ ] Webhook management
- [ ] Create `/api/agent` for internal execution
- [ ] Add rate limiting middleware
- [ ] Add request logging

### Phase 3: Memory System (2-3 days)
- [ ] Create memory CRUD operations (`src/lib/agent/memory.ts`)
- [ ] Implement semantic search with embeddings
- [ ] Create context builder (retrieve relevant memories)
- [ ] Add memory importance scoring
- [ ] Implement memory expiration

### Phase 4: Sync Engine (3-4 days)
- [ ] Design sync protocol specification
- [ ] Implement `sync.push` with conflict detection
- [ ] Implement `sync.pull` with delta retrieval
- [ ] Create conflict resolution logic
- [ ] Add sync status tracking
- [ ] Build sync reconciliation tool

### Phase 5: Task Queue (2-3 days)
- [ ] Create task management functions
- [ ] Build dependency resolution logic
- [ ] Implement task worker (Vercel Edge Functions or external worker)
- [ ] Add task scheduling
- [ ] Create task chaining logic

### Phase 6: Agent Execution (3-4 days)
- [ ] Create agent runtime (`src/lib/agent/runtime.ts`)
- [ ] Build provider abstraction (OpenAI, Anthropic, etc.)
- [ ] Implement tool execution
- [ ] Create agent system prompts
- [ ] Add execution tracking and audit

### Phase 7: Webhook System (1-2 days)
- [ ] Implement webhook delivery
- [ ] Add retry logic with exponential backoff
- [ ] Create signature verification
- [ ] Build webhook testing endpoint

### Phase 8: Admin UI (2-3 days)
- [ ] Enhance Agents admin page:
  - [ ] Task queue view
  - [ ] Memory browser
  - [ ] Conversation viewer
  - [ ] API key management
  - [ ] Webhook configuration
- [ ] Add real-time status updates

### Phase 9: ORA Desktop Integration (External - Reference)
- [ ] Define sync protocol for ORA desktop app
- [ ] Document API usage patterns
- [ ] Create integration guide
- [ ] Set up test environment

### Phase 10: Testing & Hardening (2-3 days)
- [ ] Unit tests for core functions
- [ ] Integration tests for API endpoints
- [ ] Load testing for sync endpoints
- [ ] Security audit
- [ ] Error handling review

---

## Security Considerations

### Authentication
- All external requests must use Bearer token auth
- API keys are stored as SHA-256 hashes
- Keys can be scoped to specific actions
- IP allowlisting available per key

### Rate Limiting
- Per-key limits (default: 60/min, 10000/day)
- Global limits to prevent abuse
- Separate limits for sync operations

### Data Protection
- Memories can be encrypted at rest (optional)
- Sensitive memory types can be excluded from sync
- Audit trail for all mutations

---

## Error Handling

### Standard Error Response

```typescript
interface ErrorResponse {
  error: {
    code: string;           // 'UNAUTHORIZED', 'RATE_LIMITED', etc.
    message: string;        // Human-readable message
    details?: unknown;      // Additional context
  };
  requestId: string;        // For debugging
}
```

### Error Codes
- `UNAUTHORIZED` - Invalid or missing API key
- `FORBIDDEN` - Valid key but insufficient scope
- `RATE_LIMITED` - Rate limit exceeded
- `VALIDATION_ERROR` - Invalid request payload
- `NOT_FOUND` - Resource not found
- `CONFLICT` - Sync conflict detected
- `INTERNAL_ERROR` - Server error

---

## Monitoring & Observability

### Key Metrics
- API request latency (p50, p95, p99)
- Task queue depth
- Task completion rate
- Sync conflict rate
- Memory storage size
- Agent execution time

### Logging
- All API requests logged with request ID
- All task state transitions logged
- All sync operations logged
- Error details captured with stack traces

---

## Files to Create/Modify

| Path | Action | Description |
|------|--------|-------------|
| `supabase/migrations/20260205_create_agent_memory.sql` | Create | Memory table migration |
| `supabase/migrations/20260205_create_agent_conversations.sql` | Create | Conversations migration |
| `supabase/migrations/20260205_create_agent_tasks.sql` | Create | Tasks queue migration |
| `supabase/migrations/20260205_create_api_keys.sql` | Create | API keys migration |
| `supabase/migrations/20260205_create_webhooks.sql` | Create | Webhooks migration |
| `supabase/migrations/20260206_create_automations.sql` | Create | Automations system |
| `supabase/migrations/20260206_create_notifications.sql` | Create | Notification queue |
| `src/app/api/ora/route.ts` | Modify | Add new actions |
| `src/app/api/agent/route.ts` | Create | Internal agent API |
| `src/app/api/cron/route.ts` | Create | Vercel Cron handler |
| `src/lib/agent/memory.ts` | Create | Memory operations |
| `src/lib/agent/sync.ts` | Create | Sync engine |
| `src/lib/agent/tasks.ts` | Create | Task management |
| `src/lib/agent/runtime.ts` | Create | Agent execution |
| `src/lib/agent/webhooks.ts` | Create | Webhook delivery |
| `src/lib/agent/automations.ts` | Create | Automation engine |
| `src/lib/agent/scheduler.ts` | Create | Cron scheduler |
| `src/lib/agent/triggers.ts` | Create | Event trigger system |
| `src/lib/agent/rules.ts` | Create | Rules engine |
| `src/lib/api-keys.ts` | Create | API key management |
| `src/app/(admin)/admin/agents/page.tsx` | Modify | Enhanced UI |
| `src/app/(admin)/admin/automations/page.tsx` | Create | Automations UI |
| `src/types/agent.ts` | Create | Type definitions |

---

## Success Criteria

1. **ORA can execute any command** via `/api/ora` from desktop
2. **Memory syncs reliably** between desktop and server
3. **Tasks execute in order** respecting dependencies
4. **Sub-agents complete work** delegated by ORA
5. **Admin UI shows** full agent activity
6. **API keys work** with proper scoping and rate limiting
7. **Webhooks deliver** reliably with retries
8. **No data loss** during sync conflicts
9. **Automations run autonomously** even when ORA is offline
10. **Triggers fire accurately** on events, schedules, and conditions

---

## Open Questions

1. **Worker execution**: Use Vercel Edge Functions, Vercel Cron, or external worker (Railway)?
2. **Embedding model**: OpenAI ada-002 or open source alternative?
3. **Sync frequency**: Real-time (WebSocket), polling (every N seconds), or manual?
4. **Memory limits**: Max memories per agent? Auto-cleanup policy?

---

## Notes

- This system is designed for ORA as the primary external agent
- Other agents execute server-side only (for now)
- Desktop app is responsible for local storage format
- Server is the source of truth for conflicts (default)

---
---

# PART II: AUTONOMOUS BEHAVIOR SYSTEM

---

## Overview

This section defines the **Autonomous Behavior System** - the capability for the server to execute intelligent actions independently, even when ORA desktop is offline. This transforms the system from a passive API into an active, self-operating intelligence.

### Design Principles

1. **Event-Driven Architecture** - React to events, don't poll
2. **Declarative Automations** - Define WHAT should happen, not HOW
3. **Composable Actions** - Build complex behaviors from simple primitives
4. **Observability First** - Every action is tracked, auditable, reversible
5. **Graceful Degradation** - Failures don't cascade, system self-heals
6. **ORA as Orchestrator** - ORA can create/modify automations, server executes

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              AUTONOMOUS LAYER                                    │
│                                                                                  │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                           TRIGGER SYSTEM                                 │   │
│  │                                                                          │   │
│  │   ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────┐   │   │
│  │   │   Schedule   │  │    Event     │  │  Threshold   │  │  Manual  │   │   │
│  │   │   Triggers   │  │   Triggers   │  │   Triggers   │  │ Triggers │   │   │
│  │   │              │  │              │  │              │  │          │   │   │
│  │   │ • Cron expr  │  │ • DB changes │  │ • Metrics    │  │ • ORA    │   │   │
│  │   │ • Intervals  │  │ • Webhooks   │  │ • Conditions │  │ • Admin  │   │   │
│  │   │ • One-time   │  │ • API calls  │  │ • Anomalies  │  │ • API    │   │   │
│  │   └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  └────┬─────┘   │   │
│  │          │                 │                 │               │          │   │
│  └──────────┴─────────────────┴─────────────────┴───────────────┴──────────┘   │
│                                       │                                          │
│                                       ▼                                          │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                         AUTOMATION ENGINE                                │   │
│  │                                                                          │   │
│  │   ┌─────────────────────────────────────────────────────────────────┐   │   │
│  │   │                     Automation Definition                        │   │   │
│  │   │  • Name & Description                                           │   │   │
│  │   │  • Trigger Configuration                                        │   │   │
│  │   │  • Condition Predicates                                         │   │   │
│  │   │  • Action Sequence                                              │   │   │
│  │   │  • Error Handling Strategy                                      │   │   │
│  │   └─────────────────────────────────────────────────────────────────┘   │   │
│  │                                                                          │   │
│  │   ┌────────────────┐  ┌────────────────┐  ┌────────────────┐            │   │
│  │   │ Condition      │  │ Action         │  │ Error          │            │   │
│  │   │ Evaluator      │──│ Executor       │──│ Handler        │            │   │
│  │   └────────────────┘  └────────────────┘  └────────────────┘            │   │
│  │                                                                          │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                       │                                          │
│                                       ▼                                          │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                          ACTION PRIMITIVES                               │   │
│  │                                                                          │   │
│  │   ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐          │   │
│  │   │ Execute    │ │ Send       │ │ Update     │ │ Call       │          │   │
│  │   │ Agent Task │ │ Notify     │ │ Data       │ │ Webhook    │          │   │
│  │   └────────────┘ └────────────┘ └────────────┘ └────────────┘          │   │
│  │                                                                          │   │
│  │   ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐          │   │
│  │   │ Store      │ │ Wait/      │ │ Condition  │ │ Chain      │          │   │
│  │   │ Memory     │ │ Delay      │ │ Branch     │ │ Automation │          │   │
│  │   └────────────┘ └────────────┘ └────────────┘ └────────────┘          │   │
│  │                                                                          │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## Database Schema

### 1. Automations Table

```sql
-- =====================================================
-- AUTOMATIONS TABLE
-- Core automation definitions
-- =====================================================

CREATE TABLE IF NOT EXISTS automations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Identity
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    icon TEXT DEFAULT '⚡',
    
    -- Categorization
    category TEXT DEFAULT 'general' CHECK (category IN (
        'content',        -- Post/content related
        'analytics',      -- Analytics/monitoring
        'leads',          -- Lead management
        'maintenance',    -- System maintenance
        'notifications',  -- Alert/notification rules
        'integration',    -- External integrations
        'general'         -- General purpose
    )),
    
    -- Trigger Configuration
    trigger_type TEXT NOT NULL CHECK (trigger_type IN (
        'schedule',       -- Cron-based schedule
        'event',          -- Database/system event
        'threshold',      -- Metric threshold crossed
        'manual',         -- Manual trigger only
        'webhook'         -- External webhook trigger
    )),
    
    trigger_config JSONB NOT NULL,
    -- Schedule: { "cron": "0 9 * * *", "timezone": "Asia/Kolkata" }
    -- Event: { "table": "leads", "event": "INSERT", "filter": {...} }
    -- Threshold: { "metric": "daily_views", "operator": "lt", "value": 100, "duration": "1h" }
    -- Webhook: { "secret": "...", "methods": ["POST"] }
    
    -- Conditions (must be met for actions to execute)
    conditions JSONB DEFAULT '[]',
    -- [{ "field": "lead.score", "operator": "gte", "value": 70 }]
    
    -- Actions (sequence of actions to execute)
    actions JSONB NOT NULL DEFAULT '[]',
    -- [{ "type": "execute_agent", "agent": "writer", "input": {...} }]
    
    -- Error Handling
    on_error TEXT DEFAULT 'notify' CHECK (on_error IN (
        'ignore',         -- Log and continue
        'retry',          -- Retry with backoff
        'notify',         -- Notify admin and continue
        'pause',          -- Pause automation
        'abort'           -- Stop all actions
    )),
    max_retries INTEGER DEFAULT 3,
    retry_delay_seconds INTEGER DEFAULT 60,
    
    -- Rate Limiting
    max_runs_per_hour INTEGER,
    max_runs_per_day INTEGER,
    cooldown_seconds INTEGER DEFAULT 0,    -- Min time between runs
    
    -- State
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN (
        'active',         -- Running normally
        'paused',         -- Temporarily paused
        'disabled',       -- Manually disabled
        'error',          -- Stopped due to errors
        'draft'           -- Not yet activated
    )),
    status_reason TEXT,
    
    -- Statistics
    total_runs INTEGER DEFAULT 0,
    successful_runs INTEGER DEFAULT 0,
    failed_runs INTEGER DEFAULT 0,
    last_run_at TIMESTAMPTZ,
    last_success_at TIMESTAMPTZ,
    last_error_at TIMESTAMPTZ,
    last_error TEXT,
    avg_duration_ms INTEGER,
    
    -- Scheduling
    next_run_at TIMESTAMPTZ,              -- Pre-calculated next run time
    
    -- Ownership
    created_by TEXT DEFAULT 'system',     -- 'system', 'ora', 'admin'
    
    -- Metadata
    tags TEXT[] DEFAULT ARRAY[]::TEXT[],
    metadata JSONB DEFAULT '{}',
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_automations_status ON automations(status);
CREATE INDEX IF NOT EXISTS idx_automations_trigger ON automations(trigger_type);
CREATE INDEX IF NOT EXISTS idx_automations_next_run ON automations(next_run_at)
    WHERE status = 'active' AND trigger_type = 'schedule';
CREATE INDEX IF NOT EXISTS idx_automations_category ON automations(category);
CREATE INDEX IF NOT EXISTS idx_automations_slug ON automations(slug);
CREATE INDEX IF NOT EXISTS idx_automations_tags ON automations USING GIN(tags);

-- RLS
ALTER TABLE automations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role full access" ON automations
    FOR ALL USING (true) WITH CHECK (true);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_automations_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER automations_updated
    BEFORE UPDATE ON automations
    FOR EACH ROW EXECUTE FUNCTION update_automations_timestamp();
```

### 2. Automation Runs Table

```sql
-- =====================================================
-- AUTOMATION RUNS TABLE
-- Execution history for automations
-- =====================================================

CREATE TABLE IF NOT EXISTS automation_runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    automation_id UUID NOT NULL REFERENCES automations(id) ON DELETE CASCADE,
    
    -- Trigger info
    triggered_by TEXT NOT NULL,           -- 'schedule', 'event', 'threshold', 'manual', 'webhook'
    trigger_data JSONB,                   -- Context from trigger
    
    -- Execution
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
        'pending',        -- Waiting to start
        'running',        -- Currently executing
        'success',        -- Completed successfully
        'partial',        -- Some actions failed
        'failed',         -- All/critical actions failed
        'cancelled',      -- Manually cancelled
        'skipped'         -- Conditions not met
    )),
    
    -- Timing
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    duration_ms INTEGER,
    
    -- Action Results
    actions_total INTEGER DEFAULT 0,
    actions_completed INTEGER DEFAULT 0,
    actions_failed INTEGER DEFAULT 0,
    action_results JSONB DEFAULT '[]',
    -- [{ "type": "...", "status": "...", "result": {...}, "error": null, "duration_ms": 123 }]
    
    -- Error tracking
    error TEXT,
    error_details JSONB,
    retry_count INTEGER DEFAULT 0,
    
    -- Resource usage
    tokens_used INTEGER DEFAULT 0,
    estimated_cost DECIMAL(10, 6),
    
    -- Linking
    parent_run_id UUID REFERENCES automation_runs(id),  -- For chained automations
    related_task_ids UUID[],                             -- Tasks created by this run
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_automation_runs_automation ON automation_runs(automation_id);
CREATE INDEX IF NOT EXISTS idx_automation_runs_status ON automation_runs(status);
CREATE INDEX IF NOT EXISTS idx_automation_runs_created ON automation_runs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_automation_runs_triggered ON automation_runs(triggered_by);

-- Partition by month for performance (optional)
-- Consider partitioning if > 1M runs

-- RLS
ALTER TABLE automation_runs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role full access" ON automation_runs
    FOR ALL USING (true) WITH CHECK (true);
```

### 3. Event Log Table

```sql
-- =====================================================
-- EVENT LOG TABLE
-- Central event bus for trigger system
-- =====================================================

CREATE TABLE IF NOT EXISTS event_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Event identity
    event_type TEXT NOT NULL,             -- 'lead.created', 'post.published', etc.
    event_source TEXT NOT NULL,           -- 'database', 'api', 'agent', 'webhook'
    
    -- Event data
    payload JSONB NOT NULL,
    
    -- Processing
    processed BOOLEAN DEFAULT false,
    processed_at TIMESTAMPTZ,
    processing_error TEXT,
    
    -- Matching automations (populated on processing)
    matched_automations UUID[],
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Auto-cleanup after 30 days
    expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '30 days'
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_events_unprocessed ON event_log(processed, created_at)
    WHERE processed = false;
CREATE INDEX IF NOT EXISTS idx_events_type ON event_log(event_type);
CREATE INDEX IF NOT EXISTS idx_events_created ON event_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_events_expires ON event_log(expires_at);

-- Auto-cleanup function
CREATE OR REPLACE FUNCTION cleanup_old_events()
RETURNS void AS $$
BEGIN
    DELETE FROM event_log WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- RLS
ALTER TABLE event_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role full access" ON event_log
    FOR ALL USING (true) WITH CHECK (true);
```

### 4. Notifications Table

```sql
-- =====================================================
-- NOTIFICATIONS TABLE
-- Alert and notification queue
-- =====================================================

CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Notification type
    type TEXT NOT NULL CHECK (type IN (
        'info',           -- Informational
        'success',        -- Success notification
        'warning',        -- Warning/attention needed
        'error',          -- Error occurred
        'alert'           -- Critical alert
    )),
    
    -- Content
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    data JSONB DEFAULT '{}',
    
    -- Source
    source_type TEXT,                     -- 'automation', 'agent', 'system'
    source_id UUID,                       -- ID of source entity
    
    -- Delivery targets
    channels TEXT[] NOT NULL DEFAULT ARRAY['admin'],
    -- ['admin', 'ora', 'email', 'webhook', 'slack']
    
    -- Each channel can have specific config in delivery_config
    delivery_config JSONB DEFAULT '{}',
    -- { "email": { "to": "..." }, "webhook": { "url": "..." } }
    
    -- Delivery status per channel
    delivery_status JSONB DEFAULT '{}',
    -- { "admin": { "sent": true, "at": "..." }, "email": { "sent": false, "error": "..." } }
    
    -- State
    read BOOLEAN DEFAULT false,
    read_at TIMESTAMPTZ,
    dismissed BOOLEAN DEFAULT false,
    dismissed_at TIMESTAMPTZ,
    
    -- Priority
    priority INTEGER DEFAULT 0,           -- Higher = more urgent
    
    -- Linking
    related_automation_id UUID REFERENCES automations(id) ON DELETE SET NULL,
    related_run_id UUID REFERENCES automation_runs(id) ON DELETE SET NULL,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ                -- Optional expiration
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications(read, created_at)
    WHERE read = false AND dismissed = false;
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_priority ON notifications(priority DESC, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_channels ON notifications USING GIN(channels);

-- RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role full access" ON notifications
    FOR ALL USING (true) WITH CHECK (true);
```

### 5. Metrics Table (for threshold triggers)

```sql
-- =====================================================
-- METRICS TABLE
-- Time-series metrics for threshold monitoring
-- =====================================================

CREATE TABLE IF NOT EXISTS metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Metric identity
    name TEXT NOT NULL,                   -- 'page_views', 'lead_count', 'error_rate'
    
    -- Value
    value DOUBLE PRECISION NOT NULL,
    
    -- Dimensions (for filtering/grouping)
    dimensions JSONB DEFAULT '{}',
    -- { "page": "/blog", "source": "google" }
    
    -- Time bucket (for aggregation)
    bucket_start TIMESTAMPTZ NOT NULL,
    bucket_duration INTERVAL NOT NULL DEFAULT '1 hour',
    
    -- Aggregation type
    aggregation TEXT DEFAULT 'sum' CHECK (aggregation IN (
        'sum', 'avg', 'min', 'max', 'count', 'last'
    )),
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- TimescaleDB-style chunking index (without actual TimescaleDB)
CREATE INDEX IF NOT EXISTS idx_metrics_name_time ON metrics(name, bucket_start DESC);
CREATE INDEX IF NOT EXISTS idx_metrics_dimensions ON metrics USING GIN(dimensions);

-- Aggregation function
CREATE OR REPLACE FUNCTION get_metric_value(
    p_name TEXT,
    p_duration INTERVAL DEFAULT '1 hour',
    p_aggregation TEXT DEFAULT 'sum'
)
RETURNS DOUBLE PRECISION AS $$
DECLARE
    result DOUBLE PRECISION;
BEGIN
    EXECUTE format(
        'SELECT %s(value) FROM metrics WHERE name = $1 AND bucket_start > NOW() - $2',
        p_aggregation
    ) INTO result USING p_name, p_duration;
    RETURN COALESCE(result, 0);
END;
$$ LANGUAGE plpgsql;

-- RLS
ALTER TABLE metrics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role full access" ON metrics
    FOR ALL USING (true) WITH CHECK (true);
```

---

## Trigger Types

### 1. Schedule Triggers

```typescript
interface ScheduleTrigger {
    type: 'schedule';
    config: {
        // Standard cron expression
        cron?: string;                    // "0 9 * * 1-5" = 9 AM weekdays
        
        // Or interval-based
        interval?: {
            value: number;
            unit: 'minutes' | 'hours' | 'days' | 'weeks';
        };
        
        // Or one-time
        runAt?: string;                   // ISO timestamp
        
        // Timezone
        timezone?: string;                // Default: 'UTC'
        
        // Skip if previous run still in progress
        skipIfRunning?: boolean;          // Default: true
    };
}

// Examples:
// Daily at 9 AM IST
{ cron: "0 9 * * *", timezone: "Asia/Kolkata" }

// Every 6 hours
{ interval: { value: 6, unit: "hours" } }

// One-time on specific date
{ runAt: "2026-02-10T18:00:00Z" }
```

### 2. Event Triggers

```typescript
interface EventTrigger {
    type: 'event';
    config: {
        // Event to listen for
        events: string[];                 // ['lead.created', 'post.published']
        
        // Filter conditions
        filter?: {
            field: string;
            operator: 'eq' | 'ne' | 'gt' | 'lt' | 'gte' | 'lte' | 'contains' | 'in';
            value: unknown;
        }[];
        
        // Debounce (prevent rapid re-triggering)
        debounce?: {
            seconds: number;
            key?: string;                 // Group debounce by this field
        };
        
        // Batch events
        batch?: {
            maxSize: number;              // Max events per batch
            maxWait: number;              // Max seconds to wait
        };
    };
}

// Examples:
// On new high-score lead
{
    events: ["lead.created"],
    filter: [{ field: "score", operator: "gte", value: 80 }]
}

// On any post publish or update
{
    events: ["post.published", "post.updated"],
    debounce: { seconds: 60, key: "post.id" }
}
```

### 3. Threshold Triggers

```typescript
interface ThresholdTrigger {
    type: 'threshold';
    config: {
        // Metric to monitor
        metric: string;                   // 'daily_page_views', 'lead_count', 'error_rate'
        
        // Threshold condition
        operator: 'gt' | 'lt' | 'gte' | 'lte' | 'eq' | 'change_gt' | 'change_lt';
        value: number;
        
        // Time window
        window: {
            duration: string;             // '1h', '24h', '7d'
            aggregation: 'sum' | 'avg' | 'min' | 'max' | 'count';
        };
        
        // Optional: compare to previous period
        compare?: 'previous_period' | 'same_day_last_week';
        
        // Sustained duration (threshold must be met for this long)
        sustainedFor?: string;            // '5m', '30m'
        
        // Recovery detection
        autoResolve?: boolean;            // Trigger again when back to normal
    };
}

// Examples:
// Alert if views drop 50% vs yesterday
{
    metric: "page_views",
    operator: "change_lt",
    value: -50,
    window: { duration: "24h", aggregation: "sum" },
    compare: "previous_period"
}

// Alert if error rate > 5% for 10 minutes
{
    metric: "error_rate",
    operator: "gt",
    value: 5,
    window: { duration: "10m", aggregation: "avg" },
    sustainedFor: "10m"
}
```

### 4. Database Triggers (PostgreSQL Native)

```sql
-- Create function to emit events on table changes
CREATE OR REPLACE FUNCTION emit_table_event()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO event_log (event_type, event_source, payload)
    VALUES (
        TG_TABLE_NAME || '.' || TG_OP,
        'database',
        jsonb_build_object(
            'table', TG_TABLE_NAME,
            'operation', TG_OP,
            'old', CASE WHEN TG_OP = 'DELETE' OR TG_OP = 'UPDATE' THEN row_to_json(OLD) ELSE NULL END,
            'new', CASE WHEN TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN row_to_json(NEW) ELSE NULL END,
            'timestamp', NOW()
        )
    );
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Apply to tables you want to monitor
CREATE TRIGGER leads_event_trigger
    AFTER INSERT OR UPDATE OR DELETE ON leads
    FOR EACH ROW EXECUTE FUNCTION emit_table_event();

CREATE TRIGGER blog_posts_event_trigger
    AFTER INSERT OR UPDATE OR DELETE ON blog_posts
    FOR EACH ROW EXECUTE FUNCTION emit_table_event();
```

---

## Action Primitives

```typescript
// All available action types
type ActionType =
    | 'execute_agent'      // Run an agent task
    | 'call_api'           // Call ORA API action
    | 'send_notification'  // Send notification
    | 'send_webhook'       // Call external webhook
    | 'update_data'        // Update database record
    | 'store_memory'       // Store in ORA memory
    | 'wait'               // Pause execution
    | 'condition'          // Conditional branch
    | 'chain'              // Trigger another automation
    | 'log'                // Log for debugging
    | 'set_variable'       // Set runtime variable
    | 'transform'          // Transform data
    | 'email'              // Send email
    | 'slack'              // Send Slack message
    ;

interface Action {
    type: ActionType;
    name?: string;                        // Optional label
    config: ActionConfig;
    
    // Conditional execution
    condition?: ConditionExpression;      // Only run if true
    
    // Error handling (override automation default)
    onError?: 'ignore' | 'retry' | 'notify' | 'abort';
    
    // Output mapping
    output?: {
        as: string;                       // Store result as variable
    };
}

// Examples:

// Execute agent
{
    type: 'execute_agent',
    config: {
        agent: 'writer',
        input: { topic: "{{ trigger.data.topic }}" },
        timeout: 60000,
        priority: 'high'
    },
    output: { as: 'draftPost' }
}

// Conditional notification
{
    type: 'send_notification',
    config: {
        title: "New Hot Lead!",
        message: "{{ trigger.data.name }} (Score: {{ trigger.data.score }})",
        type: 'alert',
        channels: ['admin', 'slack']
    },
    condition: { field: "trigger.data.score", operator: "gte", value: 90 }
}

// Chain to another automation
{
    type: 'chain',
    config: {
        automation: 'seo-optimize-post',
        input: { postId: "{{ draftPost.id }}" },
        waitForCompletion: true
    }
}
```

---

## Condition Expressions

```typescript
interface ConditionExpression {
    // Simple condition
    field?: string;                       // "trigger.data.score" or variable
    operator?: 'eq' | 'ne' | 'gt' | 'lt' | 'gte' | 'lte' | 
               'contains' | 'startsWith' | 'endsWith' |
               'in' | 'notIn' | 'exists' | 'notExists' |
               'matches';                 // Regex
    value?: unknown;
    
    // Logical operators for compound conditions
    and?: ConditionExpression[];
    or?: ConditionExpression[];
    not?: ConditionExpression;
}

// Examples:

// Simple
{ field: "lead.score", operator: "gte", value: 70 }

// Compound
{
    and: [
        { field: "lead.score", operator: "gte", value: 70 },
        { field: "lead.source", operator: "eq", value: "organic" }
    ]
}

// Complex
{
    or: [
        { field: "lead.score", operator: "gte", value: 90 },
        {
            and: [
                { field: "lead.score", operator: "gte", value: 70 },
                { field: "lead.company", operator: "contains", value: "enterprise" }
            ]
        }
    ]
}
```

---

## Variable System

Automations support dynamic variables using Mustache-style templating:

```typescript
// Available contexts
interface RuntimeContext {
    // Trigger data
    trigger: {
        type: string;
        data: unknown;                    // Event payload, schedule info, etc.
        timestamp: string;
    };
    
    // Automation info
    automation: {
        id: string;
        name: string;
        runId: string;
    };
    
    // Previous action outputs (by name or index)
    actions: Record<string, unknown>;
    
    // Explicitly set variables
    vars: Record<string, unknown>;
    
    // System
    system: {
        now: string;
        today: string;
        environment: 'development' | 'production';
    };
    
    // Site context
    site: {
        name: string;
        url: string;
        settings: Record<string, unknown>;
    };
}

// Using variables in actions:
{
    type: 'send_notification',
    config: {
        title: "New Lead: {{ trigger.data.name }}",
        message: "Score: {{ trigger.data.score }} | Source: {{ trigger.data.source }}",
        data: {
            leadId: "{{ trigger.data.id }}",
            processedAt: "{{ system.now }}"
        }
    }
}
```

---

## Execution Flow

```
Trigger Fires
     │
     ▼
┌─────────────────────────────────────┐
│ 1. Find matching automations        │
│    (by trigger type + filters)      │
└─────────────────┬───────────────────┘
                  │
     ┌────────────┴────────────┐
     │  For each automation:   │
     ▼                         ▼
┌─────────────────────────────────────┐
│ 2. Check automation status          │
│    (active? not rate-limited?)      │
└─────────────────┬───────────────────┘
                  │ Pass
                  ▼
┌─────────────────────────────────────┐
│ 3. Evaluate conditions              │
│    (all must pass)                  │
└─────────────────┬───────────────────┘
                  │ Pass
                  ▼
┌─────────────────────────────────────┐
│ 4. Create automation_run record     │
│    (status: 'running')              │
└─────────────────┬───────────────────┘
                  │
                  ▼
┌─────────────────────────────────────┐
│ 5. Execute actions in sequence      │
│    ┌─────────────────────────────┐  │
│    │ Action 1                    │  │
│    │   • Evaluate condition      │  │
│    │   • Resolve variables       │  │
│    │   • Execute                 │  │
│    │   • Store output            │  │
│    └──────────────┬──────────────┘  │
│                   │ Success         │
│    ┌──────────────▼──────────────┐  │
│    │ Action 2 ...                │  │
│    └─────────────────────────────┘  │
└─────────────────┬───────────────────┘
                  │
                  ▼
┌─────────────────────────────────────┐
│ 6. Update automation_run            │
│    (status, results, stats)         │
└─────────────────┬───────────────────┘
                  │
                  ▼
┌─────────────────────────────────────┐
│ 7. Update automation stats          │
│    (run counts, next_run_at)        │
└─────────────────────────────────────┘
```

---

## Built-in Automations (Examples)

### 1. Daily Analytics Report

```json
{
    "name": "Daily Analytics Report",
    "slug": "daily-analytics-report",
    "description": "Send daily analytics summary to admin",
    "category": "analytics",
    "trigger_type": "schedule",
    "trigger_config": {
        "cron": "0 9 * * *",
        "timezone": "Asia/Kolkata"
    },
    "actions": [
        {
            "type": "call_api",
            "config": {
                "action": "analytics.summary",
                "data": { "days": 1 }
            },
            "output": { "as": "analytics" }
        },
        {
            "type": "send_notification",
            "config": {
                "title": "📊 Daily Analytics Report",
                "message": "Views: {{ analytics.totalViews }} | Visitors: {{ analytics.uniqueVisitors }} | Bounce: {{ analytics.bounceRate }}%",
                "type": "info",
                "channels": ["admin", "email"]
            }
        }
    ]
}
```

### 2. Hot Lead Auto-Response

```json
{
    "name": "Hot Lead Alert",
    "slug": "hot-lead-alert",
    "description": "Instant alert when high-score lead comes in",
    "category": "leads",
    "trigger_type": "event",
    "trigger_config": {
        "events": ["leads.INSERT"],
        "filter": [{ "field": "ai_score", "operator": "gte", "value": 80 }]
    },
    "actions": [
        {
            "type": "send_notification",
            "config": {
                "title": "🔥 Hot Lead Alert!",
                "message": "{{ trigger.data.new.name }} ({{ trigger.data.new.email }}) - Score: {{ trigger.data.new.ai_score }}",
                "type": "alert",
                "channels": ["admin", "slack"],
                "priority": 10
            }
        },
        {
            "type": "execute_agent",
            "config": {
                "agent": "analyst",
                "input": {
                    "task": "analyze_lead",
                    "leadId": "{{ trigger.data.new.id }}"
                }
            },
            "output": { "as": "analysis" }
        },
        {
            "type": "store_memory",
            "config": {
                "key": "hot_lead_{{ trigger.data.new.id }}",
                "value": {
                    "lead": "{{ trigger.data.new }}",
                    "analysis": "{{ analysis }}",
                    "processedAt": "{{ system.now }}"
                },
                "type": "entity",
                "importance": 0.9
            }
        }
    ]
}
```

### 3. Traffic Drop Alert

```json
{
    "name": "Traffic Drop Alert",
    "slug": "traffic-drop-alert",
    "description": "Alert if daily traffic drops significantly",
    "category": "analytics",
    "trigger_type": "threshold",
    "trigger_config": {
        "metric": "page_views",
        "operator": "change_lt",
        "value": -30,
        "window": { "duration": "24h", "aggregation": "sum" },
        "compare": "same_day_last_week",
        "sustainedFor": "6h"
    },
    "actions": [
        {
            "type": "send_notification",
            "config": {
                "title": "⚠️ Traffic Drop Detected",
                "message": "Daily page views are {{ trigger.data.changePercent }}% lower than last week",
                "type": "warning",
                "channels": ["admin", "ora", "email"]
            }
        },
        {
            "type": "execute_agent",
            "config": {
                "agent": "analyst",
                "input": { "task": "diagnose_traffic_drop" }
            }
        }
    ]
}
```

### 4. Weekly Content Planning

```json
{
    "name": "Weekly Content Planning",
    "slug": "weekly-content-planning",
    "description": "Generate content ideas every Monday",
    "category": "content",
    "trigger_type": "schedule",
    "trigger_config": {
        "cron": "0 10 * * 1",
        "timezone": "Asia/Kolkata"
    },
    "actions": [
        {
            "type": "call_api",
            "config": {
                "action": "analytics.summary",
                "data": { "days": 7 }
            },
            "output": { "as": "weeklyStats" }
        },
        {
            "type": "execute_agent",
            "config": {
                "agent": "writer",
                "input": {
                    "task": "generate_content_ideas",
                    "context": {
                        "topPages": "{{ weeklyStats.topPages }}",
                        "topSources": "{{ weeklyStats.topSources }}"
                    },
                    "count": 5
                }
            },
            "output": { "as": "contentIdeas" }
        },
        {
            "type": "send_notification",
            "config": {
                "title": "📝 Weekly Content Ideas",
                "message": "Generated {{ contentIdeas.ideas.length }} content ideas based on last week's performance",
                "data": { "ideas": "{{ contentIdeas.ideas }}" },
                "type": "info",
                "channels": ["admin"]
            }
        }
    ]
}
```

---

## API Endpoints

### New `/api/ora` Actions

```typescript
// ========== AUTOMATIONS ==========
case 'automations.list':     // List all automations
case 'automations.get':      // Get automation details
case 'automations.create':   // Create new automation
case 'automations.update':   // Update automation
case 'automations.delete':   // Delete automation
case 'automations.pause':    // Pause automation
case 'automations.resume':   // Resume automation
case 'automations.trigger':  // Manually trigger automation
case 'automations.history':  // Get run history

// ========== NOTIFICATIONS ==========
case 'notifications.list':   // List notifications
case 'notifications.read':   // Mark as read
case 'notifications.dismiss':// Dismiss notification
case 'notifications.send':   // ORA sends notification

// ========== EVENTS ==========
case 'events.emit':          // Emit custom event
case 'events.list':          // List recent events

// ========== METRICS ==========
case 'metrics.record':       // Record a metric
case 'metrics.query':        // Query metrics
```

### Vercel Cron Endpoint

```typescript
// vercel.json
{
    "crons": [
        {
            "path": "/api/cron",
            "schedule": "* * * * *"        // Every minute
        }
    ]
}

// src/app/api/cron/route.ts
export async function GET(request: NextRequest) {
    // Verify cron secret
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const results = {
        scheduledAutomations: await processScheduledAutomations(),
        pendingEvents: await processEventQueue(),
        thresholdChecks: await checkThresholds(),
        cleanupTasks: await runCleanupTasks()
    };
    
    return NextResponse.json({ success: true, results });
}
```

---

## Implementation Phases (Extended)

### Phase 11: Automation Foundation (3-4 days)
- [ ] Create `automations` migration
- [ ] Create `automation_runs` migration
- [ ] Create `event_log` migration
- [ ] Create `notifications` migration
- [ ] Create `metrics` migration
- [ ] Create database triggers for event emission
- [ ] Apply all migrations

### Phase 12: Trigger System (2-3 days)
- [ ] Implement schedule trigger processor
- [ ] Implement event trigger processor
- [ ] Implement threshold trigger processor
- [ ] Create trigger matching logic
- [ ] Add debouncing and batching

### Phase 13: Action Engine (3-4 days)
- [ ] Implement all action primitives
- [ ] Create variable resolution system
- [ ] Build condition evaluator
- [ ] Add action chaining logic
- [ ] Implement error handling strategies

### Phase 14: Cron Worker (2-3 days)
- [ ] Create Vercel Cron endpoint
- [ ] Implement scheduled automation runner
- [ ] Implement event queue processor
- [ ] Implement threshold checker
- [ ] Add cleanup routines

### Phase 15: Notification System (2-3 days)
- [ ] Implement notification channels:
  - [ ] Admin (in-app)
  - [ ] ORA (via API)
  - [ ] Email (SendGrid/Resend)
  - [ ] Slack (webhook)
- [ ] Add notification routing
- [ ] Create notification preferences

### Phase 16: Automations Admin UI (3-4 days)
- [ ] Create `/admin/automations` page
  - [ ] Automation list with status
  - [ ] Automation builder/editor
  - [ ] Run history view
  - [ ] Trigger testing
- [ ] Create notification center widget
- [ ] Add automation performance dashboard

### Phase 17: Pre-built Automations (1-2 days)
- [ ] Daily analytics report
- [ ] Hot lead alert
- [ ] Traffic anomaly detection
- [ ] Weekly content planning
- [ ] Error rate monitoring
- [ ] New lead processing

---

## Security Considerations (Extended)

### Automation Security
- Automations can only call authorized API actions
- Custom webhooks require signature verification
- Rate limiting per automation and globally
- Suspicious activity detection (infinite loops, resource abuse)

### Secret Management
- Webhook secrets stored encrypted
- API keys for external services in env vars
- Audit log for all automation modifications

---

## Monitoring (Extended)

### Automation Metrics
- Automation run frequency
- Average execution time per automation
- Success/failure rates
- Action-level performance
- Queue depth and latency

### Alerts
- Automation stuck in running state
- High failure rate threshold
- Queue backup detection
- Resource limit warnings

---

## Final Architecture Summary

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                                 ORA SYSTEM                                       │
│                                                                                  │
│   ┌─────────────────────────────────────────────────────────────────────────┐   │
│   │                        ORA DESKTOP (Local Brain)                         │   │
│   │   • Primary intelligence                                                 │   │
│   │   • User interaction                                                     │   │
│   │   • Memory (local + sync)                                               │   │
│   │   • Command interpretation                                              │   │
│   │   • Creates/manages automations                                         │   │
│   └───────────────────────────────────┬─────────────────────────────────────┘   │
│                                       │                                          │
│                                       │ HTTPS + Bearer Auth                      │
│                                       ▼                                          │
│   ┌─────────────────────────────────────────────────────────────────────────┐   │
│   │                         ANWE.SH SERVER                                   │   │
│   │                                                                          │   │
│   │   ┌─────────────────────────────────────────────────────────────────┐   │   │
│   │   │                     /api/ora (External API)                      │   │   │
│   │   │   22+ Actions: posts, analytics, leads, settings, memory,       │   │   │
│   │   │   files, agents, tasks, automations, notifications              │   │   │
│   │   └─────────────────────────────────────────────────────────────────┘   │   │
│   │                                                                          │   │
│   │   ┌─────────────────────────────────────────────────────────────────┐   │   │
│   │   │                   AUTONOMOUS LAYER                               │   │   │
│   │   │                                                                  │   │   │
│   │   │   ┌─────────┐   ┌─────────┐   ┌─────────┐   ┌─────────┐        │   │   │
│   │   │   │Schedule │   │ Event   │   │Threshold│   │ Cron    │        │   │   │
│   │   │   │Triggers │   │Triggers │   │Triggers │   │ Worker  │        │   │   │
│   │   │   └────┬────┘   └────┬────┘   └────┬────┘   └────┬────┘        │   │   │
│   │   │        │             │             │             │              │   │   │
│   │   │        └─────────────┴──────┬──────┴─────────────┘              │   │   │
│   │   │                             ▼                                    │   │   │
│   │   │   ┌─────────────────────────────────────────────────────────┐   │   │   │
│   │   │   │              AUTOMATION ENGINE                          │   │   │   │
│   │   │   │   • Condition evaluation                                │   │   │   │
│   │   │   │   • Action execution                                    │   │   │   │
│   │   │   │   • Variable resolution                                 │   │   │   │
│   │   │   │   • Error handling                                      │   │   │   │
│   │   │   └─────────────────────────────────────────────────────────┘   │   │   │
│   │   │                             │                                    │   │   │
│   │   │              ┌──────────────┼──────────────┐                    │   │   │
│   │   │              ▼              ▼              ▼                    │   │   │
│   │   │         ┌────────┐    ┌────────┐    ┌────────┐                  │   │   │
│   │   │         │ Writer │    │ Imager │    │  SEO   │                  │   │   │
│   │   │         │ Agent  │    │ Agent  │    │ Agent  │                  │   │   │
│   │   │         └────────┘    └────────┘    └────────┘                  │   │   │
│   │   │                                                                  │   │   │
│   │   └─────────────────────────────────────────────────────────────────┘   │   │
│   │                                                                          │   │
│   │   ┌─────────────────────────────────────────────────────────────────┐   │   │
│   │   │                        SUPABASE                                  │   │   │
│   │   │   agents | agent_runs | agent_memory | agent_tasks              │   │   │
│   │   │   automations | automation_runs | event_log                     │   │   │
│   │   │   notifications | metrics | api_keys | webhooks                 │   │   │
│   │   └─────────────────────────────────────────────────────────────────┘   │   │
│   │                                                                          │   │
│   └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## Success Criteria (Final)

1. ✅ ORA executes commands via API
2. ✅ Memory syncs bidirectionally
3. ✅ Task queue with dependencies works
4. ✅ Sub-agents execute delegated work
5. ✅ API keys with scopes work
6. ✅ Webhooks deliver reliably
7. ✅ **Automations run on schedule (even when ORA offline)**
8. ✅ **Event triggers fire on database changes**
9. ✅ **Threshold triggers detect anomalies**
10. ✅ **Notifications route to appropriate channels**
11. ✅ **Admin UI for automation management**
12. ✅ **Self-healing on automation failures**

---

**Total Implementation Estimate: 4-5 weeks**

| Phase | Days | Cumulative |
|-------|------|------------|
| 1-10 (Original) | ~22 | Week 1-3 |
| 11-17 (Autonomous) | ~15 | Week 3-5 |

---
---

# PART III: ORA KIT - Portable Installation System

---

## Overview

**ORA Kit** is the self-contained, installer-ready package that allows ORA to be deployed on:
- Any Next.js application (existing or new)
- Client websites (as a white-label solution)
- Self-hosted VPS with PostgreSQL (no Supabase dependency)
- Docker containers for easy deployment
- One-click cloud deployments (Railway, Render, DigitalOcean)

### Design Goals

1. **Database Agnostic** - Works with Supabase, Neon, self-hosted PostgreSQL, or any Postgres-compatible DB
2. **Zero Lock-in** - No vendor-specific features required (Supabase Edge Functions, etc.)
3. **One-Command Install** - `npx ora-kit init` to get started
4. **Visual Setup Wizard** - Web-based configuration UI for non-technical users
5. **White-Label Ready** - Remove all ORA branding for client deployments
6. **Offline-First** - Works without cloud dependencies (except for AI APIs)

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              ORA KIT ARCHITECTURE                                │
│                                                                                  │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                          INSTALLATION LAYER                              │   │
│  │                                                                          │   │
│  │   ┌────────────────┐  ┌────────────────┐  ┌────────────────┐            │   │
│  │   │   CLI Tool     │  │  Setup Wizard  │  │    Docker      │            │   │
│  │   │ `npx ora-kit`  │  │   (Web UI)     │  │   Compose      │            │   │
│  │   └───────┬────────┘  └───────┬────────┘  └───────┬────────┘            │   │
│  │           │                   │                   │                      │   │
│  │           └───────────────────┴───────────────────┘                      │   │
│  │                               │                                          │   │
│  └───────────────────────────────┼──────────────────────────────────────────┘   │
│                                  ▼                                               │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                         DATABASE ADAPTER LAYER                           │   │
│  │                                                                          │   │
│  │   ┌────────────────┐  ┌────────────────┐  ┌────────────────┐            │   │
│  │   │   Supabase     │  │   Neon/Planet  │  │  Self-Hosted   │            │   │
│  │   │   Adapter      │  │   Scale        │  │  PostgreSQL    │            │   │
│  │   └───────┬────────┘  └───────┬────────┘  └───────┬────────┘            │   │
│  │           │                   │                   │                      │   │
│  │           └───────────────────┴───────────────────┘                      │   │
│  │                               │                                          │   │
│  │                      ┌────────▼────────┐                                 │   │
│  │                      │  Unified DB     │                                 │   │
│  │                      │  Interface      │                                 │   │
│  │                      └────────┬────────┘                                 │   │
│  │                               │                                          │   │
│  └───────────────────────────────┼──────────────────────────────────────────┘   │
│                                  ▼                                               │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                           CORE ORA ENGINE                                │   │
│  │                                                                          │   │
│  │   /api/ora │ Automations │ Agents │ Memory │ Tasks │ Webhooks           │   │
│  │                                                                          │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## Database Abstraction Layer

### Interface Definition

```typescript
// packages/ora-kit/src/db/interface.ts

/**
 * Database adapter interface
 * All adapters must implement this to work with ORA Kit
 */
export interface OraDatabase {
    // Connection
    connect(): Promise<void>;
    disconnect(): Promise<void>;
    isConnected(): boolean;
    
    // Health
    healthCheck(): Promise<{ ok: boolean; latency: number; error?: string }>;
    
    // Migrations
    runMigrations(): Promise<{ applied: string[]; pending: string[] }>;
    getMigrationStatus(): Promise<{ version: string; applied: string[] }>;
    
    // Generic CRUD
    query<T>(sql: string, params?: unknown[]): Promise<T[]>;
    execute(sql: string, params?: unknown[]): Promise<{ affectedRows: number }>;
    
    // Table operations (ORM-like)
    from<T>(table: string): QueryBuilder<T>;
    
    // Transactions
    transaction<T>(fn: (tx: OraDatabase) => Promise<T>): Promise<T>;
    
    // Raw client (for escape hatches)
    getRawClient(): unknown;
}

/**
 * Query builder interface (Supabase-like API)
 */
export interface QueryBuilder<T> {
    select(columns?: string): QueryBuilder<T>;
    insert(data: Partial<T> | Partial<T>[]): QueryBuilder<T>;
    update(data: Partial<T>): QueryBuilder<T>;
    upsert(data: Partial<T>, options?: { onConflict: string }): QueryBuilder<T>;
    delete(): QueryBuilder<T>;
    
    // Filters
    eq(column: string, value: unknown): QueryBuilder<T>;
    neq(column: string, value: unknown): QueryBuilder<T>;
    gt(column: string, value: unknown): QueryBuilder<T>;
    gte(column: string, value: unknown): QueryBuilder<T>;
    lt(column: string, value: unknown): QueryBuilder<T>;
    lte(column: string, value: unknown): QueryBuilder<T>;
    like(column: string, pattern: string): QueryBuilder<T>;
    ilike(column: string, pattern: string): QueryBuilder<T>;
    is(column: string, value: null | boolean): QueryBuilder<T>;
    in(column: string, values: unknown[]): QueryBuilder<T>;
    contains(column: string, value: unknown): QueryBuilder<T>;
    or(conditions: string): QueryBuilder<T>;
    
    // Ordering & Pagination
    order(column: string, options?: { ascending?: boolean }): QueryBuilder<T>;
    limit(count: number): QueryBuilder<T>;
    offset(count: number): QueryBuilder<T>;
    range(from: number, to: number): QueryBuilder<T>;
    
    // Execution
    single(): Promise<{ data: T | null; error: Error | null }>;
    maybeSingle(): Promise<{ data: T | null; error: Error | null }>;
    execute(): Promise<{ data: T[]; error: Error | null; count?: number }>;
}
```

### Supabase Adapter

```typescript
// packages/ora-kit/src/db/adapters/supabase.ts

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { OraDatabase, QueryBuilder } from '../interface';

export class SupabaseAdapter implements OraDatabase {
    private client: SupabaseClient;
    private connected = false;
    
    constructor(config: { url: string; anonKey?: string; serviceKey: string }) {
        this.client = createClient(config.url, config.serviceKey);
    }
    
    async connect(): Promise<void> {
        // Test connection
        const { error } = await this.client.from('_healthcheck').select('1').limit(1);
        if (error && !error.message.includes('does not exist')) {
            throw new Error(`Supabase connection failed: ${error.message}`);
        }
        this.connected = true;
    }
    
    from<T>(table: string): QueryBuilder<T> {
        return new SupabaseQueryBuilder<T>(this.client.from(table));
    }
    
    async runMigrations(): Promise<{ applied: string[]; pending: string[] }> {
        // Supabase uses its own migration system
        // This returns status from supabase_migrations table
        const { data } = await this.client
            .from('supabase_migrations')
            .select('name')
            .order('executed_at');
        return {
            applied: data?.map(m => m.name) || [],
            pending: [] // Supabase handles this
        };
    }
    
    getRawClient(): SupabaseClient {
        return this.client;
    }
    
    // ... implement other methods
}
```

### Self-Hosted PostgreSQL Adapter

```typescript
// packages/ora-kit/src/db/adapters/postgres.ts

import { Pool, PoolClient } from 'pg';
import { OraDatabase, QueryBuilder } from '../interface';
import { readMigrationFiles, trackMigration } from '../migrations';

export class PostgresAdapter implements OraDatabase {
    private pool: Pool;
    private connected = false;
    
    constructor(config: {
        host: string;
        port: number;
        database: string;
        user: string;
        password: string;
        ssl?: boolean | { rejectUnauthorized: boolean };
    }) {
        this.pool = new Pool({
            ...config,
            max: 10,
            idleTimeoutMillis: 30000,
            connectionTimeoutMillis: 2000
        });
    }
    
    async connect(): Promise<void> {
        const client = await this.pool.connect();
        try {
            await client.query('SELECT 1');
            this.connected = true;
        } finally {
            client.release();
        }
    }
    
    async disconnect(): Promise<void> {
        await this.pool.end();
        this.connected = false;
    }
    
    async healthCheck(): Promise<{ ok: boolean; latency: number; error?: string }> {
        const start = Date.now();
        try {
            await this.pool.query('SELECT 1');
            return { ok: true, latency: Date.now() - start };
        } catch (error) {
            return { 
                ok: false, 
                latency: Date.now() - start,
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }
    
    async runMigrations(): Promise<{ applied: string[]; pending: string[] }> {
        const client = await this.pool.connect();
        try {
            // Create migrations table if not exists
            await client.query(`
                CREATE TABLE IF NOT EXISTS _ora_migrations (
                    id SERIAL PRIMARY KEY,
                    name TEXT NOT NULL UNIQUE,
                    executed_at TIMESTAMPTZ DEFAULT NOW()
                )
            `);
            
            // Get applied migrations
            const { rows: applied } = await client.query(
                'SELECT name FROM _ora_migrations ORDER BY executed_at'
            );
            const appliedNames = applied.map(r => r.name);
            
            // Get all migration files
            const allMigrations = await readMigrationFiles();
            const pending = allMigrations.filter(m => !appliedNames.includes(m.name));
            
            // Run pending migrations
            const newlyApplied: string[] = [];
            for (const migration of pending) {
                await client.query('BEGIN');
                try {
                    await client.query(migration.sql);
                    await client.query(
                        'INSERT INTO _ora_migrations (name) VALUES ($1)',
                        [migration.name]
                    );
                    await client.query('COMMIT');
                    newlyApplied.push(migration.name);
                } catch (error) {
                    await client.query('ROLLBACK');
                    throw new Error(`Migration ${migration.name} failed: ${error}`);
                }
            }
            
            return { applied: newlyApplied, pending: [] };
        } finally {
            client.release();
        }
    }
    
    from<T>(table: string): QueryBuilder<T> {
        return new PostgresQueryBuilder<T>(this.pool, table);
    }
    
    async query<T>(sql: string, params?: unknown[]): Promise<T[]> {
        const { rows } = await this.pool.query(sql, params);
        return rows;
    }
    
    async transaction<T>(fn: (tx: OraDatabase) => Promise<T>): Promise<T> {
        const client = await this.pool.connect();
        try {
            await client.query('BEGIN');
            const txAdapter = new PostgresTransactionAdapter(client);
            const result = await fn(txAdapter);
            await client.query('COMMIT');
            return result;
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }
    
    getRawClient(): Pool {
        return this.pool;
    }
}
```

### Database Factory

```typescript
// packages/ora-kit/src/db/factory.ts

import { OraDatabase } from './interface';
import { SupabaseAdapter } from './adapters/supabase';
import { PostgresAdapter } from './adapters/postgres';
import { NeonAdapter } from './adapters/neon';

export type DatabaseProvider = 'supabase' | 'postgres' | 'neon' | 'planetscale';

export interface DatabaseConfig {
    provider: DatabaseProvider;
    
    // Supabase
    supabaseUrl?: string;
    supabaseServiceKey?: string;
    
    // PostgreSQL (self-hosted or any)
    postgresHost?: string;
    postgresPort?: number;
    postgresDatabase?: string;
    postgresUser?: string;
    postgresPassword?: string;
    postgresSsl?: boolean;
    
    // Or connection string
    connectionString?: string;
}

export function createDatabase(config: DatabaseConfig): OraDatabase {
    switch (config.provider) {
        case 'supabase':
            if (!config.supabaseUrl || !config.supabaseServiceKey) {
                throw new Error('Supabase URL and service key are required');
            }
            return new SupabaseAdapter({
                url: config.supabaseUrl,
                serviceKey: config.supabaseServiceKey
            });
            
        case 'postgres':
            if (config.connectionString) {
                return PostgresAdapter.fromConnectionString(config.connectionString);
            }
            if (!config.postgresHost || !config.postgresDatabase) {
                throw new Error('PostgreSQL host and database are required');
            }
            return new PostgresAdapter({
                host: config.postgresHost,
                port: config.postgresPort || 5432,
                database: config.postgresDatabase,
                user: config.postgresUser || 'postgres',
                password: config.postgresPassword || '',
                ssl: config.postgresSsl
            });
            
        case 'neon':
            // Neon uses same adapter as PostgreSQL but with SSL
            return new NeonAdapter({ connectionString: config.connectionString! });
            
        default:
            throw new Error(`Unsupported database provider: ${config.provider}`);
    }
}

// Global instance
let db: OraDatabase | null = null;

export function getDatabase(): OraDatabase {
    if (!db) {
        throw new Error('Database not initialized. Call initDatabase() first.');
    }
    return db;
}

export async function initDatabase(config: DatabaseConfig): Promise<OraDatabase> {
    db = createDatabase(config);
    await db.connect();
    return db;
}
```

---

## CLI Installer

### Package Structure

```
ora-kit/
├── packages/
│   ├── ora-kit/              # Core package
│   │   ├── src/
│   │   │   ├── db/           # Database abstraction
│   │   │   ├── api/          # API routes
│   │   │   ├── agents/       # Agent system
│   │   │   ├── automations/  # Automation engine
│   │   │   └── index.ts      # Main exports
│   │   └── package.json
│   │
│   ├── create-ora-kit/       # CLI installer
│   │   ├── src/
│   │   │   ├── cli.ts        # Main CLI
│   │   │   ├── installer.ts  # Installation logic
│   │   │   ├── wizard.ts     # Interactive prompts
│   │   │   └── templates/    # File templates
│   │   └── package.json
│   │
│   └── ora-kit-ui/           # Admin UI components
│       ├── src/
│       │   ├── components/
│       │   └── pages/
│       └── package.json
│
├── docker/
│   ├── Dockerfile
│   └── docker-compose.yml
│
└── docs/
    └── installation.md
```

### CLI Tool

```typescript
// packages/create-ora-kit/src/cli.ts

#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import inquirer from 'inquirer';
import { installOraKit, setupDatabase, generateConfig } from './installer';

const program = new Command();

program
    .name('ora-kit')
    .description('ORA Kit - Install AI agent capabilities on any website')
    .version('1.0.0');

// Main init command
program
    .command('init')
    .description('Initialize ORA Kit in your project')
    .option('-y, --yes', 'Skip prompts and use defaults')
    .option('--db <provider>', 'Database provider (supabase|postgres|neon)')
    .option('--docker', 'Generate Docker files')
    .action(async (options) => {
        console.log(chalk.bold.cyan('\n🤖 ORA Kit Installer\n'));
        
        // Check if we're in a Next.js project
        const isNextJs = await detectNextJs();
        if (!isNextJs && !options.yes) {
            const { proceed } = await inquirer.prompt([{
                type: 'confirm',
                name: 'proceed',
                message: 'No Next.js project detected. Create a new one?',
                default: true
            }]);
            if (!proceed) {
                console.log(chalk.yellow('Aborted.'));
                process.exit(0);
            }
            await createNextProject();
        }
        
        // Database selection
        let dbConfig;
        if (options.yes) {
            dbConfig = { provider: options.db || 'postgres' };
        } else {
            dbConfig = await promptDatabaseConfig();
        }
        
        // Feature selection
        const features = options.yes ? ['api', 'agents', 'automations', 'admin'] : 
            await promptFeatures();
        
        // Install
        const spinner = ora('Installing ORA Kit...').start();
        try {
            await installOraKit({
                database: dbConfig,
                features,
                docker: options.docker
            });
            spinner.succeed('ORA Kit installed successfully!');
            
            console.log(chalk.green('\n✅ Installation complete!\n'));
            console.log('Next steps:');
            console.log(chalk.cyan('  1. Configure your database in .env'));
            console.log(chalk.cyan('  2. Run migrations: npx ora-kit migrate'));
            console.log(chalk.cyan('  3. Start your dev server: npm run dev'));
            console.log(chalk.cyan('  4. Visit /setup to complete configuration'));
            
        } catch (error) {
            spinner.fail('Installation failed');
            console.error(chalk.red(error));
            process.exit(1);
        }
    });

// Migrate command
program
    .command('migrate')
    .description('Run database migrations')
    .option('--up', 'Run pending migrations (default)')
    .option('--down', 'Rollback last migration')
    .option('--status', 'Show migration status')
    .action(async (options) => {
        const spinner = ora('Running migrations...').start();
        try {
            const config = await loadConfig();
            const db = await initDatabase(config.database);
            
            if (options.status) {
                spinner.stop();
                const status = await db.getMigrationStatus();
                console.log(chalk.cyan('\nMigration Status:'));
                console.log(`  Applied: ${status.applied.length}`);
                status.applied.forEach(m => console.log(`    ✅ ${m}`));
                return;
            }
            
            const result = await db.runMigrations();
            spinner.succeed(`Applied ${result.applied.length} migrations`);
            result.applied.forEach(m => console.log(chalk.green(`  ✅ ${m}`)));
            
        } catch (error) {
            spinner.fail('Migration failed');
            console.error(chalk.red(error));
            process.exit(1);
        }
    });

// Setup wizard (launches web UI)
program
    .command('setup')
    .description('Launch the web-based setup wizard')
    .option('-p, --port <port>', 'Port to run wizard on', '3333')
    .action(async (options) => {
        console.log(chalk.cyan(`\n🧙 Starting setup wizard on port ${options.port}...\n`));
        await launchSetupWizard(options.port);
    });

// Generate command
program
    .command('generate <type>')
    .description('Generate ORA Kit components')
    .option('-n, --name <name>', 'Component name')
    .action(async (type, options) => {
        switch (type) {
            case 'action':
                await generateAction(options.name);
                break;
            case 'automation':
                await generateAutomation(options.name);
                break;
            case 'agent':
                await generateAgent(options.name);
                break;
            default:
                console.log(chalk.red(`Unknown type: ${type}`));
        }
    });

// Docker commands
program
    .command('docker:build')
    .description('Build Docker image')
    .action(async () => {
        await buildDockerImage();
    });

program
    .command('docker:up')
    .description('Start with Docker Compose')
    .action(async () => {
        await dockerComposeUp();
    });

// Prompts
async function promptDatabaseConfig() {
    const answers = await inquirer.prompt([
        {
            type: 'list',
            name: 'provider',
            message: 'Select database provider:',
            choices: [
                { name: 'Supabase (hosted)', value: 'supabase' },
                { name: 'Self-hosted PostgreSQL', value: 'postgres' },
                { name: 'Neon (serverless Postgres)', value: 'neon' },
                { name: 'Docker PostgreSQL (local)', value: 'docker-postgres' }
            ]
        }
    ]);
    
    if (answers.provider === 'supabase') {
        const supabase = await inquirer.prompt([
            { type: 'input', name: 'url', message: 'Supabase URL:' },
            { type: 'password', name: 'serviceKey', message: 'Supabase Service Key:' }
        ]);
        return { provider: 'supabase', ...supabase };
    }
    
    if (answers.provider === 'postgres') {
        const postgres = await inquirer.prompt([
            { type: 'input', name: 'host', message: 'PostgreSQL Host:', default: 'localhost' },
            { type: 'number', name: 'port', message: 'PostgreSQL Port:', default: 5432 },
            { type: 'input', name: 'database', message: 'Database Name:', default: 'ora_kit' },
            { type: 'input', name: 'user', message: 'Username:', default: 'postgres' },
            { type: 'password', name: 'password', message: 'Password:' },
            { type: 'confirm', name: 'ssl', message: 'Use SSL?', default: false }
        ]);
        return { provider: 'postgres', ...postgres };
    }
    
    if (answers.provider === 'docker-postgres') {
        return { 
            provider: 'postgres',
            host: 'localhost',
            port: 5432,
            database: 'ora_kit',
            user: 'postgres',
            password: 'postgres',
            docker: true
        };
    }
    
    return answers;
}

async function promptFeatures() {
    const { features } = await inquirer.prompt([{
        type: 'checkbox',
        name: 'features',
        message: 'Select features to install:',
        choices: [
            { name: 'ORA API (/api/ora)', value: 'api', checked: true },
            { name: 'Agent System (Writer, SEO, etc.)', value: 'agents', checked: true },
            { name: 'Automation Engine', value: 'automations', checked: true },
            { name: 'Admin Dashboard', value: 'admin', checked: true },
            { name: 'Memory Sync', value: 'memory', checked: false },
            { name: 'Webhook System', value: 'webhooks', checked: false }
        ]
    }]);
    return features;
}

program.parse();
```

---

## Web-Based Setup Wizard

### Setup Wizard UI

```typescript
// packages/ora-kit/src/setup/wizard.tsx

'use client';

import { useState } from 'react';

interface SetupStep {
    id: string;
    title: string;
    component: React.ComponentType<StepProps>;
}

const SETUP_STEPS: SetupStep[] = [
    { id: 'welcome', title: 'Welcome', component: WelcomeStep },
    { id: 'database', title: 'Database', component: DatabaseStep },
    { id: 'credentials', title: 'Credentials', component: CredentialsStep },
    { id: 'ai-providers', title: 'AI Providers', component: AIProvidersStep },
    { id: 'features', title: 'Features', component: FeaturesStep },
    { id: 'test', title: 'Test Connection', component: TestStep },
    { id: 'complete', title: 'Complete', component: CompleteStep }
];

export function SetupWizard() {
    const [currentStep, setCurrentStep] = useState(0);
    const [config, setConfig] = useState<SetupConfig>({});
    const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle');
    
    const handleNext = (stepConfig: Partial<SetupConfig>) => {
        setConfig({ ...config, ...stepConfig });
        setCurrentStep(prev => Math.min(prev + 1, SETUP_STEPS.length - 1));
    };
    
    const handleBack = () => {
        setCurrentStep(prev => Math.max(prev - 1, 0));
    };
    
    const CurrentStepComponent = SETUP_STEPS[currentStep].component;
    
    return (
        <div className="setup-wizard">
            {/* Progress bar */}
            <div className="progress-bar">
                {SETUP_STEPS.map((step, index) => (
                    <div 
                        key={step.id}
                        className={`step ${index <= currentStep ? 'active' : ''}`}
                    >
                        <span className="step-number">{index + 1}</span>
                        <span className="step-title">{step.title}</span>
                    </div>
                ))}
            </div>
            
            {/* Current step content */}
            <div className="step-content">
                <CurrentStepComponent
                    config={config}
                    onNext={handleNext}
                    onBack={handleBack}
                    isFirst={currentStep === 0}
                    isLast={currentStep === SETUP_STEPS.length - 1}
                />
            </div>
        </div>
    );
}

// Database configuration step
function DatabaseStep({ config, onNext, onBack }: StepProps) {
    const [provider, setProvider] = useState(config.database?.provider || '');
    const [connectionDetails, setConnectionDetails] = useState({});
    const [testing, setTesting] = useState(false);
    const [testResult, setTestResult] = useState<{ ok: boolean; message: string } | null>(null);
    
    const testConnection = async () => {
        setTesting(true);
        try {
            const response = await fetch('/api/setup/test-db', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ provider, ...connectionDetails })
            });
            const result = await response.json();
            setTestResult(result);
        } catch (error) {
            setTestResult({ ok: false, message: 'Connection failed' });
        } finally {
            setTesting(false);
        }
    };
    
    return (
        <div className="database-step">
            <h2>Configure Database</h2>
            <p>Choose where to store your data.</p>
            
            <div className="provider-grid">
                {[
                    { id: 'supabase', name: 'Supabase', icon: '⚡', desc: 'Hosted Postgres with extras' },
                    { id: 'postgres', name: 'Self-Hosted PostgreSQL', icon: '🐘', desc: 'Your own server' },
                    { id: 'neon', name: 'Neon', icon: '🌙', desc: 'Serverless Postgres' },
                    { id: 'docker', name: 'Docker (Local)', icon: '🐳', desc: 'For development' }
                ].map(p => (
                    <button
                        key={p.id}
                        className={`provider-card ${provider === p.id ? 'selected' : ''}`}
                        onClick={() => setProvider(p.id)}
                    >
                        <span className="icon">{p.icon}</span>
                        <span className="name">{p.name}</span>
                        <span className="desc">{p.desc}</span>
                    </button>
                ))}
            </div>
            
            {provider === 'supabase' && (
                <div className="connection-form">
                    <input 
                        type="text" 
                        placeholder="Supabase URL" 
                        onChange={e => setConnectionDetails({ ...connectionDetails, url: e.target.value })}
                    />
                    <input 
                        type="password" 
                        placeholder="Service Role Key" 
                        onChange={e => setConnectionDetails({ ...connectionDetails, serviceKey: e.target.value })}
                    />
                </div>
            )}
            
            {provider === 'postgres' && (
                <div className="connection-form">
                    <div className="form-row">
                        <input type="text" placeholder="Host" defaultValue="localhost" />
                        <input type="number" placeholder="Port" defaultValue="5432" />
                    </div>
                    <input type="text" placeholder="Database Name" />
                    <input type="text" placeholder="Username" />
                    <input type="password" placeholder="Password" />
                    <label>
                        <input type="checkbox" /> Use SSL
                    </label>
                </div>
            )}
            
            {provider && (
                <button 
                    className="test-button" 
                    onClick={testConnection}
                    disabled={testing}
                >
                    {testing ? 'Testing...' : 'Test Connection'}
                </button>
            )}
            
            {testResult && (
                <div className={`test-result ${testResult.ok ? 'success' : 'error'}`}>
                    {testResult.ok ? '✅' : '❌'} {testResult.message}
                </div>
            )}
            
            <div className="nav-buttons">
                <button onClick={onBack}>Back</button>
                <button 
                    onClick={() => onNext({ database: { provider, ...connectionDetails } })}
                    disabled={!testResult?.ok}
                >
                    Continue
                </button>
            </div>
        </div>
    );
}

// AI Providers step
function AIProvidersStep({ config, onNext, onBack }: StepProps) {
    const [providers, setProviders] = useState<Record<string, string>>({});
    
    return (
        <div className="ai-providers-step">
            <h2>AI Provider Configuration</h2>
            <p>Add API keys for AI services (at least one required).</p>
            
            <div className="providers-list">
                {[
                    { id: 'openai', name: 'OpenAI', placeholder: 'sk-...' },
                    { id: 'anthropic', name: 'Anthropic', placeholder: 'sk-ant-...' },
                    { id: 'google', name: 'Google AI', placeholder: 'AIza...' }
                ].map(p => (
                    <div key={p.id} className="provider-input">
                        <label>{p.name}</label>
                        <input
                            type="password"
                            placeholder={p.placeholder}
                            value={providers[p.id] || ''}
                            onChange={e => setProviders({ ...providers, [p.id]: e.target.value })}
                        />
                        {providers[p.id] && <span className="check">✓</span>}
                    </div>
                ))}
            </div>
            
            <div className="nav-buttons">
                <button onClick={onBack}>Back</button>
                <button 
                    onClick={() => onNext({ aiProviders: providers })}
                    disabled={Object.values(providers).every(v => !v)}
                >
                    Continue
                </button>
            </div>
        </div>
    );
}

// Features selection step
function FeaturesStep({ config, onNext, onBack }: StepProps) {
    const [features, setFeatures] = useState<Record<string, boolean>>({
        api: true,
        agents: true,
        automations: true,
        admin: true,
        memory: false,
        webhooks: false
    });
    
    const toggleFeature = (id: string) => {
        setFeatures({ ...features, [id]: !features[id] });
    };
    
    return (
        <div className="features-step">
            <h2>Select Features</h2>
            <p>Choose which ORA Kit features to enable.</p>
            
            <div className="features-grid">
                {[
                    { id: 'api', name: 'ORA API', desc: 'Core API for external control', required: true },
                    { id: 'agents', name: 'AI Agents', desc: 'Writer, SEO, Analyst agents' },
                    { id: 'automations', name: 'Automations', desc: 'Scheduled & event-driven tasks' },
                    { id: 'admin', name: 'Admin Dashboard', desc: 'Web UI for management' },
                    { id: 'memory', name: 'Memory Sync', desc: 'Sync with ORA Desktop' },
                    { id: 'webhooks', name: 'Webhooks', desc: 'External event notifications' }
                ].map(f => (
                    <div 
                        key={f.id}
                        className={`feature-card ${features[f.id] ? 'selected' : ''} ${f.required ? 'required' : ''}`}
                        onClick={() => !f.required && toggleFeature(f.id)}
                    >
                        <input 
                            type="checkbox" 
                            checked={features[f.id]} 
                            disabled={f.required}
                            readOnly
                        />
                        <div className="info">
                            <span className="name">{f.name}</span>
                            <span className="desc">{f.desc}</span>
                        </div>
                    </div>
                ))}
            </div>
            
            <div className="nav-buttons">
                <button onClick={onBack}>Back</button>
                <button onClick={() => onNext({ features })}>
                    Continue
                </button>
            </div>
        </div>
    );
}
```

### Setup API Endpoints

```typescript
// packages/ora-kit/src/setup/api.ts

// POST /api/setup/test-db
export async function testDatabaseConnection(config: DatabaseConfig) {
    try {
        const db = createDatabase(config);
        await db.connect();
        const health = await db.healthCheck();
        await db.disconnect();
        
        return {
            ok: health.ok,
            message: health.ok 
                ? `Connected! Latency: ${health.latency}ms`
                : `Connection failed: ${health.error}`
        };
    } catch (error) {
        return {
            ok: false,
            message: error instanceof Error ? error.message : 'Unknown error'
        };
    }
}

// POST /api/setup/complete
export async function completeSetup(config: SetupConfig) {
    // 1. Initialize database
    const db = await initDatabase(config.database);
    
    // 2. Run migrations
    await db.runMigrations();
    
    // 3. Save configuration
    await saveConfig(config);
    
    // 4. Create admin user (if provided)
    if (config.admin) {
        await createAdminUser(db, config.admin);
    }
    
    // 5. Seed default agents
    await seedDefaultAgents(db);
    
    // 6. Generate ORA secret
    const oraSecret = generateSecureToken();
    await saveEnvVar('ORA_SECRET', oraSecret);
    
    return {
        success: true,
        oraSecret,
        message: 'Setup complete! You can now use ORA Kit.'
    };
}
```

---

## Docker Support

### Dockerfile

```dockerfile
# docker/Dockerfile

FROM node:20-alpine AS base

# Install dependencies only when needed
FROM base AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

# Build the application
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# Production image
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["node", "server.js"]
```

### Docker Compose (Full Stack)

```yaml
# docker/docker-compose.yml

version: '3.8'

services:
  # Application
  app:
    build:
      context: ..
      dockerfile: docker/Dockerfile
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=postgres://postgres:postgres@db:5432/ora_kit
      - ORA_SECRET=${ORA_SECRET}
      - OPENAI_API_KEY=${OPENAI_API_KEY}
    depends_on:
      db:
        condition: service_healthy
    restart: unless-stopped
    
  # PostgreSQL Database
  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: ora_kit
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./init-db.sql:/docker-entrypoint-initdb.d/init.sql
    ports:
      - "5432:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 5s
      timeout: 5s
      retries: 5
    restart: unless-stopped
    
  # Optional: pgAdmin for database management
  pgadmin:
    image: dpage/pgadmin4:latest
    environment:
      PGADMIN_DEFAULT_EMAIL: admin@example.com
      PGADMIN_DEFAULT_PASSWORD: admin
    ports:
      - "5050:80"
    depends_on:
      - db
    restart: unless-stopped
    profiles:
      - tools

volumes:
  postgres_data:
```

### One-Line Docker Deploy

```bash
# Deploy with Docker (self-hosted)
docker run -d \
  -p 3000:3000 \
  -e DATABASE_URL=postgres://user:pass@your-db:5432/ora_kit \
  -e ORA_SECRET=your-secret-here \
  -e OPENAI_API_KEY=sk-... \
  ghcr.io/anwesh-personal/ora-kit:latest

# Or with docker-compose (includes PostgreSQL)
curl -o docker-compose.yml https://ora.kit/docker-compose.yml
docker-compose up -d
```

---

## One-Click Cloud Deployments

### Railway

```json
// railway.json
{
    "$schema": "https://railway.app/railway.schema.json",
    "build": {
        "builder": "NIXPACKS"
    },
    "deploy": {
        "startCommand": "npm start",
        "healthcheckPath": "/api/health"
    }
}
```

**Deploy Button:**
```markdown
[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/template/ora-kit)
```

### Render

```yaml
# render.yaml
services:
  - type: web
    name: ora-kit
    env: node
    buildCommand: npm install && npm run build
    startCommand: npm start
    envVars:
      - key: DATABASE_URL
        fromDatabase:
          name: ora-db
          property: connectionString

databases:
  - name: ora-db
    plan: starter
```

### DigitalOcean App Platform

```yaml
# .do/app.yaml
name: ora-kit
services:
  - name: web
    github:
      repo: your-repo/ora-kit
      branch: main
    build_command: npm run build
    run_command: npm start
    envs:
      - key: DATABASE_URL
        scope: RUN_TIME
        type: GENERAL
```

---

## Configuration Management

### Config File Structure

```typescript
// ora-kit.config.ts

import { defineConfig } from '@ora/kit';

export default defineConfig({
    // Site identity
    site: {
        name: 'My Website',
        url: 'https://mywebsite.com'
    },
    
    // Database configuration
    database: {
        provider: 'postgres', // or 'supabase', 'neon'
        connectionString: process.env.DATABASE_URL
    },
    
    // Features to enable
    features: {
        api: true,
        agents: true,
        automations: true,
        admin: true,
        memory: true,
        webhooks: false
    },
    
    // AI Provider config
    ai: {
        defaultProvider: 'openai',
        providers: {
            openai: { apiKey: process.env.OPENAI_API_KEY },
            anthropic: { apiKey: process.env.ANTHROPIC_API_KEY }
        }
    },
    
    // Custom actions (extend the API)
    actions: {
        'products.list': {
            handler: async (data) => { /* ... */ },
            params: { category: { type: 'string', optional: true } },
            returns: { products: 'array' }
        }
    },
    
    // Custom agents
    agents: [
        {
            slug: 'support-bot',
            name: 'Support Agent',
            systemPrompt: '...',
            tools: ['database.query', 'email.send']
        }
    ],
    
    // Branding (white-label)
    branding: {
        name: 'My AI Assistant', // Replace "ORA"
        logo: '/custom-logo.svg',
        colors: {
            primary: '#6366f1',
            accent: '#22d3ee'
        }
    }
});
```

### Environment Variables

```bash
# .env.example

# Database (choose one)
DATABASE_URL=               # Connection string for any PostgreSQL
SUPABASE_URL=               # For Supabase
SUPABASE_SERVICE_KEY=       # For Supabase

# Security
ORA_SECRET=                 # Generated during setup
CRON_SECRET=                # For scheduled tasks
ADMIN_PASSWORD=             # Initial admin password

# AI Providers (at least one required)
OPENAI_API_KEY=
ANTHROPIC_API_KEY=
GOOGLE_AI_KEY=

# Optional integrations
SLACK_WEBHOOK_URL=
SENDGRID_API_KEY=
```

---

## Implementation Phases (Extended)

### Phase 18: Database Abstraction (3-4 days)
- [ ] Define database interface
- [ ] Implement Supabase adapter
- [ ] Implement PostgreSQL adapter
- [ ] Implement Neon adapter
- [ ] Create query builder abstraction
- [ ] Add connection pooling
- [ ] Create migration runner

### Phase 19: CLI Installer (2-3 days)
- [ ] Build CLI with Commander
- [ ] Implement interactive prompts
- [ ] Create file generators/templates
- [ ] Add migration command
- [ ] Add generate commands
- [ ] Test on fresh projects

### Phase 20: Setup Wizard UI (3-4 days)
- [ ] Create wizard page route
- [ ] Build step components
- [ ] Implement database testing
- [ ] Add AI provider validation
- [ ] Create feature selector
- [ ] Build completion flow
- [ ] Style with theming

### Phase 21: Docker & Deployment (2-3 days)
- [ ] Create optimized Dockerfile
- [ ] Create docker-compose.yml
- [ ] Add Railway template
- [ ] Add Render template
- [ ] Add DigitalOcean template
- [ ] Create deployment docs

### Phase 22: Package Publishing (1-2 days)
- [ ] Set up monorepo (Turborepo)
- [ ] Configure package.json for each package
- [ ] Publish to npm:
  - [ ] `@ora/kit`
  - [ ] `create-ora-kit`
  - [ ] `@ora/kit-ui`
- [ ] Create documentation site

---

## Final Success Criteria

1. ✅ `npx create-ora-kit` works on any Next.js project
2. ✅ `/setup` wizard configures everything visually
3. ✅ Works with Supabase, Neon, self-hosted PostgreSQL
4. ✅ Docker deployment works out of the box
5. ✅ One-click deploy to Railway, Render, DigitalOcean
6. ✅ White-labeling removes all ORA branding
7. ✅ Custom actions can be added via config
8. ✅ Migrations run automatically on startup
9. ✅ Client sites can be configured without code

---

**Updated Total Implementation Estimate: 6-7 weeks**

| Phase | Days | Cumulative |
|-------|------|------------|
| 1-10 (Core) | ~22 | Week 1-3 |
| 11-17 (Autonomous) | ~15 | Week 3-5 |
| 18-22 (Portable Kit) | ~12 | Week 5-7 |

---
---

# PART IV: ORA DESKTOP INTEGRATION

---

## Overview

This section defines what **ORA Desktop** (your local AI assistant) needs to fully utilize the ORA Kit system. The server is designed for autodiscovery, but ORA needs specific capabilities to:

1. **Manage multiple sites** from a single interface
2. **Autodiscover APIs** by fetching schemas
3. **Sync memory** between local and remote
4. **Receive notifications** from sites
5. **Create automations** remotely

### Current ORA Capabilities (Already Built)
- ✅ Chat interface with LLM
- ✅ Tool execution (MCP-based)
- ✅ Local memory storage
- ✅ Conversation management
- ✅ File handling

### New ORA Capabilities (To Build)
- ❌ Multi-site registry
- ❌ Dynamic API discovery
- ❌ Remote action execution
- ❌ Memory sync protocol
- ❌ Notification listener
- ❌ Automation builder

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           ORA DESKTOP (Enhanced)                                 │
│                                                                                  │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                         SITES MANAGER                                    │   │
│  │                                                                          │   │
│  │   ┌─────────────────────────────────────────────────────────────────┐   │   │
│  │   │                     Sites Registry                               │   │   │
│  │   │  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐             │   │   │
│  │   │  │  anwe.sh     │ │  lekhika.com │ │  client.xyz  │  ...        │   │   │
│  │   │  │  ✓ Connected │ │  ✓ Connected │ │  ○ Offline   │             │   │   │
│  │   │  └──────────────┘ └──────────────┘ └──────────────┘             │   │   │
│  │   └─────────────────────────────────────────────────────────────────┘   │   │
│  │                                                                          │   │
│  │   ┌─────────────────────────────────────────────────────────────────┐   │   │
│  │   │                   Schema Cache                                   │   │   │
│  │   │   Per-site cached API schemas with available actions            │   │   │
│  │   └─────────────────────────────────────────────────────────────────┘   │   │
│  │                                                                          │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                  │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                       DYNAMIC ACTION EXECUTOR                            │   │
│  │                                                                          │   │
│  │   User: "Publish the draft post about TypeScript on anwe.sh"            │   │
│  │                              │                                           │   │
│  │                              ▼                                           │   │
│  │   1. Parse intent → site: anwe.sh, action: posts.publish                │   │
│  │   2. Fetch schema → GET https://anwe.sh/api/ora                         │   │
│  │   3. Find action → posts.publish { id: required }                       │   │
│  │   4. Execute    → POST https://anwe.sh/api/ora                          │   │
│  │                   { action: "posts.publish", data: { id: "..." } }      │   │
│  │   5. Return result to user                                              │   │
│  │                                                                          │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                  │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                         MEMORY SYNC ENGINE                               │   │
│  │                                                                          │   │
│  │   Local Memory ◄─────────── Sync ───────────► Remote Memory             │   │
│  │   (SQLite/File)                                (Supabase/Postgres)       │   │
│  │                                                                          │   │
│  │   • Bidirectional sync on demand or scheduled                           │   │
│  │   • Conflict resolution (last-write-wins or merge)                      │   │
│  │   • Selective sync (only shared memories)                               │   │
│  │                                                                          │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                  │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                       NOTIFICATION LISTENER                              │   │
│  │                                                                          │   │
│  │   Poll endpoints or WebSocket connection for:                           │   │
│  │   • Hot lead alerts                                                      │   │
│  │   • Traffic anomalies                                                    │   │
│  │   • Task completions                                                     │   │
│  │   • System errors                                                        │   │
│  │                                                                          │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## Sites Manager

### Data Model

```typescript
// ORA Desktop - src/types/sites.ts

interface Site {
    id: string;                           // UUID
    name: string;                         // "My Portfolio"
    url: string;                          // "https://anwe.sh"
    apiEndpoint: string;                  // "/api/ora" (usually default)
    
    // Authentication
    secret: string;                       // ORA_SECRET for this site
    
    // Status
    status: 'connected' | 'offline' | 'error' | 'unauthorized';
    lastConnected: Date | null;
    lastError: string | null;
    
    // Cached schema
    schema: ApiSchema | null;
    schemaUpdatedAt: Date | null;
    
    // Features detected
    features: {
        agents: boolean;
        automations: boolean;
        memory: boolean;
        webhooks: boolean;
    };
    
    // Sync settings
    syncEnabled: boolean;
    lastSyncAt: Date | null;
    
    // Metadata
    createdAt: Date;
    updatedAt: Date;
}

interface ApiSchema {
    name: string;
    version: string;
    description: string;
    authentication: {
        type: 'bearer';
        header: string;
        format: string;
    };
    actions: Record<string, ActionDefinition>;
}

interface ActionDefinition {
    description: string;
    params: Record<string, ParamDefinition>;
    returns: Record<string, string>;
}
```

### Sites Registry Operations

```typescript
// ORA Desktop - src/services/sites.ts

class SitesManager {
    private sites: Map<string, Site> = new Map();
    private storage: LocalStorage;
    
    constructor() {
        this.storage = new LocalStorage('ora-sites');
        this.loadSites();
    }
    
    /**
     * Add a new site to ORA's registry
     */
    async addSite(url: string, secret: string): Promise<Site> {
        // 1. Validate URL
        const apiUrl = this.normalizeUrl(url);
        
        // 2. Test connection and fetch schema
        const schema = await this.fetchSchema(apiUrl, secret);
        if (!schema) {
            throw new Error('Could not connect to site. Check URL and secret.');
        }
        
        // 3. Create site record
        const site: Site = {
            id: crypto.randomUUID(),
            name: schema.name || new URL(url).hostname,
            url: apiUrl,
            apiEndpoint: '/api/ora',
            secret,
            status: 'connected',
            lastConnected: new Date(),
            lastError: null,
            schema,
            schemaUpdatedAt: new Date(),
            features: this.detectFeatures(schema),
            syncEnabled: false,
            lastSyncAt: null,
            createdAt: new Date(),
            updatedAt: new Date()
        };
        
        // 4. Store
        this.sites.set(site.id, site);
        await this.saveSites();
        
        return site;
    }
    
    /**
     * Fetch API schema from a site
     */
    async fetchSchema(url: string, secret: string): Promise<ApiSchema | null> {
        try {
            const response = await fetch(`${url}/api/ora`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${secret}`
                }
            });
            
            if (!response.ok) {
                return null;
            }
            
            return await response.json();
        } catch (error) {
            console.error('Schema fetch failed:', error);
            return null;
        }
    }
    
    /**
     * Refresh schema for a site
     */
    async refreshSchema(siteId: string): Promise<void> {
        const site = this.sites.get(siteId);
        if (!site) throw new Error('Site not found');
        
        const schema = await this.fetchSchema(site.url, site.secret);
        if (schema) {
            site.schema = schema;
            site.schemaUpdatedAt = new Date();
            site.status = 'connected';
            site.lastConnected = new Date();
            site.features = this.detectFeatures(schema);
        } else {
            site.status = 'offline';
        }
        
        await this.saveSites();
    }
    
    /**
     * Get available actions for a site
     */
    getActions(siteId: string): ActionDefinition[] {
        const site = this.sites.get(siteId);
        if (!site?.schema) return [];
        return Object.entries(site.schema.actions).map(([name, def]) => ({
            name,
            ...def
        }));
    }
    
    /**
     * Detect features from schema
     */
    private detectFeatures(schema: ApiSchema): Site['features'] {
        const actions = Object.keys(schema.actions);
        return {
            agents: actions.some(a => a.startsWith('agents.')),
            automations: actions.some(a => a.startsWith('automations.')),
            memory: actions.some(a => a.startsWith('memory.')),
            webhooks: actions.some(a => a.startsWith('webhooks.'))
        };
    }
    
    /**
     * Get all sites
     */
    getAllSites(): Site[] {
        return Array.from(this.sites.values());
    }
    
    /**
     * Find site by name or URL (for natural language matching)
     */
    findSite(query: string): Site | null {
        const normalized = query.toLowerCase();
        
        for (const site of this.sites.values()) {
            if (
                site.name.toLowerCase().includes(normalized) ||
                site.url.toLowerCase().includes(normalized)
            ) {
                return site;
            }
        }
        
        return null;
    }
}
```

---

## Dynamic Action Executor

### Action Execution

```typescript
// ORA Desktop - src/services/executor.ts

class ActionExecutor {
    private sitesManager: SitesManager;
    
    /**
     * Execute an action on a site
     */
    async execute(siteId: string, action: string, data?: unknown): Promise<unknown> {
        const site = this.sitesManager.getSite(siteId);
        if (!site) throw new Error('Site not found');
        if (site.status !== 'connected') {
            throw new Error(`Site ${site.name} is ${site.status}`);
        }
        
        // Validate action exists in schema
        const actionDef = site.schema?.actions[action];
        if (!actionDef) {
            throw new Error(`Unknown action: ${action}. Available: ${Object.keys(site.schema?.actions || {}).join(', ')}`);
        }
        
        // Validate required params
        for (const [param, def] of Object.entries(actionDef.params)) {
            if (!def.optional && (!data || !(param in data))) {
                throw new Error(`Missing required parameter: ${param}`);
            }
        }
        
        // Execute
        const response = await fetch(`${site.url}${site.apiEndpoint}`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${site.secret}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ action, data })
        });
        
        if (!response.ok) {
            const error = await response.json().catch(() => ({ error: 'Unknown error' }));
            throw new Error(error.error || `Request failed: ${response.status}`);
        }
        
        return await response.json();
    }
    
    /**
     * Execute with natural language parsing
     */
    async executeFromNaturalLanguage(
        llm: LLM,
        userMessage: string,
        context: ConversationContext
    ): Promise<ActionResult> {
        // 1. Get all available sites and their actions
        const sites = this.sitesManager.getAllSites()
            .filter(s => s.status === 'connected');
        
        if (sites.length === 0) {
            return { 
                success: false, 
                error: 'No sites connected. Use "add site" to connect a site.' 
            };
        }
        
        // 2. Build tools from schemas
        const tools = this.buildToolsFromSchemas(sites);
        
        // 3. Let LLM decide which action to call
        const response = await llm.chat({
            messages: [
                {
                    role: 'system',
                    content: `You are ORA, an AI assistant that can control websites. 
                    
Available sites: ${sites.map(s => `${s.name} (${s.url})`).join(', ')}

When the user asks you to do something on a website:
1. Identify which site they're referring to
2. Choose the appropriate action from the available tools
3. Extract the required parameters from their message
4. Execute the action

If you're unsure which site, ask for clarification.`
                },
                ...context.messages,
                { role: 'user', content: userMessage }
            ],
            tools
        });
        
        // 4. If tool call requested, execute it
        if (response.toolCalls?.length) {
            const toolCall = response.toolCalls[0];
            const [siteId, action] = toolCall.name.split('__');
            
            try {
                const result = await this.execute(siteId, action, toolCall.arguments);
                return { success: true, result, action };
            } catch (error) {
                return { 
                    success: false, 
                    error: error instanceof Error ? error.message : 'Execution failed' 
                };
            }
        }
        
        // 5. Otherwise return the text response
        return { success: true, response: response.content };
    }
    
    /**
     * Build LLM tools from site schemas
     */
    private buildToolsFromSchemas(sites: Site[]): Tool[] {
        const tools: Tool[] = [];
        
        for (const site of sites) {
            if (!site.schema) continue;
            
            for (const [actionName, actionDef] of Object.entries(site.schema.actions)) {
                tools.push({
                    type: 'function',
                    function: {
                        name: `${site.id}__${actionName}`,
                        description: `[${site.name}] ${actionDef.description}`,
                        parameters: {
                            type: 'object',
                            properties: this.convertParams(actionDef.params),
                            required: Object.entries(actionDef.params)
                                .filter(([_, def]) => !def.optional)
                                .map(([name]) => name)
                        }
                    }
                });
            }
        }
        
        return tools;
    }
}
```

---

## Memory Sync Engine

### Sync Protocol

```typescript
// ORA Desktop - src/services/memory-sync.ts

class MemorySyncEngine {
    private sitesManager: SitesManager;
    private localMemory: LocalMemoryStore;
    
    /**
     * Sync memory with a specific site
     */
    async syncWithSite(siteId: string): Promise<SyncResult> {
        const site = this.sitesManager.getSite(siteId);
        if (!site) throw new Error('Site not found');
        if (!site.features.memory) {
            throw new Error('Site does not support memory sync');
        }
        
        // 1. Get local memories for this site
        const localMemories = await this.localMemory.getForSite(siteId);
        
        // 2. Get remote memories
        const remoteResponse = await this.executeAction(site, 'memory.list', {
            type: 'ora-sync',
            limit: 1000
        });
        const remoteMemories = remoteResponse.memories || [];
        
        // 3. Compute diff
        const { toUpload, toDownload, conflicts } = this.computeDiff(
            localMemories,
            remoteMemories
        );
        
        // 4. Resolve conflicts (last-write-wins by default)
        const resolved = this.resolveConflicts(conflicts);
        
        // 5. Upload local changes
        for (const memory of [...toUpload, ...resolved.useLocal]) {
            await this.executeAction(site, 'memory.store', {
                key: memory.key,
                value: memory.content,
                type: memory.type,
                importance: memory.importance
            });
        }
        
        // 6. Download remote changes
        for (const memory of [...toDownload, ...resolved.useRemote]) {
            await this.localMemory.store({
                siteId,
                key: memory.key,
                content: memory.content,
                type: memory.type,
                importance: memory.importance,
                syncedAt: new Date()
            });
        }
        
        // 7. Update sync timestamp
        site.lastSyncAt = new Date();
        await this.sitesManager.updateSite(site);
        
        return {
            uploaded: toUpload.length + resolved.useLocal.length,
            downloaded: toDownload.length + resolved.useRemote.length,
            conflicts: conflicts.length
        };
    }
    
    /**
     * Compute diff between local and remote
     */
    private computeDiff(
        local: Memory[],
        remote: Memory[]
    ): { toUpload: Memory[]; toDownload: Memory[]; conflicts: ConflictPair[] } {
        const localMap = new Map(local.map(m => [m.key, m]));
        const remoteMap = new Map(remote.map(m => [m.key, m]));
        
        const toUpload: Memory[] = [];
        const toDownload: Memory[] = [];
        const conflicts: ConflictPair[] = [];
        
        // Check each local memory
        for (const [key, localMem] of localMap) {
            const remoteMem = remoteMap.get(key);
            
            if (!remoteMem) {
                // Only exists locally → upload
                toUpload.push(localMem);
            } else if (localMem.updatedAt > remoteMem.updatedAt) {
                // Local is newer → might be conflict
                if (localMem.syncedAt && remoteMem.updatedAt > localMem.syncedAt) {
                    // Both changed since last sync → conflict!
                    conflicts.push({ local: localMem, remote: remoteMem });
                } else {
                    // Local is definitively newer
                    toUpload.push(localMem);
                }
            } else if (remoteMem.updatedAt > localMem.updatedAt) {
                // Remote is newer
                toDownload.push(remoteMem);
            }
            // If equal, no action needed
        }
        
        // Check for remote-only memories
        for (const [key, remoteMem] of remoteMap) {
            if (!localMap.has(key)) {
                toDownload.push(remoteMem);
            }
        }
        
        return { toUpload, toDownload, conflicts };
    }
    
    /**
     * Enable automatic sync
     */
    enableAutoSync(siteId: string, intervalMinutes: number = 5): void {
        // Start periodic sync
        setInterval(async () => {
            try {
                await this.syncWithSite(siteId);
            } catch (error) {
                console.error(`Auto-sync failed for ${siteId}:`, error);
            }
        }, intervalMinutes * 60 * 1000);
    }
}
```

---

## Notification Listener

### Polling-Based Listener

```typescript
// ORA Desktop - src/services/notifications.ts

class NotificationListener {
    private sitesManager: SitesManager;
    private handlers: Map<string, NotificationHandler[]> = new Map();
    private pollIntervals: Map<string, NodeJS.Timer> = new Map();
    
    /**
     * Start listening for notifications from a site
     */
    startListening(siteId: string, intervalSeconds: number = 30): void {
        if (this.pollIntervals.has(siteId)) return;
        
        const poll = async () => {
            try {
                const notifications = await this.fetchNotifications(siteId);
                for (const notification of notifications) {
                    this.handleNotification(siteId, notification);
                }
            } catch (error) {
                console.error(`Notification poll failed for ${siteId}:`, error);
            }
        };
        
        // Initial poll
        poll();
        
        // Set up interval
        const interval = setInterval(poll, intervalSeconds * 1000);
        this.pollIntervals.set(siteId, interval);
    }
    
    /**
     * Stop listening
     */
    stopListening(siteId: string): void {
        const interval = this.pollIntervals.get(siteId);
        if (interval) {
            clearInterval(interval);
            this.pollIntervals.delete(siteId);
        }
    }
    
    /**
     * Fetch unread notifications
     */
    private async fetchNotifications(siteId: string): Promise<Notification[]> {
        const site = this.sitesManager.getSite(siteId);
        if (!site) return [];
        
        const response = await fetch(`${site.url}/api/ora`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${site.secret}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                action: 'notifications.list',
                data: { unread: true, limit: 50 }
            })
        });
        
        if (!response.ok) return [];
        
        const data = await response.json();
        return data.notifications || [];
    }
    
    /**
     * Handle incoming notification
     */
    private handleNotification(siteId: string, notification: Notification): void {
        const handlers = this.handlers.get('*') || [];
        const typeHandlers = this.handlers.get(notification.type) || [];
        
        // Show in ORA's UI
        this.showNotification(siteId, notification);
        
        // Call registered handlers
        for (const handler of [...handlers, ...typeHandlers]) {
            handler(siteId, notification);
        }
        
        // Mark as read
        this.markAsRead(siteId, notification.id);
    }
    
    /**
     * Show notification in ORA's UI
     */
    private showNotification(siteId: string, notification: Notification): void {
        const site = this.sitesManager.getSite(siteId);
        
        // Use system notification
        if (Notification.permission === 'granted') {
            new Notification(`[${site?.name}] ${notification.title}`, {
                body: notification.message,
                icon: site?.favicon,
                tag: notification.id
            });
        }
        
        // Also add to ORA's internal notification queue
        eventBus.emit('notification', {
            siteId,
            siteName: site?.name,
            ...notification
        });
    }
    
    /**
     * Register notification handler
     */
    onNotification(type: string | '*', handler: NotificationHandler): void {
        if (!this.handlers.has(type)) {
            this.handlers.set(type, []);
        }
        this.handlers.get(type)!.push(handler);
    }
}
```

---

## Automation Builder

### Remote Automation Management

```typescript
// ORA Desktop - src/services/automations.ts

class AutomationBuilder {
    private sitesManager: SitesManager;
    
    /**
     * List automations on a site
     */
    async listAutomations(siteId: string): Promise<Automation[]> {
        const site = this.sitesManager.getSite(siteId);
        if (!site?.features.automations) {
            throw new Error('Site does not support automations');
        }
        
        const response = await this.executeAction(site, 'automations.list', {});
        return response.automations || [];
    }
    
    /**
     * Create automation from natural language
     */
    async createFromNaturalLanguage(
        llm: LLM,
        siteId: string,
        description: string
    ): Promise<Automation> {
        const site = this.sitesManager.getSite(siteId);
        if (!site?.schema) throw new Error('Site schema not available');
        
        // Get available actions for this site
        const availableActions = Object.keys(site.schema.actions);
        
        // Use LLM to convert to automation structure
        const response = await llm.chat({
            messages: [
                {
                    role: 'system',
                    content: `You are creating an automation. Convert the user's description into a valid automation JSON.

Available actions: ${availableActions.join(', ')}

Respond with valid JSON matching this schema:
{
    "name": "...",
    "slug": "...",
    "description": "...",
    "category": "general|content|analytics|leads|maintenance",
    "trigger_type": "schedule|event|threshold",
    "trigger_config": { ... },
    "conditions": [],
    "actions": [{ "type": "...", "config": {...} }]
}`
                },
                { role: 'user', content: description }
            ],
            responseFormat: { type: 'json_object' }
        });
        
        const automationDef = JSON.parse(response.content);
        
        // Create on server
        const result = await this.executeAction(site, 'automations.create', automationDef);
        return result.automation;
    }
    
    /**
     * Quick automation templates
     */
    getTemplates(): AutomationTemplate[] {
        return [
            {
                id: 'daily-analytics',
                name: 'Daily Analytics Report',
                description: 'Send daily analytics summary',
                promptExample: 'Send me a daily analytics report at 9 AM'
            },
            {
                id: 'hot-lead-alert',
                name: 'Hot Lead Alert',
                description: 'Alert when high-score lead comes in',
                promptExample: 'Alert me when a lead with score over 80 comes in'
            },
            {
                id: 'traffic-drop',
                name: 'Traffic Drop Alert',
                description: 'Alert when traffic drops significantly',
                promptExample: 'Warn me if daily traffic drops more than 30%'
            },
            {
                id: 'weekly-content',
                name: 'Weekly Content Ideas',
                description: 'Generate content ideas weekly',
                promptExample: 'Generate 5 content ideas every Monday based on analytics'
            }
        ];
    }
}
```

---

## UI Components (ORA Desktop)

### Sites Panel

```typescript
// ORA Desktop - src/components/SitesPanel.tsx

function SitesPanel() {
    const [sites, setSites] = useState<Site[]>([]);
    const [showAddSite, setShowAddSite] = useState(false);
    
    useEffect(() => {
        loadSites();
    }, []);
    
    const loadSites = async () => {
        const allSites = await sitesManager.getAllSites();
        setSites(allSites);
    };
    
    return (
        <div className="sites-panel">
            <div className="header">
                <h3>Connected Sites</h3>
                <button onClick={() => setShowAddSite(true)}>+ Add Site</button>
            </div>
            
            <div className="sites-list">
                {sites.map(site => (
                    <div 
                        key={site.id} 
                        className={`site-card ${site.status}`}
                    >
                        <img src={`${site.url}/favicon.ico`} alt="" />
                        <div className="info">
                            <span className="name">{site.name}</span>
                            <span className="url">{site.url}</span>
                        </div>
                        <StatusIndicator status={site.status} />
                        <SiteActions site={site} onRefresh={loadSites} />
                    </div>
                ))}
            </div>
            
            {showAddSite && (
                <AddSiteModal 
                    onClose={() => setShowAddSite(false)}
                    onSiteAdded={loadSites}
                />
            )}
        </div>
    );
}

function AddSiteModal({ onClose, onSiteAdded }) {
    const [url, setUrl] = useState('');
    const [secret, setSecret] = useState('');
    const [testing, setTesting] = useState(false);
    const [error, setError] = useState('');
    
    const handleAdd = async () => {
        setTesting(true);
        setError('');
        
        try {
            await sitesManager.addSite(url, secret);
            onSiteAdded();
            onClose();
        } catch (err) {
            setError(err.message);
        } finally {
            setTesting(false);
        }
    };
    
    return (
        <Modal onClose={onClose}>
            <h2>Add Site</h2>
            
            <input
                type="text"
                placeholder="Site URL (e.g., https://mysite.com)"
                value={url}
                onChange={e => setUrl(e.target.value)}
            />
            
            <input
                type="password"
                placeholder="ORA Secret"
                value={secret}
                onChange={e => setSecret(e.target.value)}
            />
            
            {error && <div className="error">{error}</div>}
            
            <div className="actions">
                <button onClick={onClose}>Cancel</button>
                <button 
                    onClick={handleAdd} 
                    disabled={!url || !secret || testing}
                >
                    {testing ? 'Connecting...' : 'Add Site'}
                </button>
            </div>
        </Modal>
    );
}
```

### Notifications Panel

```typescript
// ORA Desktop - src/components/NotificationsPanel.tsx

function NotificationsPanel() {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    
    useEffect(() => {
        // Listen for new notifications
        const unsubscribe = eventBus.on('notification', (notification) => {
            setNotifications(prev => [notification, ...prev]);
        });
        
        return unsubscribe;
    }, []);
    
    return (
        <div className="notifications-panel">
            <div className="header">
                <h3>Notifications</h3>
                {notifications.length > 0 && (
                    <span className="badge">{notifications.length}</span>
                )}
            </div>
            
            <div className="notifications-list">
                {notifications.length === 0 ? (
                    <div className="empty">No notifications</div>
                ) : (
                    notifications.map(n => (
                        <div key={n.id} className={`notification ${n.type}`}>
                            <span className="site">{n.siteName}</span>
                            <span className="title">{n.title}</span>
                            <span className="message">{n.message}</span>
                            <span className="time">{formatTime(n.createdAt)}</span>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
```

---

## Implementation Phases (ORA Desktop)

### Phase 23: Sites Manager (2-3 days)
- [ ] Create Site data model and storage
- [ ] Implement SitesManager class
- [ ] Build schema fetching and caching
- [ ] Create Sites Panel UI
- [ ] Add site add/remove/edit functionality

### Phase 24: Dynamic Executor (2-3 days)
- [ ] Build ActionExecutor class
- [ ] Implement schema-to-tools conversion
- [ ] Integrate with LLM for natural language
- [ ] Add validation and error handling
- [ ] Test with multiple sites

### Phase 25: Memory Sync (2-3 days)
- [ ] Design local memory schema
- [ ] Implement sync protocol
- [ ] Add conflict resolution
- [ ] Build sync status UI
- [ ] Add auto-sync option

### Phase 26: Notifications (1-2 days)
- [ ] Implement NotificationListener
- [ ] Add polling mechanism
- [ ] Create Notifications Panel UI
- [ ] Integrate system notifications
- [ ] Add sound/visual alerts

### Phase 27: Automation Builder (2-3 days)
- [ ] Build AutomationBuilder class
- [ ] Create natural language → automation converter
- [ ] Add automation templates
- [ ] Build automation management UI
- [ ] Test end-to-end flow

---

## ORA Desktop Changes Summary

| Component | Change Type | Effort |
|-----------|-------------|--------|
| Sites Manager | New | 2-3 days |
| Schema Cache | New | 1 day |
| Action Executor | New | 2-3 days |
| Memory Sync | New | 2-3 days |
| Notification Listener | New | 1-2 days |
| Automation Builder | New | 2-3 days |
| UI: Sites Panel | New | 1 day |
| UI: Notifications | New | 1 day |
| **Total** | | **~10-12 days** |

---

## Success Criteria (ORA Desktop)

1. ✅ Add/remove sites from UI
2. ✅ Auto-fetch and cache schemas
3. ✅ Execute any action via natural language
4. ✅ Sync memory bidirectionally
5. ✅ Receive real-time notifications
6. ✅ Create automations via chat
7. ✅ Works with any ORA Kit site

---

**Final Total Implementation Estimate: 8-9 weeks**

| Phase | Days | Cumulative |
|-------|------|------------|
| 1-10 (Core Server) | ~22 | Week 1-3 |
| 11-17 (Autonomous) | ~15 | Week 3-5 |
| 18-22 (Portable Kit) | ~12 | Week 5-7 |
| 23-27 (ORA Desktop) | ~12 | Week 7-9 |

---
---

# PART V: MEMORY LIFECYCLE MANAGEMENT

---

## The Problem

Without proper memory management:

1. **Memory Bloat** - Syncing 10 sites × 10,000 memories each = 100K+ memories locally
2. **Performance Death** - Every query searches all memories → laggy as fuck
3. **Hallucination Debt** - Old/stale/contradictory memories poison LLM context
4. **Context Overflow** - Can't fit relevant memories in token limits
5. **Storage Explosion** - Embeddings alone: 100K × 1536 floats × 4 bytes = 600MB just for vectors

### The Solution: Tiered Memory with Intelligent Lifecycle

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                         MEMORY LIFECYCLE ARCHITECTURE                            │
│                                                                                  │
│   ┌──────────────────────┐                                                      │
│   │     HOT MEMORY       │  ← Active context, recent, frequently accessed       │
│   │    (In-Memory/LRU)   │    Max: 1000 per site                                │
│   │                      │    TTL: 24 hours without access                      │
│   └──────────┬───────────┘                                                      │
│              │ Eviction                                                          │
│              ▼                                                                   │
│   ┌──────────────────────┐                                                      │
│   │     WARM MEMORY      │  ← Recently used, searchable                         │
│   │   (SQLite + Vector)  │    Max: 10,000 per site                              │
│   │                      │    TTL: 30 days without access                       │
│   └──────────┬───────────┘                                                      │
│              │ Archive                                                           │
│              ▼                                                                   │
│   ┌──────────────────────┐                                                      │
│   │     COLD MEMORY      │  ← Archived, searchable on demand                    │
│   │  (Compressed/Remote) │    Max: 100,000 per site                             │
│   │                      │    TTL: 1 year, then garbage collect                 │
│   └──────────┬───────────┘                                                      │
│              │ Decay                                                             │
│              ▼                                                                   │
│   ┌──────────────────────┐                                                      │
│   │     GRAVEYARD        │  ← Tombstones for deleted memories                   │
│   │   (Metadata only)    │    Prevents resurrection on sync                     │
│   └──────────────────────┘                                                      │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## Memory Scoring System

Every memory has a **Health Score** that determines its lifecycle:

```typescript
interface MemoryHealth {
    // Base importance (1-10, set at creation)
    importance: number;
    
    // Recency factor (decays over time)
    recency: number;           // 0.0 - 1.0
    
    // Access frequency
    accessCount: number;
    lastAccessedAt: Date | null;
    
    // Relevance (how often retrieved in semantic search)
    retrievalCount: number;
    avgRelevanceScore: number; // When retrieved, how relevant was it?
    
    // Freshness (is the information still valid?)
    createdAt: Date;
    expiresAt: Date | null;    // Optional hard expiry
    
    // Contradiction score (does it conflict with newer info?)
    contradictionCount: number;
    supersededBy: string | null; // ID of memory that replaced this
    
    // Computed health
    healthScore: number;       // 0.0 - 1.0
}
```

### Health Score Calculation

```typescript
function calculateHealthScore(memory: Memory): number {
    const now = Date.now();
    
    // 1. Recency decay (exponential)
    const ageHours = (now - memory.createdAt.getTime()) / (1000 * 60 * 60);
    const recencyScore = Math.exp(-ageHours / (24 * 7)); // Half-life: ~1 week
    
    // 2. Access score (log scale)
    const accessScore = memory.accessCount > 0 
        ? Math.min(1, Math.log10(memory.accessCount + 1) / 2)
        : 0;
    
    // 3. Retrieval score
    const retrievalScore = memory.retrievalCount > 0
        ? memory.avgRelevanceScore * Math.min(1, memory.retrievalCount / 10)
        : 0;
    
    // 4. Freshness penalty
    const freshnessScore = memory.expiresAt 
        ? (memory.expiresAt.getTime() > now ? 1 : 0)
        : 1;
    
    // 5. Contradiction penalty
    const contradictionPenalty = memory.supersededBy ? 0.1 : 
        Math.max(0, 1 - (memory.contradictionCount * 0.2));
    
    // 6. Base importance weight
    const importanceWeight = memory.importance / 10;
    
    // Weighted combination
    const score = (
        recencyScore * 0.2 +
        accessScore * 0.15 +
        retrievalScore * 0.25 +
        freshnessScore * 0.1 +
        contradictionPenalty * 0.1 +
        importanceWeight * 0.2
    );
    
    return Math.min(1, Math.max(0, score));
}
```

---

## Tiered Storage Implementation

### Hot Memory (In-Memory LRU Cache)

```typescript
// ORA Desktop - src/memory/hot-cache.ts

class HotMemoryCache {
    private cache: Map<string, CachedMemory> = new Map();
    private maxSize: number;
    private siteQuotas: Map<string, number> = new Map();
    
    constructor(maxSize: number = 5000) {
        this.maxSize = maxSize;
    }
    
    /**
     * Get memory, promoting it in LRU
     */
    get(id: string): Memory | null {
        const cached = this.cache.get(id);
        if (!cached) return null;
        
        // Update access stats
        cached.accessCount++;
        cached.lastAccessedAt = new Date();
        
        // Move to end (most recently used)
        this.cache.delete(id);
        this.cache.set(id, cached);
        
        return cached.memory;
    }
    
    /**
     * Add memory to hot cache
     */
    set(memory: Memory): void {
        const siteId = memory.siteId || 'local';
        const currentSiteCount = this.siteQuotas.get(siteId) || 0;
        
        // Per-site limit (prevent one site from dominating)
        const perSiteMax = Math.floor(this.maxSize / 10); // 10% per site
        if (currentSiteCount >= perSiteMax) {
            this.evictOldestFromSite(siteId);
        }
        
        // Global limit
        if (this.cache.size >= this.maxSize) {
            this.evictLeastHealthy();
        }
        
        this.cache.set(memory.id, {
            memory,
            accessCount: 1,
            lastAccessedAt: new Date(),
            addedAt: new Date()
        });
        
        this.siteQuotas.set(siteId, currentSiteCount + 1);
    }
    
    /**
     * Evict least healthy memory
     */
    private evictLeastHealthy(): void {
        let lowestScore = Infinity;
        let lowestId: string | null = null;
        
        for (const [id, cached] of this.cache) {
            const score = calculateHealthScore(cached.memory);
            if (score < lowestScore) {
                lowestScore = score;
                lowestId = id;
            }
        }
        
        if (lowestId) {
            const evicted = this.cache.get(lowestId)!;
            this.cache.delete(lowestId);
            
            // Demote to warm storage
            warmStorage.add(evicted.memory);
            
            const siteId = evicted.memory.siteId || 'local';
            this.siteQuotas.set(siteId, (this.siteQuotas.get(siteId) || 1) - 1);
        }
    }
    
    /**
     * Get memories for context (smart selection)
     */
    getForContext(query: string, siteId?: string, limit: number = 20): Memory[] {
        const candidates: Array<{ memory: Memory; score: number }> = [];
        
        for (const [_, cached] of this.cache) {
            // Filter by site if specified
            if (siteId && cached.memory.siteId !== siteId) continue;
            
            const healthScore = calculateHealthScore(cached.memory);
            // Only include healthy memories
            if (healthScore > 0.3) {
                candidates.push({ memory: cached.memory, score: healthScore });
            }
        }
        
        // Sort by health and return top N
        return candidates
            .sort((a, b) => b.score - a.score)
            .slice(0, limit)
            .map(c => c.memory);
    }
}
```

### Warm Memory (SQLite + Vector Index)

```typescript
// ORA Desktop - src/memory/warm-storage.ts

class WarmStorage {
    private db: Database;
    private vectorIndex: VectorIndex;
    
    constructor(dbPath: string) {
        this.db = new Database(dbPath);
        this.initSchema();
        this.vectorIndex = new VectorIndex(dbPath + '.vectors');
    }
    
    private initSchema(): void {
        this.db.exec(`
            CREATE TABLE IF NOT EXISTS memories (
                id TEXT PRIMARY KEY,
                site_id TEXT,
                content TEXT NOT NULL,
                type TEXT DEFAULT 'fact',
                importance INTEGER DEFAULT 5,
                
                -- Health tracking
                access_count INTEGER DEFAULT 0,
                retrieval_count INTEGER DEFAULT 0,
                avg_relevance REAL DEFAULT 0,
                contradiction_count INTEGER DEFAULT 0,
                superseded_by TEXT,
                
                -- Timestamps
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL,
                last_accessed_at TEXT,
                expires_at TEXT,
                
                -- Status
                status TEXT DEFAULT 'active' CHECK (status IN ('active', 'archived', 'deleted')),
                health_score REAL DEFAULT 1.0
            );
            
            CREATE INDEX IF NOT EXISTS idx_site_status ON memories(site_id, status);
            CREATE INDEX IF NOT EXISTS idx_health ON memories(health_score);
            CREATE INDEX IF NOT EXISTS idx_type ON memories(type);
        `);
    }
    
    /**
     * Add memory to warm storage
     */
    async add(memory: Memory): Promise<void> {
        // Generate embedding
        const embedding = await this.generateEmbedding(memory.content);
        
        // Store in SQLite
        this.db.run(`
            INSERT OR REPLACE INTO memories 
            (id, site_id, content, type, importance, created_at, updated_at, health_score)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            memory.id,
            memory.siteId,
            memory.content,
            memory.type,
            memory.importance,
            memory.createdAt.toISOString(),
            new Date().toISOString(),
            calculateHealthScore(memory)
        ]);
        
        // Add to vector index
        await this.vectorIndex.add(memory.id, embedding);
    }
    
    /**
     * Semantic search with health filtering
     */
    async search(
        query: string, 
        options: {
            siteId?: string;
            limit?: number;
            minHealth?: number;
            types?: string[];
        } = {}
    ): Promise<Memory[]> {
        const { siteId, limit = 10, minHealth = 0.3, types } = options;
        
        // Generate query embedding
        const queryEmbedding = await this.generateEmbedding(query);
        
        // Vector search
        const candidates = await this.vectorIndex.search(queryEmbedding, limit * 3);
        
        // Filter and rank
        const results: Memory[] = [];
        for (const { id, similarity } of candidates) {
            const memory = this.getById(id);
            if (!memory) continue;
            
            // Filter by site
            if (siteId && memory.siteId !== siteId) continue;
            
            // Filter by type
            if (types && !types.includes(memory.type)) continue;
            
            // Filter by health
            if (memory.healthScore < minHealth) continue;
            
            // Update retrieval stats
            this.updateRetrievalStats(id, similarity);
            
            results.push(memory);
            if (results.length >= limit) break;
        }
        
        return results;
    }
    
    /**
     * Run garbage collection
     */
    async gc(): Promise<GCResult> {
        const now = new Date();
        let archived = 0;
        let deleted = 0;
        
        // 1. Archive old, low-health memories
        const toArchive = this.db.all(`
            SELECT id FROM memories 
            WHERE status = 'active' 
            AND health_score < 0.2
            AND datetime(last_accessed_at) < datetime('now', '-30 days')
        `);
        
        for (const { id } of toArchive) {
            await this.archiveMemory(id);
            archived++;
        }
        
        // 2. Delete superseded memories
        const superseded = this.db.all(`
            SELECT id FROM memories 
            WHERE superseded_by IS NOT NULL
            AND datetime(updated_at) < datetime('now', '-7 days')
        `);
        
        for (const { id } of superseded) {
            this.deleteMemory(id);
            deleted++;
        }
        
        // 3. Delete expired memories
        const expired = this.db.all(`
            SELECT id FROM memories 
            WHERE expires_at IS NOT NULL
            AND datetime(expires_at) < datetime('now')
        `);
        
        for (const { id } of expired) {
            this.deleteMemory(id);
            deleted++;
        }
        
        // 4. Enforce per-site limits
        const siteCounts = this.db.all(`
            SELECT site_id, COUNT(*) as count 
            FROM memories 
            WHERE status = 'active'
            GROUP BY site_id
            HAVING count > 10000
        `);
        
        for (const { site_id, count } of siteCounts) {
            const excess = count - 10000;
            const toDelete = this.db.all(`
                SELECT id FROM memories 
                WHERE site_id = ? AND status = 'active'
                ORDER BY health_score ASC
                LIMIT ?
            `, [site_id, excess]);
            
            for (const { id } of toDelete) {
                await this.archiveMemory(id);
                archived++;
            }
        }
        
        return { archived, deleted };
    }
    
    /**
     * Recalculate all health scores (run periodically)
     */
    async recalculateHealth(): Promise<number> {
        const memories = this.db.all(`SELECT * FROM memories WHERE status = 'active'`);
        let updated = 0;
        
        for (const row of memories) {
            const memory = this.rowToMemory(row);
            const newScore = calculateHealthScore(memory);
            
            if (Math.abs(newScore - row.health_score) > 0.05) {
                this.db.run(
                    `UPDATE memories SET health_score = ? WHERE id = ?`,
                    [newScore, row.id]
                );
                updated++;
            }
        }
        
        return updated;
    }
}
```

### Cold Storage (Compressed Archive)

```typescript
// ORA Desktop - src/memory/cold-storage.ts

class ColdStorage {
    private archivePath: string;
    
    constructor(archivePath: string) {
        this.archivePath = archivePath;
    }
    
    /**
     * Archive memory (compress and store)
     */
    async archive(memory: Memory): Promise<void> {
        const siteDir = path.join(this.archivePath, memory.siteId || 'local');
        await fs.mkdir(siteDir, { recursive: true });
        
        // Group by month
        const month = memory.createdAt.toISOString().slice(0, 7); // YYYY-MM
        const archiveFile = path.join(siteDir, `${month}.jsonl.gz`);
        
        // Append to compressed archive
        const line = JSON.stringify({
            id: memory.id,
            content: memory.content,
            type: memory.type,
            importance: memory.importance,
            createdAt: memory.createdAt.toISOString(),
            // Store minimal metadata, discard embeddings
        }) + '\n';
        
        await this.appendGzip(archiveFile, line);
    }
    
    /**
     * Search cold storage (expensive, use sparingly)
     */
    async search(
        query: string, 
        siteId: string,
        dateRange?: { from: Date; to: Date }
    ): Promise<Memory[]> {
        const siteDir = path.join(this.archivePath, siteId);
        if (!await fs.access(siteDir).then(() => true).catch(() => false)) {
            return [];
        }
        
        const results: Memory[] = [];
        const files = await fs.readdir(siteDir);
        
        for (const file of files) {
            if (!file.endsWith('.jsonl.gz')) continue;
            
            // Check date range
            const month = file.replace('.jsonl.gz', '');
            if (dateRange) {
                const archiveDate = new Date(month + '-01');
                if (archiveDate < dateRange.from || archiveDate > dateRange.to) {
                    continue;
                }
            }
            
            // Decompress and search
            const content = await this.readGzip(path.join(siteDir, file));
            const lines = content.split('\n').filter(Boolean);
            
            for (const line of lines) {
                const memory = JSON.parse(line);
                // Simple text match for cold search
                if (memory.content.toLowerCase().includes(query.toLowerCase())) {
                    results.push(memory);
                }
            }
        }
        
        return results;
    }
    
    /**
     * Garbage collect old archives
     */
    async gc(maxAgeYears: number = 1): Promise<number> {
        const cutoff = new Date();
        cutoff.setFullYear(cutoff.getFullYear() - maxAgeYears);
        let deleted = 0;
        
        const sites = await fs.readdir(this.archivePath);
        for (const site of sites) {
            const siteDir = path.join(this.archivePath, site);
            const files = await fs.readdir(siteDir);
            
            for (const file of files) {
                const month = file.replace('.jsonl.gz', '');
                const archiveDate = new Date(month + '-01');
                
                if (archiveDate < cutoff) {
                    await fs.unlink(path.join(siteDir, file));
                    deleted++;
                }
            }
        }
        
        return deleted;
    }
}
```

---

## Contradiction Detection

Prevent hallucination debt by detecting when new info contradicts old:

```typescript
// ORA Desktop - src/memory/contradiction-detector.ts

class ContradictionDetector {
    private llm: LLM;
    
    /**
     * Check if new memory contradicts existing ones
     */
    async checkContradictions(
        newMemory: Memory,
        existingMemories: Memory[]
    ): Promise<ContradictionResult> {
        // Filter to same topic/type
        const relevant = existingMemories.filter(m => 
            m.type === newMemory.type ||
            this.hasSimilarTopic(m, newMemory)
        );
        
        if (relevant.length === 0) {
            return { hasContradiction: false, contradicts: [] };
        }
        
        // Use LLM to detect contradiction
        const response = await this.llm.chat({
            messages: [
                {
                    role: 'system',
                    content: `You are a fact-checker. Determine if the NEW fact contradicts any EXISTING facts.
                    
Respond with JSON: { "contradicts": [indices of contradicted facts, or empty], "explanation": "..." }`
                },
                {
                    role: 'user',
                    content: `NEW FACT: ${newMemory.content}

EXISTING FACTS:
${relevant.map((m, i) => `${i}. ${m.content}`).join('\n')}`
                }
            ],
            responseFormat: { type: 'json_object' }
        });
        
        const result = JSON.parse(response.content);
        
        return {
            hasContradiction: result.contradicts.length > 0,
            contradicts: result.contradicts.map((i: number) => relevant[i]),
            explanation: result.explanation
        };
    }
    
    /**
     * Handle contradiction: supersede old memories
     */
    async handleContradiction(
        newMemory: Memory,
        oldMemories: Memory[]
    ): Promise<void> {
        for (const old of oldMemories) {
            // Mark old as superseded
            old.supersededBy = newMemory.id;
            old.contradictionCount++;
            await memoryStore.update(old);
            
            // Log for audit
            console.log(`Memory ${old.id} superseded by ${newMemory.id}`);
        }
    }
}
```

---

## Smart Memory Retrieval

Don't just dump memories into context - be strategic:

```typescript
// ORA Desktop - src/memory/retrieval.ts

class SmartRetrieval {
    /**
     * Get optimal memories for current conversation
     */
    async getContextMemories(
        conversation: Message[],
        siteId?: string,
        tokenBudget: number = 2000
    ): Promise<Memory[]> {
        const selected: Memory[] = [];
        let tokensUsed = 0;
        
        // 1. Extract topics from recent messages
        const recentTopics = await this.extractTopics(
            conversation.slice(-5)
        );
        
        // 2. Get high-priority memories (critical facts)
        const critical = await this.getCriticalMemories(siteId, 5);
        for (const memory of critical) {
            const tokens = this.estimateTokens(memory.content);
            if (tokensUsed + tokens <= tokenBudget * 0.3) { // 30% for critical
                selected.push(memory);
                tokensUsed += tokens;
            }
        }
        
        // 3. Get topic-relevant memories
        const topicRelevant = await warmStorage.search(
            recentTopics.join(' '),
            { siteId, limit: 20, minHealth: 0.4 }
        );
        
        for (const memory of topicRelevant) {
            if (selected.some(s => s.id === memory.id)) continue;
            
            const tokens = this.estimateTokens(memory.content);
            if (tokensUsed + tokens <= tokenBudget * 0.7) { // 70% for relevant
                selected.push(memory);
                tokensUsed += tokens;
            }
        }
        
        // 4. Fill remaining with recent memories
        const recent = await this.getRecentMemories(siteId, 10);
        for (const memory of recent) {
            if (selected.some(s => s.id === memory.id)) continue;
            
            const tokens = this.estimateTokens(memory.content);
            if (tokensUsed + tokens <= tokenBudget) {
                selected.push(memory);
                tokensUsed += tokens;
            }
        }
        
        // 5. Format as compact list (not verbose)
        return selected;
    }
    
    /**
     * Get critical memories (site preferences, important facts)
     */
    private async getCriticalMemories(siteId?: string, limit: number = 5): Promise<Memory[]> {
        return warmStorage.db.all(`
            SELECT * FROM memories 
            WHERE status = 'active'
            ${siteId ? 'AND site_id = ?' : ''}
            AND importance >= 8
            AND health_score >= 0.5
            ORDER BY importance DESC, health_score DESC
            LIMIT ?
        `, siteId ? [siteId, limit] : [limit]);
    }
    
    /**
     * Compress memories before injecting into context
     */
    compressForContext(memories: Memory[]): string {
        // Group by type
        const grouped = new Map<string, Memory[]>();
        for (const memory of memories) {
            const type = memory.type || 'general';
            if (!grouped.has(type)) grouped.set(type, []);
            grouped.get(type)!.push(memory);
        }
        
        // Format compactly
        let output = '';
        for (const [type, mems] of grouped) {
            output += `\n[${type.toUpperCase()}]\n`;
            for (const mem of mems) {
                // Truncate long memories
                const content = mem.content.length > 200 
                    ? mem.content.slice(0, 200) + '...'
                    : mem.content;
                output += `• ${content}\n`;
            }
        }
        
        return output;
    }
}
```

---

## Sync Strategy (Not Full Dump)

```typescript
// ORA Desktop - src/memory/selective-sync.ts

class SelectiveSync {
    /**
     * Sync only what matters
     */
    async syncWithSite(siteId: string): Promise<SyncResult> {
        const site = sitesManager.getSite(siteId);
        
        // 1. Only sync "shared" memories (not personal/local)
        const toUpload = await warmStorage.db.all(`
            SELECT * FROM memories 
            WHERE site_id = ?
            AND type IN ('fact', 'preference', 'context')
            AND health_score >= 0.5
            AND importance >= 6
            ORDER BY updated_at DESC
            LIMIT 500
        `, [siteId]);
        
        // 2. Only download high-importance from server
        const serverMemories = await this.fetchFromServer(site, {
            minImportance: 6,
            types: ['fact', 'preference', 'context'],
            limit: 500,
            updatedSince: site.lastSyncAt
        });
        
        // 3. Lightweight diff (just IDs and timestamps)
        const localMap = new Map(toUpload.map(m => [m.id, m.updated_at]));
        const serverMap = new Map(serverMemories.map(m => [m.id, m.updated_at]));
        
        const toActuallyUpload = toUpload.filter(m => {
            const serverTime = serverMap.get(m.id);
            return !serverTime || new Date(m.updated_at) > new Date(serverTime);
        });
        
        const toDownload = serverMemories.filter(m => {
            const localTime = localMap.get(m.id);
            return !localTime || new Date(m.updated_at) > new Date(localTime);
        });
        
        // 4. Execute sync (batched)
        await this.batchUpload(site, toActuallyUpload);
        await this.batchDownload(toDownload);
        
        return {
            uploaded: toActuallyUpload.length,
            downloaded: toDownload.length
        };
    }
    
    /**
     * Types to sync (configurable per site)
     */
    getSyncableTypes(siteId: string): string[] {
        const site = sitesManager.getSite(siteId);
        return site?.syncConfig?.types || [
            'fact',        // Factual information
            'preference',  // User/site preferences  
            'context',     // Important context
            // NOT synced:
            // 'personal'  - Private to ORA
            // 'temporary' - Session-specific
            // 'cached'    - Ephemeral data
        ];
    }
}
```

---

## Scheduled Maintenance

```typescript
// ORA Desktop - src/memory/maintenance.ts

class MemoryMaintenance {
    /**
     * Run daily maintenance
     */
    async runDaily(): Promise<MaintenanceResult> {
        const result: MaintenanceResult = {
            healthRecalculated: 0,
            archived: 0,
            deleted: 0,
            vectorsOptimized: false
        };
        
        // 1. Recalculate health scores
        result.healthRecalculated = await warmStorage.recalculateHealth();
        
        // 2. Garbage collect warm storage
        const gcWarm = await warmStorage.gc();
        result.archived += gcWarm.archived;
        result.deleted += gcWarm.deleted;
        
        // 3. Garbage collect cold storage (yearly cleanup)
        const today = new Date();
        if (today.getDate() === 1) { // First of month
            result.deleted += await coldStorage.gc(1);
        }
        
        // 4. Optimize vector index (weekly)
        if (today.getDay() === 0) { // Sunday
            await warmStorage.vectorIndex.optimize();
            result.vectorsOptimized = true;
        }
        
        // 5. Clear hot cache of stale items
        hotCache.evictStale();
        
        return result;
    }
    
    /**
     * Start maintenance scheduler
     */
    startScheduler(): void {
        // Run at 3 AM local time
        const runMaintenance = () => {
            const now = new Date();
            const target = new Date(now);
            target.setHours(3, 0, 0, 0);
            if (target <= now) target.setDate(target.getDate() + 1);
            
            const delay = target.getTime() - now.getTime();
            setTimeout(async () => {
                await this.runDaily();
                runMaintenance(); // Schedule next run
            }, delay);
        };
        
        runMaintenance();
    }
}
```

---

## Memory Quotas and Limits

```typescript
// ORA Desktop - src/memory/quotas.ts

const MEMORY_QUOTAS = {
    // Per-site limits
    perSite: {
        hot: 1000,      // In-memory cache
        warm: 10000,    // SQLite active
        cold: 100000,   // Compressed archive
    },
    
    // Global limits
    global: {
        hot: 5000,      // Total hot cache
        warm: 100000,   // Total SQLite
        coldGb: 5,      // Max cold storage in GB
    },
    
    // Per-type limits (prevent one type from dominating)
    perType: {
        fact: 5000,
        preference: 500,
        context: 2000,
        conversation: 1000,
        cached: 500,
    },
    
    // Sync limits
    sync: {
        maxPerSync: 500,     // Max memories per sync
        minHealth: 0.5,      // Min health to sync
        minImportance: 6,    // Min importance to sync
    }
};
```

---

## Implementation Phases

### Phase 28: Memory Scoring (1-2 days)
- [ ] Implement health score calculation
- [ ] Add decay algorithms
- [ ] Create recalculation job

### Phase 29: Tiered Storage (2-3 days)
- [ ] Build hot cache with LRU
- [ ] Implement warm storage with SQLite
- [ ] Create cold archive system
- [ ] Add promotion/demotion logic

### Phase 30: Contradiction Detection (1-2 days)
- [ ] Build contradiction detector
- [ ] Implement supersede logic
- [ ] Add conflict resolution

### Phase 31: Smart Retrieval (1-2 days)
- [ ] Implement context-aware retrieval
- [ ] Add topic extraction
- [ ] Create memory compression

### Phase 32: Maintenance System (1 day)
- [ ] Build GC for each tier
- [ ] Create scheduled maintenance
- [ ] Add monitoring/alerts

---

## Memory Lifecycle Summary

| Stage | Max Items | TTL | Trigger to Demote |
|-------|-----------|-----|-------------------|
| **Hot** | 1K/site | 24h no access | LRU eviction |
| **Warm** | 10K/site | 30d no access | Health < 0.2 |
| **Cold** | 100K/site | 1 year | Age + low health |
| **Deleted** | N/A | Immediate | Superseded or expired |

---

**This prevents:**
- ❌ Memory bloat (enforced quotas)
- ❌ Slow queries (tiered caching)
- ❌ Hallucination debt (contradiction detection + decay)
- ❌ Context overflow (smart retrieval + compression)
- ❌ Stale info (automatic expiry + supersede)

---

**Updated Total Implementation Estimate: 9-10 weeks**

| Phase | Days | Cumulative |
|-------|------|------------|
| 1-10 (Core Server) | ~22 | Week 1-3 |
| 11-17 (Autonomous) | ~15 | Week 3-5 |
| 18-22 (Portable Kit) | ~12 | Week 5-7 |
| 23-27 (ORA Desktop) | ~12 | Week 7-9 |
| 28-32 (Memory Lifecycle) | ~7 | Week 9-10 |

---
---

# PART VI: ORA DESKTOP - SITE CONNECTIONS & AGENT MEMORY

## Handover Document for ORA Desktop IDE Agent

---

## Overview

This document specifies exactly what needs to be built in **ORA Desktop** to support:
1. Connecting to remote sites (websites running ORA Kit)
2. Isolated memory databases per agent-site pair
3. Dynamic tool registration from site schemas
4. Agent spawning and lifecycle management
5. Settings UI for site management

---

## Architecture: Folder-Per-Site

```
~/.ora/
├── memory.db                    ← ORA's LOCAL memory (EXISTING - DO NOT TOUCH)
├── conversations/               ← Existing
├── config/                      ← Existing
│
└── sites/                       ← NEW: Remote site data
    ├── anwesh/                  ← One folder per connected site
    │   ├── config.json          ← Connection config (URL, secret, name)
    │   ├── schema.json          ← Cached API schema (actions, params)
    │   ├── ora.site.db          ← ORA's memory FOR this site
    │   ├── writer.site.db       ← Writer agent's memory
    │   └── backups/             ← Deleted agent DBs (7-day retention)
    │       └── task-42.site.db.bak
    │
    └── lekhika/
        ├── config.json
        ├── schema.json
        └── ora.site.db
```

### Key Decisions

| Decision | Choice | Reason |
|----------|--------|--------|
| Folder structure | Per-site | Site is the primary grouping (connect, disconnect, migrate) |
| DB naming | `{agent}.site.db` | Avoids confusion with local `memory.db` |
| Backup location | Inside site folder | Easy cleanup when site is deleted |
| Schema caching | `schema.json` | Offline access, reduces API calls |

---

## Data Models

### 1. Site Connection

```typescript
// File: ~/.ora/sites/{slug}/config.json

interface SiteConfig {
    id: string;                    // UUID
    slug: string;                  // "anwesh" (folder name, URL-safe)
    name: string;                  // "My Portfolio" (display name)
    url: string;                   // "https://anwe.sh"
    apiEndpoint: string;           // "/api/ora" (path only)
    secret: string;                // ORA_SECRET (encrypted at rest)
    
    // Status
    status: 'connected' | 'offline' | 'error';
    lastConnectedAt: string | null;
    lastSyncAt: string | null;
    
    // Agents enabled for this site
    enabledAgents: string[];       // ['ora', 'writer', 'seo']
    
    // Settings
    autoSync: boolean;             // Auto-sync memories
    syncIntervalMinutes: number;   // How often to sync
    
    createdAt: string;
    updatedAt: string;
}
```

### 2. API Schema (Cached)

```typescript
// File: ~/.ora/sites/{slug}/schema.json

interface ApiSchema {
    name: string;                  // "anwe.sh ORA API"
    version: string;               // "1.0.0"
    
    actions: {
        [actionName: string]: {
            description: string;
            method: 'GET' | 'POST';
            params: {
                [paramName: string]: {
                    type: 'string' | 'number' | 'boolean' | 'object' | 'array';
                    required: boolean;
                    description?: string;
                    enum?: string[];
                    default?: any;
                }
            };
            returns?: object;
        }
    };
    
    // When schema was fetched
    fetchedAt: string;
}
```

### 3. Agent Definition

```typescript
interface AgentDefinition {
    id: string;
    slug: string;                  // "writer", "seo", "ora", "task-123"
    name: string;                  // "Content Writer"
    
    // Personality
    systemPrompt: string;
    
    // Capabilities
    tools: string[];               // MCP tools this agent can use
    canSpawnAgents: boolean;       // Can create sub-agents?
    
    // Memory settings
    memoryTypes: string[];         // What types of memories to store
    
    // Lifecycle
    type: 'persistent' | 'spawned';
    parentAgentId?: string;        // If spawned, who created it
    taskId?: string;               // If spawned for a task
    expiresAt?: string;            // Auto-delete time
    
    createdAt: string;
}
```

---

## Site Memory Database Schema

Each `{agent}.site.db` file contains:

```sql
-- Table: memories
CREATE TABLE memories (
    id TEXT PRIMARY KEY,
    content TEXT NOT NULL,
    type TEXT DEFAULT 'fact',      -- fact, preference, context, task, conversation
    importance INTEGER DEFAULT 5,   -- 1-10
    
    -- Health tracking
    access_count INTEGER DEFAULT 0,
    last_accessed_at TEXT,
    health_score REAL DEFAULT 1.0,
    
    -- Relationships
    related_to TEXT,               -- JSON array of related memory IDs
    superseded_by TEXT,            -- ID if this memory was replaced
    
    -- Timestamps
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    expires_at TEXT,               -- Optional hard expiry
    
    -- Sync tracking
    synced_at TEXT,
    sync_status TEXT DEFAULT 'pending'  -- pending, synced, local_only
);

-- Table: task_context (for spawned agents)
CREATE TABLE task_context (
    id TEXT PRIMARY KEY,
    task_description TEXT NOT NULL,
    input_data TEXT,               -- JSON
    output_data TEXT,              -- JSON
    status TEXT DEFAULT 'active',  -- active, completed, failed
    created_at TEXT NOT NULL,
    completed_at TEXT
);

-- Indexes
CREATE INDEX idx_type ON memories(type);
CREATE INDEX idx_health ON memories(health_score);
CREATE INDEX idx_importance ON memories(importance);
CREATE INDEX idx_sync ON memories(sync_status);
```

---

## Core Services

### 1. SiteManager

```typescript
// src/services/site-manager.ts

class SiteManager {
    private sitesPath: string;
    
    constructor() {
        this.sitesPath = path.join(os.homedir(), '.ora', 'sites');
    }
    
    /**
     * Add a new site connection
     */
    async addSite(config: {
        name: string;
        url: string;
        secret: string;
        enabledAgents?: string[];
    }): Promise<SiteConfig> {
        // 1. Generate slug from URL
        const slug = this.urlToSlug(config.url);
        const sitePath = path.join(this.sitesPath, slug);
        
        // 2. Create site folder
        await fs.mkdir(sitePath, { recursive: true });
        await fs.mkdir(path.join(sitePath, 'backups'), { recursive: true });
        
        // 3. Test connection & fetch schema
        const schema = await this.fetchSchema(config.url, config.secret);
        await fs.writeFile(
            path.join(sitePath, 'schema.json'),
            JSON.stringify(schema, null, 2)
        );
        
        // 4. Save config
        const siteConfig: SiteConfig = {
            id: crypto.randomUUID(),
            slug,
            name: config.name,
            url: config.url,
            apiEndpoint: '/api/ora',
            secret: await this.encryptSecret(config.secret),
            status: 'connected',
            lastConnectedAt: new Date().toISOString(),
            lastSyncAt: null,
            enabledAgents: config.enabledAgents || ['ora'],
            autoSync: true,
            syncIntervalMinutes: 15,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        
        await fs.writeFile(
            path.join(sitePath, 'config.json'),
            JSON.stringify(siteConfig, null, 2)
        );
        
        // 5. Create memory databases for enabled agents
        for (const agentSlug of siteConfig.enabledAgents) {
            await this.createAgentDatabase(slug, agentSlug);
        }
        
        // 6. Register dynamic tools from schema
        await toolRegistry.registerSiteTools(slug, schema);
        
        return siteConfig;
    }
    
    /**
     * Disconnect from a site
     */
    async disconnectSite(
        slug: string, 
        action: 'delete' | 'keep' | 'export'
    ): Promise<string | null> {
        const sitePath = path.join(this.sitesPath, slug);
        
        // Unregister tools first
        await toolRegistry.unregisterSiteTools(slug);
        
        switch (action) {
            case 'delete':
                // Permanently delete everything
                await fs.rm(sitePath, { recursive: true, force: true });
                return null;
                
            case 'keep':
                // Mark as offline but keep data
                const config = await this.getSiteConfig(slug);
                config.status = 'offline';
                config.updatedAt = new Date().toISOString();
                await fs.writeFile(
                    path.join(sitePath, 'config.json'),
                    JSON.stringify(config, null, 2)
                );
                return null;
                
            case 'export':
                // Create backup zip, then delete
                const backupPath = await this.exportSite(slug);
                await fs.rm(sitePath, { recursive: true, force: true });
                return backupPath;
        }
    }
    
    /**
     * Export site as zip backup
     */
    async exportSite(slug: string): Promise<string> {
        const sitePath = path.join(this.sitesPath, slug);
        const exportDir = path.join(os.homedir(), '.ora', 'exports');
        await fs.mkdir(exportDir, { recursive: true });
        
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const zipName = `${slug}-backup-${timestamp}.zip`;
        const zipPath = path.join(exportDir, zipName);
        
        await this.createZip(sitePath, zipPath);
        
        return zipPath;
    }
    
    /**
     * Fetch API schema from site
     */
    async fetchSchema(url: string, secret: string): Promise<ApiSchema> {
        const response = await fetch(`${url}/api/ora`, {
            headers: {
                'Authorization': `Bearer ${secret}`
            }
        });
        
        if (!response.ok) {
            throw new Error(`Failed to fetch schema: ${response.status}`);
        }
        
        return await response.json();
    }
    
    /**
     * Create agent memory database
     */
    async createAgentDatabase(siteSlug: string, agentSlug: string): Promise<void> {
        const dbPath = path.join(
            this.sitesPath, 
            siteSlug, 
            `${agentSlug}.site.db`
        );
        
        const db = new Database(dbPath);
        
        // Initialize schema
        db.exec(`
            CREATE TABLE IF NOT EXISTS memories (
                id TEXT PRIMARY KEY,
                content TEXT NOT NULL,
                type TEXT DEFAULT 'fact',
                importance INTEGER DEFAULT 5,
                access_count INTEGER DEFAULT 0,
                last_accessed_at TEXT,
                health_score REAL DEFAULT 1.0,
                related_to TEXT,
                superseded_by TEXT,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL,
                expires_at TEXT,
                synced_at TEXT,
                sync_status TEXT DEFAULT 'pending'
            );
            
            CREATE TABLE IF NOT EXISTS task_context (
                id TEXT PRIMARY KEY,
                task_description TEXT NOT NULL,
                input_data TEXT,
                output_data TEXT,
                status TEXT DEFAULT 'active',
                created_at TEXT NOT NULL,
                completed_at TEXT
            );
            
            CREATE INDEX IF NOT EXISTS idx_type ON memories(type);
            CREATE INDEX IF NOT EXISTS idx_health ON memories(health_score);
            CREATE INDEX IF NOT EXISTS idx_importance ON memories(importance);
            CREATE INDEX IF NOT EXISTS idx_sync ON memories(sync_status);
        `);
        
        db.close();
        console.log(`Created database: ${dbPath}`);
    }
    
    /**
     * List all connected sites
     */
    async listSites(): Promise<SiteConfig[]> {
        const sites: SiteConfig[] = [];
        
        try {
            const folders = await fs.readdir(this.sitesPath);
            for (const folder of folders) {
                const configPath = path.join(this.sitesPath, folder, 'config.json');
                try {
                    const config = JSON.parse(await fs.readFile(configPath, 'utf-8'));
                    sites.push(config);
                } catch {}
            }
        } catch {}
        
        return sites;
    }
    
    private urlToSlug(url: string): string {
        return new URL(url).hostname
            .replace(/^www\./, '')
            .replace(/\./g, '-')
            .replace(/[^a-z0-9-]/g, '');
    }
}
```

### 2. AgentSpawner

```typescript
// src/services/agent-spawner.ts

class AgentSpawner {
    /**
     * Spawn a temporary agent for a delegated task
     */
    async spawnAgent(options: {
        siteSlug: string;
        taskDescription: string;
        agentType: 'writer' | 'researcher' | 'analyst' | 'custom';
        parentAgentId?: string;
        tools?: string[];
        expiresInMinutes?: number;
    }): Promise<AgentDefinition> {
        const agentSlug = `task-${Date.now()}`;
        
        // Create agent definition
        const agent: AgentDefinition = {
            id: crypto.randomUUID(),
            slug: agentSlug,
            name: `Task Agent (${options.agentType})`,
            systemPrompt: this.getSystemPromptForType(options.agentType),
            tools: options.tools || this.getDefaultToolsForType(options.agentType),
            canSpawnAgents: false,
            memoryTypes: ['task', 'fact'],
            type: 'spawned',
            parentAgentId: options.parentAgentId,
            taskId: crypto.randomUUID(),
            expiresAt: options.expiresInMinutes 
                ? new Date(Date.now() + options.expiresInMinutes * 60 * 1000).toISOString()
                : undefined,
            createdAt: new Date().toISOString()
        };
        
        // Create isolated database for this agent
        await siteManager.createAgentDatabase(options.siteSlug, agentSlug);
        
        // Store task context
        const db = this.getAgentDb(options.siteSlug, agentSlug);
        db.run(`
            INSERT INTO task_context (id, task_description, status, created_at)
            VALUES (?, ?, 'active', ?)
        `, [agent.taskId, options.taskDescription, new Date().toISOString()]);
        
        return agent;
    }
    
    /**
     * Complete and cleanup a spawned agent
     */
    async completeAgent(
        siteSlug: string,
        agentSlug: string,
        options: {
            extractMemories?: boolean;
            extractTo?: string;      // Target agent, default: 'ora'
            deleteImmediately?: boolean;
        } = {}
    ): Promise<{ extracted: number }> {
        const { 
            extractMemories = true, 
            extractTo = 'ora',
            deleteImmediately = false 
        } = options;
        
        let extracted = 0;
        
        // Extract important memories to target agent
        if (extractMemories) {
            extracted = await this.extractMemories(siteSlug, agentSlug, extractTo);
        }
        
        // Handle database
        const sitePath = path.join(os.homedir(), '.ora', 'sites', siteSlug);
        const dbPath = path.join(sitePath, `${agentSlug}.site.db`);
        
        if (deleteImmediately) {
            // Delete immediately
            await fs.unlink(dbPath);
        } else {
            // Move to backups (7-day retention)
            const backupPath = path.join(sitePath, 'backups', `${agentSlug}.site.db.bak`);
            await fs.rename(dbPath, backupPath);
            
            // Schedule deletion
            await this.scheduleBackupDeletion(backupPath, 7);
        }
        
        return { extracted };
    }
    
    /**
     * Extract important memories from spawned agent to target
     */
    private async extractMemories(
        siteSlug: string,
        sourceAgent: string,
        targetAgent: string
    ): Promise<number> {
        const sourceDb = this.getAgentDb(siteSlug, sourceAgent);
        const targetDb = this.getAgentDb(siteSlug, targetAgent);
        
        // Get high-importance memories
        const important = sourceDb.all(`
            SELECT * FROM memories 
            WHERE importance >= 7 
            OR (type = 'fact' AND health_score >= 0.5)
            ORDER BY importance DESC
            LIMIT 50
        `);
        
        let copied = 0;
        for (const memory of important) {
            targetDb.run(`
                INSERT OR IGNORE INTO memories 
                (id, content, type, importance, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?)
            `, [
                `extracted-${memory.id}`,
                `[From ${sourceAgent}] ${memory.content}`,
                memory.type,
                memory.importance,
                memory.created_at,
                new Date().toISOString()
            ]);
            copied++;
        }
        
        return copied;
    }
}
```

### 3. Dynamic Tool Registry

```typescript
// src/services/tool-registry.ts

class ToolRegistry {
    private siteTools: Map<string, Tool[]> = new Map();
    
    /**
     * Register tools from a site's schema
     */
    async registerSiteTools(siteSlug: string, schema: ApiSchema): Promise<void> {
        const tools: Tool[] = [];
        
        // Convert each schema action to a tool
        for (const [actionName, actionDef] of Object.entries(schema.actions)) {
            tools.push({
                name: `${siteSlug}.${actionName}`,
                description: actionDef.description,
                parameters: this.schemaParamsToToolParams(actionDef.params),
                
                handler: async (params: any, context: any) => {
                    return await this.executeRemoteAction(siteSlug, actionName, params);
                }
            });
        }
        
        // Add site-specific memory tools
        tools.push(
            this.createSiteMemoryStoreTool(siteSlug),
            this.createSiteMemoryRecallTool(siteSlug),
            this.createSiteMemorySyncTool(siteSlug)
        );
        
        this.siteTools.set(siteSlug, tools);
        
        // Register with MCP
        await this.registerWithMCP(tools);
        
        console.log(`Registered ${tools.length} tools for site: ${siteSlug}`);
    }
    
    /**
     * Unregister all tools for a site
     */
    async unregisterSiteTools(siteSlug: string): Promise<void> {
        const tools = this.siteTools.get(siteSlug);
        if (tools) {
            await this.unregisterFromMCP(tools);
            this.siteTools.delete(siteSlug);
        }
    }
    
    /**
     * Execute a remote action on a site
     */
    private async executeRemoteAction(
        siteSlug: string, 
        action: string, 
        params: any
    ): Promise<any> {
        const config = await siteManager.getSiteConfig(siteSlug);
        const secret = await siteManager.decryptSecret(config.secret);
        
        const response = await fetch(`${config.url}${config.apiEndpoint}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${secret}`
            },
            body: JSON.stringify({ action, data: params })
        });
        
        if (!response.ok) {
            throw new Error(`Remote action failed: ${response.status}`);
        }
        
        return await response.json();
    }
    
    /**
     * Create site-specific memory.store tool
     */
    private createSiteMemoryStoreTool(siteSlug: string): Tool {
        return {
            name: `${siteSlug}.memory.store`,
            description: `Store a memory in ${siteSlug}'s database`,
            parameters: {
                content: { type: 'string', required: true },
                type: { type: 'string', enum: ['fact', 'preference', 'context', 'task'] },
                importance: { type: 'number', min: 1, max: 10, default: 5 }
            },
            handler: async (params, context) => {
                const db = this.getAgentDb(siteSlug, context.agentSlug || 'ora');
                const id = crypto.randomUUID();
                
                db.run(`
                    INSERT INTO memories (id, content, type, importance, created_at, updated_at)
                    VALUES (?, ?, ?, ?, ?, ?)
                `, [id, params.content, params.type, params.importance,
                    new Date().toISOString(), new Date().toISOString()]);
                
                return { stored: true, id };
            }
        };
    }
}
```

---

## Settings UI Design

### Sites Settings Page

**Location:** Settings → Site Connections

**Layout:**
```
┌─────────────────────────────────────────────────────────────────────────────┐
│  ← Settings                                                                  │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────────┐
│  │                                                                         │
│  │  SITE CONNECTIONS                                          [+ Add Site] │
│  │                                                                         │
│  │  Connect ORA to your websites to control them remotely.                 │
│  │                                                                         │
│  └─────────────────────────────────────────────────────────────────────────┘
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────────┐
│  │                                                                         │
│  │  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  │  🌐  anwe.sh                                    ● Connected      │   │
│  │  │      https://anwe.sh                                             │   │
│  │  │                                                                  │   │
│  │  │      Agents: ORA, Writer, SEO                                    │   │
│  │  │      Last sync: 5 minutes ago                                    │   │
│  │  │                                                                  │   │
│  │  │      [Sync Now]  [Settings]  [Disconnect]                        │   │
│  │  └─────────────────────────────────────────────────────────────────┘   │
│  │                                                                         │
│  │  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  │  🌐  lekhika.com                                ○ Offline        │   │
│  │  │      https://lekhika.com                                         │   │
│  │  │                                                                  │   │
│  │  │      Agents: ORA                                                 │   │
│  │  │      Last sync: 3 days ago                                       │   │
│  │  │                                                                  │   │
│  │  │      [Reconnect]  [Settings]  [Disconnect]                       │   │
│  │  └─────────────────────────────────────────────────────────────────┘   │
│  │                                                                         │
│  └─────────────────────────────────────────────────────────────────────────┘
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Add Site Modal

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│  ADD SITE CONNECTION                                    [×]     │
│  ─────────────────────────────────────────────────────────────  │
│                                                                 │
│  Connect a new website to ORA                                   │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  Site Name                                                 │  │
│  │  ┌─────────────────────────────────────────────────────┐  │  │
│  │  │ My Portfolio                                        │  │  │
│  │  └─────────────────────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  Site URL                                                  │  │
│  │  ┌─────────────────────────────────────────────────────┐  │  │
│  │  │ https://anwe.sh                                     │  │  │
│  │  └─────────────────────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  ORA Secret                                                │  │
│  │  ┌─────────────────────────────────────────────────────┐  │  │
│  │  │ ••••••••••••••••••••••                              │  │  │
│  │  └─────────────────────────────────────────────────────┘  │  │
│  │  ℹ️  Get this from your site's admin panel               │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  Enable Agents                                             │  │
│  │                                                            │  │
│  │  ☑ ORA (required)                                          │  │
│  │  ☐ Writer - Content creation agent                         │  │
│  │  ☐ SEO - Search optimization agent                         │  │
│  │  ☐ Analyst - Data analysis agent                           │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                                                            │  │
│  │  [Test Connection]                                         │  │
│  │                                                            │  │
│  │  ✅ Connected! Found 12 actions.                           │  │
│  │     • posts.list, posts.publish, posts.create              │  │
│  │     • leads.get, leads.list                                │  │
│  │     • settings.get, settings.update                        │  │
│  │     ...and 5 more                                          │  │
│  │                                                            │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ─────────────────────────────────────────────────────────────  │
│                                                                 │
│              [Cancel]                    [Add Site]             │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Site Settings Modal

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│  SITE SETTINGS: anwe.sh                                 [×]     │
│  ─────────────────────────────────────────────────────────────  │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────────┐
│  │  Connection   │  Agents   │  Memory   │  Sync               │
│  └─────────────────────────────────────────────────────────────┘
│                                                                 │
│  CONNECTION TAB:                                                │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  Status: ● Connected                                       │  │
│  │  URL: https://anwe.sh                                      │  │
│  │  Last connected: Feb 5, 2026 8:30 AM                       │  │
│  │                                                            │  │
│  │  [Update Secret]  [Refresh Schema]                         │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                 │
│  AGENTS TAB:                                                    │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  ☑ ORA           123 memories    [View DB]                 │  │
│  │  ☑ Writer         45 memories    [View DB]                 │  │
│  │  ☐ SEO            0 memories     [Enable]                  │  │
│  │  ☐ Analyst        0 memories     [Enable]                  │  │
│  │                                                            │  │
│  │  Spawned Agents (temporary):                               │  │
│  │  • task-1707123456 - "Write blog post about TypeScript"   │  │
│  │    Status: Active | [View] [Complete]                      │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                 │
│  MEMORY TAB:                                                    │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  Total memories: 168                                       │  │
│  │  Storage used: 2.4 MB                                      │  │
│  │                                                            │  │
│  │  [Export All]  [Clear All]                                 │  │
│  │                                                            │  │
│  │  Backups (deleted agent DBs):                              │  │
│  │  • task-42.site.db.bak (expires in 5 days) [Restore][Del]  │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                 │
│  SYNC TAB:                                                      │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  ☑ Auto-sync memories                                      │  │
│  │  Sync interval: [15] minutes                               │  │
│  │                                                            │  │
│  │  Last sync: Feb 5, 2026 8:25 AM                            │  │
│  │  Pending uploads: 3                                        │  │
│  │  Pending downloads: 0                                       │  │
│  │                                                            │  │
│  │  [Sync Now]                                                │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Disconnect Modal

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│  ⚠️  DISCONNECT FROM anwe.sh?                            [×]    │
│  ─────────────────────────────────────────────────────────────  │
│                                                                 │
│  You are about to disconnect ORA from anwe.sh.                  │
│  What should happen to the stored memories?                     │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                                                            │  │
│  │  ○ Delete everything                                       │  │
│  │    Permanently remove all memories and data                │  │
│  │    ⚠️  This cannot be undone                               │  │
│  │                                                            │  │
│  │  ○ Keep locally (offline mode)                             │  │
│  │    Data stays on your machine but no longer syncs          │  │
│  │    You can reconnect later                                 │  │
│  │                                                            │  │
│  │  ○ Export & Delete                                         │  │
│  │    Download a backup zip file, then delete                 │  │
│  │    Recommended for archival                                │  │
│  │                                                            │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ─────────────────────────────────────────────────────────────  │
│                                                                 │
│              [Cancel]                    [Disconnect]           │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## File Structure for ORA Desktop

```
ora-desktop/
├── src/
│   ├── services/
│   │   ├── site-manager.ts          # Site connection management
│   │   ├── agent-spawner.ts         # Dynamic agent spawning
│   │   ├── tool-registry.ts         # Dynamic tool registration
│   │   ├── memory-sync.ts           # Memory sync engine
│   │   └── backup-cleaner.ts        # 7-day backup cleanup
│   │
│   ├── tools/
│   │   ├── site-memory-tools.ts     # memory.store, memory.recall for sites
│   │   └── site-action-tools.ts     # Dynamically registered from schema
│   │
│   ├── types/
│   │   ├── site.ts                  # SiteConfig, ApiSchema
│   │   ├── agent.ts                 # AgentDefinition
│   │   └── memory.ts                # Memory interfaces
│   │
│   ├── pages/
│   │   └── settings/
│   │       └── sites/
│   │           ├── index.tsx        # Sites list page
│   │           ├── AddSiteModal.tsx # Add site modal
│   │           ├── SiteSettings.tsx # Site settings modal
│   │           └── DisconnectModal.tsx
│   │
│   └── components/
│       └── sites/
│           ├── SiteCard.tsx         # Site card in list
│           ├── AgentList.tsx        # Agent management
│           └── MemoryStats.tsx      # Memory usage stats
│
└── data/
    └── .ora/
        ├── memory.db                # LOCAL ORA memory (EXISTING)
        └── sites/                   # NEW: Remote site data
            └── {site-slug}/
                ├── config.json
                ├── schema.json
                ├── ora.site.db
                └── backups/
```

---

## Implementation Checklist

### Phase 1: Core Services (2-3 days)
- [ ] Implement `SiteManager` class
- [ ] Implement `AgentSpawner` class
- [ ] Implement `ToolRegistry` with dynamic registration
- [ ] Add SQLite database creation for `.site.db` files
- [ ] Implement secret encryption at rest

### Phase 2: Settings UI (2-3 days)
- [ ] Create Sites Settings page (list view)
- [ ] Create Add Site Modal with connection test
- [ ] Create Site Settings Modal (4 tabs)
- [ ] Create Disconnect Modal with 3 options
- [ ] Add site cards with status indicators

### Phase 3: Memory Tools (1-2 days)
- [ ] Create `{site}.memory.store` tool
- [ ] Create `{site}.memory.recall` tool
- [ ] Create `{site}.memory.sync` tool
- [ ] Wire up tools to correct `.site.db` files

### Phase 4: Agent Spawning (1-2 days)
- [ ] Implement spawn command for ORA
- [ ] Implement complete/cleanup flow
- [ ] Add memory extraction on agent completion
- [ ] Implement 7-day backup retention

### Phase 5: Sync Engine (2 days)
- [ ] Implement bidirectional sync
- [ ] Add conflict resolution
- [ ] Create sync status tracking
- [ ] Add auto-sync scheduler

---

## Summary

| What | Where | Format |
|------|-------|--------|
| Site folder | `~/.ora/sites/{slug}/` | Directory |
| Site config | `~/.ora/sites/{slug}/config.json` | JSON |
| API schema | `~/.ora/sites/{slug}/schema.json` | JSON |
| Agent memory | `~/.ora/sites/{slug}/{agent}.site.db` | SQLite |
| Backups | `~/.ora/sites/{slug}/backups/` | Directory |
| Exports | `~/.ora/exports/` | ZIP files |

---

**This is the complete handover document for ORA Desktop development.**

