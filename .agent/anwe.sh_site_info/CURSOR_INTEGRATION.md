# Cursor IDE Integration - Complete Guide

How ORA Desktop connects to and controls Cursor IDE.

---

## The Big Picture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│   YOU (Human)                                                               │
│      │                                                                      │
│      │  "Build the login page for anwe.sh with dark mode"                   │
│      │                                                                      │
│      ▼                                                                      │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │                                                                     │   │
│   │                        ORA DESKTOP                                  │   │
│   │                     (Your AI Brain)                                 │   │
│   │                                                                     │   │
│   │   You talk to ORA in natural language.                              │   │
│   │   ORA understands context, remembers preferences,                   │   │
│   │   and orchestrates everything.                                      │   │
│   │                                                                     │   │
│   └───────────────────────────┬─────────────────────────────────────────┘   │
│                               │                                             │
│           ┌───────────────────┼───────────────────┐                         │
│           │                   │                   │                         │
│           ▼                   ▼                   ▼                         │
│   ┌─────────────┐     ┌─────────────┐     ┌─────────────┐                   │
│   │   Cursor    │     │  anwe.sh    │     │   GitHub    │                   │
│   │   (IDE)     │     │  (Website)  │     │   (Repo)    │                   │
│   └─────────────┘     └─────────────┘     └─────────────┘                   │
│                                                                             │
│   ORA controls Cursor to write code, anwe.sh to publish,                   │
│   GitHub to create PRs - all from ONE conversation.                        │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Where Do You Type Prompts?

### Answer: In ORA Desktop

You don't type in Cursor. You type in **ORA Desktop** - a standalone app.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│   ORA Desktop App                                                    _ □ ×  │
│   ─────────────────────────────────────────────────────────────────────────  │
│                                                                             │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │                                                                     │   │
│   │   ORA                                              Today, 9:30 AM   │   │
│   │   ─────────────────────────────────────────────────────────────────  │   │
│   │                                                                     │   │
│   │   Good morning! I'm connected to:                                   │   │
│   │   • Cursor (project: anwe.sh)                                       │   │
│   │   • anwe.sh website                                                 │   │
│   │   • GitHub (anwesh-personal/anwe.sh)                               │   │
│   │                                                                     │   │
│   │   What would you like to work on today?                             │   │
│   │                                                                     │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │                                                                     │   │
│   │   You                                              Today, 9:31 AM   │   │
│   │   ─────────────────────────────────────────────────────────────────  │   │
│   │                                                                     │   │
│   │   Build a login page for anwe.sh with dark mode support.            │   │
│   │   Use the existing theme system. After you're done,                 │   │
│   │   commit it and create a PR.                                        │   │
│   │                                                                     │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │                                                                     │   │
│   │   ORA                                              Today, 9:31 AM   │   │
│   │   ─────────────────────────────────────────────────────────────────  │   │
│   │                                                                     │   │
│   │   On it! Here's my plan:                                            │   │
│   │                                                                     │   │
│   │   1. Check existing theme system in Cursor                          │   │
│   │   2. Create login page component                                    │   │
│   │   3. Add dark mode styles                                           │   │
│   │   4. Create route                                                   │   │
│   │   5. Test build                                                     │   │
│   │   6. Commit and push                                                │   │
│   │   7. Create PR on GitHub                                            │   │
│   │                                                                     │   │
│   │   Starting now...                                                   │   │
│   │                                                                     │   │
│   │   ┌─────────────────────────────────────────────────────────────┐   │   │
│   │   │  🔄 Executing: cursor.files.read                            │   │   │
│   │   │     Reading src/components/admin/ThemeSwitcher.tsx...       │   │   │
│   │   └─────────────────────────────────────────────────────────────┘   │   │
│   │                                                                     │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │                                                                     │   │
│   │   Type your message...                                    [Send]   │   │
│   │                                                                     │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### What Happens in Cursor?

