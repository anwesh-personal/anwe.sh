-- =====================================================
-- WEBHOOKS TABLE
-- Event subscriptions for external integrations
-- Created: 2026-02-05
-- =====================================================

CREATE TABLE IF NOT EXISTS webhooks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Webhook configuration
    name TEXT NOT NULL,
    url TEXT NOT NULL,                      -- Endpoint to call
    secret TEXT,                            -- For HMAC signature verification
    
    -- Associated API key (for authentication context)
    api_key_id UUID REFERENCES api_keys(id) ON DELETE CASCADE,
    
    -- Event subscriptions
    events TEXT[] NOT NULL DEFAULT ARRAY['*'],
    -- Available events:
    -- 'post.created', 'post.published', 'post.updated', 'post.deleted'
    -- 'lead.created', 'lead.updated', 'lead.converted'
    -- 'task.created', 'task.completed', 'task.failed'
    -- 'agent.run.started', 'agent.run.completed', 'agent.run.failed'
    -- 'memory.created', 'memory.updated'
    -- 'conversation.created', 'conversation.message'
    -- '*' - All events
    
    -- Filters (optional JSON conditions)
    filters JSONB DEFAULT '{}',
    -- Example: {"post.type": ["blog", "insight"], "lead.score_min": 50}
    
    -- Retry configuration
    max_retries INTEGER DEFAULT 3,
    retry_delay_seconds INTEGER DEFAULT 60,  -- Base delay (exponential backoff applied)
    timeout_seconds INTEGER DEFAULT 30,
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    
    -- Delivery statistics
    total_deliveries BIGINT DEFAULT 0,
    successful_deliveries BIGINT DEFAULT 0,
    failed_deliveries BIGINT DEFAULT 0,
    last_delivery_at TIMESTAMPTZ,
    last_status_code INTEGER,
    last_error TEXT,
    
    -- Health tracking
    consecutive_failures INTEGER DEFAULT 0,
    is_healthy BOOLEAN DEFAULT true,
    unhealthy_since TIMESTAMPTZ,
    
    -- Rate limiting
    min_interval_seconds INTEGER DEFAULT 1,  -- Minimum time between webhook calls
    
    -- Headers to include
    custom_headers JSONB DEFAULT '{}',
    
    -- Metadata
    description TEXT,
    metadata JSONB DEFAULT '{}',
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Webhook delivery log for debugging and retry
CREATE TABLE IF NOT EXISTS webhook_deliveries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    webhook_id UUID NOT NULL REFERENCES webhooks(id) ON DELETE CASCADE,
    
    -- Event info
    event_type TEXT NOT NULL,
    payload JSONB NOT NULL,
    
    -- Delivery attempt info
    attempt_number INTEGER DEFAULT 1,
    
    -- Response
    status_code INTEGER,
    response_body TEXT,
    response_time_ms INTEGER,
    
    -- Result
    success BOOLEAN DEFAULT false,
    error TEXT,
    
    -- Scheduling
    scheduled_at TIMESTAMPTZ DEFAULT NOW(),
    delivered_at TIMESTAMPTZ,
    next_retry_at TIMESTAMPTZ,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for webhooks
