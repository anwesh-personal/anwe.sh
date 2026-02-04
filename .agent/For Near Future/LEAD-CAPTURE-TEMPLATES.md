# Lead Capture Templates System

**Created:** 2026-02-04  
**Status:** 📋 PLANNED  
**Priority:** HIGH  
**Estimated Effort:** 2-3 weeks

---

## Overview

Build a comprehensive lead capture template system with:
- **10 pre-made professional templates** covering different use cases
- **Granular visual editor** for full customization (colors, fonts, images, spacing)
- **Bidirectional post integration** - set forms from posts OR from autoresponders page
- **Smart distribution** - apply to all posts, selected posts, by tag/category

---

## Template Library

### 10 Pre-made Templates

| # | Template ID | Name | Style | Best Use Case |
|---|-------------|------|-------|---------------|
| 1 | `minimal-newsletter` | **Minimal Newsletter** | Clean, single email field, subtle border | Quick email capture, non-intrusive |
| 2 | `content-upgrade` | **Content Upgrade** | Image preview + description + form | Ebook/PDF/resource downloads |
| 3 | `exit-intent` | **Exit Intent Popup** | Bold colors, urgent copy, large CTA | Last chance before leaving |
| 4 | `inline-article` | **Inline Article** | Blends with post content, soft background | Mid-article capture |
| 5 | `sidebar-widget` | **Sidebar Widget** | Compact vertical layout | Blog sidebar placement |
| 6 | `full-hero` | **Full Hero Section** | Large, hero-style with background image | Landing page section |
| 7 | `floating-bar` | **Floating Bar** | Sticky top or bottom bar | Non-intrusive persistent |
| 8 | `two-step-optin` | **Two-Step Optin** | Button first, then modal with form | Higher conversions |
| 9 | `quiz-entry` | **Quiz/Survey Entry** | Interactive question before form | Engagement-first approach |
| 10 | `social-proof` | **Social Proof** | With testimonial, subscriber count, or stats | Trust-building |

---

## Template Editor Specification

### Customization Categories

#### 1. Layout Settings
```typescript
interface LayoutSettings {
  templateId: string;                    // Base template
  alignment: 'left' | 'center' | 'right';
  width: 'narrow' | 'medium' | 'wide' | 'full';
  padding: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
  margin: {
    top: number;
    bottom: number;
  };
  borderRadius: number;
  shadow: 'none' | 'sm' | 'md' | 'lg' | 'xl';
}
```

#### 2. Color Settings
```typescript
interface ColorSettings {
  background: {
    type: 'solid' | 'gradient' | 'image';
    color?: string;                       // For solid
    gradientStart?: string;               // For gradient
    gradientEnd?: string;
    gradientAngle?: number;
    imageUrl?: string;                    // For image
    imageOverlay?: string;                // Overlay color with opacity
  };
  text: {
    heading: string;
    body: string;
    muted: string;
    link: string;
  };
  button: {
    background: string;
    backgroundHover: string;
    text: string;
    textHover: string;
  };
  input: {
    background: string;
    border: string;
    borderFocus: string;
    text: string;
    placeholder: string;
  };
  accent: string;                         // For highlights, icons
}
```

#### 3. Typography Settings
```typescript
interface TypographySettings {
  fontFamily: {
    heading: string;                      // Google Font name
    body: string;
  };
  heading: {
    size: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl';
    weight: 400 | 500 | 600 | 700 | 800;
    lineHeight: number;
    letterSpacing: number;
  };
  body: {
    size: 'xs' | 'sm' | 'md' | 'lg';
    weight: 400 | 500 | 600;
    lineHeight: number;
  };
  button: {
    size: 'sm' | 'md' | 'lg';
    weight: 500 | 600 | 700;
    uppercase: boolean;
    letterSpacing: number;
  };
}
```

