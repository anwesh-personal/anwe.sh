import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
    const response = NextResponse.next({
        request: {
            headers: request.headers,
        },
    });

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

    // Refresh session if expired
    const { data: { session } } = await supabase.auth.getSession();

    // Check if accessing admin routes
    const isAdminRoute = request.nextUrl.pathname.startsWith('/admin');
    const isLoginPage = request.nextUrl.pathname === '/login';

    // If accessing admin without session, redirect to login
    if (isAdminRoute && !session) {
        const redirectUrl = new URL('/login', request.url);
        redirectUrl.searchParams.set('redirect', request.nextUrl.pathname);
        return NextResponse.redirect(redirectUrl);
    }

    // If on login page with session, redirect to admin
    if (isLoginPage && session) {
        return NextResponse.redirect(new URL('/admin', request.url));
    }

    return response;
}

export const config = {
    matcher: [
        '/admin/:path*',
        '/login',
    ],
};
