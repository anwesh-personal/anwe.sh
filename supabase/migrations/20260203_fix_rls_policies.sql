-- =====================================================
-- FIX ALL RLS POLICIES - COMPREHENSIVE FIX
-- Date: 2026-02-03
-- 
-- PROBLEM: The old RLS policies used auth.role() = 'authenticated'
-- which doesn't work properly with Supabase's ANON key.
-- 
-- SOLUTION: Use auth.uid() IS NOT NULL to check for authenticated users.
-- This properly detects when a user is logged in.
-- =====================================================

-- =====================================================
-- 1. FIX SITE_SETTINGS
-- =====================================================
DROP POLICY IF EXISTS "Anyone can read site settings" ON site_settings;
DROP POLICY IF EXISTS "Authenticated users can update site settings" ON site_settings;
DROP POLICY IF EXISTS "Authenticated users can insert site settings" ON site_settings;
DROP POLICY IF EXISTS "Authenticated full access site_settings" ON site_settings;

-- Public read
CREATE POLICY "Anyone can read site settings" ON site_settings
    FOR SELECT USING (true);

-- Authenticated users can do everything
CREATE POLICY "Authenticated full access site_settings" ON site_settings
    FOR ALL USING (auth.uid() IS NOT NULL);

-- =====================================================
-- 2. FIX AGENTS
-- =====================================================
DROP POLICY IF EXISTS "Authenticated users can read agents" ON agents;
DROP POLICY IF EXISTS "Authenticated users can manage agents" ON agents;
DROP POLICY IF EXISTS "Authenticated full access agents" ON agents;

-- Authenticated full access
CREATE POLICY "Authenticated full access agents" ON agents
    FOR ALL USING (auth.uid() IS NOT NULL);

-- =====================================================
-- 3. FIX AGENT_RUNS
-- =====================================================
DROP POLICY IF EXISTS "Authenticated users can read agent runs" ON agent_runs;
DROP POLICY IF EXISTS "Authenticated users can manage agent runs" ON agent_runs;
DROP POLICY IF EXISTS "Authenticated full access agent_runs" ON agent_runs;

CREATE POLICY "Authenticated full access agent_runs" ON agent_runs
    FOR ALL USING (auth.uid() IS NOT NULL);

-- =====================================================
-- 4. FIX BLOG_POSTS
-- =====================================================
DROP POLICY IF EXISTS "Public can read published posts" ON blog_posts;
DROP POLICY IF EXISTS "Service role has full access" ON blog_posts;
DROP POLICY IF EXISTS "Authenticated full access blog_posts" ON blog_posts;

-- Public can read published
CREATE POLICY "Public can read published posts" ON blog_posts
    FOR SELECT USING (published = TRUE);

-- Authenticated full access
CREATE POLICY "Authenticated full access blog_posts" ON blog_posts
    FOR ALL USING (auth.uid() IS NOT NULL);

-- =====================================================
-- 5. FIX PAGE_VIEWS
-- =====================================================
DROP POLICY IF EXISTS "Authenticated users can read page views" ON page_views;
DROP POLICY IF EXISTS "Allow anonymous inserts" ON page_views;
DROP POLICY IF EXISTS "Authenticated full access page_views" ON page_views;
DROP POLICY IF EXISTS "Anyone can insert page_views" ON page_views;

-- Anyone can insert (for tracking)
CREATE POLICY "Anyone can insert page_views" ON page_views
    FOR INSERT WITH CHECK (true);

-- Authenticated can read
CREATE POLICY "Authenticated full access page_views" ON page_views
    FOR SELECT USING (auth.uid() IS NOT NULL);

-- =====================================================
-- 6. FIX ANALYTICS_DAILY
-- =====================================================
DROP POLICY IF EXISTS "Authenticated users can read analytics" ON analytics_daily;
DROP POLICY IF EXISTS "Only service can write analytics" ON analytics_daily;
DROP POLICY IF EXISTS "Authenticated full access analytics_daily" ON analytics_daily;

CREATE POLICY "Authenticated full access analytics_daily" ON analytics_daily
    FOR ALL USING (auth.uid() IS NOT NULL);

-- =====================================================
-- 7. FIX AI_PROVIDERS
-- =====================================================
DROP POLICY IF EXISTS "Allow authenticated read ai_providers" ON ai_providers;
DROP POLICY IF EXISTS "Service role manages ai_providers" ON ai_providers;
DROP POLICY IF EXISTS "Authenticated full access ai_providers" ON ai_providers;

