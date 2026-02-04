'use client';

/**
 * Leads Admin Page
 * View, filter, and manage leads captured from the site
 */

import { useState, useEffect, useCallback } from 'react';
import { AdminHeader } from '@/components/admin';
import { getLeads, updateLead, getLeadStats, type Lead } from '@/lib/heatmap';

type StatusFilter = 'all' | 'new' | 'contacted' | 'qualified' | 'converted' | 'lost' | 'spam';
type ClassificationFilter = 'all' | 'hot' | 'warm' | 'cold' | 'spam';

const STATUS_CONFIG: Record<string, { color: string; bg: string; label: string }> = {
    new: { color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.15)', label: 'New' },
    contacted: { color: '#8b5cf6', bg: 'rgba(139, 92, 246, 0.15)', label: 'Contacted' },
    qualified: { color: '#10b981', bg: 'rgba(16, 185, 129, 0.15)', label: 'Qualified' },
    converted: { color: '#059669', bg: 'rgba(5, 150, 105, 0.15)', label: 'Converted' },
    lost: { color: '#6b7280', bg: 'rgba(107, 114, 128, 0.15)', label: 'Lost' },
    spam: { color: '#ef4444', bg: 'rgba(239, 68, 68, 0.15)', label: 'Spam' }
};

const CLASSIFICATION_CONFIG: Record<string, { icon: string; color: string; label: string }> = {
    hot: { icon: '🔥', color: '#ef4444', label: 'Hot' },
    warm: { icon: '☀️', color: '#f59e0b', label: 'Warm' },
    cold: { icon: '❄️', color: '#3b82f6', label: 'Cold' },
    spam: { icon: '🚫', color: '#6b7280', label: 'Spam' }
};

