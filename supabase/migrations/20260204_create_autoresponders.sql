-- =====================================================
-- AUTORESPONDER INTEGRATIONS
-- Stores API credentials and settings for email marketing providers
-- Created: 2026-02-04
-- =====================================================

-- Drop existing table if recreating
DROP TABLE IF EXISTS form_embeds CASCADE;
DROP TABLE IF EXISTS autoresponder_integrations CASCADE;

-- =====================================================
-- AUTORESPONDER INTEGRATIONS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS autoresponder_integrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Provider identification
    provider TEXT NOT NULL CHECK (provider IN (
        'mailchimp', 
        'convertkit', 
        'activecampaign', 
        'aweber', 
        'brevo',
        'custom'  -- For generic/unsupported providers
    )),
    name TEXT NOT NULL,  -- User-friendly name (e.g., "Main Newsletter")
    
    -- Authentication
    api_key TEXT,                    -- Primary API key
    api_secret TEXT,                 -- Secondary key if needed
    api_url TEXT,                    -- Base URL (for ActiveCampaign, custom)
    
    -- OAuth tokens (for AWeber and providers using OAuth)
    access_token TEXT,
    refresh_token TEXT,
    token_expires_at TIMESTAMPTZ,
    
    -- Default list/audience/form
    default_list_id TEXT,            -- List/Audience ID
    default_list_name TEXT,          -- Human-readable name
    default_form_id TEXT,            -- Form ID (ConvertKit, etc.)
    default_tag_ids TEXT[],          -- Tags to apply (ConvertKit, etc.)
    
    -- Cached data from provider
    cached_lists JSONB DEFAULT '[]',      -- [{id, name, subscriberCount}]
    cached_forms JSONB DEFAULT '[]',      -- [{id, name}]
    cached_tags JSONB DEFAULT '[]',       -- [{id, name}]
    cached_campaigns JSONB DEFAULT '[]',  -- [{id, name, status}]
    cache_updated_at TIMESTAMPTZ,
    
    -- Custom provider settings
    custom_subscribe_url TEXT,       -- For custom: POST endpoint
    custom_email_field TEXT DEFAULT 'email',  -- Field name for email
    custom_name_field TEXT DEFAULT 'name',    -- Field name for name
    custom_headers JSONB DEFAULT '{}',        -- Custom headers to send
    custom_body_template JSONB DEFAULT '{}',  -- Body template with placeholders
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    is_default BOOLEAN DEFAULT false,  -- Default integration for lead capture
    is_verified BOOLEAN DEFAULT false, -- Credentials verified
    last_verified_at TIMESTAMPTZ,
    last_error TEXT,
    
    -- Sync tracking
    total_synced INTEGER DEFAULT 0,
    last_synced_at TIMESTAMPTZ,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Only one default integration
CREATE UNIQUE INDEX IF NOT EXISTS idx_autoresponder_default 
    ON autoresponder_integrations(is_default) 
    WHERE is_default = true;

-- Unique provider (only one integration per provider type)
CREATE UNIQUE INDEX IF NOT EXISTS idx_autoresponder_provider 
    ON autoresponder_integrations(provider);

-- =====================================================
-- FORM EMBEDS TABLE  
-- Stores custom HTML/JS forms that users paste
-- =====================================================

