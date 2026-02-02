/**
 * AI Service Layer
 * Multi-provider support with automatic failover
 * Matches Vanilla SaaS pattern - multiple entries per provider type = multiple API keys
 */

import { supabase } from './supabase';
import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { GoogleGenerativeAI } from '@google/generative-ai';

// ============================================
// TYPES
// ============================================

export type ProviderType = 'openai' | 'anthropic' | 'google' | 'groq' | 'mistral' | 'cohere' | 'custom';

export interface AIProvider {
    id: string;
    name: string;
    slug: string;
    provider_type: ProviderType;
    api_key_encrypted: string | null;
    base_url: string | null;
    models: string[];
    is_active: boolean;
    is_default: boolean;
    priority: number;
    rate_limit_per_minute: number | null;
    rate_limit_per_day: number | null;
    total_requests: number;
    total_tokens_used: number;
    total_cost_usd: number;
    last_used_at: string | null;
    last_error_at: string | null;
    consecutive_failures: number;
    settings: Record<string, unknown>;
    metadata: Record<string, unknown>;
    created_at: string;
    updated_at: string;
}

export interface AIModel {
    id: string;
    provider_id: string;
    name: string;
    model_id: string;
    display_name: string | null;
    description: string | null;
    provider_type: ProviderType;
    context_window: number;
    max_output_tokens: number;
    input_cost_per_1k: number;
    output_cost_per_1k: number;
    capabilities: string[];
    is_active: boolean;
    is_default: boolean;
    created_at: string;
    updated_at: string;
}

export interface AIExecution {
    id: string;
    provider_id: string | null;
    model_id: string | null;
    model_name: string | null;
    agent_id: string | null;
    agent_run_id: string | null;
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
    cost_usd: number;
    status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
    input_data: unknown;
    output_data: unknown;
    system_prompt: string | null;
    error_message: string | null;
    execution_time_ms: number | null;
    source: string;
    metadata: Record<string, unknown>;
    created_at: string;
    completed_at: string | null;
}

export interface ExecuteAIOptions {
    providerType?: ProviderType;
    providerId?: string;
    modelId?: string;
    messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>;
    temperature?: number;
    maxTokens?: number;
    jsonMode?: boolean;
    agentId?: string;
    agentRunId?: string;
    source?: string;
    metadata?: Record<string, unknown>;
}

export interface ExecuteAIResult {
    success: boolean;
    content: string | null;
    error: string | null;
    usage: {
        promptTokens: number;
        completionTokens: number;
        totalTokens: number;
        cost: number;
    };
    executionId: string;
    executionTimeMs: number;
}

// ============================================
// CLIENT CACHE
// ============================================

const clientCache: Map<string, { client: unknown; type: ProviderType }> = new Map();

function getOrCreateClient(provider: AIProvider): unknown {
    const cacheKey = provider.id;

    if (clientCache.has(cacheKey)) {
        return clientCache.get(cacheKey)!.client;
    }

    let client: unknown;

    switch (provider.provider_type) {
        case 'openai':
            client = new OpenAI({
                apiKey: provider.api_key_encrypted!,
                baseURL: provider.base_url || undefined,
            });
            break;

        case 'anthropic':
            client = new Anthropic({
                apiKey: provider.api_key_encrypted!,
            });
            break;

        case 'google':
            client = new GoogleGenerativeAI(provider.api_key_encrypted!);
            break;

        case 'groq':
            // Groq uses OpenAI-compatible API
            client = new OpenAI({
                apiKey: provider.api_key_encrypted!,
                baseURL: provider.base_url || 'https://api.groq.com/openai/v1',
            });
            break;

        case 'mistral':
            // Mistral uses OpenAI-compatible API
            client = new OpenAI({
                apiKey: provider.api_key_encrypted!,
                baseURL: provider.base_url || 'https://api.mistral.ai/v1',
            });
            break;

        default:
            throw new Error(`Unsupported provider type: ${provider.provider_type}`);
    }

    clientCache.set(cacheKey, { client, type: provider.provider_type });
    return client;
}

// Clear a provider from cache (e.g., when API key changes)
export function clearProviderCache(providerId: string): void {
    clientCache.delete(providerId);
}

// ============================================
// PROVIDER MANAGEMENT
// ============================================

export async function getProviders(activeOnly = false): Promise<AIProvider[]> {
    let query = supabase
        .from('ai_providers')
        .select('*')
        .order('provider_type')
        .order('priority');

    if (activeOnly) {
        query = query.eq('is_active', true);
    }

    const { data, error } = await query;

    if (error) {
        console.error('Error fetching providers:', error);
        return [];
    }

    return data as AIProvider[];
}