CREATE INDEX IF NOT EXISTS idx_webhooks_active ON webhooks(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_webhooks_api_key ON webhooks(api_key_id);
CREATE INDEX IF NOT EXISTS idx_webhooks_events ON webhooks USING GIN(events);

-- Indexes for webhook_deliveries
CREATE INDEX IF NOT EXISTS idx_deliveries_webhook ON webhook_deliveries(webhook_id);
CREATE INDEX IF NOT EXISTS idx_deliveries_event ON webhook_deliveries(event_type);
CREATE INDEX IF NOT EXISTS idx_deliveries_pending ON webhook_deliveries(next_retry_at) 
    WHERE success = false AND next_retry_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_deliveries_created ON webhook_deliveries(created_at DESC);

-- Enable RLS
ALTER TABLE webhooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_deliveries ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Service role full access to webhooks" ON webhooks;
DROP POLICY IF EXISTS "Authenticated users can read webhooks" ON webhooks;
DROP POLICY IF EXISTS "Service role full access to webhook_deliveries" ON webhook_deliveries;

-- Policies
CREATE POLICY "Service role full access to webhooks" ON webhooks
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can read webhooks" ON webhooks
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Service role full access to webhook_deliveries" ON webhook_deliveries
    FOR ALL USING (true) WITH CHECK (true);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_webhooks_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS webhooks_updated_at ON webhooks;
CREATE TRIGGER webhooks_updated_at
    BEFORE UPDATE ON webhooks
    FOR EACH ROW
    EXECUTE FUNCTION update_webhooks_updated_at();

-- Function to find webhooks that should receive an event
CREATE OR REPLACE FUNCTION get_webhooks_for_event(p_event_type TEXT)
RETURNS SETOF webhooks AS $$
BEGIN
    RETURN QUERY
    SELECT w.*
    FROM webhooks w
    WHERE w.is_active = true
        AND w.is_healthy = true
        AND ('*' = ANY(w.events) OR p_event_type = ANY(w.events));
END;
$$ LANGUAGE plpgsql;

-- Function to record a webhook delivery attempt
CREATE OR REPLACE FUNCTION record_webhook_delivery(
    p_webhook_id UUID,
    p_event_type TEXT,
    p_payload JSONB,
    p_status_code INTEGER,
    p_response_body TEXT DEFAULT NULL,
    p_response_time_ms INTEGER DEFAULT NULL,
    p_error TEXT DEFAULT NULL
)
RETURNS VOID AS $$
DECLARE
    v_success BOOLEAN;
    v_consecutive_failures INTEGER;
BEGIN
    v_success = p_status_code >= 200 AND p_status_code < 300;
    
    -- Insert delivery record
    INSERT INTO webhook_deliveries (
        webhook_id, event_type, payload, status_code, 
        response_body, response_time_ms, success, error, delivered_at
    ) VALUES (
        p_webhook_id, p_event_type, p_payload, p_status_code,
        p_response_body, p_response_time_ms, v_success, p_error, NOW()
    );
    
    -- Update webhook stats
    IF v_success THEN
        UPDATE webhooks SET
            total_deliveries = total_deliveries + 1,
            successful_deliveries = successful_deliveries + 1,
            last_delivery_at = NOW(),
            last_status_code = p_status_code,
            last_error = NULL,
            consecutive_failures = 0,
            is_healthy = true,
            unhealthy_since = NULL
        WHERE id = p_webhook_id;
    ELSE
        SELECT consecutive_failures + 1 INTO v_consecutive_failures
        FROM webhooks WHERE id = p_webhook_id;
        
        UPDATE webhooks SET
            total_deliveries = total_deliveries + 1,
            failed_deliveries = failed_deliveries + 1,
            last_delivery_at = NOW(),
            last_status_code = p_status_code,
            last_error = p_error,
            consecutive_failures = v_consecutive_failures,
            is_healthy = CASE WHEN v_consecutive_failures >= 5 THEN false ELSE is_healthy END,
            unhealthy_since = CASE WHEN v_consecutive_failures = 5 THEN NOW() ELSE unhealthy_since END
        WHERE id = p_webhook_id;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Clean up old delivery logs (keep last 7 days)
CREATE OR REPLACE FUNCTION cleanup_webhook_deliveries()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM webhook_deliveries
    WHERE created_at < NOW() - INTERVAL '7 days';
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Comments
COMMENT ON TABLE webhooks IS 'Webhook subscriptions for external integrations';
COMMENT ON TABLE webhook_deliveries IS 'Log of webhook delivery attempts for debugging and retry';
COMMENT ON COLUMN webhooks.events IS 'Array of event types this webhook subscribes to';
COMMENT ON COLUMN webhooks.secret IS 'Secret for HMAC signature in X-Webhook-Signature header';
COMMENT ON COLUMN webhooks.is_healthy IS 'False after 5 consecutive failures, auto-recovered on success';