#### 4. Image Settings
```typescript
interface ImageSettings {
  backgroundImage?: {
    url: string;
    position: 'center' | 'top' | 'bottom';
    size: 'cover' | 'contain' | 'auto';
    opacity: number;
  };
  leadMagnetPreview?: {
    url: string;
    alt: string;
    width: number;
    position: 'left' | 'right' | 'top' | 'bottom';
    shadow: boolean;
  };
  logo?: {
    url: string;
    alt: string;
    width: number;
    position: 'top-left' | 'top-center' | 'top-right';
  };
  icon?: {
    type: 'emoji' | 'svg' | 'image';
    value: string;                        // Emoji char, SVG path, or image URL
    size: number;
  };
}
```

#### 5. Content Settings
```typescript
interface ContentSettings {
  headline: {
    text: string;
    show: boolean;
  };
  subheadline: {
    text: string;
    show: boolean;
  };
  description: {
    text: string;                         // Can include HTML/markdown
    show: boolean;
  };
  bulletPoints: {
    items: string[];
    show: boolean;
    icon: string;                         // Emoji or icon class
  };
  button: {
    text: string;
    loadingText: string;
  };
  privacyDisclaimer: {
    text: string;
    show: boolean;
    linkUrl?: string;
  };
  successMessage: {
    headline: string;
    text: string;
    showConfetti: boolean;
    redirectUrl?: string;
    redirectDelay?: number;
  };
}
```

#### 6. Form Field Settings
```typescript
interface FieldSettings {
  email: {
    required: true;                       // Always required
    placeholder: string;
    label?: string;
    showLabel: boolean;
  };
  name: {
    enabled: boolean;
    required: boolean;
    placeholder: string;
    label?: string;
    showLabel: boolean;
    splitFirstLast: boolean;              // Split into first/last name
  };
  phone: {
    enabled: boolean;
    required: boolean;
    placeholder: string;
    label?: string;
    showLabel: boolean;
  };
  customFields: Array<{
    id: string;
    type: 'text' | 'textarea' | 'select' | 'checkbox' | 'radio';
    name: string;
    label: string;
    placeholder?: string;
    required: boolean;
    options?: string[];                   // For select/radio
    mapToProvider?: string;               // Provider field name to map to
  }>;
  layout: 'stacked' | 'inline' | 'grid';
  submitPosition: 'bottom' | 'inline-right';
}
```

#### 7. Integration Settings
```typescript
interface IntegrationSettings {
  autoresponderId: string | null;         // Link to autoresponder_integrations
  listId?: string;                        // Specific list to subscribe to
  tagIds?: string[];                      // Tags to apply
  doubleOptIn: boolean;
  saveToLocal: boolean;                   // Also save to local leads table
  fieldMapping: Record<string, string>;   // Form field -> Provider field
  webhookUrl?: string;                    // Additional webhook
  onSuccessAction: 'message' | 'redirect' | 'close';
}
```

---

## Full Template Configuration Schema

```typescript
interface LeadCaptureTemplate {
  // Identity
  id: string;                             // UUID
  name: string;                           // User-friendly name
  templateId: string;                     // Base template: 'minimal-newsletter', etc.
  
  // All customization settings
  layout: LayoutSettings;
  colors: ColorSettings;
  typography: TypographySettings;
  images: ImageSettings;
  content: ContentSettings;
  fields: FieldSettings;
  integration: IntegrationSettings;
  
  // Display behavior
  display: {
    trigger: 'immediate' | 'scroll' | 'time' | 'exit-intent' | 'click';
    triggerValue?: number;                // Scroll %, seconds, etc.
    frequency: 'always' | 'once' | 'session' | 'days';
    frequencyValue?: number;              // Days between shows
    showOnMobile: boolean;
    showOnDesktop: boolean;
    animation: 'none' | 'fade' | 'slide-up' | 'slide-down' | 'scale' | 'bounce';
  };
  
  // Distribution (which posts to show on)
  distribution: {
    type: 'none' | 'all' | 'selected' | 'tag' | 'category';
    postIds?: string[];                   // If 'selected'
    tagSlugs?: string[];                  // If 'tag'
    categorySlugs?: string[];             // If 'category'
    position: 'after-intro' | 'middle' | 'end' | 'popup' | 'floating' | 'custom';
    customSelector?: string;              // CSS selector for 'custom' position
    priority: number;                     // Higher = shown if conflicts
  };
  
  // Analytics
  analytics: {
    impressions: number;
    submissions: number;
    conversionRate: number;
    lastShownAt: string | null;
  };
  
  // Meta
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}
```

