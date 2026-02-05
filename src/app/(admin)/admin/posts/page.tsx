import { AdminHeader } from '@/components/admin';
import { getAllPostsAdmin, type BlogPost } from '@/lib/supabase';
import Link from 'next/link';

export const revalidate = 30;

export default async function PostsPage() {
    const posts = await getAllPostsAdmin();

    const getStatusStyle = (published: boolean) => {
        if (published) {
            return {
                background: 'rgba(52, 211, 153, 0.15)',
                color: 'var(--color-success)'
            };
        }
        return {
            background: 'rgba(251, 191, 36, 0.15)',
            color: 'var(--color-warning)'
        };
    };

    return (
        <>
            <AdminHeader
                title="Posts"
                subtitle={`${posts.length} posts in total`}
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
                {posts.length === 0 ? (
                    <div className="admin-card">
                        <div className="admin-card-body" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
                            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📝</div>
                            <h3 style={{ color: 'var(--color-foreground)', marginBottom: '0.5rem' }}>No posts yet</h3>
                            <p style={{ color: 'var(--color-foreground-muted)', marginBottom: '1.5rem' }}>
                                Create your first post to get started
                            </p>
                            <Link href="/admin/posts/new" className="btn btn-primary">
                                Create First Post
                            </Link>
                        </div>
                    </div>
                ) : (
                    <div className="admin-card">
                        <table className="admin-table">
                            <thead>
                                <tr>
                                    <th>Title</th>
                                    <th>Category</th>
                                    <th>Status</th>
                                    <th>Source</th>
                                    <th>Date</th>
                                    <th></th>
                                </tr>
                            </thead>
                            <tbody>
                                {posts.map((post: BlogPost) => (
                                    <tr key={post.id}>
                                        <td>
                                            <div>
                                                <strong style={{ color: 'var(--color-foreground)', display: 'block' }}>
                                                    {post.title}
                                                </strong>
                                                <span style={{ fontSize: '0.8rem', color: 'var(--color-foreground-muted)' }}>
                                                    /blog/{post.slug}
                                                </span>
                                            </div>
                                        </td>
                                        <td>
                                            <span style={{
                                                padding: '0.2rem 0.5rem',
                                                borderRadius: 'var(--radius-sm)',
                                                fontSize: '0.75rem',
                                                background: 'var(--color-background-secondary)',
                                                color: 'var(--color-foreground-secondary)'
                                            }}>
                                                {post.category}
                                            </span>
                                        </td>
                                        <td>
                                            <span style={{
                                                padding: '0.25rem 0.75rem',
                                                borderRadius: '9999px',
                                                fontSize: '0.75rem',
                                                fontWeight: '600',
                                                ...getStatusStyle(post.published)
                                            }}>
                                                {post.published ? 'Published' : 'Draft'}
                                            </span>
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                {post.source === 'manual' ? (
                                                    <>
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
                                                        <span style={{ fontSize: '0.85rem' }}>Manual</span>
                                                    </>
                                                ) : (
                                                    <>
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
                                                        <span style={{ fontSize: '0.85rem' }}>{post.source_agent || 'Agent'}</span>
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                        <td style={{ fontSize: '0.85rem', color: 'var(--color-foreground-secondary)' }}>
                                            {post.published_at
                                                ? new Date(post.published_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                                                : new Date(post.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                                            }
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', gap: '0.25rem' }}>
                                                <Link href={`/admin/posts/${post.id}`} className="btn btn-ghost btn-sm">
                                                    Edit
                                                </Link>
                                                <a
                                                    href={`https://anwe.sh/blog/${post.slug}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="btn btn-ghost btn-sm"
                                                >
                                                    View
                                                </a>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </>
    );
}
