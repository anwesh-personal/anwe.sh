import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { createBrowserClient } from '@supabase/ssr';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Lazy-initialized server-side client
let _supabase: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
    if (!_supabase) {
        _supabase = createClient(supabaseUrl, supabaseAnonKey);
    }
    return _supabase;
}

// Legacy export for backwards compatibility
export const supabase = {
    from: (table: string) => getSupabase().from(table),
    rpc: (fn: string, params?: Record<string, unknown>) => getSupabase().rpc(fn, params),
    auth: {
        get signInWithPassword() { return getSupabase().auth.signInWithPassword.bind(getSupabase().auth); },
        get signOut() { return getSupabase().auth.signOut.bind(getSupabase().auth); },
        get getSession() { return getSupabase().auth.getSession.bind(getSupabase().auth); },
        get getUser() { return getSupabase().auth.getUser.bind(getSupabase().auth); },
        get updateUser() { return getSupabase().auth.updateUser.bind(getSupabase().auth); }
    },
    storage: { from: (bucket: string) => getSupabase().storage.from(bucket) }
};

// Browser client (for client components)
export function createClientComponentClient() {
    return createBrowserClient(supabaseUrl, supabaseAnonKey);
}

// =====================================================
// AUTH FUNCTIONS
// =====================================================

// Sign in with email/password
export async function signIn(email: string, password: string) {
    const client = createClientComponentClient();
    const { data, error } = await client.auth.signInWithPassword({
        email,
        password
    });

    if (error) {
        console.error('Sign in error:', error);
        return { user: null, error: error.message };
    }

    return { user: data.user, error: null };
}

// Sign out
export async function signOut() {
    const client = createClientComponentClient();
    const { error } = await client.auth.signOut();

    if (error) {
        console.error('Sign out error:', error);
        return { error: error.message };
    }

    return { error: null };
}

// Get current session
export async function getSession() {
    const client = createClientComponentClient();
    const { data: { session }, error } = await client.auth.getSession();

    if (error) {
        console.error('Session error:', error);
        return null;
    }

    return session;
}

// Get current user
export async function getCurrentUser() {
    const client = createClientComponentClient();
    const { data: { user }, error } = await client.auth.getUser();

    if (error) {
        console.error('Get user error:', error);
        return null;
    }

    return user;
}

// =====================================================
// TYPES
// =====================================================

export interface BlogPost {
    id: string;
    title: string;
    slug: string;
    excerpt: string | null;
    content: string;
    cover_image: string | null;
    category: string;
    tags: string[];
    reading_time: string | null;
    word_count: number | null;
    published: boolean;
    published_at: string | null;
    featured: boolean;
    meta_title: string | null;
    meta_description: string | null;
    author_name: string;
    author_avatar: string | null;
    source: string;
    source_agent: string | null;
    source_prompt: string | null;
    created_at: string;
    updated_at: string;
}

// =====================================================
// BLOG FUNCTIONS (PUBLIC)
// =====================================================

// Fetch all published posts
export async function getAllPosts(): Promise<BlogPost[]> {
    const { data, error } = await supabase
        .from('blog_posts')
        .select('*')
        .eq('published', true)
        .order('published_at', { ascending: false });

    if (error) {
        console.error('Error fetching posts:', error);
        return [];
    }

    return data || [];
}

// Fetch a single post by slug
export async function getPostBySlug(slug: string): Promise<BlogPost | null> {
    const { data, error } = await supabase
        .from('blog_posts')
        .select('*')
        .eq('slug', slug)
        .eq('published', true)
        .single();

    if (error) {
        console.error('Error fetching post:', error);
        return null;
    }

    return data;
}

// Fetch posts by category
export async function getPostsByCategory(category: string): Promise<BlogPost[]> {
    const { data, error } = await supabase
        .from('blog_posts')
        .select('*')
        .eq('category', category)
        .eq('published', true)
        .order('published_at', { ascending: false });

    if (error) {
        console.error('Error fetching posts by category:', error);
        return [];
    }

    return data || [];
}

// Fetch featured posts
export async function getFeaturedPosts(): Promise<BlogPost[]> {
    const { data, error } = await supabase
        .from('blog_posts')
        .select('*')
        .eq('featured', true)
        .eq('published', true)
        .order('published_at', { ascending: false });

    if (error) {
        console.error('Error fetching featured posts:', error);
        return [];
    }

    return data || [];
}

