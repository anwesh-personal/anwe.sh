'use client';

/**
 * Autoresponders Admin Page
 * Professional UI for managing email marketing integrations and form embeds
 */

import { useState, useEffect, useCallback } from 'react';
import { AdminHeader } from '@/components/admin';

// =====================================================
// TYPES
// =====================================================

interface AutoresponderIntegration {
    id: string;
    provider: 'mailchimp' | 'convertkit' | 'activecampaign' | 'aweber' | 'brevo' | 'custom';
    providerName: string;
    name: string;
    api_key: string | null;
    api_url: string | null;
    is_active: boolean;
    is_default: boolean;
    is_verified: boolean;
    total_synced: number;
    last_synced_at: string | null;
    last_error: string | null;
    cached_lists: Array<{ id: string; name: string; subscriberCount?: number }>;
    cached_forms: Array<{ id: string; name: string }>;
    cached_tags: Array<{ id: string; name: string }>;
    default_list_id: string | null;
    default_form_id: string | null;
    created_at: string;
}

interface FormEmbed {
    id: string;
    name: string;
    render_mode: 'strip_design' | 'use_original';
    placement: string;
    is_active: boolean;
    impressions: number;
    submissions: number;
    autoresponder?: { id: string; provider: string; name: string };
    created_at: string;
}

interface ProviderInfo {
    id: string;
    name: string;
    icon: string;
    description: string;
    color: string;
    requiresApiKey: boolean;
    requiresApiUrl: boolean;
    requiresOAuth: boolean;
}

// =====================================================
// PROVIDER CONFIG
// =====================================================

const PROVIDERS: ProviderInfo[] = [
    {
        id: 'mailchimp',
        name: 'Mailchimp',
        icon: '🐵',
        description: 'Email marketing & automation',
        color: '#FFE01B',
        requiresApiKey: true,
        requiresApiUrl: false,
        requiresOAuth: false,
    },
    {
        id: 'convertkit',
        name: 'ConvertKit',
        icon: '✉️',
        description: 'Creator-focused email marketing',
        color: '#FB6970',
        requiresApiKey: true,
        requiresApiUrl: false,
        requiresOAuth: false,
    },
    {
        id: 'activecampaign',
        name: 'ActiveCampaign',
        icon: '⚡',
        description: 'Marketing automation & CRM',
        color: '#356AE6',
        requiresApiKey: true,
        requiresApiUrl: true,
        requiresOAuth: false,
    },
    {
        id: 'aweber',
        name: 'AWeber',
        icon: '📧',
        description: 'Email marketing for small business',
        color: '#2D7EEE',
        requiresApiKey: false,
        requiresApiUrl: false,
        requiresOAuth: true,
    },
    {
        id: 'brevo',
        name: 'Brevo',
        icon: '💚',
        description: 'Email, SMS & CRM platform',
        color: '#00A651',
        requiresApiKey: true,
        requiresApiUrl: false,
        requiresOAuth: false,
    },
    {
        id: 'custom',
        name: 'Custom / Webhook',
        icon: '🔗',
        description: 'Custom API endpoint or webhook',
        color: '#6366F1',
        requiresApiKey: false,
        requiresApiUrl: true,
        requiresOAuth: false,
    },
];

type ViewMode = 'list' | 'add' | 'edit' | 'forms' | 'add-form';

// =====================================================
// MAIN COMPONENT
// =====================================================

