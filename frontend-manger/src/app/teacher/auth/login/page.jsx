'use client';

import LoginForm from '@/features/auth/components/LoginForm';
import { useTeacherAuth } from '@/features/auth';

export default function TeacherLoginPage() {
  return <LoginForm role="teacher" useAuthHook={useTeacherAuth} />;
}