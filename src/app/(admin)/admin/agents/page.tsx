import { AdminHeader } from '@/components/admin';

export default function AgentsPage() {
    const agents = [
        {
            name: 'ORA',
            type: 'Orchestrator',
            model: 'GPT-4 Turbo',
            status: 'active',
            lastRun: '2 min ago',
            totalRuns: 1247,
            icon: '🧠',
            description: 'Central brain that coordinates all agents'
        },
        {
            name: 'Writer',
            type: 'Content',
            model: 'Claude 3 Opus',
            status: 'active',
            lastRun: '15 min ago',
            totalRuns: 89,
            icon: '✍️',
            description: 'Creates long-form blog content'
        },
        {
            name: 'Imager',
            type: 'Visual',
            model: 'DALL-E 3',
            status: 'active',
            lastRun: '1 hour ago',
            totalRuns: 156,
            icon: '🎨',
            description: 'Generates images and graphics'
        },
        {
            name: 'SEO',
            type: 'Optimization',
            model: 'GPT-4 Turbo',
            status: 'idle',
            lastRun: '3 hours ago',
            totalRuns: 234,
            icon: '📊',
            description: 'Optimizes content for search engines'
        },
        {
            name: 'Social',
            type: 'Distribution',
            model: 'GPT-4 Turbo',
            status: 'idle',
            lastRun: '6 hours ago',
            totalRuns: 412,
            icon: '📱',
            description: 'Creates and posts social media content'
        },
        {
            name: 'Analyst',
            type: 'Analytics',
            model: 'GPT-4 Turbo',
            status: 'scheduled',
            lastRun: 'Yesterday',
            totalRuns: 67,
            icon: '📈',
            description: 'Analyzes content performance'
        }
    ];

    const getStatusStyle = (status: string) => {
        switch (status) {
            case 'active':
                return { background: 'rgba(52, 211, 153, 0.15)', color: 'var(--color-success)' };
            case 'idle':
                return { background: 'var(--color-background-secondary)', color: 'var(--color-foreground-secondary)' };
            case 'scheduled':
                return { background: 'rgba(96, 165, 250, 0.15)', color: 'var(--color-info)' };
            case 'error':
                return { background: 'rgba(248, 113, 113, 0.15)', color: 'var(--color-error)' };
            default:
                return { background: 'var(--color-background-secondary)', color: 'var(--color-foreground-secondary)' };
        }
    };

    return (
        <>
            <AdminHeader
                title="AI Agents"
                subtitle="Monitor and control your AI agent swarm"
                actions={
                    <button className="btn btn-primary">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polygon points="5,3 19,12 5,21" />
                        </svg>
                        Run All Agents
                    </button>
                }
            />

            <div className="admin-content">
                {/* Agent Grid */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
                    gap: '1.5rem'
                }}>
                    {agents.map((agent) => (
                        <div
                            key={agent.name}
                            className="admin-card"
                            style={{
                                background: agent.name === 'ORA'
                                    ? 'linear-gradient(135deg, var(--color-surface), var(--color-surface-hover))'
                                    : 'var(--color-surface)',
                                borderColor: agent.name === 'ORA' ? 'var(--color-accent-solid)' : undefined
                            }}
                        >
                            <div className="admin-card-body">
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'flex-start',
                                    justifyContent: 'space-between',
                                    marginBottom: '1rem'
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                        <span style={{
                                            fontSize: '2rem',
                                            width: '50px',
                                            height: '50px',
                                            borderRadius: 'var(--radius-lg)',
                                            background: 'var(--color-background-secondary)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center'
                                        }}>
                                            {agent.icon}
                                        </span>
                                        <div>
                                            <h3 style={{
                                                fontSize: '1.1rem',
                                                fontWeight: '600',
                                                color: 'var(--color-foreground)',
                                                marginBottom: '0.125rem'
                                            }}>
                                                {agent.name}
                                            </h3>
                                            <span style={{
                                                fontSize: '0.75rem',
                                                color: 'var(--color-foreground-muted)',
                                                textTransform: 'uppercase',
                                                letterSpacing: '0.5px'
                                            }}>
                                                {agent.type}
                                            </span>
                                        </div>
                                    </div>
                                    <span style={{
                                        padding: '0.25rem 0.75rem',
                                        borderRadius: '9999px',
                                        fontSize: '0.75rem',
                                        fontWeight: '600',
                                        textTransform: 'capitalize',
                                        ...getStatusStyle(agent.status)
                                    }}>
                                        {agent.status}
                                    </span>
                                </div>

                                <p style={{
                                    fontSize: '0.85rem',
                                    color: 'var(--color-foreground-secondary)',
                                    marginBottom: '1rem'
                                }}>
                                    {agent.description}
                                </p>

                                <div style={{
                                    display: 'grid',
                                    gridTemplateColumns: '1fr 1fr 1fr',
                                    gap: '0.5rem',
                                    padding: '0.75rem',
                                    background: 'var(--color-background)',
                                    borderRadius: 'var(--radius-md)',
                                    marginBottom: '1rem'
                                }}>
                                    <div style={{ textAlign: 'center' }}>
                                        <div style={{
                                            fontSize: '0.7rem',
                                            color: 'var(--color-foreground-muted)',
                                            marginBottom: '0.25rem'
                                        }}>Model</div>
                                        <div style={{
                                            fontSize: '0.75rem',
                                            color: 'var(--color-foreground)',
                                            fontFamily: 'var(--font-mono)'
                                        }}>{agent.model.split(' ')[0]}</div>
                                    </div>
                                    <div style={{ textAlign: 'center' }}>
                                        <div style={{
                                            fontSize: '0.7rem',
                                            color: 'var(--color-foreground-muted)',
                                            marginBottom: '0.25rem'
                                        }}>Last Run</div>
                                        <div style={{
                                            fontSize: '0.75rem',
                                            color: 'var(--color-foreground)'
                                        }}>{agent.lastRun}</div>
                                    </div>
                                    <div style={{ textAlign: 'center' }}>
                                        <div style={{
                                            fontSize: '0.7rem',
                                            color: 'var(--color-foreground-muted)',
                                            marginBottom: '0.25rem'
                                        }}>Total Runs</div>
                                        <div style={{
                                            fontSize: '0.75rem',
                                            color: 'var(--color-foreground)'
                                        }}>{agent.totalRuns.toLocaleString()}</div>
                                    </div>
                                </div>

                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <button className="btn btn-secondary btn-sm" style={{ flex: 1 }}>
                                        Configure
                                    </button>
                                    <button className="btn btn-primary btn-sm" style={{ flex: 1 }}>
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <polygon points="5,3 19,12 5,21" />
                                        </svg>
                                        Run
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Recent Agent Logs */}
                <div className="admin-card" style={{ marginTop: '2rem' }}>
                    <div className="admin-card-header">
                        <h2 className="admin-card-title">Recent Agent Activity</h2>
                        <button className="btn btn-ghost btn-sm">View Full Logs</button>
                    </div>
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th>Agent</th>
                                <th>Action</th>
                                <th>Result</th>
                                <th>Duration</th>
                                <th>Time</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <span>🧠</span>
                                        <strong>ORA</strong>
                                    </div>
                                </td>
                                <td>Parsed command: &quot;Write about AI trends&quot;</td>
                                <td>
                                    <span style={{ color: 'var(--color-success)' }}>✓ Delegated to Writer</span>
                                </td>
                                <td>0.8s</td>
                                <td>2 min ago</td>
                            </tr>
                            <tr>
                                <td>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <span>✍️</span>
                                        <strong>Writer</strong>
                                    </div>
                                </td>
                                <td>Generated blog post draft</td>
                                <td>
                                    <span style={{ color: 'var(--color-success)' }}>✓ 2,400 words</span>
                                </td>
                                <td>45.2s</td>
                                <td>15 min ago</td>
                            </tr>
                            <tr>
                                <td>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <span>🎨</span>
                                        <strong>Imager</strong>
                                    </div>
                                </td>
                                <td>Generated cover image</td>
                                <td>
                                    <span style={{ color: 'var(--color-success)' }}>✓ 1792x1024 HD</span>
                                </td>
                                <td>12.1s</td>
                                <td>1 hour ago</td>
                            </tr>
                            <tr>
                                <td>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <span>📊</span>
                                        <strong>SEO</strong>
                                    </div>
                                </td>
                                <td>Optimized 3 blog posts</td>
                                <td>
                                    <span style={{ color: 'var(--color-success)' }}>✓ Score +15 avg</span>
                                </td>
                                <td>8.5s</td>
                                <td>3 hours ago</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </>
    );
}
