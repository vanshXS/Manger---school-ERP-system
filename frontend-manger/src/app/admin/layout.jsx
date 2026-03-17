import { AuthProvider } from '@/contexts/AdminAuthContext';

export default function AdminRootLayout({ children }) {
    return (
        <AuthProvider>
            {children}
        </AuthProvider>
    );
}