Cursor opens **automatically** and you watch ORA work:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│   Cursor IDE                                                         _ □ ×  │
│   ─────────────────────────────────────────────────────────────────────────  │
│                                                                             │
│   ┌─────────┐ ┌─────────────────────────────────────────────────────────┐   │
│   │ Explorer│ │  src/app/(auth)/login/page.tsx                    ×    │   │
│   │         │ ├─────────────────────────────────────────────────────────┤   │
│   │ ▼ src   │ │  1  'use client';                                      │   │
│   │   ▼ app │ │  2                                                     │   │
│   │     auth│ │  3  import { useState } from 'react';                  │   │
│   │       ★ │ │  4  import { useTheme } from '@/hooks/useTheme';       │   │
│   │   login │ │  5                                       ▲              │   │
│   │         │ │  6  export default function LoginPage() {│ ORA typing  │   │
│   │         │ │  7    const { theme } = useTheme();      │              │   │
│   │         │ │  8    const [email, setEmail] = useState▼('');         │   │
│   │         │ │  9                                                     │   │
│   │         │ │                                                         │   │
│   │         │ └─────────────────────────────────────────────────────────┘   │
│   │         │                                                               │
│   │         │ ┌─────────────────────────────────────────────────────────┐   │
│   │         │ │  TERMINAL                                               │   │
│   │         │ ├─────────────────────────────────────────────────────────┤   │
│   │         │ │  $ npm run build                                        │   │
│   │         │ │  ✓ Compiled successfully                                │   │
│   │         │ │                                                         │   │
│   └─────────┘ └─────────────────────────────────────────────────────────┘   │
│                                                                             │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │  🤖 ORA Agent Active | Creating login page... | 3 files modified   │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

**You watch it happen in real-time.** Files open, code appears, terminal runs.

---

## User Experience Flow

### Step 1: One-Time Setup (5 minutes)

```
1. Install ORA Desktop app
2. Install "Oraya Connector" extension in Cursor
3. In ORA Desktop: Settings → Connections → Add IDE
   - Select: Cursor
   - Click: Connect
   - Done!
```

### Step 2: Daily Usage

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│   MORNING: Open ORA Desktop & Cursor side-by-side                           │
│                                                                             │
│   ┌─────────────────────────┐     ┌─────────────────────────────────────┐   │
│   │                         │     │                                     │   │
│   │     ORA Desktop         │     │         Cursor IDE                  │   │
│   │                         │     │                                     │   │
│   │   You type here         │────▶│   Code appears here                 │   │
│   │   in natural language   │     │   automatically                     │   │
│   │                         │     │                                     │   │
│   └─────────────────────────┘     └─────────────────────────────────────┘   │
│                                                                             │
│   You: "Add pagination to the leads table"                                  │
│                                                                             │
│   ORA:                                                                      │
│   - Opens leads page in Cursor                                              │
│   - Adds pagination state                                                   │
│   - Updates API call                                                        │
│   - Adds UI controls                                                        │
│   - Runs lint check                                                         │
│   - "Done! Pagination added. Want me to test it?"                           │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Benefits Over Using Cursor Alone

| Aspect | Cursor Alone | ORA + Cursor |
|--------|--------------|--------------|
| **Context** | Forgets between sessions | Remembers everything |
| **Scope** | One project at a time | Multiple projects + websites |
| **Memory** | None | "Last time you preferred tailwind" |
| **Website control** | ❌ Can't publish | ✅ Publish directly |
| **Git workflow** | Manual | "Commit and create PR" |
| **Multi-tool** | Just coding | Code + Deploy + Publish |
| **Delegation** | None | "Spawn a writer agent" |

---

## Example Conversations

### Example 1: Simple Code Task

```
You: Add a dark mode toggle to the header

ORA: I'll add that now.
     
     [Executing: cursor.files.read - src/components/Header.tsx]
     [Executing: cursor.files.read - src/hooks/useTheme.ts]
     [Executing: cursor.files.write - src/components/Header.tsx]
     
     Done! I added a toggle button that uses your existing useTheme hook.
     The icon switches between 🌙 and ☀️ based on the current theme.
     
     Want me to run the dev server to test it?
```

### Example 2: Complex Multi-Step Task

```
You: Create a complete contact form with validation, 
     email notification, and store submissions in the database.
     Then deploy it.

ORA: This is a larger task. Let me break it down:

     📋 Plan:
     1. Create ContactForm component with validation
     2. Create API route for form submission
     3. Add email notification (using your existing Resend setup)
     4. Create database migration for submissions table
     5. Run migration
     6. Test locally
     7. Commit and push
     8. Deploy to Vercel
     
     Starting now...
     
     [Creating: src/components/ContactForm.tsx]
     [Creating: src/app/api/contact/route.ts]
     [Creating: supabase/migrations/20260205_create_contact_submissions.sql]
     
     ⏳ Running database migration...
     ✅ Migration complete
     
     [Executing: cursor.terminal.run - npm run dev]
     
     Local server running. I tested the form - it works!
     
     [Executing: cursor.git.commit - "feat: add contact form with validation"]
     [Executing: cursor.git.push]
     [Executing: vercel.deploy]
     
     ✅ Deployed to https://anwe.sh
     
     Contact form is live! Submissions will be stored in the database
     and you'll get email notifications.
```

### Example 3: Cross-System Task

```
You: Write a blog post about the new contact form feature,
     include a screenshot, and publish it.

ORA: I'll handle this across multiple systems:

     1. CURSOR: Take screenshot of the contact form
        [Executing: cursor.screenshot - http://localhost:3000/contact]
     
     2. ORA: Write the blog post
        [Writing content based on my memory of what we built...]
     
     3. ANWE.SH: Create and publish the post
        [Executing: anwe-sh.posts.create - title: "New Contact Form"]
        [Executing: anwe-sh.media.upload - contact-form-screenshot.png]
        [Executing: anwe-sh.posts.publish - id: "..."]
     
     ✅ Published! "New Contact Form Feature" is now live at:
     https://anwe.sh/blog/new-contact-form-feature
```

---

## What ORA Can Do in Cursor

### File Operations
```
cursor.files.read      → Read any file
cursor.files.write     → Modify files
cursor.files.create    → Create new files
cursor.files.delete    → Remove files
cursor.files.move      → Move/rename files
cursor.files.search    → Find files by pattern
```

### Editor Control
```
cursor.editor.open     → Open a file in editor
cursor.editor.goto     → Navigate to line/symbol
cursor.editor.select   → Select text range
cursor.editor.replace  → Find and replace
cursor.editor.fold     → Collapse code sections
```

### Terminal
```
cursor.terminal.run    → Execute command
cursor.terminal.read   → Get terminal output
cursor.terminal.kill   → Stop running process
```

### Git
```
cursor.git.status      → Get current status
cursor.git.diff        → See changes
cursor.git.add         → Stage files
cursor.git.commit      → Create commit
cursor.git.push        → Push to remote
cursor.git.pull        → Pull changes
cursor.git.branch      → Create/switch branch
cursor.git.stash       → Stash/unstash changes
```

### Workspace
```
cursor.workspace.search      → Search across files
cursor.workspace.symbols     → Find symbols/functions
cursor.workspace.references  → Find usages
cursor.workspace.diagnostics → Get errors/warnings
```

---

## The Memory Advantage

ORA remembers everything about your project:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│   ORA's Memory for "Cursor - anwe.sh project"                               │
│                                                                             │
│   Preferences:                                                              │
│   • Uses TypeScript strict mode                                             │
│   • Prefers functional components                                           │
│   • CSS Modules over Tailwind                                               │
│   • Zod for validation                                                      │
│                                                                             │
│   Project Context:                                                          │
│   • Next.js 14 with App Router                                              │
│   • Supabase for database                                                   │
│   • Resend for emails                                                       │
│   • Theme system in /hooks/useTheme.ts                                      │
│                                                                             │
│   Recent Work:                                                              │
│   • Created admin panel (Feb 3)                                             │
│   • Added analytics tracking (Feb 4)                                        │
│   • Fixed auth flow (Feb 4)                                                 │
│                                                                             │
│   Known Issues:                                                             │
│   • Leads page needs pagination (noted Feb 4)                               │
│   • Mobile nav needs fixing                                                 │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

So when you say:

```
You: "Add that pagination we talked about"

ORA: I remember - you wanted pagination on the leads table.
     Let me implement that now using your standard patterns...
```

---

## Setup Instructions

### 1. Install ORA Desktop

```bash
# Download from oraya.dev
# Or build from source:
git clone https://github.com/oraya-dev/ora-desktop
cd ora-desktop
npm install && npm run build
```

### 2. Install Cursor Extension

```
1. Open Cursor
2. Go to Extensions (Cmd+Shift+X)
3. Search "Oraya Connector"
4. Click Install
5. Restart Cursor
```

### 3. Connect ORA to Cursor

```
In ORA Desktop:

1. Open Settings (⚙️ icon)
2. Click "Connections" tab
3. Click "+ Add Connection"
4. Select "IDE" → "Cursor"
5. Click "Connect"

A popup appears in Cursor asking to allow ORA.
Click "Allow".

Done! ORA can now control Cursor.
```

### 4. Verify Connection

```
In ORA Desktop, type:

You: "What files are in my current project?"

ORA should respond with a list of files from Cursor's open workspace.
```

---

## FAQ

### Q: Do I still use Cursor's built-in AI?

You can! They complement each other:
- **Cursor AI**: Quick inline completions, tab-to-accept
- **ORA**: Complex tasks, multi-step workflows, cross-system actions

### Q: Does ORA replace Cursor's Composer?

For complex tasks, yes. ORA can:
- Remember context between sessions
- Control multiple systems (not just code)
- Delegate to specialized agents

### Q: Can I use voice?

Yes! ORA Desktop supports voice input:
- Click the 🎤 button or press Cmd+Shift+V
- Speak your request
- ORA transcribes and executes

### Q: What if ORA makes a mistake?

Just tell it:
```
You: "That's not right, undo that and try a different approach"

ORA: Sorry about that! Let me revert and try again...
     [Executing: cursor.git.stash - save current changes]
     [Executing: cursor.git.checkout - ...]
```

### Q: Can multiple people use ORA on the same project?

Each person has their own ORA Desktop with their own memories.
The project code stays in sync via Git.

---

## Summary

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│   WITHOUT ORA:                                                              │
│   • Open Cursor, type in chat, copy code, debug, repeat                     │
│   • Switch to browser to publish                                            │
│   • Switch to terminal for git                                              │
│   • Forget context next session                                             │
│                                                                             │
│   WITH ORA:                                                                 │
│   • One conversation controls everything                                    │
│   • "Build the login page and publish a blog post about it"                 │
│   • ORA handles Cursor + Website + Git + Deploy                             │
│   • Remembers everything for next time                                      │
│                                                                             │
│   ORA = Your universal AI controller                                        │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```