---

## Database Schema Changes

### New Table: `lead_capture_templates`

```sql
-- =====================================================
-- LEAD CAPTURE TEMPLATES TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS lead_capture_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Identity
    name TEXT NOT NULL,
    template_id TEXT NOT NULL DEFAULT 'minimal-newsletter',
    
    -- Configuration (all settings in JSONB for flexibility)
    layout_config JSONB NOT NULL DEFAULT '{}',
    color_config JSONB NOT NULL DEFAULT '{}',
    typography_config JSONB NOT NULL DEFAULT '{}',
    image_config JSONB NOT NULL DEFAULT '{}',
    content_config JSONB NOT NULL DEFAULT '{}',
    field_config JSONB NOT NULL DEFAULT '{}',
    integration_config JSONB NOT NULL DEFAULT '{}',
    display_config JSONB NOT NULL DEFAULT '{}',
    
    -- Distribution
    distribution_type TEXT NOT NULL DEFAULT 'none' 
        CHECK (distribution_type IN ('none', 'all', 'selected', 'tag', 'category')),
    distribution_post_ids UUID[] DEFAULT '{}',
    distribution_tag_slugs TEXT[] DEFAULT '{}',
    distribution_category_slugs TEXT[] DEFAULT '{}',
    distribution_position TEXT NOT NULL DEFAULT 'end'
        CHECK (distribution_position IN ('after-intro', 'middle', 'end', 'popup', 'floating', 'custom')),
    distribution_custom_selector TEXT,
    distribution_priority INTEGER DEFAULT 0,
    
    -- Linked autoresponder
    autoresponder_id UUID REFERENCES autoresponder_integrations(id) ON DELETE SET NULL,
    
    -- Analytics
    impressions INTEGER DEFAULT 0,
    submissions INTEGER DEFAULT 0,
    last_shown_at TIMESTAMPTZ,
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for distribution queries
CREATE INDEX idx_templates_distribution ON lead_capture_templates(distribution_type, is_active);
CREATE INDEX idx_templates_autoresponder ON lead_capture_templates(autoresponder_id);

-- Trigger for updated_at
CREATE TRIGGER update_lead_capture_templates_updated_at
    BEFORE UPDATE ON lead_capture_templates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
```

### Alter `blog_posts` Table

```sql
-- Add lead capture override to blog posts
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS 
    lead_capture_template_id UUID REFERENCES lead_capture_templates(id) ON DELETE SET NULL;

ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS 
    lead_capture_position TEXT DEFAULT NULL;

ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS 
    lead_capture_disabled BOOLEAN DEFAULT false;

-- Index for template lookup
CREATE INDEX IF NOT EXISTS idx_posts_lead_capture 
    ON blog_posts(lead_capture_template_id) 
    WHERE lead_capture_template_id IS NOT NULL;
```

### Junction Table for Selected Posts (Alternative)

```sql
-- Alternative: Many-to-many relationship for selected posts
CREATE TABLE IF NOT EXISTS template_post_assignments (
    template_id UUID NOT NULL REFERENCES lead_capture_templates(id) ON DELETE CASCADE,
    post_id UUID NOT NULL REFERENCES blog_posts(id) ON DELETE CASCADE,
    position_override TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (template_id, post_id)
);
```

