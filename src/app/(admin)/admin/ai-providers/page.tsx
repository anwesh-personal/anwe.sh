'use client';

/**
 * AI Providers Admin Page
 * Production-ready provider management with:
 * - Multiple API keys per provider type
 * - Real-time API key validation
 * - Dynamic model fetching
 * - Full CRUD operations
 */

import { useState, useEffect, useCallback } from 'react';
import { AdminHeader } from '@/components/admin';

interface AIProvider {
    id: string;
    name: string;
    slug: string;
    provider_type: string;
    api_key_encrypted: string | null;
    has_api_key: boolean;
    base_url: string | null;
    models: string[];
    is_active: boolean;
    is_default: boolean;
    priority: number;
    total_requests: number;
    total_tokens_used: number;
    total_cost_usd: number;
    last_used_at: string | null;
    last_error_at: string | null;
    consecutive_failures: number;
    created_at: string;
    updated_at: string;
}

interface AIModel {
    id: string;
    provider_id: string;
    name: string;
    model_id: string;
    display_name: string | null;
    provider_type: string;
    context_window: number;
    is_active: boolean;
}

const PROVIDER_TYPES = [
    { type: 'openai', name: 'OpenAI', icon: '🤖', color: '#10a37f', description: 'GPT-4, GPT-4o, and other OpenAI models' },
    { type: 'anthropic', name: 'Anthropic', icon: '🧠', color: '#cc785c', description: 'Claude 3.5 Sonnet, Opus, and Haiku' },
    { type: 'google', name: 'Google AI', icon: '✨', color: '#4285f4', description: 'Gemini Pro, Flash, and experimental models' },
    { type: 'groq', name: 'Groq', icon: '⚡', color: '#f55036', description: 'Ultra-fast inference with LPU' },
    { type: 'mistral', name: 'Mistral', icon: '🌊', color: '#5468ff', description: 'Mistral Large, Medium, and specialized models' }
];

