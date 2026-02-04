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

/**
 * Get session statistics from API
 */
export async function getSessionStats(days: number = 30): Promise<{
    totalSessions: number;
    uniqueVisitors: number;
    avgDuration: number;
    avgPageViews: number;
    bounceRate: number;
    conversionRate: number;
    deviceBreakdown: Record<string, number>;
}> {
    try {
        const response = await fetch(`/api/heatmaps?action=stats&days=${days}`);

        if (!response.ok) {
            throw new Error('Failed to fetch session stats');
        }

        return await response.json();
    } catch (error) {
        console.error('Error fetching session stats:', error);
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

/**
 * Get heatmap click/move data from API
 */
export async function getHeatmapData(
    pagePath: string,
    eventType: 'click' | 'move' | 'scroll' = 'click',
    options: {
        startDate?: Date;
        endDate?: Date;
        deviceType?: 'desktop' | 'tablet' | 'mobile';
    } = {}
): Promise<{ x: number; y: number; count: number }[]> {
    try {
        const params = new URLSearchParams({
            action: 'data',
            pagePath,
            eventType
        });

        if (options.startDate) {
            params.set('startDate', options.startDate.toISOString());
        }
        if (options.endDate) {
            params.set('endDate', options.endDate.toISOString());
        }
        if (options.deviceType) {
            params.set('deviceType', options.deviceType);
        }

        const response = await fetch(`/api/heatmaps?${params}`);

        if (!response.ok) {
            throw new Error('Failed to fetch heatmap data');
        }

        const json = await response.json();
        return json.heatmapData || [];
    } catch (error) {
        console.error('Error fetching heatmap data:', error);
        return [];
    }
}

/**
 * Get scroll depth data from API
 */
export async function getScrollDepthData(
    pagePath: string,
    options: { startDate?: Date; endDate?: Date } = {}
): Promise<{ depth: number; sessions: number }[]> {
    try {
        const params = new URLSearchParams({
            action: 'scroll',
            pagePath
        });

        if (options.startDate) {
            params.set('startDate', options.startDate.toISOString());
        }
        if (options.endDate) {
            params.set('endDate', options.endDate.toISOString());
        }

        const response = await fetch(`/api/heatmaps?${params}`);

        if (!response.ok) {
            throw new Error('Failed to fetch scroll depth data');
        }

        const json = await response.json();
        return json.scrollData || [];
    } catch (error) {
        console.error('Error fetching scroll depth data:', error);
        return [];
    }
}

// ============================================
// LEADS
// ============================================

/**
 * Create a new lead via API
 */
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
    try {
        const response = await fetch('/api/leads', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            throw new Error('Failed to create lead');
        }

        const json = await response.json();
        return json.lead as Lead;
    } catch (error) {
        console.error('Error creating lead:', error);
        return null;
    }
}

/**
 * Get leads from API with filtering
 */
export async function getLeads(options: {
    limit?: number;
    offset?: number;
    status?: string;
    classification?: string;
    minScore?: number;
}): Promise<Lead[]> {
    try {
        const { limit = 50, offset = 0, status, classification } = options;

        const params = new URLSearchParams({
            limit: limit.toString(),
            offset: offset.toString()
        });

        if (status) params.set('status', status);
        if (classification) params.set('classification', classification);

        const response = await fetch(`/api/leads?${params}`);

        if (!response.ok) {
            throw new Error('Failed to fetch leads');
        }

        const json = await response.json();
        return json.leads as Lead[];
    } catch (error) {
        console.error('Error fetching leads:', error);
        return [];
    }
}

/**
 * Update a lead via API
 */
export async function updateLead(
    leadId: string,
    updates: Partial<Lead>
): Promise<Lead | null> {
    try {
        const response = await fetch('/api/leads', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: leadId, ...updates })
        });

        if (!response.ok) {
            throw new Error('Failed to update lead');
        }

        const json = await response.json();
        return json.lead as Lead;
    } catch (error) {
        console.error('Error updating lead:', error);
        return null;
    }
}

/**
 * Get lead statistics from API
 */
export async function getLeadStats(): Promise<{
    total: number;
    new: number;
    hot: number;
    warm: number;
    cold: number;
    converted: number;
    avgScore: number;
}> {
    try {
        const response = await fetch('/api/leads?action=stats');

        if (!response.ok) {
            throw new Error('Failed to fetch lead stats');
        }

        return await response.json();
    } catch (error) {
        console.error('Error fetching lead stats:', error);
        return { total: 0, new: 0, hot: 0, warm: 0, cold: 0, converted: 0, avgScore: 0 };
    }
}