---

## Post Integration: Two-Way Flow

### Flow 1: From Post Editor → Select Form

```
┌─────────────────────────────────────────────────────────────┐
│  POST EDITOR                                                │
│  ─────────────────────────────────────────────────────────  │
│                                                             │
│  📝 Title: How to Build an Email List                       │
│  ─────────────────────────────────────────────────────────  │
│                                                             │
│  [Content editor...]                                        │
│                                                             │
│  ─────────────────────────────────────────────────────────  │
│  📋 Lead Capture Form                                       │
│  ─────────────────────────────────────────────────────────  │
│                                                             │
│  ○ Use default (from autoresponder global settings)        │
│  ● Select specific form:                                    │
│    ┌─────────────────────────────────────────────────────┐ │
│    │  📧 Newsletter Signup          [Preview]            │ │
│    │     Minimal style • 2,450 subs                      │ │
│    │  ─────────────────────────────────────────────────  │ │
│    │  📘 Free Ebook Download        [Preview]  ← Active  │ │
│    │     Content upgrade • 890 subs                      │ │
│    │  ─────────────────────────────────────────────────  │ │
│    │  💡 Weekly Tips                [Preview]            │ │
│    │     Inline article • 1,200 subs                     │ │
│    └─────────────────────────────────────────────────────┘ │
│  ○ No form on this post                                    │
│                                                             │
│  Position: [End of post ▼]                                  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Flow 2: From Autoresponders → Apply to Posts

```
┌─────────────────────────────────────────────────────────────┐
│  AUTORESPONDERS → Newsletter Signup Form                    │
│  ─────────────────────────────────────────────────────────  │
│                                                             │
│  [Editor tabs: Design | Content | Fields | Settings]        │
│                                                             │
│  ─────────────────────────────────────────────────────────  │
│  📍 Distribution Settings                                   │
│  ─────────────────────────────────────────────────────────  │
│                                                             │
│  Show this form on:                                         │
│                                                             │
│  ○ Manual only (use via post editor or shortcode)          │
│  ○ All posts                                               │
│  ● Selected posts:                                          │
│    ┌─────────────────────────────────────────────────────┐ │
│    │ 🔍 Search posts...                                  │ │
│    ├─────────────────────────────────────────────────────┤ │
│    │ ☑ How to Build an Email List                       │ │
│    │ ☑ 10 Tips for Email Marketing                      │ │
│    │ ☐ My Journey as a Creator                          │ │
│    │ ☐ Why Newsletters Beat Social Media                │ │
│    │ ☑ Email vs Social: The Ultimate Guide              │ │
│    └─────────────────────────────────────────────────────┘ │
│  ○ Posts with tag: [Dropdown multi-select]                 │
│  ○ Posts in category: [Dropdown multi-select]              │
│                                                             │
│  ─────────────────────────────────────────────────────────  │
│  Position in posts: [End of post ▼]                         │
│  Priority: [1] (higher = wins if conflict)                  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Conflict Resolution Logic

When multiple forms could apply to a post:

```typescript
function resolveFormForPost(postId: string): LeadCaptureTemplate | null {
  // 1. Check if post has lead capture disabled
  const post = getPost(postId);
  if (post.lead_capture_disabled) return null;
  
  // 2. Check for explicit post-level override (highest priority)
  if (post.lead_capture_template_id) {
    return getTemplate(post.lead_capture_template_id);
  }
  
  // 3. Find all templates that could apply to this post
  const applicableTemplates = templates.filter(t => {
    if (!t.is_active) return false;
    
    switch (t.distribution_type) {
      case 'all':
        return true;
      case 'selected':
        return t.distribution_post_ids.includes(postId);
      case 'tag':
        return post.tags.some(tag => t.distribution_tag_slugs.includes(tag));
      case 'category':
        return post.categories.some(cat => t.distribution_category_slugs.includes(cat));
      default:
        return false;
    }
  });
  
  // 4. Sort by priority (descending) and return highest
  applicableTemplates.sort((a, b) => b.distribution_priority - a.distribution_priority);
  return applicableTemplates[0] || null;
}
```

