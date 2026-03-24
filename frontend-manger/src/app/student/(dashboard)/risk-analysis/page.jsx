'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import studentApiClient from '@/lib/studentAxios';
import { showError } from '@/lib/toastHelper';
import { Activity, AlertTriangle, CheckCircle2, ClipboardCheck, GraduationCap, Loader2, ArrowRight } from 'lucide-react';
import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function StudentRiskAnalysisPage() {
    const [risk, setRisk] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchRisk = async () => {
            try {
                const res = await studentApiClient.get('/api/student/risk-analysis');
                setRisk(res.data);
            } catch (error) {
                showError('Failed to load risk analysis.');
            } finally {
                setIsLoading(false);
            }
        };
        fetchRisk();
    }, []);

    if (isLoading) {
        return (
            <div className="admin-page flex justify-center items-center min-h-[60vh]">
                <Loader2 className="animate-spin h-8 w-8 text-orange-600" />
            </div>
        );
    }

    // Determine Theme based on Risk Level (Matches backend RiskScoreCalculator logic)
    const getThemeParams = (score) => {
        if (score >= 60) return { color: 'red', bg: 'bg-red-500', lightBg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700', icon: AlertTriangle };
        if (score >= 35) return { color: 'amber', bg: 'bg-amber-500', lightBg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700', icon: AlertTriangle };
        if (score >= 25) return { color: 'blue', bg: 'bg-blue-500', lightBg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700', icon: Activity };
        return { color: 'emerald', bg: 'bg-emerald-500', lightBg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700', icon: CheckCircle2 };
    };

    const theme = getThemeParams(risk?.riskScore || 0);
    const Icon = theme.icon;

    return (
        <div className="admin-page space-y-6 max-w-4xl mx-auto">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 flex items-center gap-3">
                        <Activity className="text-orange-600" size={32} />
                        Self Risk Analysis Engine
                    </h1>
                    <p className="text-slate-500 mt-1">Track your academic trajectory with real-time risk insights.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* Main Risk Status Card */}
                <Card className={`md:col-span-3 border overflow-hidden shadow-lg ${theme.border}`}>
                    <div className={`h-2 w-full ${theme.bg}`} />
                    <CardContent className={`p-8 sm:p-12 ${theme.lightBg} flex flex-col md:flex-row items-center gap-8`}>
                        <div className={`h-32 w-32 rounded-full border-8 border-white shadow-md flex items-center justify-center shrink-0 ${theme.bg}`}>
                            <div className="text-center text-white">
                                <p className="text-xs uppercase font-bold tracking-widest opacity-80">Score</p>
                                <p className="text-4xl font-black">{risk?.riskScore || 0}</p>
                            </div>
                        </div>
                        
                        <div className="flex-1 text-center md:text-left">
                            <h2 className={`text-sm font-bold uppercase tracking-widest mb-2 ${theme.text}`}>Current Assessment</h2>
                            <h3 className="text-3xl font-black text-slate-900 mb-4">{risk?.riskLevel || 'Unknown Status'}</h3>
                            <p className="text-slate-700 leading-relaxed text-lg max-w-2xl">
                                {risk?.recommendedAction || 'No data available to calculate recommendation.'}
                            </p>
                        </div>
                    </CardContent>
                </Card>

                {/* Key Metrics */}
                <Card className="border-slate-200/60 shadow-sm">
                    <CardContent className="p-6 text-center">
                        <div className="mx-auto w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mb-4">
                            <ClipboardCheck className="text-orange-600" size={24} />
                        </div>
                        <h4 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-2">Attendance Pct</h4>
                        <p className={`text-3xl font-bold ${risk?.attendancePercentage < 75 ? 'text-red-500' : 'text-slate-800'}`}>
                            {risk?.attendancePercentage || 0}%
                        </p>
                    </CardContent>
                </Card>

                <Card className="border-slate-200/60 shadow-sm">
                    <CardContent className="p-6 text-center">
                        <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                            <GraduationCap className="text-blue-600" size={24} />
                        </div>
                        <h4 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-2">Current Avg</h4>
                        <p className={`text-3xl font-bold ${risk?.averagePercentage < 40 ? 'text-red-500' : 'text-slate-800'}`}>
                            {risk?.averagePercentage || 0}%
                        </p>
                    </CardContent>
                </Card>

                <Card className="border-slate-200/60 shadow-sm">
                    <CardContent className="p-6 text-center">
                        <div className="mx-auto w-12 h-12 bg-rose-100 rounded-full flex items-center justify-center mb-4">
                            <AlertTriangle className="text-rose-600" size={24} />
                        </div>
                        <h4 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-2">Weakest Subject</h4>
                        <p className="text-xl font-bold text-slate-800 line-clamp-1 mt-2">
                            {risk?.weakestSubject || 'None Detected'}
                        </p>
                    </CardContent>
                </Card>

                {/* Detailed Analysis / Reason Engine */}
                <Card className="md:col-span-3 border-slate-200/60 shadow-sm">
                    <CardHeader className="bg-slate-50/50 border-b border-slate-100">
                        <CardTitle className="text-lg font-bold text-slate-800">Engine Analysis Breakdown</CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                        {risk?.reasons?.length > 0 ? (
                            <div className="space-y-4">
                                {risk.reasons.map((reason, idx) => (
                                    <div key={idx} className="flex items-start gap-4 p-4 bg-white border border-slate-100 rounded-xl shadow-sm">
                                        <div className="bg-slate-100 p-2 rounded-full shrink-0 mt-0.5">
                                            <ArrowRight className="text-slate-500" size={16} />
                                        </div>
                                        <div>
                                            <p className="font-semibold text-slate-800 capitalize text-lg">{reason}</p>
                                            <p className="text-slate-500 text-sm mt-1">This factor contributed to your overall risk score calculation.</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center p-8 text-center bg-emerald-50/50 border border-emerald-100 rounded-xl">
                                <CheckCircle2 className="text-emerald-500 mb-3" size={40} />
                                <p className="text-lg font-bold text-emerald-800">Perfect Trajectory!</p>
                                <p className="text-emerald-600 mt-1">The engine detected absolutely no negative factors. Keep up the flawless work.</p>
                            </div>
                        )}
                    </CardContent>
                </Card>

            </div>
        </div>
    );
}
