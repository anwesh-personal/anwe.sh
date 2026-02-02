-- ============================================
-- AGENTS TABLE
-- Core table for AI agent definitions
-- ============================================

CREATE TABLE IF NOT EXISTS agents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('orchestrator', 'content', 'visual', 'optimization', 'distribution', 'analytics', 'custom')),
    description TEXT,
    icon TEXT DEFAULT '🤖',
    
    -- AI Configuration
    model TEXT NOT NULL DEFAULT 'gpt-4-turbo',
    provider TEXT NOT NULL DEFAULT 'openai' CHECK (provider IN ('openai', 'anthropic', 'google', 'custom')),
    config JSONB NOT NULL DEFAULT '{}',
    
    -- Prompts
    system_prompt TEXT,
    
    -- Status
    status TEXT NOT NULL DEFAULT 'idle' CHECK (status IN ('active', 'idle', 'disabled', 'error', 'scheduled')),
    status_message TEXT,
    
    -- Stats
    last_run_at TIMESTAMPTZ,
    total_runs INTEGER NOT NULL DEFAULT 0,
    successful_runs INTEGER NOT NULL DEFAULT 0,
    failed_runs INTEGER NOT NULL DEFAULT 0,
    avg_duration_ms INTEGER,
    
    -- Settings
    is_public BOOLEAN NOT NULL DEFAULT false,
    is_enabled BOOLEAN NOT NULL DEFAULT true,
    rate_limit_per_hour INTEGER DEFAULT 60,
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by UUID REFERENCES auth.users(id),
    updated_by UUID REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE agents ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Authenticated users can read agents" ON agents
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can manage agents" ON agents
    FOR ALL USING (auth.role() = 'authenticated');

-- Indexes
CREATE INDEX IF NOT EXISTS idx_agents_status ON agents(status);
CREATE INDEX IF NOT EXISTS idx_agents_type ON agents(type);
CREATE INDEX IF NOT EXISTS idx_agents_slug ON agents(slug);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_agents_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER agents_updated_at
    BEFORE UPDATE ON agents
    FOR EACH ROW
    EXECUTE FUNCTION update_agents_updated_at();

-- ============================================
-- SEED DEFAULT AGENTS
-- ============================================

INSERT INTO agents (name, slug, type, description, icon, model, provider, system_prompt, status)
VALUES 
    ('ORA', 'ora', 'orchestrator', 'Central brain that coordinates all agents, parses commands, and delegates tasks', '🧠', 'gpt-4-turbo', 'openai', 
     'You are ORA, the central orchestrator of ANWE.SH. Your role is to parse user requests, break them into tasks, and delegate to specialized agents. Be efficient, clear, and always provide status updates.', 'active'),
    
    ('Writer', 'writer', 'content', 'Creates long-form blog content, articles, and documentation', '✍️', 'claude-3-opus', 'anthropic',
     'You are a professional technical writer for ANWE.SH. Write in a clear, authoritative voice. Focus on providing real value with actionable insights. Use markdown formatting.', 'active'),
    
    ('Imager', 'imager', 'visual', 'Generates images, graphics, and visual assets', '🎨', 'dall-e-3', 'openai',
     'Generate high-quality, professional images for blog posts and content. Style: modern, minimalist, tech-focused with subtle gradients.', 'active'),
    
    ('SEO', 'seo', 'optimization', 'Optimizes content for search engines and discoverability', '📊', 'gpt-4-turbo', 'openai',
     'Analyze content for SEO optimization. Suggest improvements for titles, meta descriptions, keywords, and content structure. Focus on E-E-A-T principles.', 'idle'),
    
    ('Social', 'social', 'distribution', 'Creates and posts social media content across platforms', '📱', 'gpt-4-turbo', 'openai',
     'Create engaging social media content. Twitter: concise and punchy. LinkedIn: professional and insightful. Include relevant hashtags and calls to action.', 'idle'),
    
    ('Analyst', 'analyst', 'analytics', 'Analyzes content performance and provides insights', '📈', 'gpt-4-turbo', 'openai',
     'Analyze content performance data. Identify trends, suggest improvements, and provide actionable recommendations backed by data.', 'scheduled')
ON CONFLICT (slug) DO NOTHING;
