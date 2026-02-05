'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AdminHeader } from '@/components/admin';
import { RichTextEditor } from '@/components/editor';
import { createPost, generateSlug, calculateReadingTime } from '@/lib/supabase';

export default function NewPostPage() {
    const router = useRouter();
    const [saving, setSaving] = useState(false);
    const [activeTab, setActiveTab] = useState<'editor' | 'preview'>('editor');
    const [content, setContent] = useState<string>('');
    const [form, setForm] = useState({
        title: '',
        slug: '',
        excerpt: '',
        category: 'General',
        cover_image: '',
        meta_title: '',
        meta_description: '',
    });

    const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const title = e.target.value;
        setForm(prev => ({
            ...prev,
            title,
            slug: generateSlug(title)
        }));
    };

    const handleContentChange = (html: string) => {
        setContent(html);
    };

    const handleSubmit = async (publish: boolean) => {
        if (!form.title) {
            alert('Title is required');
            return;
        }

        if (!content.trim()) {
            alert('Content is required');
            return;
        }

        setSaving(true);

        const post = await createPost({
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
            published_at: publish ? new Date().toISOString() : null,
            source: 'manual',
            author_name: 'Anwesh Rath',
        });

        setSaving(false);

        if (post) {
            router.push('/admin/posts');
        } else {
            alert('Error creating post');
        }
    };

    return (
        <>
            <AdminHeader
                title="New Post"
                subtitle="Create a new blog post with the block editor"
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
                            {saving ? 'Publishing...' : 'Publish'}
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
                                        {content.length} characters
                                    </span>
                                    <button className="btn btn-ghost btn-sm" style={{
                                        background: 'linear-gradient(135deg, var(--color-accent-start), var(--color-accent-end))',
                                        WebkitBackgroundClip: 'text',
                                        WebkitTextFillColor: 'transparent',
                                        fontWeight: '600'
                                    }}>
                                        ✨ AI Assist
                                    </button>
                                </div>
                            </div>
                            <div className="admin-card-body" style={{ padding: '0 1rem 1rem' }}>
                                {activeTab === 'editor' ? (
                                    <RichTextEditor
                                        content={content}
                                        onChange={handleContentChange}
                                        placeholder="Start writing your post..."
                                    />
                                ) : (
                                    <div className="rich-editor-preview" style={{ padding: '1rem 0' }}>
                                        <div
                                            className="prose"
                                            dangerouslySetInnerHTML={{ __html: content }}
                                        />
                                    </div>
                                )}
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
