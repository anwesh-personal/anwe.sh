'use client';

/**
 * Heatmaps Admin Page
 * Visualize user behavior with heatmaps and scroll depth
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

    // Available pages to analyze
    const pages = [
        { path: '/', label: 'Home' },
        { path: '/blog', label: 'Blog' },
        { path: '/about', label: 'About' },
        { path: '/contact', label: 'Contact' }
    ];

    const loadData = useCallback(async () => {
        setLoading(true);

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
        setLoading(false);
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

        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Find max count for normalization
        const maxCount = Math.max(...heatmapData.map(p => p.count));

        // Draw heatmap points
        heatmapData.forEach(point => {
            const intensity = point.count / maxCount;
            const radius = 20 + (intensity * 30);

            // Create radial gradient
            const gradient = ctx.createRadialGradient(
                point.x * (canvas.width / 100),
                point.y * (canvas.height / 100),
                0,
                point.x * (canvas.width / 100),
                point.y * (canvas.height / 100),
                radius
            );

            // Color based on intensity
            if (intensity > 0.7) {
                gradient.addColorStop(0, 'rgba(239, 68, 68, 0.9)'); // Red
                gradient.addColorStop(1, 'rgba(239, 68, 68, 0)');
            } else if (intensity > 0.4) {
                gradient.addColorStop(0, 'rgba(245, 158, 11, 0.8)'); // Orange
                gradient.addColorStop(1, 'rgba(245, 158, 11, 0)');
            } else {
                gradient.addColorStop(0, 'rgba(59, 130, 246, 0.7)'); // Blue
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
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const formatPercent = (value: number) => `${value.toFixed(1)}%`;

    return (
        <div className="admin-page">
            <AdminHeader
                title="Heatmaps & Analytics"
                subtitle="Visualize user behavior and engagement patterns"
            />

            {/* Stats Overview */}
            <div className="admin-panel-stats" style={{ marginBottom: '2rem' }}>
                <div className="stat-card">
                    <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #8b5cf6, #6366f1)' }}>
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
                    <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}>
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
                    <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}>
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
                    <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #ef4444, #dc2626)' }}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                            <polyline points="15 3 21 3 21 9" />
                            <line x1="10" y1="14" x2="21" y2="3" />
                        </svg>
                    </div>
                    <div className="stat-content">
                        <span className="stat-value">{formatPercent(stats.bounceRate)}</span>
                        <span className="stat-label">Bounce Rate</span>
                    </div>
                </div>
            </div>

            {/* Controls */}
            <div className="heatmap-controls">
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
                    <label>Type</label>
                    <div className="button-group">
                        {(['click', 'move', 'scroll'] as HeatmapType[]).map(type => (
                            <button
                                key={type}
                                className={heatmapType === type ? 'active' : ''}
                                onClick={() => setHeatmapType(type)}
                            >
                                {type.charAt(0).toUpperCase() + type.slice(1)}s
                            </button>
                        ))}
                    </div>
                </div>

                <div className="control-group">
                    <label>Device</label>
                    <div className="button-group">
                        {(['all', 'desktop', 'tablet', 'mobile'] as DeviceFilter[]).map(device => (
                            <button
                                key={device}
                                className={deviceFilter === device ? 'active' : ''}
                                onClick={() => setDeviceFilter(device)}
                            >
                                {device.charAt(0).toUpperCase() + device.slice(1)}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Heatmap Visualization */}
            <div className="heatmap-container">
                <div className="heatmap-preview">
                    {loading ? (
                        <div className="heatmap-loading">
                            <div className="spinner" />
                            <p>Loading heatmap data...</p>
                        </div>
                    ) : heatmapData.length === 0 ? (
                        <div className="heatmap-empty">
                            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                <path d="M12 2v20M2 12h20" />
                            </svg>
                            <p>No data available for this page yet</p>
                            <span>Start tracking to see heatmap data</span>
                        </div>
                    ) : (
                        <>
                            <div className="page-frame">
                                <div className="page-url-bar">
                                    <span className="dots">
                                        <span className="dot red" />
                                        <span className="dot yellow" />
                                        <span className="dot green" />
                                    </span>
                                    <span className="url">anwe.sh{pagePath}</span>
                                </div>
                                <div className="page-content">
                                    <canvas
                                        ref={canvasRef}
                                        width={800}
                                        height={600}
                                        className="heatmap-canvas"
                                    />
                                </div>
                            </div>
                            <div className="heatmap-legend">
                                <span>Low</span>
                                <div className="legend-gradient" />
                                <span>High</span>
                            </div>
                        </>
                    )}
                </div>

                {/* Scroll Depth Chart */}
                <div className="scroll-depth-panel">
                    <h3>Scroll Depth</h3>
                    <p className="panel-description">How far users scroll down the page</p>

                    {scrollData.length === 0 ? (
                        <div className="no-data">No scroll data yet</div>
                    ) : (
                        <div className="scroll-bars">
                            {[0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100].map(depth => {
                                const dataPoint = scrollData.find(d => d.depth === depth);
                                const maxSessions = Math.max(...scrollData.map(d => d.sessions));
                                const percentage = dataPoint ? (dataPoint.sessions / maxSessions) * 100 : 0;

                                return (
                                    <div key={depth} className="scroll-bar-row">
                                        <span className="depth-label">{depth}%</span>
                                        <div className="bar-container">
                                            <div
                                                className="bar-fill"
                                                style={{ width: `${percentage}%` }}
                                            />
                                        </div>
                                        <span className="session-count">
                                            {dataPoint?.sessions || 0}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            {/* Device Breakdown */}
            <div className="device-breakdown">
                <h3>Device Breakdown</h3>
                <div className="device-grid">
                    {Object.entries(stats.deviceBreakdown).map(([device, count]) => {
                        const total = Object.values(stats.deviceBreakdown).reduce((a, b) => a + b, 0);
                        const percentage = (count / total) * 100;

                        return (
                            <div key={device} className="device-card">
                                <div className="device-icon">
                                    {device === 'desktop' && '🖥️'}
                                    {device === 'tablet' && '📱'}
                                    {device === 'mobile' && '📲'}
                                </div>
                                <div className="device-info">
                                    <strong>{device}</strong>
                                    <span>{count} sessions</span>
                                </div>
                                <div className="device-bar">
                                    <div
                                        className="device-bar-fill"
                                        style={{ width: `${percentage}%` }}
                                    />
                                </div>
                                <span className="device-percent">{percentage.toFixed(1)}%</span>
                            </div>
                        );
                    })}
                </div>
            </div>

            <style jsx>{`
                .heatmap-controls {
                    display: flex;
                    gap: 2rem;
                    padding: 1.5rem;
                    background: var(--color-surface);
                    border: 1px solid var(--color-border);
                    border-radius: var(--radius-lg);
                    margin-bottom: 1.5rem;
                }

                .control-group {
                    display: flex;
                    flex-direction: column;
                    gap: 0.5rem;
                }

                .control-group label {
                    font-size: 0.8rem;
                    font-weight: 500;
                    color: var(--color-foreground-muted);
                    text-transform: uppercase;
                }

                .control-group select {
                    padding: 0.5rem 1rem;
                    background: var(--color-background);
                    border: 1px solid var(--color-border);
                    border-radius: var(--radius-md);
                    color: var(--color-foreground);
                    font-size: 0.9rem;
                    min-width: 150px;
                }

                .button-group {
                    display: flex;
                    border: 1px solid var(--color-border);
                    border-radius: var(--radius-md);
                    overflow: hidden;
                }

                .button-group button {
                    padding: 0.5rem 1rem;
                    background: var(--color-background);
                    border: none;
                    border-right: 1px solid var(--color-border);
                    color: var(--color-foreground-muted);
                    font-size: 0.85rem;
                    cursor: pointer;
                    transition: all 0.15s ease;
                }

                .button-group button:last-child {
                    border-right: none;
                }

                .button-group button.active {
                    background: var(--color-accent-solid);
                    color: white;
                }

                .heatmap-container {
                    display: grid;
                    grid-template-columns: 1fr 300px;
                    gap: 1.5rem;
                }

                .heatmap-preview {
                    background: var(--color-surface);
                    border: 1px solid var(--color-border);
                    border-radius: var(--radius-lg);
                    padding: 1.5rem;
                }

                .page-frame {
                    background: var(--color-background);
                    border-radius: var(--radius-md);
                    overflow: hidden;
                    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
                }

                .page-url-bar {
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                    padding: 0.75rem 1rem;
                    background: var(--color-surface);
                    border-bottom: 1px solid var(--color-border);
                }

                .dots {
                    display: flex;
                    gap: 0.5rem;
                }

                .dot {
                    width: 12px;
                    height: 12px;
                    border-radius: 50%;
                }

                .dot.red { background: #ef4444; }
                .dot.yellow { background: #f59e0b; }
                .dot.green { background: #10b981; }

                .url {
                    font-size: 0.85rem;
                    color: var(--color-foreground-muted);
                }

                .page-content {
                    position: relative;
                    min-height: 400px;
                }

                .heatmap-canvas {
                    width: 100%;
                    height: 100%;
                }

                .heatmap-legend {
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

                .heatmap-loading,
                .heatmap-empty {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    min-height: 400px;
                    color: var(--color-foreground-muted);
                }

                .heatmap-empty svg {
                    margin-bottom: 1rem;
                    opacity: 0.3;
                }

                .heatmap-empty span {
                    font-size: 0.85rem;
                    opacity: 0.7;
                }

                .spinner {
                    width: 32px;
                    height: 32px;
                    border: 3px solid var(--color-border);
                    border-top-color: var(--color-accent-solid);
                    border-radius: 50%;
                    animation: spin 0.8s linear infinite;
                    margin-bottom: 1rem;
                }

                @keyframes spin {
                    to { transform: rotate(360deg); }
                }

                .scroll-depth-panel {
                    background: var(--color-surface);
                    border: 1px solid var(--color-border);
                    border-radius: var(--radius-lg);
                    padding: 1.5rem;
                }

                .scroll-depth-panel h3 {
                    margin: 0 0 0.25rem;
                }

                .panel-description {
                    font-size: 0.85rem;
                    color: var(--color-foreground-muted);
                    margin: 0 0 1.5rem;
                }

                .scroll-bars {
                    display: flex;
                    flex-direction: column;
                    gap: 0.5rem;
                }

                .scroll-bar-row {
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                }

                .depth-label {
                    width: 40px;
                    font-size: 0.75rem;
                    color: var(--color-foreground-muted);
                    text-align: right;
                }

                .bar-container {
                    flex: 1;
                    height: 16px;
                    background: var(--color-background);
                    border-radius: var(--radius-sm);
                    overflow: hidden;
                }

                .bar-fill {
                    height: 100%;
                    background: linear-gradient(90deg, var(--color-accent-start), var(--color-accent-end));
                    border-radius: var(--radius-sm);
                    transition: width 0.3s ease;
                }

                .session-count {
                    width: 40px;
                    font-size: 0.75rem;
                    color: var(--color-foreground-muted);
                }

                .no-data {
                    text-align: center;
                    padding: 2rem;
                    color: var(--color-foreground-muted);
                    font-size: 0.9rem;
                }

                .device-breakdown {
                    margin-top: 1.5rem;
                    padding: 1.5rem;
                    background: var(--color-surface);
                    border: 1px solid var(--color-border);
                    border-radius: var(--radius-lg);
                }

                .device-breakdown h3 {
                    margin: 0 0 1.5rem;
                }

                .device-grid {
                    display: grid;
                    grid-template-columns: repeat(3, 1fr);
                    gap: 1rem;
                }

                .device-card {
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                    padding: 1rem;
                    background: var(--color-background);
                    border-radius: var(--radius-md);
                }

                .device-icon {
                    font-size: 1.5rem;
                }

                .device-info {
                    display: flex;
                    flex-direction: column;
                }

                .device-info strong {
                    text-transform: capitalize;
                }

                .device-info span {
                    font-size: 0.8rem;
                    color: var(--color-foreground-muted);
                }

                .device-bar {
                    flex: 1;
                    height: 8px;
                    background: var(--color-surface);
                    border-radius: var(--radius-sm);
                    overflow: hidden;
                }

                .device-bar-fill {
                    height: 100%;
                    background: var(--color-accent-solid);
                    border-radius: var(--radius-sm);
                }

                .device-percent {
                    font-weight: 600;
                    font-size: 0.9rem;
                }

                @media (max-width: 1024px) {
                    .heatmap-container {
                        grid-template-columns: 1fr;
                    }

                    .device-grid {
                        grid-template-columns: 1fr;
                    }
                }
            `}</style>
        </div>
    );
}