export async function getProvidersByType(providerType: ProviderType): Promise<AIProvider[]> {
    const { data, error } = await supabase
        .from('ai_providers')
        .select('*')
        .eq('provider_type', providerType)
        .eq('is_active', true)
        .not('api_key_encrypted', 'is', null)
        .order('priority');

    if (error) {
        console.error('Error fetching providers by type:', error);
        return [];
    }

    return data as AIProvider[];
}

export async function getBestProvider(providerType: ProviderType): Promise<AIProvider | null> {
    // Get all active providers of this type, ordered by priority and health
    const { data, error } = await supabase
        .from('ai_providers')
        .select('*')
        .eq('provider_type', providerType)
        .eq('is_active', true)
        .not('api_key_encrypted', 'is', null)
        .lt('consecutive_failures', 5) // Skip providers with too many failures
        .order('priority')
        .order('last_error_at', { ascending: true, nullsFirst: true })
        .limit(1);

    if (error || !data || data.length === 0) {
        return null;
    }

    return data[0] as AIProvider;
}

export async function addProvider(data: {
    name: string;
    providerType: ProviderType;
    apiKey: string;
    baseUrl?: string;
    priority?: number;
    rateLimitPerMinute?: number;
    rateLimitPerDay?: number;
}): Promise<AIProvider | null> {
    const slug = `${data.providerType}-${Date.now()}`;

    const { data: provider, error } = await supabase
        .from('ai_providers')
        .insert([{
            name: data.name,
            slug,
            provider_type: data.providerType,
            api_key_encrypted: data.apiKey, // Note: Should be encrypted in production
            base_url: data.baseUrl,
            is_active: true,
            priority: data.priority ?? 0,
            rate_limit_per_minute: data.rateLimitPerMinute,
            rate_limit_per_day: data.rateLimitPerDay
        }])
        .select()
        .single();

    if (error) {
        console.error('Error adding provider:', error);
        return null;
    }

    return provider as AIProvider;
}

export async function updateProviderApiKey(providerId: string, apiKey: string): Promise<boolean> {
    const { error } = await supabase
        .from('ai_providers')
        .update({
            api_key_encrypted: apiKey,
            is_active: true,
            consecutive_failures: 0
        })
        .eq('id', providerId);

    if (error) {
        console.error('Error updating API key:', error);
        return false;
    }

    // Clear cache for this provider
    clearProviderCache(providerId);
    return true;
}

export async function toggleProvider(providerId: string, isActive: boolean): Promise<boolean> {
    const { error } = await supabase
        .from('ai_providers')
        .update({ is_active: isActive })
        .eq('id', providerId);

    if (error) {
        console.error('Error toggling provider:', error);
        return false;
    }

    return true;
}

export async function deleteProvider(providerId: string): Promise<boolean> {
    const { error } = await supabase
        .from('ai_providers')
        .delete()
        .eq('id', providerId);

    if (error) {
        console.error('Error deleting provider:', error);
        return false;
    }

    clearProviderCache(providerId);
    return true;
}

// ============================================
// MODEL MANAGEMENT
// ============================================

export async function getModels(providerId?: string): Promise<AIModel[]> {
    let query = supabase
        .from('ai_models')
        .select('*')
        .order('provider_type')
        .order('name');

    if (providerId) {
        query = query.eq('provider_id', providerId);
    }

    const { data, error } = await query;

    if (error) {
        console.error('Error fetching models:', error);
        return [];
    }

    return data as AIModel[];
}

export async function getActiveModels(): Promise<AIModel[]> {
    const { data, error } = await supabase
        .from('ai_models')
        .select(`
            *,
            ai_providers!inner(is_active, api_key_encrypted)
        `)
        .eq('is_active', true)
        .eq('ai_providers.is_active', true)
        .not('ai_providers.api_key_encrypted', 'is', null);

    if (error) {
        console.error('Error fetching active models:', error);
        return [];
    }

    return data as AIModel[];
}

// ============================================
// AI EXECUTION
// ============================================

async function executeOpenAI(
    client: OpenAI,
    model: string,
    messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>,
    options: { temperature?: number; maxTokens?: number; jsonMode?: boolean }
): Promise<{ content: string; usage: { prompt: number; completion: number } }> {
    const response = await client.chat.completions.create({
        model,
        messages: messages as OpenAI.Chat.ChatCompletionMessageParam[],
        temperature: options.temperature ?? 0.7,
        max_tokens: options.maxTokens,
        response_format: options.jsonMode ? { type: 'json_object' } : undefined,
    });

    return {
        content: response.choices[0]?.message?.content || '',
        usage: {
            prompt: response.usage?.prompt_tokens || 0,
            completion: response.usage?.completion_tokens || 0,
        },
    };
}

