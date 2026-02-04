# Autoresponder Integration - Implementation Plan

**Created:** 2026-02-04  
**Status:** 🔴 NOT STARTED  
**Priority:** HIGH

---

## Objective

Build production-grade autoresponder integration supporting:
1. Top 5 email marketing platforms with real API integrations
2. Custom HTML/JS form embedding with dual rendering modes
3. Seamless lead capture flow that syncs to both local DB and external providers

---

## Supported Providers

| Provider | API Version | Auth Method | Documentation |
|----------|-------------|-------------|---------------|
| **Mailchimp** | Marketing API v3 | API Key | https://mailchimp.com/developer/marketing/api/ |
| **ConvertKit** | v3 | API Key | https://developers.convertkit.com/ |
| **ActiveCampaign** | v3 | API Key + URL | https://developers.activecampaign.com/ |
| **AWeber** | v1 | OAuth 2.0 | https://api.aweber.com/ |
| **Brevo** | v3 | API Key | https://developers.brevo.com/ |

---

## Phase 1: Database Schema

### 1.1 Create `autoresponder_integrations` Table

```sql
CREATE TABLE autoresponder_integrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider TEXT NOT NULL CHECK (provider IN ('mailchimp', 'convertkit', 'activecampaign', 'aweber', 'brevo')),
    name TEXT NOT NULL,
    api_key TEXT, -- Encrypted in production
    api_url TEXT, -- For ActiveCampaign
    list_id TEXT, -- Default list/audience ID
    form_id TEXT, -- For ConvertKit forms
    is_active BOOLEAN DEFAULT true,
    is_default BOOLEAN DEFAULT false,
    settings JSONB DEFAULT '{}', -- Provider-specific settings
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(provider) -- One integration per provider
);
```

### 1.2 Create `form_embeds` Table

```sql
CREATE TABLE form_embeds (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    html_content TEXT NOT NULL, -- Raw HTML/JS from user
    render_mode TEXT NOT NULL CHECK (render_mode IN ('strip_design', 'use_original')),
    extracted_action TEXT, -- Form action URL (for stripped mode)
    extracted_fields JSONB, -- Parsed form fields (for stripped mode)
    autoresponder_id UUID REFERENCES autoresponder_integrations(id),
    is_active BOOLEAN DEFAULT true,
    placement TEXT DEFAULT 'popup', -- popup, inline, footer, custom
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## Phase 2: API Routes

### 2.1 `/api/autoresponders/route.ts`

| Method | Action | Auth Required |
|--------|--------|---------------|
| GET | List all integrations | Yes (Admin) |
| POST | Create integration | Yes (Admin) |
| PUT | Update integration | Yes (Admin) |
| DELETE | Remove integration | Yes (Admin) |

### 2.2 `/api/autoresponders/[provider]/subscribe/route.ts`

| Method | Action | Auth Required |
|--------|--------|---------------|
| POST | Subscribe email to provider | No (Public) |

Handles:
- Validation of email
- API call to specific provider
- Error handling with provider-specific messages
- Logging subscription attempts

### 2.3 `/api/form-embeds/route.ts`

| Method | Action | Auth Required |
|--------|--------|---------------|
| GET | List form embeds | Yes (Admin) |
| POST | Create/parse form embed | Yes (Admin) |
| PUT | Update form embed | Yes (Admin) |
| DELETE | Remove form embed | Yes (Admin) |

---

## Phase 3: Provider Implementations

### 3.1 Mailchimp Integration

```typescript
// Location: /src/lib/autoresponders/mailchimp.ts

interface MailchimpConfig {
    apiKey: string; // Format: key-dc (data center suffix)
    listId: string; // Audience ID
}

// Functions:
- validateCredentials(config): Promise<boolean>
- getLists(config): Promise<List[]>
- subscribe(config, email, fields?): Promise<SubscribeResult>
- getSubscriber(config, email): Promise<Subscriber | null>
```

### 3.2 ConvertKit Integration

```typescript
// Location: /src/lib/autoresponders/convertkit.ts

interface ConvertKitConfig {
    apiKey: string;
    formId?: string;
    tagId?: string;
}

// Functions:
- validateCredentials(config): Promise<boolean>
- getForms(config): Promise<Form[]>
- getTags(config): Promise<Tag[]>
- subscribe(config, email, firstName?): Promise<SubscribeResult>
```

### 3.3 ActiveCampaign Integration

```typescript
// Location: /src/lib/autoresponders/activecampaign.ts

interface ActiveCampaignConfig {
    apiKey: string;
    apiUrl: string; // e.g., https://account.api-us1.com
    listId: string;
}

// Functions:
- validateCredentials(config): Promise<boolean>
- getLists(config): Promise<List[]>
- subscribe(config, email, fields?): Promise<SubscribeResult>
- createContact(config, contact): Promise<Contact>
```

### 3.4 AWeber Integration

```typescript
// Location: /src/lib/autoresponders/aweber.ts

// Note: AWeber uses OAuth 2.0
interface AWeberConfig {
    accessToken: string;
    refreshToken: string;
    accountId: string;
    listId: string;
}

// Functions:
- getAuthUrl(): string
- exchangeCode(code): Promise<TokenPair>
- refreshAccessToken(refreshToken): Promise<TokenPair>
- getLists(config): Promise<List[]>
- subscribe(config, email, fields?): Promise<SubscribeResult>
```

### 3.5 Brevo Integration

```typescript
// Location: /src/lib/autoresponders/brevo.ts

interface BrevoConfig {
    apiKey: string;
    listId: number;
}

