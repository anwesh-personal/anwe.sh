/**
 * Analytics Data Access Layer
 */

import { supabase } from './supabase';
import type { AnalyticsSummary, DeviceType } from '@/types';

/**
 * Get analytics summary for a date range
 */
export async function getAnalyticsSummary(
    startDate: Date,
    endDate: Date
): Promise<AnalyticsSummary> {
    const startStr = startDate.toISOString();
    const endStr = endDate.toISOString();

    // Get total views
    const { count: totalViews } = await supabase
        .from('page_views')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', startStr)
        .lte('created_at', endStr);

    // Get unique visitors (by visitor_hash)
    const { data: visitors } = await supabase
        .from('page_views')
        .select('visitor_hash')
        .gte('created_at', startStr)
        .lte('created_at', endStr);

    const uniqueVisitors = new Set(visitors?.map(v => v.visitor_hash).filter(Boolean)).size;

    // Get top pages
    const { data: pageData } = await supabase
        .from('page_views')
        .select('path')
        .gte('created_at', startStr)
        .lte('created_at', endStr);

    const pageCounts = (pageData || []).reduce((acc, row) => {
        acc[row.path] = (acc[row.path] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    const topPages = Object.entries(pageCounts)
        .map(([path, views]) => ({ path, views, change: 0 }))
        .sort((a, b) => b.views - a.views)
        .slice(0, 5);

    // Get top sources
    const { data: sourceData } = await supabase
        .from('page_views')
        .select('referrer')
        .gte('created_at', startStr)
        .lte('created_at', endStr);

    const sourceCounts = (sourceData || []).reduce((acc, row) => {
        const source = row.referrer ? extractDomain(row.referrer) : 'Direct';
        acc[source] = (acc[source] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    const totalSourceViews = Object.values(sourceCounts).reduce((a, b) => a + b, 0);
    const topSources = Object.entries(sourceCounts)
        .map(([source, visitors]) => ({
            source,
            visitors,
            percent: totalSourceViews > 0 ? Math.round((visitors / totalSourceViews) * 100) : 0
        }))
        .sort((a, b) => b.visitors - a.visitors)
        .slice(0, 5);

    // Get device breakdown
    const { data: deviceData } = await supabase
        .from('page_views')
        .select('device_type')
        .gte('created_at', startStr)
        .lte('created_at', endStr);

    const deviceBreakdown = (deviceData || []).reduce((acc, row) => {
        const type = (row.device_type || 'unknown') as DeviceType;
        acc[type] = (acc[type] || 0) + 1;
        return acc;
    }, {} as Record<DeviceType, number>);

    // Get daily views
    const dailyViews = await getDailyViews(startDate, endDate);

    // Calculate avg session duration (placeholder - needs session tracking)
    const avgSessionDuration = 145; // 2:25 - placeholder

    // Calculate bounce rate (placeholder - needs session tracking)
    const bounceRate = 42.5; // placeholder

    return {
        totalViews: totalViews || 0,
        uniqueVisitors,
        avgSessionDuration,
        bounceRate,
        topPages,
        topSources,
        deviceBreakdown,
        dailyViews
    };
}

/**
 * Get daily views for a date range
 */
async function getDailyViews(
    startDate: Date,
    endDate: Date
): Promise<Array<{ date: string; views: number }>> {
    const { data } = await supabase
        .from('page_views')
        .select('created_at')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());

    const dailyCounts = (data || []).reduce((acc, row) => {
        const date = row.created_at.split('T')[0];
        acc[date] = (acc[date] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    // Fill in missing dates
    const result: Array<{ date: string; views: number }> = [];
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

/**
 * Track a page view
 */
export async function trackPageView(data: {
    path: string;
    title?: string;
    referrer?: string;
    sessionId?: string;
    visitorHash?: string;
    userAgent?: string;
    deviceType?: DeviceType;
}): Promise<void> {
    await supabase.from('page_views').insert([{
        path: data.path,
        title: data.title,
        referrer: data.referrer,
        session_id: data.sessionId,
        visitor_hash: data.visitorHash,
        user_agent: data.userAgent,
        device_type: data.deviceType,
        created_at: new Date().toISOString()
    }]);
}

/**
 * Get views for a specific post
 */
export async function getPostViews(postId: string): Promise<number> {
    const { count } = await supabase
        .from('page_views')
        .select('*', { count: 'exact', head: true })
        .eq('post_id', postId);

    return count || 0;
}

/**
 * Extract domain from URL
 */
function extractDomain(url: string): string {
    try {
        const parsed = new URL(url);
        return parsed.hostname.replace('www.', '');
    } catch {
        return url;
    }
}

/**
 * Generate mock analytics data (for development/demo purposes)
 */
export function getMockAnalyticsSummary(): AnalyticsSummary {
    const now = new Date();
    const dailyViews: Array<{ date: string; views: number }> = [];

    for (let i = 29; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        dailyViews.push({
            date: date.toISOString().split('T')[0],
            views: Math.floor(Math.random() * 500) + 50
        });
    }

    return {
        totalViews: 24892,
        uniqueVisitors: 8934,
        avgSessionDuration: 145,
        bounceRate: 42.5,
        topPages: [
            { path: '/', views: 8234, change: 12 },
            { path: '/blog', views: 5621, change: 8 },
            { path: '/blog/why-ai-implementations-fail', views: 3245, change: 24 },
            { path: '/blog/architecture-of-scale', views: 2876, change: -3 },
            { path: '/blog/psychology-of-persuasion', views: 2134, change: 15 },
        ],
        topSources: [
            { source: 'google.com', visitors: 4123, percent: 46 },
            { source: 'Direct', visitors: 2341, percent: 26 },
            { source: 'twitter.com', visitors: 1234, percent: 14 },
            { source: 'linkedin.com', visitors: 876, percent: 10 },
            { source: 'github.com', visitors: 360, percent: 4 },
        ],
        deviceBreakdown: {
            desktop: 5234,
            mobile: 3012,
            tablet: 456,
            bot: 123,
            unknown: 109
        },
        dailyViews
    };
}
