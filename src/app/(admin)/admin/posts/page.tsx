import { AdminHeader } from '@/components/admin';
import Link from 'next/link';

export default function PostsPage() {
    return (
        <>
            <AdminHeader
                title="Posts"
                subtitle="Manage your blog content"
                actions={
                    <Link href="/admin/posts/new" className="btn btn-primary">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="12" y1="5" x2="12" y2="19" />
                            <line x1="5" y1="12" x2="19" y2="12" />
                        </svg>
                        New Post
                    </Link>
                }
            />

            <div className="admin-content">
                {/* Filter Bar */}
                <div className="admin-card" style={{ marginBottom: '1.5rem' }}>
                    <div style={{
                        padding: '1rem 1.5rem',
                        display: 'flex',
                        gap: '1rem',
                        alignItems: 'center',
                        flexWrap: 'wrap'
                    }}>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button className="btn btn-secondary btn-sm" style={{ background: 'var(--color-accent-gradient)', color: 'var(--color-background)', border: 'none' }}>
                                All
                            </button>
                            <button className="btn btn-secondary btn-sm">Published</button>
                            <button className="btn btn-secondary btn-sm">Drafts</button>
                            <button className="btn btn-secondary btn-sm">Scheduled</button>
                        </div>
                        <div style={{ flex: 1 }}></div>
                        <input
                            type="text"
                            placeholder="Search posts..."
                            style={{
                                padding: '0.5rem 1rem',
                                background: 'var(--color-background)',
                                border: '1px solid var(--color-border)',
                                borderRadius: 'var(--radius-md)',
                                color: 'var(--color-foreground)',
                                fontSize: '0.875rem',
                                width: '240px'
                            }}
                        />
                    </div>
                </div>

                {/* Posts Table */}
                <div className="admin-card">
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th>Title</th>
                                <th>Category</th>
                                <th>Status</th>
                                <th>Author</th>
                                <th>Views</th>
                                <th>Published</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>
                                    <div>
                                        <strong style={{ color: 'var(--color-foreground)', display: 'block' }}>Why 90% of Enterprise AI Projects Fail</strong>
                                        <span style={{ fontSize: '0.8rem', color: 'var(--color-foreground-muted)' }}>/blog/why-enterprise-ai-fails</span>
                                    </div>
                                </td>
                                <td>
                                    <span style={{
                                        padding: '0.2rem 0.5rem',
                                        borderRadius: 'var(--radius-sm)',
                                        fontSize: '0.75rem',
                                        background: 'var(--color-background-secondary)',
                                        color: 'var(--color-foreground-secondary)'
                                    }}>AI</span>
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
                                <td>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <span style={{
                                            width: '24px',
                                            height: '24px',
                                            borderRadius: '50%',
                                            background: 'var(--color-accent-gradient)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            fontSize: '0.65rem',
                                            color: 'var(--color-background)'
                                        }}>AI</span>
                                        Writer Agent
                                    </div>
                                </td>
                                <td>2,847</td>
                                <td>Feb 1, 2026</td>
                                <td>
                                    <div style={{ display: 'flex', gap: '0.25rem' }}>
                                        <button className="btn btn-ghost btn-sm">Edit</button>
                                        <button className="btn btn-ghost btn-sm">View</button>
                                    </div>
                                </td>
                            </tr>

                            <tr>
                                <td>
                                    <div>
                                        <strong style={{ color: 'var(--color-foreground)', display: 'block' }}>The Hidden Cost of Technical Debt</strong>
                                        <span style={{ fontSize: '0.8rem', color: 'var(--color-foreground-muted)' }}>/blog/hidden-cost-technical-debt</span>
                                    </div>
                                </td>
                                <td>
                                    <span style={{
                                        padding: '0.2rem 0.5rem',
                                        borderRadius: 'var(--radius-sm)',
                                        fontSize: '0.75rem',
                                        background: 'var(--color-background-secondary)',
                                        color: 'var(--color-foreground-secondary)'
                                    }}>Engineering</span>
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
                                <td>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <span style={{
                                            width: '24px',
                                            height: '24px',
                                            borderRadius: '50%',
                                            background: 'var(--color-accent-gradient)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            fontSize: '0.65rem',
                                            color: 'var(--color-background)'
                                        }}>AI</span>
                                        Writer Agent
                                    </div>
                                </td>
                                <td>1,923</td>
                                <td>Jan 28, 2026</td>
                                <td>
                                    <div style={{ display: 'flex', gap: '0.25rem' }}>
                                        <button className="btn btn-ghost btn-sm">Edit</button>
                                        <button className="btn btn-ghost btn-sm">View</button>
                                    </div>
                                </td>
                            </tr>

                            <tr>
                                <td>
                                    <div>
                                        <strong style={{ color: 'var(--color-foreground)', display: 'block' }}>Building Products That Users Actually Want</strong>
                                        <span style={{ fontSize: '0.8rem', color: 'var(--color-foreground-muted)' }}>/blog/building-products-users-want</span>
                                    </div>
                                </td>
                                <td>
                                    <span style={{
                                        padding: '0.2rem 0.5rem',
                                        borderRadius: 'var(--radius-sm)',
                                        fontSize: '0.75rem',
                                        background: 'var(--color-background-secondary)',
                                        color: 'var(--color-foreground-secondary)'
                                    }}>Product</span>
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
                                <td>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <span style={{
                                            width: '24px',
                                            height: '24px',
                                            borderRadius: '50%',
                                            background: 'var(--color-surface)',
                                            border: '1px solid var(--color-border)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            fontSize: '0.65rem',
                                            color: 'var(--color-foreground)'
                                        }}>AR</span>
                                        You
                                    </div>
                                </td>
                                <td>—</td>
                                <td>Today</td>
                                <td>
                                    <div style={{ display: 'flex', gap: '0.25rem' }}>
                                        <button className="btn btn-ghost btn-sm">Edit</button>
                                        <button className="btn btn-ghost btn-sm">Preview</button>
                                    </div>
                                </td>
                            </tr>

                            <tr>
                                <td>
                                    <div>
                                        <strong style={{ color: 'var(--color-foreground)', display: 'block' }}>Leadership Lessons from 15 Years in Tech</strong>
                                        <span style={{ fontSize: '0.8rem', color: 'var(--color-foreground-muted)' }}>/blog/leadership-lessons</span>
                                    </div>
                                </td>
                                <td>
                                    <span style={{
                                        padding: '0.2rem 0.5rem',
                                        borderRadius: 'var(--radius-sm)',
                                        fontSize: '0.75rem',
                                        background: 'var(--color-background-secondary)',
                                        color: 'var(--color-foreground-secondary)'
                                    }}>Leadership</span>
                                </td>
                                <td>
                                    <span style={{
                                        padding: '0.25rem 0.75rem',
                                        borderRadius: '9999px',
                                        fontSize: '0.75rem',
                                        fontWeight: '600',
                                        background: 'rgba(96, 165, 250, 0.15)',
                                        color: 'var(--color-info)'
                                    }}>Scheduled</span>
                                </td>
                                <td>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <span style={{
                                            width: '24px',
                                            height: '24px',
                                            borderRadius: '50%',
                                            background: 'var(--color-accent-gradient)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            fontSize: '0.65rem',
                                            color: 'var(--color-background)'
                                        }}>AI</span>
                                        Writer Agent
                                    </div>
                                </td>
                                <td>—</td>
                                <td>Feb 5, 2026</td>
                                <td>
                                    <div style={{ display: 'flex', gap: '0.25rem' }}>
                                        <button className="btn btn-ghost btn-sm">Edit</button>
                                        <button className="btn btn-ghost btn-sm">Preview</button>
                                    </div>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginTop: '1.5rem',
                    color: 'var(--color-foreground-secondary)',
                    fontSize: '0.875rem'
                }}>
                    <span>Showing 1-4 of 24 posts</span>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button className="btn btn-secondary btn-sm" disabled>Previous</button>
                        <button className="btn btn-secondary btn-sm">Next</button>
                    </div>
                </div>
            </div>
        </>
    );
}
