'use client';

import LoginForm from '@/features/auth/components/LoginForm';
import { useAdminAuth } from '@/features/auth';

export default function AdminLoginPage() {
  return <LoginForm role="admin" useAuthHook={useAdminAuth} />;
}