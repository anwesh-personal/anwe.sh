import { createBrowserClient } from '@supabase/ssr';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';

// Browser client for client components
export function createClientSupabase() {
    return createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
}

// Server client for server components and API routes
export async function createServerSupabase() {
    const cookieStore = await cookies();

    return createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                get(name: string) {
                    return cookieStore.get(name)?.value;
                },
                set(name: string, value: string, options: CookieOptions) {
                    try {
                        cookieStore.set({ name, value, ...options });
                    } catch {
                        // Called from Server Component - ignore
                    }
                },
                remove(name: string, options: CookieOptions) {
                    try {
                        cookieStore.set({ name, value: '', ...options });
                    } catch {
                        // Called from Server Component - ignore
                    }
                },
            },
        }
    );
}

// Get current user from server
export async function getServerUser() {
    const supabase = await createServerSupabase();
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
        return null;
    }

    return user;
}

// Get current session from server
export async function getServerSession() {
    const supabase = await createServerSupabase();
    const { data: { session }, error } = await supabase.auth.getSession();

    if (error || !session) {
        return null;
    }

    return session;
}
