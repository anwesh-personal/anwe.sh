import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getAllPosts, getPostBySlug } from '@/lib/supabase';
import { Navigation } from '@/components/marketing/Navigation';
import { Footer } from '@/components/marketing/Footer';
import { marked } from 'marked';

// Configure marked for safe, consistent output
marked.setOptions({
    gfm: true,        // GitHub Flavored Markdown
    breaks: true,     // Convert \n to <br>
});

// Force dynamic rendering for theme sync
export const dynamic = 'force-dynamic';

// Generate static params for all posts
export async function generateStaticParams() {
    const posts = await getAllPosts();
    return posts.map((post) => ({
        slug: post.slug,
    }));
}

// Generate metadata for each post
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    const post = await getPostBySlug(slug);

    if (!post) {
        return { title: 'Post Not Found' };
    }

    return {
        title: post.meta_title || `${post.title} | Anwesh Rath`,
        description: post.meta_description || post.excerpt,
    };
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    const post = await getPostBySlug(slug);

    if (!post) {
        notFound();
    }

    return (
        <>
            <Navigation />
            <article className="blog-post">
                {/* Header */}
                <header className="post-header">
                    <Link href="/blog" className="post-back">
                        ← Back to Insights
                    </Link>
                    <span className="post-category">{post.category}</span>
                    <h1 className="post-title">{post.title}</h1>
                    <div className="post-meta">
                        <span>{post.published_at ? new Date(post.published_at).toLocaleDateString() : ''}</span>
                        <span>·</span>
                        <span>{post.reading_time} read</span>
                    </div>
                </header>

                {/* Content */}
                <div className="post-content">
                    <div
                        className="prose"
                        dangerouslySetInnerHTML={{ __html: parseContent(post.content) }}
                    />
                </div>

                {/* Footer */}
                <footer className="post-footer">
                    <div className="post-share">
                        <span>Share this:</span>
                        <a
                            href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(post.title)}&url=${encodeURIComponent(`https://anwe.sh/blog/${post.slug}`)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="share-link"
                        >
                            Twitter
                        </a>
                        <a
                            href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(`https://anwe.sh/blog/${post.slug}`)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="share-link"
                        >
                            LinkedIn
                        </a>
                    </div>
                    <Link href="/blog" className="post-back-bottom">
                        ← More Insights
                    </Link>
                </footer>
            </article>
            <Footer />
        </>
    );
}

// Parse content - handles both markdown and HTML
function parseContent(content: string): string {
    // If content is already HTML (has block-level tags), return as-is
    // This handles legacy ORA posts that sent HTML
    if (/<(p|div|h[1-6]|ul|ol|article|section)[\s>]/i.test(content)) {
        return content;
    }

    // Otherwise, parse as markdown
    return marked.parse(content) as string;
}