---

## API Endpoints

### Lead Capture Templates CRUD

```
GET    /api/lead-templates              # List all templates
GET    /api/lead-templates/:id          # Get single template
POST   /api/lead-templates              # Create new template
PUT    /api/lead-templates/:id          # Update template
DELETE /api/lead-templates/:id          # Delete template

GET    /api/lead-templates/:id/preview  # Get rendered HTML preview
POST   /api/lead-templates/:id/duplicate # Duplicate a template

GET    /api/lead-templates/for-post/:postId  # Get applicable template for a post
```

### Template Submissions

```
POST   /api/lead-templates/:id/submit   # Handle form submission
GET    /api/lead-templates/:id/stats    # Get conversion stats
```

---

## UI Components to Build

### 1. Template Gallery (`/admin/autoresponders/templates`)
- Grid of 10 pre-made templates with previews
- "Use This Template" button → opens editor with base config

### 2. Template Editor (`/admin/autoresponders/templates/[id]`)
- Tab-based interface: Design | Content | Fields | Integration | Distribution
- Live preview panel (left/right split or floating)
- Save as draft / Publish toggle

### 3. Post Editor Integration
- "Lead Capture" section/block in post editor
- Form selector dropdown with previews
- Position selector
- "Disable for this post" toggle

### 4. Template Preview Modal
- Full-size preview of how template will look
- Desktop/tablet/mobile toggle
- "Use Template" / "Edit" buttons

---

## Implementation Phases

### Phase 1: Foundation (3-4 days)
- [ ] Create database migration
- [ ] Build API endpoints (CRUD)
- [ ] Create TypeScript interfaces
- [ ] Set up template storage logic

### Phase 2: Template Library (3-4 days)
- [ ] Design and code 10 base templates as React components
- [ ] Create template registry/factory
- [ ] Build template preview renderer
- [ ] Add Google Fonts integration

### Phase 3: Visual Editor (5-6 days)
- [ ] Build editor UI with tabs
- [ ] Create color picker component
- [ ] Create typography selector
- [ ] Create image uploader integration
- [ ] Build field editor (add/remove/reorder)
- [ ] Implement live preview

### Phase 4: Distribution Settings (2-3 days)
- [ ] Build distribution UI in editor
- [ ] Create post selector modal
- [ ] Add tag/category selectors
- [ ] Implement conflict resolution logic

### Phase 5: Post Integration (2-3 days)
- [ ] Add lead capture section to post editor
- [ ] Build form selector with previews
- [ ] Implement template rendering in posts
- [ ] Handle position insertion logic

### Phase 6: Polish & Testing (2-3 days)
- [ ] Mobile responsiveness
- [ ] Form validation
- [ ] A/B testing support (optional)
- [ ] Analytics dashboard integration
- [ ] End-to-end testing

---

## Open Questions to Decide

1. **Editor Complexity**: 
   - Simple panel editor with live preview (recommended)
   - Full drag-and-drop builder (complex, may be overkill)

2. **Image Storage**: 
   - Use existing Supabase storage?
   - Integrate with CDN like Cloudinary?

3. **Font Loading**: 
   - Pre-load top 20 Google Fonts?
   - Dynamic loading based on selection?

4. **A/B Testing**: 
   - Include in v1?
   - Defer to future iteration?

5. **Animation Library**: 
   - CSS only?
   - Framer Motion?
   - GSAP for fancy effects?

---

## Notes

- All templates must be fully theme-aware (use CSS variables)
- Templates should render correctly even without JavaScript (progressive enhancement)
- Mobile-first design for all templates
- Accessibility requirements: ARIA labels, keyboard navigation, screen reader support