CREATE TABLE IF NOT EXISTS form_embeds (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Basic info
    name TEXT NOT NULL,
    description TEXT,
    
    -- The raw embed code
    html_content TEXT NOT NULL,
    
    -- Rendering mode
    render_mode TEXT NOT NULL DEFAULT 'strip_design' CHECK (
        render_mode IN ('strip_design', 'use_original')
    ),
    
    -- Parsed form data (populated when render_mode = 'strip_design')
    parsed_action TEXT,              -- Form action URL
    parsed_method TEXT DEFAULT 'POST',
    parsed_fields JSONB DEFAULT '[]', -- [{name, type, label, placeholder, required}]
    parsed_hidden_fields JSONB DEFAULT '{}', -- {name: value}
    parsed_submit_text TEXT DEFAULT 'Subscribe',
    
    -- Styling overrides (for strip_design mode)
    custom_styles JSONB DEFAULT '{}', -- {buttonColor, inputStyle, etc.}
    
    -- Associated autoresponder (optional)
    autoresponder_id UUID REFERENCES autoresponder_integrations(id) ON DELETE SET NULL,
    
    -- Also save to local leads?
    save_to_local BOOLEAN DEFAULT true,
    
    -- Placement configuration
    placement TEXT DEFAULT 'popup' CHECK (
        placement IN ('popup', 'inline', 'footer', 'sidebar', 'custom')
    ),
    placement_selector TEXT,         -- CSS selector for custom placement
    
    -- Trigger settings (for popup)
    trigger_type TEXT DEFAULT 'exit_intent' CHECK (
        trigger_type IN ('exit_intent', 'scroll', 'time', 'click', 'manual')
    ),
    trigger_value TEXT,              -- scroll %, seconds, selector
    
    -- Display rules
    show_on_pages TEXT[] DEFAULT ARRAY['*'], -- Page paths (* = all)
    hide_on_pages TEXT[] DEFAULT ARRAY[]::TEXT[],
    show_to TEXT DEFAULT 'all' CHECK (
        show_to IN ('all', 'new_visitors', 'returning_visitors')
    ),
    max_impressions INTEGER,         -- NULL = unlimited
    
    -- A/B testing
    variant_name TEXT,
    variant_group TEXT,
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    
    -- Stats
    impressions INTEGER DEFAULT 0,
    submissions INTEGER DEFAULT 0,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for quick lookup
CREATE INDEX IF NOT EXISTS idx_form_embeds_active 
    ON form_embeds(is_active) 
    WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_form_embeds_placement 
    ON form_embeds(placement);

-- =====================================================
-- LEAD SYNC LOG
-- Track sync attempts to autoresponders
-- =====================================================

CREATE TABLE IF NOT EXISTS lead_sync_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id UUID NOT NULL,  -- References leads table
    autoresponder_id UUID REFERENCES autoresponder_integrations(id) ON DELETE CASCADE,
    
    -- Sync details
    status TEXT NOT NULL CHECK (status IN ('pending', 'success', 'failed', 'skipped')),
    provider TEXT NOT NULL,
    provider_subscriber_id TEXT,     -- ID returned by provider
    
    -- Error tracking
    error_message TEXT,
    error_code TEXT,
    retry_count INTEGER DEFAULT 0,
    next_retry_at TIMESTAMPTZ,
    
    -- Request/Response for debugging
    request_payload JSONB,
    response_payload JSONB,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    synced_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_lead_sync_lead 
    ON lead_sync_log(lead_id);

CREATE INDEX IF NOT EXISTS idx_lead_sync_status 
    ON lead_sync_log(status) 
    WHERE status IN ('pending', 'failed');

-- =====================================================
-- UPDATE LEADS TABLE
-- Add autoresponder sync fields
-- =====================================================

DO $$
BEGIN
    -- Add sync status column if not exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'leads' AND column_name = 'autoresponder_synced'
    ) THEN
        ALTER TABLE leads ADD COLUMN autoresponder_synced BOOLEAN DEFAULT false;
    END IF;
    
    -- Add sync timestamp
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'leads' AND column_name = 'autoresponder_synced_at'
    ) THEN
        ALTER TABLE leads ADD COLUMN autoresponder_synced_at TIMESTAMPTZ;
    END IF;
    
    -- Add form embed reference
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'leads' AND column_name = 'form_embed_id'
    ) THEN
        ALTER TABLE leads ADD COLUMN form_embed_id UUID REFERENCES form_embeds(id) ON DELETE SET NULL;
    END IF;
END $$;

-- =====================================================
-- RLS POLICIES
-- =====================================================

-- Enable RLS
ALTER TABLE autoresponder_integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE form_embeds ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_sync_log ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Service role full access to autoresponder_integrations" ON autoresponder_integrations;
DROP POLICY IF EXISTS "Service role full access to form_embeds" ON form_embeds;
DROP POLICY IF EXISTS "Service role full access to lead_sync_log" ON lead_sync_log;

-- Autoresponder integrations - service role only (contains API keys)
CREATE POLICY "Service role full access to autoresponder_integrations"
    ON autoresponder_integrations
    FOR ALL
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');

-- Form embeds - service role for admin, anon can read active
CREATE POLICY "Service role full access to form_embeds"
    ON form_embeds
    FOR ALL
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Public can read active form embeds"
    ON form_embeds
    FOR SELECT
    USING (is_active = true);

-- Lead sync log - service role only
CREATE POLICY "Service role full access to lead_sync_log"
    ON lead_sync_log
    FOR ALL
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_autoresponder_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS autoresponder_integrations_updated ON autoresponder_integrations;
CREATE TRIGGER autoresponder_integrations_updated
    BEFORE UPDATE ON autoresponder_integrations
    FOR EACH ROW EXECUTE FUNCTION update_autoresponder_timestamp();

DROP TRIGGER IF EXISTS form_embeds_updated ON form_embeds;
CREATE TRIGGER form_embeds_updated
    BEFORE UPDATE ON form_embeds
    FOR EACH ROW EXECUTE FUNCTION update_autoresponder_timestamp();

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON TABLE autoresponder_integrations IS 'Email marketing provider integrations with API credentials and cached data';
COMMENT ON TABLE form_embeds IS 'Custom HTML/JS forms pasted by users with parsing and rendering options';
COMMENT ON TABLE lead_sync_log IS 'Track lead sync attempts to external autoresponders';

COMMENT ON COLUMN autoresponder_integrations.provider IS 'Provider type: mailchimp, convertkit, activecampaign, aweber, brevo, custom';
COMMENT ON COLUMN autoresponder_integrations.cached_lists IS 'Cached lists/audiences fetched from provider API';
COMMENT ON COLUMN form_embeds.render_mode IS 'strip_design: parse and use site styling, use_original: render as-is';
COMMENT ON COLUMN form_embeds.parsed_fields IS 'Extracted form fields when using strip_design mode';
