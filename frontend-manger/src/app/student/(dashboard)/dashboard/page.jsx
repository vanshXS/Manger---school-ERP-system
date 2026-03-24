'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import studentApiClient from '@/lib/studentAxios';
import { showError } from '@/lib/toastHelper';
import { Activity, AlertTriangle, Calendar, CalendarClock, CheckCircle2, ChevronRight, ClipboardCheck, GraduationCap, Clock, School, UserCircle } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function StudentDashboardPage() {
    const [profile, setProfile] = useState(null);
    const [academicYears, setAcademicYears] = useState([]);
    const [selectedYear, setSelectedYear] = useState(null);
    const [attendanceSummary, setAttendanceSummary] = useState(null);
    const [timetable, setTimetable] = useState([]);
    const [riskAnalysis, setRiskAnalysis] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                // Fetch basic profile and years first
                const [profileRes, yearsRes] = await Promise.all([
                    studentApiClient.get('/api/student/profile'),
                    studentApiClient.get('/api/student/academic-years')
                ]);

                setProfile(profileRes.data);
                setAcademicYears(yearsRes.data);

                const currentYear = yearsRes.data.find(y => y.current) || yearsRes.data[0];
                setSelectedYear(currentYear);

                if (currentYear) {
                    // Fetch attendance, timetable, and risk analysis
                    const [attRes, ttRes, riskRes] = await Promise.all([
                        studentApiClient.get(`/api/student/attendance/summary?academicYearId=${currentYear.id}`),
                        studentApiClient.get('/api/student/timetable'),
                        studentApiClient.get('/api/student/risk-analysis')
                    ]);

                    setAttendanceSummary(attRes.data);
                    setTimetable(ttRes.data);
                    setRiskAnalysis(riskRes.data);
                }
            } catch (error) {
                showError('Failed to load dashboard data. Please try again.');
            } finally {
                setIsLoading(false);
            }
        };

        fetchDashboardData();
    }, []);

    if (isLoading) {
        return (
            <div className="admin-page space-y-6 animate-pulse">
                <div className="h-20 bg-slate-200 rounded-2xl w-full"></div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {[1, 2, 3, 4].map(i => <div key={i} className="h-32 bg-slate-200 rounded-2xl"></div>)}
                </div>
            </div>
        );
    }

    // Get today's timetable
    const today = new Date().toLocaleDateString('en-US', { weekday: 'long' }).toUpperCase();
    const todaysClasses = timetable.filter(t => t.day === today);

    // Format time (e.g., 09:00:00 -> 09:00 AM)
    const formatTime = (timeString) => {
        if (!timeString) return '';
        const [hour, minute] = timeString.split(':');
        const h = parseInt(hour, 10);
        const ampm = h >= 12 ? 'PM' : 'AM';
        const h12 = h % 12 || 12;
        return `${h12}:${minute} ${ampm}`;
    };

    return (
        <div className="admin-page space-y-6">

            {/* Welcome Banner */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-orange-600 to-amber-600 p-8 sm:p-10 text-white shadow-xl">
                <div className="absolute top-0 right-0 -mt-10 -mr-10 opacity-10">
                    <GraduationCap size={200} />
                </div>
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-2">
                            Welcome back, {profile?.firstName}!
                        </h1>
                        <p className="text-orange-100 flex items-center gap-2">
                            <School size={16} /> 
                            {profile?.classroomResponseDTO?.gradeLevel} - {profile?.classroomResponseDTO?.section} 
                            <span className="opacity-50">•</span> 
                            Roll No: {profile?.rollNo}
                        </p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Left Column (Stats & Risk Analysis) */}
                <div className="lg:col-span-2 space-y-6">

                    {/* Quick Stats */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <Card className="border-slate-200/60 shadow-sm hover:shadow-md transition-shadow">
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between space-x-2">
                                    <h3 className="text-sm font-medium text-slate-500 uppercase tracking-wider">Attendance</h3>
                                    <div className="p-2 bg-orange-100 rounded-lg text-orange-600">
                                        <ClipboardCheck size={20} />
                                    </div>
                                </div>
                                <div className="mt-4 flex items-baseline text-3xl font-bold text-slate-800">
                                    {attendanceSummary?.percentage || 0}%
                                </div>
                                <p className="text-xs text-slate-500 mt-1">
                                    {attendanceSummary?.presentDays || 0} / {attendanceSummary?.totalDays || 0} days present
                                </p>
                            </CardContent>
                        </Card>

                        <Card className="border-slate-200/60 shadow-sm hover:shadow-md transition-shadow">
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between space-x-2">
                                    <h3 className="text-sm font-medium text-slate-500 uppercase tracking-wider">Overall Avg</h3>
                                    <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                                        <GraduationCap size={20} />
                                    </div>
                                </div>
                                <div className="mt-4 flex items-baseline text-3xl font-bold text-slate-800">
                                    {riskAnalysis?.averagePercentage || 0}%
                                </div>
                                <p className="text-xs text-slate-500 mt-1">Across all subjects</p>
                            </CardContent>
                        </Card>

                        <Card className="border-slate-200/60 shadow-sm hover:shadow-md transition-shadow">
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between space-x-2">
                                    <h3 className="text-sm font-medium text-slate-500 uppercase tracking-wider">Status</h3>
                                    <div className="p-2 bg-emerald-100 rounded-lg text-emerald-600">
                                        <CheckCircle2 size={20} />
                                    </div>
                                </div>
                                <div className="mt-4 flex items-baseline text-xl font-bold text-slate-800">
                                    {profile?.status?.replace('_', ' ') || 'ACTIVE'}
                                </div>
                                <p className="text-xs text-slate-500 mt-1">{selectedYear?.name}</p>
                            </CardContent>
                        </Card>
                    </div>

                    {/* MVP Feature: Student Self Risk Analysis Engine */}
                    <Card className={`border shadow-sm overflow-hidden ${
                        riskAnalysis?.riskScore >= 60 ? 'border-red-200 bg-red-50/30' : 
                        riskAnalysis?.riskScore >= 35 ? 'border-amber-200 bg-amber-50/30' : 
                        riskAnalysis?.riskScore >= 25 ? 'border-blue-200 bg-blue-50/30' : 
                        'border-emerald-200 bg-emerald-50/30'
                    }`}>
                        <div className={`h-2 w-full ${
                            riskAnalysis?.riskScore >= 60 ? 'bg-red-500' : 
                            riskAnalysis?.riskScore >= 35 ? 'bg-amber-500' : 
                            riskAnalysis?.riskScore >= 25 ? 'bg-blue-500' : 
                            'bg-emerald-500'
                        }`} />
                        <CardHeader className="pb-3 border-b border-black/5 bg-white/50 backdrop-blur-sm">
                            <div className="flex items-center justify-between">
                                <CardTitle className="flex items-center gap-2 text-lg font-bold text-slate-800">
                                    <Activity className="text-slate-600" size={20} />
                                    Academic Risk Analysis
                                </CardTitle>
                                <span className={`px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-full ${
                                    riskAnalysis?.riskScore >= 60 ? 'bg-red-100 text-red-700' : 
                                    riskAnalysis?.riskScore >= 35 ? 'bg-amber-100 text-amber-700' : 
                                    riskAnalysis?.riskScore >= 25 ? 'bg-blue-100 text-blue-700' : 
                                    'bg-emerald-100 text-emerald-700'
                                }`}>
                                    {riskAnalysis?.riskLevel || 'Unknown'} (Score: {riskAnalysis?.riskScore || 0})
                                </span>
                            </div>
                        </CardHeader>
                        <CardContent className="pt-6 grid grid-cols-1 md:grid-cols-2 gap-6 bg-white/20">
                            
                            <div>
                                <h4 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                                    <AlertTriangle size={16} className="text-slate-400" />
                                    Identified Areas
                                </h4>
                                {riskAnalysis?.reasons?.length > 0 ? (
                                    <ul className="space-y-2">
                                        {riskAnalysis.reasons.map((reason, idx) => (
                                            <li key={idx} className="text-sm text-slate-600 flex items-start gap-2 bg-white/60 p-2 rounded-lg border border-slate-200/60">
                                                <div className="mt-1 h-1.5 w-1.5 rounded-full bg-slate-400 shrink-0" />
                                                <span className="capitalize">{reason}</span>
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <p className="text-sm text-emerald-600 font-medium bg-white/60 p-3 rounded-lg border border-emerald-100 flex items-center gap-2">
                                        <CheckCircle2 size={16} /> Lookin' good! No academic risks detected.
                                    </p>
                                )}
                            </div>

                            <div>
                                <h4 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                                    <ClipboardCheck size={16} className="text-slate-400" />
                                    Recommended Action
                                </h4>
                                <div className="bg-white/80 p-4 rounded-xl border border-slate-200/80 shadow-sm h-full flex flex-col justify-center">
                                    <p className="text-sm text-slate-700 font-medium leading-relaxed">
                                        {riskAnalysis?.recommendedAction || 'Keep up the good work and maintain your current study habits!'}
                                    </p>
                                    
                                    {riskAnalysis?.weakestSubject && (
                                        <div className="mt-4 pt-3 border-t border-slate-100 text-xs text-slate-500">
                                            Priority Focus Subject: <span className="font-bold text-slate-700">{riskAnalysis.weakestSubject}</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                        </CardContent>
                        <div className="bg-slate-50 border-t border-slate-100 p-3 px-6">
                            <Link href="/student/risk-analysis" className="text-xs font-semibold text-slate-500 hover:text-orange-600 flex items-center justify-end group transition-colors">
                                View Full Analysis Report 
                                <ChevronRight size={14} className="ml-1 group-hover:translate-x-1 transition-transform" />
                            </Link>
                        </div>
                    </Card>

                </div>

                {/* Right Column (Timetable widget) */}
                <div className="space-y-6">
                    <Card className="h-full border-slate-200/60 shadow-sm flex flex-col">
                        <CardHeader className="pb-3 border-b border-slate-100 flex-shrink-0">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-lg font-bold text-slate-800 flex items-center gap-2">
                                    <CalendarClock size={20} className="text-orange-600" />
                                    Today's Classes
                                </CardTitle>
                                <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2 py-1 rounded-md">
                                    {new Date().toLocaleDateString('en-US', { weekday: 'short' })}
                                </span>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0 flex-1 overflow-y-auto custom-scrollbar">
                            {todaysClasses.length > 0 ? (
                                <div className="divide-y divide-slate-100">
                                    {todaysClasses.map((cl, index) => (
                                        <div key={index} className="p-4 hover:bg-slate-50 transition-colors flex items-start gap-4">
                                            <div className="flex flex-col items-end shrink-0 w-20">
                                                <span className="text-sm font-bold text-slate-700">{formatTime(cl.startTime)}</span>
                                                <span className="text-xs text-slate-400">{formatTime(cl.endTime)}</span>
                                            </div>
                                            
                                            <div className="h-10 w-1 bg-orange-200 rounded-full my-auto shrink-0" />
                                            
                                            <div className="flex flex-col min-w-0 flex-1">
                                                <span className="text-sm font-bold text-slate-800 truncate">{cl.subjectName}</span>
                                                <span className="text-xs text-slate-500 truncate flex items-center gap-1 mt-0.5">
                                                    <UserCircle size={12} /> {cl.teacherName}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center p-8 text-center text-slate-500 space-y-3">
                                    <div className="bg-slate-100 p-4 rounded-full">
                                        <CalendarClock size={24} className="text-slate-400" />
                                    </div>
                                    <p className="text-sm">No classes scheduled for today.</p>
                                </div>
                            )}
                        </CardContent>
                        <div className="p-3 border-t border-slate-100 bg-slate-50 flex-shrink-0 text-center">
                            <Link href="/student/timetable" className="text-xs font-semibold text-orange-600 hover:text-orange-700 transition-colors">
                                View Full Timetable
                            </Link>
                        </div>
                    </Card>
                </div>

            </div>
        </div>
    );
}
