'use client';

import Link from 'next/link';
import { Mail, KeyRound, AlertTriangle, LogIn } from 'lucide-react';
import { PasswordInput } from '@/components/common/PasswordInput';
import AuthLayout from './AuthLayout';
import { AUTH_ROLES } from '../constants';
import { adminApi, studentApi, teacherApi } from '../api/authApi';
import { useLoginForm } from '../hooks/useLoginForm';

const roleApis = {
  admin: adminApi,
  student: studentApi,
  teacher: teacherApi,
};

const styleClasses = {
  blue: {
    inputFocus: 'border-slate-300 focus:ring-blue-500 focus:border-blue-500',
    ringColor: 'focus:ring-blue-500',
    borderColor: 'focus:border-blue-500',
    buttonBg: 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500 focus:ring-offset-2',
    linkText: 'text-blue-600 hover:text-blue-500',
  },
  orange: {
    inputFocus: 'border-slate-300 focus:ring-orange-500 focus:border-orange-500',
    ringColor: 'focus:ring-orange-500',
    borderColor: 'focus:border-orange-500',
    buttonBg: 'bg-orange-600 hover:bg-orange-700 focus:ring-orange-500 focus:ring-offset-2',
    linkText: 'text-orange-600 hover:text-orange-500',
  },
};

export default function LoginForm({ role, useAuthHook }) {
  const { login } = useAuthHook();
  const apiInstance = roleApis[role];
  const roleConfig = AUTH_ROLES[role];
  const styles = styleClasses[roleConfig.accentColor] || styleClasses.blue;

  const {
    email,
    setEmail,
    password,
    setPassword,
    errors,
    serverError,
    isLoading,
    handleSubmit,
  } = useLoginForm({
    apiInstance,
    loginFn: login,
    roleConfig,
  });

  return (
    <AuthLayout
      iconName={roleConfig.icon}
      title={roleConfig.label}
      subtitle={
        role === 'admin'
          ? 'Sign in to access your dashboard and manage your institution.'
          : role === 'student'
          ? 'Sign in to view your attendance, results & timetable.'
          : 'Sign in to access your classes, assignments & more.'
      }
      accentColor={roleConfig.accentColor}
    >
      <form onSubmit={handleSubmit} noValidate>
        <div className="space-y-5">
          {/* Email Field */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-2.5 h-5 w-5 text-slate-400 pointer-events-none" />
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={`block w-full pl-10 pr-3 py-2 border rounded-md text-sm shadow-sm focus:outline-none transition-all ${
                  errors.email
                    ? 'border-red-500 focus:ring-red-500 focus:border-red-500'
                    : styles.inputFocus
                }`}
                placeholder={role === 'student' ? 'student@example.com' : 'you@example.com'}
                disabled={isLoading}
              />
            </div>
            {errors.email && (
              <p className="mt-1 text-sm text-red-600" role="alert">
                {errors.email}
              </p>
            )}
          </div>

          {/* Password Field */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label htmlFor="password" className="block text-sm font-medium text-slate-700">
                Password
              </label>
              {role === 'student' && (
                <Link
                  href="/student/auth/forgot-password"
                  className={`text-xs font-medium ${styles.linkText} transition-colors`}
                >
                  Forgot password?
                </Link>
              )}
            </div>
            <PasswordInput
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              disabled={isLoading}
              icon={KeyRound}
              className={errors.password ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : ''}
              ringColor={styles.ringColor}
              borderColor={styles.borderColor}
            />
            {errors.password && (
              <p className="mt-1 text-sm text-red-600" role="alert">
                {errors.password}
              </p>
            )}
          </div>

          {/* Forgot Password Link (for non-student roles) */}
          {role !== 'student' && (
            <div className="flex items-center justify-end">
              <Link
                href={
                  role === 'admin'
                    ? '/admin/auth/forgot-password'
                    : '/teacher/auth/forgot-password'
                }
                className={`text-sm font-medium ${styles.linkText} transition-colors`}
              >
                Forgot your password?
              </Link>
            </div>
          )}

          {/* Server Error Message */}
          {serverError && (
            <div
              className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-sm p-3 rounded-lg"
              role="alert"
            >
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              <span>{serverError}</span>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className={`w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-white ${styles.buttonBg} disabled:bg-slate-400 disabled:cursor-not-allowed transition-all`}
          >
            {isLoading ? 'Signing in...' : 'Sign In'}
            {!isLoading && <LogIn className="w-5 h-5 ml-2" />}
          </button>
        </div>
      </form>

      {/* Footer Links */}
      <div className="mt-6 text-center text-sm text-slate-600">
        {role === 'admin' ? (
          <>
            Don't have an account?{' '}
            <Link
              href="/admin/auth/register-school"
              className={`font-medium ${styles.linkText} transition-colors`}
            >
              Register your school
            </Link>
          </>
        ) : (
          <>
            {role === 'student' ? 'Not a student?' : 'Not a teacher?'}{' '}
            <Link
              href="/select-role"
              className={`font-medium ${styles.linkText} transition-colors`}
            >
              Go back to role selection
            </Link>
          </>
        )}
      </div>
    </AuthLayout>
  );
}
