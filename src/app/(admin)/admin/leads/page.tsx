'use client';

/**
 * Leads Admin Page
 * View and manage captured leads with AI scoring
 */

import { useState, useEffect, useCallback } from 'react';
import { AdminHeader } from '@/components/admin';
import { getLeads, updateLead, getLeadStats, type Lead } from '@/lib/heatmap';
import { format } from 'date-fns';

type LeadFilter = 'all' | 'hot' | 'warm' | 'cold' | 'new';
type StatusFilter = 'all' | 'new' | 'contacted' | 'qualified' | 'converted' | 'lost';

export default function LeadsPage() {
    const [leads, setLeads] = useState<Lead[]>([]);
    const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
    const [loading, setLoading] = useState(true);
    const [classificationFilter, setClassificationFilter] = useState<LeadFilter>('all');
    const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
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

        const [leadsData, statsData] = await Promise.all([
            getLeads({
                limit: 100,
                classification: classificationFilter === 'all' ? undefined : classificationFilter,
                status: statusFilter === 'all' ? undefined : statusFilter
            }),
            getLeadStats()
        ]);

        setLeads(leadsData);
        setStats(statsData);
        setLoading(false);
    }, [classificationFilter, statusFilter]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const handleStatusChange = async (lead: Lead, newStatus: Lead['status']) => {
        const updatedLead = await updateLead(lead.id, {
            status: newStatus,
            contacted_at: newStatus === 'contacted' ? new Date().toISOString() : lead.contacted_at,
            converted_at: newStatus === 'converted' ? new Date().toISOString() : lead.converted_at
        });

        if (updatedLead) {
            setLeads(prev => prev.map(l => l.id === lead.id ? updatedLead : l));
            if (selectedLead?.id === lead.id) {
                setSelectedLead(updatedLead);
            }
        }
    };

    const getClassificationColor = (classification: string | null) => {
        switch (classification) {
            case 'hot': return '#ef4444';
            case 'warm': return '#f59e0b';
            case 'cold': return '#3b82f6';
            default: return '#6b7280';
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'new': return '#8b5cf6';
            case 'contacted': return '#3b82f6';
            case 'qualified': return '#f59e0b';
            case 'converted': return '#10b981';
            case 'lost': return '#ef4444';
            default: return '#6b7280';
        }
    };

    const getScoreGradient = (score: number) => {
        if (score >= 80) return 'linear-gradient(90deg, #ef4444, #f97316)';
        if (score >= 60) return 'linear-gradient(90deg, #f59e0b, #eab308)';
        if (score >= 40) return 'linear-gradient(90deg, #3b82f6, #6366f1)';
        return 'linear-gradient(90deg, #6b7280, #9ca3af)';
    };

    return (
        <div className="admin-page">
            <AdminHeader
                title="Leads"
                subtitle="View and manage captured leads with AI scoring"
            />

            {/* Stats Cards */}
            <div className="admin-panel-stats" style={{ marginBottom: '2rem' }}>
                <div className="stat-card clickable" onClick={() => setClassificationFilter('all')}>
                    <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #8b5cf6, #6366f1)' }}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                            <circle cx="9" cy="7" r="4" />
                            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                        </svg>
                    </div>
                    <div className="stat-content">
                        <span className="stat-value">{stats.total}</span>
                        <span className="stat-label">Total Leads</span>
                    </div>
                </div>

                <div className="stat-card clickable" onClick={() => setClassificationFilter('hot')}>
                    <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #ef4444, #dc2626)' }}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M12 2v20M2 12h20" />
                        </svg>
                    </div>
                    <div className="stat-content">
                        <span className="stat-value">{stats.hot}</span>
                        <span className="stat-label">Hot Leads</span>
                    </div>
                </div>

                <div className="stat-card clickable" onClick={() => setClassificationFilter('warm')}>
                    <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M12 2v20M2 12h20" />
                        </svg>
                    </div>
                    <div className="stat-content">
                        <span className="stat-value">{stats.warm}</span>
                        <span className="stat-label">Warm Leads</span>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="20 6 9 17 4 12" />
                        </svg>
                    </div>
                    <div className="stat-content">
                        <span className="stat-value">{stats.converted}</span>
                        <span className="stat-label">Converted</span>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="leads-filters">
                <div className="filter-group">
                    <label>Classification</label>
                    <select
                        value={classificationFilter}
                        onChange={(e) => setClassificationFilter(e.target.value as LeadFilter)}
                    >
                        <option value="all">All Classifications</option>
                        <option value="hot">🔥 Hot</option>
                        <option value="warm">🌡️ Warm</option>
                        <option value="cold">❄️ Cold</option>
                    </select>
                </div>

                <div className="filter-group">
                    <label>Status</label>
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
                    >
                        <option value="all">All Statuses</option>
                        <option value="new">New</option>
                        <option value="contacted">Contacted</option>
                        <option value="qualified">Qualified</option>
                        <option value="converted">Converted</option>
                        <option value="lost">Lost</option>
                    </select>
                </div>

                <div className="filter-stats">
                    <span>Avg Score: <strong>{stats.avgScore.toFixed(0)}</strong></span>
                </div>
            </div>

            {/* Leads Table */}
            <div className="leads-container">
                <div className="leads-list">
                    {loading ? (
                        <div className="leads-loading">Loading leads...</div>
                    ) : leads.length === 0 ? (
                        <div className="leads-empty">
                            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                                <circle cx="9" cy="7" r="4" />
                            </svg>
                            <p>No leads yet</p>
                            <span>Leads captured from your site will appear here</span>
                        </div>
                    ) : (
                        <table className="leads-table">
                            <thead>
                                <tr>
                                    <th>Score</th>
                                    <th>Contact</th>
                                    <th>Source</th>
                                    <th>Behavior</th>
                                    <th>Status</th>
                                    <th>Date</th>
                                </tr>
                            </thead>
                            <tbody>
                                {leads.map(lead => (
                                    <tr
                                        key={lead.id}
                                        className={selectedLead?.id === lead.id ? 'selected' : ''}
                                        onClick={() => setSelectedLead(lead)}
                                    >
                                        <td>
                                            <div className="score-cell">
                                                <div
                                                    className="score-badge"
                                                    style={{ background: getScoreGradient(lead.ai_score || 0) }}
                                                >
                                                    {lead.ai_score || 0}
                                                </div>
                                                <span
                                                    className="classification"
                                                    style={{ color: getClassificationColor(lead.ai_classification) }}
                                                >
                                                    {lead.ai_classification || 'unscored'}
                                                </span>
                                            </div>
                                        </td>
                                        <td>
                                            <div className="contact-cell">
                                                <strong>{lead.email}</strong>
                                                {lead.name && <span>{lead.name}</span>}
                                                {lead.company && <span className="company">{lead.company}</span>}
                                            </div>
                                        </td>
                                        <td>
                                            <div className="source-cell">
                                                <span className="source-badge">{lead.source}</span>
                                                {lead.source_page && (
                                                    <span className="source-page">{lead.source_page}</span>
                                                )}
                                            </div>
                                        </td>
                                        <td>
                                            <div className="behavior-cell">
                                                <span title="Pages viewed">📄 {lead.pages_viewed}</span>
                                                <span title="Time on site">{Math.floor(lead.time_on_site_seconds / 60)}m</span>
                                                <span title="Scroll depth">⬇️ {lead.scroll_depth_avg}%</span>
                                            </div>
                                        </td>
                                        <td>
                                            <span
                                                className="status-badge"
                                                style={{
                                                    background: `${getStatusColor(lead.status)}20`,
                                                    color: getStatusColor(lead.status)
                                                }}
                                            >
                                                {lead.status}
                                            </span>
                                        </td>
                                        <td>
                                            <span className="date-cell">
                                                {format(new Date(lead.created_at), 'MMM d, yyyy')}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>

                {/* Lead Detail Panel */}
                {selectedLead && (
                    <div className="lead-detail">
                        <div className="detail-header">
                            <div className="detail-score">
                                <div
                                    className="score-circle"
                                    style={{
                                        background: getScoreGradient(selectedLead.ai_score || 0),
                                        boxShadow: `0 0 30px ${getClassificationColor(selectedLead.ai_classification)}40`
                                    }}
                                >
                                    {selectedLead.ai_score || 0}
                                </div>
                                <span
                                    className="classification-label"
                                    style={{ color: getClassificationColor(selectedLead.ai_classification) }}
                                >
                                    {selectedLead.ai_classification?.toUpperCase() || 'UNSCORED'}
                                </span>
                            </div>
                            <button
                                className="close-btn"
                                onClick={() => setSelectedLead(null)}
                            >
                                ✕
                            </button>
                        </div>

                        <div className="detail-info">
                            <h3>{selectedLead.email}</h3>
                            {selectedLead.name && <p className="name">{selectedLead.name}</p>}
                            {selectedLead.company && <p className="company">{selectedLead.company}</p>}
                            {selectedLead.phone && <p className="phone">{selectedLead.phone}</p>}
                        </div>

                        <div className="detail-section">
                            <h4>AI Scoring Reasons</h4>
                            <ul className="scoring-reasons">
                                {(selectedLead.ai_score_reasons || []).map((reason, idx) => (
                                    <li key={idx}>{reason}</li>
                                ))}
                            </ul>
                        </div>

                        <div className="detail-section">
                            <h4>Behavior Signals</h4>
                            <div className="behavior-grid">
                                <div className="behavior-item">
                                    <span className="behavior-value">{selectedLead.pages_viewed}</span>
                                    <span className="behavior-label">Pages Viewed</span>
                                </div>
                                <div className="behavior-item">
                                    <span className="behavior-value">{Math.floor(selectedLead.time_on_site_seconds / 60)}m</span>
                                    <span className="behavior-label">Time on Site</span>
                                </div>
                                <div className="behavior-item">
                                    <span className="behavior-value">{selectedLead.scroll_depth_avg}%</span>
                                    <span className="behavior-label">Scroll Depth</span>
                                </div>
                                <div className="behavior-item">
                                    <span className="behavior-value">{selectedLead.blog_posts_read}</span>
                                    <span className="behavior-label">Posts Read</span>
                                </div>
                            </div>
                        </div>

                        <div className="detail-section">
                            <h4>Update Status</h4>
                            <div className="status-buttons">
                                {(['new', 'contacted', 'qualified', 'converted', 'lost'] as const).map(status => (
                                    <button
                                        key={status}
                                        className={selectedLead.status === status ? 'active' : ''}
                                        style={{
                                            borderColor: selectedLead.status === status ? getStatusColor(status) : undefined,
                                            background: selectedLead.status === status ? `${getStatusColor(status)}20` : undefined
                                        }}
                                        onClick={() => handleStatusChange(selectedLead, status)}
                                    >
                                        {status}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="detail-section">
                            <h4>Source</h4>
                            <p className="source-info">
                                <span>Source: {selectedLead.source}</span>
                                {selectedLead.source_page && <span>Page: {selectedLead.source_page}</span>}
                                {selectedLead.referrer && <span>Referrer: {selectedLead.referrer}</span>}
                                {selectedLead.utm_source && <span>UTM: {selectedLead.utm_source}</span>}
                            </p>
                        </div>

                        <div className="detail-footer">
                            <span>Created: {format(new Date(selectedLead.created_at), 'PPpp')}</span>
                            {selectedLead.contacted_at && (
                                <span>Contacted: {format(new Date(selectedLead.contacted_at), 'PPpp')}</span>
                            )}
                        </div>
                    </div>
                )}
            </div>

            <style jsx>{`
                .leads-filters {
                    display: flex;
                    gap: 1.5rem;
                    align-items: flex-end;
                    padding: 1rem 1.5rem;
                    background: var(--color-surface);
                    border: 1px solid var(--color-border);
                    border-radius: var(--radius-lg);
                    margin-bottom: 1.5rem;
                }

                .filter-group {
                    display: flex;
                    flex-direction: column;
                    gap: 0.5rem;
                }

                .filter-group label {
                    font-size: 0.8rem;
                    font-weight: 500;
                    color: var(--color-foreground-muted);
                }

                .filter-group select {
                    padding: 0.5rem 1rem;
                    background: var(--color-background);
                    border: 1px solid var(--color-border);
                    border-radius: var(--radius-md);
                    color: var(--color-foreground);
                    min-width: 180px;
                }

                .filter-stats {
                    margin-left: auto;
                    color: var(--color-foreground-muted);
                }

                .leads-container {
                    display: grid;
                    grid-template-columns: 1fr 380px;
                    gap: 1.5rem;
                }

                .leads-list {
                    background: var(--color-surface);
                    border: 1px solid var(--color-border);
                    border-radius: var(--radius-lg);
                    overflow: hidden;
                }

                .leads-table {
                    width: 100%;
                    border-collapse: collapse;
                }

                .leads-table th {
                    text-align: left;
                    padding: 1rem;
                    font-size: 0.75rem;
                    text-transform: uppercase;
                    color: var(--color-foreground-muted);
                    border-bottom: 1px solid var(--color-border);
                    background: var(--color-background);
                }

                .leads-table td {
                    padding: 1rem;
                    border-bottom: 1px solid var(--color-border);
                    vertical-align: middle;
                }

                .leads-table tr {
                    cursor: pointer;
                    transition: background 0.15s ease;
                }

                .leads-table tr:hover {
                    background: var(--color-background);
                }

                .leads-table tr.selected {
                    background: rgba(139, 92, 246, 0.1);
                }

                .score-cell {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                }

                .score-badge {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    width: 36px;
                    height: 36px;
                    border-radius: var(--radius-md);
                    color: white;
                    font-weight: 700;
                    font-size: 0.85rem;
                }

                .classification {
                    font-size: 0.75rem;
                    font-weight: 600;
                    text-transform: uppercase;
                }

                .contact-cell {
                    display: flex;
                    flex-direction: column;
                    gap: 0.125rem;
                }

                .contact-cell strong {
                    font-size: 0.9rem;
                }

                .contact-cell span {
                    font-size: 0.8rem;
                    color: var(--color-foreground-muted);
                }

                .contact-cell .company {
                    color: var(--color-accent-solid);
                }

                .source-cell {
                    display: flex;
                    flex-direction: column;
                    gap: 0.25rem;
                }

                .source-badge {
                    display: inline-block;
                    padding: 0.125rem 0.5rem;
                    background: var(--color-background);
                    border-radius: var(--radius-sm);
                    font-size: 0.75rem;
                    width: fit-content;
                }

                .source-page {
                    font-size: 0.75rem;
                    color: var(--color-foreground-muted);
                }

                .behavior-cell {
                    display: flex;
                    gap: 0.75rem;
                    font-size: 0.8rem;
                    color: var(--color-foreground-muted);
                }

                .status-badge {
                    padding: 0.25rem 0.75rem;
                    border-radius: var(--radius-full);
                    font-size: 0.75rem;
                    font-weight: 500;
                    text-transform: capitalize;
                }

                .date-cell {
                    font-size: 0.8rem;
                    color: var(--color-foreground-muted);
                }

                .leads-loading,
                .leads-empty {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    padding: 4rem;
                    color: var(--color-foreground-muted);
                }

                .leads-empty svg {
                    opacity: 0.3;
                    margin-bottom: 1rem;
                }

                .lead-detail {
                    background: var(--color-surface);
                    border: 1px solid var(--color-border);
                    border-radius: var(--radius-lg);
                    padding: 1.5rem;
                    height: fit-content;
                    position: sticky;
                    top: 1rem;
                }

                .detail-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                    margin-bottom: 1.5rem;
                }

                .detail-score {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 0.5rem;
                }

                .score-circle {
                    width: 80px;
                    height: 80px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 1.75rem;
                    font-weight: 700;
                    color: white;
                }

                .classification-label {
                    font-size: 0.75rem;
                    font-weight: 700;
                    letter-spacing: 0.05em;
                }

                .close-btn {
                    background: transparent;
                    border: none;
                    color: var(--color-foreground-muted);
                    font-size: 1.25rem;
                    cursor: pointer;
                    padding: 0.25rem;
                }

                .detail-info {
                    text-align: center;
                    margin-bottom: 1.5rem;
                    padding-bottom: 1.5rem;
                    border-bottom: 1px solid var(--color-border);
                }

                .detail-info h3 {
                    margin: 0 0 0.25rem;
                    font-size: 1.1rem;
                }

                .detail-info p {
                    margin: 0;
                    font-size: 0.9rem;
                    color: var(--color-foreground-muted);
                }

                .detail-section {
                    margin-bottom: 1.5rem;
                }

                .detail-section h4 {
                    margin: 0 0 0.75rem;
                    font-size: 0.8rem;
                    text-transform: uppercase;
                    color: var(--color-foreground-muted);
                }

                .scoring-reasons {
                    list-style: none;
                    padding: 0;
                    margin: 0;
                }

                .scoring-reasons li {
                    padding: 0.5rem 0;
                    font-size: 0.85rem;
                    border-bottom: 1px solid var(--color-border);
                }

                .scoring-reasons li:last-child {
                    border-bottom: none;
                }

                .behavior-grid {
                    display: grid;
                    grid-template-columns: repeat(2, 1fr);
                    gap: 1rem;
                }

                .behavior-item {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    padding: 1rem;
                    background: var(--color-background);
                    border-radius: var(--radius-md);
                }

                .behavior-value {
                    font-size: 1.5rem;
                    font-weight: 700;
                }

                .behavior-label {
                    font-size: 0.75rem;
                    color: var(--color-foreground-muted);
                }

                .status-buttons {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 0.5rem;
                }

                .status-buttons button {
                    padding: 0.5rem 1rem;
                    background: var(--color-background);
                    border: 1px solid var(--color-border);
                    border-radius: var(--radius-md);
                    color: var(--color-foreground);
                    font-size: 0.8rem;
                    text-transform: capitalize;
                    cursor: pointer;
                    transition: all 0.15s ease;
                }

                .source-info {
                    display: flex;
                    flex-direction: column;
                    gap: 0.25rem;
                    font-size: 0.85rem;
                    color: var(--color-foreground-muted);
                }

                .detail-footer {
                    display: flex;
                    flex-direction: column;
                    gap: 0.25rem;
                    font-size: 0.75rem;
                    color: var(--color-foreground-muted);
                    padding-top: 1rem;
                    border-top: 1px solid var(--color-border);
                }

                .stat-card.clickable {
                    cursor: pointer;
                    transition: transform 0.15s ease;
                }

                .stat-card.clickable:hover {
                    transform: translateY(-2px);
                }

                @media (max-width: 1200px) {
                    .leads-container {
                        grid-template-columns: 1fr;
                    }

                    .lead-detail {
                        position: fixed;
                        right: 0;
                        top: 0;
                        bottom: 0;
                        width: 400px;
                        border-radius: 0;
                        overflow-y: auto;
                        z-index: 100;
                        box-shadow: -10px 0 30px rgba(0, 0, 0, 0.2);
                    }
                }
            `}</style>
        </div>
    );
}
