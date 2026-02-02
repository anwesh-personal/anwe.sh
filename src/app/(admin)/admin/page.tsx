import { AdminHeader } from '@/components/admin';
import Link from 'next/link';

export default function AdminDashboard() {
    return (
        <>
            <AdminHeader
                title="Dashboard"
                subtitle="Welcome back. Here's what's happening."
            />

            <div className="admin-content">
                {/* Stats Grid */}
                <div className="stats-grid">
                    <div className="stat-card">
                        <div className="stat-card-header">
                            <div className="stat-card-icon">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                    <polyline points="14,2 14,8 20,8" />
                                </svg>
                            </div>
                            <span className="stat-card-change positive">+12%</span>
                        </div>
                        <div className="stat-card-value">24</div>
                        <div className="stat-card-label">Total Posts</div>
                    </div>

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
                        <div className="stat-card-value">12.4K</div>
                        <div className="stat-card-label">Page Views</div>
                    </div>

                    <div className="stat-card">
                        <div className="stat-card-header">
                            <div className="stat-card-icon">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <circle cx="12" cy="12" r="3" />
                                    <path d="M12 2v4m0 12v4M2 12h4m12 0h4" />
                                </svg>
                            </div>
                            <span className="stat-card-change positive">Active</span>
                        </div>
                        <div className="stat-card-value">5</div>
                        <div className="stat-card-label">AI Agents</div>
                    </div>

                    <div className="stat-card">
                        <div className="stat-card-header">
                            <div className="stat-card-icon">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <polyline points="22,12 18,12 15,21 9,3 6,12 2,12" />
                                </svg>
                            </div>
                            <span className="stat-card-change negative">-5%</span>
                        </div>
                        <div className="stat-card-value">3.2m</div>
                        <div className="stat-card-label">Avg. Time on Site</div>
                    </div>
                </div>

                {/* Two Column Layout */}
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem' }}>
                    {/* Quick Actions */}
                    <div className="admin-card">
                        <div className="admin-card-header">
                            <h2 className="admin-card-title">Quick Actions</h2>
                        </div>
                        <div className="admin-card-body">
                            <div className="quick-actions">
                                <Link href="/admin/posts/new" className="quick-action-btn">
                                    <span className="quick-action-icon">
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <line x1="12" y1="5" x2="12" y2="19" />
                                            <line x1="5" y1="12" x2="19" y2="12" />
                                        </svg>
                                    </span>
                                    New Post
                                </Link>

                                <button className="quick-action-btn">
                                    <span className="quick-action-icon">
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <circle cx="12" cy="12" r="3" />
                                            <path d="M12 2v4m0 12v4M2 12h4m12 0h4" />
                                        </svg>
                                    </span>
                                    Trigger ORA
                                </button>

                                <Link href="/admin/analytics" className="quick-action-btn">
                                    <span className="quick-action-icon">
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <line x1="18" y1="20" x2="18" y2="10" />
                                            <line x1="12" y1="20" x2="12" y2="4" />
                                            <line x1="6" y1="20" x2="6" y2="14" />
                                        </svg>
                                    </span>
                                    View Analytics
                                </Link>

                                <Link href="/admin/settings" className="quick-action-btn">
                                    <span className="quick-action-icon">
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <circle cx="12" cy="12" r="3" />
                                            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33" />
                                        </svg>
                                    </span>
                                    Settings
                                </Link>
                            </div>
                        </div>
                    </div>

                    {/* Recent Activity */}
                    <div className="admin-card">
                        <div className="admin-card-header">
                            <h2 className="admin-card-title">Recent Activity</h2>
                            <button className="btn btn-ghost btn-sm">View All</button>
                        </div>
                        <div className="admin-card-body" style={{ padding: '0.5rem 1.5rem' }}>
                            <div className="activity-list">
                                <div className="activity-item">
                                    <div className="activity-icon">
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                        </svg>
                                    </div>
                                    <div className="activity-content">
                                        <div className="activity-text">
                                            <strong>Writer Agent</strong> created new post draft
                                        </div>
                                        <div className="activity-time">2 hours ago</div>
                                    </div>
                                </div>

                                <div className="activity-item">
                                    <div className="activity-icon">
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                                            <circle cx="8.5" cy="8.5" r="1.5" />
                                            <polyline points="21,15 16,10 5,21" />
                                        </svg>
                                    </div>
                                    <div className="activity-content">
                                        <div className="activity-text">
                                            <strong>Imager Agent</strong> generated cover image
                                        </div>
                                        <div className="activity-time">4 hours ago</div>
                                    </div>
                                </div>

                                <div className="activity-item">
                                    <div className="activity-icon">
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <polyline points="20,6 9,17 4,12" />
                                        </svg>
                                    </div>
                                    <div className="activity-content">
                                        <div className="activity-text">
                                            Post <strong>&quot;AI Trends 2026&quot;</strong> published
                                        </div>
                                        <div className="activity-time">Yesterday</div>
                                    </div>
                                </div>

                                <div className="activity-item">
                                    <div className="activity-icon">
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <circle cx="12" cy="12" r="3" />
                                            <path d="M12 2v4m0 12v4" />
                                        </svg>
                                    </div>
                                    <div className="activity-content">
                                        <div className="activity-text">
                                            <strong>SEO Agent</strong> optimized 3 posts
                                        </div>
                                        <div className="activity-time">2 days ago</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Recent Posts Table */}
                <div className="admin-card" style={{ marginTop: '1.5rem' }}>
                    <div className="admin-card-header">
                        <h2 className="admin-card-title">Recent Posts</h2>
                        <Link href="/admin/posts" className="btn btn-secondary btn-sm">
                            View All Posts
                        </Link>
                    </div>
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th>Title</th>
                                <th>Status</th>
                                <th>Views</th>
                                <th>Created</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>
                                    <strong style={{ color: 'var(--color-foreground)' }}>Why 90% of Enterprise AI Projects Fail</strong>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--color-foreground-muted)' }}>By Writer Agent • 12 min read</div>
                                </td>
                                <td>
                                    <span style={{
                                        padding: '0.25rem 0.75rem',
                                        borderRadius: '9999px',
                                        fontSize: '0.75rem',
                                        fontWeight: '600',
                                        background: 'rgba(52, 211, 153, 0.15)',
                                        color: 'var(--color-success)'
                                    }}>Published</span>
                                </td>
                                <td>2,847</td>
                                <td>Feb 1, 2026</td>
                                <td>
                                    <button className="btn btn-ghost btn-sm">Edit</button>
                                </td>
                            </tr>
                            <tr>
                                <td>
                                    <strong style={{ color: 'var(--color-foreground)' }}>The Hidden Cost of Technical Debt</strong>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--color-foreground-muted)' }}>By Writer Agent • 8 min read</div>
                                </td>
                                <td>
                                    <span style={{
                                        padding: '0.25rem 0.75rem',
                                        borderRadius: '9999px',
                                        fontSize: '0.75rem',
                                        fontWeight: '600',
                                        background: 'rgba(52, 211, 153, 0.15)',
                                        color: 'var(--color-success)'
                                    }}>Published</span>
                                </td>
                                <td>1,923</td>
                                <td>Jan 28, 2026</td>
                                <td>
                                    <button className="btn btn-ghost btn-sm">Edit</button>
                                </td>
                            </tr>
                            <tr>
                                <td>
                                    <strong style={{ color: 'var(--color-foreground)' }}>Building Products That Users Actually Want</strong>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--color-foreground-muted)' }}>By You • 15 min read</div>
                                </td>
                                <td>
                                    <span style={{
                                        padding: '0.25rem 0.75rem',
                                        borderRadius: '9999px',
                                        fontSize: '0.75rem',
                                        fontWeight: '600',
                                        background: 'rgba(251, 191, 36, 0.15)',
                                        color: 'var(--color-warning)'
                                    }}>Draft</span>
                                </td>
                                <td>—</td>
                                <td>Today</td>
                                <td>
                                    <button className="btn btn-ghost btn-sm">Edit</button>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </>
    );
}
