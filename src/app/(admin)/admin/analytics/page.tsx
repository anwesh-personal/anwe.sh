'use client';

import { useState, useEffect } from 'react';
import { AdminHeader } from '@/components/admin';
import { getMockAnalyticsSummary } from '@/lib/analytics';
import type { AnalyticsSummary, DeviceType } from '@/types';

type DateRange = '7d' | '30d' | '90d' | '1y';

export default function AnalyticsPage() {
    const [dateRange, setDateRange] = useState<DateRange>('30d');
    const [analytics, setAnalytics] = useState<AnalyticsSummary | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setLoading(true);
        // For now, use mock data. Replace with real data when analytics table is populated
        setTimeout(() => {
            setAnalytics(getMockAnalyticsSummary());
            setLoading(false);
        }, 500);
    }, [dateRange]);

    const formatDuration = (seconds: number): string => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const formatNumber = (num: number): string => {
        if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
        if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
        return num.toString();
    };

    const getDeviceIcon = (device: DeviceType): string => {
        switch (device) {
            case 'desktop': return '💻';
            case 'mobile': return '📱';
            case 'tablet': return '📱';
            case 'bot': return '🤖';
            default: return '❓';
        }
    };

    if (loading || !analytics) {
        return (
            <>
                <AdminHeader
                    title="Analytics"
                    subtitle="Loading..."
                />
                <div className="admin-content">
                    <div style={{
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        minHeight: '300px'
                    }}>
                        <div style={{
                            width: '40px',
                            height: '40px',
                            border: '3px solid var(--color-border)',
                            borderTopColor: 'var(--color-accent-solid)',
                            borderRadius: '50%',
                            animation: 'spin 1s linear infinite'
                        }} />
                    </div>
                </div>
                <style jsx>{`
                    @keyframes spin {
                        to { transform: rotate(360deg); }
                    }
                `}</style>
            </>
        );
    }

    // Calculate max for chart
    const maxViews = Math.max(...analytics.dailyViews.map(d => d.views));

    return (
        <>
            <AdminHeader
                title="Analytics"
                subtitle={`Viewing data for the last ${dateRange === '7d' ? '7 days' : dateRange === '30d' ? '30 days' : dateRange === '90d' ? '90 days' : 'year'}`}
                actions={
                    <div style={{
                        display: 'flex',
                        background: 'var(--color-background-secondary)',
                        borderRadius: 'var(--radius-md)',
                        padding: '2px'
                    }}>
                        {(['7d', '30d', '90d', '1y'] as DateRange[]).map(range => (
                            <button
                                key={range}
                                className={`btn btn-sm ${dateRange === range ? 'btn-primary' : 'btn-ghost'}`}
                                onClick={() => setDateRange(range)}
                            >
                                {range === '7d' ? '7D' : range === '30d' ? '30D' : range === '90d' ? '90D' : '1Y'}
                            </button>
                        ))}
                    </div>
                }
            />

            <div className="admin-content">
                {/* Summary Stats */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(4, 1fr)',
                    gap: '1rem',
                    marginBottom: '1.5rem'
                }}>
                    <div className="admin-card">
                        <div className="admin-card-body" style={{
                            padding: '1.25rem',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '0.25rem'
                        }}>
                            <span style={{
                                fontSize: '0.8rem',
                                color: 'var(--color-foreground-muted)'
                            }}>
                                Page Views
                            </span>
                            <span style={{
                                fontSize: '1.75rem',
                                fontWeight: '600',
                                fontFamily: 'var(--font-secondary)'
                            }}>
                                {formatNumber(analytics.totalViews)}
                            </span>
                            <span style={{
                                fontSize: '0.75rem',
                                color: '#10b981'
                            }}>
                                ↑ 12.5% vs last period
                            </span>
                        </div>
                    </div>

                    <div className="admin-card">
                        <div className="admin-card-body" style={{
                            padding: '1.25rem',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '0.25rem'
                        }}>
                            <span style={{
                                fontSize: '0.8rem',
                                color: 'var(--color-foreground-muted)'
                            }}>
                                Unique Visitors
                            </span>
                            <span style={{
                                fontSize: '1.75rem',
                                fontWeight: '600',
                                fontFamily: 'var(--font-secondary)'
                            }}>
                                {formatNumber(analytics.uniqueVisitors)}
                            </span>
                            <span style={{
                                fontSize: '0.75rem',
                                color: '#10b981'
                            }}>
                                ↑ 8.3% vs last period
                            </span>
                        </div>
                    </div>

                    <div className="admin-card">
                        <div className="admin-card-body" style={{
                            padding: '1.25rem',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '0.25rem'
                        }}>
                            <span style={{
                                fontSize: '0.8rem',
                                color: 'var(--color-foreground-muted)'
                            }}>
                                Avg. Session
                            </span>
                            <span style={{
                                fontSize: '1.75rem',
                                fontWeight: '600',
                                fontFamily: 'var(--font-secondary)'
                            }}>
                                {formatDuration(analytics.avgSessionDuration)}
                            </span>
                            <span style={{
                                fontSize: '0.75rem',
                                color: '#10b981'
                            }}>
                                ↑ 4.2% vs last period
                            </span>
                        </div>
                    </div>

                    <div className="admin-card">
                        <div className="admin-card-body" style={{
                            padding: '1.25rem',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '0.25rem'
                        }}>
                            <span style={{
                                fontSize: '0.8rem',
                                color: 'var(--color-foreground-muted)'
                            }}>
                                Bounce Rate
                            </span>
                            <span style={{
                                fontSize: '1.75rem',
                                fontWeight: '600',
                                fontFamily: 'var(--font-secondary)'
                            }}>
                                {analytics.bounceRate}%
                            </span>
                            <span style={{
                                fontSize: '0.75rem',
                                color: '#ef4444'
                            }}>
                                ↑ 2.1% vs last period
                            </span>
                        </div>
                    </div>
                </div>

                {/* Traffic Chart */}
                <div className="admin-card" style={{ marginBottom: '1.5rem' }}>
                    <div className="admin-card-header">
                        <h2 className="admin-card-title">Traffic Overview</h2>
                    </div>
                    <div className="admin-card-body" style={{ padding: '1rem' }}>
                        {/* Simple bar chart */}
                        <div style={{
                            display: 'flex',
                            alignItems: 'flex-end',
                            gap: '2px',
                            height: '200px',
                            padding: '1rem 0'
                        }}>
                            {analytics.dailyViews.map((day, i) => {
                                const height = maxViews > 0 ? (day.views / maxViews) * 100 : 0;
                                return (
                                    <div
                                        key={day.date}
                                        style={{
                                            flex: 1,
                                            height: `${Math.max(height, 2)}%`,
                                            background: 'var(--color-accent-gradient)',
                                            borderRadius: '2px 2px 0 0',
                                            transition: 'height 0.3s ease',
                                            cursor: 'pointer',
                                            position: 'relative'
                                        }}
                                        title={`${day.date}: ${day.views} views`}
                                    />
                                );
                            })}
                        </div>
                        <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            fontSize: '0.7rem',
                            color: 'var(--color-foreground-muted)',
                            marginTop: '0.5rem'
                        }}>
                            <span>{analytics.dailyViews[0]?.date}</span>
                            <span>{analytics.dailyViews[Math.floor(analytics.dailyViews.length / 2)]?.date}</span>
                            <span>{analytics.dailyViews[analytics.dailyViews.length - 1]?.date}</span>
                        </div>
                    </div>
                </div>

                {/* Two Column Layout */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '1.5rem'
                }}>
                    {/* Top Pages */}
                    <div className="admin-card">
                        <div className="admin-card-header">
                            <h2 className="admin-card-title">Top Pages</h2>
                        </div>
                        <div className="admin-card-body" style={{ padding: 0 }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr>
                                        <th style={{
                                            padding: '0.75rem 1rem',
                                            textAlign: 'left',
                                            fontSize: '0.75rem',
                                            fontWeight: '500',
                                            color: 'var(--color-foreground-muted)',
                                            borderBottom: '1px solid var(--color-border)'
                                        }}>
                                            Page
                                        </th>
                                        <th style={{
                                            padding: '0.75rem 1rem',
                                            textAlign: 'right',
                                            fontSize: '0.75rem',
                                            fontWeight: '500',
                                            color: 'var(--color-foreground-muted)',
                                            borderBottom: '1px solid var(--color-border)'
                                        }}>
                                            Views
                                        </th>
                                        <th style={{
                                            padding: '0.75rem 1rem',
                                            textAlign: 'right',
                                            fontSize: '0.75rem',
                                            fontWeight: '500',
                                            color: 'var(--color-foreground-muted)',
                                            borderBottom: '1px solid var(--color-border)'
                                        }}>
                                            Change
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {analytics.topPages.map((page, i) => (
                                        <tr key={page.path}>
                                            <td style={{
                                                padding: '0.75rem 1rem',
                                                fontSize: '0.875rem',
                                                fontFamily: 'var(--font-mono)',
                                                borderBottom: i < analytics.topPages.length - 1
                                                    ? '1px solid var(--color-border)'
                                                    : undefined
                                            }}>
                                                {page.path}
                                            </td>
                                            <td style={{
                                                padding: '0.75rem 1rem',
                                                textAlign: 'right',
                                                fontSize: '0.875rem',
                                                fontWeight: '500',
                                                borderBottom: i < analytics.topPages.length - 1
                                                    ? '1px solid var(--color-border)'
                                                    : undefined
                                            }}>
                                                {formatNumber(page.views)}
                                            </td>
                                            <td style={{
                                                padding: '0.75rem 1rem',
                                                textAlign: 'right',
                                                fontSize: '0.875rem',
                                                color: page.change >= 0 ? '#10b981' : '#ef4444',
                                                borderBottom: i < analytics.topPages.length - 1
                                                    ? '1px solid var(--color-border)'
                                                    : undefined
                                            }}>
                                                {page.change >= 0 ? '↑' : '↓'} {Math.abs(page.change)}%
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Traffic Sources */}
                    <div className="admin-card">
                        <div className="admin-card-header">
                            <h2 className="admin-card-title">Traffic Sources</h2>
                        </div>
                        <div className="admin-card-body" style={{ padding: '1rem' }}>
                            <div style={{
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '1rem'
                            }}>
                                {analytics.topSources.map(source => (
                                    <div key={source.source}>
                                        <div style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            marginBottom: '0.5rem',
                                            fontSize: '0.875rem'
                                        }}>
                                            <span>{source.source}</span>
                                            <span style={{ color: 'var(--color-foreground-muted)' }}>
                                                {formatNumber(source.visitors)} ({source.percent}%)
                                            </span>
                                        </div>
                                        <div style={{
                                            height: '6px',
                                            background: 'var(--color-background-secondary)',
                                            borderRadius: '3px',
                                            overflow: 'hidden'
                                        }}>
                                            <div style={{
                                                width: `${source.percent}%`,
                                                height: '100%',
                                                background: 'var(--color-accent-gradient)',
                                                borderRadius: '3px'
                                            }} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Device Breakdown */}
                <div className="admin-card" style={{ marginTop: '1.5rem' }}>
                    <div className="admin-card-header">
                        <h2 className="admin-card-title">Device Breakdown</h2>
                    </div>
                    <div className="admin-card-body">
                        <div style={{
                            display: 'flex',
                            gap: '2rem',
                            flexWrap: 'wrap'
                        }}>
                            {Object.entries(analytics.deviceBreakdown).map(([device, count]) => {
                                const total = Object.values(analytics.deviceBreakdown).reduce((a, b) => a + b, 0);
                                const percent = total > 0 ? Math.round((count / total) * 100) : 0;

                                return (
                                    <div
                                        key={device}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.75rem',
                                            padding: '1rem 1.5rem',
                                            background: 'var(--color-background)',
                                            borderRadius: 'var(--radius-md)',
                                            minWidth: '150px'
                                        }}
                                    >
                                        <span style={{ fontSize: '1.5rem' }}>
                                            {getDeviceIcon(device as DeviceType)}
                                        </span>
                                        <div>
                                            <div style={{
                                                fontSize: '1.25rem',
                                                fontWeight: '600'
                                            }}>
                                                {percent}%
                                            </div>
                                            <div style={{
                                                fontSize: '0.8rem',
                                                color: 'var(--color-foreground-muted)',
                                                textTransform: 'capitalize'
                                            }}>
                                                {device}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
