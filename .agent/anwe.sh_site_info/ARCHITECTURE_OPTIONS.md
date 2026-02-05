# Architecture Options

Two approaches for where remote site memories are stored.

---

## The Question

When ORA connects to anwe.sh, where do the memories about anwe.sh live?

**Option A:** In anwe.sh's own database (site-specific)
**Option B:** In oraya.dev's centralized database

---

## Option A: Site-Specific Databases

Each site has its own memory storage.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│   anwe.sh                         lekhika.com                               │
│   ┌─────────────────────┐         ┌─────────────────────┐                   │
│   │   Supabase DB       │         │   PostgreSQL DB     │                   │
│   │                     │         │                     │                   │
│   │   memories table    │         │   memories table    │                   │
│   │   - ORA memories    │         │   - ORA memories    │                   │
│   │   - Writer memories │         │   - ORA memories    │                   │
│   │                     │         │                     │                   │
│   └─────────────────────┘         └─────────────────────┘                   │
│            ▲                               ▲                                │
│            │                               │                                │
│            │ sync                          │ sync                           │
│            │                               │                                │
│   ┌────────┴───────────────────────────────┴────────┐                       │
│   │                                                  │                       │
│   │              ORA Desktop (local)                 │                       │
│   │                                                  │                       │
│   │   ~/.ora/sites/                                  │                       │
│   │     ├── anwe-sh/ora.site.db  (local cache)      │                       │
│   │     └── lekhika-com/ora.site.db (local cache)   │                       │
│   │                                                  │                       │
│   └──────────────────────────────────────────────────┘                       │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Pros
- ✅ Data ownership clear - client keeps their data
- ✅ Sell/transfer site → memories go with it
- ✅ Sites work independently (no single point of failure)
- ✅ ORA Kit is fully portable/standalone
- ✅ Privacy/compliance easier per site
- ✅ No dependency on oraya.dev

### Cons
- ❌ Cross-site analytics harder
- ❌ More complex sync logic
- ❌ Each site needs DB setup
- ❌ Harder to aggregate insights across all sites

---

## Option B: Centralized on oraya.dev

All memories stored in one place.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│   anwe.sh                         lekhika.com                               │
│   ┌─────────────────────┐         ┌─────────────────────┐                   │
│   │   /api/ora          │         │   /api/ora          │                   │
│   │   (actions only)    │         │   (actions only)    │                   │
│   │                     │         │                     │                   │
│   │   No memory storage │         │   No memory storage │                   │
│   └─────────────────────┘         └─────────────────────┘                   │
│            │                               │                                │
│            └───────────────┬───────────────┘                                │
│                            │                                                │
│                            ▼                                                │
│   ┌──────────────────────────────────────────────────────┐                  │
│   │                                                       │                  │
│   │                     oraya.dev                         │                  │
│   │                                                       │                  │
│   │   ┌─────────────────────────────────────────────┐    │                  │
│   │   │              Centralized DB                 │    │                  │
│   │   │                                             │    │                  │
│   │   │   memories table                            │    │                  │
│   │   │   - site_id: anwe-sh, agent: ora, ...      │    │                  │
│   │   │   - site_id: anwe-sh, agent: writer, ...   │    │                  │
│   │   │   - site_id: lekhika-com, agent: ora, ...  │    │                  │
│   │   │                                             │    │                  │
│   │   └─────────────────────────────────────────────┘    │                  │
│   │                                                       │                  │
│   └──────────────────────────────────────────────────────┘                  │
│                            ▲                                                │
│                            │ API                                            │
│                            │                                                │
│   ┌────────────────────────┴─────────────────────────────┐                  │
│   │                                                       │                  │
│   │              ORA Desktop (local)                      │                  │
│   │                                                       │                  │
│   │   ~/.ora/sites/                                       │                  │
│   │     ├── anwe-sh/ora.site.db  (local cache)           │                  │
│   │     └── lekhika-com/ora.site.db (local cache)        │                  │
│   │                                                       │                  │
│   └───────────────────────────────────────────────────────┘                  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Pros
- ✅ Single source of truth
- ✅ Easy cross-site analytics and insights
- ✅ Simpler architecture (one DB)
- ✅ Sites don't need complex DB setup
- ✅ ORA Pro features (global memory, cross-site learning)

