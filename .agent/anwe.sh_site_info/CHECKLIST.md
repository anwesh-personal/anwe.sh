# Implementation Checklist

Track progress on implementing site connections in ORA Desktop.

---

## Phase 1: Core Infrastructure

### SiteManager Service
- [ ] Create `src/services/site-manager.ts`
- [ ] Implement `urlToSlug()` function
- [ ] Implement `encryptSecret()` / `decryptSecret()`
- [ ] Implement `fetchSchema()` - GET /api/ora
- [ ] Implement `createAgentDatabase()` - create .site.db with schema
- [ ] Implement `addSite()` - full flow
- [ ] Implement `getSiteConfig()` / `updateSiteConfig()`
- [ ] Implement `listSites()`
- [ ] Implement `exportSite()` - create zip
- [ ] Implement `disconnectSite()` - 3 modes

### File System
- [ ] Create `~/.ora/sites/` directory on startup if missing
- [ ] Create per-site folder structure
- [ ] Handle permissions errors gracefully

### Database
- [ ] SQLite schema for memories table
- [ ] SQLite schema for task_context table
- [ ] Indexes for common queries
- [ ] WAL mode for concurrent access

---

## Phase 2: Tool System

### ToolRegistry Service
- [ ] Create `src/services/tool-registry.ts`
- [ ] Implement `registerSiteTools()` - from schema
- [ ] Implement `unregisterSiteTools()`
- [ ] Implement `executeRemoteAction()` - POST to site
- [ ] Create memory.store tool
- [ ] Create memory.recall tool
- [ ] Create memory.forget tool
- [ ] Create memory.update tool
- [ ] Expose tools to MCP

### Integration
- [ ] Call `registerSiteTools()` on site connect
- [ ] Call `unregisterSiteTools()` on site disconnect
- [ ] Handle tool execution errors

---

## Phase 3: Agent Spawning

### AgentSpawner Service
- [ ] Create `src/services/agent-spawner.ts`
- [ ] Implement `spawnAgent()`
- [ ] Implement `completeAgent()`
- [ ] Implement `extractMemories()` - copy to parent
- [ ] Implement backup file management
- [ ] Implement 7-day retention cleanup

### Tools
- [ ] Create `ora.agent.spawn` tool
- [ ] Create `ora.agent.complete` tool
- [ ] Create `ora.agent.list` tool (for UI)

---

## Phase 4: Settings UI

### Sites List Page
- [ ] Create `src/pages/settings/sites.tsx`
- [ ] Site card component
- [ ] Status indicators (connected/offline/error)
- [ ] Action buttons (sync/settings/disconnect)
- [ ] Empty state

### Add Site Modal
- [ ] Modal structure
- [ ] Form fields (name, URL, secret)
- [ ] Test connection button
- [ ] Agent checkboxes
- [ ] Validation
- [ ] Error handling
- [ ] Success flow

### Site Settings Modal
- [ ] Tab navigation
- [ ] Connection tab (status, update secret, refresh schema)
- [ ] Agents tab (enable/disable, spawned agents list)
- [ ] Memory tab (storage stats, export, clear)
- [ ] Sync tab (auto-sync toggle, interval, history)

### Disconnect Modal
- [ ] 3 options (delete/keep/export)
- [ ] Confirmation button
- [ ] Export download flow

---

## Phase 5: Sync System

### SyncService
- [ ] Create `src/services/sync-service.ts`
- [ ] Implement `syncSite()` - full sync flow
- [ ] Push pending memories to remote
- [ ] Pull new memories from remote
- [ ] Handle conflicts
- [ ] Update sync status in DB

### Scheduler
- [ ] Auto-sync timer per site
- [ ] Respect `syncIntervalMinutes` config
- [ ] Skip offline sites
- [ ] Retry on failure

---

## Phase 6: Error Handling

### Connection Errors
- [ ] Invalid secret → clear error message
- [ ] Site unreachable → offline mode option
- [ ] Schema fetch failed → retry option
- [ ] Rate limited → backoff logic

### Database Errors
- [ ] Corrupted DB → recovery option
- [ ] Disk full → warning before it happens
- [ ] Permission denied → helpful message

### UI Feedback
- [ ] Loading states for all async operations
- [ ] Toast notifications for success/error
- [ ] Inline error messages in forms

---

## Phase 7: Testing

### Unit Tests
- [ ] SiteManager methods
- [ ] ToolRegistry methods
- [ ] AgentSpawner methods
- [ ] Secret encryption/decryption

### Integration Tests
- [ ] Full add site flow
- [ ] Tool execution
- [ ] Memory sync
- [ ] Disconnect flows

### E2E Tests
- [ ] Settings UI navigation
- [ ] Add site modal
- [ ] Disconnect modal

---

## Phase 8: Documentation

### User Docs
- [ ] How to get ORA secret from site
- [ ] Adding your first site
- [ ] Managing agents
- [ ] Memory and sync explained

### Developer Docs
- [ ] API schema format
- [ ] Implementing /api/ora on a site
- [ ] Custom agent types
- [ ] Extending the tool system

---

## Notes

### Dependencies to Add
```json
{
    "better-sqlite3": "^9.x",
    "archiver": "^6.x"
}
```

### Files to Create
```
src/
├── services/
│   ├── site-manager.ts
│   ├── tool-registry.ts
│   ├── agent-spawner.ts
│   └── sync-service.ts
├── pages/settings/
│   └── sites.tsx
├── components/settings/
│   ├── SiteCard.tsx
│   ├── AddSiteModal.tsx
│   ├── SiteSettingsModal.tsx
│   └── DisconnectModal.tsx
└── types/
    └── site.ts
```

### Config Files
```
~/.ora/sites/{slug}/
├── config.json
├── schema.json
├── {agent}.site.db
└── backups/
```
