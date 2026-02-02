# Admin Panel Complete Build Plan

## Last Updated: 2026-02-03

---

## 1. ADVANCED BLOCK-BASED POST EDITOR

### Core Features:
- **Block Types:**
  - Text (paragraph, heading 1-6)
  - Image (upload + URL + AI generation)
  - Code (syntax highlighted with language selection)
  - Quote
  - Callout (info, warning, tip, danger)
  - Divider
  - List (bullet, numbered, checklist)
  - Table
  - Embed (YouTube, Twitter, etc.)
  - Custom HTML

### Drag & Drop:
- Blocks can be reordered via drag-drop
- Visual indicators during drag
- Keyboard shortcuts for power users

### AI Integration Points:
- "Generate with AI" button on text blocks
- AI title suggestions
- AI excerpt generation
- AI SEO optimization
- AI image generation for covers
- AI content improvement/rewriting

### Technical Stack:
- Use `@dnd-kit` for drag and drop (most modern, accessible)
- Custom block components
- Local state + autosave to DB
- Markdown export for compatibility

---

## 2. AGENTS SYSTEM (Database-Backed)

### Database Schema (`agents` table):
```sql
- id: UUID
- name: TEXT
- type: TEXT (orchestrator, content, visual, optimization, distribution, analytics)
- description: TEXT
- model: TEXT (gpt-4-turbo, claude-3-opus, dall-e-3, etc.)
- status: TEXT (active, idle, disabled, error)
- config: JSONB (model-specific settings)
- last_run_at: TIMESTAMPTZ
- total_runs: INTEGER
- created_at: TIMESTAMPTZ
- updated_at: TIMESTAMPTZ
```

### Database Schema (`agent_runs` table):
```sql
- id: UUID
- agent_id: UUID (FK)
- action: TEXT
- input: JSONB
- output: JSONB
- status: TEXT (success, error, pending)
- duration_ms: INTEGER
- error_message: TEXT
- created_at: TIMESTAMPTZ
```

### Features:
- List all agents with status
- Configure agent (model, settings)
- Enable/disable agents
- View run history
- Trigger manual runs
- Real-time status updates

---

## 3. ANALYTICS SYSTEM

### Option A: Internal Tracking (Simpler)
- Track page views internally
- Store in `page_views` table
- Build charts from our own data

### Option B: External Integration
- Integrate with Google Analytics 4 API
- Integrate with Vercel Analytics
- Pull data and display

### Database Schema (`page_views` table):
```sql
- id: UUID
- path: TEXT
- referrer: TEXT
- user_agent: TEXT
- country: TEXT
- city: TEXT
- device_type: TEXT
- session_id: TEXT
- created_at: TIMESTAMPTZ
```

---

## 4. SETTINGS COMPLETION

### Tabs Structure:
1. **General** - Site name, tagline, logo
2. **Profile** - Email, password (exists)
3. **Appearance** - Theme (exists), custom CSS
4. **SEO** - Default meta, social images, robots.txt
5. **Social** - Twitter, LinkedIn, GitHub links
6. **Integrations** - API keys, webhooks

### Database Schema (expand `site_settings`):
Use key-value store approach for flexibility.

---

## EXECUTION ORDER

### Phase 1: Database Migrations
1. Create `agents` table
2. Create `agent_runs` table
3. Create `page_views` table
4. Expand `site_settings` with all keys

### Phase 2: Settings Completion
1. Build all tabs UI
2. Connect to database
3. Test save/load

### Phase 3: Block Editor
1. Build block components
2. Implement drag-drop
3. Connect to CRUD
4. Add AI integration hooks

### Phase 4: Agents System
1. Build agent list UI
2. Build agent config modal
3. Build run history panel
4. Connect to agent execution backend

### Phase 5: Analytics
1. Build tracking middleware
2. Build analytics dashboard
3. Add charts library

---

## DEPENDENCIES TO INSTALL

```bash
npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
npm install react-syntax-highlighter
npm install date-fns
```

---

## READY TO START

User confirmed: NO shortcuts, NO band-aids, NO corner cutting.
Build everything properly, fully functional, production-ready.
