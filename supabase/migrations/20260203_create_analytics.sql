-- ============================================
-- PAGE VIEWS TABLE
-- Internal analytics tracking
-- ============================================

CREATE TABLE IF NOT EXISTS page_views (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Page info
    path TEXT NOT NULL,
    title TEXT,
    
    -- Source
    referrer TEXT,
    utm_source TEXT,
    utm_medium TEXT,
    utm_campaign TEXT,
    
    -- Visitor info (anonymized)
    session_id TEXT,
    visitor_hash TEXT, -- Hashed IP/fingerprint for unique visitor counting
    
    -- Device info
    user_agent TEXT,
    device_type TEXT CHECK (device_type IN ('desktop', 'tablet', 'mobile', 'bot', 'unknown')),
    browser TEXT,
    os TEXT,
    
    -- Location (from IP geolocation)
    country TEXT,
    country_code TEXT,
    region TEXT,
    city TEXT,
    
    -- Performance
    load_time_ms INTEGER,
    
    -- Engagement
    time_on_page_seconds INTEGER,
    scroll_depth_percent INTEGER,
    
    -- Related content
    post_id UUID REFERENCES blog_posts(id) ON DELETE SET NULL,
    
    -- Timestamp
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE page_views ENABLE ROW LEVEL SECURITY;

-- Policies - only authenticated can read, anyone can insert (for tracking)
CREATE POLICY "Authenticated users can read page views" ON page_views
    FOR SELECT USING (auth.role() = 'authenticated');

-- Allow anonymous inserts for tracking (via service role in API)
CREATE POLICY "Allow anonymous inserts" ON page_views
    FOR INSERT WITH CHECK (true);

-- Indexes for analytics queries
CREATE INDEX IF NOT EXISTS idx_page_views_path ON page_views(path);
CREATE INDEX IF NOT EXISTS idx_page_views_created_at ON page_views(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_page_views_date ON page_views(date(created_at));
CREATE INDEX IF NOT EXISTS idx_page_views_visitor ON page_views(visitor_hash, created_at);
CREATE INDEX IF NOT EXISTS idx_page_views_session ON page_views(session_id);
CREATE INDEX IF NOT EXISTS idx_page_views_post ON page_views(post_id) WHERE post_id IS NOT NULL;

-- ============================================
-- ANALYTICS SUMMARY TABLE
-- Pre-aggregated daily stats for performance
-- ============================================

CREATE TABLE IF NOT EXISTS analytics_daily (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    date DATE NOT NULL,
    
    -- Overall stats
    total_views INTEGER NOT NULL DEFAULT 0,
    unique_visitors INTEGER NOT NULL DEFAULT 0,
    unique_sessions INTEGER NOT NULL DEFAULT 0,
    
    -- By page (JSONB for flexibility)
    page_stats JSONB NOT NULL DEFAULT '{}',
    
    -- By source
    source_stats JSONB NOT NULL DEFAULT '{}',
    
    -- By device
    device_stats JSONB NOT NULL DEFAULT '{}',
    
    -- By country
    country_stats JSONB NOT NULL DEFAULT '{}',
    
    -- Engagement
    avg_time_on_page_seconds DECIMAL(10, 2),
    avg_scroll_depth_percent DECIMAL(5, 2),
    bounce_rate_percent DECIMAL(5, 2),
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    
    UNIQUE(date)
);

-- Enable RLS
ALTER TABLE analytics_daily ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read analytics" ON analytics_daily
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Only service can write analytics" ON analytics_daily
    FOR ALL USING (auth.role() = 'authenticated');

-- Index
CREATE INDEX IF NOT EXISTS idx_analytics_daily_date ON analytics_daily(date DESC);
