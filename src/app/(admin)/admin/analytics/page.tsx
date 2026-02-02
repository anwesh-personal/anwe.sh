import { AdminHeader } from '@/components/admin';

export default function AnalyticsPage() {
    return (
        <>
            <AdminHeader
                title="Analytics"
                subtitle="Track your content performance"
                actions={
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <select
                            style={{
                                padding: '0.625rem 1rem',
                                background: 'var(--color-surface)',
                                border: '1px solid var(--color-border)',
                                borderRadius: 'var(--radius-md)',
                                color: 'var(--color-foreground)',
                                fontSize: '0.875rem',
                                cursor: 'pointer'
                            }}
                        >
                            <option>Last 7 days</option>
                            <option>Last 30 days</option>
                            <option>Last 90 days</option>
                            <option>This year</option>
                        </select>
                        <button className="btn btn-secondary">
                            Export
                        </button>
                    </div>
                }
            />

            <div className="admin-content">
                {/* Summary Stats */}
                <div className="stats-grid">
                    <div className="stat-card">
                        <div className="stat-card-header">
                            <div className="stat-card-icon">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                    <circle cx="12" cy="12" r="3" />
                                </svg>
                            </div>
                            <span className="stat-card-change positive">+28%</span>
                        </div>
                        <div className="stat-card-value">12,847</div>
                        <div className="stat-card-label">Total Page Views</div>
                    </div>

                    <div className="stat-card">
                        <div className="stat-card-header">
                            <div className="stat-card-icon">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                                    <circle cx="9" cy="7" r="4" />
                                    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                                </svg>
                            </div>
                            <span className="stat-card-change positive">+15%</span>
                        </div>
                        <div className="stat-card-value">4,291</div>
                        <div className="stat-card-label">Unique Visitors</div>
                    </div>

                    <div className="stat-card">
                        <div className="stat-card-header">
                            <div className="stat-card-icon">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <circle cx="12" cy="12" r="10" />
                                    <polyline points="12,6 12,12 16,14" />
                                </svg>
                            </div>
                            <span className="stat-card-change negative">-5%</span>
                        </div>
                        <div className="stat-card-value">3:24</div>
                        <div className="stat-card-label">Avg. Session</div>
                    </div>

                    <div className="stat-card">
                        <div className="stat-card-header">
                            <div className="stat-card-icon">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                                    <polyline points="15,3 21,3 21,9" />
                                    <line x1="10" y1="14" x2="21" y2="3" />
                                </svg>
                            </div>
                            <span className="stat-card-change positive">+42%</span>
                        </div>
                        <div className="stat-card-value">34.2%</div>
                        <div className="stat-card-label">Bounce Rate</div>
                    </div>
                </div>

                {/* Traffic Chart Placeholder */}
                <div className="admin-card" style={{ marginBottom: '1.5rem' }}>
                    <div className="admin-card-header">
                        <h2 className="admin-card-title">Traffic Overview</h2>
                    </div>
                    <div className="admin-card-body">
                        <div style={{
                            height: '300px',
                            background: 'var(--color-background-secondary)',
                            borderRadius: 'var(--radius-md)',
                            display: 'flex',
                            alignItems: 'flex-end',
                            padding: '1.5rem',
                            gap: '0.5rem'
                        }}>
                            {/* Simple bar chart visualization */}
                            {[35, 45, 55, 40, 65, 80, 70, 60, 75, 90, 85, 95, 88, 72].map((height, i) => (
                                <div
                                    key={i}
                                    style={{
                                        flex: 1,
                                        height: `${height}%`,
                                        background: 'var(--color-accent-gradient)',
                                        borderRadius: 'var(--radius-sm)',
                                        opacity: 0.7 + (height / 500),
                                        transition: 'height 0.3s ease'
                                    }}
                                />
                            ))}
                        </div>
                        <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            marginTop: '1rem',
                            fontSize: '0.75rem',
                            color: 'var(--color-foreground-muted)'
                        }}>
                            <span>Jan 20</span>
                            <span>Jan 23</span>
                            <span>Jan 26</span>
                            <span>Jan 29</span>
                            <span>Feb 1</span>
                        </div>
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                    {/* Top Posts */}
                    <div className="admin-card">
                        <div className="admin-card-header">
                            <h2 className="admin-card-title">Top Posts</h2>
                        </div>
                        <div className="admin-card-body" style={{ padding: 0 }}>
                            {[
                                { title: 'Why 90% of Enterprise AI Projects Fail', views: 2847, growth: '+42%' },
                                { title: 'The Hidden Cost of Technical Debt', views: 1923, growth: '+28%' },
                                { title: 'Building Products Users Actually Want', views: 1456, growth: '+15%' },
                                { title: 'Leadership Lessons from 15 Years', views: 892, growth: '+8%' },
                                { title: 'The Future of AI Agents', views: 654, growth: 'New' },
                            ].map((post, i) => (
                                <div
                                    key={i}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '1rem',
                                        padding: '1rem 1.5rem',
                                        borderBottom: i < 4 ? '1px solid var(--color-border)' : 'none'
                                    }}
                                >
                                    <span style={{
                                        width: '24px',
                                        height: '24px',
                                        borderRadius: 'var(--radius-sm)',
                                        background: 'var(--color-background-secondary)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: '0.75rem',
                                        fontWeight: '600',
                                        color: 'var(--color-foreground-secondary)'
                                    }}>
                                        {i + 1}
                                    </span>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{
                                            fontSize: '0.9rem',
                                            color: 'var(--color-foreground)',
                                            whiteSpace: 'nowrap',
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis'
                                        }}>
                                            {post.title}
                                        </div>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <div style={{
                                            fontSize: '0.9rem',
                                            fontWeight: '600',
                                            color: 'var(--color-foreground)'
                                        }}>
                                            {post.views.toLocaleString()}
                                        </div>
                                        <div style={{
                                            fontSize: '0.7rem',
                                            color: 'var(--color-success)'
                                        }}>
                                            {post.growth}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Traffic Sources */}
                    <div className="admin-card">
                        <div className="admin-card-header">
                            <h2 className="admin-card-title">Traffic Sources</h2>
                        </div>
                        <div className="admin-card-body">
                            {[
                                { source: 'Organic Search', visitors: 1842, percent: 43, color: 'var(--color-accent-start)' },
                                { source: 'Twitter/X', visitors: 1124, percent: 26, color: 'var(--color-accent-end)' },
                                { source: 'LinkedIn', visitors: 689, percent: 16, color: 'var(--color-info)' },
                                { source: 'Direct', visitors: 421, percent: 10, color: 'var(--color-warning)' },
                                { source: 'Other', visitors: 215, percent: 5, color: 'var(--color-foreground-muted)' },
                            ].map((item, i) => (
                                <div key={i} style={{ marginBottom: i < 4 ? '1.25rem' : 0 }}>
                                    <div style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        marginBottom: '0.5rem',
                                        fontSize: '0.9rem'
                                    }}>
                                        <span style={{ color: 'var(--color-foreground)' }}>{item.source}</span>
                                        <span style={{ color: 'var(--color-foreground-secondary)' }}>
                                            {item.visitors.toLocaleString()} ({item.percent}%)
                                        </span>
                                    </div>
                                    <div style={{
                                        height: '8px',
                                        background: 'var(--color-background-secondary)',
                                        borderRadius: 'var(--radius-full)',
                                        overflow: 'hidden'
                                    }}>
                                        <div style={{
                                            width: `${item.percent}%`,
                                            height: '100%',
                                            background: item.color,
                                            borderRadius: 'var(--radius-full)',
                                            transition: 'width 0.3s ease'
                                        }} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
