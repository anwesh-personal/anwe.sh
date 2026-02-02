import { ThemeProvider } from '@/components/ThemeProvider';
import { AuthProvider } from '@/components/AuthProvider';
import { AdminSidebar } from '@/components/admin';
import { getServerUser } from '@/lib/supabase-server';
import { redirect } from 'next/navigation';
import './admin.css';

export const metadata = {
    title: 'Admin | ANWE.SH',
    description: 'Content management and agent control',
};

export default async function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    // Server-side auth check (middleware also does this, but this is defense in depth)
    const user = await getServerUser();

    if (!user) {
        redirect('/login?redirect=/admin');
    }

    return (
        <AuthProvider>
            <ThemeProvider>
                <div className="admin-layout">
                    <AdminSidebar user={user} />
                    <main className="admin-main">
                        {children}
                    </main>
                </div>
            </ThemeProvider>
        </AuthProvider>
    );
}
