-- =====================================================
-- HEATMAP & ADVANCED ANALYTICS TRACKING
-- Real-time user behavior tracking
-- =====================================================

-- =====================================================
-- 1. HEATMAP EVENTS
-- Capture mouse movements, clicks, scrolls
-- =====================================================
CREATE TABLE IF NOT EXISTS heatmap_events (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id text NOT NULL, -- Anonymous session identifier
    page_path text NOT NULL,
    event_type text NOT NULL CHECK (event_type IN ('click', 'move', 'scroll', 'hover', 'rage_click')),
    
    -- Position data
    x integer, -- X coordinate
    y integer, -- Y coordinate
    viewport_width integer,
    viewport_height integer,
    page_height integer,
    scroll_depth integer, -- For scroll events (percentage)
    
    -- Element data
    element_tag text,
    element_id text,
    element_class text,
    element_text text, -- First 100 chars of element text
    
    -- Context
    device_type text CHECK (device_type IN ('desktop', 'tablet', 'mobile')),
    browser text,
    os text,
    
    -- Metadata
    metadata jsonb DEFAULT '{}',
    created_at timestamptz DEFAULT now()
);

-- Partition by date for performance (events can be millions)
CREATE INDEX IF NOT EXISTS idx_heatmap_events_session ON heatmap_events(session_id);
CREATE INDEX IF NOT EXISTS idx_heatmap_events_page ON heatmap_events(page_path);
CREATE INDEX IF NOT EXISTS idx_heatmap_events_type ON heatmap_events(event_type);
CREATE INDEX IF NOT EXISTS idx_heatmap_events_created ON heatmap_events(created_at DESC);

-- Composite index for common queries
CREATE INDEX IF NOT EXISTS idx_heatmap_events_page_type ON heatmap_events(page_path, event_type);

