/**
 * Tracking API Endpoint
 * Receives events from the client-side tracker
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Lazy initialization to avoid build-time errors
function getSupabase(): SupabaseClient {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
        throw new Error('Missing Supabase environment variables');
    }

    return createClient(supabaseUrl, supabaseServiceKey);
}

interface TrackingEvent {
    type: 'session' | 'pageview' | 'event';
    data: Record<string, unknown>;
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { events } = body as { events: TrackingEvent[] };

        if (!events || !Array.isArray(events)) {
            return NextResponse.json({ error: 'Invalid events' }, { status: 400 });
        }

        // Process events in batches
        const sessionEvents: Record<string, unknown>[] = [];
        const pageViewEvents: Record<string, unknown>[] = [];
        const heatmapEvents: Record<string, unknown>[] = [];

        for (const event of events) {
            switch (event.type) {
                case 'session':
                    sessionEvents.push({
                        session_id: event.data.sessionId,
                        visitor_id: event.data.visitorId,
                        device_type: event.data.deviceType,
                        browser: event.data.browser,
                        browser_version: event.data.browserVersion,
                        os: event.data.os,
                        os_version: event.data.osVersion,
                        screen_width: event.data.screenWidth,
                        screen_height: event.data.screenHeight,
                        entry_page: event.data.entryPage,
                        referrer: event.data.referrer,
                        utm_source: event.data.utm_source || null,
                        utm_medium: event.data.utm_medium || null,
                        utm_campaign: event.data.utm_campaign || null,
                        utm_term: event.data.utm_term || null,
                        utm_content: event.data.utm_content || null
                    });
                    break;

                case 'pageview':
                    pageViewEvents.push({
                        session_id: event.data.sessionId,
                        page_path: event.data.pagePath,
                        referrer: document?.referrer || null
                    });
                    break;

                case 'event':
                    heatmapEvents.push({
                        session_id: event.data.sessionId,
                        page_path: event.data.pagePath,
                        event_type: event.data.eventType,
                        x: event.data.x,
                        y: event.data.y,
                        viewport_width: event.data.viewportWidth,
                        viewport_height: event.data.viewportHeight,
                        page_height: event.data.pageHeight,
                        scroll_depth: event.data.scrollDepth,
                        element_tag: event.data.elementTag,
                        element_id: event.data.elementId,
                        element_class: event.data.elementClass,
                        element_text: event.data.elementText,
                        device_type: event.data.deviceType
                    });
                    break;
            }
        }

        // Insert session events
        if (sessionEvents.length > 0) {
            const { error } = await getSupabase()
                .from('sessions')
                .upsert(sessionEvents, {
                    onConflict: 'session_id',
                    ignoreDuplicates: true
                });

            if (error) {
                console.error('Error inserting sessions:', error);
            }
        }

        // Insert page views
        if (pageViewEvents.length > 0) {
            const { error } = await getSupabase()
                .from('page_views')
                .insert(pageViewEvents);

            if (error) {
                console.error('Error inserting page views:', error);
            }

            // Update session page count
            for (const pv of pageViewEvents) {
                await getSupabase()
                    .from('sessions')
                    .update({
                        exit_page: pv.page_path,
                        last_activity_at: new Date().toISOString()
                    })
                    .eq('session_id', pv.session_id);
            }
        }

        // Insert heatmap events
        if (heatmapEvents.length > 0) {
            const { error } = await getSupabase()
                .from('heatmap_events')
                .insert(heatmapEvents);

            if (error) {
                console.error('Error inserting heatmap events:', error);
            }
        }

        return NextResponse.json({ success: true, processed: events.length });

    } catch (error) {
        console.error('Tracking error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

// Allow GET for health checks
export async function GET() {
    return NextResponse.json({ status: 'ok' });
}
