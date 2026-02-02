'use client';

import { AdminHeader } from '@/components/admin';
import { ThemeSwitcher } from '@/components/admin/ThemeSwitcher';
import { useTheme } from '@/components/ThemeProvider';

export default function SettingsPage() {
    const { currentTheme, theme } = useTheme();

    return (
        <>
            <AdminHeader
                title="Settings"
                subtitle="Customize your admin experience"
            />

            <div className="admin-content">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                    {/* Theme Settings */}
                    <div className="admin-card">
                        <div className="admin-card-header">
                            <h2 className="admin-card-title">Theme</h2>
                        </div>
                        <div className="admin-card-body">
                            <p style={{
                                color: 'var(--color-foreground-secondary)',
                                fontSize: '0.9rem',
                                marginBottom: '1.5rem'
                            }}>
                                Choose a color theme for the admin panel. This theme will also be applied site-wide when enabled.
                            </p>
                            <ThemeSwitcher />

                            <div style={{
                                marginTop: '1.5rem',
                                padding: '1rem',
                                background: 'var(--color-background-secondary)',
                                borderRadius: 'var(--radius-md)',
                                fontSize: '0.85rem'
                            }}>
                                <strong style={{ color: 'var(--color-foreground)' }}>Current Theme:</strong>
                                <span style={{
                                    marginLeft: '0.5rem',
                                    background: 'var(--color-accent-gradient)',
                                    WebkitBackgroundClip: 'text',
                                    WebkitTextFillColor: 'transparent',
                                    fontWeight: '600'
                                }}>
                                    {theme.name}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Profile Settings */}
                    <div className="admin-card">
                        <div className="admin-card-header">
                            <h2 className="admin-card-title">Profile</h2>
                        </div>
                        <div className="admin-card-body">
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                <div>
                                    <label style={{
                                        display: 'block',
                                        fontSize: '0.85rem',
                                        color: 'var(--color-foreground-secondary)',
                                        marginBottom: '0.5rem'
                                    }}>Name</label>
                                    <input
                                        type="text"
                                        defaultValue="Anwesh Rath"
                                        style={{
                                            width: '100%',
                                            padding: '0.75rem 1rem',
                                            background: 'var(--color-background)',
                                            border: '1px solid var(--color-border)',
                                            borderRadius: 'var(--radius-md)',
                                            color: 'var(--color-foreground)',
                                            fontSize: '0.9rem'
                                        }}
                                    />
                                </div>

                                <div>
                                    <label style={{
                                        display: 'block',
                                        fontSize: '0.85rem',
                                        color: 'var(--color-foreground-secondary)',
                                        marginBottom: '0.5rem'
                                    }}>Email</label>
                                    <input
                                        type="email"
                                        defaultValue="anwesh@anwe.sh"
                                        style={{
                                            width: '100%',
                                            padding: '0.75rem 1rem',
                                            background: 'var(--color-background)',
                                            border: '1px solid var(--color-border)',
                                            borderRadius: 'var(--radius-md)',
                                            color: 'var(--color-foreground)',
                                            fontSize: '0.9rem'
                                        }}
                                    />
                                </div>

                                <button className="btn btn-primary" style={{ marginTop: '0.5rem' }}>
                                    Save Changes
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* API Keys */}
                    <div className="admin-card">
                        <div className="admin-card-header">
                            <h2 className="admin-card-title">API Keys</h2>
                        </div>
                        <div className="admin-card-body">
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                <div>
                                    <label style={{
                                        display: 'block',
                                        fontSize: '0.85rem',
                                        color: 'var(--color-foreground-secondary)',
                                        marginBottom: '0.5rem'
                                    }}>OpenAI API Key</label>
                                    <input
                                        type="password"
                                        defaultValue="sk-xxxxxxxxxxxxxxxx"
                                        style={{
                                            width: '100%',
                                            padding: '0.75rem 1rem',
                                            background: 'var(--color-background)',
                                            border: '1px solid var(--color-border)',
                                            borderRadius: 'var(--radius-md)',
                                            color: 'var(--color-foreground)',
                                            fontSize: '0.9rem',
                                            fontFamily: 'var(--font-mono)'
                                        }}
                                    />
                                </div>

                                <div>
                                    <label style={{
                                        display: 'block',
                                        fontSize: '0.85rem',
                                        color: 'var(--color-foreground-secondary)',
                                        marginBottom: '0.5rem'
                                    }}>Anthropic API Key</label>
                                    <input
                                        type="password"
                                        defaultValue="sk-ant-xxxxxxxxxxxxxxxx"
                                        style={{
                                            width: '100%',
                                            padding: '0.75rem 1rem',
                                            background: 'var(--color-background)',
                                            border: '1px solid var(--color-border)',
                                            borderRadius: 'var(--radius-md)',
                                            color: 'var(--color-foreground)',
                                            fontSize: '0.9rem',
                                            fontFamily: 'var(--font-mono)'
                                        }}
                                    />
                                </div>

                                <button className="btn btn-primary" style={{ marginTop: '0.5rem' }}>
                                    Update API Keys
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Danger Zone */}
                    <div className="admin-card" style={{ borderColor: 'var(--color-error)' }}>
                        <div className="admin-card-header" style={{ borderColor: 'var(--color-error)' }}>
                            <h2 className="admin-card-title" style={{ color: 'var(--color-error)' }}>Danger Zone</h2>
                        </div>
                        <div className="admin-card-body">
                            <p style={{
                                color: 'var(--color-foreground-secondary)',
                                fontSize: '0.9rem',
                                marginBottom: '1rem'
                            }}>
                                Irreversible and destructive actions. Be careful.
                            </p>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                <button
                                    className="btn btn-secondary"
                                    style={{
                                        borderColor: 'var(--color-error)',
                                        color: 'var(--color-error)',
                                        justifyContent: 'flex-start'
                                    }}
                                >
                                    Clear All Analytics Data
                                </button>
                                <button
                                    className="btn btn-secondary"
                                    style={{
                                        borderColor: 'var(--color-error)',
                                        color: 'var(--color-error)',
                                        justifyContent: 'flex-start'
                                    }}
                                >
                                    Reset All Agents
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
