-- =====================================================
-- ANWE.SH - Blog Posts Table
-- Created: 2026-02-02
-- Description: Blog/Insights posts for the personal site
-- =====================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- BLOG POSTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS blog_posts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Content
    title TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    excerpt TEXT,
    content TEXT NOT NULL,
    
    -- Metadata
    cover_image TEXT,
    category TEXT NOT NULL DEFAULT 'General',
    tags TEXT[] DEFAULT '{}',
    
    -- Reading
    reading_time TEXT,
    word_count INTEGER,
    
    -- Publishing
    published BOOLEAN DEFAULT FALSE,
    published_at TIMESTAMPTZ,
    featured BOOLEAN DEFAULT FALSE,
    
    -- SEO
    meta_title TEXT,
    meta_description TEXT,
    
    -- Author (for future multi-author support)
    author_name TEXT DEFAULT 'Anwesh Rath',
    author_avatar TEXT,
    
    -- Source tracking (for AI-generated content)
    source TEXT DEFAULT 'manual', -- 'manual', 'ora', 'agent'
    source_agent TEXT, -- which agent created it
    source_prompt TEXT, -- original prompt if AI-generated
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- INDEXES
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_blog_posts_slug ON blog_posts(slug);
CREATE INDEX IF NOT EXISTS idx_blog_posts_published ON blog_posts(published, published_at DESC);
CREATE INDEX IF NOT EXISTS idx_blog_posts_category ON blog_posts(category);
CREATE INDEX IF NOT EXISTS idx_blog_posts_featured ON blog_posts(featured) WHERE featured = TRUE;

-- =====================================================
-- UPDATED_AT TRIGGER
-- =====================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_blog_posts_updated_at ON blog_posts;
CREATE TRIGGER update_blog_posts_updated_at
    BEFORE UPDATE ON blog_posts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- ROW LEVEL SECURITY
-- =====================================================
ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;

-- Drop existing policies first
DROP POLICY IF EXISTS "Public can read published posts" ON blog_posts;
DROP POLICY IF EXISTS "Service role has full access" ON blog_posts;

-- Public can read published posts
CREATE POLICY "Public can read published posts"
    ON blog_posts
    FOR SELECT
    USING (published = TRUE);

-- Service role can do everything (for API/agents)
CREATE POLICY "Service role has full access"
    ON blog_posts
    FOR ALL
    USING (auth.role() = 'service_role');

-- =====================================================
-- COMMENTS
-- =====================================================
COMMENT ON TABLE blog_posts IS 'Blog/Insights posts for anwe.sh';
COMMENT ON COLUMN blog_posts.source IS 'How the post was created: manual, ora (AI), or specific agent name';
COMMENT ON COLUMN blog_posts.source_agent IS 'If AI-generated, which agent created it';
COMMENT ON COLUMN blog_posts.source_prompt IS 'If AI-generated, the original prompt used';

