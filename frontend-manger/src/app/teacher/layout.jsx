import { TeacherAuthProvider } from '@/contexts/TeacherAuthContext';

export default function TeacherRootLayout({ children }) {
    return (
        <TeacherAuthProvider>
            {children}
        </TeacherAuthProvider>
    );
}
