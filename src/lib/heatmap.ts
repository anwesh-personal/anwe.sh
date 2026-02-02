/**
 * Heatmap & Session Tracking Service
 * Analytics for user behavior tracking
 */

import { supabase } from './supabase';

// Types
export interface HeatmapEvent {
    id: string;
    session_id: string;
    page_path: string;
    event_type: 'click' | 'move' | 'scroll' | 'hover' | 'rage_click';
    x: number | null;
    y: number | null;
    viewport_width: number | null;
    viewport_height: number | null;
    page_height: number | null;
    scroll_depth: number | null;
    element_tag: string | null;
    element_id: string | null;
    element_class: string | null;
    element_text: string | null;
    device_type: 'desktop' | 'tablet' | 'mobile';
    browser: string | null;
    os: string | null;
    metadata: Record<string, unknown>;
    created_at: string;
}

export interface Session {
    id: string;
    session_id: string;
    visitor_id: string | null;
    ip_hash: string | null;
    device_type: 'desktop' | 'tablet' | 'mobile';
    browser: string | null;
    browser_version: string | null;
    os: string | null;
    os_version: string | null;
    screen_width: number | null;
    screen_height: number | null;
    entry_page: string | null;
    exit_page: string | null;
    page_count: number;
    event_count: number;
    duration_seconds: number;
    max_scroll_depth: number;
    click_count: number;
    rage_click_count: number;
    referrer: string | null;
    utm_source: string | null;
    utm_medium: string | null;
    utm_campaign: string | null;
    utm_term: string | null;
    utm_content: string | null;
    country: string | null;
    region: string | null;
    city: string | null;
    converted: boolean;
    conversion_type: string | null;
    conversion_value: number | null;
    metadata: Record<string, unknown>;
    started_at: string;
    ended_at: string | null;
    last_activity_at: string;
}

export interface Lead {
    id: string;
    session_id: string | null;
    email: string | null;
    name: string | null;
    company: string | null;
    phone: string | null;
    source: string;
    source_page: string | null;
    referrer: string | null;
    ai_score: number | null;
    ai_score_reasons: string[];
    ai_classification: 'hot' | 'warm' | 'cold' | 'spam' | null;
    ai_summary: string | null;
    pages_viewed: number;
    time_on_site_seconds: number;
    blog_posts_read: number;
    scroll_depth_avg: number;
    status: 'new' | 'contacted' | 'qualified' | 'converted' | 'lost' | 'spam';
    notes: string | null;
    utm_source: string | null;
    utm_medium: string | null;
    utm_campaign: string | null;
    metadata: Record<string, unknown>;
    created_at: string;
    updated_at: string;
    contacted_at: string | null;
    converted_at: string | null;
}

export interface HeatmapAggregate {
    page_path: string;
    event_type: string;
    grid_data: { x: number; y: number; count: number }[];
    total_events: number;
    unique_sessions: number;
}

// ============================================
// SESSION MANAGEMENT
// ============================================

export async function createSession(data: {
    sessionId: string;
    visitorId?: string;
    deviceType: 'desktop' | 'tablet' | 'mobile';
    browser?: string;
    browserVersion?: string;
    os?: string;
    osVersion?: string;
    screenWidth?: number;
    screenHeight?: number;
    entryPage: string;
    referrer?: string;
    utmSource?: string;
    utmMedium?: string;
    utmCampaign?: string;
    utmTerm?: string;
    utmContent?: string;
}): Promise<Session | null> {
    const { data: session, error } = await supabase
        .from('sessions')
        .insert([{
            session_id: data.sessionId,
            visitor_id: data.visitorId,
            device_type: data.deviceType,
            browser: data.browser,
            browser_version: data.browserVersion,
            os: data.os,
            os_version: data.osVersion,
            screen_width: data.screenWidth,
            screen_height: data.screenHeight,
            entry_page: data.entryPage,
            referrer: data.referrer,
            utm_source: data.utmSource,
            utm_medium: data.utmMedium,
            utm_campaign: data.utmCampaign,
            utm_term: data.utmTerm,
            utm_content: data.utmContent
        }])
        .select()
        .single();

    if (error) {
        console.error('Error creating session:', error);
        return null;
    }

    return session as Session;
}

export async function updateSessionPage(sessionId: string, pagePath: string): Promise<void> {
    await supabase
        .from('sessions')
        .update({
            exit_page: pagePath,
            page_count: supabase.rpc('increment_page_count'),
            last_activity_at: new Date().toISOString()
        })
        .eq('session_id', sessionId);
}

export async function endSession(sessionId: string): Promise<void> {
    await supabase.rpc('finalize_session', { p_session_id: sessionId });
}

