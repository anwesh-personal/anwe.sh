# User Flows

Step-by-step flows for all site connection operations.

---

## Flow 1: Add Site Connection

User wants to connect ORA to anwe.sh.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  STEP 1: Open Settings                                                       │
│                                                                             │
│  User clicks: Settings → Site Connections → [+ Add Site]                    │
│                                                                             │
│  Result: Add Site Modal opens                                               │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  STEP 2: Enter Details                                                       │
│                                                                             │
│  User enters:                                                               │
│  - Name: "My Portfolio"                                                     │
│  - URL: "https://anwe.sh"                                                   │
│  - Secret: "ora_abc123..."                                                  │
│  - Agents: ☑ ORA, ☑ Writer, ☐ SEO                                          │
│                                                                             │
│  User clicks: [Test Connection]                                             │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  STEP 3: Test Connection                                                     │
│                                                                             │
│  System does:                                                               │
│  1. GET https://anwe.sh/api/ora with Bearer token                           │
│  2. Parse response for schema                                               │
│  3. Count available actions                                                 │
│                                                                             │
│  Success: Show "✅ Connected! Found 12 actions"                              │
│  Error: Show "❌ Connection failed: Invalid secret"                          │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  STEP 4: Add Site                                                            │
│                                                                             │
│  User clicks: [Add Site]                                                    │
│                                                                             │
│  System does:                                                               │
│  1. Generate slug: "anwe-sh"                                                │
│  2. Create folder: ~/.ora/sites/anwe-sh/                                    │
│  3. Create backups folder: ~/.ora/sites/anwe-sh/backups/                    │
│  4. Save config.json (with encrypted secret)                                │
│  5. Save schema.json (cached API schema)                                    │
│  6. Create ora.site.db (empty memory database)                              │
│  7. Create writer.site.db (for Writer agent)                                │
│  8. Register tools with MCP                                                 │
│                                                                             │
│  Result: Modal closes, site appears in list as "● Connected"                │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Flow 2: Execute Remote Action

User asks ORA to publish a blog post.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  STEP 1: User Message                                                        │
│                                                                             │
│  User: "Publish the TypeScript best practices post on anwe.sh"              │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  STEP 2: LLM Processes                                                       │
│                                                                             │
│  LLM sees available tools:                                                  │
│  - anwe-sh.posts.list                                                       │
│  - anwe-sh.posts.publish  ◀── Picks this one                                │
│  - anwe-sh.memory.store                                                     │
│                                                                             │
│  LLM decides to call: anwe-sh.posts.publish({ id: "post-uuid" })            │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  STEP 3: Tool Execution                                                      │
│                                                                             │
│  ToolRegistry.executeTool("anwe-sh.posts.publish", { id: "..." })           │
│                                                                             │
│  1. Look up site config for "anwe-sh"                                       │
│  2. Decrypt secret                                                          │
│  3. POST https://anwe.sh/api/ora                                            │
│     Body: { action: "posts.publish", data: { id: "..." } }                  │
│     Headers: Authorization: Bearer {secret}                                 │
│  4. Get response: { success: true, data: { ... } }                          │
│  5. Return to LLM                                                           │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  STEP 4: Response to User                                                    │
│                                                                             │
│  LLM: "Done! I've published 'TypeScript Best Practices'. It's now live     │
│        at https://anwe.sh/blog/typescript-best-practices"                   │
│                                                                             │
│  Optionally: Store memory about this action                                 │
│  anwe-sh.memory.store({ content: "Published TS post on Feb 5", type: "task" })│
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Flow 3: Spawn Agent for Task

ORA delegates a complex task to a spawned agent.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  STEP 1: Complex Request                                                     │
│                                                                             │
│  User: "Write 5 blog posts about TypeScript for anwe.sh"                    │
│                                                                             │
│  ORA decides: This is too big, I'll delegate to a writer agent              │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  STEP 2: Spawn Agent                                                         │
│                                                                             │
│  ORA calls: ora.agent.spawn({                                               │
│      siteSlug: "anwe-sh",                                                   │
│      taskDescription: "Write 5 blog posts about TypeScript",                │
│      agentType: "writer"                                                    │
│  })                                                                         │
│                                                                             │
│  System does:                                                               │
│  1. Create agent definition (slug: task-1707123456)                         │
│  2. Create database: ~/.ora/sites/anwe-sh/task-1707123456.site.db           │
│  3. Initialize schema in database                                           │
│  4. Store task context in task_context table                                │
│  5. Return agent info to ORA                                                │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  STEP 3: Agent Works                                                         │
│                                                                             │
│  Spawned agent (task-1707123456):                                           │
│  - Has its own isolated memory database                                     │
│  - Can call anwe-sh.posts.create                                            │
│  - Stores progress in its own memories                                      │
│  - Cannot affect ORA's memories                                             │
│                                                                             │
│  Agent creates posts:                                                       │
│  1. "TypeScript Basics" ✓                                                   │
│  2. "Advanced Types" ✓                                                      │
│  3. "Error Handling" ✓                                                      │
│  4. "Testing Patterns" ✓                                                    │
│  5. "Performance Tips" ✓                                                    │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  STEP 4: Complete Agent                                                      │
│                                                                             │
│  ORA calls: ora.agent.complete({                                            │
│      siteSlug: "anwe-sh",                                                   │
│      agentSlug: "task-1707123456",                                          │
│      extractMemories: true                                                  │
│  })                                                                         │
│                                                                             │
│  System does:                                                               │
│  1. Query spawn agent's DB for important memories (importance >= 7)         │
│  2. Copy those memories to ORA's ora.site.db                                │
│  3. Move task-1707123456.site.db to backups/                               │
│  4. Schedule deletion in 7 days                                             │
│                                                                             │
│  Result: { extracted: 8 } (8 memories copied to ORA)                        │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  STEP 5: Report to User                                                      │
│                                                                             │
│  ORA: "Done! I've created 5 blog posts about TypeScript:                    │
│        1. TypeScript Basics                                                 │
│        2. Advanced Types                                                    │
│        3. Error Handling                                                    │
│        4. Testing Patterns                                                  │
│        5. Performance Tips                                                  │
│                                                                             │
│        All posts are saved as drafts. Would you like me to publish them?"   │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Flow 4: Disconnect Site

