# anwe.sh - Project Plan & Architecture

> **Philosophy**: Dig a well, get a 10 acre land, build Taj Mahal.
> Production-grade from Day 1. No band-aids. No shortcuts. No compromises.

---

## 🎯 Overview

**anwe.sh** is not just a portfolio website — it's a full-stack AI-integrated platform that serves as:
1. **Public Face** — Premium marketing site showcasing Anwesh Rath
2. **Content Hub** — Blog/insights managed by Ora (AI OS)
3. **Future Platform** — Client portal, AI tools, agent deployment, lead capture

---

## 🏗️ Architecture

```
anwe.sh/
├── web/                  # Next.js 14 Frontend (Vercel)
│   ├── src/
│   │   ├── app/          # App Router pages
│   │   │   ├── (public)/ # Marketing pages (/, /about, /work, /blog)
│   │   │   ├── (admin)/  # Admin panel (/admin/*)
│   │   │   └── api/      # API routes (lightweight, proxies to backend)
│   │   ├── components/   # Shared UI components
│   │   ├── lib/          # Utilities, API client, hooks
│   │   └── styles/       # Design system, themes
│   └── public/           # Static assets
│
├── backend/              # Express.js API Engine (Railway/VPS)
│   └── src/
│       ├── controllers/  # Request handlers
│       ├── services/     # Business logic
│       ├── routes/       # API endpoints
│       └── middleware/   # Auth, tenant, etc.
│
├── database/             # PostgreSQL Schema (Supabase)
│   └── migrations/       # SQL migrations
│
├── workers/              # Background Workers (VPS)
│   └── (future agents, processors)
│
├── docs/                 # Documentation
└── _mockups/             # Design references
```

---

## 📋 Phases

### Phase 1: Foundation (Current)
**Goal**: Beautiful public website with blog, ready for Ora integration

| Task | Description | Status |
|------|-------------|--------|
| 1.1 | Project structure setup | ✅ Done |
| 1.2 | Next.js frontend scaffold | ✅ Done |
| 1.3 | Design system (Gold/Ocean themes) | 🔄 In Progress |
| 1.4 | Public pages (Hero, About, Work, Expertise, Contact) | ⏳ Pending |
| 1.5 | Blog page with MDX/API support | ⏳ Pending |
| 1.6 | GSAP animations integration | ⏳ Pending |
| 1.7 | Backend API for blog/content (Ora-compatible) | ⏳ Pending |

### Phase 2: Content & Ora Integration
**Goal**: Ora can manage all content via API

| Task | Description | Status |
|------|-------------|--------|
| 2.1 | Blog API endpoints (CRUD) | ⏳ Pending |
| 2.2 | Content management API | ⏳ Pending |
| 2.3 | Ora authentication/API key | ⏳ Pending |
| 2.4 | Admin panel for manual overrides | ⏳ Pending |
| 2.5 | Media/asset management | ⏳ Pending |

### Phase 3: Lead Capture & Analytics
**Goal**: Intelligent lead capture and AI-powered analytics

| Task | Description | Status |
|------|-------------|--------|
| 3.1 | Contact form with Supabase | ⏳ Pending |
| 3.2 | Lead scoring system | ⏳ Pending |
| 3.3 | AI analytics agent | ⏳ Pending |
| 3.4 | Email sequences (optional) | ⏳ Pending |

### Phase 4: Agent Platform
**Goal**: React Flow-based workflow builder for AI agents

| Task | Description | Status |
|------|-------------|--------|
| 4.1 | React Flow canvas | ⏳ Pending |
| 4.2 | Node types (Trigger, AI, Logic, Action) | ⏳ Pending |
| 4.3 | Workflow save to Vanilla backend | ⏳ Pending |
| 4.4 | Agent deployment to workers | ⏳ Pending |
| 4.5 | Pre-built agent templates | ⏳ Pending |

---

## 🎨 Design System

### Color Palettes (Switchable)

**Slate & Gold (Primary)**
```css
--black: #0a0a0a
--charcoal: #141414
--gold: #c9a961
--gold-light: #dcc07a
--text-primary: #ffffff
--text-secondary: #a0a0a0
```

**Deep Ocean (Alternative)**
```css
--bg-dark: #0a1628
--teal: #0d9488
--cyan: #22d3ee
--text-primary: #f1f5f9
--text-secondary: #94a3b8
```

### Typography
- **Headings**: Cormorant Garamond / Playfair Display (serif, elegant)
- **Body**: Inter (clean, readable)
- **Code**: JetBrains Mono

### Animation Stack
- **GSAP** for scroll-triggered animations
- **Framer Motion** for page transitions
- **Lenis** for smooth scrolling

---

## 🔌 API Design (Ora-Compatible)

### Blog Endpoints