export async function getSessions(options: {
    limit?: number;
    offset?: number;
    startDate?: Date;
    endDate?: Date;
    deviceType?: string;
    converted?: boolean;
}): Promise<Session[]> {
    const { limit = 50, offset = 0, startDate, endDate, deviceType, converted } = options;

    let query = supabase
        .from('sessions')
        .select('*')
        .order('started_at', { ascending: false })
        .range(offset, offset + limit - 1);

    if (startDate) {
        query = query.gte('started_at', startDate.toISOString());
    }
    if (endDate) {
        query = query.lte('started_at', endDate.toISOString());
    }
    if (deviceType) {
        query = query.eq('device_type', deviceType);
    }
    if (converted !== undefined) {
        query = query.eq('converted', converted);
    }

    const { data, error } = await query;

    if (error) {
        console.error('Error fetching sessions:', error);
        return [];
    }

    return data as Session[];
}

export async function getSessionStats(days: number = 30): Promise<{
    totalSessions: number;
    uniqueVisitors: number;
    avgDuration: number;
    avgPageViews: number;
    bounceRate: number;
    conversionRate: number;
    deviceBreakdown: Record<string, number>;
}> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data: sessions, error } = await supabase
        .from('sessions')
        .select('*')
        .gte('started_at', startDate.toISOString());

    if (error || !sessions) {
        return {
            totalSessions: 0,
            uniqueVisitors: 0,
            avgDuration: 0,
            avgPageViews: 0,
            bounceRate: 0,
            conversionRate: 0,
            deviceBreakdown: {}
        };
    }

    const uniqueVisitors = new Set(sessions.map(s => s.visitor_id)).size;
    const bounces = sessions.filter(s => s.page_count <= 1).length;
    const conversions = sessions.filter(s => s.converted).length;

    const deviceBreakdown: Record<string, number> = {};
    sessions.forEach(s => {
        deviceBreakdown[s.device_type] = (deviceBreakdown[s.device_type] || 0) + 1;
    });

    return {
        totalSessions: sessions.length,
        uniqueVisitors,
        avgDuration: sessions.reduce((sum, s) => sum + (s.duration_seconds || 0), 0) / sessions.length || 0,
        avgPageViews: sessions.reduce((sum, s) => sum + s.page_count, 0) / sessions.length || 0,
        bounceRate: (bounces / sessions.length) * 100 || 0,
        conversionRate: (conversions / sessions.length) * 100 || 0,
        deviceBreakdown
    };
}

// ============================================
// HEATMAP EVENTS
// ============================================

export async function trackEvent(event: {
    sessionId: string;
    pagePath: string;
    eventType: 'click' | 'move' | 'scroll' | 'hover' | 'rage_click';
    x?: number;
    y?: number;
    viewportWidth?: number;
    viewportHeight?: number;
    pageHeight?: number;
    scrollDepth?: number;
    elementTag?: string;
    elementId?: string;
    elementClass?: string;
    elementText?: string;
    deviceType: 'desktop' | 'tablet' | 'mobile';
    browser?: string;
    os?: string;
}): Promise<void> {
    await supabase.from('heatmap_events').insert([{
        session_id: event.sessionId,
        page_path: event.pagePath,
        event_type: event.eventType,
        x: event.x,
        y: event.y,
        viewport_width: event.viewportWidth,
        viewport_height: event.viewportHeight,
        page_height: event.pageHeight,
        scroll_depth: event.scrollDepth,
        element_tag: event.elementTag,
        element_id: event.elementId,
        element_class: event.elementClass,
        element_text: event.elementText?.slice(0, 100),
        device_type: event.deviceType,
        browser: event.browser,
        os: event.os
    }]);
}

export async function getHeatmapData(
    pagePath: string,
    eventType: 'click' | 'move' | 'scroll' = 'click',
    options: {
        startDate?: Date;
        endDate?: Date;
        deviceType?: 'desktop' | 'tablet' | 'mobile';
    } = {}
): Promise<{ x: number; y: number; count: number }[]> {
    const { startDate, endDate, deviceType } = options;

    let query = supabase
        .from('heatmap_events')
        .select('x, y')
        .eq('page_path', pagePath)
        .eq('event_type', eventType)
        .not('x', 'is', null)
        .not('y', 'is', null);

    if (startDate) {
        query = query.gte('created_at', startDate.toISOString());
    }
    if (endDate) {
        query = query.lte('created_at', endDate.toISOString());
    }
    if (deviceType) {
        query = query.eq('device_type', deviceType);
    }

    const { data, error } = await query.limit(10000);

    if (error || !data) {
        console.error('Error fetching heatmap data:', error);
        return [];
    }

    // Aggregate into grid (normalize to 0-100 coordinates)
    const grid: Record<string, number> = {};
    data.forEach(point => {
        const normX = Math.round((point.x / 1920) * 100); // Normalize to 100-unit grid
        const normY = Math.round((point.y / 1080) * 100);
        const key = `${normX},${normY}`;
        grid[key] = (grid[key] || 0) + 1;
    });

    return Object.entries(grid).map(([key, count]) => {
        const [x, y] = key.split(',').map(Number);
        return { x, y, count };
    });
}

