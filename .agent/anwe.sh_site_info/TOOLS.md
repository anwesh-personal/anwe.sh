# MCP Tools

All MCP tools for site connections and memory management.

---

## Tool Naming Convention

```
{site-slug}.{category}.{action}
```

Examples:
- `anwe-sh.posts.publish`
- `anwe-sh.memory.store`
- `lekhika-com.users.invite`

---

## Site Action Tools (Dynamic)

These are generated from the site's API schema.

### Example: anwe-sh.posts.list

```typescript
{
    name: "anwe-sh.posts.list",
    description: "List all blog posts on anwe.sh",
    parameters: {
        status: {
            type: "string",
            required: false,
            enum: ["draft", "published", "archived"],
            description: "Filter by post status"
        },
        limit: {
            type: "number",
            required: false,
            default: 10,
            description: "Max posts to return"
        }
    }
}
```

### Example: anwe-sh.posts.publish

```typescript
{
    name: "anwe-sh.posts.publish",
    description: "Publish a draft post on anwe.sh",
    parameters: {
        id: {
            type: "string",
            required: true,
            description: "UUID of the post to publish"
        }
    }
}
```

---

## Memory Tools (Per Site)

Created automatically when site is connected.

### {site}.memory.store

Store a memory about this site.

```typescript
{
    name: "anwe-sh.memory.store",
    description: "Store a memory about anwe.sh",
    parameters: {
        content: {
            type: "string",
            required: true,
            description: "The memory content to store"
        },
        type: {
            type: "string",
            required: false,
            enum: ["fact", "preference", "context", "task"],
            default: "fact",
            description: "Category of memory"
        },
        importance: {
            type: "number",
            required: false,
            min: 1,
            max: 10,
            default: 5,
            description: "How important (1-10)"
        }
    }
}
```

**Implementation:**

```typescript
handler: async (params, context) => {
    const db = siteManager.openAgentDb(siteSlug, context.agentSlug || 'ora');
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    
    db.prepare(`
        INSERT INTO memories (id, content, type, importance, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?)
    `).run(id, params.content, params.type || 'fact', params.importance || 5, now, now);
    
    db.close();
    return { stored: true, id };
}
```

---

### {site}.memory.recall

Recall memories about this site.

```typescript
{
    name: "anwe-sh.memory.recall",
    description: "Recall memories about anwe.sh",
    parameters: {
        query: {
            type: "string",
            required: false,
            description: "Search term (optional)"
        },
        type: {
            type: "string",
            required: false,
            enum: ["fact", "preference", "context", "task"],
            description: "Filter by type"
        },
        limit: {
            type: "number",
            required: false,
            default: 10,
            description: "Max memories to return"
        }
    }
}
```

**Implementation:**

```typescript
handler: async (params, context) => {
    const db = siteManager.openAgentDb(siteSlug, context.agentSlug || 'ora');
    
    let sql = 'SELECT * FROM memories WHERE health_score > 0.3';
    const sqlParams: any[] = [];
    
    if (params.type) {
        sql += ' AND type = ?';
        sqlParams.push(params.type);
    }
    
    if (params.query) {
        sql += ' AND content LIKE ?';
        sqlParams.push(`%${params.query}%`);
    }
    
    sql += ' ORDER BY importance DESC, created_at DESC LIMIT ?';
    sqlParams.push(params.limit || 10);
    
    const memories = db.prepare(sql).all(...sqlParams);
    
    // Update access stats
    for (const mem of memories) {
        db.prepare(`
            UPDATE memories SET
                access_count = access_count + 1,
                last_accessed_at = ?,
                health_score = MIN(1.0, health_score + 0.05)
            WHERE id = ?
        `).run(new Date().toISOString(), mem.id);
    }
    
    db.close();
    return memories;
}
```

---

### {site}.memory.forget

Remove a specific memory.

```typescript
{
    name: "anwe-sh.memory.forget",
    description: "Forget a memory about anwe.sh",
    parameters: {
        id: {
            type: "string",
            required: true,
            description: "ID of memory to forget"
        }
    }
}
```

**Implementation:**

```typescript
handler: async (params, context) => {
    const db = siteManager.openAgentDb(siteSlug, context.agentSlug || 'ora');
    
    const result = db.prepare('DELETE FROM memories WHERE id = ?').run(params.id);
    
    db.close();
    return { deleted: result.changes > 0 };
}
```