export default function AutorespondersPage() {
    const [view, setView] = useState<ViewMode>('list');
    const [integrations, setIntegrations] = useState<AutoresponderIntegration[]>([]);
    const [formEmbeds, setFormEmbeds] = useState<FormEmbed[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedProvider, setSelectedProvider] = useState<ProviderInfo | null>(null);
    const [editingIntegration, setEditingIntegration] = useState<AutoresponderIntegration | null>(null);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    // Form state for adding/editing
    const [formData, setFormData] = useState({
        name: '',
        api_key: '',
        api_url: '',
        default_list_id: '',
        default_form_id: '',
        custom_subscribe_url: '',
        custom_email_field: 'email',
        custom_name_field: 'name',
        is_default: false,
    });

    // Form embed state
    const [embedFormData, setEmbedFormData] = useState({
        name: '',
        html_content: '',
        render_mode: 'strip_design' as 'strip_design' | 'use_original',
        autoresponder_id: '',
        placement: 'popup',
        trigger_type: 'exit_intent',
        save_to_local: true,
    });

    const [validating, setValidating] = useState(false);
    const [saving, setSaving] = useState(false);
    const [fetchingLists, setFetchingLists] = useState(false);
    const [providerData, setProviderData] = useState<{
        lists: Array<{ id: string; name: string; subscriberCount?: number }>;
        forms: Array<{ id: string; name: string }>;
        tags: Array<{ id: string; name: string }>;
    } | null>(null);

    // =====================================================
    // DATA LOADING
    // =====================================================

    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            const [integrationsRes, embedsRes] = await Promise.all([
                fetch('/api/autoresponders'),
                fetch('/api/form-embeds'),
            ]);

            if (integrationsRes.ok) {
                const data = await integrationsRes.json();
                setIntegrations(data.integrations || []);
            }

            if (embedsRes.ok) {
                const data = await embedsRes.json();
                setFormEmbeds(data.embeds || []);
            }
        } catch (error) {
            console.error('Failed to load data:', error);
            showMessage('error', 'Failed to load integrations');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const showMessage = (type: 'success' | 'error', text: string) => {
        setMessage({ type, text });
        setTimeout(() => setMessage(null), 4000);
    };

    // =====================================================
    // INTEGRATION ACTIONS
    // =====================================================

    const validateCredentials = async () => {
        if (!selectedProvider) return;

        setValidating(true);
        try {
            const response = await fetch('/api/autoresponders', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'validate',
                    provider: selectedProvider.id,
                    api_key: formData.api_key,
                    api_url: formData.api_url,
                    custom_subscribe_url: formData.custom_subscribe_url,
                }),
            });

            const result = await response.json();

            if (result.valid) {
                showMessage('success', `Connected to ${result.accountName || selectedProvider.name}`);
                // Fetch lists after validation
                await fetchProviderData();
            } else {
                showMessage('error', result.error || 'Invalid credentials');
            }
        } catch {
            showMessage('error', 'Failed to validate credentials');
        } finally {
            setValidating(false);
        }
    };

    const fetchProviderData = async () => {
        if (!selectedProvider) return;

        setFetchingLists(true);
        try {
            const params = new URLSearchParams({
                action: 'fetch_data',
                provider: selectedProvider.id,
            });

            // For existing integration, use ID
            if (editingIntegration) {
                params.set('id', editingIntegration.id);
            }

            const response = await fetch(`/api/autoresponders?${params}`);

            if (response.ok) {
                const data = await response.json();
                setProviderData({
                    lists: data.lists || [],
                    forms: data.forms || [],
                    tags: data.tags || [],
                });
            }
        } catch (error) {
            console.error('Failed to fetch provider data:', error);
        } finally {
            setFetchingLists(false);
        }
    };

    const saveIntegration = async () => {
        if (!selectedProvider) return;

        setSaving(true);
        try {
            const body = {
                provider: selectedProvider.id,
                name: formData.name || selectedProvider.name,
                api_key: formData.api_key || undefined,
                api_url: formData.api_url || undefined,
                default_list_id: formData.default_list_id || undefined,
                default_form_id: formData.default_form_id || undefined,
                custom_subscribe_url: formData.custom_subscribe_url || undefined,
                custom_email_field: formData.custom_email_field || undefined,
                custom_name_field: formData.custom_name_field || undefined,
                is_default: formData.is_default,
            };

            const response = await fetch('/api/autoresponders', {
                method: editingIntegration ? 'PUT' : 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(editingIntegration ? { id: editingIntegration.id, ...body } : body),
            });

            const result = await response.json();

            if (response.ok) {
                showMessage('success', editingIntegration ? 'Integration updated' : 'Integration created');
                await loadData();
                setView('list');
                resetForm();
            } else {
                showMessage('error', result.error || 'Failed to save integration');
            }
        } catch {
            showMessage('error', 'Failed to save integration');
        } finally {
            setSaving(false);
        }
    };

    const deleteIntegration = async (id: string) => {
        if (!confirm('Are you sure you want to delete this integration?')) return;

        try {
            const response = await fetch(`/api/autoresponders?id=${id}`, {
                method: 'DELETE',
            });

            if (response.ok) {
                showMessage('success', 'Integration deleted');
                await loadData();
            } else {
                showMessage('error', 'Failed to delete integration');
            }
        } catch {
            showMessage('error', 'Failed to delete integration');
        }
    };

    const toggleActive = async (integration: AutoresponderIntegration) => {
        try {
            const response = await fetch('/api/autoresponders', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: integration.id,
                    is_active: !integration.is_active,
                }),
            });

            if (response.ok) {
                await loadData();
            }
        } catch {
            showMessage('error', 'Failed to update integration');
        }
    };

    const setAsDefault = async (integration: AutoresponderIntegration) => {
        try {
            const response = await fetch('/api/autoresponders', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: integration.id,
                    is_default: true,
                }),
            });

            if (response.ok) {
                showMessage('success', `${integration.name} set as default`);
                await loadData();
            }
        } catch {
            showMessage('error', 'Failed to update integration');
        }
    };

    const resetForm = () => {
        setFormData({
            name: '',
            api_key: '',
            api_url: '',
            default_list_id: '',
            default_form_id: '',
            custom_subscribe_url: '',
            custom_email_field: 'email',
            custom_name_field: 'name',
            is_default: false,
        });
        setSelectedProvider(null);
        setEditingIntegration(null);
        setProviderData(null);
    };

    // =====================================================
    // FORM EMBED ACTIONS
    // =====================================================

    const parseFormHtml = async () => {
        if (!embedFormData.html_content) return;

        try {
            const response = await fetch('/api/form-embeds', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'parse',
                    html: embedFormData.html_content,
                }),
            });

            const result = await response.json();
            if (result.success) {
                showMessage('success', `Parsed ${result.fields.length} fields from form`);
            } else {
                showMessage('error', result.error || 'Failed to parse form');
            }
        } catch {
            showMessage('error', 'Failed to parse form');
        }
    };

    const saveFormEmbed = async () => {
        setSaving(true);
        try {
            const response = await fetch('/api/form-embeds', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(embedFormData),
            });

            const result = await response.json();

            if (response.ok) {
                showMessage('success', 'Form embed created');
                await loadData();
                setView('forms');
                setEmbedFormData({
                    name: '',
                    html_content: '',
                    render_mode: 'strip_design',
                    autoresponder_id: '',
                    placement: 'popup',
                    trigger_type: 'exit_intent',
                    save_to_local: true,
                });
            } else {
                showMessage('error', result.error || 'Failed to save form embed');
            }
        } catch {
            showMessage('error', 'Failed to save form embed');
        } finally {
            setSaving(false);
        }
    };

    const deleteFormEmbed = async (id: string) => {
        if (!confirm('Are you sure you want to delete this form embed?')) return;

        try {
            const response = await fetch(`/api/form-embeds?id=${id}`, {
                method: 'DELETE',
            });

            if (response.ok) {
                showMessage('success', 'Form embed deleted');
                await loadData();
            }
        } catch {
            showMessage('error', 'Failed to delete form embed');
        }
    };

    // =====================================================
    // RENDER HELPERS
    // =====================================================

    const getProviderInfo = (providerId: string): ProviderInfo => {
        return PROVIDERS.find(p => p.id === providerId) || PROVIDERS[PROVIDERS.length - 1];
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
        });
    };

    // =====================================================
    // RENDER: Integration List
    // =====================================================

    const renderIntegrationsList = () => (
        <div className="integrations-section">
            <div className="section-header">
                <div>
                    <h2>Email Marketing Integrations</h2>
                    <p>Connect your email marketing platforms to sync leads automatically</p>
                </div>
                <button className="btn btn-primary" onClick={() => setView('add')}>
                    ➕ Add Integration
                </button>
            </div>

            {integrations.length === 0 ? (
                <div className="empty-card">
                    <div className="empty-icon">📧</div>
                    <h3>No Integrations Yet</h3>
                    <p>Connect an email marketing platform to automatically sync your leads.</p>
                    <button className="btn btn-primary" onClick={() => setView('add')}>
                        Add Your First Integration
                    </button>
                </div>
            ) : (
                <div className="integrations-grid">
                    {integrations.map(integration => {
                        const provider = getProviderInfo(integration.provider);
                        return (
                            <div
                                key={integration.id}
                                className={`integration-card ${!integration.is_active ? 'inactive' : ''}`}
                            >
                                <div className="integration-header">
                                    <div className="provider-badge" style={{ background: provider.color }}>
                                        {provider.icon}
                                    </div>
                                    <div className="integration-meta">
                                        <h3>{integration.name}</h3>
                                        <span className="provider-name">{provider.name}</span>
                                    </div>
                                    {integration.is_default && (
                                        <span className="default-badge">Default</span>
                                    )}
                                </div>

                                <div className="integration-stats">
                                    <div className="stat">
                                        <span className="stat-value">{integration.total_synced}</span>
                                        <span className="stat-label">Synced</span>
                                    </div>
                                    <div className="stat">
                                        <span className="stat-value">
                                            {integration.cached_lists?.length || 0}
                                        </span>
                                        <span className="stat-label">Lists</span>
                                    </div>
                                    <div className="stat">
                                        <span className={`status-dot ${integration.is_verified ? 'verified' : 'error'}`} />
                                        <span className="stat-label">
                                            {integration.is_verified ? 'Connected' : 'Error'}
                                        </span>
                                    </div>
                                </div>

                                {integration.last_error && (
                                    <div className="integration-error">
                                        ⚠️ {integration.last_error}
                                    </div>
                                )}

                                <div className="integration-actions">
                                    <button
                                        className="btn btn-sm btn-ghost"
                                        onClick={() => toggleActive(integration)}
                                    >
                                        {integration.is_active ? '⏸️ Pause' : '▶️ Enable'}
                                    </button>
                                    {!integration.is_default && (
                                        <button
                                            className="btn btn-sm btn-ghost"
                                            onClick={() => setAsDefault(integration)}
                                        >
                                            ⭐ Set Default
                                        </button>
                                    )}
                                    <button
                                        className="btn btn-sm btn-ghost"
                                        onClick={() => {
                                            setEditingIntegration(integration);
                                            setSelectedProvider(getProviderInfo(integration.provider));
                                            setFormData({
                                                name: integration.name,
                                                api_key: '',
                                                api_url: integration.api_url || '',
                                                default_list_id: integration.default_list_id || '',
                                                default_form_id: integration.default_form_id || '',
                                                custom_subscribe_url: '',
                                                custom_email_field: 'email',
                                                custom_name_field: 'name',
                                                is_default: integration.is_default,
                                            });
                                            setProviderData({
                                                lists: integration.cached_lists || [],
                                                forms: integration.cached_forms || [],
                                                tags: integration.cached_tags || [],
                                            });
                                            setView('edit');
                                        }}
                                    >
                                        ✏️ Edit
                                    </button>
                                    <button
                                        className="btn btn-sm btn-ghost btn-danger"
                                        onClick={() => deleteIntegration(integration.id)}
                                    >
                                        🗑️
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );

    // =====================================================
    // RENDER: Add/Edit Integration
    // =====================================================

    const renderAddIntegration = () => (
        <div className="add-integration">
            <div className="section-header">
                <button className="btn btn-ghost" onClick={() => { setView('list'); resetForm(); }}>
                    ← Back
                </button>
                <h2>{editingIntegration ? 'Edit Integration' : 'Add Integration'}</h2>
            </div>

            {!selectedProvider ? (
                <div className="provider-grid">
                    {PROVIDERS.map(provider => (
                        <button
                            key={provider.id}
                            className="provider-card"
                            onClick={() => setSelectedProvider(provider)}
                        >
                            <span className="provider-icon" style={{ background: provider.color }}>
                                {provider.icon}
                            </span>
                            <span className="provider-name">{provider.name}</span>
                            <span className="provider-desc">{provider.description}</span>
                        </button>
                    ))}
                </div>
            ) : (
                <div className="integration-form">
                    <div className="selected-provider">
                        <span className="provider-icon" style={{ background: selectedProvider.color }}>
                            {selectedProvider.icon}
                        </span>
                        <div>
                            <strong>{selectedProvider.name}</strong>
                            <p>{selectedProvider.description}</p>
                        </div>
                        <button
                            className="btn btn-ghost btn-sm"
                            onClick={() => { setSelectedProvider(null); setProviderData(null); }}
                        >
                            Change
                        </button>
                    </div>

                    <div className="form-section">
                        <div className="form-group">
                            <label>Integration Name</label>
                            <input
                                type="text"
                                value={formData.name}
                                onChange={e => setFormData(f => ({ ...f, name: e.target.value }))}
                                placeholder={`My ${selectedProvider.name} Account`}
                            />
                        </div>

                        {selectedProvider.requiresApiKey && (
                            <div className="form-group">
                                <label>
                                    API Key
                                    {selectedProvider.id === 'mailchimp' && (
                                        <span className="hint"> (format: abc123-us14)</span>
                                    )}
                                </label>
                                <input
                                    type="password"
                                    value={formData.api_key}
                                    onChange={e => setFormData(f => ({ ...f, api_key: e.target.value }))}
                                    placeholder="Enter your API key"
                                />
                            </div>
                        )}

                        {selectedProvider.requiresApiUrl && selectedProvider.id !== 'custom' && (
                            <div className="form-group">
                                <label>API URL</label>
                                <input
                                    type="url"
                                    value={formData.api_url}
                                    onChange={e => setFormData(f => ({ ...f, api_url: e.target.value }))}
                                    placeholder="https://your-account.api-us1.com"
                                />
                            </div>
                        )}

                        {selectedProvider.id === 'custom' && (
                            <>
                                <div className="form-group">
                                    <label>Subscribe Webhook URL</label>
                                    <input
                                        type="url"
                                        value={formData.custom_subscribe_url}
                                        onChange={e => setFormData(f => ({ ...f, custom_subscribe_url: e.target.value }))}
                                        placeholder="https://your-api.com/subscribe"
                                    />
                                </div>
                                <div className="form-row">
                                    <div className="form-group">
                                        <label>Email Field Name</label>
                                        <input
                                            type="text"
                                            value={formData.custom_email_field}
                                            onChange={e => setFormData(f => ({ ...f, custom_email_field: e.target.value }))}
                                            placeholder="email"
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Name Field Name</label>
                                        <input
                                            type="text"
                                            value={formData.custom_name_field}
                                            onChange={e => setFormData(f => ({ ...f, custom_name_field: e.target.value }))}
                                            placeholder="name"
                                        />
                                    </div>
                                </div>
                            </>
                        )}

                        {selectedProvider.requiresOAuth && (
                            <div className="oauth-notice">
                                <p>⚠️ OAuth integration requires additional setup. Please configure OAuth credentials in your environment.</p>
                            </div>
                        )}

                        <div className="form-actions">
                            <button
                                className="btn btn-secondary"
                                onClick={validateCredentials}
                                disabled={validating}
                            >
                                {validating ? '⏳ Validating...' : '🔗 Test Connection'}
                            </button>
                        </div>
                    </div>

                    {/* Lists/Forms Selection */}
                    {providerData && (providerData.lists.length > 0 || providerData.forms.length > 0) && (
                        <div className="form-section">
                            <h3>Select Default List/Form</h3>

                            {providerData.lists.length > 0 && (
                                <div className="form-group">
                                    <label>Default List/Audience</label>
                                    <select
                                        value={formData.default_list_id}
                                        onChange={e => setFormData(f => ({ ...f, default_list_id: e.target.value }))}
                                    >
                                        <option value="">Select a list...</option>
                                        {providerData.lists.map(list => (
                                            <option key={list.id} value={list.id}>
                                                {list.name} {list.subscriberCount !== undefined && `(${list.subscriberCount} subscribers)`}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            {providerData.forms.length > 0 && (
                                <div className="form-group">
                                    <label>Default Form</label>
                                    <select
                                        value={formData.default_form_id}
                                        onChange={e => setFormData(f => ({ ...f, default_form_id: e.target.value }))}
                                    >
                                        <option value="">Select a form...</option>
                                        {providerData.forms.map(form => (
                                            <option key={form.id} value={form.id}>
                                                {form.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}
                        </div>
                    )}

                    {fetchingLists && (
                        <div className="loading-lists">
                            ⏳ Fetching lists and forms from {selectedProvider.name}...
                        </div>
                    )}

                    <div className="form-section">
                        <div className="form-group checkbox-group">
                            <label>
                                <input
                                    type="checkbox"
                                    checked={formData.is_default}
                                    onChange={e => setFormData(f => ({ ...f, is_default: e.target.checked }))}
                                />
                                Set as default integration for lead capture
                            </label>
                        </div>
                    </div>

                    <div className="form-actions primary">
                        <button
                            className="btn btn-ghost"
                            onClick={() => { setView('list'); resetForm(); }}
                        >
                            Cancel
                        </button>
                        <button
                            className="btn btn-primary"
                            onClick={saveIntegration}
                            disabled={saving}
                        >
                            {saving ? 'Saving...' : (editingIntegration ? 'Update Integration' : 'Save Integration')}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );

    // =====================================================
    // RENDER: Form Embeds List
    // =====================================================

    const renderFormEmbedsList = () => (
        <div className="forms-section">
            <div className="section-header">
                <div>
                    <h2>Form Embeds</h2>
                    <p>Paste HTML/JS forms from any provider and customize how they appear</p>
                </div>
                <button className="btn btn-primary" onClick={() => setView('add-form')}>
                    ➕ Add Form
                </button>
            </div>

            {formEmbeds.length === 0 ? (
                <div className="empty-card">
                    <div className="empty-icon">📝</div>
                    <h3>No Form Embeds Yet</h3>
                    <p>Paste HTML forms from any email platform. We&apos;ll extract the fields and let you style them your way.</p>
                    <button className="btn btn-primary" onClick={() => setView('add-form')}>
                        Add Your First Form
                    </button>
                </div>
            ) : (
                <div className="forms-grid">
                    {formEmbeds.map(embed => (
                        <div key={embed.id} className={`form-embed-card ${!embed.is_active ? 'inactive' : ''}`}>
                            <div className="embed-header">
                                <h3>{embed.name}</h3>
                                <span className={`mode-badge ${embed.render_mode}`}>
                                    {embed.render_mode === 'strip_design' ? '🎨 Styled' : '📋 Original'}
                                </span>
                            </div>

                            <div className="embed-meta">
                                <span>📍 {embed.placement}</span>
                                {embed.autoresponder && (
                                    <span>🔗 {embed.autoresponder.name}</span>
                                )}
                            </div>

                            <div className="embed-stats">
                                <div className="stat">
                                    <span className="stat-value">{embed.impressions}</span>
                                    <span className="stat-label">Views</span>
                                </div>
                                <div className="stat">
                                    <span className="stat-value">{embed.submissions}</span>
                                    <span className="stat-label">Submits</span>
                                </div>
                                <div className="stat">
                                    <span className="stat-value">
                                        {embed.impressions > 0
                                            ? ((embed.submissions / embed.impressions) * 100).toFixed(1) + '%'
                                            : '0%'
                                        }
                                    </span>
                                    <span className="stat-label">Conv.</span>
                                </div>
                            </div>

                            <div className="embed-actions">
                                <button className="btn btn-sm btn-ghost">✏️ Edit</button>
                                <button className="btn btn-sm btn-ghost">👁️ Preview</button>
                                <button
                                    className="btn btn-sm btn-ghost btn-danger"
                                    onClick={() => deleteFormEmbed(embed.id)}
                                >
                                    🗑️
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );

    // =====================================================
    // RENDER: Add Form Embed
    // =====================================================

    const renderAddFormEmbed = () => (
        <div className="add-form-embed">
            <div className="section-header">
                <button className="btn btn-ghost" onClick={() => setView('forms')}>
                    ← Back
                </button>
                <h2>Add Form Embed</h2>
            </div>

            <div className="embed-form">
                <div className="form-section">
                    <div className="form-group">
                        <label>Form Name</label>
                        <input
                            type="text"
                            value={embedFormData.name}
                            onChange={e => setEmbedFormData(f => ({ ...f, name: e.target.value }))}
                            placeholder="Newsletter Signup"
                        />
                    </div>

                    <div className="form-group">
                        <label>Paste HTML/JS Form Code</label>
                        <textarea
                            value={embedFormData.html_content}
                            onChange={e => setEmbedFormData(f => ({ ...f, html_content: e.target.value }))}
                            placeholder="Paste your form HTML here..."
                            rows={10}
                            style={{ fontFamily: 'monospace', fontSize: '0.85rem' }}
                        />
                        <button
                            className="btn btn-sm btn-ghost"
                            onClick={parseFormHtml}
                            style={{ marginTop: '0.5rem' }}
                        >
                            🔍 Parse & Preview Fields
                        </button>
                    </div>
                </div>

                <div className="form-section">
                    <h3>Rendering Mode</h3>
                    <div className="render-mode-options">
                        <label className={`mode-option ${embedFormData.render_mode === 'strip_design' ? 'selected' : ''}`}>
                            <input
                                type="radio"
                                name="render_mode"
                                value="strip_design"
                                checked={embedFormData.render_mode === 'strip_design'}
                                onChange={() => setEmbedFormData(f => ({ ...f, render_mode: 'strip_design' }))}
                            />
                            <div className="mode-content">
                                <span className="mode-icon">🎨</span>
                                <strong>Strip Design</strong>
                                <p>Extract fields and apply site styling. Clean, consistent look.</p>
                            </div>
                        </label>
                        <label className={`mode-option ${embedFormData.render_mode === 'use_original' ? 'selected' : ''}`}>
                            <input
                                type="radio"
                                name="render_mode"
                                value="use_original"
                                checked={embedFormData.render_mode === 'use_original'}
                                onChange={() => setEmbedFormData(f => ({ ...f, render_mode: 'use_original' }))}
                            />
                            <div className="mode-content">
                                <span className="mode-icon">📋</span>
                                <strong>Use Original</strong>
                                <p>Render HTML exactly as provided. Keep your custom styling.</p>
                            </div>
                        </label>
                    </div>
                </div>

                <div className="form-section">
                    <h3>Placement & Trigger</h3>
                    <div className="form-row">
                        <div className="form-group">
                            <label>Placement</label>
                            <select
                                value={embedFormData.placement}
                                onChange={e => setEmbedFormData(f => ({ ...f, placement: e.target.value }))}
                            >
                                <option value="popup">Popup Modal</option>
                                <option value="inline">Inline (in content)</option>
                                <option value="footer">Footer</option>
                                <option value="sidebar">Sidebar</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Trigger (for popup)</label>
                            <select
                                value={embedFormData.trigger_type}
                                onChange={e => setEmbedFormData(f => ({ ...f, trigger_type: e.target.value }))}
                            >
                                <option value="exit_intent">Exit Intent</option>
                                <option value="scroll">Scroll Percentage</option>
                                <option value="time">Time Delay</option>
                                <option value="click">Click Element</option>
                            </select>
                        </div>
                    </div>
                </div>

                {integrations.length > 0 && (
                    <div className="form-section">
                        <h3>Sync to Autoresponder</h3>
                        <div className="form-group">
                            <label>Also sync submissions to:</label>
                            <select
                                value={embedFormData.autoresponder_id}
                                onChange={e => setEmbedFormData(f => ({ ...f, autoresponder_id: e.target.value }))}
                            >
                                <option value="">Don&apos;t sync (local only)</option>
                                {integrations.map(integration => (
                                    <option key={integration.id} value={integration.id}>
                                        {integration.name} ({getProviderInfo(integration.provider).name})
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="form-group checkbox-group">
                            <label>
                                <input
                                    type="checkbox"
                                    checked={embedFormData.save_to_local}
                                    onChange={e => setEmbedFormData(f => ({ ...f, save_to_local: e.target.checked }))}
                                />
                                Also save to local leads database
                            </label>
                        </div>
                    </div>
                )}

                <div className="form-actions primary">
                    <button className="btn btn-ghost" onClick={() => setView('forms')}>
                        Cancel
                    </button>
                    <button
                        className="btn btn-primary"
                        onClick={saveFormEmbed}
                        disabled={saving || !embedFormData.name || !embedFormData.html_content}
                    >
                        {saving ? 'Saving...' : 'Create Form Embed'}
                    </button>
                </div>
            </div>
        </div>
    );

    // =====================================================
    // MAIN RENDER
    // =====================================================

    return (
        <>
            <AdminHeader
                title="Autoresponders"
                subtitle="Manage email marketing integrations and form embeds"
            />

            <div className="admin-content">
                {/* Message Toast */}
                {message && (
                    <div className={`toast toast-${message.type}`}>
                        {message.type === 'success' ? '✓' : '⚠'} {message.text}
                    </div>
                )}

                {/* Tab Navigation */}
                <div className="ar-tabs">
                    <button
                        className={`ar-tab ${view === 'list' || view === 'add' || view === 'edit' ? 'active' : ''}`}
                        onClick={() => setView('list')}
                    >
                        🔌 Integrations
                    </button>
                    <button
                        className={`ar-tab ${view === 'forms' || view === 'add-form' ? 'active' : ''}`}
                        onClick={() => setView('forms')}
                    >
                        📝 Form Embeds
                    </button>
                </div>

                {loading ? (
                    <div className="loading-state">
                        <div className="spinner" />
                        <p>Loading...</p>
                    </div>
                ) : (
                    <>
                        {view === 'list' && renderIntegrationsList()}
                        {(view === 'add' || view === 'edit') && renderAddIntegration()}
                        {view === 'forms' && renderFormEmbedsList()}
                        {view === 'add-form' && renderAddFormEmbed()}
                    </>
                )}
            </div>

            <style jsx>{`
                /* Tabs */
                .ar-tabs {
                    display: flex;
                    gap: 0.5rem;
                    margin-bottom: 2rem;
                    border-bottom: 1px solid var(--color-border);
                    padding-bottom: 0.5rem;
                }

                .ar-tab {
                    padding: 0.75rem 1.5rem;
                    background: transparent;
                    border: none;
                    color: var(--color-foreground-secondary);
                    font-size: 0.95rem;
                    font-weight: 500;
                    cursor: pointer;
                    border-radius: var(--radius-md) var(--radius-md) 0 0;
                    transition: all 0.2s;
                }

                .ar-tab:hover {
                    color: var(--color-foreground);
                    background: var(--color-surface);
                }

                .ar-tab.active {
                    color: var(--color-accent);
                    background: var(--color-surface);
                    border-bottom: 2px solid var(--color-accent);
                }

                /* Section Header */
                .section-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 1.5rem;
                    gap: 1rem;
                }

                .section-header h2 {
                    font-size: 1.25rem;
                    margin: 0;
                }

                .section-header p {
                    margin: 0.25rem 0 0;
                    color: var(--color-foreground-secondary);
                    font-size: 0.9rem;
                }

                /* Integration Cards */
                .integrations-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
                    gap: 1.25rem;
                }

                .integration-card {
                    background: var(--color-surface);
                    border: 1px solid var(--color-border);
                    border-radius: var(--radius-lg);
                    padding: 1.25rem;
                    transition: all 0.2s;
                }

                .integration-card:hover {
                    border-color: var(--color-border-hover);
                }

                .integration-card.inactive {
                    opacity: 0.6;
                }

                .integration-header {
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                    margin-bottom: 1rem;
                }

                .provider-badge {
                    width: 48px;
                    height: 48px;
                    border-radius: var(--radius-md);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 1.5rem;
                }

                .integration-meta h3 {
                    font-size: 1rem;
                    margin: 0;
                }

                .provider-name {
                    color: var(--color-foreground-secondary);
                    font-size: 0.85rem;
                }

                .default-badge {
                    margin-left: auto;
                    padding: 0.25rem 0.75rem;
                    background: var(--color-accent);
                    color: var(--color-background);
                    border-radius: 9999px;
                    font-size: 0.75rem;
                    font-weight: 600;
                }

                .integration-stats {
                    display: flex;
                    gap: 1.5rem;
                    padding: 1rem 0;
                    border-top: 1px solid var(--color-border);
                    border-bottom: 1px solid var(--color-border);
                    margin-bottom: 1rem;
                }

                .stat {
                    display: flex;
                    flex-direction: column;
                    gap: 0.25rem;
                }

                .stat-value {
                    font-size: 1.25rem;
                    font-weight: 600;
                }

                .stat-label {
                    font-size: 0.75rem;
                    color: var(--color-foreground-secondary);
                    text-transform: uppercase;
                }

                .status-dot {
                    width: 8px;
                    height: 8px;
                    border-radius: 50%;
                    background: var(--color-error);
                }

                .status-dot.verified {
                    background: var(--color-success);
                }

                .integration-error {
                    padding: 0.75rem;
                    background: rgba(239, 68, 68, 0.1);
                    border-radius: var(--radius-sm);
                    color: var(--color-error);
                    font-size: 0.85rem;
                    margin-bottom: 1rem;
                }

                .integration-actions {
                    display: flex;
                    gap: 0.5rem;
                    flex-wrap: wrap;
                }

                /* Provider Selection Grid */
                .provider-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
                    gap: 1rem;
                }

                .provider-card {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 0.75rem;
                    padding: 1.5rem;
                    background: var(--color-surface);
                    border: 2px solid var(--color-border);
                    border-radius: var(--radius-lg);
                    cursor: pointer;
                    transition: all 0.2s;
                    text-align: center;
                }

                .provider-card:hover {
                    border-color: var(--color-accent);
                    transform: translateY(-2px);
                }

                .provider-icon {
                    width: 56px;
                    height: 56px;
                    border-radius: var(--radius-md);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 1.75rem;
                }

                .provider-card .provider-name {
                    font-weight: 600;
                    color: var(--color-foreground);
                }

                .provider-desc {
                    font-size: 0.8rem;
                    color: var(--color-foreground-secondary);
                }

                /* Integration Form */
                .integration-form,
                .embed-form {
                    max-width: 640px;
                }

                .selected-provider {
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                    padding: 1rem;
                    background: var(--color-surface);
                    border: 1px solid var(--color-border);
                    border-radius: var(--radius-md);
                    margin-bottom: 1.5rem;
                }

                .selected-provider p {
                    margin: 0.25rem 0 0;
                    font-size: 0.85rem;
                    color: var(--color-foreground-secondary);
                }

                .form-section {
                    background: var(--color-surface);
                    border: 1px solid var(--color-border);
                    border-radius: var(--radius-lg);
                    padding: 1.5rem;
                    margin-bottom: 1.5rem;
                }

                .form-section h3 {
                    margin: 0 0 1rem;
                    font-size: 1rem;
                }

                .form-group {
                    margin-bottom: 1rem;
                }

                .form-group:last-child {
                    margin-bottom: 0;
                }

                .form-group label {
                    display: block;
                    margin-bottom: 0.5rem;
                    font-weight: 500;
                    font-size: 0.9rem;
                }

                .form-group label .hint {
                    font-weight: 400;
                    color: var(--color-foreground-secondary);
                }

                .form-group input,
                .form-group select,
                .form-group textarea {
                    width: 100%;
                    padding: 0.75rem 1rem;
                    background: var(--color-background);
                    border: 1px solid var(--color-border);
                    border-radius: var(--radius-md);
                    color: var(--color-foreground);
                    font-size: 0.95rem;
                }

                .form-group input:focus,
                .form-group select:focus,
                .form-group textarea:focus {
                    outline: none;
                    border-color: var(--color-accent);
                }

                .form-row {
                    display: grid;
                    grid-template-columns: repeat(2, 1fr);
                    gap: 1rem;
                }

                .checkbox-group label {
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                    cursor: pointer;
                }

                .checkbox-group input[type="checkbox"] {
                    width: auto;
                }

                .form-actions {
                    display: flex;
                    gap: 0.75rem;
                }

                .form-actions.primary {
                    justify-content: flex-end;
                    padding-top: 1rem;
                    border-top: 1px solid var(--color-border);
                    margin-top: 1.5rem;
                }

                .loading-lists {
                    padding: 1rem;
                    text-align: center;
                    color: var(--color-foreground-secondary);
                }

                .oauth-notice {
                    padding: 1rem;
                    background: rgba(245, 158, 11, 0.1);
                    border: 1px solid rgba(245, 158, 11, 0.3);
                    border-radius: var(--radius-md);
                }

                .oauth-notice p {
                    margin: 0;
                    color: #f59e0b;
                }

                /* Render Mode Options */
                .render-mode-options {
                    display: grid;
                    grid-template-columns: repeat(2, 1fr);
                    gap: 1rem;
                }

                .mode-option {
                    display: block;
                    padding: 1.25rem;
                    background: var(--color-background);
                    border: 2px solid var(--color-border);
                    border-radius: var(--radius-md);
                    cursor: pointer;
                    transition: all 0.2s;
                }

                .mode-option:hover {
                    border-color: var(--color-border-hover);
                }

                .mode-option.selected {
                    border-color: var(--color-accent);
                    background: rgba(var(--color-accent-rgb), 0.05);
                }

                .mode-option input {
                    display: none;
                }

                .mode-content {
                    display: flex;
                    flex-direction: column;
                    gap: 0.25rem;
                }

                .mode-icon {
                    font-size: 1.5rem;
                    margin-bottom: 0.5rem;
                }

                .mode-content p {
                    margin: 0;
                    font-size: 0.85rem;
                    color: var(--color-foreground-secondary);
                }

                /* Form Embeds Grid */
                .forms-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
                    gap: 1.25rem;
                }

                .form-embed-card {
                    background: var(--color-surface);
                    border: 1px solid var(--color-border);
                    border-radius: var(--radius-lg);
                    padding: 1.25rem;
                }

                .form-embed-card.inactive {
                    opacity: 0.6;
                }

                .embed-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 0.75rem;
                }

                .embed-header h3 {
                    font-size: 1rem;
                    margin: 0;
                }

                .mode-badge {
                    padding: 0.25rem 0.5rem;
                    border-radius: var(--radius-sm);
                    font-size: 0.75rem;
                    font-weight: 500;
                }

                .mode-badge.strip_design {
                    background: rgba(16, 185, 129, 0.15);
                    color: #10b981;
                }

                .mode-badge.use_original {
                    background: rgba(99, 102, 241, 0.15);
                    color: #6366f1;
                }

                .embed-meta {
                    display: flex;
                    gap: 1rem;
                    color: var(--color-foreground-secondary);
                    font-size: 0.85rem;
                    margin-bottom: 1rem;
                }

                .embed-stats {
                    display: flex;
                    gap: 1.5rem;
                    padding: 1rem 0;
                    border-top: 1px solid var(--color-border);
                    border-bottom: 1px solid var(--color-border);
                    margin-bottom: 1rem;
                }

                .embed-actions {
                    display: flex;
                    gap: 0.5rem;
                }

                /* Empty State */
                .empty-card {
                    text-align: center;
                    padding: 3rem;
                    background: var(--color-surface);
                    border: 1px dashed var(--color-border);
                    border-radius: var(--radius-lg);
                }

                .empty-icon {
                    font-size: 3rem;
                    margin-bottom: 1rem;
                }

                .empty-card h3 {
                    margin: 0 0 0.5rem;
                }

                .empty-card p {
                    color: var(--color-foreground-secondary);
                    margin: 0 0 1.5rem;
                }

                /* Loading State */
                .loading-state {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    padding: 4rem;
                    gap: 1rem;
                }

                .spinner {
                    width: 40px;
                    height: 40px;
                    border: 3px solid var(--color-border);
                    border-top-color: var(--color-accent);
                    border-radius: 50%;
                    animation: spin 1s linear infinite;
                }

                @keyframes spin {
                    to { transform: rotate(360deg); }
                }

                /* Toast */
                .toast {
                    position: fixed;
                    top: 1rem;
                    right: 1rem;
                    padding: 1rem 1.5rem;
                    border-radius: var(--radius-md);
                    font-weight: 500;
                    z-index: 100;
                    animation: slideIn 0.3s ease;
                }

                .toast-success {
                    background: var(--color-success);
                    color: white;
                }

                .toast-error {
                    background: var(--color-error);
                    color: white;
                }

                @keyframes slideIn {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }

                /* Button Styles */
                .btn {
                    display: inline-flex;
                    align-items: center;
                    gap: 0.5rem;
                    padding: 0.625rem 1.25rem;
                    border-radius: var(--radius-md);
                    font-weight: 500;
                    font-size: 0.9rem;
                    cursor: pointer;
                    transition: all 0.2s;
                    border: 1px solid transparent;
                }

                .btn-primary {
                    background: var(--color-accent-gradient);
                    color: var(--color-background);
                }

                .btn-primary:hover {
                    box-shadow: var(--shadow-glow);
                }

                .btn-secondary {
                    background: var(--color-surface);
                    border-color: var(--color-border);
                    color: var(--color-foreground);
                }

                .btn-secondary:hover {
                    border-color: var(--color-accent);
                }

                .btn-ghost {
                    background: transparent;
                    color: var(--color-foreground-secondary);
                }

                .btn-ghost:hover {
                    background: var(--color-surface);
                    color: var(--color-foreground);
                }

                .btn-danger:hover {
                    background: rgba(239, 68, 68, 0.1);
                    color: var(--color-error);
                }

                .btn-sm {
                    padding: 0.375rem 0.75rem;
                    font-size: 0.8rem;
                }

                .btn:disabled {
                    opacity: 0.5;
                    cursor: not-allowed;
                }

                /* Responsive */
                @media (max-width: 768px) {
                    .integrations-grid,
                    .forms-grid,
                    .provider-grid {
                        grid-template-columns: 1fr;
                    }

                    .form-row {
                        grid-template-columns: 1fr;
                    }

                    .render-mode-options {
                        grid-template-columns: 1fr;
                    }
                }
            `}</style>
        </>
    );
}
