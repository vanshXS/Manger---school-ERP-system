'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import apiClient from '@/lib/axios';
import { School, UserPlus, Mail, KeyRound, User } from 'lucide-react';
import { showSuccess, showError } from '@/lib/toastHelper';
import { PasswordInput } from '@/components/common/PasswordInput';

export default function AdminSignupPage() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const validateForm = () => {
    const newErrors = {};
    if (!fullName) {
      newErrors.fullName = 'Full name is required.';
    } else if (fullName.length < 3) {
      newErrors.fullName = 'Full name must be at least 3 characters long.';
    }

    if (!email) {
      newErrors.email = 'Email address is required.';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Please enter a valid email address.';
    }

    if (!password) {
      newErrors.password = 'Password is required.';
    } else if (password.length < 5 || password.length > 15) {
      newErrors.password = 'Password must be between 5 and 15 characters.';
    }

    setErrors({ ...newErrors, server: '' });
    return Object.keys(newErrors).length === 0;
  };

  const handleSignup = async (event) => {
    event.preventDefault();
    if (!validateForm()) {
      showError('Please correct the highlighted fields.');
      return;
    }

    setIsLoading(true);
    const signupData = { fullName, email, password };

    try {
      await apiClient.post('/api/auth/admin/register', signupData);
      showSuccess('Account created. Redirecting to sign in…');
      router.push('/admin/auth/admin-login');
    } catch (error) {
      const msg = error?.customMessage || error?.response?.data?.message || 'Registration failed. Please try again.';
      setErrors((prev) => ({ ...prev, server: msg }));
      showError(msg);
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
            Create Admin Account
          </h1>
        </div>
        
        <div className="bg-white p-8 rounded-2xl shadow-lg border border-slate-200">
          <form onSubmit={handleSignup} noValidate>
            <div className="space-y-5">
              <div>
                <label htmlFor="fullName" className="block text-sm font-medium text-slate-700 mb-1">
                  Full Name
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="w-5 h-5 text-slate-400" />
                  </div>
                  <input
                    id="fullName"
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className={`block w-full pl-10 pr-3 py-2 border rounded-md shadow-sm focus:outline-none sm:text-sm ${errors.fullName ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-slate-300 focus:ring-blue-500 focus:border-blue-500'}`}
                    placeholder="John Doe"
                  />
                </div>
                {errors.fullName && <p className="mt-1 text-sm text-red-600" role="alert">{errors.fullName}</p>}
              </div>

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
                    className={`block w-full pl-10 pr-3 py-2 border rounded-md shadow-sm focus:outline-none sm:text-sm ${errors.email ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-slate-300 focus:ring-blue-500 focus:border-blue-500'}`}
                    placeholder="you@example.com"
                  />
                </div>
                {errors.email && <p className="mt-1 text-sm text-red-600" role="alert">{errors.email}</p>}
              </div>
              
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-1">
                  Password
                </label>
                <PasswordInput
                  id="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="5-15 characters"
                  disabled={isLoading}
                  icon={KeyRound}
                  className={errors.password ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : ''}
                  ringColor="focus:ring-blue-500"
                  borderColor="focus:border-blue-500"
                />
                {errors.password && <p className="mt-1 text-sm text-red-600" role="alert">{errors.password}</p>}
              </div>
              {errors.server && (
                <div className="text-sm text-red-600 bg-red-50 border border-red-200 p-3 rounded-lg" role="alert">
                  {errors.server}
                </div>
              )}
              <div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-slate-400 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Creating Account...' : 'Create Account'}
                  {!isLoading && <UserPlus className="w-5 h-5 ml-2" />}
                </button>
              </div>
            </div>
          </form>
          <p className="mt-6 text-center text-sm text-slate-600">
            Already have an account?{' '}
            <Link href="/admin/auth/admin-login" className="font-medium text-blue-600 hover:text-blue-500">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