-- =====================================================
-- SAMPLE DATA (Optional - comment out in production)
-- =====================================================
INSERT INTO blog_posts (title, slug, excerpt, content, category, reading_time, published, published_at, source) VALUES
(
    'Why Most AI Implementations Fail (And How to Fix It)',
    'why-ai-implementations-fail',
    'After 17 years in enterprise systems, I''ve seen the same patterns destroy AI projects over and over. Here''s what actually works.',
    E'# Why Most AI Implementations Fail\n\nAfter 17 years building enterprise systems, I''ve watched companies pour millions into AI initiatives only to see them crumble. The pattern is always the same.\n\n## The Problem Isn''t the Technology\n\nEveryone blames the AI. "The model wasn''t accurate enough." "The data was bad." "We needed more training."\n\n**Wrong.**\n\nThe problem is almost never technical. It''s architectural.\n\n## Three Patterns That Kill AI Projects\n\n### 1. The Pilot Trap\n\nCompanies run a successful pilot, declare victory, then try to scale it. But pilots are designed to succeed. They have dedicated resources, hand-picked data, and motivated teams.\n\nProduction is different. Production is chaos.\n\n### 2. The Integration Nightmare\n\nAI doesn''t exist in a vacuum. It needs to talk to your CRM, your ERP, your legacy systems from 2003 that nobody understands anymore.\n\nMost teams underestimate this by 10x.\n\n### 3. The Maintenance Blind Spot\n\nYou built it. It works. You move on.\n\nSix months later, the model has drifted, the data pipeline is broken, and nobody knows how to fix it because the original team is gone.\n\n## What Actually Works\n\nThe companies that succeed treat AI like infrastructure, not a project.\n\n- **Design for production from day one**\n- **Build observability into everything**\n- **Own the maintenance story before launch**\n\nThis isn''t sexy. It doesn''t make good demos. But it''s the difference between a proof-of-concept and a production system that generates millions.',
    'AI Systems',
    '5 min',
    TRUE,
    '2026-01-28 10:00:00+00',
    'manual'
),
(
    'The Architecture of Scale: Lessons from Building for Billions',
    'architecture-of-scale',
    'What I learned during my time at Microsoft about building systems that don''t break when reality hits.',
    E'# The Architecture of Scale\n\nWhen I joined Microsoft, I thought I understood scale. I didn''t.\n\n## The Numbers That Break Your Brain\n\nAt enterprise scale, everything you thought you knew becomes wrong.\n\n- 1 million requests per second\n- 99.99% uptime required\n- Global distribution across 50+ regions\n- Teams of hundreds working on the same codebase\n\nThe rules change completely.\n\n## Principles That Actually Matter\n\n### 1. Everything Fails\n\nNot "might fail." Will fail. Design for it.\n\nEvery service, every database, every network call—assume it''s going to break at the worst possible moment.\n\n### 2. Simple Beats Clever\n\nThat elegant algorithm you''re proud of? It''s a liability.\n\nAt scale, boring is beautiful. Boring is maintainable. Boring is debuggable at 3 AM when production is on fire.\n\n### 3. Measure Everything\n\nYou can''t fix what you can''t see.\n\nInstrument aggressively. Log generously. Build dashboards before you think you need them.\n\n## The Meta-Lesson\n\nScale isn''t about technology. It''s about systems thinking.\n\nThe best engineers I worked with weren''t the smartest coders. They were the ones who could see the whole system, anticipate failure modes, and design for the reality of production.',
    'Enterprise',
    '6 min',
    TRUE,
    '2026-01-15 10:00:00+00',
    'manual'
),
(
    'The Psychology of Persuasion in Product Design',
    'psychology-of-persuasion',
    'How understanding human behavior transformed my approach to building products that people actually use.',
    E'# The Psychology of Persuasion in Product Design\n\nAfter leaving Microsoft, I went deep into psychology. NLP. Persuasion. Human behavior.\n\nIt changed everything about how I build products.\n\n## The Insight That Changed My Thinking\n\nPeople don''t buy products. They buy better versions of themselves.\n\nThis sounds like marketing fluff, but it''s actually a technical specification. It tells you exactly what to build and how to build it.\n\n## Practical Applications\n\n### Friction is a Feature\n\nSometimes you want friction. Sign-up flows that are too easy attract the wrong users.\n\nStrategic friction filters for intent.\n\n### Defaults Are Decisions\n\nEvery default you set is a decision you''re making for your user. Most people never change defaults.\n\nChoose wisely.\n\n### Progress Creates Momentum\n\nShow people how far they''ve come. Progress bars. Streaks. Levels.\n\nThis isn''t gamification. It''s acknowledging human psychology.\n\n## The Deeper Truth\n\nThe best products aren''t about technology. They''re about understanding people.\n\nStudy psychology. Study persuasion. Study what makes humans tick.\n\nThen encode that understanding into your systems.',
    'Product',
    '4 min',
    TRUE,
    '2026-01-05 10:00:00+00',
    'manual'
);
