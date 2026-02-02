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
        // On app subdomain, redirect root to /admin
        if (pathname === '/') {
            return NextResponse.redirect(new URL('/admin', request.url));
        }

        // Block marketing pages on app subdomain
        const marketingPages = ['/blog', '/docs', '/about', '/contact'];
        if (marketingPages.some(page => pathname.startsWith(page))) {
            // Redirect to main domain for marketing pages
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

    // On main domain, redirect /admin to app subdomain
    if (pathname.startsWith('/admin')) {
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
        '/blog/:path*',
        '/docs/:path*',
    ],
};
