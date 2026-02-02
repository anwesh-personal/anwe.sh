'use client';

import { use, useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { AdminHeader } from '@/components/admin';
import { BlockEditor, markdownToBlocks, blocksToMarkdown, createEmptyBlock } from '@/components/editor';
import { getPostById, updatePost, generateSlug, calculateReadingTime, type BlogPost } from '@/lib/supabase';
import type { Block } from '@/types';

interface EditPostPageProps {
    params: Promise<{ id: string }>;
}

export default function EditPostPage({ params }: EditPostPageProps) {
    const { id } = use(params);
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [activeTab, setActiveTab] = useState<'editor' | 'preview'>('editor');
    const [blocks, setBlocks] = useState<Block[]>([createEmptyBlock('paragraph')]);
    const [post, setPost] = useState<BlogPost | null>(null);
    const [form, setForm] = useState({
        title: '',
        slug: '',
        excerpt: '',
        category: 'General',
        cover_image: '',
        meta_title: '',
        meta_description: '',
    });

    // Load the post
    useEffect(() => {
        const loadPost = async () => {
            const data = await getPostById(id);
            if (!data) {
                router.push('/admin/posts');
                return;
            }

            setPost(data);
            setForm({
                title: data.title,
                slug: data.slug,
                excerpt: data.excerpt || '',
                category: data.category || 'General',
                cover_image: data.cover_image || '',
                meta_title: data.meta_title || '',
                meta_description: data.meta_description || '',
            });

            // Convert markdown content to blocks
            if (data.content) {
                const parsedBlocks = markdownToBlocks(data.content);
                setBlocks(parsedBlocks.length > 0 ? parsedBlocks : [createEmptyBlock('paragraph')]);
            }

            setLoading(false);
        };

        loadPost();
    }, [id, router]);

    const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const title = e.target.value;
        setForm(prev => ({
            ...prev,
            title,
            // Only auto-update slug if it matches the old title's slug
            slug: prev.slug === generateSlug(post?.title || '') ? generateSlug(title) : prev.slug
        }));
    };

    const handleBlocksChange = useCallback((newBlocks: Block[]) => {
        setBlocks(newBlocks);
    }, []);

    const handleSubmit = async (publish: boolean) => {
        if (!form.title) {
            alert('Title is required');
            return;
        }

        const content = blocksToMarkdown(blocks);

        if (!content.trim()) {
            alert('Content is required');
            return;
        }

        setSaving(true);

        const updated = await updatePost(id, {
            title: form.title,
            slug: form.slug,
            excerpt: form.excerpt || content.slice(0, 160).replace(/[#*_\n]/g, '') + '...',
            content: content,
            category: form.category,
            cover_image: form.cover_image || null,
            meta_title: form.meta_title || form.title,
            meta_description: form.meta_description || form.excerpt,
            reading_time: calculateReadingTime(content),
            word_count: content.split(/\s+/).length,
            published: publish,
            published_at: publish && !post?.published_at ? new Date().toISOString() : post?.published_at,
        });

        setSaving(false);

        if (updated) {
            router.push('/admin/posts');
        } else {
            alert('Error updating post');
        }
    };

    if (loading) {
        return (
            <>
                <AdminHeader title="Loading..." subtitle="Please wait" />
                <div className="admin-content">
                    <div style={{
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        minHeight: '300px'
                    }}>
                        <div style={{
                            width: '40px',
                            height: '40px',
                            border: '3px solid var(--color-border)',
                            borderTopColor: 'var(--color-accent-solid)',
                            borderRadius: '50%',
                            animation: 'spin 1s linear infinite'
                        }} />
                    </div>
                </div>
                <style jsx>{`
                    @keyframes spin {
                        to { transform: rotate(360deg); }
                    }
                `}</style>
            </>
        );
    }

    return (
        <>
            <AdminHeader
                title="Edit Post"
                subtitle={`Editing: ${form.title || 'Untitled'}`}
                actions={
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <div style={{
                            display: 'flex',
                            background: 'var(--color-background-secondary)',
                            borderRadius: 'var(--radius-md)',
                            padding: '2px'
                        }}>
                            <button
                                className={`btn btn-sm ${activeTab === 'editor' ? 'btn-primary' : 'btn-ghost'}`}
                                onClick={() => setActiveTab('editor')}
                            >
                                Edit
                            </button>
                            <button
                                className={`btn btn-sm ${activeTab === 'preview' ? 'btn-primary' : 'btn-ghost'}`}
                                onClick={() => setActiveTab('preview')}
                            >
                                Preview
                            </button>
                        </div>
                        <button
                            className="btn btn-secondary"
                            onClick={() => router.push('/admin/posts')}
                        >
                            Cancel
                        </button>
                        <button
                            className="btn btn-secondary"
                            onClick={() => handleSubmit(false)}
                            disabled={saving}
                        >
                            Save Draft
                        </button>
                        <button
                            className="btn btn-primary"
                            onClick={() => handleSubmit(true)}
                            disabled={saving}
                        >
                            {saving ? 'Saving...' : post?.published ? 'Update' : 'Publish'}
                        </button>
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
                                    onChange={handleTitleChange}
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

                        {/* Content Editor */}
                        <div className="admin-card" style={{ flex: 1 }}>
                            <div className="admin-card-header">
                                <h2 className="admin-card-title">Content</h2>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                    <span style={{
                                        fontSize: '0.8rem',
                                        color: 'var(--color-foreground-muted)',
                                        background: 'var(--color-background-secondary)',
                                        padding: '0.25rem 0.5rem',
                                        borderRadius: 'var(--radius-sm)'
                                    }}>
                                        {blocks.length} block{blocks.length !== 1 ? 's' : ''}
                                    </span>
                                    {post?.source === 'ai' && (
                                        <span style={{
                                            fontSize: '0.75rem',
                                            padding: '0.25rem 0.5rem',
                                            background: 'linear-gradient(135deg, var(--color-accent-start), var(--color-accent-end))',
                                            borderRadius: 'var(--radius-sm)',
                                            color: 'white'
                                        }}>
                                            AI Generated
                                        </span>
                                    )}
                                </div>
                            </div>
                            <div className="admin-card-body" style={{ padding: '0 1rem 1rem' }}>
                                {activeTab === 'editor' ? (
                                    <BlockEditor
                                        initialBlocks={blocks}
                                        onChange={handleBlocksChange}
                                        placeholder="Start writing your post..."
                                    />
                                ) : (
                                    <div className="block-editor block-editor--readonly" style={{ padding: '1rem 0' }}>
                                        <BlockEditor
                                            initialBlocks={blocks}
                                            readOnly
                                        />
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Sidebar */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        {/* Status */}
                        <div className="admin-card">
                            <div className="admin-card-header">
                                <h2 className="admin-card-title">Status</h2>
                            </div>
                            <div className="admin-card-body">
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                    padding: '0.75rem',
                                    background: 'var(--color-background)',
                                    borderRadius: 'var(--radius-md)'
                                }}>
                                    <span style={{
                                        width: '8px',
                                        height: '8px',
                                        borderRadius: '50%',
                                        background: post?.published ? '#10b981' : '#f59e0b'
                                    }} />
                                    <span>{post?.published ? 'Published' : 'Draft'}</span>
                                    {post?.published_at && (
                                        <span style={{
                                            marginLeft: 'auto',
                                            fontSize: '0.8rem',
                                            color: 'var(--color-foreground-muted)'
                                        }}>
                                            {new Date(post.published_at).toLocaleDateString()}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>

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

                        {/* SEO */}
                        <div className="admin-card">
                            <div className="admin-card-header">
                                <h2 className="admin-card-title">SEO</h2>
                            </div>
                            <div className="admin-card-body">
                                <div style={{ marginBottom: '1rem' }}>
                                    <label style={{
                                        display: 'block',
                                        fontSize: '0.8rem',
                                        color: 'var(--color-foreground-muted)',
                                        marginBottom: '0.5rem'
                                    }}>Meta Title</label>
                                    <input
                                        type="text"
                                        placeholder={form.title || 'Page title...'}
                                        value={form.meta_title}
                                        onChange={(e) => setForm(prev => ({ ...prev, meta_title: e.target.value }))}
                                        style={{
                                            width: '100%',
                                            padding: '0.625rem',
                                            background: 'var(--color-background)',
                                            border: '1px solid var(--color-border)',
                                            borderRadius: 'var(--radius-md)',
                                            color: 'var(--color-foreground)',
                                            fontSize: '0.85rem'
                                        }}
                                    />
                                </div>
                                <div>
                                    <label style={{
                                        display: 'block',
                                        fontSize: '0.8rem',
                                        color: 'var(--color-foreground-muted)',
                                        marginBottom: '0.5rem'
                                    }}>Meta Description</label>
                                    <textarea
                                        placeholder="Description for search engines..."
                                        value={form.meta_description}
                                        onChange={(e) => setForm(prev => ({ ...prev, meta_description: e.target.value }))}
                                        style={{
                                            width: '100%',
                                            minHeight: '80px',
                                            padding: '0.625rem',
                                            background: 'var(--color-background)',
                                            border: '1px solid var(--color-border)',
                                            borderRadius: 'var(--radius-md)',
                                            color: 'var(--color-foreground)',
                                            fontSize: '0.85rem',
                                            resize: 'none'
                                        }}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