export default function LeadsPage() {
    const [leads, setLeads] = useState<Lead[]>([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
    const [classificationFilter, setClassificationFilter] = useState<ClassificationFilter>('all');
    const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
    const [stats, setStats] = useState({
        total: 0,
        new: 0,
        hot: 0,
        warm: 0,
        cold: 0,
        converted: 0,
        avgScore: 0
    });

    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            const [leadsData, statsData] = await Promise.all([
                getLeads({
                    limit: 100,
                    status: statusFilter === 'all' ? undefined : statusFilter,
                    classification: classificationFilter === 'all' ? undefined : classificationFilter
                }),
                getLeadStats()
            ]);
            setLeads(leadsData);
            setStats(statsData);
        } catch (error) {
            console.error('Error loading leads:', error);
        } finally {
            setLoading(false);
        }
    }, [statusFilter, classificationFilter]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const handleStatusChange = async (lead: Lead, newStatus: string) => {
        try {
            await updateLead(lead.id, {
                status: newStatus as Lead['status'],
                contacted_at: newStatus === 'contacted' ? new Date().toISOString() : lead.contacted_at,
                converted_at: newStatus === 'converted' ? new Date().toISOString() : lead.converted_at
            });
            await loadData();
            if (selectedLead?.id === lead.id) {
                setSelectedLead({ ...lead, status: newStatus as Lead['status'] });
            }
        } catch (error) {
            console.error('Error updating lead:', error);
        }
    };

    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const formatDuration = (seconds: number) => {
        if (seconds < 60) return `${seconds}s`;
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}m ${secs}s`;
    };

    const hasData = stats.total > 0;

    return (
        <div className="admin-page">
            <AdminHeader
                title="Leads"
                subtitle="Manage and track leads captured from your site"
            />

            {/* Stats Cards */}
            <div className="stats-grid">
                <div className="stat-card primary">
                    <div className="stat-main">
                        <span className="stat-value">{stats.total}</span>
                        <span className="stat-label">Total Leads</span>
                    </div>
                    <div className="stat-icon">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                            <circle cx="9" cy="7" r="4" />
                            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                        </svg>
                    </div>
                </div>

                <div className="stat-card new">
                    <div className="stat-main">
                        <span className="stat-value">{stats.new}</span>
                        <span className="stat-label">New Leads</span>
                    </div>
                    <div className="stat-icon">🆕</div>
                </div>

                <div className="stat-card hot">
                    <div className="stat-main">
                        <span className="stat-value">{stats.hot}</span>
                        <span className="stat-label">Hot Leads</span>
                    </div>
                    <div className="stat-icon">🔥</div>
                </div>

                <div className="stat-card converted">
                    <div className="stat-main">
                        <span className="stat-value">{stats.converted}</span>
                        <span className="stat-label">Converted</span>
                    </div>
                    <div className="stat-icon">✅</div>
                </div>

                <div className="stat-card score">
                    <div className="stat-main">
                        <span className="stat-value">{stats.avgScore.toFixed(0)}</span>
                        <span className="stat-label">Avg AI Score</span>
                    </div>
                    <div className="stat-icon">🧠</div>
                </div>
            </div>

            {!hasData ? (
                /* Empty State */
                <div className="empty-state-container">
                    <div className="empty-state">
                        <div className="empty-icon">
                            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                                <circle cx="9" cy="7" r="4" />
                                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                            </svg>
                        </div>
                        <h3>No Leads Yet</h3>
                        <p>
                            Lead capture is active on your site. When visitors interact with the
                            popup or submit forms, leads will appear here with AI scoring.
                        </p>
                        <div className="empty-actions">
                            <button
                                className="btn-primary"
                                onClick={async () => {
                                    try {
                                        const testLead = {
                                            email: `test-${Date.now()}@example.com`,
                                            name: 'Test Lead',
                                            company: 'Test Company',
                                            source: 'manual_test',
                                            sourcePage: '/admin/leads',
                                            sessionId: 'test-session'
                                        };
                                        const response = await fetch('/api/leads', {
                                            method: 'POST',
                                            headers: { 'Content-Type': 'application/json' },
                                            body: JSON.stringify(testLead)
                                        });
                                        if (response.ok) {
                                            loadData();
                                        } else {
                                            const err = await response.json();
                                            alert('Error: ' + (err.error || 'Failed to create test lead'));
                                        }
                                    } catch (error) {
                                        console.error('Test lead error:', error);
                                        alert('Failed to create test lead');
                                    }
                                }}
                            >
                                ➕ Create Test Lead
                            </button>
                            <a
                                href="/"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="btn-secondary"
                            >
                                🔗 Visit Site (trigger popup)
                            </a>
                        </div>
                        <p className="empty-hint" style={{ marginTop: '1.5rem', opacity: 0.6, fontSize: '0.875rem' }}>
                            💡 The lead capture popup appears when visitors try to leave the page (exit intent).
                        </p>
                    </div>
                </div>
            ) : (
                <>
                    {/* Filters */}
                    <div className="filters-bar">
                        <div className="filter-group">
                            <label>Status</label>
                            <div className="filter-pills">
                                {(['all', 'new', 'contacted', 'qualified', 'converted', 'lost'] as StatusFilter[]).map(status => (
                                    <button
                                        key={status}
                                        className={statusFilter === status ? 'active' : ''}
                                        onClick={() => setStatusFilter(status)}
                                    >
                                        {status === 'all' ? 'All' : STATUS_CONFIG[status]?.label || status}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="filter-group">
                            <label>Classification</label>
                            <div className="filter-pills">
                                {(['all', 'hot', 'warm', 'cold'] as ClassificationFilter[]).map(classification => (
                                    <button
                                        key={classification}
                                        className={classificationFilter === classification ? 'active' : ''}
                                        onClick={() => setClassificationFilter(classification)}
                                    >
                                        {classification === 'all' ? 'All' : (
                                            <>
                                                {CLASSIFICATION_CONFIG[classification]?.icon} {CLASSIFICATION_CONFIG[classification]?.label}
                                            </>
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Leads Layout */}
                    <div className="leads-layout">
                        {/* Leads List */}
                        <div className="leads-list">
                            {loading ? (
                                <div className="loading-state">
                                    <div className="spinner" />
                                    <span>Loading leads...</span>
                                </div>
                            ) : leads.length === 0 ? (
                                <div className="no-results">
                                    <p>No leads match your filters</p>
                                    <button onClick={() => {
                                        setStatusFilter('all');
                                        setClassificationFilter('all');
                                    }}>
                                        Clear filters
                                    </button>
                                </div>
                            ) : (
                                leads.map(lead => {
                                    const classification = lead.ai_classification;
                                    const classConfig = classification ? CLASSIFICATION_CONFIG[classification] : null;
                                    const statusConfig = STATUS_CONFIG[lead.status];

                                    return (
                                        <div
                                            key={lead.id}
                                            className={`lead-card ${selectedLead?.id === lead.id ? 'selected' : ''}`}
                                            onClick={() => setSelectedLead(lead)}
                                        >
                                            <div className="lead-header">
                                                <div className="lead-identity">
                                                    <div className="lead-avatar">
                                                        {(lead.name || lead.email || '?')[0].toUpperCase()}
                                                    </div>
                                                    <div className="lead-info">
                                                        <span className="lead-name">
                                                            {lead.name || lead.email || 'Anonymous'}
                                                        </span>
                                                        {lead.company && (
                                                            <span className="lead-company">{lead.company}</span>
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="lead-badges">
                                                    {classConfig && (
                                                        <span
                                                            className="badge classification"
                                                            style={{ color: classConfig.color }}
                                                        >
                                                            {classConfig.icon}
                                                        </span>
                                                    )}
                                                    <span
                                                        className="badge status"
                                                        style={{
                                                            color: statusConfig?.color,
                                                            background: statusConfig?.bg
                                                        }}
                                                    >
                                                        {statusConfig?.label}
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="lead-meta">
                                                {lead.ai_score !== null && (
                                                    <span className="score">
                                                        Score: {lead.ai_score}
                                                    </span>
                                                )}
                                                <span className="source">{lead.source}</span>
                                                <span className="date">{formatDate(lead.created_at)}</span>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>

                        {/* Lead Detail Panel */}
                        <div className={`lead-detail ${selectedLead ? 'open' : ''}`}>
                            {selectedLead ? (
                                <>
                                    <div className="detail-header">
                                        <button
                                            className="close-detail"
                                            onClick={() => setSelectedLead(null)}
                                        >
                                            ✕
                                        </button>
                                        <div className="detail-avatar">
                                            {(selectedLead.name || selectedLead.email || '?')[0].toUpperCase()}
                                        </div>
                                        <h2>{selectedLead.name || 'Anonymous Lead'}</h2>
                                        {selectedLead.company && (
                                            <span className="company">{selectedLead.company}</span>
                                        )}
                                    </div>

                                    <div className="detail-section">
                                        <h3>Contact Info</h3>
                                        <div className="info-grid">
                                            {selectedLead.email && (
                                                <div className="info-item">
                                                    <span className="info-label">Email</span>
                                                    <a href={`mailto:${selectedLead.email}`} className="info-value link">
                                                        {selectedLead.email}
                                                    </a>
                                                </div>
                                            )}
                                            {selectedLead.phone && (
                                                <div className="info-item">
                                                    <span className="info-label">Phone</span>
                                                    <a href={`tel:${selectedLead.phone}`} className="info-value link">
                                                        {selectedLead.phone}
                                                    </a>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="detail-section">
                                        <h3>AI Analysis</h3>
                                        <div className="ai-analysis">
                                            {selectedLead.ai_score !== null && (
                                                <div className="score-display">
                                                    <div className="score-circle">
                                                        <span className="score-value">{selectedLead.ai_score}</span>
                                                        <span className="score-label">Score</span>
                                                    </div>
                                                    {selectedLead.ai_classification && (
                                                        <div
                                                            className="classification-display"
                                                            style={{
                                                                color: CLASSIFICATION_CONFIG[selectedLead.ai_classification]?.color
                                                            }}
                                                        >
                                                            {CLASSIFICATION_CONFIG[selectedLead.ai_classification]?.icon}
                                                            <span>{CLASSIFICATION_CONFIG[selectedLead.ai_classification]?.label}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                            {selectedLead.ai_summary && (
                                                <p className="ai-summary">{selectedLead.ai_summary}</p>
                                            )}
                                            {selectedLead.ai_score_reasons && selectedLead.ai_score_reasons.length > 0 && (
                                                <ul className="score-reasons">
                                                    {selectedLead.ai_score_reasons.map((reason, idx) => (
                                                        <li key={idx}>{reason}</li>
                                                    ))}
                                                </ul>
                                            )}
                                        </div>
                                    </div>

                                    <div className="detail-section">
                                        <h3>Behavior</h3>
                                        <div className="behavior-stats">
                                            <div className="behavior-item">
                                                <span className="behavior-value">{selectedLead.pages_viewed}</span>
                                                <span className="behavior-label">Pages Viewed</span>
                                            </div>
                                            <div className="behavior-item">
                                                <span className="behavior-value">{formatDuration(selectedLead.time_on_site_seconds)}</span>
                                                <span className="behavior-label">Time on Site</span>
                                            </div>
                                            <div className="behavior-item">
                                                <span className="behavior-value">{selectedLead.blog_posts_read}</span>
                                                <span className="behavior-label">Posts Read</span>
                                            </div>
                                            <div className="behavior-item">
                                                <span className="behavior-value">{selectedLead.scroll_depth_avg}%</span>
                                                <span className="behavior-label">Avg Scroll</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="detail-section">
                                        <h3>Status</h3>
                                        <div className="status-selector">
                                            {Object.entries(STATUS_CONFIG).map(([status, config]) => (
                                                <button
                                                    key={status}
                                                    className={selectedLead.status === status ? 'active' : ''}
                                                    style={{
                                                        '--status-color': config.color,
                                                        '--status-bg': config.bg
                                                    } as React.CSSProperties}
                                                    onClick={() => handleStatusChange(selectedLead, status)}
                                                >
                                                    {config.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="detail-section">
                                        <h3>Source</h3>
                                        <div className="source-info">
                                            <div className="source-item">
                                                <span className="source-label">Source</span>
                                                <span className="source-value">{selectedLead.source}</span>
                                            </div>
                                            {selectedLead.source_page && (
                                                <div className="source-item">
                                                    <span className="source-label">Page</span>
                                                    <span className="source-value">{selectedLead.source_page}</span>
                                                </div>
                                            )}
                                            {selectedLead.utm_source && (
                                                <div className="source-item">
                                                    <span className="source-label">Campaign</span>
                                                    <span className="source-value">
                                                        {selectedLead.utm_source}
                                                        {selectedLead.utm_medium && ` / ${selectedLead.utm_medium}`}
                                                        {selectedLead.utm_campaign && ` / ${selectedLead.utm_campaign}`}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <div className="no-selection">
                                    <p>Select a lead to view details</p>
                                </div>
                            )}
                        </div>
                    </div>
                </>
            )}

            <style jsx>{`
                .stats-grid {
                    display: grid;
                    grid-template-columns: repeat(5, 1fr);
                    gap: 1rem;
                    margin-bottom: 1.5rem;
                }

                .stat-card {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 1.25rem;
                    background: var(--color-surface);
                    border: 1px solid var(--color-border);
                    border-radius: var(--radius-lg);
                }

                .stat-main {
                    display: flex;
                    flex-direction: column;
                }

                .stat-value {
                    font-size: 2rem;
                    font-weight: 700;
                    line-height: 1.2;
                }

                .stat-label {
                    font-size: 0.8rem;
                    color: var(--color-foreground-muted);
                }

                .stat-icon {
                    font-size: 1.5rem;
                    opacity: 0.5;
                }

                .stat-card.primary .stat-value { color: var(--color-accent-solid); }
                .stat-card.new .stat-value { color: #3b82f6; }
                .stat-card.hot .stat-value { color: #ef4444; }
                .stat-card.converted .stat-value { color: #10b981; }
                .stat-card.score .stat-value { color: #8b5cf6; }

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

                .empty-actions {
                    display: flex;
                    gap: 1rem;
                    justify-content: center;
                    flex-wrap: wrap;
                }

                .empty-actions .btn-primary,
                .empty-actions .btn-secondary {
                    display: inline-flex;
                    align-items: center;
                    gap: 0.5rem;
                    padding: 0.75rem 1.5rem;
                    border-radius: var(--radius-md);
                    font-weight: 500;
                    text-decoration: none;
                    cursor: pointer;
                    transition: all 0.2s ease;
                }

                .empty-actions .btn-primary {
                    background: var(--color-accent-gradient);
                    color: var(--color-background);
                    border: none;
                }

                .empty-actions .btn-primary:hover {
                    box-shadow: var(--shadow-glow);
                    transform: translateY(-1px);
                }

                .empty-actions .btn-secondary {
                    background: var(--color-surface);
                    color: var(--color-foreground);
                    border: 1px solid var(--color-border);
                }

                .empty-actions .btn-secondary:hover {
                    background: var(--color-surface-hover);
                    border-color: var(--color-border-hover);
                }

                .filters-bar {
                    display: flex;
                    gap: 2rem;
                    padding: 1rem 1.25rem;
                    background: var(--color-surface);
                    border: 1px solid var(--color-border);
                    border-radius: var(--radius-lg);
                    margin-bottom: 1.5rem;
                    flex-wrap: wrap;
                }

                .filter-group label {
                    display: block;
                    font-size: 0.75rem;
                    font-weight: 600;
                    text-transform: uppercase;
                    color: var(--color-foreground-muted);
                    margin-bottom: 0.5rem;
                }

                .filter-pills {
                    display: flex;
                    gap: 0.375rem;
                    flex-wrap: wrap;
                }

                .filter-pills button {
                    padding: 0.375rem 0.75rem;
                    background: var(--color-background);
                    border: 1px solid var(--color-border);
                    border-radius: var(--radius-md);
                    font-size: 0.8rem;
                    cursor: pointer;
                    transition: all 0.15s;
                }

                .filter-pills button.active {
                    background: var(--color-accent-gradient);
                    border-color: transparent;
                    color: white;
                }

                .leads-layout {
                    display: grid;
                    grid-template-columns: 1fr 400px;
                    gap: 1.5rem;
                }

                .leads-list {
                    background: var(--color-surface);
                    border: 1px solid var(--color-border);
                    border-radius: var(--radius-lg);
                    padding: 1rem;
                    max-height: 70vh;
                    overflow-y: auto;
                }

                .loading-state, .no-results {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    gap: 1rem;
                    padding: 3rem;
                    color: var(--color-foreground-muted);
                }

                .spinner {
                    width: 24px;
                    height: 24px;
                    border: 3px solid var(--color-border);
                    border-top-color: var(--color-accent-solid);
                    border-radius: 50%;
                    animation: spin 0.8s linear infinite;
                }

                @keyframes spin {
                    to { transform: rotate(360deg); }
                }

                .no-results button {
                    padding: 0.5rem 1rem;
                    background: var(--color-background);
                    border: 1px solid var(--color-border);
                    border-radius: var(--radius-md);
                    cursor: pointer;
                }

                .lead-card {
                    padding: 1rem;
                    background: var(--color-background);
                    border: 1px solid var(--color-border);
                    border-radius: var(--radius-md);
                    margin-bottom: 0.5rem;
                    cursor: pointer;
                    transition: all 0.15s;
                }

                .lead-card:hover {
                    border-color: var(--color-border-hover);
                }

                .lead-card.selected {
                    border-color: var(--color-accent-solid);
                    box-shadow: 0 0 0 1px var(--color-accent-solid);
                }

                .lead-header {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    margin-bottom: 0.5rem;
                }

                .lead-identity {
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                }

                .lead-avatar {
                    width: 36px;
                    height: 36px;
                    border-radius: 50%;
                    background: var(--color-accent-gradient);
                    color: white;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-weight: 600;
                    font-size: 0.9rem;
                }

                .lead-info {
                    display: flex;
                    flex-direction: column;
                }

                .lead-name {
                    font-weight: 500;
                }

                .lead-company {
                    font-size: 0.8rem;
                    color: var(--color-foreground-muted);
                }

                .lead-badges {
                    display: flex;
                    gap: 0.5rem;
                }

                .badge {
                    padding: 0.25rem 0.5rem;
                    border-radius: var(--radius-sm);
                    font-size: 0.75rem;
                    font-weight: 500;
                }

                .badge.status {
                    background: var(--color-surface);
                }

                .badge.classification {
                    font-size: 1rem;
                }

                .lead-meta {
                    display: flex;
                    gap: 1rem;
                    font-size: 0.8rem;
                    color: var(--color-foreground-muted);
                }

                .lead-meta .score {
                    color: #8b5cf6;
                    font-weight: 500;
                }

                /* Lead Detail Panel */
                .lead-detail {
                    background: var(--color-surface);
                    border: 1px solid var(--color-border);
                    border-radius: var(--radius-lg);
                    padding: 1.5rem;
                    height: fit-content;
                    position: sticky;
                    top: 1rem;
                }

                .no-selection {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    min-height: 300px;
                    color: var(--color-foreground-muted);
                }

                .detail-header {
                    text-align: center;
                    margin-bottom: 1.5rem;
                    position: relative;
                }

                .close-detail {
                    position: absolute;
                    top: 0;
                    right: 0;
                    background: none;
                    border: none;
                    font-size: 1.25rem;
                    color: var(--color-foreground-muted);
                    cursor: pointer;
                }

                .detail-avatar {
                    width: 64px;
                    height: 64px;
                    border-radius: 50%;
                    background: var(--color-accent-gradient);
                    color: white;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-weight: 600;
                    font-size: 1.5rem;
                    margin: 0 auto 0.75rem;
                }

                .detail-header h2 {
                    margin: 0 0 0.25rem;
                    font-size: 1.25rem;
                }

                .detail-header .company {
                    color: var(--color-foreground-muted);
                    font-size: 0.9rem;
                }

                .detail-section {
                    margin-bottom: 1.5rem;
                    padding-bottom: 1.5rem;
                    border-bottom: 1px solid var(--color-border);
                }

                .detail-section:last-child {
                    margin-bottom: 0;
                    padding-bottom: 0;
                    border-bottom: none;
                }

                .detail-section h3 {
                    font-size: 0.75rem;
                    font-weight: 600;
                    text-transform: uppercase;
                    color: var(--color-foreground-muted);
                    margin: 0 0 0.75rem;
                }

                .info-grid {
                    display: flex;
                    flex-direction: column;
                    gap: 0.5rem;
                }

                .info-item {
                    display: flex;
                    flex-direction: column;
                    gap: 0.125rem;
                }

                .info-label {
                    font-size: 0.75rem;
                    color: var(--color-foreground-muted);
                }

                .info-value {
                    font-size: 0.9rem;
                }

                .info-value.link {
                    color: var(--color-accent-solid);
                    text-decoration: none;
                }

                .ai-analysis {
                    display: flex;
                    flex-direction: column;
                    gap: 0.75rem;
                }

                .score-display {
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                }

                .score-circle {
                    width: 60px;
                    height: 60px;
                    border-radius: 50%;
                    background: linear-gradient(135deg, #8b5cf6, #6366f1);
                    color: white;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                }

                .score-value {
                    font-size: 1.25rem;
                    font-weight: 700;
                    line-height: 1.2;
                }

                .score-label {
                    font-size: 0.6rem;
                    text-transform: uppercase;
                    opacity: 0.8;
                }

                .classification-display {
                    display: flex;
                    align-items: center;
                    gap: 0.375rem;
                    font-size: 1.25rem;
                    font-weight: 600;
                }

                .ai-summary {
                    font-size: 0.9rem;
                    color: var(--color-foreground-muted);
                    line-height: 1.5;
                    margin: 0;
                }

                .score-reasons {
                    margin: 0;
                    padding-left: 1.25rem;
                    font-size: 0.85rem;
                    color: var(--color-foreground-muted);
                }

                .score-reasons li {
                    margin-bottom: 0.25rem;
                }

                .behavior-stats {
                    display: grid;
                    grid-template-columns: repeat(2, 1fr);
                    gap: 0.75rem;
                }

                .behavior-item {
                    display: flex;
                    flex-direction: column;
                    padding: 0.75rem;
                    background: var(--color-background);
                    border-radius: var(--radius-md);
                    text-align: center;
                }

                .behavior-value {
                    font-size: 1.25rem;
                    font-weight: 700;
                }

                .behavior-label {
                    font-size: 0.7rem;
                    color: var(--color-foreground-muted);
                }

                .status-selector {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 0.375rem;
                }

                .status-selector button {
                    padding: 0.375rem 0.75rem;
                    border: 1px solid var(--color-border);
                    border-radius: var(--radius-md);
                    background: var(--color-background);
                    font-size: 0.8rem;
                    cursor: pointer;
                    transition: all 0.15s;
                }

                .status-selector button.active {
                    background: var(--status-bg);
                    border-color: var(--status-color);
                    color: var(--status-color);
                }

                .source-info {
                    display: flex;
                    flex-direction: column;
                    gap: 0.5rem;
                }

                .source-item {
                    display: flex;
                    flex-direction: column;
                    gap: 0.125rem;
                }

                .source-label {
                    font-size: 0.7rem;
                    color: var(--color-foreground-muted);
                }

                .source-value {
                    font-size: 0.85rem;
                }

                @media (max-width: 1024px) {
                    .stats-grid {
                        grid-template-columns: repeat(3, 1fr);
                    }

                    .leads-layout {
                        grid-template-columns: 1fr;
                    }

                    .lead-detail {
                        position: fixed;
                        bottom: 0;
                        left: 0;
                        right: 0;
                        max-height: 60vh;
                        border-radius: var(--radius-lg) var(--radius-lg) 0 0;
                        transform: translateY(100%);
                        transition: transform 0.3s ease;
                        overflow-y: auto;
                    }

                    .lead-detail.open {
                        transform: translateY(0);
                    }
                }

                @media (max-width: 640px) {
                    .stats-grid {
                        grid-template-columns: repeat(2, 1fr);
                    }
                }
            `}</style>
        </div>
    );
}
