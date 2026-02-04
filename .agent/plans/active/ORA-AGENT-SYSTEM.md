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
| `src/app/api/ora/route.ts` | Modify | Add new actions |
| `src/app/api/agent/route.ts` | Create | Internal agent API |
| `src/lib/agent/memory.ts` | Create | Memory operations |
| `src/lib/agent/sync.ts` | Create | Sync engine |
| `src/lib/agent/tasks.ts` | Create | Task management |
| `src/lib/agent/runtime.ts` | Create | Agent execution |
| `src/lib/agent/webhooks.ts` | Create | Webhook delivery |
| `src/lib/api-keys.ts` | Create | API key management |
| `src/app/(admin)/admin/agents/page.tsx` | Modify | Enhanced UI |
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