---

### {site}.memory.update

Update an existing memory.

```typescript
{
    name: "anwe-sh.memory.update",
    description: "Update a memory about anwe.sh",
    parameters: {
        id: {
            type: "string",
            required: true,
            description: "ID of memory to update"
        },
        content: {
            type: "string",
            required: false,
            description: "New content"
        },
        importance: {
            type: "number",
            required: false,
            description: "New importance (1-10)"
        },
        supersedes: {
            type: "string",
            required: false,
            description: "ID of memory this replaces"
        }
    }
}
```

---

## Agent Management Tools

### ora.agent.spawn

Spawn a temporary agent for a task.

```typescript
{
    name: "ora.agent.spawn",
    description: "Spawn a temporary agent for a delegated task",
    parameters: {
        siteSlug: {
            type: "string",
            required: true,
            description: "Site to work on"
        },
        taskDescription: {
            type: "string",
            required: true,
            description: "What the agent should do"
        },
        agentType: {
            type: "string",
            required: true,
            enum: ["writer", "researcher", "analyst", "custom"],
            description: "Type of agent"
        },
        expiresInMinutes: {
            type: "number",
            required: false,
            description: "Auto-delete after N minutes"
        }
    }
}
```

### ora.agent.complete

Complete a spawned agent's task.

```typescript
{
    name: "ora.agent.complete",
    description: "Complete a spawned agent and cleanup",
    parameters: {
        siteSlug: {
            type: "string",
            required: true
        },
        agentSlug: {
            type: "string",
            required: true,
            description: "e.g., task-1707123456"
        },
        extractMemories: {
            type: "boolean",
            required: false,
            default: true,
            description: "Copy important memories to ORA"
        },
        deleteImmediately: {
            type: "boolean",
            required: false,
            default: false,
            description: "Skip 7-day backup"
        }
    }
}
```

---

## Site Management Tools

### ora.site.list

List all connected sites.

```typescript
{
    name: "ora.site.list",
    description: "List all connected sites",
    parameters: {}
}
```

### ora.site.status

Get status of a specific site.

```typescript
{
    name: "ora.site.status",
    description: "Get status of a connected site",
    parameters: {
        slug: {
            type: "string",
            required: true
        }
    }
}
```

### ora.site.sync

Trigger memory sync for a site.

```typescript
{
    name: "ora.site.sync",
    description: "Sync memories with remote site",
    parameters: {
        slug: {
            type: "string",
            required: true
        }
    }
}
```

---

## Tool Registration Flow

```typescript
// When site connects
async function onSiteConnected(siteSlug: string, schema: ApiSchema) {
    // 1. Register action tools from schema
    for (const [action, def] of Object.entries(schema.actions)) {
        registerTool({
            name: `${siteSlug}.${action}`,
            description: def.description,
            parameters: def.params,
            handler: createRemoteActionHandler(siteSlug, action)
        });
    }
    
    // 2. Register memory tools
    registerTool(createMemoryStoreTool(siteSlug));
    registerTool(createMemoryRecallTool(siteSlug));
    registerTool(createMemoryForgetTool(siteSlug));
    registerTool(createMemoryUpdateTool(siteSlug));
}

// When site disconnects
async function onSiteDisconnected(siteSlug: string) {
    // Remove all tools for this site
    unregisterToolsMatching(`${siteSlug}.*`);
}
```

---

## LLM Tool Format

Tools are exposed to the LLM in this format:

```json
{
    "tools": [
        {
            "name": "anwe-sh.posts.publish",
            "description": "Publish a draft post on anwe.sh",
            "input_schema": {
                "type": "object",
                "properties": {
                    "id": {
                        "type": "string",
                        "description": "UUID of the post to publish"
                    }
                },
                "required": ["id"]
            }
        },
        {
            "name": "anwe-sh.memory.store",
            "description": "Store a memory about anwe.sh",
            "input_schema": {
                "type": "object",
                "properties": {
                    "content": { "type": "string" },
                    "type": { "type": "string", "enum": ["fact", "preference", "context", "task"] },
                    "importance": { "type": "integer", "minimum": 1, "maximum": 10 }
                },
                "required": ["content"]
            }
        }
    ]
}
```
