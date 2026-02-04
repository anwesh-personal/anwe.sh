/**
 * Form Embeds API Route
 * CRUD operations for custom HTML/JS form embeds
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { verifyAdminAuth } from '@/lib/admin-auth';
import { parseFormHtml, sanitizeFormHtml } from '@/lib/form-parser';

// =====================================================
// GET - List all form embeds or fetch one
// =====================================================

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const activeOnly = searchParams.get('active') === 'true';

    const supabase = getSupabaseAdmin();

    try {
        // Fetch single embed (can be public for rendering)
        if (id) {
            const { data, error } = await supabase
                .from('form_embeds')
                .select('*, autoresponder:autoresponder_id(id, provider, name)')
                .eq('id', id)
                .single();

            if (error) {
                return NextResponse.json({ error: error.message }, { status: 500 });
            }

            return NextResponse.json(data);
        }

        // List all embeds (requires auth unless fetching active only)
        if (!activeOnly) {
            const auth = await verifyAdminAuth(request);
            if (!auth.authenticated) {
                return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
            }
        }

        let query = supabase
            .from('form_embeds')
            .select('*, autoresponder:autoresponder_id(id, provider, name)')
            .order('created_at', { ascending: false });

        if (activeOnly) {
            query = query.eq('is_active', true);
        }

        const { data, error } = await query;

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ embeds: data });

    } catch (error) {
        console.error('Error fetching form embeds:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Internal error' },
            { status: 500 }
        );
    }
}

// =====================================================
// POST - Create new form embed or parse HTML
// =====================================================

export async function POST(request: NextRequest) {
    // Verify admin authentication
    const auth = await verifyAdminAuth(request);
    if (!auth.authenticated) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { action } = body;

    // Parse HTML without saving
    if (action === 'parse') {
        const { html } = body;

        if (!html) {
            return NextResponse.json({ error: 'HTML content is required' }, { status: 400 });
        }

        const parsed = parseFormHtml(html);
        return NextResponse.json(parsed);
    }

    // Create new form embed
    const {
        name,
        description,
        html_content,
        render_mode = 'strip_design',
        autoresponder_id,
        save_to_local = true,
        placement = 'popup',
        placement_selector,
        trigger_type = 'exit_intent',
        trigger_value,
        show_on_pages,
        hide_on_pages,
        show_to = 'all',
        max_impressions,
        custom_styles,
    } = body;

    if (!name || !html_content) {
        return NextResponse.json(
            { error: 'Name and HTML content are required' },
            { status: 400 }
        );
    }

    // Parse the HTML
    const parsed = parseFormHtml(html_content);

    const supabase = getSupabaseAdmin();

    try {
        const { data, error } = await supabase
            .from('form_embeds')
            .insert({
                name,
                description,
                html_content: render_mode === 'use_original'
                    ? html_content
                    : sanitizeFormHtml(html_content),
                render_mode,
                parsed_action: parsed.action,
                parsed_method: parsed.method,
                parsed_fields: parsed.fields,
                parsed_hidden_fields: parsed.hiddenFields,
                parsed_submit_text: parsed.submitButtonText,
                autoresponder_id,
                save_to_local,
                placement,
                placement_selector,
                trigger_type,
                trigger_value,
                show_on_pages: show_on_pages || ['*'],
                hide_on_pages: hide_on_pages || [],
                show_to,
                max_impressions,
                custom_styles: custom_styles || {},
                is_active: true,
            })
            .select()
            .single();

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true, embed: data });

    } catch (error) {
        console.error('Error creating form embed:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Internal error' },
            { status: 500 }
        );
    }
}

// =====================================================
// PUT - Update form embed
// =====================================================

export async function PUT(request: NextRequest) {
    // Verify admin authentication
    const auth = await verifyAdminAuth(request);
    if (!auth.authenticated) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { id, html_content, ...updates } = body;

    if (!id) {
        return NextResponse.json({ error: 'Embed ID is required' }, { status: 400 });
    }

    // If updating HTML content, re-parse
    if (html_content) {
        const parsed = parseFormHtml(html_content);
        updates.html_content = updates.render_mode === 'use_original'
            ? html_content
            : sanitizeFormHtml(html_content);
        updates.parsed_action = parsed.action;
        updates.parsed_method = parsed.method;
        updates.parsed_fields = parsed.fields;
        updates.parsed_hidden_fields = parsed.hiddenFields;
        updates.parsed_submit_text = parsed.submitButtonText;
    }

    const supabase = getSupabaseAdmin();

    try {
        const { data, error } = await supabase
            .from('form_embeds')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true, embed: data });

    } catch (error) {
        console.error('Error updating form embed:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Internal error' },
            { status: 500 }
        );
    }
}

// =====================================================
// DELETE - Remove form embed
// =====================================================

export async function DELETE(request: NextRequest) {
    // Verify admin authentication
    const auth = await verifyAdminAuth(request);
    if (!auth.authenticated) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
        return NextResponse.json({ error: 'Embed ID is required' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();

    try {
        const { error } = await supabase
            .from('form_embeds')
            .delete()
            .eq('id', id);

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error('Error deleting form embed:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Internal error' },
            { status: 500 }
        );
    }
}