async function executeAnthropic(
    client: Anthropic,
    model: string,
    messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>,
    options: { temperature?: number; maxTokens?: number }
): Promise<{ content: string; usage: { prompt: number; completion: number } }> {
    // Extract system message
    const systemMessage = messages.find(m => m.role === 'system')?.content;
    const chatMessages = messages.filter(m => m.role !== 'system');

    const response = await client.messages.create({
        model,
        max_tokens: options.maxTokens || 4096,
        system: systemMessage,
        messages: chatMessages.map(m => ({
            role: m.role as 'user' | 'assistant',
            content: m.content,
        })),
        temperature: options.temperature ?? 0.7,
    });

    const textContent = response.content.find(c => c.type === 'text');

    return {
        content: textContent?.type === 'text' ? textContent.text : '',
        usage: {
            prompt: response.usage.input_tokens,
            completion: response.usage.output_tokens,
        },
    };
}

async function executeGoogle(
    client: GoogleGenerativeAI,
    model: string,
    messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>,
    options: { temperature?: number; maxTokens?: number }
): Promise<{ content: string; usage: { prompt: number; completion: number } }> {
    const genModel = client.getGenerativeModel({ model });

    // Convert messages to Gemini format
    const history = messages
        .filter(m => m.role !== 'system')
        .map(m => ({
            role: m.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: m.content }],
        }));

    const systemInstruction = messages.find(m => m.role === 'system')?.content;
    const lastUserMessage = history.pop();

    const chat = genModel.startChat({
        history: history as Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }>,
        generationConfig: {
            temperature: options.temperature ?? 0.7,
            maxOutputTokens: options.maxTokens,
        },
        systemInstruction: systemInstruction || undefined,
    });

    const result = await chat.sendMessage(lastUserMessage?.parts[0]?.text || '');
    const response = result.response;

    return {
        content: response.text(),
        usage: {
            prompt: response.usageMetadata?.promptTokenCount || 0,
            completion: response.usageMetadata?.candidatesTokenCount || 0,
        },
    };
}

export async function executeAI(options: ExecuteAIOptions): Promise<ExecuteAIResult> {
    const startTime = Date.now();

    // Create execution record
    const { data: execution, error: createError } = await supabase
        .from('ai_executions')
        .insert([{
            status: 'pending',
            input_data: { messages: options.messages },
            agent_id: options.agentId,
            agent_run_id: options.agentRunId,
            source: options.source || 'manual',
            metadata: options.metadata || {},
        }])
        .select()
        .single();

    if (createError || !execution) {
        return {
            success: false,
            content: null,
            error: 'Failed to create execution record',
            usage: { promptTokens: 0, completionTokens: 0, totalTokens: 0, cost: 0 },
            executionId: '',
            executionTimeMs: 0,
        };
    }

    const executionId = execution.id;

    try {
        // Get provider
        let provider: AIProvider | null = null;

        if (options.providerId) {
            const { data } = await supabase
                .from('ai_providers')
                .select('*')
                .eq('id', options.providerId)
                .single();
            provider = data as AIProvider;
        } else if (options.providerType) {
            provider = await getBestProvider(options.providerType);
        } else {
            // Default fallback order
            for (const type of ['openai', 'anthropic', 'google', 'groq'] as ProviderType[]) {
                provider = await getBestProvider(type);
                if (provider) break;
            }
        }

        if (!provider || !provider.api_key_encrypted) {
            throw new Error('No active provider available');
        }

        // Get model
        let modelId = options.modelId;
        let model: AIModel | null = null;

        if (modelId) {
            const { data } = await supabase
                .from('ai_models')
                .select('*')
                .eq('id', modelId)
                .single();
            model = data as AIModel;
        } else {
            // Get default model for this provider
            const { data } = await supabase
                .from('ai_models')
                .select('*')
                .eq('provider_id', provider.id)
                .eq('is_active', true)
                .order('is_default', { ascending: false })
                .limit(1)
                .single();
            model = data as AIModel;
        }

        if (!model) {
            throw new Error(`No model available for provider ${provider.name}`);
        }

        // Update execution with provider/model info
        await supabase
            .from('ai_executions')
            .update({
                status: 'running',
                provider_id: provider.id,
                model_id: model.id,
                model_name: model.model_id,
            })
            .eq('id', executionId);

        // Get or create client
        const client = getOrCreateClient(provider);

        // Execute based on provider type
        let result: { content: string; usage: { prompt: number; completion: number } };

        switch (provider.provider_type) {
            case 'openai':
            case 'groq':
            case 'mistral':
                result = await executeOpenAI(
                    client as OpenAI,
                    model.model_id,
                    options.messages,
                    {
                        temperature: options.temperature,
                        maxTokens: options.maxTokens,
                        jsonMode: options.jsonMode,
                    }
                );
                break;

            case 'anthropic':
                result = await executeAnthropic(
                    client as Anthropic,
                    model.model_id,
                    options.messages,
                    {
                        temperature: options.temperature,
                        maxTokens: options.maxTokens,
                    }
                );
                break;

            case 'google':
                result = await executeGoogle(
                    client as GoogleGenerativeAI,
                    model.model_id,
                    options.messages,
                    {
                        temperature: options.temperature,
                        maxTokens: options.maxTokens,
                    }
                );
                break;

            default:
                throw new Error(`Unsupported provider type: ${provider.provider_type}`);
        }

        const executionTimeMs = Date.now() - startTime;
        const totalTokens = result.usage.prompt + result.usage.completion;
        const cost = (
            (result.usage.prompt / 1000) * model.input_cost_per_1k +
            (result.usage.completion / 1000) * model.output_cost_per_1k
        );

        // Update execution - success
        await supabase
            .from('ai_executions')
            .update({
                status: 'completed',
                output_data: { content: result.content },
                prompt_tokens: result.usage.prompt,
                completion_tokens: result.usage.completion,
                total_tokens: totalTokens,
                cost_usd: cost,
                execution_time_ms: executionTimeMs,
                completed_at: new Date().toISOString(),
            })
            .eq('id', executionId);

        // Update provider usage stats
        await supabase.rpc('record_provider_usage', {
            p_provider_id: provider.id,
            p_tokens: totalTokens,
            p_cost: cost,
            p_success: true,
        });

        return {
            success: true,
            content: result.content,
            error: null,
            usage: {
                promptTokens: result.usage.prompt,
                completionTokens: result.usage.completion,
                totalTokens,
                cost,
            },
            executionId,
            executionTimeMs,
        };

    } catch (error) {
        const executionTimeMs = Date.now() - startTime;
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';

        // Update execution - failure
        await supabase
            .from('ai_executions')
            .update({
                status: 'failed',
                error_message: errorMessage,
                execution_time_ms: executionTimeMs,
                completed_at: new Date().toISOString(),
            })
            .eq('id', executionId);

        // Record provider failure if we had a provider
        if (options.providerId) {
            await supabase.rpc('record_provider_usage', {
                p_provider_id: options.providerId,
                p_tokens: 0,
                p_cost: 0,
                p_success: false,
            });
        }

        return {
            success: false,
            content: null,
            error: errorMessage,
            usage: { promptTokens: 0, completionTokens: 0, totalTokens: 0, cost: 0 },
            executionId,
            executionTimeMs,
        };
    }
}