// =====================================================
// ADMIN FUNCTIONS (require auth)
// =====================================================

// Get ALL posts (including drafts) for admin
export async function getAllPostsAdmin(): Promise<BlogPost[]> {
    const { data, error } = await supabase
        .from('blog_posts')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching all posts:', error);
        return [];
    }

    return data || [];
}

// Get a single post by ID (for editing)
export async function getPostById(id: string): Promise<BlogPost | null> {
    const { data, error } = await supabase
        .from('blog_posts')
        .select('*')
        .eq('id', id)
        .single();

    if (error) {
        console.error('Error fetching post by ID:', error);
        return null;
    }

    return data;
}

// Create a new post
export async function createPost(post: Partial<BlogPost>): Promise<BlogPost | null> {
    const { data, error } = await supabase
        .from('blog_posts')
        .insert([post])
        .select()
        .single();

    if (error) {
        console.error('Error creating post:', error);
        return null;
    }

    return data;
}

// Update a post
export async function updatePost(id: string, updates: Partial<BlogPost>): Promise<BlogPost | null> {
    const { data, error } = await supabase
        .from('blog_posts')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

    if (error) {
        console.error('Error updating post:', error);
        return null;
    }

    return data;
}

// Delete a post
export async function deletePost(id: string): Promise<boolean> {
    const { error } = await supabase
        .from('blog_posts')
        .delete()
        .eq('id', id);

    if (error) {
        console.error('Error deleting post:', error);
        return false;
    }

    return true;
}

// Publish a post
export async function publishPost(id: string): Promise<BlogPost | null> {
    return updatePost(id, {
        published: true,
        published_at: new Date().toISOString()
    });
}

// Unpublish a post
export async function unpublishPost(id: string): Promise<BlogPost | null> {
    return updatePost(id, {
        published: false
    });
}

// Get dashboard stats
export async function getDashboardStats() {
    // Total posts
    const { count: totalPosts } = await supabase
        .from('blog_posts')
        .select('*', { count: 'exact', head: true });

    // Published posts
    const { count: publishedPosts } = await supabase
        .from('blog_posts')
        .select('*', { count: 'exact', head: true })
        .eq('published', true);

    // Draft posts
    const { count: draftPosts } = await supabase
        .from('blog_posts')
        .select('*', { count: 'exact', head: true })
        .eq('published', false);

    // Recent posts (last 5)
    const { data: recentPosts } = await supabase
        .from('blog_posts')
        .select('id, title, slug, published, created_at, source, source_agent')
        .order('created_at', { ascending: false })
        .limit(5);

    return {
        totalPosts: totalPosts || 0,
        publishedPosts: publishedPosts || 0,
        draftPosts: draftPosts || 0,
        recentPosts: recentPosts || []
    };
}

// Generate slug from title
export function generateSlug(title: string): string {
    return title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
}

// Calculate reading time
export function calculateReadingTime(content: string): string {
    const wordsPerMinute = 200;
    const words = content.split(/\s+/).length;
    const minutes = Math.ceil(words / wordsPerMinute);
    return `${minutes} min`;
}

// =====================================================
// SITE SETTINGS (Global Theme etc.)
// =====================================================

import type { ThemeName } from './themes';

// Get global site theme via API
export async function getGlobalTheme(): Promise<ThemeName> {
    try {
        const response = await fetch('/api/settings?key=theme');
        if (!response.ok) {
            console.error('Failed to fetch theme:', response.statusText);
            return 'emerald-night';
        }
        const data = await response.json();
        return (data.value as ThemeName) || 'emerald-night';
    } catch (error) {
        console.error('Failed to fetch global theme:', error);
        return 'emerald-night';
    }
}

// Set global site theme via API (admin only)
export async function setGlobalTheme(theme: ThemeName): Promise<{ success: boolean; error?: string }> {
    try {
        const response = await fetch('/api/settings', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ key: 'theme', value: theme })
        });

        if (!response.ok) {
            const data = await response.json();
            console.error('Error setting global theme:', data.error);
            return { success: false, error: data.error || response.statusText };
        }

        return { success: true };
    } catch (error) {
        console.error('Error setting global theme:', error);
        return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
}

