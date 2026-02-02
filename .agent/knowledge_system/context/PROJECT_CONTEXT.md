# Project Context - ANWE.SH

## What Is This Project?

Personal brand platform for **Anwesh Rath** - a comprehensive system for:
- Marketing/portfolio website (anwe.sh)
- Blog with AI-powered content creation
- Admin panel for content management (app.anwe.sh)
- Backend API with agent coordination (api.anwe.sh)

---

## The Vision

A self-sustaining content platform where AI agents (orchestrated by ORA) can:
- Write blog posts
- Generate images
- Optimize for SEO
- Post to social media
- Track analytics
- All coordinated through natural language commands

---

## Current State (as of 2026-02-02)

### Completed ✅
- Marketing site (anwe.sh) - Hero, Stats, Expertise, Journey, CTA, Footer
- Blog listing and single post pages
- Navigation with hamburger menu
- Responsive design
- 3 sample blog posts
- Comprehensive documentation at /whatsup
- Supabase schema for blog_posts

### In Progress 🔄
- Admin panel (app.anwe.sh) - STARTING NOW
- 5 theme system

### Planned 📋
- API backend (api.anwe.sh)
- ORA agent integration
- Writer, Imager, SEO, Social agents
- Analytics dashboard

---

## Domain Structure

| Domain | Purpose | Host |
|--------|---------|------|
| anwe.sh | Public marketing + blog | Vercel |
| app.anwe.sh | Admin dashboard | VPS/Vercel |
| api.anwe.sh | Backend API | VPS |
| mail.anwe.sh | Email | Zoho |

---

## Tech Stack

### Frontend
- Next.js 16 (App Router)
- React 19
- TypeScript 5
- GSAP + Framer Motion
- Vanilla CSS (custom design system)

### Backend
- Node.js 20
- Express.js
- Redis (queues)
- Supabase (PostgreSQL)

### AI
- OpenAI GPT-4
- Anthropic Claude
- DALL-E 3

---

## Key Files

```
anwe.sh/
├── src/app/           # Next.js pages
├── src/components/    # React components
├── src/lib/           # Utilities
├── public/            # Static assets
├── supabase/          # Migrations
├── backend/           # API server
└── .agent/            # AI knowledge system
```

---

## Anwesh's Profile

- 15+ years enterprise tech leadership
- AI systems, product psychology, leadership
- Based in India
- Direct communication style
- High standards, no shortcuts

---

*This file provides essential context for any agent working on this project.*
