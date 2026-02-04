/**
 * Admin Fetch Helper
 * Centralized fetch wrapper that includes auth token for admin API calls
 */

import { createBrowserClient } from '@supabase/ssr';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

/**
 * Fetch with admin authentication
 * Automatically includes the auth token in the Authorization header
 */
export async function adminFetch(
    url: string,
    options: RequestInit = {}
): Promise<Response> {
    // Get current session
    const client = createBrowserClient(supabaseUrl, supabaseAnonKey);
    const { data: { session } } = await client.auth.getSession();

    // Build headers
    const headers = new Headers(options.headers);

    // Add auth token if we have a session
    if (session?.access_token) {
        headers.set('Authorization', `Bearer ${session.access_token}`);
    }

    // Ensure content-type for JSON
    if (!headers.has('Content-Type') && options.body) {
        headers.set('Content-Type', 'application/json');
    }

    return fetch(url, {
        ...options,
        headers,
        credentials: 'include'
    });
}

/**
 * GET request with admin auth
 */
export async function adminGet(url: string): Promise<Response> {
    return adminFetch(url, { method: 'GET' });
}

/**
 * POST request with admin auth
 */
export async function adminPost(url: string, data: unknown): Promise<Response> {
    return adminFetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });
}

/**
 * PUT request with admin auth
 */
export async function adminPut(url: string, data: unknown): Promise<Response> {
    return adminFetch(url, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });
}

/**
 * DELETE request with admin auth
 */
export async function adminDelete(url: string): Promise<Response> {
    return adminFetch(url, { method: 'DELETE' });
}
