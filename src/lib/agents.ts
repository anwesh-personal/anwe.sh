/**
 * Agents Data Access Layer
 * All agent CRUD operations and run management
 */

import { supabase } from './supabase';
import type {
    Agent,
    AgentRun,
    AgentCreateInput,
    AgentUpdateInput,
    AgentRunStatus,
    AgentTrigger
} from '@/types';

// ============================================
// AGENTS CRUD
// ============================================

/**
 * Get all agents
 */
export async function getAgents(): Promise<Agent[]> {
    const { data, error } = await supabase
        .from('agents')
        .select('*')
        .order('created_at', { ascending: true });

    if (error) {
        console.error('Error fetching agents:', error);
        return [];
    }

    return data as Agent[];
}

/**
 * Get a single agent by ID
 */
export async function getAgentById(id: string): Promise<Agent | null> {
    const { data, error } = await supabase
        .from('agents')
        .select('*')
        .eq('id', id)
        .single();

    if (error) {
        console.error('Error fetching agent:', error);
        return null;
    }

    return data as Agent;
}

/**
 * Get a single agent by slug
 */
export async function getAgentBySlug(slug: string): Promise<Agent | null> {
    const { data, error } = await supabase
        .from('agents')
        .select('*')
        .eq('slug', slug)
        .single();

    if (error) {
        console.error('Error fetching agent:', error);
        return null;
    }

    return data as Agent;
}

/**
 * Create a new agent
 */
export async function createAgent(input: AgentCreateInput): Promise<Agent | null> {
    const { data, error } = await supabase
        .from('agents')
        .insert([input])
        .select()
        .single();

    if (error) {
        console.error('Error creating agent:', error);
        return null;
    }

    return data as Agent;
}

/**
 * Update an agent
 */
export async function updateAgent(id: string, input: AgentUpdateInput): Promise<Agent | null> {
    const { data, error } = await supabase
        .from('agents')
        .update(input)
        .eq('id', id)
        .select()
        .single();

    if (error) {
        console.error('Error updating agent:', error);
        return null;
    }

    return data as Agent;
}

/**
 * Delete an agent
 */
export async function deleteAgent(id: string): Promise<boolean> {
    const { error } = await supabase
        .from('agents')
        .delete()
        .eq('id', id);

    if (error) {
        console.error('Error deleting agent:', error);
        return false;
    }

    return true;
}

/**
 * Toggle agent enabled status
 */
export async function toggleAgentEnabled(id: string, enabled: boolean): Promise<Agent | null> {
    return updateAgent(id, { is_enabled: enabled } as AgentUpdateInput);
}

/**
 * Update agent status
 */
export async function updateAgentStatus(
    id: string,
    status: Agent['status'],
    statusMessage?: string
): Promise<Agent | null> {
    return updateAgent(id, {
        status,
        status_message: statusMessage
    } as AgentUpdateInput);
}

// ============================================
// AGENT RUNS
// ============================================

/**
 * Get recent runs for an agent
 */
export async function getAgentRuns(
    agentId: string,
    limit: number = 50
): Promise<AgentRun[]> {
    const { data, error } = await supabase
        .from('agent_runs')
        .select('*')
        .eq('agent_id', agentId)
        .order('created_at', { ascending: false })
        .limit(limit);

    if (error) {
        console.error('Error fetching agent runs:', error);
        return [];
    }

    return data as AgentRun[];
}

/**
 * Get all recent runs across all agents
 */
export async function getAllRecentRuns(limit: number = 20): Promise<AgentRun[]> {
    const { data, error } = await supabase
        .from('agent_runs')
        .select(`
            *,
            agent:agents(id, name, slug, icon)
        `)
        .order('created_at', { ascending: false })
        .limit(limit);

    if (error) {
        console.error('Error fetching recent runs:', error);
        return [];
    }

    return data as AgentRun[];
}

/**
 * Create a new agent run (start a run)
 */
export async function createAgentRun(
    agentId: string,
    action: string,
    input: Record<string, unknown>,
    triggeredBy: AgentTrigger = 'manual'
): Promise<AgentRun | null> {
    const { data, error } = await supabase
        .from('agent_runs')
        .insert([{
            agent_id: agentId,
            action,
            input,
            triggered_by: triggeredBy,
            status: 'pending',
            started_at: new Date().toISOString()
        }])
        .select()
        .single();

    if (error) {
        console.error('Error creating agent run:', error);
        return null;
    }

    return data as AgentRun;
}

/**
 * Update a run (when it completes)
 */
export async function updateAgentRun(
    runId: string,
    status: AgentRunStatus,
    output?: Record<string, unknown>,
    errorMessage?: string,
    durationMs?: number,
    tokensUsed?: number
): Promise<AgentRun | null> {
    const updateData: Record<string, unknown> = {
        status,
        completed_at: new Date().toISOString()
    };

    if (output !== undefined) updateData.output = output;
    if (errorMessage !== undefined) updateData.error_message = errorMessage;
    if (durationMs !== undefined) updateData.duration_ms = durationMs;
    if (tokensUsed !== undefined) updateData.tokens_used = tokensUsed;

    const { data, error } = await supabase
        .from('agent_runs')
        .update(updateData)
        .eq('id', runId)
        .select()
        .single();

    if (error) {
        console.error('Error updating agent run:', error);
        return null;
    }

    return data as AgentRun;
}

/**
 * Get agent run statistics
 */
export async function getAgentRunStats(agentId: string): Promise<{
    totalRuns: number;
    successfulRuns: number;
    failedRuns: number;
    avgDurationMs: number;
    runsToday: number;
    runsThisWeek: number;
}> {
    const agent = await getAgentById(agentId);
    if (!agent) {
        return {
            totalRuns: 0,
            successfulRuns: 0,
            failedRuns: 0,
            avgDurationMs: 0,
            runsToday: 0,
            runsThisWeek: 0
        };
    }

    // Get today's and this week's counts
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    weekAgo.setHours(0, 0, 0, 0);

    const { count: runsToday } = await supabase
        .from('agent_runs')
        .select('*', { count: 'exact', head: true })
        .eq('agent_id', agentId)
        .gte('created_at', today.toISOString());

    const { count: runsThisWeek } = await supabase
        .from('agent_runs')
        .select('*', { count: 'exact', head: true })
        .eq('agent_id', agentId)
        .gte('created_at', weekAgo.toISOString());

    return {
        totalRuns: agent.total_runs,
        successfulRuns: agent.successful_runs,
        failedRuns: agent.failed_runs,
        avgDurationMs: agent.avg_duration_ms || 0,
        runsToday: runsToday || 0,
        runsThisWeek: runsThisWeek || 0
    };
}
