'use client';

/**
 * Lead Capture Component
 * Popup/inline form with AI-powered lead scoring
 */

import { useState, useEffect, useCallback } from 'react';
import './LeadCapture.css';

interface LeadCaptureProps {
    trigger?: 'exit_intent' | 'scroll' | 'time' | 'manual';
    scrollThreshold?: number; // Percentage for scroll trigger
    timeDelay?: number; // Milliseconds for time trigger
    title?: string;
    subtitle?: string;
    ctaText?: string;
    showName?: boolean;
    showCompany?: boolean;
    showPhone?: boolean;
    onSuccess?: (lead: LeadData) => void;
    source?: string;
}

interface LeadData {
    email: string;
    name?: string;
    company?: string;
    phone?: string;
    source: string;
    sourcePage: string;
}

export function LeadCapture({
    trigger = 'exit_intent',
    scrollThreshold = 50,
    timeDelay = 30000,
    title = "Let's Connect",
    subtitle = "Get insights on AI systems and enterprise architecture delivered to your inbox.",
    ctaText = "Subscribe",
    showName = true,
    showCompany = false,
    showPhone = false,
    onSuccess,
    source = 'popup'
}: LeadCaptureProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [hasTriggered, setHasTriggered] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [formData, setFormData] = useState({
        email: '',
        name: '',
        company: '',
        phone: ''
    });

    // Check if already shown in this session
    useEffect(() => {
        const alreadyShown = sessionStorage.getItem('lead_capture_shown');
        if (alreadyShown) {
            setHasTriggered(true);
        }
    }, []);

    // Exit intent trigger
    useEffect(() => {
        if (trigger !== 'exit_intent' || hasTriggered) return;

        const handleMouseLeave = (e: MouseEvent) => {
            if (e.clientY <= 0) {
                setIsOpen(true);
                setHasTriggered(true);
                sessionStorage.setItem('lead_capture_shown', 'true');
            }
        };

        document.addEventListener('mouseleave', handleMouseLeave);
        return () => document.removeEventListener('mouseleave', handleMouseLeave);
    }, [trigger, hasTriggered]);

    // Scroll trigger
    useEffect(() => {
        if (trigger !== 'scroll' || hasTriggered) return;

        const handleScroll = () => {
            const scrollPercent = (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100;
            if (scrollPercent >= scrollThreshold) {
                setIsOpen(true);
                setHasTriggered(true);
                sessionStorage.setItem('lead_capture_shown', 'true');
            }
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, [trigger, scrollThreshold, hasTriggered]);

    // Time trigger
    useEffect(() => {
        if (trigger !== 'time' || hasTriggered) return;

        const timeout = setTimeout(() => {
            setIsOpen(true);
            setHasTriggered(true);
            sessionStorage.setItem('lead_capture_shown', 'true');
        }, timeDelay);

        return () => clearTimeout(timeout);
    }, [trigger, timeDelay, hasTriggered]);

    const handleSubmit = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!formData.email) {
            setError('Email is required');
            return;
        }

        // Basic email validation
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            setError('Please enter a valid email');
            return;
        }

        setIsSubmitting(true);

        try {
            const sessionId = sessionStorage.getItem('anwesh_session_id');

            const response = await fetch('/api/leads', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: formData.email,
                    name: formData.name || null,
                    company: formData.company || null,
                    phone: formData.phone || null,
                    source,
                    sourcePage: window.location.pathname,
                    sessionId,
                    referrer: document.referrer,
                    utmSource: new URLSearchParams(window.location.search).get('utm_source'),
                    utmMedium: new URLSearchParams(window.location.search).get('utm_medium'),
                    utmCampaign: new URLSearchParams(window.location.search).get('utm_campaign')
                })
            });

            if (!response.ok) {
                throw new Error('Failed to submit');
            }

            const lead = await response.json();

            setIsSuccess(true);

            if (onSuccess) {
                onSuccess({
                    email: formData.email,
                    name: formData.name,
                    company: formData.company,
                    phone: formData.phone,
                    source,
                    sourcePage: window.location.pathname
                });
            }

            // Close after success
            setTimeout(() => {
                setIsOpen(false);
            }, 3000);

        } catch (err) {
            setError('Something went wrong. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    }, [formData, source, onSuccess]);

    const handleClose = () => {
        setIsOpen(false);
    };

    if (!isOpen) return null;

    return (
        <div className="lead-capture-overlay" onClick={handleClose}>
            <div className="lead-capture-modal" onClick={(e) => e.stopPropagation()}>
                <button className="lead-capture-close" onClick={handleClose}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                </button>

                {isSuccess ? (
                    <div className="lead-capture-success">
                        <div className="lead-capture-success-icon">✓</div>
                        <h3>You're In!</h3>
                        <p>Thanks for subscribing. You'll hear from me soon.</p>
                    </div>
                ) : (
                    <>
                        <div className="lead-capture-header">
                            <div className="lead-capture-icon">
                                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                                    <polyline points="22,6 12,13 2,6" />
                                </svg>
                            </div>
                            <h2>{title}</h2>
                            <p>{subtitle}</p>
                        </div>

                        <form className="lead-capture-form" onSubmit={handleSubmit}>
                            <div className="lead-capture-field">
                                <input
                                    type="email"
                                    placeholder="your@email.com"
                                    value={formData.email}
                                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                                    required
                                />
                            </div>

                            {showName && (
                                <div className="lead-capture-field">
                                    <input
                                        type="text"
                                        placeholder="Your name"
                                        value={formData.name}
                                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                    />
                                </div>
                            )}

                            {showCompany && (
                                <div className="lead-capture-field">
                                    <input
                                        type="text"
                                        placeholder="Company"
                                        value={formData.company}
                                        onChange={(e) => setFormData(prev => ({ ...prev, company: e.target.value }))}
                                    />
                                </div>
                            )}

                            {showPhone && (
                                <div className="lead-capture-field">
                                    <input
                                        type="tel"
                                        placeholder="Phone number"
                                        value={formData.phone}
                                        onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                                    />
                                </div>
                            )}

                            {error && (
                                <div className="lead-capture-error">{error}</div>
                            )}

                            <button
                                type="submit"
                                className="lead-capture-submit"
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? (
                                    <span className="lead-capture-spinner" />
                                ) : (
                                    ctaText
                                )}
                            </button>
                        </form>

                        <p className="lead-capture-privacy">
                            Your privacy matters. Unsubscribe anytime.
                        </p>
                    </>
                )}
            </div>
        </div>
    );
}

export default LeadCapture;
