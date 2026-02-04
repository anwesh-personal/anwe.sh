/**
 * Autoresponders API Route
 * CRUD operations for autoresponder integrations
 * All endpoints require admin authentication
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { verifyAdminAuth } from '@/lib/admin-auth';
import {
    getProvider,
    getProviderName,
    type ProviderType,
    type AutoresponderConfig
} from '@/lib/autoresponders';

// =====================================================
// GET - List all integrations or fetch one
// =====================================================

export async function GET(request: NextRequest) {
    // Verify admin authentication
    const auth = await verifyAdminAuth(request);
    if (!auth.authenticated) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const provider = searchParams.get('provider');
    const action = searchParams.get('action');

    const supabase = getSupabaseAdmin();

    try {
        // Fetch lists/forms/tags from a provider
        if (action === 'fetch_data' && (id || provider)) {
            const query = id
                ? supabase.from('autoresponder_integrations').select('*').eq('id', id).single()
                : supabase.from('autoresponder_integrations').select('*').eq('provider', provider).single();

            const { data: integration, error } = await query;

            if (error || !integration) {
                return NextResponse.json({ error: 'Integration not found' }, { status: 404 });
            }

            // Build config
            const config: AutoresponderConfig = {
                provider: integration.provider as ProviderType,
                apiKey: integration.api_key,
                apiSecret: integration.api_secret,
                apiUrl: integration.api_url,
                accessToken: integration.access_token,
                refreshToken: integration.refresh_token,
                defaultListId: integration.default_list_id,
                defaultFormId: integration.default_form_id,
                defaultTagIds: integration.default_tag_ids,
                customSubscribeUrl: integration.custom_subscribe_url,
                customEmailField: integration.custom_email_field,
                customNameField: integration.custom_name_field,
                customHeaders: integration.custom_headers,
                customBodyTemplate: integration.custom_body_template,
            };

            const providerInstance = getProvider(integration.provider as ProviderType);
            const providerData = await providerInstance.fetchAllData(config);

            // Update cache in database
            await supabase
                .from('autoresponder_integrations')
                .update({
                    cached_lists: providerData.lists,
                    cached_forms: providerData.forms,
                    cached_tags: providerData.tags,
                    cached_campaigns: providerData.campaigns,
                    cache_updated_at: new Date().toISOString(),
                })
                .eq('id', integration.id);

            return NextResponse.json({
                ...providerData,
                provider: integration.provider,
                name: integration.name,
            });
        }

        // Fetch single integration
        if (id) {
            const { data, error } = await supabase
                .from('autoresponder_integrations')
                .select('*')
                .eq('id', id)
                .single();

            if (error) {
                return NextResponse.json({ error: error.message }, { status: 500 });
            }

            // Mask sensitive data
            return NextResponse.json({
                ...data,
                api_key: data.api_key ? '••••••••' + data.api_key.slice(-4) : null,
                api_secret: data.api_secret ? '••••••••' : null,
                access_token: data.access_token ? '••••••••' : null,
                refresh_token: data.refresh_token ? '••••••••' : null,
            });
        }

        // Fetch all integrations
        const { data, error } = await supabase
            .from('autoresponder_integrations')
            .select('*')
            .order('created_at', { ascending: true });

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        // Mask sensitive data
        const masked = data.map(integration => ({
            ...integration,
            api_key: integration.api_key ? '••••••••' + integration.api_key.slice(-4) : null,
            api_secret: integration.api_secret ? '••••••••' : null,
            access_token: integration.access_token ? '••••••••' : null,
            refresh_token: integration.refresh_token ? '••••••••' : null,
            providerName: getProviderName(integration.provider as ProviderType),
        }));

        return NextResponse.json({ integrations: masked });

    } catch (error) {
        console.error('Error fetching integrations:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Internal error' },
            { status: 500 }
        );
    }
}

// =====================================================
// POST - Create new integration or validate credentials
// =====================================================

export async function POST(request: NextRequest) {
    // Verify admin authentication
    const auth = await verifyAdminAuth(request);
    if (!auth.authenticated) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
        action,
        provider,
        name,
        api_key,
        api_secret,
        api_url,
        access_token,
        refresh_token,
        default_list_id,
        default_form_id,
        default_tag_ids,
        custom_subscribe_url,
        custom_email_field,
        custom_name_field,
        custom_headers,
        custom_body_template,
        is_default,
    } = body;

    const supabase = getSupabaseAdmin();

    try {
        // Validate credentials without saving
        if (action === 'validate') {
            if (!provider) {
                return NextResponse.json({ error: 'Provider is required' }, { status: 400 });
            }

            const config: AutoresponderConfig = {
                provider: provider as ProviderType,
                apiKey: api_key,
                apiSecret: api_secret,
                apiUrl: api_url,
                accessToken: access_token,
                refreshToken: refresh_token,
                customSubscribeUrl: custom_subscribe_url,
                customEmailField: custom_email_field,
                customNameField: custom_name_field,
                customHeaders: custom_headers,
                customBodyTemplate: custom_body_template,
            };

            const providerInstance = getProvider(provider as ProviderType);
            const result = await providerInstance.validateCredentials(config);

            return NextResponse.json(result);
        }

        // Create new integration
        if (!provider || !name) {
            return NextResponse.json(
                { error: 'Provider and name are required' },
                { status: 400 }
            );
        }

        // Validate credentials first
        const config: AutoresponderConfig = {
            provider: provider as ProviderType,
            apiKey: api_key,
            apiSecret: api_secret,
            apiUrl: api_url,
            accessToken: access_token,
            refreshToken: refresh_token,
            defaultListId: default_list_id,
            defaultFormId: default_form_id,
            defaultTagIds: default_tag_ids,
            customSubscribeUrl: custom_subscribe_url,
            customEmailField: custom_email_field,
            customNameField: custom_name_field,
            customHeaders: custom_headers,
            customBodyTemplate: custom_body_template,
        };

        const providerInstance = getProvider(provider as ProviderType);
        const validation = await providerInstance.validateCredentials(config);

        if (!validation.valid) {
            return NextResponse.json(
                { error: validation.error || 'Invalid credentials' },
                { status: 400 }
            );
        }

        // If setting as default, unset other defaults
        if (is_default) {
            await supabase
                .from('autoresponder_integrations')
                .update({ is_default: false })
                .eq('is_default', true);
        }

        // Create integration
        const { data, error } = await supabase
            .from('autoresponder_integrations')
            .insert({
                provider,
                name,
                api_key,
                api_secret,
                api_url,
                access_token,
                refresh_token,
                default_list_id,
                default_form_id,
                default_tag_ids,
                custom_subscribe_url,
                custom_email_field,
                custom_name_field,
                custom_headers,
                custom_body_template,
                is_default: is_default || false,
                is_verified: true,
                last_verified_at: new Date().toISOString(),
            })
            .select()
            .single();

        if (error) {
            // Check for duplicate provider
            if (error.code === '23505') {
                return NextResponse.json(
                    { error: `Integration for ${getProviderName(provider as ProviderType)} already exists` },
                    { status: 409 }
                );
            }
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        // Fetch initial data from provider
        try {
            const providerData = await providerInstance.fetchAllData(config);

            await supabase
                .from('autoresponder_integrations')
                .update({
                    cached_lists: providerData.lists,
                    cached_forms: providerData.forms,
                    cached_tags: providerData.tags,
                    cached_campaigns: providerData.campaigns,
                    cache_updated_at: new Date().toISOString(),
                })
                .eq('id', data.id);
        } catch {
            // Ignore cache errors
        }

        return NextResponse.json({
            success: true,
            integration: {
                ...data,
                api_key: data.api_key ? '••••••••' + data.api_key.slice(-4) : null,
                providerName: getProviderName(provider as ProviderType),
            }
        });

    } catch (error) {
        console.error('Error creating integration:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Internal error' },
            { status: 500 }
        );
    }
}

// =====================================================
// PUT - Update integration
// =====================================================

export async function PUT(request: NextRequest) {
    // Verify admin authentication
    const auth = await verifyAdminAuth(request);
    if (!auth.authenticated) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
        return NextResponse.json({ error: 'Integration ID is required' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();

    try {
        // If updating credentials, validate them
        if (updates.api_key || updates.api_url || updates.access_token) {
            // Fetch existing integration
            const { data: existing } = await supabase
                .from('autoresponder_integrations')
                .select('provider, api_key, api_url, access_token')
                .eq('id', id)
                .single();

            if (existing) {
                const config: AutoresponderConfig = {
                    provider: existing.provider as ProviderType,
                    apiKey: updates.api_key || existing.api_key,
                    apiUrl: updates.api_url || existing.api_url,
                    accessToken: updates.access_token || existing.access_token,
                };

                const providerInstance = getProvider(existing.provider as ProviderType);
                const validation = await providerInstance.validateCredentials(config);

                if (!validation.valid) {
                    return NextResponse.json(
                        { error: validation.error || 'Invalid credentials' },
                        { status: 400 }
                    );
                }

                updates.is_verified = true;
                updates.last_verified_at = new Date().toISOString();
                updates.last_error = null;
            }
        }

        // If setting as default, unset other defaults
        if (updates.is_default) {
            await supabase
                .from('autoresponder_integrations')
                .update({ is_default: false })
                .neq('id', id);
        }

        const { data, error } = await supabase
            .from('autoresponder_integrations')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            integration: {
                ...data,
                api_key: data.api_key ? '••••••••' + data.api_key.slice(-4) : null,
            }
        });

    } catch (error) {
        console.error('Error updating integration:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Internal error' },
            { status: 500 }
        );
    }
}

// =====================================================
// DELETE - Remove integration
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
        return NextResponse.json({ error: 'Integration ID is required' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();

    try {
        const { error } = await supabase
            .from('autoresponder_integrations')
            .delete()
            .eq('id', id);

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error('Error deleting integration:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Internal error' },
            { status: 500 }
        );
    }
}
