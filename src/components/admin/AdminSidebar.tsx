'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Image from 'next/image';
import { ThemeSwitcherCompact } from './ThemeSwitcher';
import { useAuth } from '@/components/AuthProvider';
import type { User } from '@supabase/supabase-js';

// Organized nav sections
const navSections = [
    {
        label: 'Overview',
        items: [
            {
                href: '/admin',
                label: 'Dashboard',
                icon: (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="3" width="7" height="7" rx="1" />
                        <rect x="14" y="3" width="7" height="7" rx="1" />
                        <rect x="3" y="14" width="7" height="7" rx="1" />
                        <rect x="14" y="14" width="7" height="7" rx="1" />
                    </svg>
                )
            },
        ]
    },
    {
        label: 'Content',
        items: [
            {
                href: '/admin/posts',
                label: 'Posts',
                icon: (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                        <polyline points="14,2 14,8 20,8" />
                        <line x1="16" y1="13" x2="8" y2="13" />
                        <line x1="16" y1="17" x2="8" y2="17" />
                        <line x1="10" y1="9" x2="8" y2="9" />
                    </svg>
                )
            },
        ]
    },
    {
        label: 'AI & Automation',
        items: [
            {
                href: '/admin/agents',
                label: 'Agents',
                icon: (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="3" />
                        <path d="M12 2v4m0 12v4M2 12h4m12 0h4" />
                        <path d="M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83M4.93 19.07l2.83-2.83m8.48-8.48l2.83-2.83" />
                    </svg>
                )
            },
            {
                href: '/admin/ai-providers',
                label: 'AI Providers',
                icon: (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M12 2a10 10 0 1 0 10 10H12V2z" />
                        <path d="M12 2a10 10 0 0 1 10 10" />
                        <circle cx="12" cy="12" r="3" />
                    </svg>
                )
            },
        ]
    },
    {
        label: 'Growth & Analytics',
        items: [
            {
                href: '/admin/leads',
                label: 'Leads',
                icon: (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                        <circle cx="9" cy="7" r="4" />
                        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                    </svg>
                )
            },
            {
                href: '/admin/heatmaps',
                label: 'Heatmaps',
                icon: (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="3" width="18" height="18" rx="2" />
                        <circle cx="8" cy="8" r="2" fill="currentColor" opacity="0.3" />
                        <circle cx="16" cy="10" r="3" fill="currentColor" opacity="0.5" />
                        <circle cx="10" cy="16" r="2.5" fill="currentColor" opacity="0.7" />
                    </svg>
                )
            },
            {
                href: '/admin/analytics',
                label: 'Analytics',
                icon: (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="18" y1="20" x2="18" y2="10" />
                        <line x1="12" y1="20" x2="12" y2="4" />
                        <line x1="6" y1="20" x2="6" y2="14" />
                    </svg>
                )
            },
        ]
    },
    {
        label: 'System',
        items: [
            {
                href: '/admin/settings',
                label: 'Settings',
                icon: (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="3" />
                        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
                    </svg>
                )
            },
        ]
    },
];

interface AdminSidebarProps {
    user?: User | null;
}

export function AdminSidebar({ user }: AdminSidebarProps) {
    const pathname = usePathname();
    const { signOut } = useAuth();

    const isActive = (href: string) => {
        if (href === '/admin') {
            return pathname === '/admin';
        }
        return pathname.startsWith(href);
    };

    const userEmail = user?.email || 'admin@anwe.sh';
    const userInitials = userEmail.slice(0, 2).toUpperCase();

    return (
        <aside className="admin-sidebar">
            <div className="sidebar-header">
                <Link href="/" className="sidebar-logo">
                    <Image
                        src="/logo.png"
                        alt="ANWE.SH"
                        width={32}
                        height={32}
                        className="sidebar-logo-img"
                    />
                    <span className="sidebar-logo-text">ANWE.SH</span>
                </Link>
            </div>

            <nav className="sidebar-nav">
                {navSections.map((section) => (
                    <div key={section.label} className="sidebar-section">
                        <span className="sidebar-section-label">{section.label}</span>
                        {section.items.map((item) => (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`sidebar-link ${isActive(item.href) ? 'active' : ''}`}
                            >
                                <span className="sidebar-icon">{item.icon}</span>
                                <span className="sidebar-label">{item.label}</span>
                            </Link>
                        ))}
                    </div>
                ))}
            </nav>

            <div className="sidebar-footer">
                {/* User Profile */}
                <div className="sidebar-user">
                    <div className="sidebar-user-avatar">
                        {userInitials}
                    </div>
                    <div className="sidebar-user-info">
                        <span className="sidebar-user-email">{userEmail}</span>
                        <button
                            onClick={signOut}
                            className="sidebar-logout-btn"
                        >
                            Sign out
                        </button>
                    </div>
                </div>

                <div className="sidebar-footer-row">
                    <ThemeSwitcherCompact />
                    <Link href="/" className="sidebar-back-link">
                        ← Site
                    </Link>
                </div>
            </div>
        </aside>
    );
}
