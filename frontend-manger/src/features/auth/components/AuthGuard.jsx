'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

const spinnerColors = {
  blue: 'text-blue-600',
  orange: 'text-orange-600',
};

export default function AuthGuard({ children, useAuth, loginPath, accentColor = 'blue' }) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace(loginPath);
    }
  }, [isAuthenticated, isLoading, loginPath, router]);

  if (isLoading) {
    const spinnerColor = spinnerColors[accentColor] || 'text-blue-600';
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <Loader2 className={`h-8 w-8 animate-spin ${spinnerColor} mx-auto mb-4`} />
          <p className="text-slate-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}
