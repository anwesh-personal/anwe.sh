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
