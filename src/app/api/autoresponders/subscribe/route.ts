/**
 * Autoresponder Subscribe API Route
 * Public endpoint for subscribing emails to autoresponders
 * Also saves to local leads database
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { getProvider, type ProviderType, type AutoresponderConfig, type SubscribeData } from '@/lib/autoresponders';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const {
            email,
            name,
            firstName,
            lastName,
            phone,
            company,
            listId,
            formId,
            tags,
            customFields,
            provider: specificProvider,  // Optional: target specific provider
            integrationId,               // Optional: target specific integration
            saveToLocal = true,          // Whether to also save to local leads
            source = 'form',
            sourcePage = '/',
        } = body;

        // Validate email
        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return NextResponse.json({ error: 'Valid email is required' }, { status: 400 });
        }

        const supabase = getSupabaseAdmin();
        const results: { provider: string; success: boolean; error?: string }[] = [];
        let leadId: string | undefined;

        // Save to local leads database first
        if (saveToLocal) {
            try {
                const { data: lead } = await supabase
                    .from('leads')
                    .insert({
                        email,
                        name: name || `${firstName || ''} ${lastName || ''}`.trim() || null,
                        company,
                        phone,
                        source,
                        source_page: sourcePage,
                        status: 'new',
                        custom_fields: customFields,
                    })
                    .select('id')
                    .single();

                leadId = lead?.id;
            } catch (error) {
                console.error('Failed to save lead locally:', error);
                // Continue with autoresponder sync even if local save fails
            }
        }

        // Find integration(s) to sync with
        let integrationQuery = supabase
            .from('autoresponder_integrations')
            .select('*')
            .eq('is_active', true);

        if (integrationId) {
            integrationQuery = integrationQuery.eq('id', integrationId);
        } else if (specificProvider) {
            integrationQuery = integrationQuery.eq('provider', specificProvider);
        } else {
            // Use default integration only
            integrationQuery = integrationQuery.eq('is_default', true);
        }

        const { data: integrations } = await integrationQuery;

        if (!integrations || integrations.length === 0) {
            // No integrations configured, but local save succeeded
            return NextResponse.json({
                success: true,
                message: saveToLocal ? 'Lead saved locally' : 'No autoresponder configured',
                leadId,
                synced: [],
            });
        }

        // Subscribe to each integration
        for (const integration of integrations) {
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

            const subscribeData: SubscribeData = {
                email,
                name,
                firstName,
                lastName,
                phone,
                company,
                customFields,
                listId: listId || integration.default_list_id,
                formId: formId || integration.default_form_id,
                tags: tags || integration.default_tag_ids,
            };

            try {
                const providerInstance = getProvider(integration.provider as ProviderType);
                const result = await providerInstance.subscribe(config, subscribeData);

                results.push({
                    provider: integration.provider,
                    success: result.success,
                    error: result.error,
                });

                // Log sync attempt
                if (leadId) {
                    await supabase.from('lead_sync_log').insert({
                        lead_id: leadId,
                        autoresponder_id: integration.id,
                        provider: integration.provider,
                        status: result.success ? 'success' : 'failed',
                        provider_subscriber_id: result.subscriberId,
                        error_message: result.error,
                        request_payload: { email, name },
                        response_payload: result,
                        synced_at: result.success ? new Date().toISOString() : null,
                    });

                    // Update lead sync status
                    if (result.success) {
                        await supabase
                            .from('leads')
                            .update({
                                autoresponder_synced: true,
                                autoresponder_synced_at: new Date().toISOString(),
                            })
                            .eq('id', leadId);
                    }
                }

                // Update integration stats
                if (result.success) {
                    await supabase
                        .from('autoresponder_integrations')
                        .update({
                            total_synced: integration.total_synced + 1,
                            last_synced_at: new Date().toISOString(),
                            last_error: null,
                        })
                        .eq('id', integration.id);
                } else {
                    await supabase
                        .from('autoresponder_integrations')
                        .update({
                            last_error: result.error,
                        })
                        .eq('id', integration.id);
                }

            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                results.push({
                    provider: integration.provider,
                    success: false,
                    error: errorMessage,
                });

                // Log failed sync
                if (leadId) {
                    await supabase.from('lead_sync_log').insert({
                        lead_id: leadId,
                        autoresponder_id: integration.id,
                        provider: integration.provider,
                        status: 'failed',
                        error_message: errorMessage,
                    });
                }
            }
        }

        // Determine overall success
        const anySuccess = results.some(r => r.success);
        const allSuccess = results.every(r => r.success);

        return NextResponse.json({
            success: anySuccess,
            message: allSuccess
                ? 'Successfully subscribed'
                : anySuccess
                    ? 'Partially subscribed'
                    : 'Subscription failed',
            leadId,
            synced: results,
        });

    } catch (error) {
        console.error('Subscribe error:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Internal error' },
            { status: 500 }
        );
    }
}
