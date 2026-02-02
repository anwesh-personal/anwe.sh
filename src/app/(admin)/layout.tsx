import { ThemeProvider } from '@/components/ThemeProvider';
import { AdminSidebar } from '@/components/admin';
import './admin.css';

export const metadata = {
    title: 'Admin | ANWE.SH',
    description: 'Content management and agent control',
};

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <ThemeProvider>
            <div className="admin-layout">
                <AdminSidebar />
                <main className="admin-main">
                    {children}
                </main>
            </div>
        </ThemeProvider>
    );
}
