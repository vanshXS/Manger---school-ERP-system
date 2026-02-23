'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { School, Mail, Send, AlertTriangle } from 'lucide-react';
import apiClient from '@/lib/axios';
import { showSuccess, showError } from '@/lib/toastHelper';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const router = useRouter();

  const handleRequestOtp = async (event) => {
    event.preventDefault();
    setErrorMessage('');
    if (!email || !/\S+@\S+\.\S+/.test(email)) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }

    setIsLoading(true);
    const requestData = { email };

    try {
      await apiClient.post('/api/auth/admin/forget-password', requestData);
      showSuccess('OTP has been sent to your email. Check your inbox.');
      router.push(`/admin/auth/reset-password?email=${encodeURIComponent(email)}`);
    } catch (error) {
      const serverMessage = error?.customMessage || 'Email not found or request failed.';
      setErrorMessage(serverMessage);
    } finally {
      setIsLoading(false);
    }
  };

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
            Forgot Password
          </h1>
          <p className="mt-2 text-slate-600">
            Enter your email and we'll send an OTP to reset your password.
          </p>
        </div>
        
        <div className="bg-white p-8 rounded-2xl shadow-lg border border-slate-200">
          <form onSubmit={handleRequestOtp} noValidate>
            <div className="space-y-5">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="w-5 h-5 text-slate-400" />
                  </div>
                  <input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={`block w-full pl-10 pr-3 py-2 border rounded-md shadow-sm focus:outline-none sm:text-sm ${
                      errorMessage ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-slate-300 focus:ring-blue-500 focus:border-blue-500'
                    }`}
                    placeholder="you@example.com"
                    disabled={isLoading}
                  />
                </div>
                {errorMessage && (
                  <div className="flex items-center gap-2 mt-1 text-sm text-red-600" role="alert">
                    <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                    <span>{errorMessage}</span>
                  </div>
                )}
              </div>
              
              <div>
                <button type="submit" disabled={isLoading} className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400">
                  {isLoading ? 'Sending...' : 'Send OTP'}
                  {!isLoading && <Send className="w-5 h-5 ml-2" />}
                </button>
              </div>
            </div>
          </form>
           <p className="mt-6 text-center text-sm text-slate-600">
            Suddenly remembered?{' '}
            {/* This link also needs to be updated */}
            <Link href="/admin/auth/admin-login" className="font-medium text-blue-600 hover:text-blue-500">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
