import { createServerSupabase } from '@/lib/supabase-server';
import { NextResponse, type NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
    const requestUrl = new URL(request.url);
    const code = requestUrl.searchParams.get('code');
    const next = requestUrl.searchParams.get('next') || '/admin';

    if (code) {
        const supabase = await createServerSupabase();

        const { error } = await supabase.auth.exchangeCodeForSession(code);

        if (!error) {
            // Successful auth - redirect to intended page
            return NextResponse.redirect(new URL(next, request.url));
        }
    }

    // Error or no code - redirect to login with error
    return NextResponse.redirect(new URL('/login?error=auth_failed', request.url));
}
