-- =====================================================
-- API KEYS TABLE
-- Secure API key management for ORA and external agents
-- Created: 2026-02-05
-- =====================================================

CREATE TABLE IF NOT EXISTS api_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Key identification (the actual key is never stored, only hash)
    name TEXT NOT NULL,                     -- Human-readable name
    key_prefix TEXT NOT NULL,               -- First 8 chars for identification (e.g., "ora_k1_a")
    key_hash TEXT NOT NULL,                 -- SHA-256 hash of full key
    
    -- Ownership
    agent_id UUID REFERENCES agents(id) ON DELETE CASCADE,  -- Associated agent (NULL = general purpose)
    created_by UUID,                        -- User who created the key
    
    -- Permissions (scopes define what the key can do)
    scopes TEXT[] NOT NULL DEFAULT ARRAY['read'],
    -- Available scopes:
    -- 'read' - Read data
    -- 'write' - Create/update data
    -- 'delete' - Delete data
    -- 'admin' - Admin operations
    -- 'memory:read', 'memory:write' - Memory operations
    -- 'posts:read', 'posts:write', 'posts:publish' - Post operations
    -- 'agents:run', 'agents:manage' - Agent operations
    -- 'analytics:read' - Analytics access
    -- 'tasks:read', 'tasks:create', 'tasks:manage' - Task operations
    -- 'settings:read', 'settings:write' - Settings operations
    -- '*' - All permissions
    
    -- Rate limiting
    rate_limit_per_minute INTEGER DEFAULT 60,
    rate_limit_per_day INTEGER DEFAULT 10000,
    
    -- Usage tracking
    last_used_at TIMESTAMPTZ,
    total_requests BIGINT DEFAULT 0,
    total_tokens_used BIGINT DEFAULT 0,
    
    -- Usage this period (reset daily)
    requests_today INTEGER DEFAULT 0,
    last_request_reset TIMESTAMPTZ DEFAULT NOW(),
    
    -- IP restrictions (empty = no restrictions)
    allowed_ips TEXT[] DEFAULT ARRAY[]::TEXT[],
    last_ip TEXT,
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    revoked_at TIMESTAMPTZ,
    revoked_reason TEXT,
    
    -- Expiration
    expires_at TIMESTAMPTZ,
    
    -- Metadata
    description TEXT,
    metadata JSONB DEFAULT '{}',
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_api_keys_prefix ON api_keys(key_prefix);
CREATE INDEX IF NOT EXISTS idx_api_keys_hash ON api_keys(key_hash);
CREATE INDEX IF NOT EXISTS idx_api_keys_agent ON api_keys(agent_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_active ON api_keys(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_api_keys_expires ON api_keys(expires_at) WHERE expires_at IS NOT NULL;

-- Enable RLS
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Service role full access to api_keys" ON api_keys;
DROP POLICY IF EXISTS "Authenticated admins can manage api_keys" ON api_keys;

-- Policies - Only service role has full access (API keys are sensitive)
CREATE POLICY "Service role full access to api_keys" ON api_keys
    FOR ALL USING (true) WITH CHECK (true);

-- Authenticated users can see their keys (but not the hash)
CREATE POLICY "Authenticated admins can manage api_keys" ON api_keys
    FOR SELECT USING (auth.role() = 'authenticated');

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_api_keys_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS api_keys_updated_at ON api_keys;
CREATE TRIGGER api_keys_updated_at
    BEFORE UPDATE ON api_keys
    FOR EACH ROW
    EXECUTE FUNCTION update_api_keys_updated_at();

-- Function to validate an API key and record usage
CREATE OR REPLACE FUNCTION validate_api_key(
    p_key_hash TEXT,
    p_ip TEXT DEFAULT NULL,
    p_scope TEXT DEFAULT 'read'
)
RETURNS TABLE (
    key_id UUID,
    key_name TEXT,
    agent_id UUID,
    scopes TEXT[],
    is_valid BOOLEAN,
    rejection_reason TEXT
) AS $$
DECLARE
    v_key RECORD;
BEGIN
    -- Find the key
    SELECT * INTO v_key FROM api_keys WHERE key_hash = p_key_hash;
    
    IF NOT FOUND THEN
        RETURN QUERY SELECT NULL::UUID, NULL::TEXT, NULL::UUID, NULL::TEXT[], false, 'Invalid API key';
        RETURN;
    END IF;
    
    -- Check if active
    IF NOT v_key.is_active THEN
        RETURN QUERY SELECT v_key.id, v_key.name, v_key.agent_id, v_key.scopes, false, 'API key is revoked';
        RETURN;
    END IF;
    
    -- Check expiration
    IF v_key.expires_at IS NOT NULL AND v_key.expires_at < NOW() THEN
        RETURN QUERY SELECT v_key.id, v_key.name, v_key.agent_id, v_key.scopes, false, 'API key has expired';
        RETURN;
    END IF;
    
    -- Check IP whitelist
    IF array_length(v_key.allowed_ips, 1) > 0 AND p_ip IS NOT NULL THEN
        IF NOT (p_ip = ANY(v_key.allowed_ips)) THEN
            RETURN QUERY SELECT v_key.id, v_key.name, v_key.agent_id, v_key.scopes, false, 'IP not allowed';
            RETURN;
        END IF;
    END IF;
    
    -- Check scope
    IF NOT ('*' = ANY(v_key.scopes)) AND NOT (p_scope = ANY(v_key.scopes)) THEN
        RETURN QUERY SELECT v_key.id, v_key.name, v_key.agent_id, v_key.scopes, false, 'Insufficient scope';
        RETURN;
    END IF;
    
    -- Reset daily counter if needed
    IF v_key.last_request_reset < (NOW() - INTERVAL '1 day') THEN
        UPDATE api_keys SET requests_today = 0, last_request_reset = NOW() WHERE id = v_key.id;
        v_key.requests_today = 0;
    END IF;
    
    -- Check daily rate limit
    IF v_key.requests_today >= v_key.rate_limit_per_day THEN
        RETURN QUERY SELECT v_key.id, v_key.name, v_key.agent_id, v_key.scopes, false, 'Daily rate limit exceeded';
        RETURN;
    END IF;
    
    -- Record usage
    UPDATE api_keys 
    SET last_used_at = NOW(),
        total_requests = total_requests + 1,
        requests_today = requests_today + 1,
        last_ip = p_ip
    WHERE id = v_key.id;
    
    -- Valid!
    RETURN QUERY SELECT v_key.id, v_key.name, v_key.agent_id, v_key.scopes, true, NULL::TEXT;
END;
$$ LANGUAGE plpgsql;

-- Function to generate a new API key (returns the plain-text key once)
-- NOTE: The actual key generation should happen in application code
-- This just creates the database record
CREATE OR REPLACE FUNCTION create_api_key(
    p_name TEXT,
    p_key_prefix TEXT,
    p_key_hash TEXT,
    p_scopes TEXT[] DEFAULT ARRAY['read'],
    p_agent_id UUID DEFAULT NULL,
    p_rate_limit_per_minute INTEGER DEFAULT 60,
    p_rate_limit_per_day INTEGER DEFAULT 10000,
    p_expires_at TIMESTAMPTZ DEFAULT NULL,
    p_description TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    new_id UUID;
BEGIN
    INSERT INTO api_keys (
        name, key_prefix, key_hash, scopes, agent_id,
        rate_limit_per_minute, rate_limit_per_day, expires_at, description
    ) VALUES (
        p_name, p_key_prefix, p_key_hash, p_scopes, p_agent_id,
        p_rate_limit_per_minute, p_rate_limit_per_day, p_expires_at, p_description
    )
    RETURNING id INTO new_id;
    
    RETURN new_id;
END;
$$ LANGUAGE plpgsql;

-- Comments
COMMENT ON TABLE api_keys IS 'API keys for ORA and external agent authentication';
COMMENT ON COLUMN api_keys.key_hash IS 'SHA-256 hash of the full API key (the key itself is never stored)';
COMMENT ON COLUMN api_keys.key_prefix IS 'First 8 characters of the key for identification in logs/UI';
COMMENT ON COLUMN api_keys.scopes IS 'Array of permission scopes granted to this key';
COMMENT ON COLUMN api_keys.allowed_ips IS 'IP whitelist (empty = allow all IPs)';
