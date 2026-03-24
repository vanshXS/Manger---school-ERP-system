'use client';

import { useStudentAuth } from '@/contexts/StudentAuthContext';
import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function StudentProtectedRoute({ children }) {
    const { isAuthenticated, isLoading } = useStudentAuth();
    const router = useRouter();

    useEffect(() => {
        if (!isLoading && !isAuthenticated) {
            router.push('/student/auth/student-login'); // Redirect to student login
        }
    }, [isAuthenticated, isLoading, router]);

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <div className="text-center">
                    <Loader2 className="h-8 w-8 animate-spin text-orange-600 mx-auto mb-4" />
                    <p className="text-slate-600">Loading Student Portal...</p>
                </div>
            </div>
        );
    }

    if (!isAuthenticated) {
        return null; // Will redirect in useEffect
    }

    return <>{children}</>;
}
