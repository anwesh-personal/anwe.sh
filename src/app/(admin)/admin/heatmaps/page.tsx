'use client';

/**
 * Heatmaps & Analytics Page
 * Visualize user behavior with heatmaps and engagement metrics
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { AdminHeader } from '@/components/admin';
import {
    getHeatmapData,
    getScrollDepthData,
    getSessionStats
} from '@/lib/heatmap';

type HeatmapType = 'click' | 'move' | 'scroll';
type DeviceFilter = 'all' | 'desktop' | 'tablet' | 'mobile';

export default function HeatmapsPage() {
    const [pagePath, setPagePath] = useState('/');
    const [heatmapType, setHeatmapType] = useState<HeatmapType>('click');
    const [deviceFilter, setDeviceFilter] = useState<DeviceFilter>('all');
    const [heatmapData, setHeatmapData] = useState<{ x: number; y: number; count: number }[]>([]);
    const [scrollData, setScrollData] = useState<{ depth: number; sessions: number }[]>([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        totalSessions: 0,
        uniqueVisitors: 0,
        avgDuration: 0,
        avgPageViews: 0,
        bounceRate: 0,
        conversionRate: 0,
        deviceBreakdown: {} as Record<string, number>
    });

    const canvasRef = useRef<HTMLCanvasElement>(null);

    const pages = [
        { path: '/', label: 'Home' },
        { path: '/blog', label: 'Blog' },
        { path: '/about', label: 'About' },
        { path: '/contact', label: 'Contact' }
    ];

    const loadData = useCallback(async () => {
        setLoading(true);

        try {
            const [heatData, scrollDepth, sessionStats] = await Promise.all([
                getHeatmapData(pagePath, heatmapType, {
                    deviceType: deviceFilter === 'all' ? undefined : deviceFilter
                }),
                getScrollDepthData(pagePath),
                getSessionStats(30)
            ]);

            setHeatmapData(heatData);
            setScrollData(scrollDepth);
            setStats(sessionStats);
        } catch (error) {
            console.error('Failed to load heatmap data:', error);
        } finally {
            setLoading(false);
        }
    }, [pagePath, heatmapType, deviceFilter]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    // Draw heatmap on canvas
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas || heatmapData.length === 0) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const maxCount = Math.max(...heatmapData.map(p => p.count));

        heatmapData.forEach(point => {
            const intensity = point.count / maxCount;
            const radius = 15 + (intensity * 25);

            const gradient = ctx.createRadialGradient(
                point.x * (canvas.width / 100),
                point.y * (canvas.height / 100),
                0,
                point.x * (canvas.width / 100),
                point.y * (canvas.height / 100),
                radius
            );

            if (intensity > 0.7) {
                gradient.addColorStop(0, 'rgba(239, 68, 68, 0.9)');
                gradient.addColorStop(1, 'rgba(239, 68, 68, 0)');
            } else if (intensity > 0.4) {
                gradient.addColorStop(0, 'rgba(245, 158, 11, 0.8)');
                gradient.addColorStop(1, 'rgba(245, 158, 11, 0)');
            } else {
                gradient.addColorStop(0, 'rgba(59, 130, 246, 0.7)');
                gradient.addColorStop(1, 'rgba(59, 130, 246, 0)');
            }

            ctx.beginPath();
            ctx.fillStyle = gradient;
            ctx.arc(
                point.x * (canvas.width / 100),
                point.y * (canvas.height / 100),
                radius,
                0,
                Math.PI * 2
            );
            ctx.fill();
        });
    }, [heatmapData]);

    const formatDuration = (seconds: number) => {
        if (seconds < 60) return `${Math.round(seconds)}s`;
        const mins = Math.floor(seconds / 60);
        const secs = Math.round(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const hasData = stats.totalSessions > 0;

    return (
        <div className="admin-page">
            <AdminHeader
                title="Heatmaps & Analytics"
                subtitle="Visualize user behavior and engagement patterns"
            />

            {/* Stats Cards */}
            <div className="stats-grid">
                <div className="stat-card">
                    <div className="stat-icon purple">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                            <circle cx="9" cy="7" r="4" />
                            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                        </svg>
                    </div>
                    <div className="stat-content">
                        <span className="stat-value">{stats.totalSessions.toLocaleString()}</span>
                        <span className="stat-label">Sessions (30d)</span>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon green">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                            <circle cx="12" cy="7" r="4" />
                        </svg>
                    </div>
                    <div className="stat-content">
                        <span className="stat-value">{stats.uniqueVisitors.toLocaleString()}</span>
                        <span className="stat-label">Unique Visitors</span>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon orange">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="10" />
                            <polyline points="12 6 12 12 16 14" />
                        </svg>
                    </div>
                    <div className="stat-content">
                        <span className="stat-value">{formatDuration(stats.avgDuration)}</span>
                        <span className="stat-label">Avg Duration</span>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon red">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                            <polyline points="15 3 21 3 21 9" />
                            <line x1="10" y1="14" x2="21" y2="3" />
                        </svg>
                    </div>
                    <div className="stat-content">
                        <span className="stat-value">{stats.bounceRate.toFixed(1)}%</span>
                        <span className="stat-label">Bounce Rate</span>
                    </div>
                </div>
            </div>

            {!hasData ? (
                /* Empty State */
                <div className="empty-state-container">
                    <div className="empty-state">
                        <div className="empty-icon">
                            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                <rect x="3" y="3" width="18" height="18" rx="2" />
                                <circle cx="8.5" cy="8.5" r="1.5" />
                                <circle cx="15.5" cy="10.5" r="2" />
                                <circle cx="10.5" cy="15.5" r="1.5" />
                            </svg>
                        </div>
                        <h3>No Tracking Data Yet</h3>
                        <p>
                            Heatmap and analytics data will appear here once visitors start
                            interacting with your site.
                        </p>
                        <div className="setup-steps">
                            <div className="step">
                                <span className="step-number">1</span>
                                <span>Add the tracking script to your public pages</span>
                            </div>
                            <div className="step">
                                <span className="step-number">2</span>
                                <span>Wait for visitors to interact with your site</span>
                            </div>
                            <div className="step">
                                <span className="step-number">3</span>
                                <span>View click maps, scroll depth, and user flows</span>
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <>
                    {/* Controls */}
                    <div className="controls-bar">
                        <div className="control-group">
                            <label>Page</label>
                            <select
                                value={pagePath}
                                onChange={(e) => setPagePath(e.target.value)}
                            >
                                {pages.map(page => (
                                    <option key={page.path} value={page.path}>{page.label}</option>
                                ))}
                            </select>
                        </div>

                        <div className="control-group">
                            <label>View</label>
                            <div className="toggle-group">
                                {(['click', 'move', 'scroll'] as HeatmapType[]).map(type => (
                                    <button
                                        key={type}
                                        className={heatmapType === type ? 'active' : ''}
                                        onClick={() => setHeatmapType(type)}
                                    >
                                        {type === 'click' && '👆'}
                                        {type === 'move' && '🖱️'}
                                        {type === 'scroll' && '📜'}
                                        <span>{type.charAt(0).toUpperCase() + type.slice(1)}s</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="control-group">
                            <label>Device</label>
                            <div className="toggle-group">
                                {(['all', 'desktop', 'tablet', 'mobile'] as DeviceFilter[]).map(device => (
                                    <button
                                        key={device}
                                        className={deviceFilter === device ? 'active' : ''}
                                        onClick={() => setDeviceFilter(device)}
                                    >
                                        {device === 'all' && '📊'}
                                        {device === 'desktop' && '🖥️'}
                                        {device === 'tablet' && '📱'}
                                        {device === 'mobile' && '📲'}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="heatmap-layout">
                        {/* Heatmap Preview */}
                        <div className="heatmap-panel">
                            <div className="browser-frame">
                                <div className="browser-header">
                                    <div className="browser-dots">
                                        <span className="dot red" />
                                        <span className="dot yellow" />
                                        <span className="dot green" />
                                    </div>
                                    <div className="browser-url">
                                        anwe.sh{pagePath}
                                    </div>
                                </div>
                                <div className="browser-content">
                                    {loading ? (
                                        <div className="heatmap-loading">
                                            <div className="spinner" />
                                            <p>Loading heatmap...</p>
                                        </div>
                                    ) : heatmapData.length === 0 ? (
                                        <div className="heatmap-no-data">
                                            <p>No {heatmapType} data for this page yet</p>
                                        </div>
                                    ) : (
                                        <canvas
                                            ref={canvasRef}
                                            width={800}
                                            height={600}
                                            className="heatmap-canvas"
                                        />
                                    )}
                                </div>
                            </div>

                            {heatmapData.length > 0 && (
                                <div className="legend">
                                    <span>Low activity</span>
                                    <div className="legend-gradient" />
                                    <span>High activity</span>
                                </div>
                            )}
                        </div>

                        {/* Scroll Depth Panel */}
                        <div className="side-panel">
                            <div className="panel-header">
                                <h3>📜 Scroll Depth</h3>
                                <span>How far users scroll</span>
                            </div>

                            <div className="scroll-chart">
                                {[0, 25, 50, 75, 100].map(depth => {
                                    const dataPoint = scrollData.find(d => Math.abs(d.depth - depth) < 10);
                                    const maxSessions = Math.max(...scrollData.map(d => d.sessions), 1);
                                    const percentage = dataPoint ? (dataPoint.sessions / maxSessions) * 100 : 0;

                                    return (
                                        <div key={depth} className="scroll-row">
                                            <span className="scroll-label">{depth}%</span>
                                            <div className="scroll-bar">
                                                <div
                                                    className="scroll-fill"
                                                    style={{ width: `${percentage}%` }}
                                                />
                                            </div>
                                            <span className="scroll-count">{dataPoint?.sessions || 0}</span>
                                        </div>
                                    );
                                })}
                            </div>

                            <div className="panel-header" style={{ marginTop: '2rem' }}>
                                <h3>📱 Devices</h3>
                                <span>Session breakdown</span>
                            </div>

                            <div className="device-breakdown">
                                {Object.entries(stats.deviceBreakdown).length === 0 ? (
                                    <p className="no-data-text">No device data yet</p>
                                ) : (
                                    Object.entries(stats.deviceBreakdown).map(([device, count]) => {
                                        const total = Object.values(stats.deviceBreakdown).reduce((a, b) => a + b, 1);
                                        const pct = (count / total) * 100;

                                        return (
                                            <div key={device} className="device-row">
                                                <span className="device-icon">
                                                    {device === 'desktop' && '🖥️'}
                                                    {device === 'tablet' && '📱'}
                                                    {device === 'mobile' && '📲'}
                                                </span>
                                                <span className="device-name">{device}</span>
                                                <div className="device-bar">
                                                    <div className="device-fill" style={{ width: `${pct}%` }} />
                                                </div>
                                                <span className="device-pct">{pct.toFixed(0)}%</span>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </div>
                    </div>
                </>
            )}

            <style jsx>{`
                .stats-grid {
                    display: grid;
                    grid-template-columns: repeat(4, 1fr);
                    gap: 1rem;
                    margin-bottom: 1.5rem;
                }

                .stat-card {
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                    padding: 1.25rem;
                    background: var(--color-surface);
                    border: 1px solid var(--color-border);
                    border-radius: var(--radius-lg);
                }

                .stat-icon {
                    width: 48px;
                    height: 48px;
                    border-radius: var(--radius-md);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: white;
                }

                .stat-icon.purple { background: linear-gradient(135deg, #8b5cf6, #6366f1); }
                .stat-icon.green { background: linear-gradient(135deg, #10b981, #059669); }
                .stat-icon.orange { background: linear-gradient(135deg, #f59e0b, #d97706); }
                .stat-icon.red { background: linear-gradient(135deg, #ef4444, #dc2626); }

                .stat-content {
                    display: flex;
                    flex-direction: column;
                }

                .stat-value {
                    font-size: 1.75rem;
                    font-weight: 700;
                    line-height: 1.2;
                }

                .stat-label {
                    font-size: 0.85rem;
                    color: var(--color-foreground-muted);
                }

                .empty-state-container {
                    background: var(--color-surface);
                    border: 1px solid var(--color-border);
                    border-radius: var(--radius-lg);
                    padding: 4rem 2rem;
                }

                .empty-state {
                    max-width: 500px;
                    margin: 0 auto;
                    text-align: center;
                }

                .empty-icon {
                    width: 100px;
                    height: 100px;
                    margin: 0 auto 1.5rem;
                    border-radius: var(--radius-lg);
                    background: linear-gradient(135deg, var(--color-accent-start), var(--color-accent-end));
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: white;
                }

                .empty-state h3 {
                    font-size: 1.5rem;
                    margin: 0 0 0.5rem;
                }

                .empty-state > p {
                    color: var(--color-foreground-muted);
                    margin: 0 0 2rem;
                    line-height: 1.6;
                }

                .setup-steps {
                    display: flex;
                    flex-direction: column;
                    gap: 1rem;
                    text-align: left;
                }

                .step {
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                    padding: 1rem;
                    background: var(--color-background);
                    border-radius: var(--radius-md);
                }

                .step-number {
                    width: 28px;
                    height: 28px;
                    border-radius: 50%;
                    background: var(--color-accent-gradient);
                    color: white;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-weight: 600;
                    font-size: 0.85rem;
                    flex-shrink: 0;
                }

                .controls-bar {
                    display: flex;
                    gap: 2rem;
                    padding: 1rem 1.5rem;
                    background: var(--color-surface);
                    border: 1px solid var(--color-border);
                    border-radius: var(--radius-lg);
                    margin-bottom: 1.5rem;
                    flex-wrap: wrap;
                }

                .control-group {
                    display: flex;
                    flex-direction: column;
                    gap: 0.5rem;
                }

                .control-group label {
                    font-size: 0.75rem;
                    font-weight: 600;
                    text-transform: uppercase;
                    color: var(--color-foreground-muted);
                }

                .control-group select {
                    padding: 0.5rem 1rem;
                    background: var(--color-background);
                    border: 1px solid var(--color-border);
                    border-radius: var(--radius-md);
                    color: var(--color-foreground);
                    min-width: 140px;
                }

                .toggle-group {
                    display: flex;
                    gap: 0.25rem;
                }

                .toggle-group button {
                    display: flex;
                    align-items: center;
                    gap: 0.375rem;
                    padding: 0.5rem 0.75rem;
                    background: var(--color-background);
                    border: 1px solid var(--color-border);
                    border-radius: var(--radius-md);
                    color: var(--color-foreground-muted);
                    font-size: 0.85rem;
                    cursor: pointer;
                    transition: all 0.15s ease;
                }

                .toggle-group button:hover {
                    border-color: var(--color-border-hover);
                }

                .toggle-group button.active {
                    background: var(--color-accent-gradient);
                    border-color: transparent;
                    color: white;
                }

                .toggle-group button span {
                    display: none;
                }

                @media (min-width: 640px) {
                    .toggle-group button span {
                        display: inline;
                    }
                }

                .heatmap-layout {
                    display: grid;
                    grid-template-columns: 1fr 320px;
                    gap: 1.5rem;
                }

                .heatmap-panel {
                    background: var(--color-surface);
                    border: 1px solid var(--color-border);
                    border-radius: var(--radius-lg);
                    padding: 1.5rem;
                }

                .browser-frame {
                    border: 1px solid var(--color-border);
                    border-radius: var(--radius-md);
                    overflow: hidden;
                    background: var(--color-background);
                }

                .browser-header {
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                    padding: 0.75rem 1rem;
                    background: var(--color-surface);
                    border-bottom: 1px solid var(--color-border);
                }

                .browser-dots {
                    display: flex;
                    gap: 0.375rem;
                }

                .dot {
                    width: 10px;
                    height: 10px;
                    border-radius: 50%;
                }

                .dot.red { background: #ef4444; }
                .dot.yellow { background: #f59e0b; }
                .dot.green { background: #10b981; }

                .browser-url {
                    flex: 1;
                    padding: 0.25rem 0.75rem;
                    background: var(--color-background);
                    border-radius: var(--radius-sm);
                    font-size: 0.8rem;
                    color: var(--color-foreground-muted);
                    font-family: monospace;
                }

                .browser-content {
                    min-height: 400px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .heatmap-canvas {
                    width: 100%;
                    height: auto;
                }

                .heatmap-loading, .heatmap-no-data {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 1rem;
                    color: var(--color-foreground-muted);
                }

                .spinner {
                    width: 32px;
                    height: 32px;
                    border: 3px solid var(--color-border);
                    border-top-color: var(--color-accent-solid);
                    border-radius: 50%;
                    animation: spin 0.8s linear infinite;
                }

                @keyframes spin {
                    to { transform: rotate(360deg); }
                }

                .legend {
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                    margin-top: 1rem;
                    font-size: 0.8rem;
                    color: var(--color-foreground-muted);
                }

                .legend-gradient {
                    flex: 1;
                    height: 8px;
                    background: linear-gradient(90deg, #3b82f6, #f59e0b, #ef4444);
                    border-radius: var(--radius-sm);
                }

                .side-panel {
                    background: var(--color-surface);
                    border: 1px solid var(--color-border);
                    border-radius: var(--radius-lg);
                    padding: 1.5rem;
                    height: fit-content;
                }

                .panel-header {
                    margin-bottom: 1rem;
                }

                .panel-header h3 {
                    margin: 0;
                    font-size: 1rem;
                }

                .panel-header span {
                    font-size: 0.8rem;
                    color: var(--color-foreground-muted);
                }

                .scroll-chart {
                    display: flex;
                    flex-direction: column;
                    gap: 0.5rem;
                }

                .scroll-row {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                }

                .scroll-label {
                    width: 36px;
                    font-size: 0.75rem;
                    color: var(--color-foreground-muted);
                    text-align: right;
                }

                .scroll-bar {
                    flex: 1;
                    height: 20px;
                    background: var(--color-background);
                    border-radius: var(--radius-sm);
                    overflow: hidden;
                }

                .scroll-fill {
                    height: 100%;
                    background: linear-gradient(90deg, var(--color-accent-start), var(--color-accent-end));
                    border-radius: var(--radius-sm);
                    transition: width 0.3s ease;
                }

                .scroll-count {
                    width: 32px;
                    font-size: 0.75rem;
                    color: var(--color-foreground-muted);
                }

                .device-breakdown {
                    display: flex;
                    flex-direction: column;
                    gap: 0.75rem;
                }

                .device-row {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                }

                .device-icon {
                    font-size: 1.25rem;
                }

                .device-name {
                    width: 60px;
                    font-size: 0.85rem;
                    text-transform: capitalize;
                }

                .device-bar {
                    flex: 1;
                    height: 8px;
                    background: var(--color-background);
                    border-radius: var(--radius-sm);
                    overflow: hidden;
                }

                .device-fill {
                    height: 100%;
                    background: var(--color-accent-solid);
                    border-radius: var(--radius-sm);
                }

                .device-pct {
                    width: 36px;
                    font-size: 0.8rem;
                    font-weight: 600;
                    text-align: right;
                }

                .no-data-text {
                    color: var(--color-foreground-muted);
                    font-size: 0.9rem;
                    text-align: center;
                    padding: 1rem;
                }

                @media (max-width: 1024px) {
                    .stats-grid {
                        grid-template-columns: repeat(2, 1fr);
                    }

                    .heatmap-layout {
                        grid-template-columns: 1fr;
                    }
                }

                @media (max-width: 640px) {
                    .stats-grid {
                        grid-template-columns: 1fr;
                    }
                }
            `}</style>
        </div>
    );
}
