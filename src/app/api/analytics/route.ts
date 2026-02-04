/**
 * Analytics API Route
 * Server-side analytics aggregation using service role key to bypass RLS
 * REQUIRES ADMIN AUTHENTICATION
 * 
 * GET /api/analytics - Get analytics summary for date range
 *   Query params:
 *   - startDate: ISO date string (required)
 *   - endDate: ISO date string (required)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { verifyAdminAuth } from '@/lib/admin-auth';

// Types matching the frontend expectations
interface TopPage {
    path: string;
    views: number;
    change: number;
}

interface TopSource {
    source: string;
    visitors: number;
    percent: number;
}

interface DailyView {
    date: string;
    views: number;
}

interface DeviceBreakdown {
    desktop: number;
    mobile: number;
    tablet: number;
    bot: number;
    unknown: number;
}

interface AnalyticsSummary {
    totalViews: number;
    uniqueVisitors: number;
    avgSessionDuration: number;
    bounceRate: number;
    topPages: TopPage[];
    topSources: TopSource[];
    deviceBreakdown: DeviceBreakdown;
    dailyViews: DailyView[];
}

/**
 * Extract domain from URL for source aggregation
 */
function extractDomain(url: string | null): string {
    if (!url) return 'Direct';
    try {
        const parsed = new URL(url);
        return parsed.hostname.replace('www.', '');
    } catch {
        return 'Direct';
    }
}

/**
 * Fill missing dates in a date range
 */
function fillMissingDates(
    dailyCounts: Record<string, number>,
    startDate: Date,
    endDate: Date
): DailyView[] {
    const result: DailyView[] = [];
    const current = new Date(startDate);

    while (current <= endDate) {
        const dateStr = current.toISOString().split('T')[0];
        result.push({
            date: dateStr,
            views: dailyCounts[dateStr] || 0
        });
        current.setDate(current.getDate() + 1);
    }

    return result;
}

export async function GET(request: NextRequest) {
    try {
        // Verify admin authentication
        const auth = await verifyAdminAuth(request);
        if (!auth.authenticated) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const startDateStr = searchParams.get('startDate');
        const endDateStr = searchParams.get('endDate');

        // Default to last 30 days if not provided
        const endDate = endDateStr ? new Date(endDateStr) : new Date();
        const startDate = startDateStr
            ? new Date(startDateStr)
            : new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000);

        const startStr = startDate.toISOString();
        const endStr = endDate.toISOString();

        const supabase = getSupabaseAdmin();


        // Run all queries in parallel for performance
        const [
            viewsResult,
            visitorsResult,
            pageDataResult,
            sourceDataResult,
            deviceDataResult,
            sessionsResult
        ] = await Promise.all([
            // Total views count
            supabase
                .from('page_views')
                .select('*', { count: 'exact', head: true })
                .gte('created_at', startStr)
                .lte('created_at', endStr),

            // Unique visitors
            supabase
                .from('page_views')
                .select('visitor_hash')
                .gte('created_at', startStr)
                .lte('created_at', endStr),

            // Page path data for top pages
            supabase
                .from('page_views')
                .select('path, created_at')
                .gte('created_at', startStr)
                .lte('created_at', endStr),

            // Source/referrer data
            supabase
                .from('page_views')
                .select('referrer')
                .gte('created_at', startStr)
                .lte('created_at', endStr),

            // Device type data
            supabase
                .from('page_views')
                .select('device_type')
                .gte('created_at', startStr)
                .lte('created_at', endStr),

            // Session data for duration and bounce rate
            supabase
                .from('sessions')
                .select('duration_seconds, page_count')
                .gte('started_at', startStr)
                .lte('started_at', endStr)
        ]);

        // Calculate total views
        const totalViews = viewsResult.count || 0;

        // Calculate unique visitors - cast to known type
        const visitors = (visitorsResult.data || []) as { visitor_hash: string | null }[];
        const uniqueVisitors = new Set(
            visitors.map(v => v.visitor_hash).filter(Boolean)
        ).size;

        // Calculate top pages - cast to known type
        const pageData = (pageDataResult.data || []) as { path: string; created_at: string }[];
        const pageCounts: Record<string, number> = {};
        const dailyCounts: Record<string, number> = {};

        pageData.forEach(row => {
            // Count by page
            pageCounts[row.path] = (pageCounts[row.path] || 0) + 1;

            // Count by day
            const date = row.created_at?.split('T')[0];
            if (date) {
                dailyCounts[date] = (dailyCounts[date] || 0) + 1;
            }
        });

        const topPages: TopPage[] = Object.entries(pageCounts)
            .map(([path, views]) => ({ path, views, change: 0 })) // Change requires historical comparison
            .sort((a, b) => b.views - a.views)
            .slice(0, 5);

        // Calculate top sources - cast to known type
        const sourceData = (sourceDataResult.data || []) as { referrer: string | null }[];
        const sourceCounts: Record<string, number> = {};

        sourceData.forEach(row => {
            const source = extractDomain(row.referrer);
            sourceCounts[source] = (sourceCounts[source] || 0) + 1;
        });

        const totalSourceViews = Object.values(sourceCounts).reduce((a, b) => a + b, 0);
        const topSources: TopSource[] = Object.entries(sourceCounts)
            .map(([source, visitors]) => ({
                source,
                visitors,
                percent: totalSourceViews > 0 ? Math.round((visitors / totalSourceViews) * 100) : 0
            }))
            .sort((a, b) => b.visitors - a.visitors)
            .slice(0, 5);

        // Calculate device breakdown - cast to known type
        const deviceData = (deviceDataResult.data || []) as { device_type: string | null }[];
        const deviceBreakdown: DeviceBreakdown = {
            desktop: 0,
            mobile: 0,
            tablet: 0,
            bot: 0,
            unknown: 0
        };

        deviceData.forEach(row => {
            const type = (row.device_type || 'unknown') as keyof DeviceBreakdown;
            if (type in deviceBreakdown) {
                deviceBreakdown[type]++;
            } else {
                deviceBreakdown.unknown++;
            }
        });

        // Calculate session metrics - cast to known type
        const sessions = (sessionsResult.data || []) as { duration_seconds: number | null; page_count: number | null }[];
        let totalDuration = 0;
        let bounceCount = 0;

        sessions.forEach(session => {
            totalDuration += session.duration_seconds || 0;
            if (session.page_count === 1) {
                bounceCount++;
            }
        });

        const avgSessionDuration = sessions.length > 0
            ? Math.round(totalDuration / sessions.length)
            : 0;

        const bounceRate = sessions.length > 0
            ? Math.round((bounceCount / sessions.length) * 1000) / 10
            : 0;

        // Fill in daily views
        const dailyViews = fillMissingDates(dailyCounts, startDate, endDate);

        // Build response
        const summary: AnalyticsSummary = {
            totalViews,
            uniqueVisitors,
            avgSessionDuration,
            bounceRate,
            topPages,
            topSources,
            deviceBreakdown,
            dailyViews
        };

        return NextResponse.json(summary);

    } catch (error) {
        console.error('Analytics API error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch analytics' },
            { status: 500 }
        );
    }
}
