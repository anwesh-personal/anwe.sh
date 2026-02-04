/**
 * Settings API
 * Server-side endpoint for managing site settings (bypasses RLS with service role)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Lazy-initialized service role client
let _supabaseAdmin: SupabaseClient | null = null;

function getSupabaseAdmin(): SupabaseClient {
    if (!_supabaseAdmin) {
        _supabaseAdmin = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );
    }
    return _supabaseAdmin;
}

// GET: Fetch settings
export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const key = searchParams.get('key');

    try {
        const supabase = getSupabaseAdmin();

        if (key) {
            // Fetch single setting
            const { data, error } = await supabase
                .from('site_settings')
                .select('key, value')
                .eq('key', key)
                .single();

            if (error) {
                // If not found, return default for known keys
                if (error.code === 'PGRST116' && key === 'theme') {
                    return NextResponse.json({ key: 'theme', value: 'emerald-night' });
                }
                return NextResponse.json({ error: error.message }, { status: 500 });
            }

            return NextResponse.json(data);
        } else {
            // Fetch all settings
            const { data, error } = await supabase
                .from('site_settings')
                .select('key, value');

            if (error) {
                return NextResponse.json({ error: error.message }, { status: 500 });
            }

            return NextResponse.json({ settings: data });
        }
    } catch (error) {
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Internal error' },
            { status: 500 }
        );
    }
}

// POST: Update setting
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { key, value } = body;

        if (!key) {
            return NextResponse.json({ error: 'key is required' }, { status: 400 });
        }

        const supabase = getSupabaseAdmin();

        const { error } = await supabase
            .from('site_settings')
            .upsert(
                {
                    key,
                    value,
                    updated_at: new Date().toISOString()
                },
                { onConflict: 'key' }
            );

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true, key, value });
    } catch (error) {
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Internal error' },
            { status: 500 }
        );
    }
}
