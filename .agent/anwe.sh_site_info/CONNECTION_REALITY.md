# Connection Reality Check (Updated)

**What exists in ORA Desktop vs what needs to be built for IDE/Site connections.**

---

## What Already Exists

### ORA Desktop (Tauri 2 + React)

Location: `/Users/anweshrath/Documents/Cursor/Neeva Pilot/Oraya`

| Component | Status | Path |
|-----------|--------|------|
| **Tauri 2 App** | ✅ Running | `src-tauri/` |
| **React Frontend** | ✅ Built | `src/` |
| **SQLite Database** | ✅ Working | `oraya.db` |
| **Tool Registry** | ✅ Database-driven | `src-tauri/src/tools/registry.rs` |
| **Tool Executors** | ✅ Platform-specific | `src-tauri/src/tools/executors/` |
| **AI Integration** | ✅ Gemini format | `to_gemini_format()` |
| **Memory System** | ✅ Exists | `src-tauri/src/memory/` |
| **Context Manager** | ✅ Exists | `src-tauri/src/context/` |
| **Agent System** | ✅ Exists | `src-tauri/src/agents/` |
| **PTY/Terminal** | ✅ Built | `src-tauri/src/pty/` |
| **Voice** | ✅ Started | `src-tauri/src/voice/` |

### Tool System Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│   ORA DESKTOP - EXISTING ARCHITECTURE                                       │
│                                                                             │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │                                                                     │   │
│   │   oraya.db (SQLite)                                                 │   │
│   │   ─────────────────────────────────────────────────────────────────  │   │
│   │   • tools table (definitions)                                       │   │
│   │   • protocol_tools table (permissions)                              │   │
│   │   • agent_modes table (agent → protocols)                           │   │
│   │                                                                     │   │
│   └───────────────────────────┬─────────────────────────────────────────┘   │
│                               │                                             │
│                               ▼                                             │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │                                                                     │   │
│   │   ToolRegistry (registry.rs)                                        │   │
│   │   ─────────────────────────────────────────────────────────────────  │   │
│   │   • Loads tools from DB at startup                                  │   │
│   │   • get_tools_for_agent() - respects permissions                    │   │
│   │   • to_gemini_format() - converts for AI                            │   │
│   │   • reload() - refresh after changes                                │   │
│   │                                                                     │   │
│   └───────────────────────────┬─────────────────────────────────────────┘   │
│                               │                                             │
│                               ▼                                             │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │                                                                     │   │
│   │   Tool Executors (executors/)                                       │   │
│   │   ─────────────────────────────────────────────────────────────────  │   │
│   │   • macos/ - macOS-specific executors                               │   │
│   │   • linux/ - Linux executors                                        │   │
│   │   • windows/ - Windows executors                                    │   │
│   │   • common/ - Cross-platform                                        │   │
│   │   • ssh.rs - Remote execution                                       │   │
│   │                                                                     │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## What Needs to Be Added

### 1. Site Connections (Websites)

**NOT built yet.** Need to add:

| Component | Where to Add | What It Does |
|-----------|--------------|--------------|
| `sites` table | `oraya.db` | Store connected sites |
| `SiteManager` | `src-tauri/src/sites/` | CRUD for site connections |
| HTTP Client | Rust (reqwest) | Call site's `/api/ora` |
| Dynamic Tool Registration | `ToolRegistry` | Register site tools at runtime |
| Site Settings UI | `src/pages/` | Manage connections |

### 2. IDE Connections (Cursor, VS Code)

**NOT built yet.** Two approaches:

#### Option A: ORA Exposes MCP Server (Recommended)

IDEs connect TO ORA, not the other way around.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│   CURSOR / VS CODE / ANTIGRAVITY                                            │
│   (Configures ORA as MCP server)                                            │
│                                                                             │
│         │                                                                   │
│         │ MCP Protocol                                                      │
│         ▼                                                                   │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │                                                                     │   │
│   │   ORA DESKTOP - MCP SERVER                                          │   │
│   │   localhost:7777                                                    │   │
│   │                                                                     │   │
│   │   Exposes:                                                          │   │
│   │   • anwe-sh.posts.publish (site action)                             │   │
│   │   • anwe-sh.memory.recall (site memory)                             │   │
│   │   • ora.agent.spawn (spawn sub-agent)                               │   │
│   │                                                                     │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

**What to build:**
| Component | Where | What It Does |
|-----------|-------|--------------|
| MCP Server | `src-tauri/src/mcp/` | Expose ORA tools via MCP |
| HTTP endpoint | Tauri HTTP plugin | Listen on localhost:7777 |

**Then in Cursor/Antigravity settings:**
```json
{
    "mcp": {
        "servers": {
            "ora": {
                "url": "http://localhost:7777/mcp"
            }
        }
    }
}
```

#### Option B: ORA Controls IDE (More Complex)

ORA connects TO Cursor via extension.

**Requires building:**
- VS Code extension (TypeScript)
- Extension exposes MCP server
- ORA connects as MCP client

**More work, less value initially.**

---

## Implementation Priority

```
PHASE 1: Website Connections (Easiest, Most Value)
─────────────────────────────────────────────────────
├── Add sites table to oraya.db
├── Create SiteManager in Rust
├── HTTP client for /api/ora calls
├── Dynamic tool registration
└── Site settings UI

PHASE 2: ORA as MCP Server (Enables IDE Integration)
─────────────────────────────────────────────────────
├── Add MCP server module to Rust backend
├── Expose site tools via MCP
├── Configure Cursor to connect to ORA
└── Configure Antigravity to connect to ORA

PHASE 3: Advanced IDE Control (Optional)
─────────────────────────────────────────────────────
├── VS Code extension (if needed)
├── Editor control actions
└── File/terminal operations
```

---

## How IDE Connection Will Work

### For Cursor

1. ORA Desktop starts MCP server on `localhost:7777`
2. User adds to Cursor's MCP config:
   ```json
   // ~/.cursor/mcp.json
   {
       "servers": {
           "ora-desktop": {
               "url": "http://localhost:7777/mcp",
               "description": "ORA - Universal AI Controller"
           }
       }
   }
   ```
3. Cursor's AI now has access to ORA's tools
4. User in Cursor: "Publish my draft to anwe.sh"
5. Cursor calls ORA's `anwe-sh.posts.publish` tool
6. ORA routes to anwe.sh, publishes, returns result

### For Antigravity (Gemini)

Same pattern - Antigravity supports MCP, configure it to connect to ORA.

---

## Summary

| Component | Exists? | Effort to Add |
|-----------|---------|---------------|
| ORA Desktop app | ✅ Yes | — |
| Tool Registry | ✅ Yes | — |
| Tool Executors | ✅ Yes | — |
| Memory System | ✅ Yes | — |
| **Site Connections** | ❌ No | Medium |
| **MCP Server in ORA** | ❌ No | Medium |
| VS Code Extension | ❌ No | High (optional) |

**Bottom line:** ORA Desktop is solid. Add site connections + MCP server to enable everything.
