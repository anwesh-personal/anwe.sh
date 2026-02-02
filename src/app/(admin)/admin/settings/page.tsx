'use client';

import { AdminHeader } from '@/components/admin';
import { ThemeSwitcher } from '@/components/admin/ThemeSwitcher';
import { useTheme } from '@/components/ThemeProvider';
import { useAuth } from '@/components/AuthProvider';
import { createClientSupabase } from '@/lib/supabase-server';
import { useState } from 'react';

export default function SettingsPage() {
    const { theme } = useTheme();
    const { user } = useAuth();
    const supabase = createClientSupabase();

    // Password change state
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [passwordLoading, setPasswordLoading] = useState(false);
    const [passwordMessage, setPasswordMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    // Profile state
    const [profileLoading, setProfileLoading] = useState(false);
    const [profileMessage, setProfileMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    const handlePasswordChange = async (e: React.FormEvent) => {
        e.preventDefault();
        setPasswordMessage(null);

        // Validation
        if (!currentPassword || !newPassword || !confirmPassword) {
            setPasswordMessage({ type: 'error', text: 'All fields are required' });
            return;
        }

        if (newPassword !== confirmPassword) {
            setPasswordMessage({ type: 'error', text: 'New passwords do not match' });
            return;
        }

        if (newPassword.length < 8) {
            setPasswordMessage({ type: 'error', text: 'Password must be at least 8 characters' });
            return;
        }

        setPasswordLoading(true);

        try {
            // First verify current password by re-authenticating
            const { error: signInError } = await supabase.auth.signInWithPassword({
                email: user?.email || '',
                password: currentPassword,
            });

            if (signInError) {
                setPasswordMessage({ type: 'error', text: 'Current password is incorrect' });
                setPasswordLoading(false);
                return;
            }

            // Update password
            const { error: updateError } = await supabase.auth.updateUser({
                password: newPassword
            });

            if (updateError) {
                setPasswordMessage({ type: 'error', text: updateError.message });
                setPasswordLoading(false);
                return;
            }

            setPasswordMessage({ type: 'success', text: 'Password updated successfully' });
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } catch (err) {
            setPasswordMessage({ type: 'error', text: 'An error occurred. Please try again.' });
        }

        setPasswordLoading(false);
    };

    const handleUpdateEmail = async (e: React.FormEvent) => {
        e.preventDefault();
        setProfileMessage(null);
        setProfileLoading(true);

        const form = e.target as HTMLFormElement;
        const formData = new FormData(form);
        const newEmail = formData.get('email') as string;

        if (!newEmail || newEmail === user?.email) {
            setProfileMessage({ type: 'error', text: 'Please enter a different email' });
            setProfileLoading(false);
            return;
        }

        try {
            const { error } = await supabase.auth.updateUser({
                email: newEmail
            });

            if (error) {
                setProfileMessage({ type: 'error', text: error.message });
            } else {
                setProfileMessage({ type: 'success', text: 'Confirmation email sent to new address' });
            }
        } catch (err) {
            setProfileMessage({ type: 'error', text: 'An error occurred' });
        }

        setProfileLoading(false);
    };

    return (
        <>
            <AdminHeader
                title="Settings"
                subtitle="Manage your account and preferences"
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
                                Choose a color theme for the admin panel.
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
                            <form onSubmit={handleUpdateEmail}>
                                {profileMessage && (
                                    <div style={{
                                        padding: '0.75rem 1rem',
                                        marginBottom: '1rem',
                                        borderRadius: 'var(--radius-md)',
                                        fontSize: '0.85rem',
                                        background: profileMessage.type === 'error'
                                            ? 'rgba(239, 68, 68, 0.1)'
                                            : 'rgba(52, 211, 153, 0.1)',
                                        color: profileMessage.type === 'error'
                                            ? 'var(--color-error)'
                                            : 'var(--color-success)',
                                        border: `1px solid ${profileMessage.type === 'error' ? 'rgba(239, 68, 68, 0.3)' : 'rgba(52, 211, 153, 0.3)'}`
                                    }}>
                                        {profileMessage.text}
                                    </div>
                                )}

                                <div style={{ marginBottom: '1rem' }}>
                                    <label style={{
                                        display: 'block',
                                        fontSize: '0.85rem',
                                        color: 'var(--color-foreground-secondary)',
                                        marginBottom: '0.5rem'
                                    }}>Email Address</label>
                                    <input
                                        type="email"
                                        name="email"
                                        defaultValue={user?.email || ''}
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

                                <button
                                    type="submit"
                                    className="btn btn-primary"
                                    disabled={profileLoading}
                                >
                                    {profileLoading ? 'Updating...' : 'Update Email'}
                                </button>
                            </form>
                        </div>
                    </div>

                    {/* Password Change */}
                    <div className="admin-card">
                        <div className="admin-card-header">
                            <h2 className="admin-card-title">Change Password</h2>
                        </div>
                        <div className="admin-card-body">
                            <form onSubmit={handlePasswordChange}>
                                {passwordMessage && (
                                    <div style={{
                                        padding: '0.75rem 1rem',
                                        marginBottom: '1rem',
                                        borderRadius: 'var(--radius-md)',
                                        fontSize: '0.85rem',
                                        background: passwordMessage.type === 'error'
                                            ? 'rgba(239, 68, 68, 0.1)'
                                            : 'rgba(52, 211, 153, 0.1)',
                                        color: passwordMessage.type === 'error'
                                            ? 'var(--color-error)'
                                            : 'var(--color-success)',
                                        border: `1px solid ${passwordMessage.type === 'error' ? 'rgba(239, 68, 68, 0.3)' : 'rgba(52, 211, 153, 0.3)'}`
                                    }}>
                                        {passwordMessage.text}
                                    </div>
                                )}

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                    <div>
                                        <label style={{
                                            display: 'block',
                                            fontSize: '0.85rem',
                                            color: 'var(--color-foreground-secondary)',
                                            marginBottom: '0.5rem'
                                        }}>Current Password</label>
                                        <input
                                            type="password"
                                            value={currentPassword}
                                            onChange={(e) => setCurrentPassword(e.target.value)}
                                            placeholder="Enter current password"
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
                                        }}>New Password</label>
                                        <input
                                            type="password"
                                            value={newPassword}
                                            onChange={(e) => setNewPassword(e.target.value)}
                                            placeholder="At least 8 characters"
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
                                        }}>Confirm New Password</label>
                                        <input
                                            type="password"
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            placeholder="Repeat new password"
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

                                    <button
                                        type="submit"
                                        className="btn btn-primary"
                                        style={{ marginTop: '0.5rem' }}
                                        disabled={passwordLoading}
                                    >
                                        {passwordLoading ? 'Changing...' : 'Change Password'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>

                    {/* Account Info */}
                    <div className="admin-card">
                        <div className="admin-card-header">
                            <h2 className="admin-card-title">Account Info</h2>
                        </div>
                        <div className="admin-card-body">
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', fontSize: '0.9rem' }}>
                                <div>
                                    <span style={{ color: 'var(--color-foreground-muted)' }}>User ID:</span>
                                    <div style={{
                                        fontFamily: 'var(--font-mono)',
                                        fontSize: '0.8rem',
                                        color: 'var(--color-foreground-secondary)',
                                        marginTop: '0.25rem',
                                        wordBreak: 'break-all'
                                    }}>
                                        {user?.id || 'N/A'}
                                    </div>
                                </div>
                                <div>
                                    <span style={{ color: 'var(--color-foreground-muted)' }}>Email:</span>
                                    <div style={{ color: 'var(--color-foreground)', marginTop: '0.25rem' }}>
                                        {user?.email || 'N/A'}
                                    </div>
                                </div>
                                <div>
                                    <span style={{ color: 'var(--color-foreground-muted)' }}>Created:</span>
                                    <div style={{ color: 'var(--color-foreground)', marginTop: '0.25rem' }}>
                                        {user?.created_at ? new Date(user.created_at).toLocaleDateString('en-US', {
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric',
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        }) : 'N/A'}
                                    </div>
                                </div>
                                <div>
                                    <span style={{ color: 'var(--color-foreground-muted)' }}>Last Sign In:</span>
                                    <div style={{ color: 'var(--color-foreground)', marginTop: '0.25rem' }}>
                                        {user?.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleDateString('en-US', {
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric',
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        }) : 'N/A'}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