// ============================================
// EXECUTION STATS
// ============================================

export async function getExecutionStats(days = 30): Promise<{
    totalExecutions: number;
    totalTokens: number;
    totalCost: number;
    executionsToday: number;
    avgExecutionTime: number;
    successRate: number;
    byProvider: Record<string, { executions: number; tokens: number; cost: number }>;
}> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const { data: executions, error } = await supabase
        .from('ai_executions')
        .select('*, ai_providers(name)')
        .gte('created_at', startDate.toISOString());

    if (error || !executions) {
        return {
            totalExecutions: 0,
            totalTokens: 0,
            totalCost: 0,
            executionsToday: 0,
            avgExecutionTime: 0,
            successRate: 0,
            byProvider: {},
        };
    }

    const successful = executions.filter(e => e.status === 'completed');
    const todayExecutions = executions.filter(e => new Date(e.created_at) >= todayStart);

    const byProvider: Record<string, { executions: number; tokens: number; cost: number }> = {};
    executions.forEach(e => {
        const providerName = (e.ai_providers as { name: string } | null)?.name || 'Unknown';
        if (!byProvider[providerName]) {
            byProvider[providerName] = { executions: 0, tokens: 0, cost: 0 };
        }
        byProvider[providerName].executions++;
        byProvider[providerName].tokens += e.total_tokens || 0;
        byProvider[providerName].cost += parseFloat(e.cost_usd) || 0;
    });

    return {
        totalExecutions: executions.length,
        totalTokens: executions.reduce((sum, e) => sum + (e.total_tokens || 0), 0),
        totalCost: executions.reduce((sum, e) => sum + (parseFloat(e.cost_usd) || 0), 0),
        executionsToday: todayExecutions.length,
        avgExecutionTime: successful.length > 0
            ? successful.reduce((sum, e) => sum + (e.execution_time_ms || 0), 0) / successful.length
            : 0,
        successRate: executions.length > 0 ? (successful.length / executions.length) * 100 : 0,
        byProvider,
    };
}

export async function getRecentExecutions(limit = 20): Promise<AIExecution[]> {
    const { data, error } = await supabase
        .from('ai_executions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

    if (error) {
        console.error('Error fetching recent executions:', error);
        return [];
    }

    return data as AIExecution[];
}