export default function AIProvidersPage() {
    const [providers, setProviders] = useState<AIProvider[]>([]);
    const [models, setModels] = useState<AIModel[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Modal states
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [selectedProvider, setSelectedProvider] = useState<AIProvider | null>(null);

    // Form states
    const [formName, setFormName] = useState('');
    const [formType, setFormType] = useState('openai');
    const [formApiKey, setFormApiKey] = useState('');
    const [formBaseUrl, setFormBaseUrl] = useState('');
    const [formPriority, setFormPriority] = useState(0);

    // Validation states
    const [validating, setValidating] = useState(false);
    const [validationResult, setValidationResult] = useState<{ valid?: boolean; error?: string; models?: string[] } | null>(null);
    const [saving, setSaving] = useState(false);

    const loadData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch('/api/ai-providers?includeModels=true');
            if (!res.ok) throw new Error('Failed to fetch providers');
            const data = await res.json();
            setProviders(data.providers || []);
            setModels(data.models || []);
        } catch (err) {
            console.error('Error loading providers:', err);
            setError('Failed to load providers');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const validateApiKey = async () => {
        if (!formApiKey.trim()) return;

        setValidating(true);
        setValidationResult(null);

        try {
            const res = await fetch('/api/ai-providers', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'validate',
                    providerType: formType,
                    apiKey: formApiKey,
                    baseUrl: formBaseUrl || undefined
                })
            });

            const result = await res.json();
            setValidationResult(result);
        } catch (err) {
            setValidationResult({ valid: false, error: 'Validation failed' });
        } finally {
            setValidating(false);
        }
    };

    const handleAddProvider = async () => {
        if (!formName.trim() || !formApiKey.trim()) return;

        setSaving(true);
        try {
            const res = await fetch('/api/ai-providers', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'create',
                    name: formName,
                    providerType: formType,
                    apiKey: formApiKey,
                    baseUrl: formBaseUrl || undefined,
                    priority: formPriority
                })
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || 'Failed to add provider');
            }

            setShowAddModal(false);
            resetForm();
            await loadData();
        } catch (err: unknown) {
            const error = err as Error;
            setValidationResult({ valid: false, error: error.message });
        } finally {
            setSaving(false);
        }
    };

    const handleUpdateProvider = async () => {
        if (!selectedProvider) return;

        setSaving(true);
        try {
            const res = await fetch('/api/ai-providers', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: selectedProvider.id,
                    name: formName || undefined,
                    apiKey: formApiKey || undefined,
                    baseUrl: formBaseUrl || undefined,
                    priority: formPriority,
                    syncModels: !!formApiKey
                })
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || 'Failed to update provider');
            }

            setShowEditModal(false);
            resetForm();
            await loadData();
        } catch (err: unknown) {
            const error = err as Error;
            setValidationResult({ valid: false, error: error.message });
        } finally {
            setSaving(false);
        }
    };

    const handleToggleProvider = async (provider: AIProvider) => {
        try {
            await fetch('/api/ai-providers', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: provider.id,
                    isActive: !provider.is_active
                })
            });
            await loadData();
        } catch (err) {
            console.error('Error toggling provider:', err);
        }
    };

    const handleDeleteProvider = async (provider: AIProvider) => {
        if (!confirm(`Delete ${provider.name}? This cannot be undone.`)) return;

        try {
            await fetch(`/api/ai-providers?id=${provider.id}`, { method: 'DELETE' });
            await loadData();
        } catch (err) {
            console.error('Error deleting provider:', err);
        }
    };

    const openAddModal = (type?: string) => {
        resetForm();
        if (type) setFormType(type);
        setShowAddModal(true);
    };

    const openEditModal = (provider: AIProvider) => {
        setSelectedProvider(provider);
        setFormName(provider.name);
        setFormType(provider.provider_type);
        setFormApiKey('');
        setFormBaseUrl(provider.base_url || '');
        setFormPriority(provider.priority);
        setValidationResult(null);
        setShowEditModal(true);
    };

    const resetForm = () => {
        setFormName('');
        setFormType('openai');
        setFormApiKey('');
        setFormBaseUrl('');
        setFormPriority(0);
        setValidationResult(null);
        setSelectedProvider(null);
    };

    const getProvidersByType = (type: string) => providers.filter(p => p.provider_type === type);
    const getProviderModels = (providerId: string) => models.filter(m => m.provider_id === providerId);

    const formatNumber = (num: number) => {
        if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
        if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
        return num.toLocaleString();
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 2
        }).format(amount);
    };

    // Calculate totals
    const totalProviders = providers.filter(p => p.is_active && p.has_api_key).length;
    const totalRequests = providers.reduce((sum, p) => sum + p.total_requests, 0);
    const totalCost = providers.reduce((sum, p) => sum + (p.total_cost_usd || 0), 0);
    const totalModels = models.length;

    return (
        <div className="admin-page">
            <AdminHeader
                title="AI Providers"
                subtitle="Manage API keys and models for multiple LLM providers"
            />

            {/* Stats Row */}
            <div className="stats-row">
                <div className="stat-card">
                    <div className="stat-icon green">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
                            <path d="M9 12l2 2 4-4" />
                        </svg>
                    </div>
                    <div className="stat-content">
                        <span className="stat-value">{totalProviders}</span>
                        <span className="stat-label">Active Providers</span>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon purple">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                        </svg>
                    </div>
                    <div className="stat-content">
                        <span className="stat-value">{totalModels}</span>
                        <span className="stat-label">Available Models</span>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon blue">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                        </svg>
                    </div>
                    <div className="stat-content">
                        <span className="stat-value">{formatNumber(totalRequests)}</span>
                        <span className="stat-label">Total Requests</span>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon orange">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M12 1v22M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
                        </svg>
                    </div>
                    <div className="stat-content">
                        <span className="stat-value">{formatCurrency(totalCost)}</span>
                        <span className="stat-label">Total Spend</span>
                    </div>
                </div>
            </div>

            {error && (
                <div className="error-banner">
                    <span>{error}</span>
                    <button onClick={loadData}>Retry</button>
                </div>
            )}

            {/* Provider Types Grid */}
            <div className="provider-types-section">
                <div className="section-header">
                    <h2>Provider Types</h2>
                    <p>Add multiple API keys per provider for failover and load balancing</p>
                </div>

                {loading ? (
                    <div className="loading-state">
                        <div className="spinner" />
                        <span>Loading providers...</span>
                    </div>
                ) : (
                    <div className="provider-types-grid">
                        {PROVIDER_TYPES.map(type => {
                            const typeProviders = getProvidersByType(type.type);
                            const activeCount = typeProviders.filter(p => p.is_active && p.has_api_key).length;

                            return (
                                <div key={type.type} className="provider-type-card">
                                    <div className="type-header">
                                        <div
                                            className="type-icon"
                                            style={{ background: `linear-gradient(135deg, ${type.color}, ${type.color}88)` }}
                                        >
                                            {type.icon}
                                        </div>
                                        <div className="type-info">
                                            <h3>{type.name}</h3>
                                            <span className="type-desc">{type.description}</span>
                                        </div>
                                    </div>

                                    <div className="type-stats">
                                        <span className={`key-count ${activeCount > 0 ? 'has-keys' : ''}`}>
                                            {activeCount > 0 ? `${activeCount} API ${activeCount === 1 ? 'key' : 'keys'} active` : 'No API keys'}
                                        </span>
                                    </div>

                                    {typeProviders.length > 0 && (
                                        <div className="type-providers">
                                            {typeProviders.map(provider => (
                                                <div
                                                    key={provider.id}
                                                    className={`mini-provider ${provider.is_active && provider.has_api_key ? 'active' : ''}`}
                                                >
                                                    <div className="mini-provider-main">
                                                        <span className="provider-name">{provider.name}</span>
                                                        <div className="provider-badges">
                                                            {provider.has_api_key && (
                                                                <span className="badge key">
                                                                    {provider.api_key_encrypted}
                                                                </span>
                                                            )}
                                                            {provider.is_active && provider.has_api_key && (
                                                                <span className="badge active">Active</span>
                                                            )}
                                                            {provider.consecutive_failures > 0 && (
                                                                <span className="badge error">
                                                                    {provider.consecutive_failures} failures
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="mini-provider-actions">
                                                        <button
                                                            className="icon-btn"
                                                            onClick={() => openEditModal(provider)}
                                                            title="Edit"
                                                        >
                                                            ✏️
                                                        </button>
                                                        <button
                                                            className={`icon-btn ${provider.is_active ? 'on' : 'off'}`}
                                                            onClick={() => handleToggleProvider(provider)}
                                                            title={provider.is_active ? 'Disable' : 'Enable'}
                                                        >
                                                            {provider.is_active ? '🟢' : '⚫'}
                                                        </button>
                                                        <button
                                                            className="icon-btn danger"
                                                            onClick={() => handleDeleteProvider(provider)}
                                                            title="Delete"
                                                        >
                                                            🗑️
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    <button
                                        className="add-key-btn"
                                        onClick={() => openAddModal(type.type)}
                                    >
                                        <span>+</span> Add {type.name} Key
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Models Table */}
            {models.length > 0 && (
                <div className="models-section">
                    <div className="section-header">
                        <h2>Available Models</h2>
                        <p>{models.length} models from {totalProviders} active providers</p>
                    </div>

                    <div className="models-table-wrapper">
                        <table className="models-table">
                            <thead>
                                <tr>
                                    <th>Model ID</th>
                                    <th>Provider</th>
                                    <th>Context</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {models.slice(0, 15).map(model => {
                                    const provider = providers.find(p => p.id === model.provider_id);
                                    const typeInfo = PROVIDER_TYPES.find(t => t.type === model.provider_type);
                                    const isAvailable = model.is_active && provider?.is_active && provider?.has_api_key;

                                    return (
                                        <tr key={model.id} className={!isAvailable ? 'unavailable' : ''}>
                                            <td>
                                                <div className="model-info">
                                                    <strong>{model.display_name || model.name}</strong>
                                                    <code>{model.model_id}</code>
                                                </div>
                                            </td>
                                            <td>
                                                <span className="provider-tag">
                                                    {typeInfo?.icon} {provider?.name}
                                                </span>
                                            </td>
                                            <td>{formatNumber(model.context_window)} tokens</td>
                                            <td>
                                                <span className={`status ${isAvailable ? 'ready' : 'unavailable'}`}>
                                                    {isAvailable ? '✓ Ready' : '— Unavailable'}
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Add Provider Modal */}
            {showAddModal && (
                <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <button className="modal-close" onClick={() => setShowAddModal(false)}>✕</button>

                        <div className="modal-header">
                            <h2>Add API Key</h2>
                            <p>Add a new API key for {PROVIDER_TYPES.find(t => t.type === formType)?.name}</p>
                        </div>

                        <div className="modal-body">
                            <div className="form-row">
                                <label>Provider Type</label>
                                <div className="type-selector">
                                    {PROVIDER_TYPES.map(type => (
                                        <button
                                            key={type.type}
                                            className={formType === type.type ? 'selected' : ''}
                                            onClick={() => {
                                                setFormType(type.type);
                                                setValidationResult(null);
                                            }}
                                        >
                                            {type.icon} {type.name}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="form-row">
                                <label>Display Name</label>
                                <input
                                    type="text"
                                    value={formName}
                                    onChange={e => setFormName(e.target.value)}
                                    placeholder={`e.g., ${PROVIDER_TYPES.find(t => t.type === formType)?.name} - Production`}
                                />
                            </div>

                            <div className="form-row">
                                <label>API Key</label>
                                <div className="api-key-input">
                                    <input
                                        type="password"
                                        value={formApiKey}
                                        onChange={e => {
                                            setFormApiKey(e.target.value);
                                            setValidationResult(null);
                                        }}
                                        placeholder="sk-..."
                                    />
                                    <button
                                        className="validate-btn"
                                        onClick={validateApiKey}
                                        disabled={!formApiKey || validating}
                                    >
                                        {validating ? 'Validating...' : 'Validate'}
                                    </button>
                                </div>
                                {validationResult && (
                                    <div className={`validation-result ${validationResult.valid ? 'success' : 'error'}`}>
                                        {validationResult.valid ? (
                                            <>
                                                ✓ Valid! Found {validationResult.models?.length || 0} models
                                            </>
                                        ) : (
                                            <>✕ {validationResult.error}</>
                                        )}
                                    </div>
                                )}
                            </div>

                            <div className="form-row">
                                <label>Base URL (optional)</label>
                                <input
                                    type="text"
                                    value={formBaseUrl}
                                    onChange={e => setFormBaseUrl(e.target.value)}
                                    placeholder="Custom endpoint (for proxies)"
                                />
                            </div>

                            <div className="form-row">
                                <label>Priority (lower = higher priority)</label>
                                <input
                                    type="number"
                                    value={formPriority}
                                    onChange={e => setFormPriority(parseInt(e.target.value) || 0)}
                                    min={0}
                                />
                            </div>
                        </div>

                        <div className="modal-footer">
                            <button className="btn-secondary" onClick={() => setShowAddModal(false)}>
                                Cancel
                            </button>
                            <button
                                className="btn-primary"
                                onClick={handleAddProvider}
                                disabled={!formName || !formApiKey || saving}
                            >
                                {saving ? 'Adding...' : 'Add Provider'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Provider Modal */}
            {showEditModal && selectedProvider && (
                <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <button className="modal-close" onClick={() => setShowEditModal(false)}>✕</button>

                        <div className="modal-header">
                            <h2>Edit {selectedProvider.name}</h2>
                            <p>Update settings or replace API key</p>
                        </div>

                        <div className="modal-body">
                            <div className="form-row">
                                <label>Display Name</label>
                                <input
                                    type="text"
                                    value={formName}
                                    onChange={e => setFormName(e.target.value)}
                                    placeholder="Display name"
                                />
                            </div>

                            <div className="form-row">
                                <label>New API Key (leave blank to keep current)</label>
                                <div className="api-key-input">
                                    <input
                                        type="password"
                                        value={formApiKey}
                                        onChange={e => {
                                            setFormApiKey(e.target.value);
                                            setValidationResult(null);
                                        }}
                                        placeholder="Enter new key to replace"
                                    />
                                    {formApiKey && (
                                        <button
                                            className="validate-btn"
                                            onClick={validateApiKey}
                                            disabled={!formApiKey || validating}
                                        >
                                            {validating ? 'Validating...' : 'Validate'}
                                        </button>
                                    )}
                                </div>
                                {selectedProvider.has_api_key && !formApiKey && (
                                    <div className="current-key">
                                        Current: {selectedProvider.api_key_encrypted}
                                    </div>
                                )}
                                {validationResult && (
                                    <div className={`validation-result ${validationResult.valid ? 'success' : 'error'}`}>
                                        {validationResult.valid ? (
                                            <>✓ Valid! Found {validationResult.models?.length || 0} models</>
                                        ) : (
                                            <>✕ {validationResult.error}</>
                                        )}
                                    </div>
                                )}
                            </div>

                            <div className="form-row">
                                <label>Base URL (optional)</label>
                                <input
                                    type="text"
                                    value={formBaseUrl}
                                    onChange={e => setFormBaseUrl(e.target.value)}
                                    placeholder="Custom endpoint"
                                />
                            </div>

                            <div className="form-row">
                                <label>Priority</label>
                                <input
                                    type="number"
                                    value={formPriority}
                                    onChange={e => setFormPriority(parseInt(e.target.value) || 0)}
                                    min={0}
                                />
                            </div>

                            <div className="provider-stats">
                                <div className="usage-stat">
                                    <span className="usage-value">{formatNumber(selectedProvider.total_requests)}</span>
                                    <span className="usage-label">Requests</span>
                                </div>
                                <div className="usage-stat">
                                    <span className="usage-value">{formatNumber(selectedProvider.total_tokens_used)}</span>
                                    <span className="usage-label">Tokens</span>
                                </div>
                                <div className="usage-stat">
                                    <span className="usage-value">{formatCurrency(selectedProvider.total_cost_usd || 0)}</span>
                                    <span className="usage-label">Cost</span>
                                </div>
                            </div>
                        </div>

                        <div className="modal-footer">
                            <button className="btn-secondary" onClick={() => setShowEditModal(false)}>
                                Cancel
                            </button>
                            <button
                                className="btn-primary"
                                onClick={handleUpdateProvider}
                                disabled={saving}
                            >
                                {saving ? 'Saving...' : 'Save Changes'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <style jsx>{`
                .stats-row {
                    display: grid;
                    grid-template-columns: repeat(4, 1fr);
                    gap: 1rem;
                    margin-bottom: 2rem;
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
                    width: 44px;
                    height: 44px;
                    border-radius: var(--radius-md);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: white;
                }

                .stat-icon.green { background: linear-gradient(135deg, #10b981, #059669); }
                .stat-icon.purple { background: linear-gradient(135deg, #8b5cf6, #6366f1); }
                .stat-icon.blue { background: linear-gradient(135deg, #3b82f6, #2563eb); }
                .stat-icon.orange { background: linear-gradient(135deg, #f59e0b, #d97706); }

                .stat-content {
                    display: flex;
                    flex-direction: column;
                }

                .stat-value {
                    font-size: 1.5rem;
                    font-weight: 700;
                    line-height: 1.2;
                }

                .stat-label {
                    font-size: 0.8rem;
                    color: var(--color-foreground-muted);
                }

                .error-banner {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 1rem 1.5rem;
                    background: rgba(239, 68, 68, 0.1);
                    border: 1px solid rgba(239, 68, 68, 0.3);
                    border-radius: var(--radius-md);
                    color: #ef4444;
                    margin-bottom: 1.5rem;
                }

                .error-banner button {
                    background: #ef4444;
                    color: white;
                    border: none;
                    padding: 0.5rem 1rem;
                    border-radius: var(--radius-md);
                    cursor: pointer;
                }

                .provider-types-section, .models-section {
                    background: var(--color-surface);
                    border: 1px solid var(--color-border);
                    border-radius: var(--radius-lg);
                    padding: 1.5rem;
                    margin-bottom: 1.5rem;
                }

                .section-header {
                    margin-bottom: 1.5rem;
                }

                .section-header h2 {
                    margin: 0 0 0.25rem;
                    font-size: 1.25rem;
                }

                .section-header p {
                    margin: 0;
                    color: var(--color-foreground-muted);
                    font-size: 0.9rem;
                }

                .loading-state {
                    display: flex;
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

                .provider-types-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
                    gap: 1rem;
                }

                .provider-type-card {
                    background: var(--color-background);
                    border: 1px solid var(--color-border);
                    border-radius: var(--radius-lg);
                    padding: 1.25rem;
                }

                .type-header {
                    display: flex;
                    align-items: center;
                    gap: 0.875rem;
                    margin-bottom: 1rem;
                }

                .type-icon {
                    width: 48px;
                    height: 48px;
                    border-radius: var(--radius-md);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 1.5rem;
                }

                .type-info h3 {
                    margin: 0;
                    font-size: 1.1rem;
                }

                .type-desc {
                    font-size: 0.8rem;
                    color: var(--color-foreground-muted);
                }

                .type-stats {
                    margin-bottom: 0.75rem;
                }

                .key-count {
                    font-size: 0.85rem;
                    color: var(--color-foreground-muted);
                }

                .key-count.has-keys {
                    color: #10b981;
                }

                .type-providers {
                    display: flex;
                    flex-direction: column;
                    gap: 0.5rem;
                    margin-bottom: 0.75rem;
                }

                .mini-provider {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 0.625rem 0.75rem;
                    background: var(--color-surface);
                    border: 1px solid var(--color-border);
                    border-radius: var(--radius-md);
                    opacity: 0.7;
                }

                .mini-provider.active {
                    opacity: 1;
                    border-color: rgba(16, 185, 129, 0.3);
                }

                .mini-provider-main {
                    display: flex;
                    flex-direction: column;
                    gap: 0.25rem;
                }

                .provider-name {
                    font-weight: 500;
                    font-size: 0.9rem;
                }

                .provider-badges {
                    display: flex;
                    gap: 0.375rem;
                    flex-wrap: wrap;
                }

                .badge {
                    padding: 0.125rem 0.375rem;
                    border-radius: var(--radius-sm);
                    font-size: 0.65rem;
                    font-weight: 500;
                }

                .badge.key {
                    background: var(--color-background);
                    font-family: monospace;
                }

                .badge.active {
                    background: rgba(16, 185, 129, 0.15);
                    color: #10b981;
                }

                .badge.error {
                    background: rgba(239, 68, 68, 0.15);
                    color: #ef4444;
                }

                .mini-provider-actions {
                    display: flex;
                    gap: 0.25rem;
                }

                .icon-btn {
                    padding: 0.25rem;
                    background: none;
                    border: none;
                    cursor: pointer;
                    font-size: 0.875rem;
                    opacity: 0.6;
                    transition: opacity 0.15s;
                }

                .icon-btn:hover {
                    opacity: 1;
                }

                .add-key-btn {
                    width: 100%;
                    padding: 0.625rem;
                    background: transparent;
                    border: 1px dashed var(--color-border);
                    border-radius: var(--radius-md);
                    color: var(--color-foreground-muted);
                    font-size: 0.85rem;
                    cursor: pointer;
                    transition: all 0.15s;
                }

                .add-key-btn:hover {
                    border-color: var(--color-accent-solid);
                    color: var(--color-accent-solid);
                }

                .add-key-btn span {
                    font-weight: 600;
                    margin-right: 0.25rem;
                }

                /* Models Table */
                .models-table-wrapper {
                    overflow-x: auto;
                }

                .models-table {
                    width: 100%;
                    border-collapse: collapse;
                }

                .models-table th {
                    text-align: left;
                    padding: 0.75rem 1rem;
                    font-size: 0.75rem;
                    font-weight: 600;
                    text-transform: uppercase;
                    color: var(--color-foreground-muted);
                    border-bottom: 1px solid var(--color-border);
                }

                .models-table td {
                    padding: 0.875rem 1rem;
                    border-bottom: 1px solid var(--color-border);
                    font-size: 0.9rem;
                }

                .models-table tr.unavailable {
                    opacity: 0.5;
                }

                .model-info {
                    display: flex;
                    flex-direction: column;
                    gap: 0.125rem;
                }

                .model-info code {
                    font-size: 0.75rem;
                    color: var(--color-foreground-muted);
                }

                .provider-tag {
                    display: inline-flex;
                    align-items: center;
                    gap: 0.375rem;
                }

                .status {
                    font-size: 0.85rem;
                }

                .status.ready { color: #10b981; }
                .status.unavailable { color: var(--color-foreground-muted); }

                /* Modal */
                .modal-overlay {
                    position: fixed;
                    inset: 0;
                    background: rgba(0, 0, 0, 0.75);
                    backdrop-filter: blur(4px);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 1000;
                    padding: 1rem;
                }

                .modal {
                    background: var(--color-surface);
                    border: 1px solid var(--color-border);
                    border-radius: var(--radius-lg);
                    max-width: 560px;
                    width: 100%;
                    position: relative;
                    max-height: 90vh;
                    overflow-y: auto;
                }

                .modal-close {
                    position: absolute;
                    top: 1rem;
                    right: 1rem;
                    background: none;
                    border: none;
                    font-size: 1.25rem;
                    color: var(--color-foreground-muted);
                    cursor: pointer;
                }

                .modal-header {
                    padding: 1.5rem 1.5rem 0;
                }

                .modal-header h2 {
                    margin: 0 0 0.25rem;
                    font-size: 1.25rem;
                }

                .modal-header p {
                    margin: 0;
                    color: var(--color-foreground-muted);
                    font-size: 0.9rem;
                }

                .modal-body {
                    padding: 1.5rem;
                }

                .form-row {
                    margin-bottom: 1.25rem;
                }

                .form-row label {
                    display: block;
                    font-weight: 500;
                    margin-bottom: 0.5rem;
                    font-size: 0.9rem;
                }

                .form-row input {
                    width: 100%;
                    padding: 0.75rem 1rem;
                    background: var(--color-background);
                    border: 1px solid var(--color-border);
                    border-radius: var(--radius-md);
                    color: var(--color-foreground);
                    font-size: 0.95rem;
                }

                .form-row input:focus {
                    outline: none;
                    border-color: var(--color-accent-solid);
                }

                .type-selector {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 0.5rem;
                }

                .type-selector button {
                    padding: 0.5rem 0.75rem;
                    background: var(--color-background);
                    border: 1px solid var(--color-border);
                    border-radius: var(--radius-md);
                    font-size: 0.85rem;
                    cursor: pointer;
                    transition: all 0.15s;
                }

                .type-selector button.selected {
                    background: var(--color-accent-gradient);
                    border-color: transparent;
                    color: white;
                }

                .api-key-input {
                    display: flex;
                    gap: 0.5rem;
                }

                .api-key-input input {
                    flex: 1;
                }

                .validate-btn {
                    padding: 0.75rem 1rem;
                    background: var(--color-background);
                    border: 1px solid var(--color-border);
                    border-radius: var(--radius-md);
                    color: var(--color-foreground);
                    font-size: 0.85rem;
                    cursor: pointer;
                    white-space: nowrap;
                }

                .validate-btn:hover:not(:disabled) {
                    border-color: var(--color-accent-solid);
                    color: var(--color-accent-solid);
                }

                .validate-btn:disabled {
                    opacity: 0.5;
                    cursor: not-allowed;
                }

                .validation-result {
                    margin-top: 0.5rem;
                    padding: 0.5rem 0.75rem;
                    border-radius: var(--radius-md);
                    font-size: 0.85rem;
                }

                .validation-result.success {
                    background: rgba(16, 185, 129, 0.1);
                    color: #10b981;
                }

                .validation-result.error {
                    background: rgba(239, 68, 68, 0.1);
                    color: #ef4444;
                }

                .current-key {
                    margin-top: 0.5rem;
                    font-size: 0.85rem;
                    color: var(--color-foreground-muted);
                    font-family: monospace;
                }

                .provider-stats {
                    display: flex;
                    gap: 1.5rem;
                    padding: 1rem;
                    background: var(--color-background);
                    border-radius: var(--radius-md);
                }

                .usage-stat {
                    display: flex;
                    flex-direction: column;
                }

                .usage-value {
                    font-size: 1.25rem;
                    font-weight: 600;
                }

                .usage-label {
                    font-size: 0.75rem;
                    color: var(--color-foreground-muted);
                }

                .modal-footer {
                    padding: 1rem 1.5rem 1.5rem;
                    display: flex;
                    gap: 0.75rem;
                    justify-content: flex-end;
                }

                .btn-secondary, .btn-primary {
                    padding: 0.625rem 1.25rem;
                    border-radius: var(--radius-md);
                    font-size: 0.9rem;
                    font-weight: 500;
                    cursor: pointer;
                }

                .btn-secondary {
                    background: var(--color-background);
                    border: 1px solid var(--color-border);
                    color: var(--color-foreground);
                }

                .btn-primary {
                    background: var(--color-accent-gradient);
                    border: none;
                    color: white;
                }

                .btn-primary:disabled {
                    opacity: 0.5;
                    cursor: not-allowed;
                }

                @media (max-width: 768px) {
                    .stats-row {
                        grid-template-columns: repeat(2, 1fr);
                    }

                    .provider-types-grid {
                        grid-template-columns: 1fr;
                    }
                }
            `}</style>
        </div>
    );
}
