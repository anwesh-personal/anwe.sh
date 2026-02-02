import { AuthProvider } from '@/components/AuthProvider';
import '../../login/login.css';
import './confirm.css';

export const metadata = {
    title: 'Confirm | ANWE.SH',
    description: 'Confirm your account',
};

export default function ConfirmLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <AuthProvider>
            {children}
        </AuthProvider>
    );
}
