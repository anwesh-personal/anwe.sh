import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merge Tailwind classes with clsx
 */
export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

/**
 * Format date for display
 */
export function formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });
}

/**
 * Format date for blog posts (shorter)
 */
export function formatBlogDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    });
}

/**
 * Generate slug from title
 */
export function slugify(text: string): string {
    return text
        .toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .replace(/[\s_-]+/g, '-')
        .replace(/^-+|-+$/g, '');
}

/**
 * Truncate text with ellipsis
 */
export function truncate(text: string, length: number): string {
    if (text.length <= length) return text;
    return text.slice(0, length).trim() + '...';
}

/**
 * Calculate reading time
 */
export function readingTime(content: string): string {
    const wordsPerMinute = 200;
    const words = content.trim().split(/\s+/).length;
    const minutes = Math.ceil(words / wordsPerMinute);
    return `${minutes} min read`;
}

/**
 * Debounce function
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
    func: T,
    wait: number
): (...args: Parameters<T>) => void {
    let timeout: NodeJS.Timeout;
    return (...args: Parameters<T>) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => func(...args), wait);
    };
}

/**
 * Generate random ID
 */
export function generateId(): string {
    return Math.random().toString(36).substring(2, 15);
}

/**
 * Check if we're on the client side
 */
export const isClient = typeof window !== 'undefined';

/**
 * Check if we're in development mode
 */
export const isDev = process.env.NODE_ENV === 'development';

/**
 * Site metadata
 */
export const siteConfig = {
    name: 'Anwesh Rath',
    title: 'Anwesh Rath - Systems Architect & Enterprise Builder',
    description:
        '17+ years architecting enterprise solutions, AI systems, and automation that transforms how businesses scale.',
    url: 'https://anwe.sh',
    ogImage: 'https://anwe.sh/og.png',
    links: {
        twitter: 'https://twitter.com/anweshrath',
        github: 'https://github.com/anweshrath',
        linkedin: 'https://linkedin.com/in/anweshrath',
    },
    author: {
        name: 'Anwesh Rath',
        email: 'hello@anwe.sh',
    },
};
