-- =====================================================
-- AI PROVIDERS & MODELS INFRASTRUCTURE
-- Ported from Vanilla SaaS Template (Creaova-Multitenant-framework)
-- Adapted for single-tenant personal site
-- =====================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================
-- 1. AI PROVIDERS
-- Multiple entries per provider type allowed (e.g., multiple OpenAI keys)
-- =====================================================
CREATE TABLE IF NOT EXISTS ai_providers (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    name text NOT NULL,
    slug text NOT NULL,
    provider_type text NOT NULL CHECK (provider_type IN ('openai', 'anthropic', 'google', 'groq', 'mistral', 'cohere', 'custom')),
    api_key_encrypted text, -- Each provider entry has its own key
    base_url text, -- Custom endpoint (for proxies/local)
    models jsonb DEFAULT '[]', -- Quick access to available models
    is_active boolean DEFAULT true,
    is_default boolean DEFAULT false,
    priority integer DEFAULT 0, -- For fallback ordering (lower = higher priority)
    rate_limit_per_minute integer,
    rate_limit_per_day integer,
    -- Usage tracking
    total_requests integer DEFAULT 0,
    total_tokens_used bigint DEFAULT 0,
    total_cost_usd numeric(12,6) DEFAULT 0,
    last_used_at timestamptz,
    last_error_at timestamptz,
    consecutive_failures integer DEFAULT 0,
    -- Config
    settings jsonb DEFAULT '{}',
    metadata jsonb DEFAULT '{}',
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_ai_providers_type ON ai_providers(provider_type);
CREATE INDEX idx_ai_providers_active ON ai_providers(is_active);
CREATE INDEX idx_ai_providers_priority ON ai_providers(provider_type, priority);

-- =====================================================
-- 2. AI MODELS METADATA
-- =====================================================
CREATE TABLE IF NOT EXISTS ai_models (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    provider_id uuid REFERENCES ai_providers(id) ON DELETE CASCADE,
    name text NOT NULL,
    model_id text NOT NULL, -- e.g., 'gpt-4-turbo', 'claude-3-opus'
    display_name text,
    description text,
    provider_type text NOT NULL,
    context_window integer DEFAULT 8192,
    max_output_tokens integer DEFAULT 4096,
    input_cost_per_1k numeric(10,6) DEFAULT 0,
    output_cost_per_1k numeric(10,6) DEFAULT 0,
    capabilities jsonb DEFAULT '[]', -- ['chat', 'vision', 'function_calling', 'json_mode']
    is_active boolean DEFAULT true,
    is_default boolean DEFAULT false,
    metadata jsonb DEFAULT '{}',
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    UNIQUE(provider_id, model_id)
);

CREATE INDEX idx_ai_models_provider_id ON ai_models(provider_id);
CREATE INDEX idx_ai_models_type ON ai_models(provider_type);
CREATE INDEX idx_ai_models_active ON ai_models(is_active);

-- =====================================================
-- 3. AI EXECUTIONS (Usage tracking)
-- =====================================================
CREATE TABLE IF NOT EXISTS ai_executions (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    provider_id uuid REFERENCES ai_providers(id) ON DELETE SET NULL,
    model_id uuid REFERENCES ai_models(id) ON DELETE SET NULL,
    model_name text,
    agent_id uuid REFERENCES agents(id) ON DELETE SET NULL,
    agent_run_id uuid REFERENCES agent_runs(id) ON DELETE SET NULL,
    
    -- Token usage
    prompt_tokens integer DEFAULT 0,
    completion_tokens integer DEFAULT 0,
    total_tokens integer DEFAULT 0,
    
    -- Cost tracking
    cost_usd numeric(10,6) DEFAULT 0,
    
    -- Status
    status text DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed', 'cancelled')),
    
    -- Data
    input_data jsonb,
    output_data jsonb,
    system_prompt text,
    error_message text,
    
    -- Performance
    execution_time_ms integer,
    
    -- Source tracking
    source text DEFAULT 'manual', -- 'manual', 'agent', 'api', 'scheduled'
    metadata jsonb DEFAULT '{}',
    
    created_at timestamptz DEFAULT now(),
    completed_at timestamptz
);

CREATE INDEX idx_ai_executions_provider_id ON ai_executions(provider_id);
CREATE INDEX idx_ai_executions_model_id ON ai_executions(model_id);
CREATE INDEX idx_ai_executions_agent_id ON ai_executions(agent_id);
CREATE INDEX idx_ai_executions_status ON ai_executions(status);
CREATE INDEX idx_ai_executions_created_at ON ai_executions(created_at DESC);

-- =====================================================
-- 4. ROW LEVEL SECURITY
-- =====================================================
ALTER TABLE ai_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_models ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_executions ENABLE ROW LEVEL SECURITY;

-- Providers - authenticated can read (but API keys are excluded in queries)
CREATE POLICY "Allow authenticated read ai_providers" ON ai_providers
    FOR SELECT TO authenticated
    USING (true);

CREATE POLICY "Service role manages ai_providers" ON ai_providers
    FOR ALL TO service_role
    USING (true);

-- Models - readable by authenticated
CREATE POLICY "Allow authenticated read ai_models" ON ai_models
    FOR SELECT TO authenticated
    USING (true);

CREATE POLICY "Service role manages ai_models" ON ai_models
    FOR ALL TO service_role
    USING (true);

-- Executions
CREATE POLICY "Allow authenticated read ai_executions" ON ai_executions
    FOR SELECT TO authenticated
    USING (true);

CREATE POLICY "Allow authenticated insert ai_executions" ON ai_executions
    FOR INSERT TO authenticated
    WITH CHECK (true);

CREATE POLICY "Service role manages ai_executions" ON ai_executions
    FOR ALL TO service_role
    USING (true);

-- =====================================================
-- 5. SEED DEFAULT PROVIDERS (No API keys - add via admin)
-- Multiple entries for same provider type = multiple API keys
-- =====================================================

-- Default providers (inactive until API key added)
INSERT INTO ai_providers (name, slug, provider_type, is_active, priority, settings)
VALUES 
    ('OpenAI', 'openai-default', 'openai', false, 1, '{"description": "GPT-4, GPT-3.5, and other OpenAI models"}'),
    ('Anthropic', 'anthropic-default', 'anthropic', false, 2, '{"description": "Claude 3 family of models"}'),
    ('Google AI', 'google-default', 'google', false, 3, '{"description": "Gemini Pro and other Google AI models"}'),
    ('Groq', 'groq-default', 'groq', false, 4, '{"description": "Ultra-fast inference with Groq"}'),
    ('Mistral', 'mistral-default', 'mistral', false, 5, '{"description": "Mistral AI models"}')
ON CONFLICT DO NOTHING;

-- =====================================================
-- 6. SEED MODELS (linked to default providers)
-- =====================================================

-- OpenAI models
INSERT INTO ai_models (provider_id, name, model_id, display_name, provider_type, context_window, max_output_tokens, input_cost_per_1k, output_cost_per_1k, capabilities)
SELECT 
    p.id,
    m.name,
    m.model_id,
    m.display_name,
    'openai',
    m.context_window,
    m.max_output,
    m.input_cost,
    m.output_cost,
    m.capabilities
FROM ai_providers p
CROSS JOIN (VALUES
    ('GPT-4 Turbo', 'gpt-4-turbo-preview', 'GPT-4 Turbo', 128000, 4096, 0.01, 0.03, '["chat", "vision", "function_calling", "json_mode"]'::jsonb),
    ('GPT-4o', 'gpt-4o', 'GPT-4o', 128000, 4096, 0.005, 0.015, '["chat", "vision", "function_calling", "json_mode"]'::jsonb),
    ('GPT-4o Mini', 'gpt-4o-mini', 'GPT-4o Mini', 128000, 16384, 0.00015, 0.0006, '["chat", "vision", "function_calling", "json_mode"]'::jsonb),
    ('GPT-3.5 Turbo', 'gpt-3.5-turbo', 'GPT-3.5 Turbo', 16385, 4096, 0.0005, 0.0015, '["chat", "function_calling", "json_mode"]'::jsonb),
    ('o1', 'o1', 'o1 Reasoning', 200000, 100000, 0.015, 0.060, '["chat", "reasoning"]'::jsonb),
    ('o1 Mini', 'o1-mini', 'o1 Mini', 128000, 65536, 0.003, 0.012, '["chat", "reasoning"]'::jsonb)
) AS m(name, model_id, display_name, context_window, max_output, input_cost, output_cost, capabilities)
WHERE p.slug = 'openai-default'
ON CONFLICT (provider_id, model_id) DO NOTHING;

-- Anthropic models
INSERT INTO ai_models (provider_id, name, model_id, display_name, provider_type, context_window, max_output_tokens, input_cost_per_1k, output_cost_per_1k, capabilities)
SELECT 
    p.id,
    m.name,
    m.model_id,
    m.display_name,
    'anthropic',
    m.context_window,
    m.max_output,
    m.input_cost,
    m.output_cost,
    m.capabilities
FROM ai_providers p
CROSS JOIN (VALUES
    ('Claude 3.5 Sonnet', 'claude-3-5-sonnet-20241022', 'Claude 3.5 Sonnet', 200000, 8192, 0.003, 0.015, '["chat", "vision", "function_calling"]'::jsonb),
    ('Claude 3 Opus', 'claude-3-opus-20240229', 'Claude 3 Opus', 200000, 4096, 0.015, 0.075, '["chat", "vision", "function_calling"]'::jsonb),
    ('Claude 3 Haiku', 'claude-3-haiku-20240307', 'Claude 3 Haiku', 200000, 4096, 0.00025, 0.00125, '["chat", "vision", "function_calling"]'::jsonb)
) AS m(name, model_id, display_name, context_window, max_output, input_cost, output_cost, capabilities)
WHERE p.slug = 'anthropic-default'
ON CONFLICT (provider_id, model_id) DO NOTHING;

-- Google models
INSERT INTO ai_models (provider_id, name, model_id, display_name, provider_type, context_window, max_output_tokens, input_cost_per_1k, output_cost_per_1k, capabilities)
SELECT 
    p.id,
    m.name,
    m.model_id,
    m.display_name,
    'google',
    m.context_window,
    m.max_output,
    m.input_cost,
    m.output_cost,
    m.capabilities
FROM ai_providers p
CROSS JOIN (VALUES
    ('Gemini 2.0 Flash', 'gemini-2.0-flash-exp', 'Gemini 2.0 Flash', 1000000, 8192, 0.0, 0.0, '["chat", "vision", "function_calling"]'::jsonb),
    ('Gemini 1.5 Pro', 'gemini-1.5-pro', 'Gemini 1.5 Pro', 2000000, 8192, 0.00125, 0.005, '["chat", "vision", "function_calling"]'::jsonb),
    ('Gemini 1.5 Flash', 'gemini-1.5-flash', 'Gemini 1.5 Flash', 1000000, 8192, 0.000075, 0.0003, '["chat", "vision", "function_calling"]'::jsonb)
) AS m(name, model_id, display_name, context_window, max_output, input_cost, output_cost, capabilities)
WHERE p.slug = 'google-default'
ON CONFLICT (provider_id, model_id) DO NOTHING;

-- Groq models
INSERT INTO ai_models (provider_id, name, model_id, display_name, provider_type, context_window, max_output_tokens, input_cost_per_1k, output_cost_per_1k, capabilities)
SELECT 
    p.id,
    m.name,
    m.model_id,
    m.display_name,
    'groq',
    m.context_window,
    m.max_output,
    m.input_cost,
    m.output_cost,
    m.capabilities
FROM ai_providers p
CROSS JOIN (VALUES
    ('Llama 3.1 70B', 'llama-3.1-70b-versatile', 'Llama 3.1 70B', 131072, 8192, 0.00059, 0.00079, '["chat", "function_calling"]'::jsonb),
    ('Llama 3.1 8B', 'llama-3.1-8b-instant', 'Llama 3.1 8B', 131072, 8192, 0.00005, 0.00008, '["chat", "function_calling"]'::jsonb),
    ('Mixtral 8x7B', 'mixtral-8x7b-32768', 'Mixtral 8x7B', 32768, 8192, 0.00024, 0.00024, '["chat", "function_calling"]'::jsonb)
) AS m(name, model_id, display_name, context_window, max_output, input_cost, output_cost, capabilities)
WHERE p.slug = 'groq-default'
ON CONFLICT (provider_id, model_id) DO NOTHING;

-- =====================================================
-- 7. FUNCTIONS & TRIGGERS
-- =====================================================

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION update_ai_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_ai_providers_updated_at
    BEFORE UPDATE ON ai_providers
    FOR EACH ROW
    EXECUTE FUNCTION update_ai_updated_at();

CREATE TRIGGER update_ai_models_updated_at
    BEFORE UPDATE ON ai_models
    FOR EACH ROW
    EXECUTE FUNCTION update_ai_updated_at();

-- Function to get best available provider for a type
CREATE OR REPLACE FUNCTION get_active_provider(p_provider_type text)
RETURNS TABLE (
    provider_id uuid,
    provider_name text,
    api_key text,
    base_url text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        p.name,
        p.api_key_encrypted,
        p.base_url
    FROM ai_providers p
    WHERE p.provider_type = p_provider_type
      AND p.is_active = true
      AND p.api_key_encrypted IS NOT NULL
      AND p.consecutive_failures < 5
    ORDER BY p.priority ASC, p.last_error_at ASC NULLS FIRST
    LIMIT 1;
END;
$$;

-- Function to record provider usage
CREATE OR REPLACE FUNCTION record_provider_usage(
    p_provider_id uuid,
    p_tokens integer,
    p_cost numeric,
    p_success boolean
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    IF p_success THEN
        UPDATE ai_providers
        SET 
            total_requests = total_requests + 1,
            total_tokens_used = total_tokens_used + p_tokens,
            total_cost_usd = total_cost_usd + p_cost,
            last_used_at = now(),
            consecutive_failures = 0
        WHERE id = p_provider_id;
    ELSE
        UPDATE ai_providers
        SET 
            consecutive_failures = consecutive_failures + 1,
            last_error_at = now()
        WHERE id = p_provider_id;
    END IF;
END;
$$;

-- =====================================================
-- END OF AI PROVIDERS SCHEMA
-- =====================================================
