-- =====================================================
-- AGENT CONVERSATIONS TABLE
-- Conversation threads with message history
-- Created: 2026-02-05
-- =====================================================

CREATE TABLE IF NOT EXISTS agent_conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Ownership
    -- NULL = ORA external conversation (from desktop)
    agent_id UUID REFERENCES agents(id) ON DELETE CASCADE,
    
    -- Conversation metadata
    title TEXT,
    summary TEXT,
    
    -- Message history stored as JSONB array
    -- Format: [{ role: 'user'|'assistant'|'system'|'tool', content: string, timestamp: string, ... }]
    messages JSONB NOT NULL DEFAULT '[]',
    
    -- Stats
    message_count INTEGER DEFAULT 0,
    token_count INTEGER DEFAULT 0,
    
    -- Context - related resources
    related_post_id UUID REFERENCES blog_posts(id) ON DELETE SET NULL,
    related_task_id UUID,  -- Will reference agent_tasks once created
    
    -- Status
    status TEXT DEFAULT 'active' CHECK (status IN (
        'active',
        'completed',
        'archived',
        'error'
    )),
    
    -- Sync for ORA desktop
    source TEXT NOT NULL DEFAULT 'server' CHECK (source IN (
        'server',
        'desktop', 
        'sync'
    )),
    sync_id UUID,
    synced_at TIMESTAMPTZ,
    is_dirty BOOLEAN DEFAULT false,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_conversations_agent ON agent_conversations(agent_id);
CREATE INDEX IF NOT EXISTS idx_conversations_status ON agent_conversations(status);
CREATE INDEX IF NOT EXISTS idx_conversations_sync ON agent_conversations(is_dirty, synced_at);
CREATE INDEX IF NOT EXISTS idx_conversations_updated ON agent_conversations(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_conversations_created ON agent_conversations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_conversations_post ON agent_conversations(related_post_id) WHERE related_post_id IS NOT NULL;

-- Enable RLS
ALTER TABLE agent_conversations ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Service role full access to agent_conversations" ON agent_conversations;
DROP POLICY IF EXISTS "Authenticated users can read agent_conversations" ON agent_conversations;

-- Policies
CREATE POLICY "Service role full access to agent_conversations" ON agent_conversations
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can read agent_conversations" ON agent_conversations
    FOR SELECT USING (auth.role() = 'authenticated');

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_agent_conversations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    -- Auto-calculate message count
    NEW.message_count = jsonb_array_length(NEW.messages);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS agent_conversations_updated_at ON agent_conversations;
CREATE TRIGGER agent_conversations_updated_at
    BEFORE UPDATE ON agent_conversations
    FOR EACH ROW
    EXECUTE FUNCTION update_agent_conversations_updated_at();

-- Also run on insert
DROP TRIGGER IF EXISTS agent_conversations_insert ON agent_conversations;
CREATE TRIGGER agent_conversations_insert
    BEFORE INSERT ON agent_conversations
    FOR EACH ROW
    EXECUTE FUNCTION update_agent_conversations_updated_at();

-- Function to add a message to a conversation
CREATE OR REPLACE FUNCTION add_conversation_message(
    p_conversation_id UUID,
    p_role TEXT,
    p_content TEXT,
    p_metadata JSONB DEFAULT '{}'
)
RETURNS JSONB AS $$
DECLARE
    new_message JSONB;
    updated_messages JSONB;
BEGIN
    -- Create the new message
    new_message = jsonb_build_object(
        'role', p_role,
        'content', p_content,
        'timestamp', NOW()::TEXT,
        'metadata', p_metadata
    );
    
    -- Append to messages array
    UPDATE agent_conversations 
    SET messages = messages || new_message
    WHERE id = p_conversation_id
    RETURNING messages INTO updated_messages;
    
    RETURN new_message;
END;
$$ LANGUAGE plpgsql;

-- Function to compress/summarize old messages
CREATE OR REPLACE FUNCTION compress_conversation(
    p_conversation_id UUID,
    p_keep_recent INT DEFAULT 10,
    p_summary TEXT DEFAULT NULL
)
RETURNS VOID AS $$
DECLARE
    total_messages INT;
    messages_to_keep JSONB;
    compression_note JSONB;
BEGIN
    SELECT message_count INTO total_messages 
    FROM agent_conversations WHERE id = p_conversation_id;
    
    IF total_messages <= p_keep_recent THEN
        RETURN; -- Nothing to compress
    END IF;
    
    -- Keep only the most recent messages
    SELECT jsonb_agg(msg) INTO messages_to_keep
    FROM (
        SELECT msg 
        FROM agent_conversations, 
             jsonb_array_elements(messages) WITH ORDINALITY AS t(msg, idx)
        WHERE id = p_conversation_id
        ORDER BY idx DESC
        LIMIT p_keep_recent
    ) sub;
    
    -- Reverse to maintain order
    SELECT jsonb_agg(elem) INTO messages_to_keep
    FROM (
        SELECT elem FROM jsonb_array_elements(messages_to_keep) AS elem
        ORDER BY (SELECT NULL)
    ) sub;
    
    -- Create compression note
    compression_note = jsonb_build_object(
        'role', 'system',
        'content', COALESCE(p_summary, format('[%s earlier messages compressed]', total_messages - p_keep_recent)),
        'timestamp', NOW()::TEXT,
        'metadata', jsonb_build_object('compressed', true, 'original_count', total_messages)
    );
    
    -- Update conversation with compressed messages
    UPDATE agent_conversations 
    SET messages = compression_note || COALESCE(messages_to_keep, '[]'::jsonb),
        summary = COALESCE(p_summary, summary)
    WHERE id = p_conversation_id;
END;
$$ LANGUAGE plpgsql;

-- Comments
COMMENT ON TABLE agent_conversations IS 'Conversation threads between users and agents with message history';
COMMENT ON COLUMN agent_conversations.messages IS 'JSONB array of messages: [{role, content, timestamp, metadata}]';
COMMENT ON COLUMN agent_conversations.token_count IS 'Estimated token count for context window management';
