'use client';

/**
 * AI Providers Admin Page
 * Manage AI provider API keys and models
 */

import { useState, useEffect, useCallback } from 'react';
import { AdminHeader } from '@/components/admin';
import {
    getProviders,
    getModels,
    updateProviderApiKey,
    toggleProvider,
    getExecutionStats,
    type AIProvider,
    type AIModel
} from '@/lib/ai';

export default function AIProvidersPage() {
    const [providers, setProviders] = useState<AIProvider[]>([]);
    const [models, setModels] = useState<AIModel[]>([]);
    const [selectedProvider, setSelectedProvider] = useState<AIProvider | null>(null);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        totalExecutions: 0,
        totalTokens: 0,
        totalCost: 0,
        executionsToday: 0,
        avgExecutionTime: 0
    });

    // API Key modal state
    const [showApiKeyModal, setShowApiKeyModal] = useState(false);
    const [apiKeyInput, setApiKeyInput] = useState('');
    const [savingApiKey, setSavingApiKey] = useState(false);

    const loadData = useCallback(async () => {
        setLoading(true);
        const [providersData, modelsData, statsData] = await Promise.all([
            getProviders(),
            getModels(),
            getExecutionStats()
        ]);
        setProviders(providersData);
        setModels(modelsData);
        setStats(statsData);
        setLoading(false);
    }, []);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const handleToggleProvider = async (provider: AIProvider) => {
        await toggleProvider(provider.id, !provider.is_active);
        await loadData();
    };

    const handleSaveApiKey = async () => {
        if (!selectedProvider || !apiKeyInput) return;

        setSavingApiKey(true);
        const success = await updateProviderApiKey(selectedProvider.id, apiKeyInput);

        if (success) {
            setShowApiKeyModal(false);
            setApiKeyInput('');
            await loadData();
        }

        setSavingApiKey(false);
    };

    const openApiKeyModal = (provider: AIProvider) => {
        setSelectedProvider(provider);
        setApiKeyInput('');
        setShowApiKeyModal(true);
    };

    const getProviderIcon = (type: string) => {
        switch (type) {
            case 'openai':
                return '🤖';
            case 'anthropic':
                return '🧠';
            case 'google':
                return '✨';
            case 'groq':
                return '⚡';
            default:
                return '🔌';
        }
    };

    const getProviderModels = (providerId: string) => {
        return models.filter(m => m.provider_id === providerId);
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 4
        }).format(amount);
    };

    const formatNumber = (num: number) => {
        return new Intl.NumberFormat('en-US').format(Math.round(num));
    };

    return (
        <div className="admin-page">
            <AdminHeader
                title="AI Providers"
                subtitle="Configure AI providers, API keys, and available models"
            />

            {/* Stats Cards */}
            <div className="admin-panel-stats" style={{ marginBottom: '2rem' }}>
                <div className="stat-card">
                    <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #8b5cf6, #6366f1)' }}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                        </svg>
                    </div>
                    <div className="stat-content">
                        <span className="stat-value">{formatNumber(stats.totalExecutions)}</span>
                        <span className="stat-label">Total Executions</span>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="10" />
                            <path d="M12 6v6l4 2" />
                        </svg>
                    </div>
                    <div className="stat-content">
                        <span className="stat-value">{formatNumber(stats.executionsToday)}</span>
                        <span className="stat-label">Today</span>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M12 2v20M2 12h20" />
                        </svg>
                    </div>
                    <div className="stat-content">
                        <span className="stat-value">{formatNumber(stats.totalTokens)}</span>
                        <span className="stat-label">Total Tokens</span>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #ef4444, #dc2626)' }}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M12 1v22M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
                        </svg>
                    </div>
                    <div className="stat-content">
                        <span className="stat-value">{formatCurrency(stats.totalCost)}</span>
                        <span className="stat-label">Total Cost</span>
                    </div>
                </div>
            </div>

            {/* Providers Grid */}
            <div className="admin-section">
                <h2 className="admin-section-title">Providers</h2>

                {loading ? (
                    <div className="admin-loading">Loading providers...</div>
                ) : (
                    <div className="providers-grid">
                        {providers.map(provider => (
                            <div
                                key={provider.id}
                                className={`provider-card ${provider.is_active ? 'active' : 'inactive'}`}
                            >
                                <div className="provider-header">
                                    <div className="provider-icon">
                                        {getProviderIcon(provider.provider_type)}
                                    </div>
                                    <div className="provider-info">
                                        <h3>{provider.name}</h3>
                                        <span className="provider-type">{provider.provider_type}</span>
                                    </div>
                                    <div className="provider-status">
                                        <span className={`status-badge ${provider.is_active ? 'active' : 'inactive'}`}>
                                            {provider.is_active ? 'Active' : 'Inactive'}
                                        </span>
                                    </div>
                                </div>

                                <div className="provider-api-status">
                                    {provider.api_key_encrypted ? (
                                        <div className="api-configured">
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <path d="M20 6L9 17l-5-5" />
                                            </svg>
                                            API Key Configured
                                        </div>
                                    ) : (
                                        <div className="api-missing">
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <circle cx="12" cy="12" r="10" />
                                                <line x1="15" y1="9" x2="9" y2="15" />
                                                <line x1="9" y1="9" x2="15" y2="15" />
                                            </svg>
                                            No API Key
                                        </div>
                                    )}
                                </div>

                                <div className="provider-models">
                                    <span className="models-count">
                                        {getProviderModels(provider.id).length} models available
                                    </span>
                                </div>

                                <div className="provider-actions">
                                    <button
                                        className="btn-secondary"
                                        onClick={() => openApiKeyModal(provider)}
                                    >
                                        {provider.api_key_encrypted ? 'Update Key' : 'Add Key'}
                                    </button>
                                    <button
                                        className={`btn-toggle ${provider.is_active ? 'active' : ''}`}
                                        onClick={() => handleToggleProvider(provider)}
                                        disabled={!provider.api_key_encrypted}
                                    >
                                        {provider.is_active ? 'Disable' : 'Enable'}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Models Table */}
            <div className="admin-section">
                <h2 className="admin-section-title">Available Models</h2>

                <div className="admin-table-wrapper">
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th>Model</th>
                                <th>Provider</th>
                                <th>Context Window</th>
                                <th>Input Cost</th>
                                <th>Output Cost</th>
                                <th>Capabilities</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {models.map(model => {
                                const provider = providers.find(p => p.id === model.provider_id);
                                return (
                                    <tr key={model.id}>
                                        <td>
                                            <div className="model-name">
                                                <strong>{model.display_name || model.name}</strong>
                                                <span className="model-id">{model.model_id}</span>
                                            </div>
                                        </td>
                                        <td>
                                            <div className="provider-badge">
                                                {getProviderIcon(model.provider_type)}
                                                {provider?.name || model.provider_type}
                                            </div>
                                        </td>
                                        <td>{formatNumber(model.context_window)}</td>
                                        <td>${model.input_cost_per_1k}/1k</td>
                                        <td>${model.output_cost_per_1k}/1k</td>
                                        <td>
                                            <div className="capabilities">
                                                {(model.capabilities as string[]).slice(0, 3).map((cap, idx) => (
                                                    <span key={idx} className="cap-badge">{cap}</span>
                                                ))}
                                            </div>
                                        </td>
                                        <td>
                                            <span className={`status-dot ${model.is_active && provider?.is_active ? 'active' : 'inactive'}`} />
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* API Key Modal */}
            {showApiKeyModal && selectedProvider && (
                <div className="modal-overlay" onClick={() => setShowApiKeyModal(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <h2>Configure {selectedProvider.name}</h2>
                        <p className="modal-description">
                            Enter your API key for {selectedProvider.name}. The key will be stored securely.
                        </p>

                        <div className="form-field">
                            <label>API Key</label>
                            <input
                                type="password"
                                value={apiKeyInput}
                                onChange={e => setApiKeyInput(e.target.value)}
                                placeholder={`Enter your ${selectedProvider.name} API key`}
                            />
                        </div>

                        <div className="modal-actions">
                            <button
                                className="btn-secondary"
                                onClick={() => setShowApiKeyModal(false)}
                            >
                                Cancel
                            </button>
                            <button
                                className="btn-primary"
                                onClick={handleSaveApiKey}
                                disabled={!apiKeyInput || savingApiKey}
                            >
                                {savingApiKey ? 'Saving...' : 'Save API Key'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <style jsx>{`
                .providers-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
                    gap: 1.5rem;
                }

                .provider-card {
                    background: var(--color-surface);
                    border: 1px solid var(--color-border);
                    border-radius: var(--radius-lg);
                    padding: 1.5rem;
                    transition: all 0.2s ease;
                }

                .provider-card:hover {
                    border-color: var(--color-accent-solid);
                }

                .provider-card.active {
                    border-color: #10b981;
                }

                .provider-header {
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                    margin-bottom: 1rem;
                }

                .provider-icon {
                    font-size: 2rem;
                }

                .provider-info h3 {
                    margin: 0;
                    font-size: 1.1rem;
                }

                .provider-type {
                    font-size: 0.8rem;
                    color: var(--color-foreground-muted);
                    text-transform: uppercase;
                }

                .provider-status {
                    margin-left: auto;
                }

                .status-badge {
                    padding: 0.25rem 0.75rem;
                    border-radius: var(--radius-full);
                    font-size: 0.75rem;
                    font-weight: 500;
                }

                .status-badge.active {
                    background: rgba(16, 185, 129, 0.15);
                    color: #10b981;
                }

                .status-badge.inactive {
                    background: rgba(107, 114, 128, 0.15);
                    color: #6b7280;
                }

                .provider-api-status {
                    margin-bottom: 1rem;
                    padding: 0.75rem;
                    border-radius: var(--radius-md);
                    background: var(--color-background);
                }

                .api-configured {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    color: #10b981;
                    font-size: 0.9rem;
                }

                .api-missing {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    color: #ef4444;
                    font-size: 0.9rem;
                }

                .provider-models {
                    margin-bottom: 1rem;
                }

                .models-count {
                    font-size: 0.85rem;
                    color: var(--color-foreground-muted);
                }

                .provider-actions {
                    display: flex;
                    gap: 0.75rem;
                }

                .btn-secondary, .btn-primary {
                    flex: 1;
                    padding: 0.5rem 1rem;
                    border-radius: var(--radius-md);
                    font-size: 0.9rem;
                    font-weight: 500;
                    cursor: pointer;
                    transition: all 0.15s ease;
                }

                .btn-secondary {
                    background: var(--color-background);
                    border: 1px solid var(--color-border);
                    color: var(--color-foreground);
                }

                .btn-secondary:hover {
                    border-color: var(--color-accent-solid);
                }

                .btn-primary {
                    background: var(--color-accent-solid);
                    border: none;
                    color: white;
                }

                .btn-toggle {
                    flex: 1;
                    padding: 0.5rem 1rem;
                    border-radius: var(--radius-md);
                    font-size: 0.9rem;
                    font-weight: 500;
                    cursor: pointer;
                    border: 1px solid var(--color-border);
                    background: var(--color-background);
                    color: var(--color-foreground);
                }

                .btn-toggle:disabled {
                    opacity: 0.5;
                    cursor: not-allowed;
                }

                .btn-toggle.active {
                    background: rgba(16, 185, 129, 0.1);
                    border-color: #10b981;
                    color: #10b981;
                }

                .model-name {
                    display: flex;
                    flex-direction: column;
                    gap: 0.25rem;
                }

                .model-id {
                    font-size: 0.75rem;
                    color: var(--color-foreground-muted);
                    font-family: monospace;
                }

                .provider-badge {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                }

                .capabilities {
                    display: flex;
                    gap: 0.25rem;
                    flex-wrap: wrap;
                }

                .cap-badge {
                    padding: 0.125rem 0.5rem;
                    background: var(--color-background);
                    border-radius: var(--radius-sm);
                    font-size: 0.7rem;
                    color: var(--color-foreground-muted);
                }

                .status-dot {
                    width: 8px;
                    height: 8px;
                    border-radius: 50%;
                    display: inline-block;
                }

                .status-dot.active {
                    background: #10b981;
                }

                .status-dot.inactive {
                    background: #6b7280;
                }

                .modal-overlay {
                    position: fixed;
                    inset: 0;
                    background: rgba(0, 0, 0, 0.7);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 1000;
                }

                .modal-content {
                    background: var(--color-surface);
                    border-radius: var(--radius-lg);
                    padding: 2rem;
                    max-width: 480px;
                    width: 100%;
                    margin: 1rem;
                }

                .modal-content h2 {
                    margin: 0 0 0.5rem;
                }

                .modal-description {
                    color: var(--color-foreground-muted);
                    margin-bottom: 1.5rem;
                }

                .form-field {
                    margin-bottom: 1.5rem;
                }

                .form-field label {
                    display: block;
                    margin-bottom: 0.5rem;
                    font-weight: 500;
                }

                .form-field input {
                    width: 100%;
                    padding: 0.75rem 1rem;
                    background: var(--color-background);
                    border: 1px solid var(--color-border);
                    border-radius: var(--radius-md);
                    color: var(--color-foreground);
                    font-size: 1rem;
                }

                .modal-actions {
                    display: flex;
                    gap: 1rem;
                    justify-content: flex-end;
                }
            `}</style>
        </div>
    );
}
