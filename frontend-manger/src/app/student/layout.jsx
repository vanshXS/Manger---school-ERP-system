import { StudentAuthProvider } from '@/contexts/StudentAuthContext';

export default function StudentRootLayout({ children }) {
    return (
        <StudentAuthProvider>
            {children}
        </StudentAuthProvider>
    );
}
