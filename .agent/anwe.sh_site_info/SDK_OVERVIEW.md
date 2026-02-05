# Oraya SDK Overview

A universal protocol for connecting ORA to any system.

---

## What is Oraya SDK?

Oraya SDK is a standardized way for ORA (your AI assistant) to connect to and control ANY system - websites, IDEs, desktop apps, CLI tools, APIs, and more.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              ORA DESKTOP                                    │
│                           (The AI Brain)                                    │
│                                 │                                           │
│         ┌───────────┬───────────┼───────────┬───────────┐                   │
│         │           │           │           │           │                   │
│         ▼           ▼           ▼           ▼           ▼                   │
│    ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐              │
│    │ Website │ │  IDE    │ │ Desktop │ │  CLI    │ │  API    │              │
│    │ anwe.sh │ │ Cursor  │ │  Apps   │ │ Tools   │ │ GitHub  │              │
│    └─────────┘ └─────────┘ └─────────┘ └─────────┘ └─────────┘              │
│                                                                             │
│                    All using Oraya SDK Protocol                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## The Universal Interface

Every Oraya-compatible system implements:

```typescript
interface OrayaConnector {
    // What can you do?
    getSchema(): {
        name: string;
        version: string;
        actions: Record<string, {
            description: string;
            params: Record<string, ParamDef>;
        }>;
    };
    
    // Do the thing
    executeAction(action: string, data: any): Promise<any>;
}
```

---

# IDE Connection Guides

---

## 1. Connecting to Cursor IDE

Cursor is an AI-powered VS Code fork. Perfect for ORA integration.

### Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│   CURSOR IDE                                                                │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │                                                                     │   │
│   │   Oraya Extension                                                   │   │
│   │   ┌───────────────────────────────────────────────────────────┐     │   │
│   │   │                                                           │     │   │
│   │   │   MCP Server (localhost:7778)                             │     │   │
│   │   │                                                           │     │   │
│   │   │   Exposes:                                                │     │   │
│   │   │   - files.* (read, write, create, delete)                 │     │   │
│   │   │   - terminal.* (run, read, kill)                          │     │   │
│   │   │   - git.* (status, commit, push, pull)                    │     │   │
│   │   │   - editor.* (goto, select, find, replace)                │     │   │
│   │   │   - workspace.* (search, symbols, diagnostics)            │     │   │
│   │   │                                                           │     │   │
│   │   └───────────────────────────────────────────────────────────┘     │   │
│   │                              ▲                                      │   │
│   └──────────────────────────────│──────────────────────────────────────┘   │
│                                  │                                          │
│                                  │ MCP Protocol                             │
│                                  │                                          │
│   ┌──────────────────────────────▼──────────────────────────────────────┐   │
│   │                                                                     │   │
│   │   ORA DESKTOP                                                       │   │
│   │                                                                     │   │
│   │   Sites:                                                            │   │
│   │   - cursor-workspace (IDE)                                          │   │
│   │   - anwe-sh (Website)                                               │   │
│   │   - github-anwesh (API)                                             │   │
│   │                                                                     │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Step-by-Step Setup

#### Step 1: Install Oraya Extension in Cursor

```bash
# Option A: From Marketplace
# Open Cursor → Extensions → Search "Oraya Connector" → Install

# Option B: From VSIX
cursor --install-extension oraya-connector-1.0.0.vsix

# Option C: Build from source
git clone https://github.com/oraya-dev/oraya-vscode
cd oraya-vscode
npm install && npm run build
cursor --install-extension ./oraya-connector-1.0.0.vsix
```

#### Step 2: Configure the Extension

Open Cursor Settings → Extensions → Oraya Connector

| Setting | Value | Description |
|---------|-------|-------------|
| `oraya.mcpPort` | `7778` | Port for MCP server |
| `oraya.autoStart` | `true` | Start server on IDE open |
| `oraya.oraDesktopUrl` | `http://localhost:7777` | ORA Desktop URL |
| `oraya.secret` | `auto-generated` | Shared secret |

Or edit `~/.cursor/settings.json`:

```json
{
    "oraya.mcpPort": 7778,
    "oraya.autoStart": true,
    "oraya.oraDesktopUrl": "http://localhost:7777",
    "oraya.allowedActions": ["files.*", "terminal.*", "git.*"]
}
```

#### Step 3: Start the MCP Server

```bash
# The extension starts automatically, but if manual start needed:
# Cursor Command Palette → "Oraya: Start MCP Server"
```

Verify it's running:
```bash
curl http://localhost:7778/health
# {"status":"ok","version":"1.0.0"}
```

#### Step 4: Connect ORA Desktop to Cursor

In ORA Desktop:

```
Settings → Site Connections → [+ Add Site]

┌─────────────────────────────────────────────┐
│ Name:     Cursor Workspace                  │
│ URL:      http://localhost:7778             │
│ Secret:   (copy from extension settings)    │
│ Type:     IDE                               │
│                                             │
│ [Test Connection]                           │
│                                             │
│ ✅ Connected! Found 24 actions              │
└─────────────────────────────────────────────┘
```

#### Step 5: Use ORA to Control Cursor

Now ORA has access to:

| Tool | What It Does |
|------|--------------|
| `cursor.files.read` | Read any file in workspace |
| `cursor.files.write` | Modify file contents |
| `cursor.files.create` | Create new files |
| `cursor.terminal.run` | Execute shell commands |
| `cursor.git.commit` | Create git commits |
| `cursor.git.push` | Push to remote |
| `cursor.editor.goto` | Navigate to file:line |
| `cursor.workspace.search` | Search across files |
| `cursor.diagnostics.fix` | Auto-fix linting errors |

**Example Conversation:**

```
You: "Create a new React component called UserProfile"

ORA:
- Calls cursor.files.create({ path: "src/components/UserProfile.tsx", ... })
- Calls cursor.files.create({ path: "src/components/UserProfile.css", ... })
- Calls cursor.terminal.run({ command: "npm run lint" })

"Done! Created UserProfile.tsx and UserProfile.css. No lint errors."
```

---

## 2. Connecting to Antigravity (Gemini IDE Agent)

Antigravity is the Gemini-powered coding assistant in IDEs.

### Two Integration Patterns

#### Pattern A: ORA → Antigravity (Delegation)

ORA delegates complex coding tasks to Antigravity.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│   User: "Build the entire admin dashboard for anwe.sh"                      │
│                                                                             │
│   ORA Desktop:                                                              │
│   │                                                                         │
│   │ "This is a large coding task. I'll delegate to Antigravity."           │
│   │                                                                         │
│   ▼                                                                         │
│   Creates task.json in workspace                                            │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │ {                                                                   │   │
│   │   "task": "Build admin dashboard",                                  │   │
│   │   "context": { "site": "anwe.sh", "schema": {...} },               │   │
│   │   "requirements": [...]                                             │   │
│   │ }                                                                   │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│   Antigravity (in IDE):                                                     │
│   │                                                                         │
│   │ Reads task.json                                                         │
│   │ Uses its tools: view_file, write_to_file, run_command                  │
│   │ Builds the dashboard                                                    │
│   │ Updates task.json with completion status                               │
│   │                                                                         │
│   ▼                                                                         │
│   ORA: "Antigravity completed the dashboard. 12 files created."            │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

#### Pattern B: Antigravity → ORA (Site Access)

Antigravity uses ORA to access connected sites.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│   Antigravity (in IDE):                                                     │
│   │                                                                         │
│   │ User asked: "Publish the blog post I just wrote"                        │
│   │                                                                         │
│   │ I don't have access to anwe.sh, but ORA does!                           │
│   │                                                                         │
│   ▼                                                                         │
│   Calls ORA MCP (localhost:7777)                                            │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │ POST /mcp/execute                                                   │   │
│   │ {                                                                   │   │
│   │   "action": "anwe-sh.posts.publish",                                │   │
│   │   "data": { "id": "post-uuid" }                                     │   │
│   │ }                                                                   │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│   ORA Desktop:                                                              │
│   │                                                                         │
│   │ Routes request to anwe.sh/api/ora                                       │
│   │                                                                         │
│   ▼                                                                         │
│   Antigravity: "Post published successfully!"                               │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Step-by-Step: Enable Antigravity → ORA

#### Step 1: Start ORA Desktop MCP Server

ORA Desktop exposes an MCP server for other agents:

```bash
# In ORA Desktop settings
Settings → MCP → Enable MCP Server
Port: 7777
```

#### Step 2: Configure Antigravity's MCP Connections

In your IDE's Gemini/Antigravity settings:

```json
// .gemini/settings.json or equivalent
{
    "mcp": {
        "servers": [
            {
                "name": "ora-desktop",
                "url": "http://localhost:7777/mcp",
                "description": "ORA Desktop - Controls connected sites",
                "features": ["sites", "memory"]
            }
        ]
    }
}
```

#### Step 3: Antigravity Can Now Use ORA Tools

```
Antigravity sees these additional tools:

From ORA's anwe.sh connection:
- anwe-sh.posts.list
- anwe-sh.posts.publish
- anwe-sh.leads.get
- anwe-sh.memory.store
- anwe-sh.memory.recall

From ORA's github connection:
- github.pr.create
- github.issues.list
```

---

