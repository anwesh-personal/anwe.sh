# System Architecture

This document describes the complete architecture for ORA Desktop connecting to and controlling anwe.sh.

---

## High-Level Overview

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                              COMPLETE SYSTEM ARCHITECTURE                            │
│                                                                                      │
│  ┌──────────────────────────────────────────────────────────────────────────────┐   │
│  │                              ORA DESKTOP (Electron)                           │   │
│  │                                                                               │   │
│  │  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────────────────┐   │   │
│  │  │   Chat UI       │  │  Settings UI    │  │      Tool Registry          │   │   │
│  │  │                 │  │                 │  │                             │   │   │
│  │  │  User talks     │  │  Site           │  │  - Local tools (file, etc)  │   │   │
│  │  │  to ORA         │  │  Connections    │  │  - Site tools (dynamic)     │   │   │
│  │  │                 │  │  Management     │  │  - Memory tools             │   │   │
│  │  └─────────────────┘  └─────────────────┘  └─────────────────────────────┘   │   │
│  │           │                    │                        │                     │   │
│  │           └────────────────────┼────────────────────────┘                     │   │
│  │                                │                                              │   │
│  │                                ▼                                              │   │
│  │  ┌───────────────────────────────────────────────────────────────────────┐   │   │
│  │  │                         CORE SERVICES                                  │   │   │
│  │  │                                                                        │   │   │
│  │  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌───────────┐  │   │   │
│  │  │  │ SiteManager  │  │ AgentSpawner │  │ ToolRegistry │  │ MemorySync│  │   │   │
│  │  │  │              │  │              │  │              │  │           │  │   │   │
│  │  │  │ - addSite    │  │ - spawn      │  │ - register   │  │ - push    │  │   │   │
│  │  │  │ - disconnect │  │ - complete   │  │ - unregister │  │ - pull    │  │   │   │
│  │  │  │ - export     │  │ - extract    │  │ - execute    │  │ - sync    │  │   │   │
│  │  │  └──────────────┘  └──────────────┘  └──────────────┘  └───────────┘  │   │   │
│  │  └───────────────────────────────────────────────────────────────────────┘   │   │
│  │                                │                                              │   │
│  │                                ▼                                              │   │
│  │  ┌───────────────────────────────────────────────────────────────────────┐   │   │
│  │  │                         LOCAL STORAGE                                  │   │   │
│  │  │                                                                        │   │   │
│  │  │   ~/.ora/                                                              │   │   │
│  │  │   ├── memory.db          ← LOCAL brain (existing, untouched)          │   │   │
│  │  │   ├── config/            ← Local config (existing)                    │   │   │
│  │  │   │                                                                    │   │   │
│  │  │   └── sites/             ← NEW: Remote site data                      │   │   │
│  │  │       ├── anwe-sh/                                                     │   │   │
│  │  │       │   ├── config.json                                              │   │   │
│  │  │       │   ├── schema.json                                              │   │   │
│  │  │       │   ├── ora.site.db                                              │   │   │
│  │  │       │   └── backups/                                                 │   │   │
│  │  │       └── lekhika-com/                                                 │   │   │
│  │  │           └── ...                                                      │   │   │
│  │  └───────────────────────────────────────────────────────────────────────┘   │   │
│  │                                                                               │   │
│  └──────────────────────────────────────────────────────────────────────────────┘   │
│                                         │                                            │
│                                         │ HTTPS API Calls                            │
│                                         │                                            │
│                                         ▼                                            │
│  ┌──────────────────────────────────────────────────────────────────────────────┐   │
│  │                              REMOTE SITES                                     │   │
│  │                                                                               │   │
│  │  ┌───────────────────────────────┐    ┌───────────────────────────────┐      │   │
│  │  │         anwe.sh               │    │       lekhika.com             │      │   │
│  │  │                               │    │                               │      │   │
│  │  │  /api/ora                     │    │  /api/ora                     │      │   │
│  │  │    ├── GET → Schema           │    │    ├── GET → Schema           │      │   │
│  │  │    └── POST → Execute action  │    │    └── POST → Execute action  │      │   │
│  │  │                               │    │                               │      │   │
│  │  │  Actions:                     │    │  Actions:                     │      │   │
│  │  │  - posts.list                 │    │  - documents.list             │      │   │
│  │  │  - posts.publish              │    │  - templates.create           │      │   │
│  │  │  - leads.get                  │    │  - users.invite               │      │   │
│  │  │  - settings.update            │    │  - billing.status             │      │   │
│  │  │                               │    │                               │      │   │
│  │  │  Database: Supabase           │    │  Database: Self-hosted PG     │      │   │
│  │  │                               │    │                               │      │   │
│  │  └───────────────────────────────┘    └───────────────────────────────┘      │   │
│  │                                                                               │   │
│  └──────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                      │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

