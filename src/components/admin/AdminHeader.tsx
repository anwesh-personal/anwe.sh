'use client';

import { useTheme } from '@/components/ThemeProvider';

interface AdminHeaderProps {
    title: string;
    subtitle?: string;
    actions?: React.ReactNode;
}

export function AdminHeader({ title, subtitle, actions }: AdminHeaderProps) {
    const { theme } = useTheme();

    return (
        <header className="admin-header">
            <div className="admin-header-content">
                <div className="admin-header-text">
                    <h1 className="admin-header-title">{title}</h1>
                    {subtitle && <p className="admin-header-subtitle">{subtitle}</p>}
                </div>
                {actions && <div className="admin-header-actions">{actions}</div>}
            </div>
        </header>
    );
}
