'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClientSupabase } from '@/lib/supabase-client';
import { Suspense } from 'react';

function ConfirmContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const supabase = createClientSupabase();

    const [status, setStatus] = useState<'loading' | 'setting_password' | 'success' | 'error'>('loading');
    const [error, setError] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [saving, setSaving] = useState(false);

    const tokenHash = searchParams.get('token_hash');
    const type = searchParams.get('type');
    const next = searchParams.get('next') || '/admin';

    useEffect(() => {
        const handleConfirm = async () => {
            if (!tokenHash) {
                setError('Invalid confirmation link');
                setStatus('error');
                return;
            }

            try {
                // For invite type, we need to verify the OTP first
                if (type === 'invite' || type === 'recovery') {
                    const { error } = await supabase.auth.verifyOtp({
                        token_hash: tokenHash,
                        type: type === 'invite' ? 'invite' : 'recovery',
                    });

                    if (error) {
                        setError(error.message);
                        setStatus('error');
                        return;
                    }

                    // Show password form for invite/recovery
                    setStatus('setting_password');
                } else if (type === 'signup' || type === 'email') {
                    // Email confirmation - just verify and redirect
                    const { error } = await supabase.auth.verifyOtp({
                        token_hash: tokenHash,
                        type: 'email',
                    });

                    if (error) {
                        setError(error.message);
                        setStatus('error');
                        return;
                    }

                    setStatus('success');
                    setTimeout(() => router.push(next), 1500);
                } else {
                    // Unknown type - try generic verification
                    const { error } = await supabase.auth.verifyOtp({
                        token_hash: tokenHash,
                        type: 'email',
                    });

                    if (error) {
                        setError(error.message);
                        setStatus('error');
                        return;
                    }

                    setStatus('success');
                    setTimeout(() => router.push(next), 1500);
                }
            } catch (err) {
                setError('An error occurred during confirmation');
                setStatus('error');
            }
        };

        handleConfirm();
    }, [tokenHash, type, supabase, router, next]);

    const handleSetPassword = async (e: React.FormEvent) => {
        e.preventDefault();

        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        if (password.length < 8) {
            setError('Password must be at least 8 characters');
            return;
        }

        setSaving(true);
        setError('');

        try {
            const { error } = await supabase.auth.updateUser({
                password: password
            });

            if (error) {
                setError(error.message);
                setSaving(false);
                return;
            }

            setStatus('success');
            setTimeout(() => router.push(next), 1500);
        } catch (err) {
            setError('Failed to set password');
            setSaving(false);
        }
    };

    return (
        <div className="confirm-container">
            <div className="confirm-card">
                {status === 'loading' && (
                    <div className="confirm-loading">
                        <div className="loading-spinner"></div>
                        <p>Verifying your link...</p>
                    </div>
                )}

                {status === 'setting_password' && (
                    <>
                        <h1 className="confirm-title">Set Your Password</h1>
                        <p className="confirm-subtitle">Create a password for your account</p>

                        {error && <div className="confirm-error">{error}</div>}

                        <form onSubmit={handleSetPassword} className="confirm-form">
                            <div className="confirm-field">
                                <label>Password</label>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="At least 8 characters"
                                    disabled={saving}
                                />
                            </div>
                            <div className="confirm-field">
                                <label>Confirm Password</label>
                                <input
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    placeholder="Repeat password"
                                    disabled={saving}
                                />
                            </div>
                            <button type="submit" className="confirm-button" disabled={saving}>
                                {saving ? 'Setting password...' : 'Set Password & Continue'}
                            </button>
                        </form>
                    </>
                )}

                {status === 'success' && (
                    <div className="confirm-success">
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#38EF7D" strokeWidth="2">
                            <polyline points="20 6 9 17 4 12" />
                        </svg>
                        <h1>Success!</h1>
                        <p>Redirecting to admin...</p>
                    </div>
                )}

                {status === 'error' && (
                    <div className="confirm-error-state">
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2">
                            <circle cx="12" cy="12" r="10" />
                            <line x1="15" y1="9" x2="9" y2="15" />
                            <line x1="9" y1="9" x2="15" y2="15" />
                        </svg>
                        <h1>Error</h1>
                        <p>{error}</p>
                        <a href="/login" className="confirm-button">Back to Login</a>
                    </div>
                )}
            </div>
        </div>
    );
}

function ConfirmLoading() {
    return (
        <div className="confirm-container">
            <div className="confirm-card">
                <div className="confirm-loading">
                    <div className="loading-spinner"></div>
                    <p>Loading...</p>
                </div>
            </div>
        </div>
    );
}

export default function ConfirmPage() {
    return (
        <Suspense fallback={<ConfirmLoading />}>
            <ConfirmContent />
        </Suspense>
    );
}