---

## Component Breakdown

### ORA Desktop Components

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           ORA DESKTOP COMPONENTS                                 │
│                                                                                  │
│  ┌────────────────────────────────────────────────────────────────────────────┐ │
│  │                              UI LAYER                                       │ │
│  │                                                                             │ │
│  │  ┌─────────────────────┐  ┌─────────────────────────────────────────────┐  │ │
│  │  │     Chat Window     │  │            Settings Window                  │  │ │
│  │  │                     │  │                                             │  │ │
│  │  │  - Message input    │  │  ┌─────────────────────────────────────┐   │  │ │
│  │  │  - Response display │  │  │  Sites Settings Page                │   │  │ │
│  │  │  - Tool execution   │  │  │    - Site cards list                │   │  │ │
│  │  │                     │  │  │    - Add Site Modal                 │   │  │ │
│  │  │                     │  │  │    - Site Settings Modal            │   │  │ │
│  │  │                     │  │  │    - Disconnect Modal               │   │  │ │
│  │  │                     │  │  └─────────────────────────────────────┘   │  │ │
│  │  └─────────────────────┘  └─────────────────────────────────────────────┘  │ │
│  └────────────────────────────────────────────────────────────────────────────┘ │
│                                         │                                        │
│                                         ▼                                        │
│  ┌────────────────────────────────────────────────────────────────────────────┐ │
│  │                           SERVICE LAYER                                     │ │
│  │                                                                             │ │
│  │  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────────────────┐ │ │
│  │  │   SiteManager   │  │  AgentSpawner   │  │       ToolRegistry          │ │ │
│  │  │                 │  │                 │  │                             │ │ │
│  │  │  Manages site   │  │  Creates/kills  │  │  Holds all available tools  │ │ │
│  │  │  connections    │  │  temp agents    │  │  for LLM to use             │ │ │
│  │  │                 │  │                 │  │                             │ │ │
│  │  │  Methods:       │  │  Methods:       │  │  Methods:                   │ │ │
│  │  │  - addSite()    │  │  - spawn()      │  │  - registerSiteTools()     │ │ │
│  │  │  - disconnect() │  │  - complete()   │  │  - unregisterSiteTools()   │ │ │
│  │  │  - exportSite() │  │  - extractMem() │  │  - executeRemoteAction()   │ │ │
│  │  │  - listSites()  │  │  - cleanup()    │  │  - getToolsForSite()       │ │ │
│  │  └─────────────────┘  └─────────────────┘  └─────────────────────────────┘ │ │
│  │                                                                             │ │
│  │  ┌─────────────────┐  ┌─────────────────┐                                  │ │
│  │  │   MemorySync    │  │  BackupCleaner  │                                  │ │
│  │  │                 │  │                 │                                  │ │
│  │  │  Syncs memories │  │  Deletes old    │                                  │ │
│  │  │  with remote    │  │  backup files   │                                  │ │
│  │  │  sites          │  │  after 7 days   │                                  │ │
│  │  └─────────────────┘  └─────────────────┘                                  │ │
│  └────────────────────────────────────────────────────────────────────────────┘ │
│                                         │                                        │
│                                         ▼                                        │
│  ┌────────────────────────────────────────────────────────────────────────────┐ │
│  │                           DATA LAYER                                        │ │
│  │                                                                             │ │
│  │  ┌─────────────────────────────────────────────────────────────────────┐   │ │
│  │  │                      ~/.ora/ (File System)                          │   │ │
│  │  │                                                                     │   │ │
│  │  │  memory.db ──────────────► ORA's local brain (DO NOT TOUCH)         │   │ │
│  │  │                                                                     │   │ │
│  │  │  sites/                                                             │   │ │
│  │  │    └── {slug}/                                                      │   │ │
│  │  │          ├── config.json ──► Site connection details                │   │ │
│  │  │          ├── schema.json ──► Cached API schema                      │   │ │
│  │  │          ├── {agent}.site.db ──► Agent's site-specific memory       │   │ │
│  │  │          └── backups/ ──► Deleted agent DBs (7-day retention)       │   │ │
│  │  └─────────────────────────────────────────────────────────────────────┘   │ │
│  └────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## Data Flow Diagrams

