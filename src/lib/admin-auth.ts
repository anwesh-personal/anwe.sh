/**
 * Admin API Authentication
 * Validates that requests to admin API routes come from authenticated admin users
 */

import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * Verify the request is from an authenticated admin
 * Returns user data if valid, null if not authenticated
 */
export async function verifyAdminAuth(request: NextRequest): Promise<{
    authenticated: boolean;
    userId?: string;
    email?: string;
    error?: string;
}> {
    try {
        // Get the auth token from cookie or Authorization header
        const authHeader = request.headers.get('Authorization');
        const cookieHeader = request.headers.get('cookie');

        // Extract access token from Authorization header
        let accessToken: string | null = null;

        if (authHeader?.startsWith('Bearer ')) {
            accessToken = authHeader.substring(7);
        }

        // Or try to get from supabase auth cookie
        if (!accessToken && cookieHeader) {
            // Supabase stores auth in sb-<project>-auth-token cookie
            const cookies = cookieHeader.split(';').map(c => c.trim());
            const authCookie = cookies.find(c => c.includes('auth-token'));

            if (authCookie) {
                try {
                    const cookieValue = authCookie.split('=')[1];
                    if (cookieValue) {
                        const decoded = decodeURIComponent(cookieValue);
                        const parsed = JSON.parse(decoded);
                        accessToken = parsed.access_token || parsed[0]?.access_token;
                    }
                } catch {
                    // Cookie parsing failed
                }
            }
        }

        if (!accessToken) {
            return { authenticated: false, error: 'No authentication token provided' };
        }

        // Verify the token with Supabase
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

        if (!supabaseUrl || !serviceKey) {
            return { authenticated: false, error: 'Server configuration error' };
        }

        const supabase = createClient(supabaseUrl, serviceKey);

        // Get the user from the token
        const { data: { user }, error } = await supabase.auth.getUser(accessToken);

        if (error || !user) {
            return { authenticated: false, error: 'Invalid or expired token' };
        }

        return {
            authenticated: true,
            userId: user.id,
            email: user.email
        };

    } catch (error) {
        console.error('Admin auth verification error:', error);
        return { authenticated: false, error: 'Authentication failed' };
    }
}

/**
 * Simple wrapper that throws if not authenticated
 * Use in API routes that require admin access
 */
export async function requireAdminAuth(request: NextRequest): Promise<{ userId: string; email?: string }> {
    const result = await verifyAdminAuth(request);

    if (!result.authenticated) {
        throw new Error(result.error || 'Unauthorized');
    }

    return { userId: result.userId!, email: result.email };
}
