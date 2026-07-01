'use client';

import LoginForm from '@/features/auth/components/LoginForm';
import { useStudentAuth } from '@/features/auth';

export default function StudentLoginPage() {
  return <LoginForm role="student" useAuthHook={useStudentAuth} />;
}
