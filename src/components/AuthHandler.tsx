'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClientSupabase } from '@/lib/supabase-client';

export function AuthHandler() {
    const router = useRouter();
    const supabase = createClientSupabase();

    useEffect(() => {
        // Handle auth state changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, session) => {
                if (event === 'SIGNED_IN' && session) {
                    // User just signed in - redirect to admin
                    router.push('/admin');
                } else if (event === 'PASSWORD_RECOVERY') {
                    // Password recovery mode - show password form
                    router.push('/auth/confirm?type=recovery');
                }
            }
        );

        // Check for auth tokens in URL hash (Supabase redirects with hash fragments)
        const handleHashTokens = async () => {
            const hash = window.location.hash;
            if (hash && hash.includes('access_token')) {
                // Let Supabase handle the hash
                const { data, error } = await supabase.auth.getSession();

                if (!error && data.session) {
                    // Clear the hash and redirect to admin
                    window.history.replaceState(null, '', window.location.pathname);
                    router.push('/admin');
                }
            }
        };

        handleHashTokens();

        return () => {
            subscription.unsubscribe();
        };
    }, [supabase, router]);

    return null;
}
