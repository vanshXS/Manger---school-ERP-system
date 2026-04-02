'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { School, KeyRound, Hash, AlertTriangle } from 'lucide-react';
import apiClient from '@/lib/axios';
import { showSuccess, showError } from '@/lib/toastHelper';
import { PasswordInput } from '@/components/common/PasswordInput';

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const userEmail = searchParams.get('email');
    if (userEmail) {
      setEmail(userEmail);
    } else {
      showError('Invalid session. Please start over.');
      router.push('/admin/auth/forgot-password');
    }
  }, [searchParams, router]);

  const validateForm = () => {
    const newErrors = {};
    if (!otp || !/^\d{6}$/.test(otp)) {
      newErrors.otp = 'Please enter the 6-digit OTP.';
    }
    if (!newPassword || newPassword.length < 5 || newPassword.length > 15) {
      newErrors.password = 'Password must be 5-15 characters.';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleResetPassword = async (event) => {
    event.preventDefault();
    setServerError('');
    if (!validateForm()) return;

    setIsLoading(true);
    const resetData = { email, otp, newPassword };

    try {
      await apiClient.post('/api/auth/admin/reset-password', resetData);
      showSuccess('Password has been reset. Redirecting to sign in...');
      router.push('/admin/auth/admin-login');
    } catch (error) {
      console.error('Reset password failed:', error);
      setServerError(error?.customMessage || 'Reset failed. Please check the OTP and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!email) {
    return <div className="flex min-h-screen items-center justify-center bg-slate-100">Loading...</div>;
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-slate-100">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center space-x-2 mb-4">
            <div className="p-2 bg-white rounded-lg border border-slate-200">
              <School className="h-6 w-6 text-blue-600" />
            </div>
            <span className="text-xl font-mono font-bold text-slate-800">Manger</span>
          </Link>
          <h1 className="text-3xl font-mono font-bold text-slate-900">
            Reset Password
          </h1>
          <p className="mt-2 text-slate-600">
            Enter the OTP sent to <span className="font-medium text-slate-800">{email}</span>.
          </p>
        </div>

        <div className="bg-white p-8 rounded-2xl shadow-lg border border-slate-200">
          <form onSubmit={handleResetPassword} noValidate>
            <div className="space-y-5">
              <div>
                <label htmlFor="otp" className="block text-sm font-medium text-slate-700 mb-1">
                  One-Time Password (OTP)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Hash className="w-5 h-5 text-slate-400" />
                  </div>
                  <input
                    id="otp"
                    type="text"
                    required
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    className={`block w-full pl-10 pr-3 py-2 border rounded-md shadow-sm focus:outline-none sm:text-sm ${errors.otp ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-slate-300 focus:ring-blue-500 focus:border-blue-500'}`}
                    placeholder="123456"
                    maxLength={6}
                  />
                </div>
                {errors.otp && <p className="mt-1 text-sm text-red-600" role="alert">{errors.otp}</p>}
              </div>

              <div>
                <label htmlFor="newPassword" className="block text-sm font-medium text-slate-700 mb-1">
                  New Password
                </label>
                <PasswordInput
                  id="newPassword"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="5-15 characters"
                  disabled={isLoading}
                  icon={KeyRound}
                  className={errors.password ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : ''}
                  ringColor="focus:ring-blue-500"
                  borderColor="focus:border-blue-500"
                />
                {errors.password && <p className="mt-1 text-sm text-red-600" role="alert">{errors.password}</p>}
              </div>

              {serverError && (
                <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-sm p-3 rounded-lg" role="alert">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                  <span>{serverError}</span>
                </div>
              )}

              <div>
                <button type="submit" disabled={isLoading} className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400">
                  {isLoading ? 'Resetting...' : 'Reset Password'}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center bg-slate-100">Loading...</div>}>
      <ResetPasswordContent />
    </Suspense>
  );
}
