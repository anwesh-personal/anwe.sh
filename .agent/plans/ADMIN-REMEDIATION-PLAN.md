# Admin Panel Remediation Plan

**Based on:** ADMIN-AUDIT-2026-02-04.md  
**Created:** 2026-02-04

---

## Overview

This plan addresses all gaps identified in the admin audit. Work is organized into distinct phases with clear deliverables.

---

## Phase 1: Analytics Fix (HIGH PRIORITY)

**Goal:** Make analytics page show real data instead of mockups

### Task 1.1: Fix Analytics Page
- [ ] Remove `getMockAnalyticsSummary()` call in analytics/page.tsx
- [ ] Use `getAnalyticsSummary()` with proper date range
- [ ] Handle empty data gracefully

### Task 1.2: Create Analytics API Route
```
Create: /src/app/api/analytics/route.ts
- GET: Return analytics summary with date range
- Uses service role key to bypass RLS
- Aggregates page_views data
```

### Task 1.3: Update Analytics Library
```
Modify: /src/lib/analytics.ts
- Update getAnalyticsSummary to use API
- Remove mock function or keep for dev only
```

### Deliverable: Analytics page shows real page views from database

---

## Phase 2: Leads System Fix (HIGH PRIORITY)

**Goal:** Make leads page functional with real data

### Task 2.1: Review/Fix Leads API
```
Review: /src/app/api/leads/route.ts
- Ensure GET returns all leads
- Ensure PUT updates lead status
- Ensure proper error handling
```

### Task 2.2: Update Leads Library
```
Modify: /src/lib/heatmap.ts (leads section)
- Update getLeads() to use API
- Update updateLead() to use API
- Update getLeadStats() to use API
```

### Task 2.3: Create Lead Capture Component
```
Create: /src/components/LeadCapture.tsx
- Email input form
- Name (optional)
- Company (optional)
- Submits to /api/leads POST
- Used on landing page, blog sidebar
```

### Deliverable: Leads captured from site, viewable in admin

---

## Phase 3: Heatmaps Fix (MEDIUM PRIORITY)

**Goal:** Make heatmaps page show real tracking data

### Task 3.1: Create Heatmaps API
```
Create: /src/app/api/heatmaps/route.ts
- GET: Return heatmap data for page
- GET: Return scroll depth data
- GET: Return session stats
- Uses service role key
```

### Task 3.2: Update Heatmap Library
```
Modify: /src/lib/heatmap.ts
- Update getHeatmapData() to use API
- Update getScrollDepthData() to use API
- Update getSessionStats() to use API
```

### Task 3.3: Verify Client Tracker
```
Review: /src/components/Tracker.tsx (if exists)
- Ensure events sent to /api/track
- Verify click/scroll events captured
- Test on production
```

### Deliverable: Heatmaps show real click/scroll data

---

## Phase 4: Settings Consumption (MEDIUM PRIORITY)

**Goal:** Apply saved settings to the public site

### Task 4.1: SEO Settings in Layout
```
Modify: /src/app/layout.tsx
- Fetch settings on server side
- Apply defaultMetaTitle, defaultMetaDescription
- Apply siteName, siteTagline
```

### Task 4.2: Google Analytics Injection
```
Modify: /src/app/layout.tsx or create component
- Fetch googleAnalyticsId from settings
- If set, inject GA4 script in head
```

### Task 4.3: Social Links in Footer
```
Modify: /src/components/Footer.tsx
- Fetch social links from settings
- Display only those that are set
```

### Task 4.4: Logo/Favicon Application
```
Modify: /src/app/layout.tsx
- Fetch siteLogo, siteFavicon
- Apply dynamically if set
```

### Deliverable: Settings changes reflected on public site

---

## Phase 5: Agents System (LOW PRIORITY - FUTURE)

**Goal:** Make agents actually executable

### Task 5.1: Create Agents API
```
Create: /src/app/api/agents/route.ts
- GET: List agents
- POST: Create/Run agent
- PUT: Update agent
- DELETE: Delete agent
```

### Task 5.2: Agent Execution Backend
```
Create: /src/lib/agent-executor.ts
- Connect to AI providers
- Execute prompts
- Track runs and results
```

### Task 5.3: Update Agents Library
```
Modify: /src/lib/agents.ts
- All functions use API routes
```

### Deliverable: Agents can be created and run with real AI

---

## Implementation Order

```
Week 1: Phase 1 (Analytics)
        Phase 2 Tasks 2.1-2.2 (Leads API)

Week 2: Phase 2 Task 2.3 (Lead Capture)
        Phase 3 (Heatmaps)

Week 3: Phase 4 (Settings Consumption)

Future: Phase 5 (Agents)
```

---

## Files to Create

| File | Phase | Purpose |
|------|-------|---------|
| /src/app/api/analytics/route.ts | 1 | Analytics data API |
| /src/app/api/heatmaps/route.ts | 3 | Heatmap data API |
| /src/app/api/agents/route.ts | 5 | Agents CRUD API |
| /src/components/LeadCapture.tsx | 2 | Lead capture form |
| /src/lib/agent-executor.ts | 5 | Agent execution logic |

---

## Files to Modify

| File | Phase | Changes |
|------|-------|---------|
| /src/app/(admin)/admin/analytics/page.tsx | 1 | Use real data |
| /src/lib/analytics.ts | 1 | Use API |
| /src/lib/heatmap.ts | 2,3 | Use API for leads/heatmaps |
| /src/app/layout.tsx | 4 | Apply settings |
| /src/components/Footer.tsx | 4 | Social links |
| /src/lib/agents.ts | 5 | Use API |
| /src/app/(admin)/admin/agents/page.tsx | 5 | Real execution |

---

## Success Criteria

### Phase 1 Complete When:
- Analytics page loads without mock data
- Real page view counts displayed
- Date range filter works

### Phase 2 Complete When:
- Lead capture form on homepage
- Leads appear in admin after submission
- Status can be changed in admin

### Phase 3 Complete When:
- Heatmap shows real click positions
- Scroll depth shows real data
- Works for any tracked page

### Phase 4 Complete When:
- Site title reflects settings
- Meta tags use settings values
- Social links appear if configured
- GA tracking works if ID set

### Phase 5 Complete When:
- Agents can be created in admin
- Run button executes real AI call
- Results stored in database
