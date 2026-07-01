import { TeacherAuthProvider } from '@/features/auth';

export default function TeacherRootLayout({ children }) {
  return (
    <TeacherAuthProvider>
      {children}
    </TeacherAuthProvider>
  );
}
