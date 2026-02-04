/**
 * AI Providers API Route
 * Full CRUD operations with API key validation
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Types
interface AIProvider {
    id: string;
    name: string;
    slug: string;
    provider_type: string;
    api_key_encrypted: string | null;
    base_url: string | null;
    models: string[];
    is_active: boolean;
    priority: number;
    total_requests: number;
    total_tokens_used: number;
    total_cost_usd: number;
    consecutive_failures: number;
    created_at: string;
    updated_at: string;
}

// Lazy initialization
let supabase: ReturnType<typeof createClient> | null = null;

function getSupabase() {
    if (!supabase) {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
        const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
        supabase = createClient(supabaseUrl, supabaseServiceKey);
    }
    return supabase;
}

// Provider type definitions
const PROVIDER_CONFIGS: Record<string, {
    name: string;
    validateEndpoint: (key: string, baseUrl?: string) => Promise<{ valid: boolean; error?: string; models?: string[] }>;
    getModels: (key: string, baseUrl?: string) => Promise<Array<{ id: string; name: string; context?: number }>>;
}> = {
    openai: {
        name: 'OpenAI',
        validateEndpoint: async (key, baseUrl) => {
            try {
                const client = new OpenAI({ apiKey: key, baseURL: baseUrl || undefined });
                const models = await client.models.list();
                const chatModels = models.data
                    .filter(m => m.id.includes('gpt') || m.id.includes('o1'))
                    .map(m => m.id);
                return { valid: true, models: chatModels };
            } catch (e: unknown) {
                const error = e as Error;
                return { valid: false, error: error.message || 'Invalid API key' };
            }
        },
        getModels: async (key, baseUrl) => {
            const client = new OpenAI({ apiKey: key, baseURL: baseUrl || undefined });
            const models = await client.models.list();
            return models.data
                .filter(m => m.id.includes('gpt') || m.id.includes('o1'))
                .map(m => ({ id: m.id, name: m.id }));
        }
    },
    anthropic: {
        name: 'Anthropic',
        validateEndpoint: async (key) => {
            try {
                // Validate by calling messages.count_tokens (doesn't consume credits)
                const response = await fetch('https://api.anthropic.com/v1/messages/count_tokens', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'x-api-key': key,
                        'anthropic-version': '2023-06-01'
                    },
                    body: JSON.stringify({
                        model: 'claude-3-5-sonnet-latest',
                        messages: [{ role: 'user', content: 'test' }]
                    })
                });

                if (response.ok || response.status === 400) {
                    // 400 = invalid request but valid key, still counts as valid
                    // Latest Claude models from Anthropic docs
                    return {
                        valid: true,
                        models: [
                            'claude-sonnet-4-20250514',
                            'claude-3-5-sonnet-latest',
                            'claude-3-5-haiku-latest',
                            'claude-3-opus-latest',
                            'claude-3-sonnet-20240229',
                            'claude-3-haiku-20240307'
                        ]
                    };
                }
                const error = await response.json();
                return { valid: false, error: error.error?.message || 'Invalid API key' };
            } catch (e: unknown) {
                const error = e as Error;
                return { valid: false, error: error.message || 'Invalid API key' };
            }
        },
        getModels: async () => {
            // Anthropic doesn't have a public models list API
            // These are the current production models from their documentation
            return [
                { id: 'claude-sonnet-4-20250514', name: 'Claude Sonnet 4', context: 200000 },
                { id: 'claude-3-5-sonnet-latest', name: 'Claude 3.5 Sonnet', context: 200000 },
                { id: 'claude-3-5-haiku-latest', name: 'Claude 3.5 Haiku', context: 200000 },
                { id: 'claude-3-opus-latest', name: 'Claude 3 Opus', context: 200000 },
                { id: 'claude-3-sonnet-20240229', name: 'Claude 3 Sonnet', context: 200000 },
                { id: 'claude-3-haiku-20240307', name: 'Claude 3 Haiku', context: 200000 }
            ];
        }
    },
    google: {
        name: 'Google AI',
        validateEndpoint: async (key) => {
            try {
                // Use the models.list endpoint to validate key and get models
                const response = await fetch(
                    `https://generativelanguage.googleapis.com/v1beta/models?key=${key}`
                );
                if (!response.ok) {
                    const error = await response.json();
                    return { valid: false, error: error.error?.message || 'Invalid API key' };
                }
                const data = await response.json();
                const models = data.models
                    ?.filter((m: { supportedGenerationMethods?: string[] }) =>
                        m.supportedGenerationMethods?.includes('generateContent'))
                    .map((m: { name: string }) => m.name.replace('models/', '')) || [];
                return { valid: true, models };
            } catch (e: unknown) {
                const error = e as Error;
                return { valid: false, error: error.message || 'Invalid API key' };
            }
        },
        getModels: async (key) => {
            try {
                const response = await fetch(
                    `https://generativelanguage.googleapis.com/v1beta/models?key=${key}`
                );
                if (!response.ok) return [];
                const data = await response.json();
                return data.models
                    ?.filter((m: { supportedGenerationMethods?: string[] }) =>
                        m.supportedGenerationMethods?.includes('generateContent'))
                    .map((m: { name: string; displayName?: string; inputTokenLimit?: number }) => ({
                        id: m.name.replace('models/', ''),
                        name: m.displayName || m.name.replace('models/', ''),
                        context: m.inputTokenLimit || 0
                    })) || [];
            } catch {
                return [];
            }
        }
    },
    groq: {
        name: 'Groq',
        validateEndpoint: async (key, baseUrl) => {
            try {
                const client = new OpenAI({
                    apiKey: key,
                    baseURL: baseUrl || 'https://api.groq.com/openai/v1'
                });
                const models = await client.models.list();
                return { valid: true, models: models.data.map(m => m.id) };
            } catch (e: unknown) {
                const error = e as Error;
                return { valid: false, error: error.message || 'Invalid API key' };
            }
        },
        getModels: async (key, baseUrl) => {
            const client = new OpenAI({
                apiKey: key,
                baseURL: baseUrl || 'https://api.groq.com/openai/v1'
            });
            const models = await client.models.list();
            return models.data.map(m => ({ id: m.id, name: m.id }));
        }
    },
    mistral: {
        name: 'Mistral',
        validateEndpoint: async (key, baseUrl) => {
            try {
                const client = new OpenAI({
                    apiKey: key,
                    baseURL: baseUrl || 'https://api.mistral.ai/v1'
                });
                const models = await client.models.list();
                return { valid: true, models: models.data.map(m => m.id) };
            } catch (e: unknown) {
                const error = e as Error;
                return { valid: false, error: error.message || 'Invalid API key' };
            }
        },
        getModels: async (key, baseUrl) => {
            const client = new OpenAI({
                apiKey: key,
                baseURL: baseUrl || 'https://api.mistral.ai/v1'
            });
            const models = await client.models.list();
            return models.data.map(m => ({ id: m.id, name: m.id }));
        }
    }
};

// GET: List all providers
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const includeModels = searchParams.get('includeModels') === 'true';
        const providerType = searchParams.get('type');

        let query = getSupabase()
            .from('ai_providers')
            .select('*')
            .order('provider_type')
            .order('priority');

        if (providerType) {
            query = query.eq('provider_type', providerType);
        }

        const { data: providers, error } = await query;

        if (error) throw error;

        // Mask API keys in response
        const maskedProviders = (providers as AIProvider[] || []).map((p: AIProvider) => ({
            ...p,
            api_key_encrypted: p.api_key_encrypted ? '•'.repeat(12) + p.api_key_encrypted.slice(-4) : null,
            has_api_key: !!p.api_key_encrypted
        }));

        let models: unknown[] = [];
        if (includeModels) {
            const { data: modelsData } = await getSupabase()
                .from('ai_models')
                .select('*')
                .order('provider_type')
                .order('name');
            models = modelsData || [];
        }

        return NextResponse.json({
            providers: maskedProviders,
            models: includeModels ? models : undefined
        });
    } catch (error) {
        console.error('Error fetching providers:', error);
        return NextResponse.json({ error: 'Failed to fetch providers' }, { status: 500 });
    }
}

// POST: Create or validate provider
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { action } = body;

        if (action === 'validate') {
            const { providerType, apiKey, baseUrl } = body;

            const config = PROVIDER_CONFIGS[providerType];
            if (!config) {
                return NextResponse.json({ error: 'Unsupported provider type' }, { status: 400 });
            }

            const result = await config.validateEndpoint(apiKey, baseUrl);
            return NextResponse.json(result);
        }

        if (action === 'create') {
            const { name, providerType, apiKey, baseUrl, priority } = body;

            if (!name || !providerType) {
                return NextResponse.json({ error: 'Name and provider type required' }, { status: 400 });
            }

            let validatedModels: string[] = [];
            if (apiKey) {
                const config = PROVIDER_CONFIGS[providerType];
                if (config) {
                    const validation = await config.validateEndpoint(apiKey, baseUrl);
                    if (!validation.valid) {
                        return NextResponse.json({
                            error: 'Invalid API key',
                            details: validation.error
                        }, { status: 400 });
                    }
                    validatedModels = validation.models || [];
                }
            }

            const slug = `${providerType}-${Date.now()}`;

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const { data: provider, error } = await (getSupabase() as any)
                .from('ai_providers')
                .insert({
                    name,
                    slug,
                    provider_type: providerType,
                    api_key_encrypted: apiKey || null,
                    base_url: baseUrl || null,
                    is_active: !!apiKey,
                    priority: priority || 0,
                    models: validatedModels
                })
                .select()
                .single();

            if (error) throw error;

            const providerData = provider as AIProvider;

            if (validatedModels.length > 0 && providerData) {
                const modelRecords = validatedModels.slice(0, 10).map(modelId => ({
                    provider_id: providerData.id,
                    name: modelId,
                    model_id: modelId,
                    display_name: modelId,
                    provider_type: providerType,
                    is_active: true
                }));

                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                await (getSupabase() as any)
                    .from('ai_models')
                    .upsert(modelRecords, { onConflict: 'provider_id,model_id' });
            }

            return NextResponse.json({ provider: providerData, models: validatedModels });
        }

        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    } catch (error) {
        console.error('Error in POST:', error);
        return NextResponse.json({ error: 'Operation failed' }, { status: 500 });
    }
}

// PUT: Update provider
export async function PUT(request: NextRequest) {
    try {
        const body = await request.json();
        const { id, apiKey, name, baseUrl, isActive, priority, syncModels } = body;

        if (!id) {
            return NextResponse.json({ error: 'Provider ID required' }, { status: 400 });
        }

        const { data: existing, error: fetchError } = await getSupabase()
            .from('ai_providers')
            .select('*')
            .eq('id', id)
            .single();

        if (fetchError || !existing) {
            return NextResponse.json({ error: 'Provider not found' }, { status: 404 });
        }

        const existingProvider = existing as AIProvider;
        const updates: Record<string, unknown> = {
            updated_at: new Date().toISOString()
        };

        if (name !== undefined) updates.name = name;
        if (baseUrl !== undefined) updates.base_url = baseUrl;
        if (isActive !== undefined) updates.is_active = isActive;
        if (priority !== undefined) updates.priority = priority;

        if (apiKey) {
            const config = PROVIDER_CONFIGS[existingProvider.provider_type];
            if (config) {
                const validation = await config.validateEndpoint(apiKey, baseUrl || existingProvider.base_url || undefined);
                if (!validation.valid) {
                    return NextResponse.json({
                        error: 'Invalid API key',
                        details: validation.error
                    }, { status: 400 });
                }
                updates.api_key_encrypted = apiKey;
                updates.is_active = true;
                updates.consecutive_failures = 0;
                updates.models = validation.models || [];

                if (syncModels && validation.models) {
                    await getSupabase()
                        .from('ai_models')
                        .delete()
                        .eq('provider_id', id);

                    const modelRecords = validation.models.slice(0, 15).map(modelId => ({
                        provider_id: id,
                        name: modelId,
                        model_id: modelId,
                        display_name: modelId,
                        provider_type: existingProvider.provider_type,
                        is_active: true
                    }));

                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    await (getSupabase() as any)
                        .from('ai_models')
                        .insert(modelRecords);
                }
            }
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: provider, error } = await (getSupabase() as any)
            .from('ai_providers')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        const providerData = provider as AIProvider;

        return NextResponse.json({
            provider: {
                ...providerData,
                api_key_encrypted: providerData.api_key_encrypted
                    ? '•'.repeat(12) + providerData.api_key_encrypted.slice(-4)
                    : null,
                has_api_key: !!providerData.api_key_encrypted
            }
        });
    } catch (error) {
        console.error('Error updating provider:', error);
        return NextResponse.json({ error: 'Update failed' }, { status: 500 });
    }
}

// DELETE: Remove provider
export async function DELETE(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: 'Provider ID required' }, { status: 400 });
        }

        await getSupabase()
            .from('ai_models')
            .delete()
            .eq('provider_id', id);

        const { error } = await getSupabase()
            .from('ai_providers')
            .delete()
            .eq('id', id);

        if (error) throw error;

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting provider:', error);
        return NextResponse.json({ error: 'Delete failed' }, { status: 500 });
    }
}
