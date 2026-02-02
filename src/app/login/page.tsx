'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import Image from 'next/image';

export default function LoginPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { signIn, loading: authLoading, user } = useAuth();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const redirectTo = searchParams.get('redirect') || '/admin';

    // If already logged in, redirect
    useEffect(() => {
        if (!authLoading && user) {
            router.push(redirectTo);
        }
    }, [authLoading, user, router, redirectTo]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        if (!email || !password) {
            setError('Email and password are required');
            setLoading(false);
            return;
        }

        const { error: signInError } = await signIn(email, password);

        if (signInError) {
            setError(signInError);
            setLoading(false);
            return;
        }

        // Successful login - redirect handled by auth provider
        router.push(redirectTo);
    };

    // Show loading while checking auth
    if (authLoading) {
        return (
            <div className="login-container">
                <div className="login-loading">
                    <div className="loading-spinner"></div>
                    <span>Checking session...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="login-container">
            <div className="login-card">
                {/* Logo */}
                <div className="login-header">
                    <Image
                        src="/logo.png"
                        alt="ANWE.SH"
                        width={48}
                        height={48}
                        className="login-logo"
                    />
                    <h1 className="login-title">Admin Login</h1>
                    <p className="login-subtitle">Sign in to access the admin panel</p>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="login-error">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="10" />
                            <line x1="15" y1="9" x2="9" y2="15" />
                            <line x1="9" y1="9" x2="15" y2="15" />
                        </svg>
                        <span>{error}</span>
                    </div>
                )}

                {/* Form */}
                <form onSubmit={handleSubmit} className="login-form">
                    <div className="login-field">
                        <label htmlFor="email" className="login-label">Email</label>
                        <input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="admin@anwe.sh"
                            autoComplete="email"
                            autoFocus
                            className="login-input"
                            disabled={loading}
                        />
                    </div>

                    <div className="login-field">
                        <label htmlFor="password" className="login-label">Password</label>
                        <input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            autoComplete="current-password"
                            className="login-input"
                            disabled={loading}
                        />
                    </div>

                    <button
                        type="submit"
                        className="login-button"
                        disabled={loading}
                    >
                        {loading ? (
                            <>
                                <div className="loading-spinner-small"></div>
                                Signing in...
                            </>
                        ) : (
                            'Sign In'
                        )}
                    </button>
                </form>

                {/* Footer */}
                <div className="login-footer">
                    <a href="/" className="login-back">
                        ← Back to anwe.sh
                    </a>
                </div>
            </div>
        </div>
    );
}
