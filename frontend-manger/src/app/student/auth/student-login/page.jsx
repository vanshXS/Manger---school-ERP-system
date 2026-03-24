'use client';

import { useStudentAuth } from '@/contexts/StudentAuthContext';
import studentApiClient from '@/lib/studentAxios';
import { showError, showSuccess } from '@/lib/toastHelper';
import { AlertTriangle, GraduationCap, KeyRound, LogIn, Mail } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function StudentLoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [errors, setErrors] = useState({});
    const [serverError, setServerError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();
    const { login } = useStudentAuth();

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
            const response = await studentApiClient.post('/api/auth/student/login', { email, password });
            const { accessToken } = response.data;
            login(accessToken);
            showSuccess('Signed in successfully. Redirecting…');
            setTimeout(() => router.push('/student/dashboard'), 800);
        } catch (error) {
            const message = error.customMessage || 'Login failed. Please try again.';
            setServerError(message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <main className="flex min-h-screen flex-col items-center justify-center px-4 bg-gradient-to-b from-orange-50 to-slate-100">
            <div className="w-full max-w-md">
                {/* Branding */}
                <div className="text-center mb-8">
                    <Link href="/" className="inline-flex items-center space-x-2 mb-4">
                        <div className="p-2 bg-white rounded-lg border border-slate-200 shadow-sm">
                            <GraduationCap className="h-6 w-6 text-orange-600" />
                        </div>
                        <span className="text-xl font-mono font-bold text-slate-800">
                            Manger
                        </span>
                    </Link>
                    <h1 className="text-3xl font-mono font-bold text-slate-900">
                        Student Portal
                    </h1>
                    <p className="text-slate-600 mt-1 text-sm">
                        Sign in to view your attendance, results & timetable.
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
                                            : 'border-slate-300 focus:ring-orange-500 focus:border-orange-500'
                                            }`}
                                        placeholder="student@example.com"
                                        disabled={isLoading}
                                    />
                                </div>
                                {errors.email && (
                                    <p className="mt-1 text-sm text-red-600" role="alert">{errors.email}</p>
                                )}
                            </div>

                            {/* Password Field */}
                            <div>
                                <div className="flex items-center justify-between mb-1">
                                    <label htmlFor="password" className="block text-sm font-medium text-slate-700">
                                        Password
                                    </label>
                                    <Link 
                                        href="/student/auth/forgot-password" 
                                        className="text-xs font-medium text-orange-600 hover:text-orange-500 transition-colors"
                                    >
                                        Forgot password?
                                    </Link>
                                </div>
                                <div className="relative">
                                    <KeyRound className="absolute left-3 top-2.5 h-5 w-5 text-slate-400 pointer-events-none" />
                                    <input
                                        id="password"
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className={`block w-full pl-10 pr-3 py-2 border rounded-md text-sm shadow-sm focus:outline-none transition-all ${errors.password
                                            ? 'border-red-500 focus:ring-red-500 focus:border-red-500'
                                            : 'border-slate-300 focus:ring-orange-500 focus:border-orange-500'
                                            }`}
                                        placeholder="••••••••"
                                        disabled={isLoading}
                                    />
                                </div>
                                {errors.password && (
                                    <p className="mt-1 text-sm text-red-600" role="alert">{errors.password}</p>
                                )}
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
                                className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-white bg-orange-600 hover:bg-orange-700 focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:bg-slate-400 disabled:cursor-not-allowed transition-all"
                            >
                                {isLoading ? 'Signing in...' : 'Sign In'}
                                {!isLoading && <LogIn className="w-5 h-5 ml-2" />}
                            </button>
                        </div>
                    </form>

                    {/* Back to role selection */}
                    <p className="mt-6 text-center text-sm text-slate-600">
                        Not a student?{' '}
                        <Link
                            href="/select-role"
                            className="font-medium text-orange-600 hover:text-orange-500 transition-colors"
                        >
                            Go back to role selection
                        </Link>
                    </p>
                </div>
            </div>
        </main>
    );
}
