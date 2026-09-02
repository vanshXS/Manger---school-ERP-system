'use client';

import { GraduationCap, ShieldAlert } from 'lucide-react';
import Link from 'next/link';

export default function StudentForgotPasswordPage() {
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
                </div>

                {/* Info Card */}
                <div className="bg-white p-8 rounded-2xl shadow-xl border border-slate-200 text-center space-y-6">
                    <div className="mx-auto w-14 h-14 bg-amber-50 rounded-full flex items-center justify-center border border-amber-200">
                        <ShieldAlert className="h-7 w-7 text-amber-600" />
                    </div>

                    <div className="space-y-2">
                        <h2 className="text-lg font-bold text-slate-900">
                            Self-Service Reset Disabled
                        </h2>
                        <p className="text-slate-600 text-sm leading-relaxed">
                            Contact your school administrator to reset your password. They can generate a new temporary password for your account immediately.
                        </p>
                    </div>

                    <div className="pt-2">
                        <Link
                            href="/student/auth/student-login"
                            className="inline-flex justify-center items-center w-full py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-white bg-orange-600 hover:bg-orange-700 transition-all"
                        >
                            Back to Student Sign In
                        </Link>
                    </div>
                </div>
            </div>
        </main>
    );
}
