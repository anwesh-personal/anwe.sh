/**
 * Heatmaps API Route
 * Server-side heatmap data retrieval using service role key to bypass RLS
 * REQUIRES ADMIN AUTHENTICATION
 * 
 * GET /api/heatmaps
 *   Query params:
 *   - action: 'data' | 'scroll' | 'sessions' | 'stats' | 'pages'
 *   - pagePath: string (for data/scroll)
 *   - eventType: 'click' | 'move' | 'scroll' (for data)
 *   - deviceType: 'desktop' | 'tablet' | 'mobile' (optional)
 *   - startDate: ISO string (optional)
 *   - endDate: ISO string (optional)
 *   - days: number (for sessions/stats)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { verifyAdminAuth } from '@/lib/admin-auth';

export async function GET(request: NextRequest) {
    try {
        // Verify admin authentication
        const auth = await verifyAdminAuth(request);
        if (!auth.authenticated) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const action = searchParams.get('action') || 'data';
        const pagePath = searchParams.get('pagePath');
        const eventType = (searchParams.get('eventType') || 'click') as 'click' | 'move' | 'scroll';
        const deviceType = searchParams.get('deviceType') as 'desktop' | 'tablet' | 'mobile' | null;
        const startDateStr = searchParams.get('startDate');
        const endDateStr = searchParams.get('endDate');
        const days = parseInt(searchParams.get('days') || '30');

        const supabase = getSupabaseAdmin();

        // Get list of tracked pages
        if (action === 'pages') {
            const { data, error } = await supabase
                .from('heatmap_events')
                .select('page_path')
                .order('created_at', { ascending: false })
                .limit(1000);

            if (error) {
                throw error;
            }

            // Get unique pages with counts - cast to known type
            const pageCounts: Record<string, number> = {};
            const pagesData = (data || []) as { page_path: string }[];
            pagesData.forEach(row => {
                pageCounts[row.page_path] = (pageCounts[row.page_path] || 0) + 1;
            });

            const pages = Object.entries(pageCounts)
                .map(([path, count]) => ({ path, eventCount: count }))
                .sort((a, b) => b.eventCount - a.eventCount);

            return NextResponse.json({ pages });
        }

        // Session stats
        if (action === 'stats' || action === 'sessions') {
            const startDate = new Date();
            startDate.setDate(startDate.getDate() - days);

            const { data: sessions, error } = await supabase
                .from('sessions')
                .select('*')
                .gte('started_at', startDate.toISOString());

            if (error) {
                throw error;
            }

            if (!sessions || sessions.length === 0) {
                return NextResponse.json({
                    totalSessions: 0,
                    uniqueVisitors: 0,
                    avgDuration: 0,
                    avgPageViews: 0,
                    bounceRate: 0,
                    conversionRate: 0,
                    deviceBreakdown: {}
                });
            }

            const sessionsTyped = sessions as {
                visitor_id: string | null;
                page_count: number;
                converted: boolean;
                device_type: string;
                duration_seconds: number | null;
            }[];

            const uniqueVisitors = new Set(sessionsTyped.map(s => s.visitor_id).filter(Boolean)).size;
            const bounces = sessionsTyped.filter(s => s.page_count <= 1).length;
            const conversions = sessionsTyped.filter(s => s.converted).length;
            const totalDuration = sessionsTyped.reduce((sum, s) => sum + (s.duration_seconds || 0), 0);
            const totalPageViews = sessionsTyped.reduce((sum, s) => sum + s.page_count, 0);

            const deviceBreakdown: Record<string, number> = {};
            sessionsTyped.forEach(s => {
                const type = s.device_type || 'unknown';
                deviceBreakdown[type] = (deviceBreakdown[type] || 0) + 1;
            });

            return NextResponse.json({
                totalSessions: sessions.length,
                uniqueVisitors,
                avgDuration: Math.round(totalDuration / sessions.length),
                avgPageViews: Math.round((totalPageViews / sessions.length) * 10) / 10,
                bounceRate: Math.round((bounces / sessions.length) * 1000) / 10,
                conversionRate: Math.round((conversions / sessions.length) * 1000) / 10,
                deviceBreakdown
            });
        }

        // Heatmap data and scroll depth require pagePath
        if (!pagePath) {
            return NextResponse.json({ error: 'pagePath is required' }, { status: 400 });
        }

        // Scroll depth data
        if (action === 'scroll') {
            let query = supabase
                .from('heatmap_events')
                .select('scroll_depth, session_id')
                .eq('page_path', pagePath)
                .eq('event_type', 'scroll')
                .not('scroll_depth', 'is', null);

            if (startDateStr) {
                query = query.gte('created_at', startDateStr);
            }
            if (endDateStr) {
                query = query.lte('created_at', endDateStr);
            }

            const { data, error } = await query.limit(10000);

            if (error) {
                throw error;
            }

            if (!data || data.length === 0) {
                return NextResponse.json({ scrollData: [] });
            }

            // Get max scroll depth per session
            const dataTyped = data as { scroll_depth: number; session_id: string }[];
            const sessionMaxDepth: Record<string, number> = {};

            dataTyped.forEach(row => {
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

            const scrollData = Object.entries(buckets)
                .map(([depth, sessions]) => ({ depth: Number(depth), sessions }))
                .sort((a, b) => a.depth - b.depth);

            return NextResponse.json({ scrollData });
        }

        // Heatmap click/move data
        if (action === 'data') {
            let query = supabase
                .from('heatmap_events')
                .select('x, y')
                .eq('page_path', pagePath)
                .eq('event_type', eventType)
                .not('x', 'is', null)
                .not('y', 'is', null);

            if (startDateStr) {
                query = query.gte('created_at', startDateStr);
            }
            if (endDateStr) {
                query = query.lte('created_at', endDateStr);
            }
            if (deviceType) {
                query = query.eq('device_type', deviceType);
            }

            const { data, error } = await query.limit(10000);

            if (error) {
                throw error;
            }

            if (!data || data.length === 0) {
                return NextResponse.json({ heatmapData: [] });
            }

            // Aggregate into grid (normalize to 0-100 coordinates)
            const dataTyped = data as { x: number; y: number }[];
            const grid: Record<string, number> = {};

            dataTyped.forEach(point => {
                const normX = Math.round((point.x / 1920) * 100);
                const normY = Math.round((point.y / 1080) * 100);
                const key = `${normX},${normY}`;
                grid[key] = (grid[key] || 0) + 1;
            });

            const heatmapData = Object.entries(grid).map(([key, count]) => {
                const [x, y] = key.split(',').map(Number);
                return { x, y, count };
            });

            return NextResponse.json({ heatmapData });
        }

        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

    } catch (error) {
        console.error('Heatmaps API error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch heatmap data' },
            { status: 500 }
        );
    }
}
