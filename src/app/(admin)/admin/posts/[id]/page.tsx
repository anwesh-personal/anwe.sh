'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { AdminHeader } from '@/components/admin';
import { getPostById, updatePost, deletePost, publishPost, unpublishPost, generateSlug, calculateReadingTime, type BlogPost } from '@/lib/supabase';

export default function EditPostPage() {
    const router = useRouter();
    const params = useParams();
    const postId = params.id as string;

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [post, setPost] = useState<BlogPost | null>(null);
    const [form, setForm] = useState({
        title: '',
        slug: '',
        excerpt: '',
        content: '',
        category: 'General',
        cover_image: '',
        meta_title: '',
        meta_description: '',
    });

    useEffect(() => {
        async function loadPost() {
            const data = await getPostById(postId);
            if (data) {
                setPost(data);
                setForm({
                    title: data.title,
                    slug: data.slug,
                    excerpt: data.excerpt || '',
                    content: data.content,
                    category: data.category,
                    cover_image: data.cover_image || '',
                    meta_title: data.meta_title || '',
                    meta_description: data.meta_description || '',
                });
            }
            setLoading(false);
        }
        loadPost();
    }, [postId]);

    const handleSave = async () => {
        if (!form.title || !form.content) {
            alert('Title and content are required');
            return;
        }

        setSaving(true);

        const updated = await updatePost(postId, {
            title: form.title,
            slug: form.slug,
            excerpt: form.excerpt || form.content.slice(0, 160) + '...',
            content: form.content,
            category: form.category,
            cover_image: form.cover_image || null,
            meta_title: form.meta_title || form.title,
            meta_description: form.meta_description || form.excerpt,
            reading_time: calculateReadingTime(form.content),
            word_count: form.content.split(/\s+/).length,
        });

        setSaving(false);

        if (updated) {
            setPost(updated);
            alert('Saved!');
        } else {
            alert('Error saving post');
        }
    };

    const handlePublish = async () => {
        setSaving(true);
        const updated = await publishPost(postId);
        setSaving(false);
        if (updated) {
            setPost(updated);
        }
    };

    const handleUnpublish = async () => {
        setSaving(true);
        const updated = await unpublishPost(postId);
        setSaving(false);
        if (updated) {
            setPost(updated);
        }
    };

    const handleDelete = async () => {
        if (!confirm('Are you sure you want to delete this post? This cannot be undone.')) {
            return;
        }

        const success = await deletePost(postId);
        if (success) {
            router.push('/admin/posts');
        } else {
            alert('Error deleting post');
        }
    };

    if (loading) {
        return (
            <div className="admin-content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
                <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>⏳</div>
                    <div style={{ color: 'var(--color-foreground-muted)' }}>Loading post...</div>
                </div>
            </div>
        );
    }

    if (!post) {
        return (
            <div className="admin-content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
                <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>❌</div>
                    <div style={{ color: 'var(--color-foreground-muted)' }}>Post not found</div>
                </div>
            </div>
        );
    }

    return (
        <>
            <AdminHeader
                title="Edit Post"
                subtitle={post.published ? 'Published' : 'Draft'}
                actions={
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button
                            className="btn btn-secondary"
                            onClick={handleSave}
                            disabled={saving}
                        >
                            {saving ? 'Saving...' : 'Save'}
                        </button>
                        {post.published ? (
                            <button
                                className="btn btn-secondary"
                                onClick={handleUnpublish}
                                disabled={saving}
                            >
                                Unpublish
                            </button>
                        ) : (
                            <button
                                className="btn btn-primary"
                                onClick={handlePublish}
                                disabled={saving}
                            >
                                Publish
                            </button>
                        )}
                    </div>
                }
            />

            <div className="admin-content">
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem' }}>
                    {/* Main Content */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        {/* Title */}
                        <div className="admin-card">
                            <div className="admin-card-body">
                                <input
                                    type="text"
                                    placeholder="Post title..."
                                    value={form.title}
                                    onChange={(e) => setForm(prev => ({ ...prev, title: e.target.value }))}
                                    style={{
                                        width: '100%',
                                        padding: '1rem',
                                        background: 'transparent',
                                        border: 'none',
                                        color: 'var(--color-foreground)',
                                        fontSize: '1.5rem',
                                        fontWeight: '600',
                                        fontFamily: 'var(--font-secondary)',
                                        outline: 'none'
                                    }}
                                />
                            </div>
                        </div>

                        {/* Content */}
                        <div className="admin-card" style={{ flex: 1 }}>
                            <div className="admin-card-header">
                                <h2 className="admin-card-title">Content</h2>
                                <span style={{ fontSize: '0.8rem', color: 'var(--color-foreground-muted)' }}>
                                    {form.content.split(/\s+/).length} words • {calculateReadingTime(form.content)} read
                                </span>
                            </div>
                            <div className="admin-card-body" style={{ padding: 0 }}>
                                <textarea
                                    value={form.content}
                                    onChange={(e) => setForm(prev => ({ ...prev, content: e.target.value }))}
                                    style={{
                                        width: '100%',
                                        minHeight: '500px',
                                        padding: '1.5rem',
                                        background: 'var(--color-background)',
                                        border: 'none',
                                        color: 'var(--color-foreground)',
                                        fontSize: '0.95rem',
                                        lineHeight: '1.8',
                                        fontFamily: 'var(--font-mono)',
                                        resize: 'vertical',
                                        outline: 'none'
                                    }}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Sidebar */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        {/* Slug */}
                        <div className="admin-card">
                            <div className="admin-card-header">
                                <h2 className="admin-card-title">URL Slug</h2>
                            </div>
                            <div className="admin-card-body">
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                    padding: '0.75rem',
                                    background: 'var(--color-background)',
                                    borderRadius: 'var(--radius-md)',
                                    fontSize: '0.85rem'
                                }}>
                                    <span style={{ color: 'var(--color-foreground-muted)' }}>/blog/</span>
                                    <input
                                        type="text"
                                        value={form.slug}
                                        onChange={(e) => setForm(prev => ({ ...prev, slug: e.target.value }))}
                                        style={{
                                            flex: 1,
                                            background: 'transparent',
                                            border: 'none',
                                            color: 'var(--color-foreground)',
                                            fontFamily: 'var(--font-mono)',
                                            outline: 'none'
                                        }}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Category */}
                        <div className="admin-card">
                            <div className="admin-card-header">
                                <h2 className="admin-card-title">Category</h2>
                            </div>
                            <div className="admin-card-body">
                                <select
                                    value={form.category}
                                    onChange={(e) => setForm(prev => ({ ...prev, category: e.target.value }))}
                                    style={{
                                        width: '100%',
                                        padding: '0.75rem',
                                        background: 'var(--color-background)',
                                        border: '1px solid var(--color-border)',
                                        borderRadius: 'var(--radius-md)',
                                        color: 'var(--color-foreground)',
                                        fontSize: '0.9rem',
                                        cursor: 'pointer'
                                    }}
                                >
                                    <option value="General">General</option>
                                    <option value="AI Systems">AI Systems</option>
                                    <option value="Enterprise">Enterprise</option>
                                    <option value="Product">Product</option>
                                    <option value="Leadership">Leadership</option>
                                    <option value="Engineering">Engineering</option>
                                </select>
                            </div>
                        </div>

                        {/* Excerpt */}
                        <div className="admin-card">
                            <div className="admin-card-header">
                                <h2 className="admin-card-title">Excerpt</h2>
                            </div>
                            <div className="admin-card-body">
                                <textarea
                                    placeholder="Brief description for listings..."
                                    value={form.excerpt}
                                    onChange={(e) => setForm(prev => ({ ...prev, excerpt: e.target.value }))}
                                    style={{
                                        width: '100%',
                                        minHeight: '100px',
                                        padding: '0.75rem',
                                        background: 'var(--color-background)',
                                        border: '1px solid var(--color-border)',
                                        borderRadius: 'var(--radius-md)',
                                        color: 'var(--color-foreground)',
                                        fontSize: '0.9rem',
                                        resize: 'vertical',
                                        outline: 'none'
                                    }}
                                />
                            </div>
                        </div>

                        {/* Cover Image */}
                        <div className="admin-card">
                            <div className="admin-card-header">
                                <h2 className="admin-card-title">Cover Image</h2>
                            </div>
                            <div className="admin-card-body">
                                <input
                                    type="text"
                                    placeholder="https://..."
                                    value={form.cover_image}
                                    onChange={(e) => setForm(prev => ({ ...prev, cover_image: e.target.value }))}
                                    style={{
                                        width: '100%',
                                        padding: '0.75rem',
                                        background: 'var(--color-background)',
                                        border: '1px solid var(--color-border)',
                                        borderRadius: 'var(--radius-md)',
                                        color: 'var(--color-foreground)',
                                        fontSize: '0.9rem',
                                        marginBottom: '0.75rem'
                                    }}
                                />
                                {form.cover_image && (
                                    <div style={{
                                        width: '100%',
                                        height: '120px',
                                        borderRadius: 'var(--radius-md)',
                                        overflow: 'hidden',
                                        background: 'var(--color-background-secondary)'
                                    }}>
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img
                                            src={form.cover_image}
                                            alt="Cover preview"
                                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                        />
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Meta */}
                        <div className="admin-card">
                            <div className="admin-card-header">
                                <h2 className="admin-card-title">Post Info</h2>
                            </div>
                            <div className="admin-card-body" style={{ fontSize: '0.85rem', color: 'var(--color-foreground-secondary)' }}>
                                <div style={{ marginBottom: '0.5rem' }}>
                                    <strong>Created:</strong> {new Date(post.created_at).toLocaleString()}
                                </div>
                                <div style={{ marginBottom: '0.5rem' }}>
                                    <strong>Updated:</strong> {new Date(post.updated_at).toLocaleString()}
                                </div>
                                {post.published_at && (
                                    <div style={{ marginBottom: '0.5rem' }}>
                                        <strong>Published:</strong> {new Date(post.published_at).toLocaleString()}
                                    </div>
                                )}
                                <div>
                                    <strong>Source:</strong> {post.source === 'manual' ? 'Manual' : `${post.source_agent || 'AI Agent'}`}
                                </div>
                            </div>
                        </div>

                        {/* Danger Zone */}
                        <div className="admin-card" style={{ borderColor: 'var(--color-error)' }}>
                            <div className="admin-card-header" style={{ borderColor: 'var(--color-error)' }}>
                                <h2 className="admin-card-title" style={{ color: 'var(--color-error)' }}>Danger Zone</h2>
                            </div>
                            <div className="admin-card-body">
                                <button
                                    onClick={handleDelete}
                                    className="btn btn-secondary"
                                    style={{
                                        width: '100%',
                                        borderColor: 'var(--color-error)',
                                        color: 'var(--color-error)'
                                    }}
                                >
                                    Delete Post
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
