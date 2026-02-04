'use client';

import { useState, useEffect } from 'react';
import { AdminHeader, ThemeSwitcher } from '@/components/admin';
import { supabase } from '@/lib/supabase';
import { useTheme } from '@/components/ThemeProvider';

type SettingsTab = 'general' | 'profile' | 'appearance' | 'seo' | 'social' | 'integrations';

interface SiteSettings {
    siteName: string;
    siteTagline: string;
    siteDescription: string;
    siteLogo: string;
    siteFavicon: string;
    defaultMetaTitle: string;
    defaultMetaDescription: string;
    defaultOgImage: string;
    socialTwitter: string;
    socialLinkedin: string;
    socialGithub: string;
    socialYoutube: string;
    googleAnalyticsId: string;
    customHeadCode: string;
    customBodyCode: string;
}

export default function SettingsPage() {
    const [activeTab, setActiveTab] = useState<SettingsTab>('general');
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
    const { theme } = useTheme();

    // Profile state
    const [email, setEmail] = useState('');
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    // Site settings state
    const [settings, setSettings] = useState<SiteSettings>({
        siteName: 'ANWE.SH',
        siteTagline: 'Building the Future of AI',
        siteDescription: 'Technical blog and portfolio of Anwesh Rath',
        siteLogo: '',
        siteFavicon: '',
        defaultMetaTitle: 'ANWE.SH | AI Systems Architect',
        defaultMetaDescription: 'Insights on AI systems, enterprise architecture, and building at scale.',
        defaultOgImage: '',
        socialTwitter: '',
        socialLinkedin: '',
        socialGithub: '',
        socialYoutube: '',
        googleAnalyticsId: '',
        customHeadCode: '',
        customBodyCode: ''
    });

    // Load user email
    useEffect(() => {
        const loadUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user?.email) {
                setEmail(user.email);
            }
        };
        loadUser();
    }, []);

    // Load site settings
    useEffect(() => {
        const loadSettings = async () => {
            try {
                const res = await fetch('/api/settings');
                const json = await res.json();

                if (json.settings) {
                    const newSettings = { ...settings };
                    json.settings.forEach((row: { key: string; value: string }) => {
                        if (row.key in newSettings) {
                            (newSettings as Record<string, string>)[row.key] = row.value;
                        }
                    });
                    setSettings(newSettings);
                }
            } catch (error) {
                console.error('Failed to load settings:', error);
            }
        };
        loadSettings();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const showMessage = (type: 'success' | 'error', text: string) => {
        setMessage({ type, text });
        setTimeout(() => setMessage(null), 3000);
    };

    const handlePasswordChange = async () => {
        if (!newPassword || !confirmPassword) {
            showMessage('error', 'Please fill in both password fields');
            return;
        }

        if (newPassword !== confirmPassword) {
            showMessage('error', 'Passwords do not match');
            return;
        }

        if (newPassword.length < 8) {
            showMessage('error', 'Password must be at least 8 characters');
            return;
        }

        setSaving(true);
        const { error } = await supabase.auth.updateUser({ password: newPassword });
        setSaving(false);

        if (error) {
            showMessage('error', error.message);
        } else {
            showMessage('success', 'Password updated successfully');
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
        }
    };

    const handleEmailChange = async () => {
        if (!email) {
            showMessage('error', 'Email is required');
            return;
        }

        setSaving(true);
        const { error } = await supabase.auth.updateUser({ email });
        setSaving(false);

        if (error) {
            showMessage('error', error.message);
        } else {
            showMessage('success', 'Confirmation email sent to new address');
        }
    };

    const handleSaveSettings = async () => {
        setSaving(true);

        try {
            // Save each setting via API
            for (const [key, value] of Object.entries(settings)) {
                await fetch('/api/settings', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ key, value })
                });
            }
            showMessage('success', 'Settings saved successfully');
        } catch (error) {
            console.error('Failed to save settings:', error);
            showMessage('error', 'Failed to save settings');
        }

        setSaving(false);
    };

    const tabs: { id: SettingsTab; label: string; icon: string }[] = [
        { id: 'general', label: 'General', icon: '⚙️' },
        { id: 'profile', label: 'Profile', icon: '👤' },
        { id: 'appearance', label: 'Appearance', icon: '🎨' },
        { id: 'seo', label: 'SEO', icon: '🔍' },
        { id: 'social', label: 'Social', icon: '🔗' },
        { id: 'integrations', label: 'Integrations', icon: '🔌' }
    ];

    const renderTabContent = () => {
        switch (activeTab) {
            case 'general':
                return (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        <div className="admin-card">
                            <div className="admin-card-header">
                                <h2 className="admin-card-title">Site Information</h2>
                            </div>
                            <div className="admin-card-body">
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                                    <div>
                                        <label style={labelStyle}>Site Name</label>
                                        <input
                                            type="text"
                                            value={settings.siteName}
                                            onChange={(e) => setSettings(s => ({ ...s, siteName: e.target.value }))}
                                            style={inputStyle}
                                        />
                                    </div>
                                    <div>
                                        <label style={labelStyle}>Tagline</label>
                                        <input
                                            type="text"
                                            value={settings.siteTagline}
                                            onChange={(e) => setSettings(s => ({ ...s, siteTagline: e.target.value }))}
                                            style={inputStyle}
                                        />
                                    </div>
                                    <div>
                                        <label style={labelStyle}>Site Description</label>
                                        <textarea
                                            value={settings.siteDescription}
                                            onChange={(e) => setSettings(s => ({ ...s, siteDescription: e.target.value }))}
                                            style={{ ...inputStyle, minHeight: '100px', resize: 'vertical' }}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="admin-card">
                            <div className="admin-card-header">
                                <h2 className="admin-card-title">Branding</h2>
                            </div>
                            <div className="admin-card-body">
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
                                    <div>
                                        <label style={labelStyle}>Logo URL</label>
                                        <input
                                            type="text"
                                            value={settings.siteLogo}
                                            onChange={(e) => setSettings(s => ({ ...s, siteLogo: e.target.value }))}
                                            placeholder="https://..."
                                            style={inputStyle}
                                        />
                                    </div>
                                    <div>
                                        <label style={labelStyle}>Favicon URL</label>
                                        <input
                                            type="text"
                                            value={settings.siteFavicon}
                                            onChange={(e) => setSettings(s => ({ ...s, siteFavicon: e.target.value }))}
                                            placeholder="https://..."
                                            style={inputStyle}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <button
                            className="btn btn-primary"
                            onClick={handleSaveSettings}
                            disabled={saving}
                            style={{ alignSelf: 'flex-start' }}
                        >
                            {saving ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                );

            case 'profile':
                return (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        <div className="admin-card">
                            <div className="admin-card-header">
                                <h2 className="admin-card-title">Email Address</h2>
                            </div>
                            <div className="admin-card-body">
                                <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end' }}>
                                    <div style={{ flex: 1 }}>
                                        <label style={labelStyle}>Email</label>
                                        <input
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            style={inputStyle}
                                        />
                                    </div>
                                    <button
                                        className="btn btn-secondary"
                                        onClick={handleEmailChange}
                                        disabled={saving}
                                    >
                                        Update Email
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="admin-card">
                            <div className="admin-card-header">
                                <h2 className="admin-card-title">Change Password</h2>
                            </div>
                            <div className="admin-card-body">
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                                    <div>
                                        <label style={labelStyle}>New Password</label>
                                        <input
                                            type="password"
                                            value={newPassword}
                                            onChange={(e) => setNewPassword(e.target.value)}
                                            placeholder="Enter new password"
                                            style={inputStyle}
                                        />
                                    </div>
                                    <div>
                                        <label style={labelStyle}>Confirm Password</label>
                                        <input
                                            type="password"
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            placeholder="Confirm new password"
                                            style={inputStyle}
                                        />
                                    </div>
                                    <button
                                        className="btn btn-primary"
                                        onClick={handlePasswordChange}
                                        disabled={saving}
                                        style={{ alignSelf: 'flex-start' }}
                                    >
                                        {saving ? 'Updating...' : 'Update Password'}
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="admin-card">
                            <div className="admin-card-header">
                                <h2 className="admin-card-title">Danger Zone</h2>
                            </div>
                            <div className="admin-card-body">
                                <p style={{
                                    fontSize: '0.9rem',
                                    color: 'var(--color-foreground-muted)',
                                    marginBottom: '1rem'
                                }}>
                                    Once you delete your account, there is no going back. Please be certain.
                                </p>
                                <button
                                    className="btn"
                                    style={{
                                        background: 'rgba(239, 68, 68, 0.1)',
                                        color: '#ef4444',
                                        border: '1px solid rgba(239, 68, 68, 0.3)'
                                    }}
                                >
                                    Delete Account
                                </button>
                            </div>
                        </div>
                    </div>
                );

            case 'appearance':
                return (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        <div className="admin-card">
                            <div className="admin-card-header">
                                <h2 className="admin-card-title">Theme</h2>
                            </div>
                            <div className="admin-card-body">
                                <p style={{
                                    fontSize: '0.9rem',
                                    color: 'var(--color-foreground-muted)',
                                    marginBottom: '1rem'
                                }}>
                                    Choose a theme for your site. This applies globally.
                                </p>
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '1rem',
                                    padding: '1rem',
                                    background: 'var(--color-background)',
                                    borderRadius: 'var(--radius-md)'
                                }}>
                                    <span style={{ flex: 1 }}>
                                        Current theme: <strong>{String(theme)}</strong>
                                    </span>
                                    <ThemeSwitcher />
                                </div>
                            </div>
                        </div>
                    </div>
                );

            case 'seo':
                return (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        <div className="admin-card">
                            <div className="admin-card-header">
                                <h2 className="admin-card-title">Default Meta Tags</h2>
                            </div>
                            <div className="admin-card-body">
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                                    <div>
                                        <label style={labelStyle}>Default Title</label>
                                        <input
                                            type="text"
                                            value={settings.defaultMetaTitle}
                                            onChange={(e) => setSettings(s => ({ ...s, defaultMetaTitle: e.target.value }))}
                                            style={inputStyle}
                                        />
                                        <p style={{
                                            fontSize: '0.75rem',
                                            color: 'var(--color-foreground-muted)',
                                            marginTop: '0.5rem'
                                        }}>
                                            Used when a page doesn't have its own title
                                        </p>
                                    </div>
                                    <div>
                                        <label style={labelStyle}>Default Description</label>
                                        <textarea
                                            value={settings.defaultMetaDescription}
                                            onChange={(e) => setSettings(s => ({ ...s, defaultMetaDescription: e.target.value }))}
                                            style={{ ...inputStyle, minHeight: '80px', resize: 'vertical' }}
                                        />
                                    </div>
                                    <div>
                                        <label style={labelStyle}>Default OG Image URL</label>
                                        <input
                                            type="text"
                                            value={settings.defaultOgImage}
                                            onChange={(e) => setSettings(s => ({ ...s, defaultOgImage: e.target.value }))}
                                            placeholder="https://..."
                                            style={inputStyle}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <button
                            className="btn btn-primary"
                            onClick={handleSaveSettings}
                            disabled={saving}
                            style={{ alignSelf: 'flex-start' }}
                        >
                            {saving ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                );

            case 'social':
                return (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        <div className="admin-card">
                            <div className="admin-card-header">
                                <h2 className="admin-card-title">Social Links</h2>
                            </div>
                            <div className="admin-card-body">
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                                    <div>
                                        <label style={labelStyle}>𝕏 (Twitter)</label>
                                        <input
                                            type="text"
                                            value={settings.socialTwitter}
                                            onChange={(e) => setSettings(s => ({ ...s, socialTwitter: e.target.value }))}
                                            placeholder="https://twitter.com/username"
                                            style={inputStyle}
                                        />
                                    </div>
                                    <div>
                                        <label style={labelStyle}>LinkedIn</label>
                                        <input
                                            type="text"
                                            value={settings.socialLinkedin}
                                            onChange={(e) => setSettings(s => ({ ...s, socialLinkedin: e.target.value }))}
                                            placeholder="https://linkedin.com/in/username"
                                            style={inputStyle}
                                        />
                                    </div>
                                    <div>
                                        <label style={labelStyle}>GitHub</label>
                                        <input
                                            type="text"
                                            value={settings.socialGithub}
                                            onChange={(e) => setSettings(s => ({ ...s, socialGithub: e.target.value }))}
                                            placeholder="https://github.com/username"
                                            style={inputStyle}
                                        />
                                    </div>
                                    <div>
                                        <label style={labelStyle}>YouTube</label>
                                        <input
                                            type="text"
                                            value={settings.socialYoutube}
                                            onChange={(e) => setSettings(s => ({ ...s, socialYoutube: e.target.value }))}
                                            placeholder="https://youtube.com/@channel"
                                            style={inputStyle}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <button
                            className="btn btn-primary"
                            onClick={handleSaveSettings}
                            disabled={saving}
                            style={{ alignSelf: 'flex-start' }}
                        >
                            {saving ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                );

            case 'integrations':
                return (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        <div className="admin-card">
                            <div className="admin-card-header">
                                <h2 className="admin-card-title">Google Analytics</h2>
                            </div>
                            <div className="admin-card-body">
                                <div>
                                    <label style={labelStyle}>Measurement ID</label>
                                    <input
                                        type="text"
                                        value={settings.googleAnalyticsId}
                                        onChange={(e) => setSettings(s => ({ ...s, googleAnalyticsId: e.target.value }))}
                                        placeholder="G-XXXXXXXXXX"
                                        style={inputStyle}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="admin-card">
                            <div className="admin-card-header">
                                <h2 className="admin-card-title">Custom Code</h2>
                            </div>
                            <div className="admin-card-body">
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                                    <div>
                                        <label style={labelStyle}>Head Code (scripts, styles)</label>
                                        <textarea
                                            value={settings.customHeadCode}
                                            onChange={(e) => setSettings(s => ({ ...s, customHeadCode: e.target.value }))}
                                            placeholder="<!-- Custom code inserted in <head> -->"
                                            style={{
                                                ...inputStyle,
                                                minHeight: '120px',
                                                fontFamily: 'var(--font-mono)',
                                                fontSize: '0.85rem'
                                            }}
                                        />
                                    </div>
                                    <div>
                                        <label style={labelStyle}>Body Code (tracking pixels, etc.)</label>
                                        <textarea
                                            value={settings.customBodyCode}
                                            onChange={(e) => setSettings(s => ({ ...s, customBodyCode: e.target.value }))}
                                            placeholder="<!-- Custom code inserted before </body> -->"
                                            style={{
                                                ...inputStyle,
                                                minHeight: '120px',
                                                fontFamily: 'var(--font-mono)',
                                                fontSize: '0.85rem'
                                            }}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <button
                            className="btn btn-primary"
                            onClick={handleSaveSettings}
                            disabled={saving}
                            style={{ alignSelf: 'flex-start' }}
                        >
                            {saving ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                );
        }
    };

    return (
        <>
            <AdminHeader
                title="Settings"
                subtitle="Manage your site settings and preferences"
            />

            <div className="admin-content">
                {/* Message Toast */}
                {message && (
                    <div style={{
                        position: 'fixed',
                        top: '1rem',
                        right: '1rem',
                        padding: '1rem 1.5rem',
                        borderRadius: 'var(--radius-md)',
                        background: message.type === 'success' ? '#10b981' : '#ef4444',
                        color: 'white',
                        fontWeight: '500',
                        zIndex: 100,
                        animation: 'slideIn 0.3s ease'
                    }}>
                        {message.text}
                    </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: '2rem' }}>
                    {/* Sidebar Navigation */}
                    <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.25rem'
                    }}>
                        {tabs.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.75rem',
                                    padding: '0.75rem 1rem',
                                    background: activeTab === tab.id
                                        ? 'var(--color-surface)'
                                        : 'transparent',
                                    border: activeTab === tab.id
                                        ? '1px solid var(--color-border)'
                                        : '1px solid transparent',
                                    borderRadius: 'var(--radius-md)',
                                    color: activeTab === tab.id
                                        ? 'var(--color-foreground)'
                                        : 'var(--color-foreground-muted)',
                                    textAlign: 'left',
                                    cursor: 'pointer',
                                    transition: 'all 0.15s ease',
                                    fontWeight: activeTab === tab.id ? '500' : '400'
                                }}
                            >
                                <span>{tab.icon}</span>
                                <span>{tab.label}</span>
                            </button>
                        ))}
                    </div>

                    {/* Content */}
                    <div>
                        {renderTabContent()}
                    </div>
                </div>
            </div>

            <style jsx>{`
                @keyframes slideIn {
                    from {
                        opacity: 0;
                        transform: translateX(100px);
                    }
                    to {
                        opacity: 1;
                        transform: translateX(0);
                    }
                }
            `}</style>
        </>
    );
}

// Shared styles
const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: '0.85rem',
    fontWeight: '500',
    color: 'var(--color-foreground)',
    marginBottom: '0.5rem'
};

const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '0.75rem 1rem',
    background: 'var(--color-background)',
    border: '1px solid var(--color-border)',
    borderRadius: 'var(--radius-md)',
    color: 'var(--color-foreground)',
    fontSize: '0.9rem'
};
