// Blog Types

export interface BlogPost {
    id: string;
    title: string;
    slug: string;
    excerpt: string;
    content: string;
    coverImage?: string;
    category: string;
    published: boolean;
    publishedAt: string;
    readingTime: string;
    author: {
        name: string;
        avatar?: string;
    };
}

export interface BlogListResponse {
    posts: BlogPost[];
    total: number;
}
