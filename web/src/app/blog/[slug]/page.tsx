import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getAllPosts, getPostBySlug } from '@/lib/mock-posts';
import { Navigation } from '@/components/marketing/Navigation';
import { Footer } from '@/components/marketing/Footer';

// Generate static params for all posts
export async function generateStaticParams() {
    const posts = getAllPosts();
    return posts.map((post) => ({
        slug: post.slug,
    }));
}

// Generate metadata for each post
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    const post = getPostBySlug(slug);

    if (!post) {
        return { title: 'Post Not Found' };
    }

    return {
        title: `${post.title} | Anwesh Rath`,
        description: post.excerpt,
    };
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    const post = getPostBySlug(slug);

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
                        <span>{post.publishedAt}</span>
                        <span>·</span>
                        <span>{post.readingTime} read</span>
                    </div>
                </header>

                {/* Content */}
                <div className="post-content">
                    <div
                        className="prose"
                        dangerouslySetInnerHTML={{ __html: parseMarkdown(post.content) }}
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

// Simple markdown parser (basic - can upgrade to remark/rehype later)
function parseMarkdown(content: string): string {
    return content
        // Headers
        .replace(/^### (.*$)/gim, '<h3>$1</h3>')
        .replace(/^## (.*$)/gim, '<h2>$1</h2>')
        .replace(/^# (.*$)/gim, '<h1>$1</h1>')
        // Bold
        .replace(/\*\*(.*)\*\*/gim, '<strong>$1</strong>')
        // Italic
        .replace(/\*(.*)\*/gim, '<em>$1</em>')
        // Links
        .replace(/\[(.*?)\]\((.*?)\)/gim, '<a href="$2">$1</a>')
        // Lists
        .replace(/^- (.*$)/gim, '<li>$1</li>')
        // Horizontal rule
        .replace(/^---$/gim, '<hr />')
        // Paragraphs
        .replace(/\n\n/gim, '</p><p>')
        // Wrap in paragraph
        .replace(/^(.+)$/gim, (match) => {
            if (match.startsWith('<h') || match.startsWith('<li') || match.startsWith('<hr') || match.startsWith('<p>') || match.startsWith('</p>')) {
                return match;
            }
            return match;
        });
}