// Functions:
- validateCredentials(config): Promise<boolean>
- getLists(config): Promise<List[]>
- subscribe(config, email, attributes?): Promise<SubscribeResult>
- createContact(config, contact): Promise<Contact>
```

---

## Phase 4: Form Parser & Renderer

### 4.1 HTML Form Parser

```typescript
// Location: /src/lib/form-parser.ts

interface ParsedForm {
    action: string;
    method: string;
    fields: FormField[];
    hiddenFields: Record<string, string>;
    submitButtonText: string;
}

interface FormField {
    name: string;
    type: 'text' | 'email' | 'tel' | 'hidden' | 'select' | 'textarea';
    label?: string;
    placeholder?: string;
    required: boolean;
    options?: string[]; // For select fields
}

// Functions:
- parseFormHtml(html: string): ParsedForm
- extractFormFromScript(html: string): ParsedForm | null
- sanitizeFormHtml(html: string): string
```

### 4.2 Form Embed Component

```tsx
// Location: /src/components/FormEmbed.tsx

interface FormEmbedProps {
    embedId: string;
    // OR
    html?: string;
    mode?: 'strip_design' | 'use_original';
    
    // Callbacks
    onSuccess?: (data: SubmitResult) => void;
    onError?: (error: Error) => void;
    
    // Styling (for strip_design mode)
    className?: string;
    buttonText?: string;
    showLabels?: boolean;
}

// Rendering Logic:
// 1. If mode === 'use_original': Render raw HTML in isolated container
// 2. If mode === 'strip_design': 
//    a. Parse form to extract fields
//    b. Render using site's design system
//    c. Handle submission via AJAX to preserve experience
```

---

## Phase 5: Admin UI

### 5.1 Settings > Integrations Tab Updates

Add to existing integrations tab:
- Autoresponder section with provider cards
- Connection status indicator
- Test connection button
- Configure lists/forms dropdown

### 5.2 New: Form Embeds Management

Location: Settings > Lead Capture OR dedicated page

Features:
- Paste HTML/JS textarea
- Preview (dual mode toggle)
- Save as embed
- Placement selector (popup, inline, footer)
- Link to autoresponder

---

## Phase 6: Integration with Existing Lead Capture

### 6.1 Update LeadCapture Component

- Check for active autoresponder integration
- If exists, also push to autoresponder after local save
- Handle errors gracefully (don't fail local save if autoresponder fails)

### 6.2 Update Lead API

- Add `autoresponderSync` field to track sync status
- Add endpoint to retry failed syncs
- Add sync status to lead details in admin

---

## File Structure

```
src/
├── lib/
│   ├── autoresponders/
│   │   ├── index.ts           # Factory & common types
│   │   ├── mailchimp.ts
│   │   ├── convertkit.ts
│   │   ├── activecampaign.ts
│   │   ├── aweber.ts
│   │   └── brevo.ts
│   └── form-parser.ts
├── app/
│   └── api/
│       ├── autoresponders/
│       │   ├── route.ts       # CRUD
│       │   └── [provider]/
│       │       ├── subscribe/route.ts
│       │       ├── lists/route.ts
│       │       └── validate/route.ts
│       └── form-embeds/
│           └── route.ts
├── components/
│   ├── FormEmbed.tsx
│   └── FormEmbed.css
└── supabase/
    └── migrations/
        └── 20260204_create_autoresponders.sql
```

---

## Implementation Order

1. **Database Migration** - Create tables
2. **Provider Libraries** - Implement all 5 providers
3. **API Routes** - CRUD + subscribe endpoints
4. **Form Parser** - HTML parsing logic
5. **Form Embed Component** - Dual-mode rendering
6. **Admin UI** - Settings integration
7. **Lead Capture Updates** - Autoresponder sync
8. **Testing** - End-to-end with real APIs

---

## Security Considerations

- [ ] API keys stored encrypted (or use env vars for single-tenant)
- [ ] Rate limiting on subscribe endpoints
- [ ] CSRF protection on form submissions
- [ ] Sanitize embedded HTML to prevent XSS
- [ ] Validate provider responses before trusting

---

## Testing Checklist

- [ ] Mailchimp: Add subscriber to audience
- [ ] ConvertKit: Subscribe to form
- [ ] ActiveCampaign: Create contact + add to list
- [ ] AWeber: OAuth flow + subscribe
- [ ] Brevo: Add contact to list
- [ ] Form Parser: Various HTML formats (MailChimp, ConvertKit, custom)
- [ ] Strip Design: Proper field extraction
- [ ] Use Original: Isolated rendering, no CSS bleed

---

## Estimated Effort

| Phase | Complexity | Time Estimate |
|-------|------------|---------------|
| Phase 1: Database | Low | 15 min |
| Phase 2: API Routes | Medium | 45 min |
| Phase 3: Provider Libs | High | 2 hours |
| Phase 4: Form Parser | Medium | 45 min |
| Phase 5: Admin UI | Medium | 1 hour |
| Phase 6: Integration | Medium | 30 min |
| **Total** | | **~5 hours** |

---

## Status Tracking

| Phase | Status | Notes |
|-------|--------|-------|
| Phase 1 | 🟢 Complete | Database migration created |
| Phase 2 | 🟢 Complete | API routes implemented |
| Phase 3 | 🟢 Complete | All 5 providers + custom |
| Phase 4 | 🟢 Complete | Form parser created |
| Phase 5 | 🟢 Complete | Full admin UI |
| Phase 6 | 🟡 In Progress | Integration testing |

---

*Ready to begin implementation. Awaiting approval.*