User disconnects from anwe.sh.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  STEP 1: Initiate Disconnect                                                 │
│                                                                             │
│  User clicks: [Disconnect] on anwe.sh card                                  │
│                                                                             │
│  Result: Disconnect Modal opens                                             │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  STEP 2: Choose Action                                                       │
│                                                                             │
│  User sees 3 options:                                                       │
│                                                                             │
│  ○ Delete everything                                                        │
│  ○ Keep locally (offline)                                                   │
│  ● Export & Delete  ◀── User picks this                                     │
│                                                                             │
│  User clicks: [Disconnect]                                                  │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  STEP 3: Export                                                              │
│                                                                             │
│  System does:                                                               │
│  1. Create zip file: anwe-sh-backup-2026-02-05T08-30-00.zip                 │
│  2. Include: config.json, schema.json, all *.site.db, backups/*             │
│  3. Save to: ~/.ora/exports/                                                │
│  4. Show download dialog to user                                            │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  STEP 4: Cleanup                                                             │
│                                                                             │
│  System does:                                                               │
│  1. Unregister all tools: anwe-sh.*                                         │
│  2. Delete folder: ~/.ora/sites/anwe-sh/                                    │
│                                                                             │
│  Result: Site removed from list, tools no longer available                  │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Flow 5: Memory Sync

Auto-sync memories between ORA Desktop and remote site.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  TRIGGER: Timer (every 15 minutes) or Manual "Sync Now"                      │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  STEP 1: Get Pending Uploads                                                 │
│                                                                             │
│  Query local ora.site.db:                                                   │
│  SELECT * FROM memories WHERE sync_status = 'pending'                       │
│                                                                             │
│  Result: 3 memories need to be pushed                                       │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  STEP 2: Push to Remote                                                      │
│                                                                             │
│  For each pending memory:                                                   │
│  POST https://anwe.sh/api/ora                                               │
│  {                                                                          │
│      action: "memory.sync",                                                 │
│      data: { memories: [...] }                                              │
│  }                                                                          │
│                                                                             │
│  On success: UPDATE memories SET sync_status = 'synced', synced_at = NOW() │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  STEP 3: Pull from Remote                                                    │
│                                                                             │
│  POST https://anwe.sh/api/ora                                               │
│  {                                                                          │
│      action: "memory.fetch",                                                │
│      data: { since: "2026-02-05T08:00:00Z" }                                │
│  }                                                                          │
│                                                                             │
│  Result: 0 new memories from remote                                         │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  STEP 4: Update Status                                                       │
│                                                                             │
│  Update config.json: lastSyncAt = NOW()                                     │
│                                                                             │
│  UI shows: "Last sync: just now"                                            │
│                                                                             │
│  Result: { uploaded: 3, downloaded: 0, conflicts: 0 }                       │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Flow 6: Refresh Schema

Site added new actions, need to update.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  STEP 1: User Action                                                         │
│                                                                             │
│  User: Site Settings → Connection Tab → [Refresh Schema]                    │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  STEP 2: Fetch New Schema                                                    │
│                                                                             │
│  GET https://anwe.sh/api/ora                                                │
│                                                                             │
│  Old schema: 12 actions                                                     │
│  New schema: 15 actions (+analytics.get, +comments.list, +comments.delete)  │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  STEP 3: Update Tools                                                        │
│                                                                             │
│  1. Unregister old tools                                                    │
│  2. Save new schema.json                                                    │
│  3. Register new tools                                                      │
│                                                                             │
│  UI shows: "Schema updated! 3 new actions available."                       │
└─────────────────────────────────────────────────────────────────────────────┘
```
