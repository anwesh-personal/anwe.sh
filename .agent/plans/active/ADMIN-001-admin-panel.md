# Plan: Admin Panel & Theme System

## Plan ID: ADMIN-001
## Status: ACTIVE
## Created: 2026-02-02

---

## Objective

Build a complete admin panel at `app.anwe.sh` with:
1. 5 premium themes (switchable site-wide)
2. Dashboard with stats
3. Blog post editor
4. Agent control center
5. Analytics view
6. Settings

---

## Theme System Design

### Theme 1: Emerald Night (Default)
- Background: #0a0a0a
- Surface: #111111
- Accent: Linear gradient #11998E → #38EF7D
- Vibe: Current site theme, dark and sophisticated

### Theme 2: Ocean Deep
- Background: #0a1628
- Surface: #0f1f35
- Accent: Linear gradient #667eea → #764ba2
- Vibe: Deep blue, professional, enterprise

### Theme 3: Sunset Ember
- Background: #1a0a0a
- Surface: #251111
- Accent: Linear gradient #f093fb → #f5576c
- Vibe: Warm, creative, bold

### Theme 4: Arctic Frost
- Background: #0f0f14
- Surface: #16161d
- Accent: Linear gradient #a8edea → #fed6e3
- Vibe: Cool, minimal, clean

### Theme 5: Golden Hour
- Background: #0d0d08
- Surface: #1a1a12
- Accent: Linear gradient #f7971e → #ffd200
- Vibe: Luxury, premium, warm glow

---

## Admin Panel Structure

```
app.anwe.sh/
├── (auth)/
│   └── login/page.tsx
├── (dashboard)/
│   ├── layout.tsx           # Admin layout with sidebar
│   ├── page.tsx             # Dashboard home
│   ├── posts/
│   │   ├── page.tsx         # Post list
│   │   ├── new/page.tsx     # Create post
│   │   └── [id]/page.tsx    # Edit post
│   ├── agents/
│   │   ├── page.tsx         # Agent overview
│   │   └── [name]/page.tsx  # Agent details
│   ├── analytics/
│   │   └── page.tsx         # Analytics dashboard
│   └── settings/
│       └── page.tsx         # Settings (themes, profile)
```

---

## Implementation Steps

### Phase 1: Theme Foundation
- [ ] Create CSS custom properties for all 5 themes
- [ ] Build theme provider/context
- [ ] Add theme switcher component
- [ ] Test all themes

### Phase 2: Admin Layout
- [ ] Create admin app structure
- [ ] Build sidebar navigation
- [ ] Build header with user menu
- [ ] Implement theme switching

### Phase 3: Dashboard
- [ ] Stats cards (posts, views, agents)
- [ ] Recent activity feed
- [ ] Quick actions

### Phase 4: Blog Management
- [ ] Post list with filters
- [ ] Rich text editor
- [ ] Image upload
- [ ] Preview mode
- [ ] Publish controls

### Phase 5: Agent Control
- [ ] Agent status cards
- [ ] Manual trigger buttons
- [ ] Activity logs
- [ ] Configuration

### Phase 6: Analytics
- [ ] Traffic graphs
- [ ] Top posts
- [ ] Referrer breakdown
- [ ] Time-based filters

### Phase 7: Settings
- [ ] Theme selector
- [ ] Profile settings
- [ ] API keys management

---

## Dependencies

- Next.js 16 (App Router)
- Supabase (auth + data)
- Existing Vanilla patterns
- No new frameworks

---

## Success Criteria

- [ ] All 5 themes work perfectly
- [ ] Theme persists across sessions
- [ ] Admin is fully functional
- [ ] Matches quality of marketing site
- [ ] Mobile responsive

---

*This plan will be updated as implementation progresses.*
