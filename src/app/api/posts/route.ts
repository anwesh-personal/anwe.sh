/**
 * Blog Posts API Route
 * Server-side CRUD operations using service role key to bypass RLS
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Lazy initialization
let supabaseAdmin: ReturnType<typeof createClient> | null = null;

function getSupabaseAdmin() {
    if (!supabaseAdmin) {
        const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

        if (!url || !serviceKey) {
            throw new Error('Missing Supabase configuration');
        }

        supabaseAdmin = createClient(url, serviceKey);
    }
    return supabaseAdmin;
}

export interface BlogPost {
    id: string;
    title: string;
    slug: string;
    excerpt: string;
    content: string;
    category: string;
    cover_image: string | null;
    meta_title: string | null;
    meta_description: string | null;
    reading_time: string;
    word_count: number;
    published: boolean;
    published_at: string | null;
    created_at: string;
    updated_at: string;
}

// GET: List all posts or get single post
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');
        const slug = searchParams.get('slug');
        const publishedOnly = searchParams.get('published') === 'true';

        const supabase = getSupabaseAdmin();

        if (id) {
            // Get single post by ID
            const { data, error } = await supabase
                .from('blog_posts')
                .select('*')
                .eq('id', id)
                .single();

            if (error) {
                return NextResponse.json({ error: error.message }, { status: 404 });
            }

            return NextResponse.json({ post: data });
        }

        if (slug) {
            // Get single post by slug
            let query = supabase
                .from('blog_posts')
                .select('*')
                .eq('slug', slug);

            if (publishedOnly) {
                query = query.eq('published', true);
            }

            const { data, error } = await query.single();

            if (error) {
                return NextResponse.json({ error: error.message }, { status: 404 });
            }

            return NextResponse.json({ post: data });
        }

        // List all posts
        let query = supabase
            .from('blog_posts')
            .select('*')
            .order('created_at', { ascending: false });

        if (publishedOnly) {
            query = query.eq('published', true);
        }

        const { data, error } = await query;

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ posts: data || [] });
    } catch (error) {
        console.error('Posts GET error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

// POST: Create new post
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { title, slug, excerpt, content, category, cover_image, meta_title, meta_description, reading_time, word_count, published } = body;

        if (!title || !slug || !content) {
            return NextResponse.json(
                { error: 'Title, slug, and content are required' },
                { status: 400 }
            );
        }

        const supabase = getSupabaseAdmin();

        const postData: Record<string, unknown> = {
            title,
            slug,
            excerpt: excerpt || content.slice(0, 160).replace(/[#*_\n]/g, '') + '...',
            content,
            category: category || 'General',
            cover_image: cover_image || null,
            meta_title: meta_title || title,
            meta_description: meta_description || excerpt,
            reading_time: reading_time || '1 min',
            word_count: word_count || content.split(/\s+/).length,
            published: published || false,
            published_at: published ? new Date().toISOString() : null,
        };

        const { data, error } = await supabase
            .from('blog_posts')
            .insert(postData as never)
            .select()
            .single();

        if (error) {
            console.error('Error creating post:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ post: data }, { status: 201 });
    } catch (error) {
        console.error('Posts POST error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

// PUT: Update post
export async function PUT(request: NextRequest) {
    try {
        const body = await request.json();
        const { id, ...updates } = body;

        if (!id) {
            return NextResponse.json({ error: 'Post ID is required' }, { status: 400 });
        }

        const supabase = getSupabaseAdmin();

        // Add updated_at timestamp
        updates.updated_at = new Date().toISOString();

        const { data, error } = await supabase
            .from('blog_posts')
            .update(updates as never)
            .eq('id', id)
            .select()
            .single();

        if (error) {
            console.error('Error updating post:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ post: data });
    } catch (error) {
        console.error('Posts PUT error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

// DELETE: Delete post
export async function DELETE(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: 'Post ID is required' }, { status: 400 });
        }

        const supabase = getSupabaseAdmin();

        const { error } = await supabase
            .from('blog_posts')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Error deleting post:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Posts DELETE error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