export async function getScrollDepthData(
    pagePath: string,
    options: { startDate?: Date; endDate?: Date } = {}
): Promise<{ depth: number; sessions: number }[]> {
    const { startDate, endDate } = options;

    let query = supabase
        .from('heatmap_events')
        .select('scroll_depth, session_id')
        .eq('page_path', pagePath)
        .eq('event_type', 'scroll')
        .not('scroll_depth', 'is', null);

    if (startDate) {
        query = query.gte('created_at', startDate.toISOString());
    }
    if (endDate) {
        query = query.lte('created_at', endDate.toISOString());
    }

    const { data, error } = await query.limit(10000);

    if (error || !data) {
        return [];
    }

    // Get max scroll depth per session
    const sessionMaxDepth: Record<string, number> = {};
    data.forEach(row => {
        if (!sessionMaxDepth[row.session_id] || row.scroll_depth > sessionMaxDepth[row.session_id]) {
            sessionMaxDepth[row.session_id] = row.scroll_depth;
        }
    });

    // Bucket into 10% increments
    const buckets: Record<number, number> = {};
    Object.values(sessionMaxDepth).forEach(depth => {
        const bucket = Math.floor(depth / 10) * 10;
        buckets[bucket] = (buckets[bucket] || 0) + 1;
    });

    return Object.entries(buckets)
        .map(([depth, sessions]) => ({ depth: Number(depth), sessions }))
        .sort((a, b) => a.depth - b.depth);
}

// ============================================
// LEADS
// ============================================

export async function createLead(data: {
    sessionId?: string;
    email?: string;
    name?: string;
    company?: string;
    phone?: string;
    source?: string;
    sourcePage?: string;
    referrer?: string;
    utmSource?: string;
    utmMedium?: string;
    utmCampaign?: string;
    metadata?: Record<string, unknown>;
}): Promise<Lead | null> {
    const { data: lead, error } = await supabase
        .from('leads')
        .insert([{
            session_id: data.sessionId,
            email: data.email,
            name: data.name,
            company: data.company,
            phone: data.phone,
            source: data.source || 'website',
            source_page: data.sourcePage,
            referrer: data.referrer,
            utm_source: data.utmSource,
            utm_medium: data.utmMedium,
            utm_campaign: data.utmCampaign,
            metadata: data.metadata || {}
        }])
        .select()
        .single();

    if (error) {
        console.error('Error creating lead:', error);
        return null;
    }

    return lead as Lead;
}

export async function getLeads(options: {
    limit?: number;
    offset?: number;
    status?: string;
    classification?: string;
    minScore?: number;
}): Promise<Lead[]> {
    const { limit = 50, offset = 0, status, classification, minScore } = options;

    let query = supabase
        .from('leads')
        .select('*')
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

    if (status) {
        query = query.eq('status', status);
    }
    if (classification) {
        query = query.eq('ai_classification', classification);
    }
    if (minScore !== undefined) {
        query = query.gte('ai_score', minScore);
    }

    const { data, error } = await query;

    if (error) {
        console.error('Error fetching leads:', error);
        return [];
    }

    return data as Lead[];
}

export async function updateLead(
    leadId: string,
    updates: Partial<Lead>
): Promise<Lead | null> {
    const { data, error } = await supabase
        .from('leads')
        .update(updates)
        .eq('id', leadId)
        .select()
        .single();

    if (error) {
        console.error('Error updating lead:', error);
        return null;
    }

    return data as Lead;
}

export async function getLeadStats(): Promise<{
    total: number;
    new: number;
    hot: number;
    warm: number;
    cold: number;
    converted: number;
    avgScore: number;
}> {
    const { data: leads, error } = await supabase
        .from('leads')
        .select('status, ai_classification, ai_score');

    if (error || !leads) {
        return { total: 0, new: 0, hot: 0, warm: 0, cold: 0, converted: 0, avgScore: 0 };
    }

    const scores = leads.filter(l => l.ai_score !== null).map(l => l.ai_score);

    return {
        total: leads.length,
        new: leads.filter(l => l.status === 'new').length,
        hot: leads.filter(l => l.ai_classification === 'hot').length,
        warm: leads.filter(l => l.ai_classification === 'warm').length,
        cold: leads.filter(l => l.ai_classification === 'cold').length,
        converted: leads.filter(l => l.status === 'converted').length,
        avgScore: scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0
    };
}
