'use client';

/**
 * Analytics Tracker Component
 * Client-side tracking for heatmaps, sessions, and page views
 */

import { useEffect, useRef, useCallback } from 'react';
import { usePathname } from 'next/navigation';

// Configuration
const TRACKING_ENDPOINT = '/api/track';
const MOVE_THROTTLE_MS = 100;
const CLICK_DEBOUNCE_MS = 100;
const RAGE_CLICK_THRESHOLD = 3;
const RAGE_CLICK_WINDOW_MS = 1000;

// Types
interface TrackingEvent {
    type: 'session' | 'pageview' | 'event';
    data: Record<string, unknown>;
}

// Utility functions
function generateSessionId(): string {
    return `sess_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function generateVisitorId(): string {
    return `vis_${Math.random().toString(36).substr(2, 9)}_${Date.now().toString(36)}`;
}

function getDeviceType(): 'desktop' | 'tablet' | 'mobile' {
    const ua = navigator.userAgent;
    if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
        return 'tablet';
    }
    if (/Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated/.test(ua)) {
        return 'mobile';
    }
    return 'desktop';
}

function getBrowserInfo(): { browser: string; version: string } {
    const ua = navigator.userAgent;
    let browser = 'Unknown';
    let version = '';

    if (ua.includes('Firefox/')) {
        browser = 'Firefox';
        version = ua.split('Firefox/')[1]?.split(' ')[0] || '';
    } else if (ua.includes('Chrome/')) {
        browser = 'Chrome';
        version = ua.split('Chrome/')[1]?.split(' ')[0] || '';
    } else if (ua.includes('Safari/') && !ua.includes('Chrome')) {
        browser = 'Safari';
        version = ua.split('Version/')[1]?.split(' ')[0] || '';
    } else if (ua.includes('Edge/')) {
        browser = 'Edge';
        version = ua.split('Edge/')[1]?.split(' ')[0] || '';
    }

    return { browser, version };
}

function getOSInfo(): { os: string; version: string } {
    const ua = navigator.userAgent;
    let os = 'Unknown';
    let version = '';

    if (ua.includes('Windows')) {
        os = 'Windows';
        const match = ua.match(/Windows NT (\d+\.\d+)/);
        version = match ? match[1] : '';
    } else if (ua.includes('Mac OS X')) {
        os = 'macOS';
        const match = ua.match(/Mac OS X (\d+[._]\d+)/);
        version = match ? match[1].replace('_', '.') : '';
    } else if (ua.includes('Linux')) {
        os = 'Linux';
    } else if (ua.includes('Android')) {
        os = 'Android';
        const match = ua.match(/Android (\d+\.\d+)/);
        version = match ? match[1] : '';
    } else if (ua.includes('iOS') || ua.includes('iPhone') || ua.includes('iPad')) {
        os = 'iOS';
        const match = ua.match(/OS (\d+_\d+)/);
        version = match ? match[1].replace('_', '.') : '';
    }

    return { os, version };
}

function getUTMParams(): Record<string, string> {
    const params = new URLSearchParams(window.location.search);
    return {
        utm_source: params.get('utm_source') || '',
        utm_medium: params.get('utm_medium') || '',
        utm_campaign: params.get('utm_campaign') || '',
        utm_term: params.get('utm_term') || '',
        utm_content: params.get('utm_content') || ''
    };
}

// Queue for batching events
let eventQueue: TrackingEvent[] = [];
let flushTimeout: NodeJS.Timeout | null = null;

async function flushEvents(): Promise<void> {
    if (eventQueue.length === 0) return;

    const events = [...eventQueue];
    eventQueue = [];

    try {
        await fetch(TRACKING_ENDPOINT, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ events }),
            keepalive: true
        });
    } catch (error) {
        // Re-queue on failure (with limit)
        if (eventQueue.length < 1000) {
            eventQueue = [...events, ...eventQueue];
        }
    }
}

function queueEvent(event: TrackingEvent): void {
    eventQueue.push(event);

    // Flush immediately for session events
    if (event.type === 'session') {
        flushEvents();
        return;
    }

    // Batch other events
    if (flushTimeout) {
        clearTimeout(flushTimeout);
    }
    flushTimeout = setTimeout(flushEvents, 2000);
}

// Main Tracker Component
export function AnalyticsTracker() {
    const pathname = usePathname();
    const sessionIdRef = useRef<string | null>(null);
    const visitorIdRef = useRef<string | null>(null);
    const lastMoveTimeRef = useRef<number>(0);
    const clickTimesRef = useRef<number[]>([]);
    const maxScrollDepthRef = useRef<number>(0);

    // Initialize session
    useEffect(() => {
        // Get or create visitor ID
        let visitorId = localStorage.getItem('anwesh_visitor_id');
        if (!visitorId) {
            visitorId = generateVisitorId();
            localStorage.setItem('anwesh_visitor_id', visitorId);
        }
        visitorIdRef.current = visitorId;

        // Get or create session ID (expires after 30 min inactivity)
        let sessionId = sessionStorage.getItem('anwesh_session_id');
        const lastActivity = sessionStorage.getItem('anwesh_last_activity');
        const now = Date.now();

        if (!sessionId || !lastActivity || (now - parseInt(lastActivity)) > 30 * 60 * 1000) {
            sessionId = generateSessionId();
            sessionStorage.setItem('anwesh_session_id', sessionId);

            // Track new session
            const { browser, version: browserVersion } = getBrowserInfo();
            const { os, version: osVersion } = getOSInfo();
            const utmParams = getUTMParams();

            queueEvent({
                type: 'session',
                data: {
                    sessionId,
                    visitorId,
                    deviceType: getDeviceType(),
                    browser,
                    browserVersion,
                    os,
                    osVersion,
                    screenWidth: window.screen.width,
                    screenHeight: window.screen.height,
                    entryPage: pathname,
                    referrer: document.referrer,
                    ...utmParams
                }
            });
        }

        sessionIdRef.current = sessionId;
        sessionStorage.setItem('anwesh_last_activity', now.toString());

        // Cleanup on page unload
        const handleUnload = () => {
            flushEvents();
        };

        window.addEventListener('beforeunload', handleUnload);
        return () => window.removeEventListener('beforeunload', handleUnload);
    }, [pathname]);

    // Track page views
    useEffect(() => {
        if (!sessionIdRef.current) return;

        queueEvent({
            type: 'pageview',
            data: {
                sessionId: sessionIdRef.current,
                pagePath: pathname,
                title: document.title,
                timestamp: Date.now()
            }
        });

        // Reset scroll tracking for new page
        maxScrollDepthRef.current = 0;
    }, [pathname]);

    // Click tracking with rage click detection
    const handleClick = useCallback((e: MouseEvent) => {
        if (!sessionIdRef.current) return;

        const now = Date.now();
        const target = e.target as HTMLElement;

        // Rage click detection
        clickTimesRef.current = clickTimesRef.current.filter(t => now - t < RAGE_CLICK_WINDOW_MS);
        clickTimesRef.current.push(now);

        const isRageClick = clickTimesRef.current.length >= RAGE_CLICK_THRESHOLD;

        queueEvent({
            type: 'event',
            data: {
                sessionId: sessionIdRef.current,
                pagePath: pathname,
                eventType: isRageClick ? 'rage_click' : 'click',
                x: e.pageX,
                y: e.pageY,
                viewportWidth: window.innerWidth,
                viewportHeight: window.innerHeight,
                pageHeight: document.documentElement.scrollHeight,
                elementTag: target.tagName.toLowerCase(),
                elementId: target.id || null,
                elementClass: target.className || null,
                elementText: target.textContent?.slice(0, 100) || null,
                deviceType: getDeviceType(),
                timestamp: now
            }
        });

        if (isRageClick) {
            clickTimesRef.current = []; // Reset after rage click
        }
    }, [pathname]);

    // Mouse move tracking (throttled)
    const handleMouseMove = useCallback((e: MouseEvent) => {
        if (!sessionIdRef.current) return;

        const now = Date.now();
        if (now - lastMoveTimeRef.current < MOVE_THROTTLE_MS) return;
        lastMoveTimeRef.current = now;

        queueEvent({
            type: 'event',
            data: {
                sessionId: sessionIdRef.current,
                pagePath: pathname,
                eventType: 'move',
                x: e.pageX,
                y: e.pageY,
                viewportWidth: window.innerWidth,
                viewportHeight: window.innerHeight,
                deviceType: getDeviceType(),
                timestamp: now
            }
        });
    }, [pathname]);

    // Scroll tracking
    const handleScroll = useCallback(() => {
        if (!sessionIdRef.current) return;

        const scrollTop = window.scrollY;
        const docHeight = document.documentElement.scrollHeight - window.innerHeight;
        const scrollDepth = Math.round((scrollTop / docHeight) * 100);

        // Only track if depth increased
        if (scrollDepth <= maxScrollDepthRef.current) return;
        maxScrollDepthRef.current = scrollDepth;

        queueEvent({
            type: 'event',
            data: {
                sessionId: sessionIdRef.current,
                pagePath: pathname,
                eventType: 'scroll',
                scrollDepth,
                viewportWidth: window.innerWidth,
                viewportHeight: window.innerHeight,
                pageHeight: document.documentElement.scrollHeight,
                deviceType: getDeviceType(),
                timestamp: Date.now()
            }
        });
    }, [pathname]);

    // Set up event listeners
    useEffect(() => {
        document.addEventListener('click', handleClick);
        // Mouse move tracking disabled by default (high volume)
        // document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('scroll', handleScroll, { passive: true });

        return () => {
            document.removeEventListener('click', handleClick);
            // document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('scroll', handleScroll);
        };
    }, [handleClick, handleMouseMove, handleScroll]);

    // Flush events periodically
    useEffect(() => {
        const interval = setInterval(flushEvents, 10000);
        return () => clearInterval(interval);
    }, []);

    return null; // This component doesn't render anything
}

export default AnalyticsTracker;
