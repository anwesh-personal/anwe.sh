-- =====================================================
-- AGENT TASKS TABLE
-- Task queue for agent delegation and orchestration
-- Created: 2026-02-05
-- =====================================================

CREATE TABLE IF NOT EXISTS agent_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Assignment
    assigned_by UUID REFERENCES agents(id) ON DELETE SET NULL,  -- ORA or another agent
    assigned_to UUID REFERENCES agents(id) ON DELETE SET NULL,  -- Target agent
    
    -- Task definition
    task_type TEXT NOT NULL CHECK (task_type IN (
        'write_post',           -- Writer agent
        'generate_image',       -- Imager agent
        'seo_analysis',         -- SEO agent
        'social_post',          -- Social agent
        'analyze_data',         -- Analyst agent
        'memory_sync',          -- Memory synchronization
        'scheduled_check',      -- Periodic checks
        'webhook_dispatch',     -- Webhook delivery
        'custom'                -- Custom tasks
    )),
    
    -- Priority (higher = more urgent)
    priority INTEGER DEFAULT 5 CHECK (priority >= 1 AND priority <= 10),
    
    -- Task content
    title TEXT NOT NULL,
    description TEXT,
    input JSONB NOT NULL DEFAULT '{}',      -- Input parameters
    output JSONB,                            -- Result when completed
    
    -- Status tracking
    status TEXT DEFAULT 'pending' CHECK (status IN (
        'pending',      -- Waiting to start
        'queued',       -- In queue
        'running',      -- Currently executing
        'completed',    -- Successfully done
        'failed',       -- Failed with error
        'cancelled',    -- Manually cancelled
        'timeout'       -- Exceeded time limit
    )),
    
    -- Execution tracking
    attempts INTEGER DEFAULT 0,
    max_attempts INTEGER DEFAULT 3,
    last_error TEXT,
    error_details JSONB,
    
    -- Timing
    scheduled_at TIMESTAMPTZ,               -- When to start (NULL = immediate)
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    timeout_at TIMESTAMPTZ,                 -- Deadline
    
    -- Dependencies
    depends_on UUID[],                      -- Task IDs that must complete first
    
    -- Related resources
    related_post_id UUID REFERENCES blog_posts(id) ON DELETE SET NULL,
    related_run_id UUID REFERENCES agent_runs(id) ON DELETE SET NULL,
    related_conversation_id UUID REFERENCES agent_conversations(id) ON DELETE SET NULL,
    
    -- Source tracking
    source TEXT DEFAULT 'manual' CHECK (source IN (
        'manual',       -- Created by user
        'ora',          -- Created by ORA
        'agent',        -- Created by another agent
        'schedule',     -- Scheduled/cron task
        'webhook',      -- Triggered by webhook
        'api'           -- External API call
    )),
    
    -- Metadata
    metadata JSONB DEFAULT '{}',
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for efficient queue operations
CREATE INDEX IF NOT EXISTS idx_tasks_status_priority ON agent_tasks(status, priority DESC, created_at);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to ON agent_tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_by ON agent_tasks(assigned_by);
CREATE INDEX IF NOT EXISTS idx_tasks_type ON agent_tasks(task_type);
CREATE INDEX IF NOT EXISTS idx_tasks_scheduled ON agent_tasks(scheduled_at) WHERE scheduled_at IS NOT NULL AND status = 'pending';
CREATE INDEX IF NOT EXISTS idx_tasks_pending ON agent_tasks(status) WHERE status IN ('pending', 'queued');
CREATE INDEX IF NOT EXISTS idx_tasks_running ON agent_tasks(status) WHERE status = 'running';
CREATE INDEX IF NOT EXISTS idx_tasks_created ON agent_tasks(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tasks_post ON agent_tasks(related_post_id) WHERE related_post_id IS NOT NULL;

-- Enable RLS
ALTER TABLE agent_tasks ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Service role full access to agent_tasks" ON agent_tasks;
DROP POLICY IF EXISTS "Authenticated users can read agent_tasks" ON agent_tasks;

-- Policies
CREATE POLICY "Service role full access to agent_tasks" ON agent_tasks
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can read agent_tasks" ON agent_tasks
    FOR SELECT USING (auth.role() = 'authenticated');

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_agent_tasks_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS agent_tasks_updated_at ON agent_tasks;
CREATE TRIGGER agent_tasks_updated_at
    BEFORE UPDATE ON agent_tasks
    FOR EACH ROW
    EXECUTE FUNCTION update_agent_tasks_updated_at();

-- Function to get next task for an agent
CREATE OR REPLACE FUNCTION get_next_agent_task(
    p_agent_id UUID,
    p_task_types TEXT[] DEFAULT NULL
)
RETURNS SETOF agent_tasks AS $$
BEGIN
    RETURN QUERY
    SELECT t.*
    FROM agent_tasks t
    WHERE t.status = 'pending'
        AND (t.assigned_to = p_agent_id OR t.assigned_to IS NULL)
        AND (t.scheduled_at IS NULL OR t.scheduled_at <= NOW())
        AND (p_task_types IS NULL OR t.task_type = ANY(p_task_types))
        AND NOT EXISTS (
            -- Check dependencies are completed
            SELECT 1 FROM agent_tasks dep
            WHERE dep.id = ANY(t.depends_on)
            AND dep.status NOT IN ('completed')
        )
    ORDER BY t.priority DESC, t.created_at ASC
    LIMIT 1
    FOR UPDATE SKIP LOCKED;  -- Prevent race conditions
END;
$$ LANGUAGE plpgsql;

-- Function to claim a task
CREATE OR REPLACE FUNCTION claim_agent_task(p_task_id UUID, p_agent_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    claimed BOOLEAN;
BEGIN
    UPDATE agent_tasks 
    SET status = 'running',
        assigned_to = p_agent_id,
        started_at = NOW(),
        attempts = attempts + 1
    WHERE id = p_task_id
        AND status = 'pending';
    
    GET DIAGNOSTICS claimed = ROW_COUNT;
    RETURN claimed > 0;
END;
$$ LANGUAGE plpgsql;

-- Function to complete a task
CREATE OR REPLACE FUNCTION complete_agent_task(
    p_task_id UUID,
    p_output JSONB DEFAULT '{}'
)
RETURNS VOID AS $$
BEGIN
    UPDATE agent_tasks 
    SET status = 'completed',
        output = p_output,
        completed_at = NOW()
    WHERE id = p_task_id;
END;
$$ LANGUAGE plpgsql;

-- Function to fail a task
CREATE OR REPLACE FUNCTION fail_agent_task(
    p_task_id UUID,
    p_error TEXT,
    p_details JSONB DEFAULT NULL
)
RETURNS VOID AS $$
DECLARE
    current_attempts INT;
    max_att INT;
BEGIN
    SELECT attempts, max_attempts INTO current_attempts, max_att
    FROM agent_tasks WHERE id = p_task_id;
    
    IF current_attempts >= max_att THEN
        -- Final failure
        UPDATE agent_tasks 
        SET status = 'failed',
            last_error = p_error,
            error_details = p_details,
            completed_at = NOW()
        WHERE id = p_task_id;
    ELSE
        -- Retry
        UPDATE agent_tasks 
        SET status = 'pending',
            last_error = p_error,
            error_details = p_details
        WHERE id = p_task_id;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Comments
COMMENT ON TABLE agent_tasks IS 'Task queue for agent orchestration and delegation';
COMMENT ON COLUMN agent_tasks.depends_on IS 'Array of task IDs that must complete before this task can start';
COMMENT ON COLUMN agent_tasks.priority IS 'Task priority 1-10 (10 = highest priority)';
