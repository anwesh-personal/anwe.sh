-- =====================================================
-- AGENT MEMORY TABLE
-- Persistent memory storage with sync support for ORA
-- Created: 2026-02-05
-- =====================================================

-- Enable pgvector extension if not exists
CREATE EXTENSION IF NOT EXISTS vector;

-- Create agent_memory table
CREATE TABLE IF NOT EXISTS agent_memory (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Ownership
    -- NULL agent_id = ORA's external memory (desktop client)
    agent_id UUID REFERENCES agents(id) ON DELETE CASCADE,
    
    -- Memory categorization
    memory_type TEXT NOT NULL CHECK (memory_type IN (
        'fact',           -- Persistent facts about the world/user
        'preference',     -- User preferences
        'context',        -- Situational context
        'skill',          -- Learned behaviors/patterns
        'instruction',    -- Standing instructions
        'reflection',     -- Agent's own reflections/learnings
        'task',           -- Task-related memory
        'entity'          -- Entity information (person, company, etc.)
    )),
    
    -- Memory content
    key TEXT NOT NULL,
    content JSONB NOT NULL,
    summary TEXT,                         -- Human-readable summary
    
    -- Importance and retrieval
    importance FLOAT DEFAULT 0.5 CHECK (importance >= 0 AND importance <= 1),
    access_count INTEGER DEFAULT 0,
    last_accessed_at TIMESTAMPTZ,
    
    -- Embedding for semantic search (OpenAI ada-002 dimensions)
    embedding VECTOR(1536),
    
    -- Sync tracking for ORA desktop
    source TEXT NOT NULL DEFAULT 'server' CHECK (source IN (
        'server',         -- Created on server
        'desktop',        -- Created on ORA desktop
        'sync'            -- Created during sync reconciliation
    )),
    sync_id UUID,                         -- For conflict detection
    synced_at TIMESTAMPTZ,
    is_dirty BOOLEAN DEFAULT false,       -- Needs sync
    
    -- Lifecycle
    expires_at TIMESTAMPTZ,
    is_archived BOOLEAN DEFAULT false,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Unique constraint for memory keys per agent (only for non-archived)
-- Using COALESCE to handle NULL agent_id (ORA desktop memory)
CREATE UNIQUE INDEX IF NOT EXISTS idx_agent_memory_unique_key 
    ON agent_memory(COALESCE(agent_id, '00000000-0000-0000-0000-000000000000'::uuid), memory_type, key)
    WHERE is_archived = false;

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_agent_memory_agent ON agent_memory(agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_memory_type ON agent_memory(memory_type);
CREATE INDEX IF NOT EXISTS idx_agent_memory_key ON agent_memory(key);
CREATE INDEX IF NOT EXISTS idx_agent_memory_importance ON agent_memory(importance DESC);
CREATE INDEX IF NOT EXISTS idx_agent_memory_sync ON agent_memory(is_dirty, synced_at);
CREATE INDEX IF NOT EXISTS idx_agent_memory_created ON agent_memory(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_agent_memory_expires ON agent_memory(expires_at) WHERE expires_at IS NOT NULL;

-- Vector similarity index for semantic search
-- Using ivfflat for good balance of speed and accuracy
CREATE INDEX IF NOT EXISTS idx_agent_memory_embedding ON agent_memory 
    USING ivfflat (embedding vector_cosine_ops) 
    WITH (lists = 100);

-- Enable RLS
ALTER TABLE agent_memory ENABLE ROW LEVEL SECURITY;

-- Drop existing policies first
DROP POLICY IF EXISTS "Service role full access to agent_memory" ON agent_memory;
DROP POLICY IF EXISTS "Authenticated users can read agent_memory" ON agent_memory;

-- Policies - Service role has full access (used by API routes)
CREATE POLICY "Service role full access to agent_memory" ON agent_memory
    FOR ALL USING (true) WITH CHECK (true);

-- Authenticated users can read their own memories
CREATE POLICY "Authenticated users can read agent_memory" ON agent_memory
    FOR SELECT USING (auth.role() = 'authenticated');

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_agent_memory_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS agent_memory_updated_at ON agent_memory;
CREATE TRIGGER agent_memory_updated_at
    BEFORE UPDATE ON agent_memory
    FOR EACH ROW
    EXECUTE FUNCTION update_agent_memory_updated_at();

-- Function to increment access count when memory is retrieved
CREATE OR REPLACE FUNCTION touch_agent_memory(memory_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE agent_memory 
    SET access_count = access_count + 1,
        last_accessed_at = NOW()
    WHERE id = memory_id;
END;
$$ LANGUAGE plpgsql;

-- Function for semantic search
CREATE OR REPLACE FUNCTION search_agent_memory(
    query_embedding VECTOR(1536),
    match_threshold FLOAT DEFAULT 0.7,
    match_count INT DEFAULT 10,
    p_agent_id UUID DEFAULT NULL,
    p_memory_type TEXT DEFAULT NULL
)
RETURNS TABLE (
    id UUID,
    agent_id UUID,
    memory_type TEXT,
    key TEXT,
    content JSONB,
    summary TEXT,
    importance FLOAT,
    similarity FLOAT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        m.id,
        m.agent_id,
        m.memory_type,
        m.key,
        m.content,
        m.summary,
        m.importance,
        1 - (m.embedding <=> query_embedding) AS similarity
    FROM agent_memory m
    WHERE m.is_archived = false
        AND (m.expires_at IS NULL OR m.expires_at > NOW())
        AND (p_agent_id IS NULL OR m.agent_id = p_agent_id OR m.agent_id IS NULL)
        AND (p_memory_type IS NULL OR m.memory_type = p_memory_type)
        AND 1 - (m.embedding <=> query_embedding) > match_threshold
    ORDER BY similarity DESC
    LIMIT match_count;
END;
$$ LANGUAGE plpgsql;

-- Comments
COMMENT ON TABLE agent_memory IS 'Persistent memory storage for agents with semantic search and sync support';
COMMENT ON COLUMN agent_memory.agent_id IS 'NULL = ORA desktop memory, otherwise agent-specific memory';
COMMENT ON COLUMN agent_memory.embedding IS 'Vector embedding for semantic search (1536 dimensions for OpenAI ada-002)';
COMMENT ON COLUMN agent_memory.sync_id IS 'UUID for tracking sync state and conflict detection';
COMMENT ON COLUMN agent_memory.is_dirty IS 'True if local changes need to be synced to server';
