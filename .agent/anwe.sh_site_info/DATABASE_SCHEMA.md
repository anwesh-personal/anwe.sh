# Database Schema

SQLite schema for `.site.db` files (agent memories per site).

---

## File Location

```
~/.ora/sites/{slug}/{agent}.site.db
```

Examples:
- `~/.ora/sites/anwe-sh/ora.site.db`
- `~/.ora/sites/anwe-sh/writer.site.db`
- `~/.ora/sites/anwe-sh/task-123.site.db`

---

## Tables

### memories

Stores all memories for this agent on this site.

```sql
CREATE TABLE memories (
    id TEXT PRIMARY KEY,
    content TEXT NOT NULL,
    type TEXT DEFAULT 'fact',
    importance INTEGER DEFAULT 5,
    
    -- Health tracking
    access_count INTEGER DEFAULT 0,
    last_accessed_at TEXT,
    health_score REAL DEFAULT 1.0,
    
    -- Relationships
    related_to TEXT,               -- JSON array of memory IDs
    superseded_by TEXT,            -- ID of newer memory
    
    -- Timestamps
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    expires_at TEXT,
    
    -- Sync tracking
    synced_at TEXT,
    sync_status TEXT DEFAULT 'pending'
);

-- Indexes for common queries
CREATE INDEX idx_memories_type ON memories(type);
CREATE INDEX idx_memories_health ON memories(health_score);
CREATE INDEX idx_memories_importance ON memories(importance);
CREATE INDEX idx_memories_sync ON memories(sync_status);
CREATE INDEX idx_memories_expires ON memories(expires_at);
```

### task_context

For spawned agents only - stores the task details.

```sql
CREATE TABLE task_context (
    id TEXT PRIMARY KEY,
    task_description TEXT NOT NULL,
    input_data TEXT,               -- JSON
    output_data TEXT,              -- JSON
    status TEXT DEFAULT 'active',
    created_at TEXT NOT NULL,
    completed_at TEXT
);
```

---

## Column Details

### memories.type

| Value | Description |
|-------|-------------|
| `fact` | Factual info about the site |
| `preference` | User/site preferences |
| `context` | Background context |
| `task` | Task-related notes |
| `conversation` | Conversation summaries |

### memories.importance

Scale 1-10:
- 1-3: Low importance, can be forgotten
- 4-6: Medium importance
- 7-9: High importance, should persist
- 10: Critical, never forget

### memories.health_score

0.0 to 1.0:
- Starts at 1.0
- Decays over time if not accessed
- Increases on access
- Low health = candidate for cleanup

### memories.sync_status

| Value | Description |
|-------|-------------|
| `pending` | Not yet synced to remote |
| `synced` | Synced with remote site |
| `local_only` | Will never sync |

---

## Full Initialization SQL

```sql
-- Run this when creating a new .site.db file

PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS memories (
    id TEXT PRIMARY KEY,
    content TEXT NOT NULL,
    type TEXT DEFAULT 'fact' CHECK(type IN ('fact','preference','context','task','conversation')),
    importance INTEGER DEFAULT 5 CHECK(importance >= 1 AND importance <= 10),
    access_count INTEGER DEFAULT 0,
    last_accessed_at TEXT,
    health_score REAL DEFAULT 1.0 CHECK(health_score >= 0 AND health_score <= 1),
    related_to TEXT,
    superseded_by TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    expires_at TEXT,
    synced_at TEXT,
    sync_status TEXT DEFAULT 'pending' CHECK(sync_status IN ('pending','synced','local_only'))
);

CREATE TABLE IF NOT EXISTS task_context (
    id TEXT PRIMARY KEY,
    task_description TEXT NOT NULL,
    input_data TEXT,
    output_data TEXT,
    status TEXT DEFAULT 'active' CHECK(status IN ('active','completed','failed')),
    created_at TEXT NOT NULL,
    completed_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_memories_type ON memories(type);
CREATE INDEX IF NOT EXISTS idx_memories_health ON memories(health_score);
CREATE INDEX IF NOT EXISTS idx_memories_importance ON memories(importance);
CREATE INDEX IF NOT EXISTS idx_memories_sync ON memories(sync_status);
CREATE INDEX IF NOT EXISTS idx_memories_expires ON memories(expires_at);
```

---

## Common Queries

### Store a memory

```sql
INSERT INTO memories (id, content, type, importance, created_at, updated_at)
VALUES (?, ?, ?, ?, datetime('now'), datetime('now'));
```

### Recall memories by type

```sql
SELECT * FROM memories 
WHERE type = ? 
AND health_score > 0.3
ORDER BY importance DESC, created_at DESC
LIMIT 20;
```

### Update access stats

```sql
UPDATE memories 
SET access_count = access_count + 1,
    last_accessed_at = datetime('now'),
    health_score = MIN(1.0, health_score + 0.1)
WHERE id = ?;
```

### Get important memories for extraction

```sql
SELECT * FROM memories 
WHERE importance >= 7 
   OR (type = 'fact' AND health_score >= 0.5)
ORDER BY importance DESC
LIMIT 50;
```

### Cleanup expired memories

```sql
DELETE FROM memories 
WHERE expires_at IS NOT NULL 
AND expires_at < datetime('now');
```

### Decay health scores (daily job)

```sql
UPDATE memories 
SET health_score = MAX(0, health_score - 0.01)
WHERE last_accessed_at < datetime('now', '-7 days');
```
