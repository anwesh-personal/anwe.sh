import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
    const response = NextResponse.next({
        request: {
            headers: request.headers,
        },
    });

    const hostname = request.headers.get('host') || '';
    const isAppSubdomain = hostname.startsWith('app.');
    const pathname = request.nextUrl.pathname;
    const searchParams = request.nextUrl.searchParams;
    const hash = request.headers.get('x-url-hash') || '';

    // NEVER redirect if there are auth tokens in the URL
    // These need to be processed by the client
    const hasAuthTokens =
        searchParams.has('token_hash') ||
        searchParams.has('code') ||
        searchParams.has('access_token') ||
        searchParams.has('error_description');

    if (hasAuthTokens) {
        // Let the request through - client will handle auth
        return response;
    }

    // Create Supabase client for auth checks
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                get(name: string) {
                    return request.cookies.get(name)?.value;
                },
                set(name: string, value: string, options: CookieOptions) {
                    request.cookies.set({ name, value, ...options });
                    response.cookies.set({ name, value, ...options });
                },
                remove(name: string, options: CookieOptions) {
                    request.cookies.set({ name, value: '', ...options });
                    response.cookies.set({ name, value: '', ...options });
                },
            },
        }
    );

    // Get session
    const { data: { session } } = await supabase.auth.getSession();

    // =========================================
    // SUBDOMAIN ROUTING: app.anwe.sh
    // =========================================
    if (isAppSubdomain) {
        // On app subdomain, redirect root to /admin (only if logged in)
        if (pathname === '/') {
            if (session) {
                return NextResponse.redirect(new URL('/admin', request.url));
            } else {
                return NextResponse.redirect(new URL('/login', request.url));
            }
        }

        // Block marketing pages on app subdomain
        const marketingPages = ['/blog', '/docs', '/about', '/contact'];
        if (marketingPages.some(page => pathname.startsWith(page))) {
            const mainUrl = new URL(pathname, 'https://anwe.sh');
            return NextResponse.redirect(mainUrl);
        }

        // Admin routes require auth
        if (pathname.startsWith('/admin')) {
            if (!session) {
                const redirectUrl = new URL('/login', request.url);
                redirectUrl.searchParams.set('redirect', pathname);
                return NextResponse.redirect(redirectUrl);
            }
        }

        // Login page - redirect if already logged in
        if (pathname === '/login' && session) {
            return NextResponse.redirect(new URL('/admin', request.url));
        }

        return response;
    }

    // =========================================
    // MAIN DOMAIN ROUTING: anwe.sh
    // =========================================

    // On main domain, redirect /admin to app subdomain (but not on localhost)
    const isLocalhost = hostname.includes('localhost') || hostname.includes('127.0.0.1');
    if (pathname.startsWith('/admin') && !isLocalhost) {
        return NextResponse.redirect(new URL(pathname, 'https://app.anwe.sh'));
    }

    // On main domain, redirect /login to app subdomain
    if (pathname === '/login') {
        return NextResponse.redirect(new URL('/login', 'https://app.anwe.sh'));
    }

    return response;
}

export const config = {
    matcher: [
        '/',
        '/admin/:path*',
        '/login',
        '/auth/:path*',
        '/blog/:path*',
        '/docs/:path*',
    ],
};
