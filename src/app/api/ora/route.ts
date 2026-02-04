/**
 * ORA Connection API
 * Secure endpoint for external agent (ORA) to interact with anwe.sh
 * 
 * Authentication: Bearer token (ORA_SECRET in env)
 * 
 * GET - Returns API schema for autodiscovery (no auth required)
 * POST - Execute actions (auth required)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Lazy-initialized Supabase client
let _supabase: SupabaseClient | null = null;

function getSupabase(): SupabaseClient {
    if (!_supabase) {
        _supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );
    }
    return _supabase;
}

// Validate ORA's authentication
function validateOraAuth(request: NextRequest): boolean {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) return false;

    const token = authHeader.substring(7);
    return token === process.env.ORA_SECRET;
}

// ============================================
// API Schema Definition (Self-Describing)
// ============================================

const API_SCHEMA = {
    name: 'anwe.sh ORA API',
    version: '1.0.0',
    description: 'External agent API for controlling anwe.sh',
    authentication: {
        type: 'bearer',
        header: 'Authorization',
        format: 'Bearer {ORA_SECRET}'
    },
    baseUrl: '/api/ora',
    actions: {
        // Posts
        'posts.list': {
            description: 'List blog posts',
            params: {
                status: { type: 'string', optional: true, enum: ['draft', 'published', 'archived'] },
                limit: { type: 'number', optional: true, default: 20 },
                offset: { type: 'number', optional: true, default: 0 }
            },
            returns: { posts: 'array', count: 'number' }
        },
        'posts.get': {
            description: 'Get a single post by ID or slug',
            params: {
                id: { type: 'string', optional: true },
                slug: { type: 'string', optional: true }
            },
            returns: { post: 'object' }
        },
        'posts.create': {
            description: 'Create a new blog post',
            params: {
                title: { type: 'string', required: true },
                content: { type: 'string', required: true },
                excerpt: { type: 'string', optional: true },
                slug: { type: 'string', optional: true },
                status: { type: 'string', optional: true, default: 'draft' },
                featured_image: { type: 'string', optional: true },
                meta_title: { type: 'string', optional: true },
                meta_description: { type: 'string', optional: true },
                tags: { type: 'array', optional: true }
            },
            returns: { post: 'object', id: 'string' }
        },
        'posts.update': {
            description: 'Update an existing post',
            params: {
                id: { type: 'string', required: true },
                title: { type: 'string', optional: true },
                content: { type: 'string', optional: true },
                excerpt: { type: 'string', optional: true },
                status: { type: 'string', optional: true },
                featured_image: { type: 'string', optional: true }
            },
            returns: { post: 'object' }
        },
        'posts.delete': {
            description: 'Delete a post',
            params: { id: { type: 'string', required: true } },
            returns: { success: 'boolean' }
        },
        'posts.publish': {
            description: 'Publish a draft post',
            params: { id: { type: 'string', required: true } },
            returns: { post: 'object' }
        },

        // Analytics
        'analytics.summary': {
            description: 'Get analytics summary for date range',
            params: {
                startDate: { type: 'string', optional: true, format: 'ISO date' },
                endDate: { type: 'string', optional: true, format: 'ISO date' },
                days: { type: 'number', optional: true, default: 30 }
            },
            returns: { totalViews: 'number', uniqueVisitors: 'number', topPages: 'array' }
        },
        'analytics.pageviews': {
            description: 'Get pageview data',
            params: {
                path: { type: 'string', optional: true },
                days: { type: 'number', optional: true, default: 30 }
            },
            returns: { views: 'array' }
        },
        'analytics.heatmaps': {
            description: 'Get heatmap data for a page',
            params: {
                pagePath: { type: 'string', required: true },
                eventType: { type: 'string', optional: true, enum: ['click', 'move', 'scroll'] }
            },
            returns: { heatmapData: 'array' }
        },

        // Leads
        'leads.list': {
            description: 'List captured leads',
            params: {
                status: { type: 'string', optional: true },
                limit: { type: 'number', optional: true, default: 50 },
                offset: { type: 'number', optional: true, default: 0 }
            },
            returns: { leads: 'array', count: 'number' }
        },
        'leads.get': {
            description: 'Get a single lead',
            params: { id: { type: 'string', required: true } },
            returns: { lead: 'object' }
        },
        'leads.update': {
            description: 'Update lead status or notes',
            params: {
                id: { type: 'string', required: true },
                status: { type: 'string', optional: true },
                notes: { type: 'string', optional: true },
                classification: { type: 'string', optional: true }
            },
            returns: { lead: 'object' }
        },
        'leads.analyze': {
            description: 'AI-analyze a lead for scoring',
            params: { id: { type: 'string', required: true } },
            returns: { score: 'number', reasons: 'array' }
        },

        // Settings
        'settings.get': {
            description: 'Get site settings',
            params: { key: { type: 'string', optional: true } },
            returns: { settings: 'object' }
        },
        'settings.update': {
            description: 'Update a setting',
            params: {
                key: { type: 'string', required: true },
                value: { type: 'any', required: true }
            },
            returns: { success: 'boolean' }
        },

        // Memory (site-specific context ORA can store)
        'memory.store': {
            description: 'Store information about this site',
            params: {
                key: { type: 'string', required: true },
                value: { type: 'any', required: true },
                category: { type: 'string', optional: true }
            },
            returns: { success: 'boolean' }
        },
        'memory.recall': {
            description: 'Recall stored information',
            params: { key: { type: 'string', required: true } },
            returns: { value: 'any', found: 'boolean' }
        },
        'memory.search': {
            description: 'Search stored memories',
            params: { query: { type: 'string', required: true } },
            returns: { results: 'array' }
        },
        'memory.clear': {
            description: 'Clear a stored memory',
            params: { key: { type: 'string', required: true } },
            returns: { success: 'boolean' }
        },

        // Files
        'files.upload': {
            description: 'Upload a file (base64)',
            params: {
                filename: { type: 'string', required: true },
                content: { type: 'string', required: true, format: 'base64' },
                folder: { type: 'string', optional: true }
            },
            returns: { url: 'string', path: 'string' }
        },
        'files.list': {
            description: 'List files in storage',
            params: { folder: { type: 'string', optional: true } },
            returns: { files: 'array' }
        },

        // System
        'system.status': {
            description: 'Get system status and health',
            params: {},
            returns: { status: 'string', uptime: 'number', version: 'string' }
        },
        'system.log': {
            description: 'Log an action (for audit trail)',
            params: {
                action: { type: 'string', required: true },
                details: { type: 'object', optional: true }
            },
            returns: { logged: 'boolean' }
        }
    }
};

// ============================================
// GET: Return API Schema (Autodiscovery)
// ============================================

export async function GET(request: NextRequest) {
    // Return schema - no auth required for discovery
    // ORA can call this to learn what actions are available
    return NextResponse.json({
        ...API_SCHEMA,
        timestamp: new Date().toISOString(),
        authenticated: validateOraAuth(request)
    });
}

// ============================================
// POST: ORA Actions
// ============================================

export async function POST(request: NextRequest) {
    if (!validateOraAuth(request)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await request.json();
        const { action, data } = body;

        switch (action) {
            // ========== POSTS ==========
            case 'posts.list':
                return await listPosts(data);
            case 'posts.get':
                return await getPost(data);
            case 'posts.create':
                return await createPost(data);
            case 'posts.update':
                return await updatePost(data);
            case 'posts.delete':
                return await deletePost(data);
            case 'posts.publish':
                return await publishPost(data);

            // ========== ANALYTICS ==========
            case 'analytics.summary':
                return await getAnalyticsSummary(data);
            case 'analytics.pageviews':
                return await getPageViews(data);
            case 'analytics.heatmaps':
                return await getHeatmaps(data);

            // ========== LEADS ==========
            case 'leads.list':
                return await listLeads(data);
            case 'leads.get':
                return await getLead(data);
            case 'leads.update':
                return await updateLead(data);
            case 'leads.analyze':
                return await analyzeLead(data);

            // ========== SETTINGS ==========
            case 'settings.get':
                return await getSettings();
            case 'settings.update':
                return await updateSettings(data);

            // ========== MEMORY (Site-specific context) ==========
            case 'memory.store':
                return await storeMemory(data);
            case 'memory.recall':
                return await recallMemory(data);
            case 'memory.search':
                return await searchMemory(data);
            case 'memory.clear':
                return await clearMemory(data);

            // ========== FILES ==========
            case 'files.upload':
                return await uploadFile(data);
            case 'files.list':
                return await listFiles(data);

            // ========== SYSTEM ==========
            case 'system.status':
                return await getSystemStatus();
            case 'system.log':
                return await logAction(data);

            default:
                return NextResponse.json({
                    error: `Unknown action: ${action}`,
                    availableActions: [
                        'posts.list', 'posts.get', 'posts.create', 'posts.update', 'posts.delete', 'posts.publish',
                        'analytics.summary', 'analytics.pageviews', 'analytics.heatmaps',
                        'leads.list', 'leads.get', 'leads.update', 'leads.analyze',
                        'settings.get', 'settings.update',
                        'memory.store', 'memory.recall', 'memory.search', 'memory.clear',
                        'files.upload', 'files.list',
                        'system.status', 'system.log'
                    ]
                }, { status: 400 });
        }
    } catch (error) {
        console.error('ORA API error:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Internal error' },
            { status: 500 }
        );
    }
}

// ============================================
// POSTS
// ============================================

async function listPosts(data: { status?: string; limit?: number; offset?: number }) {
    let query = getSupabase().from('blog_posts').select('*');

    if (data?.status) query = query.eq('status', data.status);
    query = query.order('created_at', { ascending: false });
    if (data?.limit) query = query.limit(data.limit);
    if (data?.offset) query = query.range(data.offset, data.offset + (data.limit || 20) - 1);

    const { data: posts, error } = await query;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ posts, count: posts?.length });
}

async function getPost(data: { id?: string; slug?: string }) {
    if (!data?.id && !data?.slug) {
        return NextResponse.json({ error: 'id or slug required' }, { status: 400 });
    }

    const query = data.id
        ? getSupabase().from('blog_posts').select('*').eq('id', data.id)
        : getSupabase().from('blog_posts').select('*').eq('slug', data.slug);

    const { data: post, error } = await query.single();
    if (error) return NextResponse.json({ error: error.message }, { status: 404 });
    return NextResponse.json({ post });
}

async function createPost(data: {
    title: string;
    content: string;
    slug?: string;
    excerpt?: string;
    tags?: string[];
    meta_title?: string;
    meta_description?: string;
    featured_image?: string;
    status?: string;
}) {
    const slug = data.slug || data.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

    const { data: post, error } = await getSupabase()
        .from('blog_posts')
        .insert({
            title: data.title,
            slug,
            content: data.content,
            excerpt: data.excerpt || data.content.substring(0, 200),
            tags: data.tags || [],
            meta_title: data.meta_title || data.title,
            meta_description: data.meta_description || data.excerpt,
            featured_image: data.featured_image,
            status: data.status || 'draft'
        })
        .select()
        .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ post, created: true });
}

async function updatePost(data: { id: string;[key: string]: unknown }) {
    const { id, ...updates } = data;
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

    updates.updated_at = new Date().toISOString();

    const { data: post, error } = await getSupabase()
        .from('blog_posts')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ post, updated: true });
}

async function deletePost(data: { id: string }) {
    if (!data?.id) return NextResponse.json({ error: 'id required' }, { status: 400 });

    const { error } = await getSupabase().from('blog_posts').delete().eq('id', data.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ deleted: true });
}

async function publishPost(data: { id: string }) {
    if (!data?.id) return NextResponse.json({ error: 'id required' }, { status: 400 });

    const { data: post, error } = await getSupabase()
        .from('blog_posts')
        .update({
            status: 'published',
            published_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        })
        .eq('id', data.id)
        .select()
        .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ post, published: true });
}

// ============================================
// ANALYTICS
// ============================================

async function getAnalyticsSummary(data: { days?: number }) {
    const days = data?.days || 30;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data: pageViews } = await getSupabase()
        .from('page_views')
        .select('*')
        .gte('created_at', startDate.toISOString());

    const { data: leads } = await getSupabase()
        .from('leads')
        .select('*')
        .gte('created_at', startDate.toISOString());

    // Calculate stats
    const uniqueVisitors = new Set(pageViews?.map(pv => pv.visitor_hash)).size;
    const topPages: Record<string, number> = {};
    pageViews?.forEach(pv => {
        topPages[pv.path] = (topPages[pv.path] || 0) + 1;
    });

    return NextResponse.json({
        period: `Last ${days} days`,
        totalPageViews: pageViews?.length || 0,
        uniqueVisitors,
        totalLeads: leads?.length || 0,
        hotLeads: leads?.filter(l => l.ai_classification === 'hot').length || 0,
        topPages: Object.entries(topPages)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 10)
            .map(([path, views]) => ({ path, views }))
    });
}

async function getPageViews(data: { days?: number; path?: string; limit?: number }) {
    const days = data?.days || 7;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    let query = getSupabase()
        .from('page_views')
        .select('*')
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: false });

    if (data?.path) query = query.eq('path', data.path);
    if (data?.limit) query = query.limit(data.limit);

    const { data: views, error } = await query;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ views, count: views?.length });
}

async function getHeatmaps(data: { path?: string; days?: number }) {
    const days = data?.days || 7;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    let query = getSupabase()
        .from('heatmap_events')
        .select('*')
        .gte('created_at', startDate.toISOString());

    if (data?.path) query = query.eq('page_path', data.path);

    const { data: events, error } = await query;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ events, count: events?.length });
}

// ============================================
// LEADS
// ============================================

async function listLeads(data: { status?: string; classification?: string; limit?: number }) {
    let query = getSupabase().from('leads').select('*');

    if (data?.status) query = query.eq('status', data.status);
    if (data?.classification) query = query.eq('ai_classification', data.classification);
    query = query.order('created_at', { ascending: false });
    if (data?.limit) query = query.limit(data.limit);

    const { data: leads, error } = await query;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ leads, count: leads?.length });
}

async function getLead(data: { id: string }) {
    if (!data?.id) return NextResponse.json({ error: 'id required' }, { status: 400 });

    const { data: lead, error } = await getSupabase()
        .from('leads')
        .select('*')
        .eq('id', data.id)
        .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 404 });
    return NextResponse.json({ lead });
}

async function updateLead(data: { id: string;[key: string]: unknown }) {
    const { id, ...updates } = data;
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

    const { data: lead, error } = await getSupabase()
        .from('leads')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ lead, updated: true });
}

async function analyzeLead(data: { id: string }) {
    // Get lead with behavior data
    const { data: lead } = await getSupabase()
        .from('leads')
        .select('*')
        .eq('id', data.id)
        .single();

    if (!lead) return NextResponse.json({ error: 'Lead not found' }, { status: 404 });

    // Return lead data for ORA to analyze with her own brain
    return NextResponse.json({
        lead,
        forAnalysis: {
            email: lead.email,
            name: lead.name,
            company: lead.company,
            source: lead.source,
            pagesViewed: lead.pages_viewed,
            timeOnSite: lead.time_on_site_seconds,
            submissions: lead.form_submissions,
            createdAt: lead.created_at
        }
    });
}

// ============================================
// SETTINGS
// ============================================

async function getSettings() {
    const { data, error } = await getSupabase().from('site_settings').select('key, value');
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const settings: Record<string, unknown> = {};
    data?.forEach(row => {
        try {
            settings[row.key] = JSON.parse(row.value);
        } catch {
            settings[row.key] = row.value;
        }
    });

    return NextResponse.json({ settings });
}

async function updateSettings(data: { settings: Record<string, unknown> }) {
    const updates = Object.entries(data?.settings || {});

    for (const [key, value] of updates) {
        await getSupabase()
            .from('site_settings')
            .upsert({
                key,
                value: typeof value === 'string' ? value : JSON.stringify(value),
                updated_at: new Date().toISOString()
            }, { onConflict: 'key' });
    }

    return NextResponse.json({ updated: updates.length });
}

// ============================================
// MEMORY (Site-specific context for ORA)
// ============================================

async function storeMemory(data: {
    key: string;
    value: unknown;
    type?: string;
    importance?: number;
    expires_at?: string;
}) {
    // Use the agent_memory table for ORA's site-specific context
    const { data: memory, error } = await getSupabase()
        .from('agent_memory')
        .upsert({
            agent_id: null, // ORA's external memory (no specific agent)
            memory_type: data.type || 'context',
            key: data.key,
            content: typeof data.value === 'object' ? data.value : { value: data.value },
            summary: typeof data.value === 'string' ? data.value.substring(0, 500) : JSON.stringify(data.value).substring(0, 500),
            importance: data.importance ?? 0.5,
            source: 'ora-external',
            expires_at: data.expires_at,
            last_accessed_at: new Date().toISOString()
        }, { onConflict: 'agent_id,memory_type,key' })
        .select()
        .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ memory, stored: true });
}

async function recallMemory(data: { key?: string; type?: string; limit?: number }) {
    let query = getSupabase()
        .from('agent_memory')
        .select('*')
        .is('agent_id', null) // ORA's external memory
        .eq('source', 'ora-external');

    if (data?.key) query = query.eq('key', data.key);
    if (data?.type) query = query.eq('memory_type', data.type);
    query = query.order('importance', { ascending: false });
    if (data?.limit) query = query.limit(data.limit);

    const { data: memories, error } = await query;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ memories });
}

async function searchMemory(data: { query: string; type?: string; limit?: number }) {
    let query = getSupabase()
        .from('agent_memory')
        .select('*')
        .is('agent_id', null)
        .eq('source', 'ora-external')
        .or(`summary.ilike.%${data.query}%,key.ilike.%${data.query}%`);

    if (data?.type) query = query.eq('memory_type', data.type);
    query = query.limit(data?.limit || 10);

    const { data: memories, error } = await query;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ memories });
}

async function clearMemory(data: { key?: string; type?: string; all?: boolean }) {
    let query = getSupabase()
        .from('agent_memory')
        .delete()
        .is('agent_id', null)
        .eq('source', 'ora-external');

    if (!data?.all) {
        if (data?.key) query = query.eq('key', data.key);
        if (data?.type) query = query.eq('memory_type', data.type);
    }

    const { error } = await query;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ cleared: true });
}

// ============================================
// FILES
// ============================================

async function uploadFile(data: { name: string; content: string; type: string; folder?: string }) {
    // Base64 decode if needed
    const buffer = Buffer.from(data.content, 'base64');
    const path = `${data.folder || 'ora'}/${Date.now()}-${data.name}`;

    const { error } = await getSupabase().storage
        .from('uploads')
        .upload(path, buffer, { contentType: data.type });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const { data: urlData } = getSupabase().storage.from('uploads').getPublicUrl(path);
    return NextResponse.json({ path, url: urlData.publicUrl, uploaded: true });
}

async function listFiles(data: { folder?: string }) {
    const { data: files, error } = await getSupabase().storage
        .from('uploads')
        .list(data?.folder || 'ora');

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ files });
}

// ============================================
// SYSTEM
// ============================================

async function getSystemStatus() {
    // Get counts
    const { count: postsCount } = await getSupabase().from('blog_posts').select('*', { count: 'exact', head: true });
    const { count: leadsCount } = await getSupabase().from('leads').select('*', { count: 'exact', head: true });
    const { count: viewsCount } = await getSupabase().from('page_views').select('*', { count: 'exact', head: true });

    return NextResponse.json({
        status: 'online',
        timestamp: new Date().toISOString(),
        stats: {
            totalPosts: postsCount,
            totalLeads: leadsCount,
            totalPageViews: viewsCount
        },
        version: '1.0.0'
    });
}

async function logAction(data: { action: string; details?: unknown }) {
    // Log ORA's action for audit
    await getSupabase().from('agent_runs').insert({
        agent_id: null,
        action: `ora:${data.action}`,
        input: data.details || {},
        status: 'success',
        triggered_by: 'agent',
        started_at: new Date().toISOString(),
        completed_at: new Date().toISOString()
    });

    return NextResponse.json({ logged: true });
}

