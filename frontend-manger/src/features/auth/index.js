'use client';

import { AUTH_ROLES } from './constants';
import { adminApi, studentApi, teacherApi } from './api/authApi';
import { createAuthContext } from './contexts/createAuthContext';

export { AUTH_ROLES } from './constants';
export { adminApi, studentApi, teacherApi } from './api/authApi';
export { default as AuthLayout } from './components/AuthLayout';
export { default as LoginForm } from './components/LoginForm';
export { default as AuthGuard } from './components/AuthGuard';

// Instantiate and export role-specific providers and custom hooks
export const { AuthProvider: AdminAuthProvider, useAuth: useAdminAuth } = createAuthContext(
  AUTH_ROLES.admin,
  adminApi
);

export const { AuthProvider: StudentAuthProvider, useAuth: useStudentAuth } = createAuthContext(
  AUTH_ROLES.student,
  studentApi
);

export const { AuthProvider: TeacherAuthProvider, useAuth: useTeacherAuth } = createAuthContext(
  AUTH_ROLES.teacher,
  teacherApi
);
