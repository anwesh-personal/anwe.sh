import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Types
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
// ADMIN FUNCTIONS (require service role in production)
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
