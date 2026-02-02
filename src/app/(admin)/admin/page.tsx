import { AdminHeader } from '@/components/admin';
import { getDashboardStats } from '@/lib/supabase';
import Link from 'next/link';

export const revalidate = 60; // Revalidate every minute

export default async function AdminDashboard() {
    const stats = await getDashboardStats();

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
                        </div>
                        <div className="stat-card-value">{stats.totalPosts}</div>
                        <div className="stat-card-label">Total Posts</div>
                    </div>

                    <div className="stat-card">
                        <div className="stat-card-header">
                            <div className="stat-card-icon">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <polyline points="20,6 9,17 4,12" />
                                </svg>
                            </div>
                            <span className="stat-card-change positive">Live</span>
                        </div>
                        <div className="stat-card-value">{stats.publishedPosts}</div>
                        <div className="stat-card-label">Published</div>
                    </div>

                    <div className="stat-card">
                        <div className="stat-card-header">
                            <div className="stat-card-icon">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                                </svg>
                            </div>
                        </div>
                        <div className="stat-card-value">{stats.draftPosts}</div>
                        <div className="stat-card-label">Drafts</div>
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

                                <Link href="/admin/agents" className="quick-action-btn">
                                    <span className="quick-action-icon">
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <circle cx="12" cy="12" r="3" />
                                            <path d="M12 2v4m0 12v4M2 12h4m12 0h4" />
                                        </svg>
                                    </span>
                                    Manage Agents
                                </Link>

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

                    {/* Recent Posts */}
                    <div className="admin-card">
                        <div className="admin-card-header">
                            <h2 className="admin-card-title">Recent Posts</h2>
                            <Link href="/admin/posts" className="btn btn-ghost btn-sm">View All</Link>
                        </div>
                        <div className="admin-card-body" style={{ padding: '0.5rem 1.5rem' }}>
                            <div className="activity-list">
                                {stats.recentPosts.length === 0 ? (
                                    <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-foreground-muted)' }}>
                                        No posts yet. Create your first post!
                                    </div>
                                ) : (
                                    stats.recentPosts.map((post: { id: string; title: string; slug: string; published: boolean; created_at: string; source: string; source_agent: string | null }) => (
                                        <div key={post.id} className="activity-item">
                                            <div className="activity-icon">
                                                {post.source === 'manual' ? (
                                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                                    </svg>
                                                ) : (
                                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                        <circle cx="12" cy="12" r="3" />
                                                        <path d="M12 2v4" />
                                                    </svg>
                                                )}
                                            </div>
                                            <div className="activity-content">
                                                <div className="activity-text">
                                                    <Link href={`/admin/posts/${post.id}`} style={{ color: 'var(--color-foreground)', textDecoration: 'none' }}>
                                                        {post.title}
                                                    </Link>
                                                </div>
                                                <div className="activity-time">
                                                    {post.published ? (
                                                        <span style={{ color: 'var(--color-success)' }}>Published</span>
                                                    ) : (
                                                        <span style={{ color: 'var(--color-warning)' }}>Draft</span>
                                                    )}
                                                    {' • '}
                                                    {new Date(post.created_at).toLocaleDateString()}
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
