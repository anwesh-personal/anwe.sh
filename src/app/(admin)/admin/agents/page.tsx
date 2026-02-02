'use client';

import { useState, useEffect, useCallback } from 'react';
import { AdminHeader } from '@/components/admin';
import {
    getAgents,
    updateAgentStatus,
    toggleAgentEnabled,
    getAgentRuns,
    createAgentRun,
    updateAgentRun
} from '@/lib/agents';
import type { Agent, AgentRun, AgentStatus, AgentType } from '@/types';
import { formatDistanceToNow } from 'date-fns';

export default function AgentsPage() {
    const [agents, setAgents] = useState<Agent[]>([]);
    const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
    const [agentRuns, setAgentRuns] = useState<AgentRun[]>([]);
    const [loading, setLoading] = useState(true);
    const [runningAgentId, setRunningAgentId] = useState<string | null>(null);
    const [showConfigModal, setShowConfigModal] = useState(false);

    // Load agents
    const loadAgents = useCallback(async () => {
        setLoading(true);
        const data = await getAgents();
        setAgents(data);
        setLoading(false);
    }, []);

    useEffect(() => {
        loadAgents();
    }, [loadAgents]);

    // Load runs for selected agent
    useEffect(() => {
        if (selectedAgent) {
            getAgentRuns(selectedAgent.id).then(setAgentRuns);
        } else {
            setAgentRuns([]);
        }
    }, [selectedAgent]);

    // Run an agent
    const runAgent = async (agent: Agent) => {
        setRunningAgentId(agent.id);

        // Update agent status to active
        await updateAgentStatus(agent.id, 'active', 'Running...');

        // Create a run record
        const run = await createAgentRun(agent.id, 'manual_execution', {
            trigger: 'user',
            timestamp: new Date().toISOString()
        }, 'manual');

        if (!run) {
            setRunningAgentId(null);
            return;
        }

        // Simulate agent execution (replace with actual AI call later)
        setTimeout(async () => {
            // Complete the run
            await updateAgentRun(run.id, 'success', {
                result: 'Agent completed successfully',
                timestamp: new Date().toISOString()
            }, undefined, 2340);

            // Update agent status
            await updateAgentStatus(agent.id, 'idle');

            // Reload agents
            await loadAgents();

            // Reload runs if this agent is selected
            if (selectedAgent?.id === agent.id) {
                const runs = await getAgentRuns(agent.id);
                setAgentRuns(runs);
            }

            setRunningAgentId(null);
        }, 2000 + Math.random() * 2000);
    };

    // Run all agents
    const runAllAgents = async () => {
        const enabledAgents = agents.filter(a => a.is_enabled && a.status !== 'active');
        for (const agent of enabledAgents) {
            await runAgent(agent);
        }
    };

    // Toggle agent enabled
    const handleToggleEnabled = async (agent: Agent) => {
        await toggleAgentEnabled(agent.id, !agent.is_enabled);
        await loadAgents();
    };

    // Get status color and icon
    const getStatusInfo = (status: AgentStatus) => {
        switch (status) {
            case 'active':
                return { color: '#10b981', icon: '●', label: 'Active' };
            case 'idle':
                return { color: 'var(--color-foreground-muted)', icon: '○', label: 'Idle' };
            case 'disabled':
                return { color: '#6b7280', icon: '◌', label: 'Disabled' };
            case 'error':
                return { color: '#ef4444', icon: '✕', label: 'Error' };
            case 'scheduled':
                return { color: '#f59e0b', icon: '◎', label: 'Scheduled' };
            default:
                return { color: 'var(--color-foreground-muted)', icon: '○', label: status };
        }
    };

    // Get type color
    const getTypeColor = (type: AgentType) => {
        switch (type) {
            case 'orchestrator': return '#8b5cf6';
            case 'content': return '#06b6d4';
            case 'visual': return '#ec4899';
            case 'optimization': return '#10b981';
            case 'distribution': return '#f97316';
            case 'analytics': return '#3b82f6';
            case 'custom': return '#6b7280';
            default: return 'var(--color-foreground-muted)';
        }
    };

    if (loading) {
        return (
            <>
                <AdminHeader
                    title="AI Agents"
                    subtitle="Loading agents..."
                />
                <div className="admin-content">
                    <div style={{
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        minHeight: '300px'
                    }}>
                        <div className="loading-spinner" />
                    </div>
                </div>
            </>
        );
    }

    return (
        <>
            <AdminHeader
                title="AI Agents"
                subtitle={`${agents.filter(a => a.is_enabled).length} active agents • ${agents.reduce((sum, a) => sum + a.total_runs, 0)} total runs`}
                actions={
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button
                            className="btn btn-secondary"
                            onClick={loadAgents}
                        >
                            Refresh
                        </button>
                        <button
                            className="btn btn-primary"
                            onClick={runAllAgents}
                            disabled={runningAgentId !== null}
                        >
                            ▶ Run All
                        </button>
                    </div>
                }
            />

            <div className="admin-content">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 400px', gap: '1.5rem' }}>
                    {/* Agents Grid */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {agents.length === 0 ? (
                            <div className="admin-card">
                                <div className="admin-card-body" style={{
                                    textAlign: 'center',
                                    padding: '3rem',
                                    color: 'var(--color-foreground-muted)'
                                }}>
                                    <p style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🤖</p>
                                    <p>No agents found. Run the database migration to create default agents.</p>
                                </div>
                            </div>
                        ) : (
                            agents.map(agent => {
                                const statusInfo = getStatusInfo(agent.status);
                                const isRunning = runningAgentId === agent.id;

                                return (
                                    <div
                                        key={agent.id}
                                        className="admin-card"
                                        style={{
                                            cursor: 'pointer',
                                            transition: 'all 0.15s ease',
                                            border: selectedAgent?.id === agent.id
                                                ? '1px solid var(--color-accent-solid)'
                                                : undefined,
                                            opacity: agent.is_enabled ? 1 : 0.6
                                        }}
                                        onClick={() => setSelectedAgent(agent)}
                                    >
                                        <div className="admin-card-body">
                                            <div style={{
                                                display: 'flex',
                                                alignItems: 'flex-start',
                                                gap: '1rem'
                                            }}>
                                                {/* Icon */}
                                                <div style={{
                                                    fontSize: '2rem',
                                                    width: '50px',
                                                    height: '50px',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    background: 'var(--color-background-secondary)',
                                                    borderRadius: 'var(--radius-md)'
                                                }}>
                                                    {agent.icon}
                                                </div>

                                                {/* Info */}
                                                <div style={{ flex: 1 }}>
                                                    <div style={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '0.75rem',
                                                        marginBottom: '0.25rem'
                                                    }}>
                                                        <h3 style={{
                                                            margin: 0,
                                                            fontWeight: '600',
                                                            fontSize: '1rem'
                                                        }}>
                                                            {agent.name}
                                                        </h3>
                                                        <span style={{
                                                            fontSize: '0.7rem',
                                                            padding: '0.125rem 0.5rem',
                                                            borderRadius: '9999px',
                                                            background: `${getTypeColor(agent.type)}20`,
                                                            color: getTypeColor(agent.type),
                                                            fontWeight: '500',
                                                            textTransform: 'uppercase'
                                                        }}>
                                                            {agent.type}
                                                        </span>
                                                    </div>
                                                    <p style={{
                                                        margin: 0,
                                                        fontSize: '0.85rem',
                                                        color: 'var(--color-foreground-muted)',
                                                        marginBottom: '0.5rem'
                                                    }}>
                                                        {agent.description}
                                                    </p>
                                                    <div style={{
                                                        display: 'flex',
                                                        gap: '1.5rem',
                                                        fontSize: '0.8rem',
                                                        color: 'var(--color-foreground-muted)'
                                                    }}>
                                                        <span>
                                                            <strong style={{ color: 'var(--color-foreground)' }}>
                                                                {agent.model}
                                                            </strong>
                                                        </span>
                                                        <span>
                                                            {agent.total_runs} runs
                                                        </span>
                                                        {agent.last_run_at && (
                                                            <span>
                                                                Last run: {formatDistanceToNow(new Date(agent.last_run_at), { addSuffix: true })}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Status & Actions */}
                                                <div style={{
                                                    display: 'flex',
                                                    flexDirection: 'column',
                                                    alignItems: 'flex-end',
                                                    gap: '0.5rem'
                                                }}>
                                                    <div style={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '0.5rem',
                                                        fontSize: '0.8rem',
                                                        color: statusInfo.color
                                                    }}>
                                                        <span style={{
                                                            animation: agent.status === 'active' || isRunning
                                                                ? 'pulse 1s infinite'
                                                                : undefined
                                                        }}>
                                                            {statusInfo.icon}
                                                        </span>
                                                        {isRunning ? 'Running...' : statusInfo.label}
                                                    </div>
                                                    <div style={{ display: 'flex', gap: '0.25rem' }}>
                                                        <button
                                                            className="btn btn-sm btn-ghost"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                if (!isRunning) runAgent(agent);
                                                            }}
                                                            disabled={!agent.is_enabled || isRunning}
                                                            title="Run agent"
                                                        >
                                                            ▶
                                                        </button>
                                                        <button
                                                            className="btn btn-sm btn-ghost"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleToggleEnabled(agent);
                                                            }}
                                                            title={agent.is_enabled ? 'Disable' : 'Enable'}
                                                        >
                                                            {agent.is_enabled ? '⏸' : '⏵'}
                                                        </button>
                                                        <button
                                                            className="btn btn-sm btn-ghost"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setSelectedAgent(agent);
                                                                setShowConfigModal(true);
                                                            }}
                                                            title="Configure"
                                                        >
                                                            ⚙
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>

                    {/* Details Panel */}
                    <div className="admin-card" style={{
                        position: 'sticky',
                        top: '1rem',
                        alignSelf: 'start'
                    }}>
                        {selectedAgent ? (
                            <>
                                <div className="admin-card-header">
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                        <span style={{ fontSize: '1.5rem' }}>{selectedAgent.icon}</span>
                                        <div>
                                            <h2 className="admin-card-title">{selectedAgent.name}</h2>
                                            <p style={{
                                                margin: 0,
                                                fontSize: '0.8rem',
                                                color: 'var(--color-foreground-muted)'
                                            }}>
                                                {selectedAgent.provider} / {selectedAgent.model}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                                <div className="admin-card-body" style={{ padding: 0 }}>
                                    {/* Stats */}
                                    <div style={{
                                        display: 'grid',
                                        gridTemplateColumns: 'repeat(3, 1fr)',
                                        borderBottom: '1px solid var(--color-border)'
                                    }}>
                                        <div style={{
                                            padding: '1rem',
                                            textAlign: 'center',
                                            borderRight: '1px solid var(--color-border)'
                                        }}>
                                            <div style={{
                                                fontSize: '1.25rem',
                                                fontWeight: '600',
                                                color: 'var(--color-foreground)'
                                            }}>
                                                {selectedAgent.total_runs}
                                            </div>
                                            <div style={{
                                                fontSize: '0.75rem',
                                                color: 'var(--color-foreground-muted)'
                                            }}>
                                                Total Runs
                                            </div>
                                        </div>
                                        <div style={{
                                            padding: '1rem',
                                            textAlign: 'center',
                                            borderRight: '1px solid var(--color-border)'
                                        }}>
                                            <div style={{
                                                fontSize: '1.25rem',
                                                fontWeight: '600',
                                                color: '#10b981'
                                            }}>
                                                {selectedAgent.successful_runs}
                                            </div>
                                            <div style={{
                                                fontSize: '0.75rem',
                                                color: 'var(--color-foreground-muted)'
                                            }}>
                                                Successful
                                            </div>
                                        </div>
                                        <div style={{ padding: '1rem', textAlign: 'center' }}>
                                            <div style={{
                                                fontSize: '1.25rem',
                                                fontWeight: '600',
                                                color: '#ef4444'
                                            }}>
                                                {selectedAgent.failed_runs}
                                            </div>
                                            <div style={{
                                                fontSize: '0.75rem',
                                                color: 'var(--color-foreground-muted)'
                                            }}>
                                                Failed
                                            </div>
                                        </div>
                                    </div>

                                    {/* System Prompt Preview */}
                                    {selectedAgent.system_prompt && (
                                        <div style={{
                                            padding: '1rem',
                                            borderBottom: '1px solid var(--color-border)'
                                        }}>
                                            <div style={{
                                                fontSize: '0.75rem',
                                                color: 'var(--color-foreground-muted)',
                                                marginBottom: '0.5rem'
                                            }}>
                                                System Prompt
                                            </div>
                                            <div style={{
                                                fontSize: '0.85rem',
                                                color: 'var(--color-foreground)',
                                                fontStyle: 'italic',
                                                lineHeight: '1.5',
                                                maxHeight: '100px',
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis'
                                            }}>
                                                {selectedAgent.system_prompt.slice(0, 200)}
                                                {selectedAgent.system_prompt.length > 200 ? '...' : ''}
                                            </div>
                                        </div>
                                    )}

                                    {/* Recent Runs */}
                                    <div style={{ padding: '1rem' }}>
                                        <div style={{
                                            fontSize: '0.75rem',
                                            color: 'var(--color-foreground-muted)',
                                            marginBottom: '0.75rem'
                                        }}>
                                            Recent Runs
                                        </div>
                                        {agentRuns.length === 0 ? (
                                            <p style={{
                                                fontSize: '0.85rem',
                                                color: 'var(--color-foreground-muted)',
                                                textAlign: 'center',
                                                padding: '1rem 0'
                                            }}>
                                                No runs yet
                                            </p>
                                        ) : (
                                            <div style={{
                                                display: 'flex',
                                                flexDirection: 'column',
                                                gap: '0.5rem',
                                                maxHeight: '250px',
                                                overflowY: 'auto'
                                            }}>
                                                {agentRuns.slice(0, 10).map(run => (
                                                    <div
                                                        key={run.id}
                                                        style={{
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'space-between',
                                                            padding: '0.5rem 0.75rem',
                                                            background: 'var(--color-background)',
                                                            borderRadius: 'var(--radius-sm)',
                                                            fontSize: '0.8rem'
                                                        }}
                                                    >
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                            <span style={{
                                                                color: run.status === 'success' ? '#10b981'
                                                                    : run.status === 'error' ? '#ef4444'
                                                                        : '#f59e0b'
                                                            }}>
                                                                {run.status === 'success' ? '✓'
                                                                    : run.status === 'error' ? '✕'
                                                                        : '○'}
                                                            </span>
                                                            <span>{run.action}</span>
                                                        </div>
                                                        <div style={{
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: '0.75rem',
                                                            color: 'var(--color-foreground-muted)'
                                                        }}>
                                                            {run.duration_ms && (
                                                                <span>{(run.duration_ms / 1000).toFixed(1)}s</span>
                                                            )}
                                                            <span>
                                                                {formatDistanceToNow(new Date(run.created_at), { addSuffix: true })}
                                                            </span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className="admin-card-body" style={{
                                textAlign: 'center',
                                padding: '3rem',
                                color: 'var(--color-foreground-muted)'
                            }}>
                                <p style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>←</p>
                                <p>Select an agent to view details</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <style jsx>{`
                @keyframes pulse {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.5; }
                }
                
                .loading-spinner {
                    width: 40px;
                    height: 40px;
                    border: 3px solid var(--color-border);
                    border-top-color: var(--color-accent-solid);
                    border-radius: 50%;
                    animation: spin 1s linear infinite;
                }
                
                @keyframes spin {
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </>
    );
}
