# anwe.sh Site Info for ORA Desktop

This folder contains everything ORA Desktop needs to know about connecting to and controlling the anwe.sh website.

---

## What is This?

**anwe.sh** is a Next.js website that will have an ORA API installed. **ORA Desktop** is a local AI assistant that can connect to and control anwe.sh remotely.

When ORA Desktop connects to anwe.sh:
1. ORA fetches the API schema (what actions anwe.sh supports)
2. ORA creates isolated memory databases for each agent working on this site
3. ORA dynamically registers tools based on the schema
4. ORA can now execute actions on anwe.sh (publish posts, manage leads, etc.)

---

## Folder Contents

| File | What It Contains |
|------|------------------|
| `README.md` | This file - overview and index |
| `ARCHITECTURE.md` | System architecture with ASCII diagrams |
| `ARCHITECTURE_OPTIONS.md` | Local vs Centralized DB decision |
| `DATA_MODELS.md` | All TypeScript interfaces |
| `DATABASE_SCHEMA.md` | SQLite schemas for `.site.db` files |
| `API_SCHEMA.md` | What the ORA API looks like on anwe.sh |
| `SERVICES.md` | Core services with full implementation code |
| `UI_DESIGN.md` | All UI mockups for settings pages |
| `TOOLS.md` | MCP tools for site memory and actions |
| `FLOWS.md` | User flows with step-by-step diagrams |
| `SDK_OVERVIEW.md` | **Oraya SDK** - IDE connections (Cursor, Antigravity, etc.) |
| `CHECKLIST.md` | Implementation checklist |
| `ora-overview.html` | **🎨 Stunning Aqua-themed presentation page** |

---

## Quick Reference

### ORA Desktop Folder Structure (After Connection)

```
~/.ora/
├── memory.db                    ← ORA's LOCAL memory (EXISTING - DO NOT MODIFY)
├── conversations/               ← Existing local conversations
├── config/                      ← Existing local config
│
└── sites/                       ← NEW: Remote site data
    └── anwe-sh/                 ← Folder for anwe.sh (slug from URL)
        ├── config.json          ← Connection config (URL, secret, status)
        ├── schema.json          ← Cached API schema from anwe.sh
        ├── ora.site.db          ← ORA's memory FOR anwe.sh
        ├── writer.site.db       ← Writer agent's memory (if enabled)
        ├── seo.site.db          ← SEO agent's memory (if enabled)
        └── backups/             ← Deleted agent DBs (7-day retention)
            └── task-123.site.db.bak
```

### Key Naming Conventions

| What | Format | Example |
|------|--------|---------|
| Site folder | `{hostname with dots as dashes}` | `anwe-sh/` |
| Agent memory | `{agent-slug}.site.db` | `ora.site.db` |
| Spawned agent | `task-{timestamp}.site.db` | `task-1707123456.site.db` |
| Backup | `{agent-slug}.site.db.bak` | `task-123.site.db.bak` |
| Export | `{slug}-backup-{timestamp}.zip` | `anwe-sh-backup-2026-02-05.zip` |

### Database Files Explained

- **`memory.db`** (existing) = ORA's LOCAL brain, general knowledge, NOT site-specific
- **`ora.site.db`** = ORA's memories ABOUT anwe.sh specifically
- **`writer.site.db`** = Writer agent's memories about anwe.sh
- **`task-xxx.site.db`** = Temporary spawned agent, deleted after task

---

## The Connection Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│   USER: "Connect to anwe.sh"                                                │
│                                                                             │
│         │                                                                   │
│         ▼                                                                   │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │  1. ORA Desktop opens Add Site Modal                                │   │
│   │     - User enters: URL, Secret, enables agents                      │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│         │                                                                   │
│         ▼                                                                   │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │  2. ORA calls: GET https://anwe.sh/api/ora                          │   │
│   │     - With: Authorization: Bearer {secret}                          │   │
│   │     - Returns: API schema (actions, params)                         │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│         │                                                                   │
│         ▼                                                                   │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │  3. ORA creates:                                                    │   │
│   │     ~/.ora/sites/anwe-sh/                                           │   │
│   │       ├── config.json     (connection details)                      │   │
│   │       ├── schema.json     (cached API schema)                       │   │
│   │       ├── ora.site.db     (memory database)                         │   │
│   │       └── backups/        (empty folder)                            │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│         │                                                                   │
│         ▼                                                                   │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │  4. ORA registers dynamic tools:                                    │   │
│   │     - anwe-sh.posts.list                                            │   │
│   │     - anwe-sh.posts.publish                                         │   │
│   │     - anwe-sh.leads.get                                             │   │
│   │     - anwe-sh.memory.store (local tool)                             │   │
│   │     - anwe-sh.memory.recall (local tool)                            │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│         │                                                                   │
│         ▼                                                                   │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │  5. DONE - ORA can now control anwe.sh                              │   │
│   │                                                                     │   │
│   │     User: "Publish the TypeScript post"                             │   │
│   │     ORA: Uses anwe-sh.posts.publish tool                            │   │
│   │     ORA: Stores memory in ora.site.db                               │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Start Here

1. Read `ARCHITECTURE.md` for the big picture
2. Read `ARCHITECTURE_OPTIONS.md` for **local vs centralized DB decision**
3. Read `DATA_MODELS.md` for all TypeScript types
4. Read `SERVICES.md` for implementation code
5. Read `UI_DESIGN.md` for the settings UI
6. Read `CHECKLIST.md` for what to build

---

## Important Notes

- **DO NOT** touch `~/.ora/memory.db` - that's ORA's local brain
- **ALL** site-specific data goes under `~/.ora/sites/{slug}/`
- **Secrets** must be encrypted at rest
- **Tools** are dynamic - registered when site connects, unregistered on disconnect
- **Memory DBs** use `.site.db` extension to avoid confusion with local `memory.db`
