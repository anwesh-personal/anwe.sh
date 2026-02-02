-- ============================================
-- AGENT RUNS TABLE
-- Tracks all agent executions for history/analytics
-- ============================================

CREATE TABLE IF NOT EXISTS agent_runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
    
    -- Run details
    action TEXT NOT NULL,
    input JSONB,
    output JSONB,
    
    -- Status
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'success', 'error', 'cancelled')),
    error_message TEXT,
    
    -- Performance
    duration_ms INTEGER,
    tokens_used INTEGER,
    estimated_cost DECIMAL(10, 6),
    
    -- Context
    triggered_by TEXT CHECK (triggered_by IN ('manual', 'scheduled', 'agent', 'webhook', 'system')),
    parent_run_id UUID REFERENCES agent_runs(id),
    
    -- Related content
    post_id UUID REFERENCES blog_posts(id) ON DELETE SET NULL,
    
    -- Timestamps
    started_at TIMESTAMPTZ DEFAULT now(),
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE agent_runs ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Authenticated users can read agent runs" ON agent_runs
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can manage agent runs" ON agent_runs
    FOR ALL USING (auth.role() = 'authenticated');

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_agent_runs_agent_id ON agent_runs(agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_runs_status ON agent_runs(status);
CREATE INDEX IF NOT EXISTS idx_agent_runs_created_at ON agent_runs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_agent_runs_post_id ON agent_runs(post_id);

-- Update agent stats after each run
CREATE OR REPLACE FUNCTION update_agent_run_stats()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status IN ('success', 'error') AND (OLD.status IS NULL OR OLD.status != NEW.status) THEN
        UPDATE agents SET
            last_run_at = NEW.completed_at,
            total_runs = total_runs + 1,
            successful_runs = successful_runs + CASE WHEN NEW.status = 'success' THEN 1 ELSE 0 END,
            failed_runs = failed_runs + CASE WHEN NEW.status = 'error' THEN 1 ELSE 0 END,
            avg_duration_ms = COALESCE(
                (avg_duration_ms * (total_runs - 1) + COALESCE(NEW.duration_ms, 0)) / total_runs,
                NEW.duration_ms
            ),
            updated_at = now()
        WHERE id = NEW.agent_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER agent_runs_update_stats
    AFTER UPDATE ON agent_runs
    FOR EACH ROW
    EXECUTE FUNCTION update_agent_run_stats();
