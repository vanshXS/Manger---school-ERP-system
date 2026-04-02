'use client';

import { useTeacherAuth } from '@/contexts/TeacherAuthContext';
import teacherApiClient from '@/lib/teacherAxios';
import { showError, showSuccess } from '@/lib/toastHelper';
import { AlertTriangle, KeyRound, LogIn, Mail, School } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { PasswordInput } from '@/components/common/PasswordInput';

export default function TeacherLoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [errors, setErrors] = useState({});
    const [serverError, setServerError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();
    const { login } = useTeacherAuth();

    // ✅ Validate form before sending request
    const validateForm = () => {
        const newErrors = {};
        if (!email) {
            newErrors.email = 'Email address is required.';
        } else if (!/\S+@\S+\.\S+/.test(email)) {
            newErrors.email = 'Please enter a valid email address.';
        }
        if (!password) {
            newErrors.password = 'Password is required.';
        } else if (password.length < 5) {
            newErrors.password = 'Password must be at least 5 characters long.';
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // ✅ Handle Login
    const handleLogin = async (event) => {
        event.preventDefault();
        setServerError('');

        if (!validateForm()) {
            showError('Please correct the highlighted fields.');
            return;
        }

        setIsLoading(true);

        try {
            const response = await teacherApiClient.post('/api/auth/teacher/login', { email, password });

            const { accessToken } = response.data;

            login(accessToken);

            showSuccess('Signed in successfully. Redirecting…');
            setTimeout(() => router.push('/teacher/dashboard'), 800);
        } catch (error) {

            const message = error.customMessage || 'Login failed. Please try again.';
            setServerError(message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <main className="flex min-h-screen flex-col items-center justify-center px-4 bg-gradient-to-b from-blue-50 to-slate-100">
            <div className="w-full max-w-md">
                {/* Branding */}
                <div className="text-center mb-8">
                    <Link href="/" className="inline-flex items-center space-x-2 mb-4">
                        <div className="p-2 bg-white rounded-lg border border-slate-200 shadow-sm">
                            <School className="h-6 w-6 text-blue-600" />
                        </div>
                        <span className="text-xl font-mono font-bold text-slate-800">
                            Manger
                        </span>
                    </Link>
                    <h1 className="text-3xl font-mono font-bold text-slate-900">
                        Teacher Portal Login
                    </h1>
                    <p className="text-slate-600 mt-1 text-sm">
                        Sign in to access your classes, assignments \u0026 more.
                    </p>
                </div>

                {/* Login Card */}
                <div className="bg-white p-8 rounded-2xl shadow-xl border border-slate-200 transition-all duration-200 hover:shadow-2xl">
                    <form onSubmit={handleLogin} noValidate>
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
                                        className={`block w-full pl-10 pr-3 py-2 border rounded-md text-sm shadow-sm focus:outline-none transition-all ${errors.email
                                            ? 'border-red-500 focus:ring-red-500 focus:border-red-500'
                                            : 'border-slate-300 focus:ring-blue-500 focus:border-blue-500'
                                            }`}
                                        placeholder="you@example.com"
                                        disabled={isLoading}
                                    />
                                </div>
                                {errors.email && (
                                    <p className="mt-1 text-sm text-red-600" role="alert">{errors.email}</p>
                                )}
                            </div>

                            {/* Password Field */}
                            <div>
                                <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-1">
                                    Password
                                </label>
                                <PasswordInput
                                    id="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    disabled={isLoading}
                                    icon={KeyRound}
                                    className={errors.password ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : ''}
                                    ringColor="focus:ring-blue-500"
                                    borderColor="focus:border-blue-500"
                                />
                                {errors.password && (
                                    <p className="mt-1 text-sm text-red-600" role="alert">{errors.password}</p>
                                )}
                            </div>

                            {/* Forgot Password */}
                            <div className="flex items-center justify-end">
                                <Link
                                    href="/teacher/auth/forgot-password"
                                    className="text-sm font-medium text-blue-600 hover:text-blue-500 transition-colors"
                                >
                                    Forgot your password?
                                </Link>
                            </div>

                            {/* Server Error Message */}
                            {serverError && (
                                <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-sm p-3 rounded-lg" role="alert">
                                    <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                                    <span>{serverError}</span>
                                </div>
                            )}

                            {/* Submit Button */}
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-slate-400 disabled:cursor-not-allowed transition-all"
                            >
                                {isLoading ? 'Signing in...' : 'Sign In'}
                                {!isLoading && <LogIn className="w-5 h-5 ml-2" />}
                            </button>
                        </div>
                    </form>

                    {/* Back to role selection */}
                    <p className="mt-6 text-center text-sm text-slate-600">
                        Not a teacher?{' '}
                        <Link
                            href="/select-role"
                            className="font-medium text-blue-600 hover:text-blue-500 transition-colors"
                        >
                            Go back to role selection
                        </Link>
                    </p>
                </div>
            </div>
        </main>
    );
}