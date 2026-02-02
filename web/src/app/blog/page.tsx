import Link from 'next/link';
import { getAllPosts } from '@/lib/mock-posts';
import { Navigation } from '@/components/marketing/Navigation';
import { Footer } from '@/components/marketing/Footer';

export const metadata = {
    title: 'Insights | Anwesh Rath',
    description: 'Thoughts on AI systems, enterprise architecture, and building products that scale.',
};

export default function BlogPage() {
    const posts = getAllPosts();

    return (
        <>
            <Navigation />
            <main className="blog-page">
                {/* Header */}
                <header className="blog-header">
                    <span className="section-tag">Insights</span>
                    <h1 className="blog-page-title">Thoughts & Essays</h1>
                    <p className="blog-page-subtitle">
                        On AI systems, enterprise architecture, and building products that scale.
                    </p>
                </header>

                {/* Posts Grid */}
                <div className="blog-grid">
                    {posts.map((post) => (
                        <Link key={post.id} href={`/blog/${post.slug}`} className="blog-card">
                            <div className="blog-card-inner">
                                <span className="blog-card-category">{post.category}</span>
                                <h2 className="blog-card-title">{post.title}</h2>
                                <p className="blog-card-excerpt">{post.excerpt}</p>
                                <div className="blog-card-meta">
                                    <span>{post.publishedAt}</span>
                                    <span>·</span>
                                    <span>{post.readingTime}</span>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            </main>
            <Footer />
        </>
    );
}