-- =====================================================
-- 2. SESSION RECORDINGS (Metadata only)
-- Track user sessions for replay context
-- =====================================================
CREATE TABLE IF NOT EXISTS sessions (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id text UNIQUE NOT NULL,
    
    -- Visitor info
    visitor_id text, -- Persistent visitor identifier (cookie)
    ip_hash text, -- Hashed IP for privacy
    
    -- Device info
    device_type text CHECK (device_type IN ('desktop', 'tablet', 'mobile')),
    browser text,
    browser_version text,
    os text,
    os_version text,
    screen_width integer,
    screen_height integer,
    
    -- Session metrics
    entry_page text,
    exit_page text,
    page_count integer DEFAULT 1,
    event_count integer DEFAULT 0,
    duration_seconds integer DEFAULT 0,
    
    -- Engagement
    max_scroll_depth integer DEFAULT 0, -- Highest scroll percentage reached
    click_count integer DEFAULT 0,
    rage_click_count integer DEFAULT 0,
    
    -- Traffic source
    referrer text,
    utm_source text,
    utm_medium text,
    utm_campaign text,
    utm_term text,
    utm_content text,
    
    -- Location (approximate)
    country text,
    region text,
    city text,
    
    -- Conversion tracking
    converted boolean DEFAULT false,
    conversion_type text,
    conversion_value numeric(10,2),
    
    -- Metadata
    metadata jsonb DEFAULT '{}',
    started_at timestamptz DEFAULT now(),
    ended_at timestamptz,
    last_activity_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sessions_visitor ON sessions(visitor_id);
CREATE INDEX IF NOT EXISTS idx_sessions_started ON sessions(started_at DESC);
CREATE INDEX IF NOT EXISTS idx_sessions_converted ON sessions(converted) WHERE converted = true;
CREATE INDEX IF NOT EXISTS idx_sessions_device ON sessions(device_type);

-- =====================================================
-- 3. LEADS
-- Captured leads with AI scoring
-- =====================================================
CREATE TABLE IF NOT EXISTS leads (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id text REFERENCES sessions(session_id) ON DELETE SET NULL,
    
    -- Contact info
    email text,
    name text,
    company text,
    phone text,
    
    -- Source
    source text DEFAULT 'website', -- 'website', 'popup', 'contact_form', 'newsletter'
    source_page text,
    referrer text,
    
    -- AI Scoring
    ai_score integer CHECK (ai_score >= 0 AND ai_score <= 100),
    ai_score_reasons jsonb DEFAULT '[]', -- Array of scoring reasons
    ai_classification text, -- 'hot', 'warm', 'cold', 'spam'
    ai_summary text, -- AI-generated lead summary
    
    -- Behavior signals
    pages_viewed integer DEFAULT 0,
    time_on_site_seconds integer DEFAULT 0,
    blog_posts_read integer DEFAULT 0,
    scroll_depth_avg integer DEFAULT 0,
    
    -- Status
    status text DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'qualified', 'converted', 'lost', 'spam')),
    notes text,
    
    -- Metadata
    utm_source text,
    utm_medium text,
    utm_campaign text,
    metadata jsonb DEFAULT '{}',
    
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    contacted_at timestamptz,
    converted_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_leads_email ON leads(email);
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_score ON leads(ai_score DESC);
CREATE INDEX IF NOT EXISTS idx_leads_created ON leads(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_leads_classification ON leads(ai_classification);

-- =====================================================
-- 4. HEATMAP AGGREGATES
-- Pre-computed heatmap data for fast rendering
-- =====================================================
CREATE TABLE IF NOT EXISTS heatmap_aggregates (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    page_path text NOT NULL,
    event_type text NOT NULL,
    date date NOT NULL,
    device_type text NOT NULL,
    
    -- Grid-based aggregation (divide page into 50x100 grid)
    grid_data jsonb NOT NULL, -- Array of {x, y, count} objects
    
    -- Stats
    total_events integer DEFAULT 0,
    unique_sessions integer DEFAULT 0,
    
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    
    UNIQUE(page_path, event_type, date, device_type)
);

CREATE INDEX IF NOT EXISTS idx_heatmap_agg_page ON heatmap_aggregates(page_path);
CREATE INDEX IF NOT EXISTS idx_heatmap_agg_date ON heatmap_aggregates(date DESC);

-- =====================================================
-- 5. RLS POLICIES
-- =====================================================
ALTER TABLE heatmap_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE heatmap_aggregates ENABLE ROW LEVEL SECURITY;

-- Drop existing policies first
DROP POLICY IF EXISTS "Allow public insert heatmap_events" ON heatmap_events;
DROP POLICY IF EXISTS "Allow authenticated read heatmap_events" ON heatmap_events;
DROP POLICY IF EXISTS "Allow public insert sessions" ON sessions;
DROP POLICY IF EXISTS "Allow public update sessions" ON sessions;
DROP POLICY IF EXISTS "Allow authenticated read sessions" ON sessions;
DROP POLICY IF EXISTS "Allow authenticated all leads" ON leads;
DROP POLICY IF EXISTS "Allow public insert leads" ON leads;
DROP POLICY IF EXISTS "Allow authenticated read heatmap_aggregates" ON heatmap_aggregates;
DROP POLICY IF EXISTS "Service role manages heatmap_aggregates" ON heatmap_aggregates;

-- Heatmap events - public insert (tracking), authenticated read
CREATE POLICY "Allow public insert heatmap_events" ON heatmap_events
    FOR INSERT TO anon
    WITH CHECK (true);

CREATE POLICY "Allow authenticated read heatmap_events" ON heatmap_events
    FOR SELECT TO authenticated
    USING (true);

-- Sessions - public insert, authenticated read
CREATE POLICY "Allow public insert sessions" ON sessions
    FOR INSERT TO anon
    WITH CHECK (true);

CREATE POLICY "Allow public update sessions" ON sessions
    FOR UPDATE TO anon
    USING (true);

CREATE POLICY "Allow authenticated read sessions" ON sessions
    FOR SELECT TO authenticated
    USING (true);

-- Leads - authenticated full access
CREATE POLICY "Allow authenticated all leads" ON leads
    FOR ALL TO authenticated
    USING (true);

-- Allow anon insert for lead capture forms
CREATE POLICY "Allow public insert leads" ON leads
    FOR INSERT TO anon
    WITH CHECK (true);

-- Aggregates - authenticated read only
CREATE POLICY "Allow authenticated read heatmap_aggregates" ON heatmap_aggregates
    FOR SELECT TO authenticated
    USING (true);

CREATE POLICY "Service role manages heatmap_aggregates" ON heatmap_aggregates
    FOR ALL TO service_role
    USING (true);

-- =====================================================
-- 6. HELPER FUNCTIONS
-- =====================================================

-- Function to update session on new activity
CREATE OR REPLACE FUNCTION update_session_activity()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE sessions
    SET 
        event_count = event_count + 1,
        last_activity_at = now(),
        max_scroll_depth = GREATEST(max_scroll_depth, COALESCE(NEW.scroll_depth, 0)),
        click_count = CASE WHEN NEW.event_type = 'click' THEN click_count + 1 ELSE click_count END,
        rage_click_count = CASE WHEN NEW.event_type = 'rage_click' THEN rage_click_count + 1 ELSE rage_click_count END
    WHERE session_id = NEW.session_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS heatmap_event_update_session ON heatmap_events;
CREATE TRIGGER heatmap_event_update_session
    AFTER INSERT ON heatmap_events
    FOR EACH ROW
    EXECUTE FUNCTION update_session_activity();

-- Function to calculate session duration on end
CREATE OR REPLACE FUNCTION finalize_session(p_session_id text)
RETURNS void AS $$
BEGIN
    UPDATE sessions
    SET 
        ended_at = now(),
        duration_seconds = EXTRACT(EPOCH FROM (now() - started_at))::integer
    WHERE session_id = p_session_id;
END;
$$ LANGUAGE plpgsql;

-- Update leads timestamp
CREATE OR REPLACE FUNCTION update_leads_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_leads_updated_at ON leads;
CREATE TRIGGER update_leads_updated_at
    BEFORE UPDATE ON leads
    FOR EACH ROW
    EXECUTE FUNCTION update_leads_updated_at();