### 1. Add Site Connection

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                         ADD SITE CONNECTION FLOW                                 │
│                                                                                  │
│  ┌──────────────┐                                                               │
│  │    User      │                                                               │
│  │              │                                                               │
│  │  Enters:     │                                                               │
│  │  - URL       │                                                               │
│  │  - Secret    │                                                               │
│  │  - Agents    │                                                               │
│  └──────┬───────┘                                                               │
│         │                                                                        │
│         │ 1. Click "Add Site"                                                   │
│         ▼                                                                        │
│  ┌──────────────┐     2. GET /api/ora      ┌──────────────────────┐             │
│  │ SiteManager  │ ────────────────────────► │     anwe.sh          │             │
│  │              │                           │                      │             │
│  │  addSite()   │ ◄──────────────────────── │  Returns schema JSON │             │
│  └──────┬───────┘     3. Schema response    └──────────────────────┘             │
│         │                                                                        │
│         │ 4. Create folder structure                                            │
│         ▼                                                                        │
│  ┌──────────────────────────────────────────────────────────────────────────┐   │
│  │  ~/.ora/sites/anwe-sh/                                                    │   │
│  │    ├── config.json     ← 5. Save connection config                        │   │
│  │    ├── schema.json     ← 6. Save cached schema                            │   │
│  │    ├── ora.site.db     ← 7. Create empty database                         │   │
│  │    └── backups/        ← 8. Create empty folder                           │   │
│  └──────────────────────────────────────────────────────────────────────────┘   │
│         │                                                                        │
│         │ 9. Register tools                                                     │
│         ▼                                                                        │
│  ┌──────────────┐                                                               │
│  │ ToolRegistry │                                                               │
│  │              │                                                               │
│  │  Registers:  │                                                               │
│  │  - anwe-sh.posts.list                                                        │
│  │  - anwe-sh.posts.publish                                                     │
│  │  - anwe-sh.memory.store                                                      │
│  │  - anwe-sh.memory.recall                                                     │
│  │  - ...                                                                       │
│  └──────────────┘                                                               │
│         │                                                                        │
│         │ 10. Connection complete                                               │
│         ▼                                                                        │
│  ┌──────────────┐                                                               │
│  │    Done!     │                                                               │
│  │              │                                                               │
│  │  ORA can now │                                                               │
│  │  control     │                                                               │
│  │  anwe.sh     │                                                               │
│  └──────────────┘                                                               │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### 2. Execute Remote Action

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                        EXECUTE REMOTE ACTION FLOW                                │
│                                                                                  │
│  ┌──────────────┐                                                               │
│  │    User      │                                                               │
│  │              │                                                               │
│  │  "Publish    │                                                               │
│  │   the TS     │                                                               │
│  │   blog post" │                                                               │
│  └──────┬───────┘                                                               │
│         │                                                                        │
│         │ 1. User message                                                       │
│         ▼                                                                        │
│  ┌──────────────┐                                                               │
│  │     LLM      │                                                               │
│  │              │                                                               │
│  │  Sees tools: │                                                               │
│  │  - anwe-sh.posts.publish                                                     │
│  │  - anwe-sh.posts.list                                                        │
│  │                                                                              │
│  │  Decides:    │                                                               │
│  │  Use anwe-sh.posts.publish                                                   │
│  └──────┬───────┘                                                               │
│         │                                                                        │
│         │ 2. Tool call with params                                              │
│         ▼                                                                        │
│  ┌──────────────┐                                                               │
│  │ ToolRegistry │                                                               │
│  │              │                                                               │
│  │  Finds tool  │                                                               │
│  │  handler     │                                                               │
│  └──────┬───────┘                                                               │
│         │                                                                        │
│         │ 3. executeRemoteAction()                                              │
│         ▼                                                                        │
│  ┌──────────────┐     4. POST /api/ora      ┌──────────────────────┐            │
│  │    fetch()   │ ─────────────────────────► │     anwe.sh          │            │
│  │              │                            │                      │            │
│  │  body: {     │                            │  Executes action     │            │
│  │    action:   │ ◄───────────────────────── │  Returns result      │            │
│  │    "posts.   │     5. Result JSON         │                      │            │
│  │     publish" │                            └──────────────────────┘            │
│  │    data: {}  │                                                               │
│  │  }           │                                                               │
│  └──────┬───────┘                                                               │
│         │                                                                        │
│         │ 6. Return to LLM                                                      │
│         ▼                                                                        │
│  ┌──────────────┐                                                               │
│  │     LLM      │                                                               │
│  │              │                                                               │
│  │  Formats     │                                                               │
│  │  response    │                                                               │
│  │  for user    │                                                               │
│  └──────┬───────┘                                                               │
│         │                                                                        │
│         │ 7. Response                                                           │
│         ▼                                                                        │
│  ┌──────────────┐                                                               │
│  │    User      │                                                               │
│  │              │                                                               │
│  │  "Done! The  │                                                               │
│  │   post is    │                                                               │
│  │   published" │                                                               │
│  └──────────────┘                                                               │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### 3. Spawn Agent Flow

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           SPAWN AGENT FLOW                                       │
│                                                                                  │
│  ┌──────────────┐                                                               │
│  │    User      │                                                               │
│  │              │                                                               │
│  │  "Write 5    │                                                               │
│  │   blog posts │                                                               │
│  │   for me"    │                                                               │
│  └──────┬───────┘                                                               │
│         │                                                                        │
│         │ 1. Complex task                                                       │
│         ▼                                                                        │
│  ┌──────────────┐                                                               │
│  │     ORA      │                                                               │
│  │              │                                                               │
│  │  Decides to  │                                                               │
│  │  delegate    │                                                               │
│  └──────┬───────┘                                                               │
│         │                                                                        │
│         │ 2. Call spawnAgent()                                                  │
│         ▼                                                                        │
│  ┌──────────────┐                                                               │
│  │ AgentSpawner │                                                               │
│  │              │                                                               │
│  │  Creates:    │                                                               │
│  │  - Agent def │                                                               │
│  │  - task-123. │                                                               │
│  │    site.db   │                                                               │
│  └──────┬───────┘                                                               │
│         │                                                                        │
│         │ 3. Agent executes task                                                │
│         ▼                                                                        │
│  ┌──────────────┐                                                               │
│  │  Task Agent  │                                                               │
│  │  (Writer)    │                                                               │
│  │              │                                                               │
│  │  - Writes    │                                                               │
│  │    posts     │                                                               │
│  │  - Stores    │                                                               │
│  │    memories  │                                                               │
│  │    in its    │                                                               │
│  │    own DB    │                                                               │
│  └──────┬───────┘                                                               │
│         │                                                                        │
│         │ 4. Task complete                                                      │
│         ▼                                                                        │
│  ┌──────────────┐                                                               │
│  │ AgentSpawner │                                                               │
│  │              │                                                               │
│  │ completeAgent():                                                             │
│  │ - Extract    │                                                               │
│  │   important  │                                                               │
│  │   memories   │                                                               │
│  │   to ORA     │                                                               │
│  │ - Move DB to │                                                               │
│  │   backups/   │                                                               │
│  └──────┬───────┘                                                               │
│         │                                                                        │
│         │ 5. After 7 days                                                       │
│         ▼                                                                        │
│  ┌──────────────┐                                                               │
│  │ BackupCleaner│                                                               │
│  │              │                                                               │
│  │  Deletes     │                                                               │
│  │  backup file │                                                               │
│  └──────────────┘                                                               │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### 4. Disconnect Site Flow

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                         DISCONNECT SITE FLOW                                     │
│                                                                                  │
│  ┌──────────────┐                                                               │
│  │    User      │                                                               │
│  │              │                                                               │
│  │  Clicks      │                                                               │
│  │  Disconnect  │                                                               │
│  └──────┬───────┘                                                               │
│         │                                                                        │
│         │ 1. Open Disconnect Modal                                              │
│         ▼                                                                        │
│  ┌──────────────────────────────────────────────────────────────────────────┐   │
│  │                         Disconnect Modal                                  │   │
│  │                                                                           │   │
│  │  What should happen to memories?                                          │   │
│  │                                                                           │   │
│  │  ○ Delete everything          → Goes to 2A                                │   │
│  │  ○ Keep locally (offline)     → Goes to 2B                                │   │
│  │  ○ Export & Delete            → Goes to 2C                                │   │
│  │                                                                           │   │
│  └──────────────────────────────────────────────────────────────────────────┘   │
│         │                                                                        │
│         ├──────────────────────┬──────────────────────┐                         │
│         │                      │                      │                         │
│         ▼ 2A                   ▼ 2B                   ▼ 2C                      │
│  ┌─────────────┐        ┌─────────────┐        ┌─────────────┐                  │
│  │   Delete    │        │    Keep     │        │   Export    │                  │
│  │             │        │             │        │             │                  │
│  │  rm -rf     │        │  Update     │        │  Create     │                  │
│  │  ~/.ora/    │        │  config.    │        │  zip file   │                  │
│  │  sites/     │        │  json to    │        │  then       │                  │
│  │  anwe-sh/   │        │  status:    │        │  delete     │                  │
│  │             │        │  "offline"  │        │  folder     │                  │
│  └─────────────┘        └─────────────┘        └──────┬──────┘                  │
│                                                       │                         │
│                                                       ▼                         │
│                                                ┌─────────────┐                  │
│                                                │  Downloads  │                  │
│                                                │  folder     │                  │
│                                                │             │                  │
│                                                │  anwe-sh-   │                  │
│                                                │  backup-    │                  │
│                                                │  2026-02-05 │                  │
│                                                │  .zip       │                  │
│                                                └─────────────┘                  │
│         │                                                                        │
│         ▼                                                                        │
│  ┌──────────────┐                                                               │
│  │ ToolRegistry │                                                               │
│  │              │                                                               │
│  │  Unregisters │                                                               │
│  │  all tools   │                                                               │
│  │  for this    │                                                               │
│  │  site        │                                                               │
│  └──────────────┘                                                               │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## Memory Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           MEMORY ARCHITECTURE                                    │
│                                                                                  │
│  ┌────────────────────────────────────────────────────────────────────────────┐ │
│  │                           ORA's LOCAL BRAIN                                 │ │
│  │                           ~/.ora/memory.db                                  │ │
│  │                                                                             │ │
│  │  - General knowledge                                                        │ │
│  │  - User preferences (global)                                                │ │
│  │  - Conversation history                                                     │ │
│  │  - NOT site-specific                                                        │ │
│  │                                                                             │ │
│  │  ⚠️  DO NOT MODIFY - This is ORA's core memory                             │ │
│  └────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                  │
│  ┌────────────────────────────────────────────────────────────────────────────┐ │
│  │                        SITE-SPECIFIC MEMORIES                               │ │
│  │                        ~/.ora/sites/{slug}/*.site.db                        │ │
│  │                                                                             │ │
│  │  ┌─────────────────────────────────────────────────────────────────────┐   │ │
│  │  │  anwe-sh/                                                           │   │ │
│  │  │                                                                     │   │ │
│  │  │  ora.site.db ───────► ORA's memories ABOUT anwe.sh                  │   │ │
│  │  │    - "anwe.sh uses Supabase"                                        │   │ │
│  │  │    - "Blog posts need SEO meta"                                    │   │ │
│  │  │    - "Owner prefers dark mode"                                      │   │ │
│  │  │                                                                     │   │ │
│  │  │  writer.site.db ───► Writer agent's memories about anwe.sh          │   │ │
│  │  │    - "Article style: technical but accessible"                      │   │ │
│  │  │    - "Include code examples"                                        │   │ │
│  │  │                                                                     │   │ │
│  │  │  task-123.site.db ─► Spawned agent (temporary)                      │   │ │
│  │  │    - Task-specific memories                                         │   │ │
│  │  │    - Deleted after 7 days                                           │   │ │
│  │  └─────────────────────────────────────────────────────────────────────┘   │ │
│  │                                                                             │ │
│  │  ┌─────────────────────────────────────────────────────────────────────┐   │ │
│  │  │  lekhika-com/                                                       │   │ │
│  │  │                                                                     │   │ │
│  │  │  ora.site.db ───────► ORA's memories ABOUT lekhika.com              │   │ │
│  │  │    - Completely separate from anwe.sh                               │   │ │
│  │  │    - No cross-contamination                                         │   │ │
│  │  └─────────────────────────────────────────────────────────────────────┘   │ │
│  └────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                  │
│  KEY PRINCIPLE: Each .site.db is ISOLATED                                       │
│  - No shared memory between sites                                               │
│  - No hallucination from mixed contexts                                         │
│  - Delete site folder = delete all site memories                                │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## Service Dependencies

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                          SERVICE DEPENDENCIES                                    │
│                                                                                  │
│                          ┌─────────────┐                                        │
│                          │  Settings   │                                        │
│                          │     UI      │                                        │
│                          └──────┬──────┘                                        │
│                                 │                                               │
│                                 │ uses                                          │
│                                 ▼                                               │
│                          ┌─────────────┐                                        │
│                          │ SiteManager │                                        │
│                          └──────┬──────┘                                        │
│                                 │                                               │
│              ┌──────────────────┼──────────────────┐                            │
│              │                  │                  │                            │
│              │ creates          │ uses             │ uses                       │
│              ▼                  ▼                  ▼                            │
│       ┌─────────────┐    ┌─────────────┐    ┌─────────────┐                     │
│       │    File     │    │ToolRegistry │    │ AgentSpawner│                     │
│       │   System    │    └──────┬──────┘    └──────┬──────┘                     │
│       │  (folders,  │           │                  │                            │
│       │   SQLite)   │           │ uses             │ creates                    │
│       └─────────────┘           ▼                  ▼                            │
│                          ┌─────────────┐    ┌─────────────┐                     │
│                          │   fetch()   │    │    File     │                     │
│                          │  (HTTP to   │    │   System    │                     │
│                          │   remote)   │    │  (SQLite)   │                     │
│                          └─────────────┘    └─────────────┘                     │
│                                                                                  │
│                          ┌─────────────┐                                        │
│                          │MemorySync   │                                        │
│                          └──────┬──────┘                                        │
│                                 │                                               │
│              ┌──────────────────┼──────────────────┐                            │
│              │                  │                  │                            │
│              │ reads            │ uses             │ writes                     │
│              ▼                  ▼                  ▼                            │
│       ┌─────────────┐    ┌─────────────┐    ┌─────────────┐                     │
│       │   SQLite    │    │   fetch()   │    │   SQLite    │                     │
│       │  (local)    │    │  (remote)   │    │  (local)    │                     │
│       └─────────────┘    └─────────────┘    └─────────────┘                     │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```
