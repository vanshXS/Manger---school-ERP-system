'use client';

import studentApiClient from '@/lib/studentAxios';
import { showError, showSuccess } from '@/lib/toastHelper';
import { AlertTriangle, GraduationCap, KeyRound, Mail, ArrowRight, ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { PasswordInput } from '@/components/common/PasswordInput';

export default function StudentForgotPasswordPage() {
    const [step, setStep] = useState(1); // 1 = Request OTP, 2 = Submit Reset
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [newPassword, setNewPassword] = useState('');
    
    const [errors, setErrors] = useState({});
    const [serverError, setServerError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    const handleRequestOtp = async (event) => {
        event.preventDefault();
        setServerError('');
        const newErrors = {};

        if (!email) {
            newErrors.email = 'Email address is required.';
        } else if (!/\S+@\S+\.\S+/.test(email)) {
            newErrors.email = 'Please enter a valid email address.';
        }

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        setIsLoading(true);

        try {
            await studentApiClient.post('/api/auth/student/forget-password', { email });
            showSuccess('OTP sent to your registered email!');
            setErrors({});
            setStep(2);
        } catch (error) {
            const message = error.customMessage || 'Failed to send OTP. Please check the email.';
            setServerError(message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleResetPassword = async (event) => {
        event.preventDefault();
        setServerError('');
        const newErrors = {};

        if (!otp) newErrors.otp = 'OTP is required.';
        if (!newPassword) newErrors.newPassword = 'New password is required.';
        else if (newPassword.length < 6) newErrors.newPassword = 'Password must be at least 6 characters.';

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        setIsLoading(true);

        try {
            await studentApiClient.post('/api/auth/student/reset-password', {
                email,
                otp,
                newPassword
            });
            showSuccess('Password reset successfully! You can now log in.');
            setTimeout(() => router.push('/student/auth/student-login'), 1500);
        } catch (error) {
            const message = error.customMessage || 'Failed to reset password. OTP may be invalid.';
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
                        Password Reset
                    </h1>
                    <p className="text-slate-600 mt-1 text-sm">
                        {step === 1 ? 'Enter your email to receive a reset OTP.' : 'Enter the OTP sent to your email and your new password.'}
                    </p>
                </div>

                {/* Flow Card */}
                <div className="bg-white p-8 rounded-2xl shadow-xl border border-slate-200">
                    
                    {step === 1 ? (
                        <form onSubmit={handleRequestOtp} noValidate>
                            <div className="space-y-5">
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
                                                ? 'border-red-500 focus:ring-red-500'
                                                : 'border-slate-300 focus:ring-orange-500'
                                                }`}
                                            placeholder="student@example.com"
                                            disabled={isLoading}
                                        />
                                    </div>
                                    {errors.email && (
                                        <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                                    )}
                                </div>

                                {serverError && (
                                    <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-sm p-3 rounded-lg">
                                        <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                                        <span>{serverError}</span>
                                    </div>
                                )}

                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-white bg-orange-600 hover:bg-orange-700 focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:bg-slate-400 disabled:cursor-not-allowed transition-all"
                                >
                                    {isLoading ? 'Sending...' : 'Send Reset OTP'}
                                    {!isLoading && <ArrowRight className="w-5 h-5 ml-2" />}
                                </button>
                            </div>
                        </form>
                    ) : (
                        <form onSubmit={handleResetPassword} noValidate>
                            <div className="space-y-5">
                                
                                <div className="p-3 bg-orange-50 border border-orange-100 rounded-lg text-sm text-center text-orange-800 mb-2">
                                    OTP sent to <strong>{email}</strong>
                                </div>

                                <div>
                                    <label htmlFor="otp" className="block text-sm font-medium text-slate-700 mb-1">
                                        6-Digit OTP
                                    </label>
                                    <div className="relative">
                                        <ShieldCheck className="absolute left-3 top-2.5 h-5 w-5 text-slate-400 pointer-events-none" />
                                        <input
                                            id="otp"
                                            type="text"
                                            value={otp}
                                            onChange={(e) => setOtp(e.target.value)}
                                            className={`block w-full pl-10 pr-3 py-2 border rounded-md text-sm shadow-sm focus:outline-none transition-all tracking-widest ${errors.otp
                                                ? 'border-red-500 focus:ring-red-500'
                                                : 'border-slate-300 focus:ring-orange-500'
                                                }`}
                                            placeholder="000000"
                                            maxLength={6}
                                            disabled={isLoading}
                                        />
                                    </div>
                                    {errors.otp && (
                                        <p className="mt-1 text-sm text-red-600">{errors.otp}</p>
                                    )}
                                </div>

                                <div>
                                    <label htmlFor="newPassword" className="block text-sm font-medium text-slate-700 mb-1">
                                        New Password
                                    </label>
                                        <PasswordInput
                                            id="newPassword"
                                            value={newPassword}
                                            onChange={(e) => setNewPassword(e.target.value)}
                                            placeholder="••••••••"
                                            disabled={isLoading}
                                            icon={KeyRound}
                                            className={errors.newPassword ? 'border-red-500 focus:ring-red-500' : ''}
                                            ringColor="focus:ring-orange-500"
                                            borderColor="focus:border-orange-500"
                                        />
                                    {errors.newPassword && (
                                        <p className="mt-1 text-sm text-red-600">{errors.newPassword}</p>
                                    )}
                                </div>

                                {serverError && (
                                    <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-sm p-3 rounded-lg">
                                        <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                                        <span>{serverError}</span>
                                    </div>
                                )}

                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-white bg-orange-600 hover:bg-orange-700 focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:bg-slate-400 disabled:cursor-not-allowed transition-all"
                                >
                                    {isLoading ? 'Resetting...' : 'Reset Password'}
                                </button>
                                
                                <div className="pt-2 text-center">
                                    <button
                                        type="button"
                                        onClick={() => setStep(1)}
                                        className="text-xs text-slate-500 hover:text-orange-600 transition-colors"
                                    >
                                        Use a different email address?
                                    </button>
                                </div>
                            </div>
                        </form>
                    )}

                    <p className="mt-6 text-center text-sm text-slate-600 pb-2 border-t border-slate-100 pt-6">
                        Remember your password?{' '}
                        <Link
                            href="/student/auth/student-login"
                            className="font-medium text-orange-600 hover:text-orange-500 transition-colors"
                        >
                            Sign In
                        </Link>
                    </p>
                </div>
            </div>
        </main>
    );
}