## 3. Connecting to VS Code (Standard)

Similar to Cursor, but using standard VS Code.

### Step 1: Install Extension

```bash
code --install-extension oraya.oraya-connector
```

### Step 2: Configure

Same as Cursor - edit settings.json:

```json
{
    "oraya.mcpPort": 7778,
    "oraya.autoStart": true
}
```

### Step 3: Connect from ORA Desktop

Add as site with URL `http://localhost:7778`

---

## 4. Connecting to JetBrains IDEs

IntelliJ, WebStorm, PyCharm, etc.

### Step 1: Install Plugin

```
Settings → Plugins → Marketplace → Search "Oraya" → Install
```

### Step 2: Configure

```
Settings → Tools → Oraya Connector

HTTP Port: 7779
Auto-start: Yes
Secret: [Generate]
```

### Step 3: Connect from ORA Desktop

Add as site with URL `http://localhost:7779`

### Available Actions

| Action | Description |
|--------|-------------|
| `jetbrains.files.*` | File operations |
| `jetbrains.run.*` | Run configurations |
| `jetbrains.refactor.*` | Refactoring tools |
| `jetbrains.debug.*` | Debugger control |
| `jetbrains.vcs.*` | Version control |

---

## 5. Connecting to Vim/Neovim

For terminal-based editors.

### Step 1: Install Plugin

```lua
-- Using lazy.nvim
{
    "oraya-dev/oraya.nvim",
    config = function()
        require("oraya").setup({
            port = 7780,
            secret = os.getenv("ORA_SECRET")
        })
    end
}
```

### Step 2: Start Server

```vim
:OrayaStart
```

### Step 3: Connect from ORA Desktop

Add as site with URL `http://localhost:7780`

---

## 6. Connecting to Warp Terminal

For AI-powered terminal control.

### Step 1: Install Warp Extension

```bash
warp extensions install oraya-connector
```

### Step 2: Configure

```yaml
# ~/.warp/oraya.yaml
port: 7781
secret: ${ORA_SECRET}
allowed_commands:
  - npm
  - git
  - docker
```

### Step 3: Connect from ORA Desktop

ORA can now run terminal commands through Warp with full history and context.

---

# Other Connection Types

---

## Websites (Next.js)

```typescript
// app/api/ora/route.ts
import { createOrayaHandler } from '@oraya/sdk-nextjs';

export const { GET, POST } = createOrayaHandler({
    secret: process.env.ORA_SECRET,
    actions: {
        'posts.list': async () => { /* ... */ },
        'posts.publish': async ({ id }) => { /* ... */ },
    }
});
```

## CLI Tools

```bash
# Wrap any CLI with Oraya
npx @oraya/cli wrap docker

# Now ORA can use:
# - docker.run
# - docker.build
# - docker.ps
```

## APIs (GitHub, Slack, etc.)

```typescript
import { createApiWrapper } from '@oraya/sdk';

const github = createApiWrapper({
    name: 'github',
    baseUrl: 'https://api.github.com',
    auth: `Bearer ${process.env.GITHUB_TOKEN}`,
    actions: {
        'pr.create': { method: 'POST', path: '/repos/{owner}/{repo}/pulls' },
        'issues.list': { method: 'GET', path: '/repos/{owner}/{repo}/issues' },
    }
});
```

---

# Complete Ecosystem Vision

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│                              ORA DESKTOP                                    │
│                           ┌───────────────┐                                 │
│                           │   AI Brain    │                                 │
│                           │   + Memory    │                                 │
│                           │   + Context   │                                 │
│                           └───────┬───────┘                                 │
│                                   │                                         │
│          ┌────────────────────────┼────────────────────────┐                │
│          │                        │                        │                │
│          ▼                        ▼                        ▼                │
│   ┌─────────────┐          ┌─────────────┐          ┌─────────────┐         │
│   │   SITES     │          │    IDEs     │          │    TOOLS    │         │
│   │             │          │             │          │             │         │
│   │ • anwe.sh   │          │ • Cursor    │          │ • GitHub    │         │
│   │ • lekhika   │          │ • VS Code   │          │ • Slack     │         │
│   │ • clients   │          │ • JetBrains │          │ • Notion    │         │
│   │             │          │ • Vim       │          │ • Docker    │         │
│   │             │          │ • Antigrav  │          │ • AWS       │         │
│   └─────────────┘          └─────────────┘          └─────────────┘         │
│                                                                             │
│                                                                             │
│   ════════════════════════════════════════════════════════════════════     │
│                         All via Oraya SDK Protocol                          │
│   ════════════════════════════════════════════════════════════════════     │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

**ORA becomes your universal AI controller.**

One brain. Many hands. Infinite possibilities.
