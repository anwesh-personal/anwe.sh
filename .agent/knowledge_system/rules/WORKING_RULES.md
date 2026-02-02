# ANWE.SH - Working Rules & Guidelines

## Core Principles

### 1. NO BAND-AIDS
- Never apply quick fixes that create technical debt
- Every solution must be architecturally sound
- If something needs fixing, fix it properly

### 2. NO SHORTCUTS
- No cutting corners for brevity
- Full implementations, not MVPs
- Documentation must be comprehensive

### 3. TRANSPARENCY
- Always explain what you're doing and why
- Acknowledge mistakes immediately
- Show reasoning for decisions

### 4. RESPECT THE STACK
- Use existing infrastructure (VPS, Supabase, etc.)
- Follow established patterns in the codebase
- Don't introduce unnecessary dependencies

### 5. THEME CONSISTENCY
- All interfaces must follow the design system
- Dark mode by default
- Emerald/teal gradient accents (#11998E → #38EF7D)

---

## Communication Style

- Direct, no fluff
- Technical but approachable
- Acknowledge when backtracking
- Ask for clarification when unsure

---

## Project Preferences

### Code Style
- TypeScript for all new code
- ESM modules
- Functional components in React
- Proper error handling

### Naming Conventions
- Files: kebab-case
- Components: PascalCase
- Functions/variables: camelCase
- CSS classes: kebab-case

### Git Commits
- Conventional commits (feat:, fix:, docs:, etc.)
- Descriptive messages
- Push after significant changes

---

## What NOT To Do

- Don't guess - ask
- Don't redact for brevity
- Don't assume user intent
- Don't introduce new frameworks without discussion
- Don't create placeholder content
- Don't skip error handling
- Don't ignore existing patterns

---

## Session Protocol

1. Read session log at start
2. Update session log elaborately
3. Create/update plan files for ongoing work
4. Document decisions in audit if significant

---

*Last updated: 2026-02-02*
