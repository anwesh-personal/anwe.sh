'use client';

/**
 * Autoresponders Admin Page
 * Professional UI for managing email marketing integrations and form embeds
 */

import { useState, useEffect, useCallback } from 'react';
import { AdminHeader } from '@/components/admin';
import styles from './page.module.css';

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
    icon: React.ReactNode;
    description: string;
    color: string;
    requiresApiKey: boolean;
    requiresApiUrl: boolean;
    requiresOAuth: boolean;
}

// =====================================================
// PROVIDER CONFIG WITH SVG ICONS
// =====================================================

const PROVIDERS: ProviderInfo[] = [
    {
        id: 'mailchimp',
        name: 'Mailchimp',
        icon: (
            <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
                <path d="M19.2 14.4c-.2-.1-.4-.1-.6 0-.1 0-.2.1-.3.2-.2.2-.3.5-.2.8.1.4.4.6.8.6.2 0 .4-.1.6-.2.2-.2.3-.5.2-.8-.1-.3-.3-.5-.5-.6zm-2.4-1.2c-.3-.1-.6 0-.8.2-.2.3-.2.7.1.9.3.2.7.2.9-.1.2-.3.2-.7-.1-.9l-.1-.1zm-4.2 4.2c-.5.3-1.1.3-1.6.1-.5-.2-.8-.7-.8-1.2 0-.4.2-.9.5-1.2l.4-.4c.1-.1.1-.2.1-.3 0-.1-.1-.2-.2-.2-.6-.2-1.2-.1-1.8.2-.5.3-.9.8-1.1 1.4-.2.6-.2 1.3.1 1.9.3.6.8 1 1.4 1.3.6.2 1.3.2 1.9-.1.6-.3 1-.8 1.3-1.4.1-.2 0-.4-.2-.5-.1 0-.2.1-.2.2 0 .1.1.2.2.2zm6.6-8.2c-.4-.8-1.1-1.4-2-1.6-.6-.2-1.2-.1-1.8.1.3-.6.4-1.2.3-1.9-.1-.7-.5-1.3-1-1.8-.5-.4-1.2-.7-1.9-.7-.7 0-1.4.2-2 .6-.5.4-.9.9-1.1 1.5-.2.6-.2 1.2 0 1.8-.6-.2-1.3-.2-1.9 0-.6.2-1.2.6-1.6 1.1-.4.5-.6 1.1-.6 1.8 0 .5.1 1 .3 1.4-.4.2-.7.5-1 .9-.3.4-.4.9-.4 1.4 0 .7.3 1.4.8 1.9.5.5 1.2.8 1.9.8.4 0 .7-.1 1-.2-.1.3-.1.7-.1 1 .1.7.4 1.3.9 1.8.5.5 1.2.7 1.9.7.3 0 .6 0 .9-.1.5 1.1 1.4 2 2.5 2.5 1.1.5 2.3.6 3.5.2 1.2-.4 2.1-1.2 2.8-2.2.6-1 .9-2.2.7-3.4-.1-.5-.2-1-.4-1.4.4-.2.7-.4 1-.7.5-.5.8-1.2.8-1.9 0-.6-.2-1.2-.5-1.7zm-1.6 2.8c-.2.2-.5.4-.8.4-.3.1-.6 0-.9-.1.4.7.6 1.4.6 2.2.1 1-.2 2-.7 2.8-.6.8-1.4 1.5-2.3 1.8-1 .3-2 .3-2.9-.2-.9-.4-1.6-1.2-2-2.1-.2.1-.5.1-.7.1-.5 0-1-.2-1.4-.5-.4-.4-.6-.9-.6-1.4 0-.3.1-.5.2-.8-.5.2-1 .2-1.5.1-.5-.2-.9-.5-1.2-.9-.3-.4-.4-.9-.3-1.4.1-.5.4-.9.8-1.2.4-.3.9-.4 1.4-.4-.2-.4-.3-.8-.3-1.3 0-.5.2-1 .5-1.4.3-.4.8-.7 1.3-.9.5-.1 1-.1 1.5.1-.2-.5-.2-1-.1-1.5.1-.5.4-1 .8-1.3.4-.3.9-.5 1.5-.5.5 0 1.1.2 1.5.5.4.4.7.9.8 1.4.1.5 0 1.1-.2 1.6.5-.2 1.1-.3 1.6-.2.6.1 1.1.4 1.5.9.4.4.6 1 .6 1.5 0 .6-.2 1.1-.6 1.5z" />
            </svg>
        ),
        description: 'Email marketing & automation',
        color: '#FFE01B',
        requiresApiKey: true,
        requiresApiUrl: false,
        requiresOAuth: false,
    },
    {
        id: 'convertkit',
        name: 'ConvertKit',
        icon: (
            <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z" />
            </svg>
        ),
        description: 'Creator-focused email marketing',
        color: '#FB6970',
        requiresApiKey: true,
        requiresApiUrl: false,
        requiresOAuth: false,
    },
    {
        id: 'activecampaign',
        name: 'ActiveCampaign',
        icon: (
            <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
                <path d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
        ),
        description: 'Marketing automation & CRM',
        color: '#356AE6',
        requiresApiKey: true,
        requiresApiUrl: true,
        requiresOAuth: false,
    },
    {
        id: 'aweber',
        name: 'AWeber',
        icon: (
            <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
                <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" />
            </svg>
        ),
        description: 'Email marketing for small business',
        color: '#2D7EEE',
        requiresApiKey: false,
        requiresApiUrl: false,
        requiresOAuth: true,
    },
    {
        id: 'brevo',
        name: 'Brevo',
        icon: (
            <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
        ),
        description: 'Email, SMS & CRM platform',
        color: '#00A651',
        requiresApiKey: true,
        requiresApiUrl: false,
        requiresOAuth: false,
    },
    {
        id: 'custom',
        name: 'Custom / Webhook',
        icon: (
            <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
                <path d="M3.9 12c0-1.71 1.39-3.1 3.1-3.1h4V7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h4v-1.9H7c-1.71 0-3.1-1.39-3.1-3.1zM8 13h8v-2H8v2zm9-6h-4v1.9h4c1.71 0 3.1 1.39 3.1 3.1s-1.39 3.1-3.1 3.1h-4V17h4c2.76 0 5-2.24 5-5s-2.24-5-5-5z" />
            </svg>
        ),
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
                    <div className={`${styles.toast} ${message.type === 'success' ? styles.toastSuccess : styles.toastError}`}>
                        {message.type === 'success' ? '✓' : '⚠'} {message.text}
                    </div>
                )}

                {/* Tab Navigation */}
                <div className={styles.arTabs}>
                    <button
                        className={`${styles.arTab} ${view === 'list' || view === 'add' || view === 'edit' ? styles.arTabActive : ''}`}
                        onClick={() => setView('list')}
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48l2.83-2.83" />
                        </svg>
                        Integrations
                    </button>
                    <button
                        className={`${styles.arTab} ${view === 'forms' || view === 'add-form' ? styles.arTabActive : ''}`}
                        onClick={() => setView('forms')}
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                            <polyline points="14 2 14 8 20 8" />
                            <line x1="16" y1="13" x2="8" y2="13" />
                            <line x1="16" y1="17" x2="8" y2="17" />
                        </svg>
                        Form Embeds
                    </button>
                </div>

                {loading ? (
                    <div className={styles.loadingState}>
                        <div className={styles.spinner} />
                        <p>Loading...</p>
                    </div>
                ) : (
                    <>
                        {/* Integrations List View */}
                        {view === 'list' && (
                            <div>
                                <div className={styles.sectionHeader}>
                                    <div>
                                        <h2>Email Marketing Integrations</h2>
                                        <p>Connect your email marketing platforms to sync leads automatically</p>
                                    </div>
                                    <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={() => setView('add')}>
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <line x1="12" y1="5" x2="12" y2="19" />
                                            <line x1="5" y1="12" x2="19" y2="12" />
                                        </svg>
                                        Add Integration
                                    </button>
                                </div>

                                {integrations.length === 0 ? (
                                    <div className={styles.emptyCard}>
                                        <div className={styles.emptyIcon}>
                                            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                                                <polyline points="22,6 12,13 2,6" />
                                            </svg>
                                        </div>
                                        <h3>No Integrations Yet</h3>
                                        <p>Connect an email marketing platform to automatically sync your leads.</p>
                                        <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={() => setView('add')}>
                                            Add Your First Integration
                                        </button>
                                    </div>
                                ) : (
                                    <div className={styles.integrationsGrid}>
                                        {integrations.map(integration => {
                                            const provider = getProviderInfo(integration.provider);
                                            return (
                                                <div
                                                    key={integration.id}
                                                    className={`${styles.integrationCard} ${!integration.is_active ? styles.integrationCardInactive : ''}`}
                                                >
                                                    <div className={styles.integrationHeader}>
                                                        <div className={styles.providerBadge} style={{ background: provider.color, color: '#000' }}>
                                                            {provider.icon}
                                                        </div>
                                                        <div className={styles.integrationMeta}>
                                                            <h3>{integration.name}</h3>
                                                            <span className={styles.providerName}>{provider.name}</span>
                                                        </div>
                                                        {integration.is_default && (
                                                            <span className={styles.defaultBadge}>Default</span>
                                                        )}
                                                    </div>

                                                    <div className={styles.integrationStats}>
                                                        <div className={styles.stat}>
                                                            <span className={styles.statValue}>{integration.total_synced}</span>
                                                            <span className={styles.statLabel}>Synced</span>
                                                        </div>
                                                        <div className={styles.stat}>
                                                            <span className={styles.statValue}>
                                                                {integration.cached_lists?.length || 0}
                                                            </span>
                                                            <span className={styles.statLabel}>Lists</span>
                                                        </div>
                                                        <div className={styles.stat}>
                                                            <span className={`${styles.statusDot} ${integration.is_verified ? styles.statusDotVerified : ''}`} />
                                                            <span className={styles.statLabel}>
                                                                {integration.is_verified ? 'Connected' : 'Error'}
                                                            </span>
                                                        </div>
                                                    </div>

                                                    {integration.last_error && (
                                                        <div className={styles.integrationError}>
                                                            ⚠️ {integration.last_error}
                                                        </div>
                                                    )}

                                                    <div className={styles.integrationActions}>
                                                        <button
                                                            className={`${styles.btn} ${styles.btnSm} ${styles.btnGhost}`}
                                                            onClick={() => toggleActive(integration)}
                                                        >
                                                            {integration.is_active ? '⏸️ Pause' : '▶️ Enable'}
                                                        </button>
                                                        {!integration.is_default && (
                                                            <button
                                                                className={`${styles.btn} ${styles.btnSm} ${styles.btnGhost}`}
                                                                onClick={() => setAsDefault(integration)}
                                                            >
                                                                ⭐ Set Default
                                                            </button>
                                                        )}
                                                        <button
                                                            className={`${styles.btn} ${styles.btnSm} ${styles.btnGhost}`}
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
                                                            className={`${styles.btn} ${styles.btnSm} ${styles.btnGhost} ${styles.btnDanger}`}
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
                        )}

                        {/* Add/Edit Integration View */}
                        {(view === 'add' || view === 'edit') && (
                            <div>
                                <div className={styles.sectionHeader}>
                                    <button className={`${styles.btn} ${styles.btnGhost}`} onClick={() => {
                                        if (selectedProvider) {
                                            // If provider is selected, go back to provider selection
                                            setSelectedProvider(null);
                                            setProviderData(null);
                                        } else {
                                            // Otherwise go back to list
                                            setView('list');
                                            resetForm();
                                        }
                                    }}>
                                        ← Back
                                    </button>
                                    <h2>{editingIntegration ? 'Edit Integration' : (selectedProvider ? `Configure ${selectedProvider.name}` : 'Add Integration')}</h2>
                                </div>


                                {!selectedProvider ? (
                                    <div className={styles.providerGrid}>
                                        {PROVIDERS.map(provider => (
                                            <button
                                                key={provider.id}
                                                className={styles.providerCard}
                                                onClick={() => setSelectedProvider(provider)}
                                            >
                                                <span className={styles.providerIcon} style={{ background: provider.color, color: '#000' }}>
                                                    {provider.icon}
                                                </span>
                                                <span className={styles.providerName}>{provider.name}</span>
                                                <span className={styles.providerDesc}>{provider.description}</span>
                                            </button>
                                        ))}
                                    </div>
                                ) : (
                                    <div className={styles.integrationForm}>
                                        <div className={styles.selectedProvider}>
                                            <span className={styles.providerIcon} style={{ background: selectedProvider.color, color: '#000' }}>
                                                {selectedProvider.icon}
                                            </span>
                                            <div>
                                                <strong>{selectedProvider.name}</strong>
                                                <p>{selectedProvider.description}</p>
                                            </div>
                                            <button
                                                className={`${styles.btn} ${styles.btnGhost} ${styles.btnSm}`}
                                                onClick={() => { setSelectedProvider(null); setProviderData(null); }}
                                            >
                                                Change
                                            </button>
                                        </div>

                                        <div className={styles.formSection}>
                                            <div className={styles.formGroup}>
                                                <label>Integration Name</label>
                                                <input
                                                    type="text"
                                                    value={formData.name}
                                                    onChange={e => setFormData(f => ({ ...f, name: e.target.value }))}
                                                    placeholder={`My ${selectedProvider.name} Account`}
                                                />
                                            </div>

                                            {selectedProvider.requiresApiKey && (
                                                <div className={styles.formGroup}>
                                                    <label>
                                                        API Key
                                                        {selectedProvider.id === 'mailchimp' && (
                                                            <span className={styles.hint}> (format: abc123-us14)</span>
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
                                                <div className={styles.formGroup}>
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
                                                    <div className={styles.formGroup}>
                                                        <label>Subscribe Webhook URL</label>
                                                        <input
                                                            type="url"
                                                            value={formData.custom_subscribe_url}
                                                            onChange={e => setFormData(f => ({ ...f, custom_subscribe_url: e.target.value }))}
                                                            placeholder="https://your-api.com/subscribe"
                                                        />
                                                    </div>
                                                    <div className={styles.formRow}>
                                                        <div className={styles.formGroup}>
                                                            <label>Email Field Name</label>
                                                            <input
                                                                type="text"
                                                                value={formData.custom_email_field}
                                                                onChange={e => setFormData(f => ({ ...f, custom_email_field: e.target.value }))}
                                                                placeholder="email"
                                                            />
                                                        </div>
                                                        <div className={styles.formGroup}>
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
                                                <div className={styles.oauthNotice}>
                                                    <p>⚠️ OAuth integration requires additional setup. Please configure OAuth credentials in your environment.</p>
                                                </div>
                                            )}

                                            <div className={styles.formActions}>
                                                <button
                                                    className={`${styles.btn} ${styles.btnSecondary}`}
                                                    onClick={validateCredentials}
                                                    disabled={validating}
                                                >
                                                    {validating ? '⏳ Validating...' : '🔗 Test Connection'}
                                                </button>
                                            </div>
                                        </div>

                                        {/* Lists/Forms Selection */}
                                        {providerData && (providerData.lists.length > 0 || providerData.forms.length > 0) && (
                                            <div className={styles.formSection}>
                                                <h3>Select Default List/Form</h3>

                                                {providerData.lists.length > 0 && (
                                                    <div className={styles.formGroup}>
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
                                                    <div className={styles.formGroup}>
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
                                            <div className={styles.loadingLists}>
                                                ⏳ Fetching lists and forms from {selectedProvider.name}...
                                            </div>
                                        )}

                                        <div className={styles.formSection}>
                                            <div className={`${styles.formGroup} ${styles.checkboxGroup}`}>
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

                                        <div className={`${styles.formActions} ${styles.formActionsPrimary}`}>
                                            <button
                                                className={`${styles.btn} ${styles.btnGhost}`}
                                                onClick={() => { setView('list'); resetForm(); }}
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                className={`${styles.btn} ${styles.btnPrimary}`}
                                                onClick={saveIntegration}
                                                disabled={saving}
                                            >
                                                {saving ? 'Saving...' : (editingIntegration ? 'Update Integration' : 'Save Integration')}
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Form Embeds List View */}
                        {view === 'forms' && (
                            <div>
                                <div className={styles.sectionHeader}>
                                    <div>
                                        <h2>Form Embeds</h2>
                                        <p>Paste HTML/JS forms from any provider and customize how they appear</p>
                                    </div>
                                    <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={() => setView('add-form')}>
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <line x1="12" y1="5" x2="12" y2="19" />
                                            <line x1="5" y1="12" x2="19" y2="12" />
                                        </svg>
                                        Add Form
                                    </button>
                                </div>

                                {formEmbeds.length === 0 ? (
                                    <div className={styles.emptyCard}>
                                        <div className={styles.emptyIcon}>
                                            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                                <polyline points="14 2 14 8 20 8" />
                                                <line x1="16" y1="13" x2="8" y2="13" />
                                                <line x1="16" y1="17" x2="8" y2="17" />
                                            </svg>
                                        </div>
                                        <h3>No Form Embeds Yet</h3>
                                        <p>Paste HTML forms from any email platform. We&apos;ll extract the fields and let you style them your way.</p>
                                        <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={() => setView('add-form')}>
                                            Add Your First Form
                                        </button>
                                    </div>
                                ) : (
                                    <div className={styles.formsGrid}>
                                        {formEmbeds.map(embed => (
                                            <div key={embed.id} className={`${styles.formEmbedCard} ${!embed.is_active ? styles.formEmbedCardInactive : ''}`}>
                                                <div className={styles.embedHeader}>
                                                    <h3>{embed.name}</h3>
                                                    <span className={`${styles.modeBadge} ${embed.render_mode === 'strip_design' ? styles.modeBadgeStripDesign : styles.modeBadgeUseOriginal}`}>
                                                        {embed.render_mode === 'strip_design' ? '🎨 Styled' : '📋 Original'}
                                                    </span>
                                                </div>

                                                <div className={styles.embedMeta}>
                                                    <span>📍 {embed.placement}</span>
                                                    {embed.autoresponder && (
                                                        <span>🔗 {embed.autoresponder.name}</span>
                                                    )}
                                                </div>

                                                <div className={styles.embedStats}>
                                                    <div className={styles.stat}>
                                                        <span className={styles.statValue}>{embed.impressions}</span>
                                                        <span className={styles.statLabel}>Views</span>
                                                    </div>
                                                    <div className={styles.stat}>
                                                        <span className={styles.statValue}>{embed.submissions}</span>
                                                        <span className={styles.statLabel}>Submits</span>
                                                    </div>
                                                    <div className={styles.stat}>
                                                        <span className={styles.statValue}>
                                                            {embed.impressions > 0
                                                                ? ((embed.submissions / embed.impressions) * 100).toFixed(1) + '%'
                                                                : '0%'
                                                            }
                                                        </span>
                                                        <span className={styles.statLabel}>Conv.</span>
                                                    </div>
                                                </div>

                                                <div className={styles.embedActions}>
                                                    <button className={`${styles.btn} ${styles.btnSm} ${styles.btnGhost}`}>✏️ Edit</button>
                                                    <button className={`${styles.btn} ${styles.btnSm} ${styles.btnGhost}`}>👁️ Preview</button>
                                                    <button
                                                        className={`${styles.btn} ${styles.btnSm} ${styles.btnGhost} ${styles.btnDanger}`}
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
                        )}

                        {/* Add Form Embed View */}
                        {view === 'add-form' && (
                            <div>
                                <div className={styles.sectionHeader}>
                                    <button className={`${styles.btn} ${styles.btnGhost}`} onClick={() => setView('forms')}>
                                        ← Back
                                    </button>
                                    <h2>Add Form Embed</h2>
                                </div>

                                <div className={styles.embedForm}>
                                    <div className={styles.formSection}>
                                        <div className={styles.formGroup}>
                                            <label>Form Name</label>
                                            <input
                                                type="text"
                                                value={embedFormData.name}
                                                onChange={e => setEmbedFormData(f => ({ ...f, name: e.target.value }))}
                                                placeholder="Newsletter Signup"
                                            />
                                        </div>

                                        <div className={styles.formGroup}>
                                            <label>Paste HTML/JS Form Code</label>
                                            <textarea
                                                value={embedFormData.html_content}
                                                onChange={e => setEmbedFormData(f => ({ ...f, html_content: e.target.value }))}
                                                placeholder="Paste your form HTML here..."
                                                rows={10}
                                                style={{ fontFamily: 'monospace', fontSize: '0.85rem' }}
                                            />
                                            <button
                                                className={`${styles.btn} ${styles.btnSm} ${styles.btnGhost}`}
                                                onClick={parseFormHtml}
                                                style={{ marginTop: '0.5rem' }}
                                            >
                                                🔍 Parse & Preview Fields
                                            </button>
                                        </div>
                                    </div>

                                    <div className={styles.formSection}>
                                        <h3>Rendering Mode</h3>
                                        <div className={styles.renderModeOptions}>
                                            <label className={`${styles.modeOption} ${embedFormData.render_mode === 'strip_design' ? styles.modeOptionSelected : ''}`}>
                                                <input
                                                    type="radio"
                                                    name="render_mode"
                                                    value="strip_design"
                                                    checked={embedFormData.render_mode === 'strip_design'}
                                                    onChange={() => setEmbedFormData(f => ({ ...f, render_mode: 'strip_design' }))}
                                                />
                                                <div className={styles.modeContent}>
                                                    <span className={styles.modeIcon}>🎨</span>
                                                    <strong>Strip Design</strong>
                                                    <p>Extract fields and apply site styling. Clean, consistent look.</p>
                                                </div>
                                            </label>
                                            <label className={`${styles.modeOption} ${embedFormData.render_mode === 'use_original' ? styles.modeOptionSelected : ''}`}>
                                                <input
                                                    type="radio"
                                                    name="render_mode"
                                                    value="use_original"
                                                    checked={embedFormData.render_mode === 'use_original'}
                                                    onChange={() => setEmbedFormData(f => ({ ...f, render_mode: 'use_original' }))}
                                                />
                                                <div className={styles.modeContent}>
                                                    <span className={styles.modeIcon}>📋</span>
                                                    <strong>Use Original</strong>
                                                    <p>Render HTML exactly as provided. Keep your custom styling.</p>
                                                </div>
                                            </label>
                                        </div>
                                    </div>

                                    <div className={styles.formSection}>
                                        <h3>Placement & Trigger</h3>
                                        <div className={styles.formRow}>
                                            <div className={styles.formGroup}>
                                                <label>Placement</label>
                                                <select
                                                    value={embedFormData.placement}
                                                    onChange={e => setEmbedFormData(f => ({ ...f, placement: e.target.value }))}
                                                >
                                                    <option value="popup">Popup Modal</option>
                                                    <option value="inline">Inline (in content)</option>
                                                    <option value="footer">Footer</option>
                                                    <option value="sidebar">Sidebar</option>
                                                    <option value="custom">Custom Selector</option>
                                                </select>
                                            </div>
                                            <div className={styles.formGroup}>
                                                <label>Trigger</label>
                                                <select
                                                    value={embedFormData.trigger_type}
                                                    onChange={e => setEmbedFormData(f => ({ ...f, trigger_type: e.target.value }))}
                                                >
                                                    <option value="exit_intent">Exit Intent</option>
                                                    <option value="scroll">Scroll Percentage</option>
                                                    <option value="time">Time Delay</option>
                                                    <option value="click">On Click</option>
                                                    <option value="manual">Manual</option>
                                                </select>
                                            </div>
                                        </div>
                                    </div>

                                    <div className={styles.formSection}>
                                        <h3>Sync Settings</h3>
                                        {integrations.length > 0 && (
                                            <div className={styles.formGroup}>
                                                <label>Sync to Autoresponder</label>
                                                <select
                                                    value={embedFormData.autoresponder_id}
                                                    onChange={e => setEmbedFormData(f => ({ ...f, autoresponder_id: e.target.value }))}
                                                >
                                                    <option value="">None (form submits directly)</option>
                                                    {integrations.map(integration => (
                                                        <option key={integration.id} value={integration.id}>
                                                            {integration.name} ({integration.providerName})
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                        )}
                                        <div className={`${styles.formGroup} ${styles.checkboxGroup}`}>
                                            <label>
                                                <input
                                                    type="checkbox"
                                                    checked={embedFormData.save_to_local}
                                                    onChange={e => setEmbedFormData(f => ({ ...f, save_to_local: e.target.checked }))}
                                                />
                                                Also save submissions to local leads database
                                            </label>
                                        </div>
                                    </div>

                                    <div className={`${styles.formActions} ${styles.formActionsPrimary}`}>
                                        <button
                                            className={`${styles.btn} ${styles.btnGhost}`}
                                            onClick={() => setView('forms')}
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            className={`${styles.btn} ${styles.btnPrimary}`}
                                            onClick={saveFormEmbed}
                                            disabled={saving || !embedFormData.name || !embedFormData.html_content}
                                        >
                                            {saving ? 'Saving...' : 'Create Form Embed'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </>
    );
}
