import { StudentAuthProvider } from '@/features/auth';

export default function StudentRootLayout({ children }) {
  return (
    <StudentAuthProvider>
      {children}
    </StudentAuthProvider>
  );
}