CREATE POLICY "Authenticated full access ai_providers" ON ai_providers
    FOR ALL USING (auth.uid() IS NOT NULL);

-- =====================================================
-- 8. FIX AI_MODELS
-- =====================================================
DROP POLICY IF EXISTS "Allow authenticated read ai_models" ON ai_models;
DROP POLICY IF EXISTS "Service role manages ai_models" ON ai_models;
DROP POLICY IF EXISTS "Authenticated full access ai_models" ON ai_models;

CREATE POLICY "Authenticated full access ai_models" ON ai_models
    FOR ALL USING (auth.uid() IS NOT NULL);

-- =====================================================
-- 9. FIX AI_EXECUTIONS
-- =====================================================
DROP POLICY IF EXISTS "Allow authenticated read ai_executions" ON ai_executions;
DROP POLICY IF EXISTS "Allow authenticated insert ai_executions" ON ai_executions;
DROP POLICY IF EXISTS "Service role manages ai_executions" ON ai_executions;
DROP POLICY IF EXISTS "Authenticated full access ai_executions" ON ai_executions;

CREATE POLICY "Authenticated full access ai_executions" ON ai_executions
    FOR ALL USING (auth.uid() IS NOT NULL);

-- =====================================================
-- 10. FIX HEATMAP_EVENTS
-- =====================================================
DROP POLICY IF EXISTS "Allow public insert heatmap_events" ON heatmap_events;
DROP POLICY IF EXISTS "Allow authenticated read heatmap_events" ON heatmap_events;
DROP POLICY IF EXISTS "Anyone can insert heatmap_events" ON heatmap_events;
DROP POLICY IF EXISTS "Authenticated read heatmap_events" ON heatmap_events;

-- Anyone can insert (for tracking)
CREATE POLICY "Anyone can insert heatmap_events" ON heatmap_events
    FOR INSERT WITH CHECK (true);

-- Authenticated can read
CREATE POLICY "Authenticated read heatmap_events" ON heatmap_events
    FOR SELECT USING (auth.uid() IS NOT NULL);

-- =====================================================
-- 11. FIX SESSIONS
-- =====================================================
DROP POLICY IF EXISTS "Allow public insert sessions" ON sessions;
DROP POLICY IF EXISTS "Allow public update sessions" ON sessions;
DROP POLICY IF EXISTS "Allow authenticated read sessions" ON sessions;
DROP POLICY IF EXISTS "Anyone can insert sessions" ON sessions;
DROP POLICY IF EXISTS "Anyone can update sessions" ON sessions;
DROP POLICY IF EXISTS "Authenticated read sessions" ON sessions;

-- Anyone can insert/update (for tracking)
CREATE POLICY "Anyone can insert sessions" ON sessions
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can update sessions" ON sessions
    FOR UPDATE USING (true);

-- Authenticated can read
CREATE POLICY "Authenticated read sessions" ON sessions
    FOR SELECT USING (auth.uid() IS NOT NULL);

-- =====================================================
-- 12. FIX LEADS
-- =====================================================
DROP POLICY IF EXISTS "Allow authenticated all leads" ON leads;
DROP POLICY IF EXISTS "Allow public insert leads" ON leads;
DROP POLICY IF EXISTS "Anyone can insert leads" ON leads;
DROP POLICY IF EXISTS "Authenticated full access leads" ON leads;

-- Anyone can insert (lead capture)
CREATE POLICY "Anyone can insert leads" ON leads
    FOR INSERT WITH CHECK (true);

-- Authenticated full access
CREATE POLICY "Authenticated full access leads" ON leads
    FOR ALL USING (auth.uid() IS NOT NULL);

-- =====================================================
-- 13. FIX HEATMAP_AGGREGATES
-- =====================================================
DROP POLICY IF EXISTS "Allow authenticated read heatmap_aggregates" ON heatmap_aggregates;
DROP POLICY IF EXISTS "Service role manages heatmap_aggregates" ON heatmap_aggregates;
DROP POLICY IF EXISTS "Authenticated full access heatmap_aggregates" ON heatmap_aggregates;

CREATE POLICY "Authenticated full access heatmap_aggregates" ON heatmap_aggregates
    FOR ALL USING (auth.uid() IS NOT NULL);