### Cons
- ❌ oraya.dev down = all sites' memory inaccessible
- ❌ Data ownership unclear for client sites
- ❌ Selling a site requires migration/export
- ❌ Privacy concerns (you hold all client data)
- ❌ ORA Kit less portable (needs oraya.dev)
- ❌ Hosting costs scale with usage

---

## Hybrid Approach (Recommended)

Best of both worlds:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│   YOUR SITES (anwe.sh, lekhika.com)           CLIENT SITES                  │
│   ┌─────────────────────────────────┐         ┌─────────────────────────┐   │
│   │                                 │         │                         │   │
│   │   Memories → oraya.dev         │         │   Memories → their DB   │   │
│   │   (centralized control)         │         │   (full ownership)      │   │
│   │                                 │         │                         │   │
│   └─────────────────────────────────┘         └─────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Implementation

Site config includes `memoryMode`:

```typescript
interface SiteConfig {
    // ... existing fields
    
    memoryMode: 'local' | 'site' | 'oraya';
    // local = only in ORA Desktop (no remote sync)
    // site = sync with site's own DB
    // oraya = sync with oraya.dev centralized DB
    
    orayaEndpoint?: string;  // if memoryMode is 'oraya'
}
```

### oraya.dev Memory API

If using centralized mode, oraya.dev provides:

```
POST https://oraya.dev/api/memory
Authorization: Bearer {ora_api_key}

{
    "action": "store",
    "siteId": "anwe-sh",
    "agentId": "ora",
    "memory": {
        "content": "User prefers dark mode",
        "type": "preference",
        "importance": 7
    }
}
```

### oraya.dev DB Schema

```sql
CREATE TABLE site_memories (
    id UUID PRIMARY KEY,
    site_id TEXT NOT NULL,          -- "anwe-sh"
    agent_id TEXT NOT NULL,         -- "ora", "writer"
    content TEXT NOT NULL,
    type TEXT DEFAULT 'fact',
    importance INTEGER DEFAULT 5,
    health_score REAL DEFAULT 1.0,
    
    -- Owner tracking
    user_id UUID REFERENCES users(id),  -- ORA account owner
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Indexes
    INDEX idx_site_agent (site_id, agent_id),
    INDEX idx_user (user_id)
);

-- RLS: Users can only access their own sites' memories
ALTER TABLE site_memories ENABLE ROW LEVEL SECURITY;

CREATE POLICY site_memories_policy ON site_memories
    FOR ALL USING (user_id = auth.uid());
```

---

## Decision Matrix

| Use Case | Recommended Mode |
|----------|------------------|
| Your personal sites | `oraya` (centralized) |
| Client sites you manage | `oraya` or `site` |
| Client sites they own | `site` (their DB) |
| Fully standalone deployment | `local` or `site` |
| ORA Kit open source | `site` (portable) |

---

## Configuration Example

```json
// anwe.sh config.json - YOUR site, centralized
{
    "slug": "anwe-sh",
    "memoryMode": "oraya",
    "orayaEndpoint": "https://oraya.dev/api/memory"
}

// client-site.com config.json - CLIENT site, their DB
{
    "slug": "client-site",
    "memoryMode": "site"
}
```

---

## Summary

- **Site-specific** = portable, independent, client-friendly
- **Centralized oraya.dev** = unified, analytics, your control
- **Hybrid** = use centralized for your sites, site-specific for clients

The current documentation assumes **site-specific with local cache**, but the architecture supports switching via `memoryMode` config.
