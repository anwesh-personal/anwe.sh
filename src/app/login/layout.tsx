import { AuthProvider } from '@/components/AuthProvider';
import '../globals.css';
import './login.css';

export const metadata = {
    title: 'Login | ANWE.SH Admin',
    description: 'Sign in to the admin panel',
};

export default function LoginLayout({
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