```
POST   /api/v1/blog/posts          # Create post (Ora writes here)
GET    /api/v1/blog/posts          # List posts
GET    /api/v1/blog/posts/:slug    # Get single post
PUT    /api/v1/blog/posts/:id      # Update post
DELETE /api/v1/blog/posts/:id      # Delete post
POST   /api/v1/blog/posts/:id/publish  # Publish draft
```

### Content Endpoints

```
GET    /api/v1/content/:section    # Get page content (hero, about, etc.)
PUT    /api/v1/content/:section    # Update page content
```

### Auth for Ora

```
POST   /api/v1/auth/ora            # Ora authenticates with API key
Header: X-Ora-API-Key: <key>       # All Ora requests include this
```

---

## 🗄️ Database Schema Additions

```sql
-- Blog Posts (add to existing schema)
CREATE TABLE blog_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id),
  author_id UUID REFERENCES users(id),
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  excerpt TEXT,
  content TEXT NOT NULL,
  cover_image TEXT,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  published_at TIMESTAMPTZ,
  seo_title TEXT,
  seo_description TEXT,
  tags TEXT[],
  metadata JSONB DEFAULT '{}',
  created_by TEXT DEFAULT 'manual', -- 'manual' | 'ora' | 'api'
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Page Content (dynamic sections)
CREATE TABLE page_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id),
  section TEXT NOT NULL, -- 'hero', 'about', 'expertise', etc.
  content JSONB NOT NULL,
  version INTEGER DEFAULT 1,
  published BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(tenant_id, section)
);

-- Ora API Keys
CREATE TABLE ora_api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key_hash TEXT NOT NULL UNIQUE,
  key_prefix TEXT NOT NULL,
  name TEXT,
  permissions JSONB DEFAULT '["blog:write", "content:write"]',
  last_used_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

---

## 📁 Frontend Structure (Next.js)

```
web/src/
├── app/
│   ├── (public)/                 # Public marketing pages
│   │   ├── page.tsx              # Home (/)
│   │   ├── about/page.tsx        # About
│   │   ├── work/page.tsx         # Work/Case Studies
│   │   ├── expertise/page.tsx    # Expertise
│   │   ├── blog/
│   │   │   ├── page.tsx          # Blog listing
│   │   │   └── [slug]/page.tsx   # Single post
│   │   ├── contact/page.tsx      # Contact
│   │   └── layout.tsx            # Public layout
│   │
│   ├── (admin)/                  # Admin panel (protected)
│   │   ├── admin/
│   │   │   ├── page.tsx          # Dashboard
│   │   │   ├── blog/page.tsx     # Manage posts
│   │   │   ├── content/page.tsx  # Manage content
│   │   │   └── settings/page.tsx # Settings
│   │   └── layout.tsx            # Admin layout
│   │
│   ├── api/                      # API routes
│   │   ├── blog/route.ts         # Blog CRUD
│   │   ├── content/route.ts      # Content management
│   │   └── ora/route.ts          # Ora webhook/API
│   │
│   └── layout.tsx                # Root layout
│
├── components/
│   ├── ui/                       # Base UI components
│   ├── marketing/                # Marketing page components
│   ├── blog/                     # Blog components
│   └── admin/                    # Admin components
│
├── lib/
│   ├── api.ts                    # API client
│   ├── supabase.ts               # Supabase client
│   └── utils.ts                  # Utilities
│
└── styles/
    ├── globals.css               # Global styles
    └── themes/                   # Theme variables
```

---

## ❓ Questions for Later: Ora Integration

To properly integrate with Ora, I'll need to understand:

1. **Authentication**: How does Ora authenticate? API key, JWT, OAuth?
2. **Webhook vs Polling**: Does Ora push content or should we provide webhooks?
3. **Content Format**: What format does Ora output? Markdown, HTML, JSON?
4. **Scheduling**: Can Ora schedule posts for future publishing?
5. **Media Handling**: Does Ora generate/upload images?
6. **Tone/Voice**: Does Ora need reference content to match Anwesh's voice?
7. **Approval Flow**: Should posts go through approval before publishing?

---

## 🚀 Immediate Next Steps

1. ✅ Project structure (done)
2. ⏳ Set up design system in Next.js
3. ⏳ Create Hero/Home page with GSAP animations
4. ⏳ Create remaining public pages
5. ⏳ Set up blog page (SSG with API revalidation)
6. ⏳ Create Blog API endpoints in backend
7. ⏳ Ora API key system

---

## 📊 Tech Stack Summary

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 14 (App Router, TypeScript) |
| Styling | Tailwind CSS + CSS Variables |
| Animations | GSAP + Framer Motion + Lenis |
| Backend | Express.js (Vanilla engine) |
| Database | PostgreSQL (Supabase) |
| Auth | JWT + API Keys |
| Deployment | Vercel (frontend) + Railway/VPS (backend) |
| AI | OpenAI, Anthropic, Gemini (via Vanilla providers) |

---

**Last Updated**: 2026-02-02
**Status**: Phase 1 - Foundation In Progress
