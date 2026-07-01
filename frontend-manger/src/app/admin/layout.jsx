import { AdminAuthProvider } from '@/features/auth';

export default function AdminRootLayout({ children }) {
  return (
    <AdminAuthProvider>
      {children}
    </AdminAuthProvider>
  );
}
