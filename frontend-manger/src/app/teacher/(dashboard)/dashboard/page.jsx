'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import teacherApiClient from '@/lib/teacherAxios';
import { format } from 'date-fns';
import {
    Activity,
    AlertTriangle,
    ArrowRight,
    BookOpen, CalendarClock,
    CheckCircle,
    ClipboardCheck,
    Clock,
    GraduationCap, RefreshCw,
    Users
} from 'lucide-react';
import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';

/* ── KPI CARD ── */
const KpiCard = ({ title, value, icon: Icon, subtitle, colorClass = "text-slate-500", bgClass = "bg-slate-100" }) => (
    <Card className="rounded-xl border border-slate-200/80 bg-white shadow-sm transition-all duration-200 hover:shadow-md">
        <CardHeader className="p-4 sm:p-5 pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                {title}
            </CardTitle>
            <div className={`p-2 rounded-lg ${bgClass}`}>
                <Icon className={`h-4 w-4 ${colorClass}`} />
            </div>
        </CardHeader>
        <CardContent className="p-4 sm:p-5 pt-1">
            <p className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-800">
                {value !== undefined && value !== null ? value : '--'}
            </p>
            {subtitle && (
                <p className="text-xs text-slate-400 mt-1">{subtitle}</p>
            )}
        </CardContent>
    </Card>
);

/* ── TODAY CLASS CARD ── */
const TodayClassCard = ({ subject, classroom, timeSlot, isNext }) => (
    <div className={`flex items-center gap-4 p-3 rounded-xl border transition-all ${isNext
        ? 'border-blue-200 bg-blue-50/50 shadow-sm'
        : 'border-slate-100 bg-white hover:border-slate-200'
        }`}>
        <div className={`p-2.5 rounded-lg ${isNext ? 'bg-blue-100' : 'bg-slate-100'}`}>
            <BookOpen className={`h-4 w-4 ${isNext ? 'text-blue-600' : 'text-slate-500'}`} />
        </div>
        <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-slate-800 truncate">{subject}</p>
            <p className="text-xs text-slate-500">{classroom}</p>
        </div>
        <div className="text-right shrink-0">
            <p className="text-xs font-medium text-slate-700">
                {timeSlot}
            </p>
            {isNext && (
                <span className="text-[10px] font-bold text-blue-600 uppercase">Up Next</span>
            )}
        </div>
    </div>
);

const riskBadgeClass = {
    High: 'bg-red-100 text-red-700 border-red-200',
    Medium: 'bg-amber-100 text-amber-700 border-amber-200',
    Watch: 'bg-blue-100 text-blue-700 border-blue-200',
};

function formatMetric(value, suffix = '%') {
    if (value === undefined || value === null) return 'N/A';
    return `${Number(value).toFixed(1)}${suffix}`;
}

function toMinutes(timeValue) {
    if (!timeValue) return null;
    const [hours, minutes] = String(timeValue).split(':').map(Number);
    if (Number.isNaN(hours) || Number.isNaN(minutes)) return null;
    return hours * 60 + minutes;
}

/* ── MAIN DASHBOARD ── */
export default function TeacherDashboard() {
    const [dashboardData, setDashboardData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isRefetching, setIsRefetching] = useState(false);

    // View toggles for "See All"
    const [showAllClasses, setShowAllClasses] = useState(false);
    const [showAllWeakStudents, setShowAllWeakStudents] = useState(false);
    const [showAllPendingTasks, setShowAllPendingTasks] = useState(false);

    const isMounted = useRef(false);

    const fetchData = useCallback(async (isRefresh = false) => {
        if (isRefresh) setIsRefetching(true); else setIsLoading(true);
        setError(null);

        try {
            const res = await teacherApiClient.get('/api/teacher/dashboard/summary');
            if (!isMounted.current) return;
            setDashboardData(res.data);
        } catch (err) {
            if (!isMounted.current) return;
            setError(err?.response?.data?.message || 'Unable to load dashboard data.');
        } finally {
            if (isMounted.current) { setIsLoading(false); setIsRefetching(false); }
        }
    }, []);

    useEffect(() => {
        isMounted.current = true;
        fetchData();
        return () => { isMounted.current = false; };
    }, [fetchData]);

    /* ── LOADING ── */
    if (isLoading) {
        return (
            <div className="space-y-6 max-w-6xl mx-auto p-4 md:p-6">
                <div className="space-y-2">
                    <Skeleton className="h-8 w-48 rounded" />
                    <Skeleton className="h-3 w-32 rounded" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-28 w-full rounded-lg" />)}
                </div>
                <Skeleton className="h-[300px] w-full rounded-lg" />
            </div>
        );
    }

    /* ── ERROR ── */
    if (error) {
        return (
            <div className="flex items-center justify-center min-h-[60vh] p-4">
                <div className="w-full max-w-md text-center p-6 bg-white shadow-sm rounded-xl border border-red-200">
                    <AlertTriangle className="h-10 w-10 text-red-500 mx-auto mb-3" />
                    <h2 className="text-lg font-semibold text-slate-900 mb-1">Something Went Wrong</h2>
                    <p className="text-sm text-slate-500 mb-6">{error}</p>
                    <Button className="w-full h-9" onClick={() => fetchData()}>
                        <RefreshCw className="mr-2 h-4 w-4" /> Try Again
                    </Button>
                </div>
            </div>
        );
    }

    if (!dashboardData) return null;

    const { quickStats, todayClasses, pendingTasks, recentActivity, weakStudents } = dashboardData;

    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const nextClassIndex = todayClasses?.findIndex((cls) => {
        const endMinutes = toMinutes(cls.endTime);
        return endMinutes !== null && endMinutes >= currentMinutes;
    }) ?? -1;

    return (
        <div className="space-y-6 max-w-6xl mx-auto p-4 md:p-6 animate-in fade-in duration-300">

            {/* ── HEADER ── */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">Smart Dashboard</h1>
                    <p className="text-sm text-slate-500 mt-1">
                        Welcome back!{' '}
                        <span className="font-semibold text-slate-700">{format(new Date(), 'EEEE, MMM d, yyyy')}</span>
                    </p>
                </div>
                <Button
                    variant="outline" size="sm"
                    onClick={() => fetchData(true)}
                    disabled={isRefetching}
                    className="h-8 text-xs border-slate-200 shadow-sm"
                >
                    <RefreshCw className={`mr-2 h-3 w-3 ${isRefetching ? 'animate-spin text-blue-600' : 'text-slate-500'}`} />
                    {isRefetching ? 'Syncing...' : 'Refresh'}
                </Button>
            </div>

            {/* ── QUICK STATS ── */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <KpiCard
                    title="Total Students"
                    value={quickStats?.totalStudentsTaught}
                    icon={Users}
                    subtitle="Students taught across classes"
                    colorClass="text-blue-600"
                    bgClass="bg-blue-50"
                />
                <KpiCard
                    title="Weekly Workload"
                    value={quickStats?.weeklyClasses}
                    icon={CalendarClock}
                    subtitle="Classes per week"
                    colorClass="text-emerald-600"
                    bgClass="bg-emerald-50"
                />
                <KpiCard
                    title="Classes Assigned"
                    value={quickStats?.classesAssigned}
                    icon={BookOpen}
                    subtitle="Active classrooms"
                    colorClass="text-amber-600"
                    bgClass="bg-amber-50"
                />
                <KpiCard
                    title="Subjects"
                    value={quickStats?.subjectsTaught}
                    icon={GraduationCap}
                    subtitle="Different subjects taught"
                    colorClass="text-indigo-600"
                    bgClass="bg-indigo-50"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* LEFT COLUMN */}
                <div className="lg:col-span-2 space-y-6">
                    {/* ── TODAY'S SCHEDULE ── */}
                    <Card className="rounded-xl shadow-sm border-slate-200/80">
                        <CardHeader className="p-4 border-b border-slate-100 flex flex-row items-center justify-between">
                            <CardTitle className="text-base font-bold text-slate-800 flex items-center gap-2">
                                <Clock className="w-5 h-5 text-blue-500" /> Today's Classes
                            </CardTitle>
                            <span className="text-[10px] font-semibold text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full">
                                {todayClasses?.length || 0} Classes
                            </span>
                        </CardHeader>
                        <CardContent className="p-4">
                            {todayClasses && todayClasses.length > 0 ? (
                                <>
                                    <div className="space-y-3">
                                        {(showAllClasses ? todayClasses : todayClasses.slice(0, 3)).map((cls, idx) => (
                                            <TodayClassCard
                                                key={cls.id || idx}
                                                subject={cls.subjectName || 'Subject'}
                                                classroom={cls.className || 'Classroom'}
                                                timeSlot={cls.timeSlot || '--:--'}
                                                isNext={idx === nextClassIndex}
                                            />
                                        ))}
                                    </div>
                                    {todayClasses.length > 3 && (
                                        <Button
                                            variant="ghost"
                                            className="w-full mt-3 text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                            onClick={() => setShowAllClasses(!showAllClasses)}
                                        >
                                            {showAllClasses ? 'Show Less' : `See All ${todayClasses.length} Classes`}
                                        </Button>
                                    )}
                                </>
                            ) : (
                                <div className="flex flex-col items-center justify-center py-10 text-slate-400 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                                    <CalendarClock className="h-8 w-8 mb-2 opacity-30 text-emerald-500" />
                                    <p className="text-sm font-medium text-slate-600">No classes scheduled today</p>
                                    <p className="text-xs text-slate-400 mt-1">Enjoy your free time!</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* ── WEAK STUDENTS ALERTS ── */}
                    <Card className="rounded-xl shadow-sm border border-orange-200">
                        <CardHeader className="p-4 border-b border-orange-100 bg-orange-50/30">
                            <CardTitle className="text-base font-bold text-orange-800 flex items-center gap-2">
                                <AlertTriangle className="w-5 h-5 text-orange-500" /> Priority Intervention Queue
                            </CardTitle>
                            <p className="text-xs text-orange-700">
                                This list blends attendance and marks to show who needs action first.
                            </p>
                        </CardHeader>
                        <CardContent className="p-4">
                            {weakStudents && weakStudents.length > 0 ? (
                                <>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        {(showAllWeakStudents ? weakStudents : weakStudents.slice(0, 4)).map((ws, i) => (
                                            <div key={i} className="flex flex-col gap-3 p-4 rounded-xl border border-orange-100 bg-orange-50 flex-1 transition-all hover:bg-orange-100/50">
                                                <div className="flex items-start justify-between gap-3">
                                                    <div>
                                                        <span className="font-semibold text-orange-900 text-sm">{ws.studentName}</span>
                                                        <p className="text-xs text-orange-700 mt-1">{ws.className}</p>
                                                    </div>
                                                    <span className={`text-[10px] font-bold px-2 py-1 rounded-full border ${riskBadgeClass[ws.riskLevel] || riskBadgeClass.Watch}`}>
                                                        {ws.riskLevel} Risk
                                                    </span>
                                                </div>
                                                <div className="flex flex-wrap gap-2 text-[11px] font-semibold">
                                                    <span className="bg-white text-slate-700 px-2 py-1 rounded-md border border-orange-100">
                                                        Score {ws.riskScore}
                                                    </span>
                                                    <span className="bg-white text-slate-700 px-2 py-1 rounded-md border border-orange-100">
                                                        Attendance {formatMetric(ws.attendancePercentage)}
                                                    </span>
                                                    <span className="bg-white text-slate-700 px-2 py-1 rounded-md border border-orange-100">
                                                        Average {formatMetric(ws.averagePercentage)}
                                                    </span>
                                                    {ws.weakestSubject && (
                                                        <span className="bg-white text-slate-700 px-2 py-1 rounded-md border border-orange-100">
                                                            Weakest {ws.weakestSubject}
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-xs text-orange-800">
                                                    <span className="font-semibold">Why flagged:</span> {ws.reason}
                                                </p>
                                                <p className="text-xs text-slate-700 bg-white/80 rounded-lg border border-orange-100 px-3 py-2">
                                                    <span className="font-semibold">Suggested action:</span> {ws.recommendedAction}
                                                </p>
                                                {ws.classroomId && ws.studentId && (
                                                    <Link href={`/teacher/classrooms/${ws.classroomId}/students/${ws.studentId}`}>
                                                        <Button variant="ghost" className="h-8 px-0 justify-start text-xs text-orange-700 hover:text-orange-800 hover:bg-transparent">
                                                            Open student profile <ArrowRight className="ml-1 h-3.5 w-3.5" />
                                                        </Button>
                                                    </Link>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                    {weakStudents.length > 4 && (
                                        <Button
                                            variant="ghost"
                                            className="w-full mt-3 text-xs text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                                            onClick={() => setShowAllWeakStudents(!showAllWeakStudents)}
                                        >
                                            {showAllWeakStudents ? 'Show Less' : `See All ${weakStudents.length} Students`}
                                        </Button>
                                    )}
                                </>
                            ) : (
                                <div className="text-center py-6 text-emerald-600 flex flex-col items-center gap-2">
                                    <CheckCircle className="w-8 h-8 opacity-70" />
                                    <p className="text-sm font-medium text-emerald-700">No students are currently in the intervention queue.</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* RIGHT COLUMN */}
                <div className="space-y-6">
                    {/* ── PENDING TASKS ── */}
                    <Card className="rounded-xl shadow-sm border-slate-200/80">
                        <CardHeader className="p-4 border-b border-slate-100">
                            <CardTitle className="text-base font-bold text-slate-800 flex items-center gap-2">
                                <ClipboardCheck className="w-5 h-5 text-indigo-500" /> Pending Tasks
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            {pendingTasks && pendingTasks.length > 0 ? (
                                <>
                                    <div className="divide-y divide-slate-100">
                                        {(showAllPendingTasks ? pendingTasks : pendingTasks.slice(0, 3)).map((task, i) => (
                                            <div key={i} className="p-4 hover:bg-slate-50 transition-colors flex items-center justify-between group">
                                                <div>
                                                    <p className="text-sm font-semibold text-slate-800">{task.title}</p>
                                                    <p className="text-xs text-slate-500 font-medium mt-0.5">{task.type}</p>
                                                </div>
                                                {task.actionUrl && (
                                                    <Link href={task.actionUrl}>
                                                        <Button size="icon" variant="ghost" className="h-8 w-8 rounded-full text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <ArrowRight className="h-4 w-4" />
                                                        </Button>
                                                    </Link>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                    {pendingTasks.length > 3 && (
                                        <div className="p-3 border-t border-slate-100">
                                            <Button
                                                variant="ghost"
                                                className="w-full text-xs text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50"
                                                onClick={() => setShowAllPendingTasks(!showAllPendingTasks)}
                                            >
                                                {showAllPendingTasks ? 'Show Less' : `View All ${pendingTasks.length} Tasks`}
                                            </Button>
                                        </div>
                                    )}
                                </>
                            ) : (
                                <div className="p-6 text-center">
                                    <CheckCircle className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                                    <p className="text-sm font-medium text-slate-500">You're all caught up!</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* ── RECENT ACTIVITY ── */}
                    <Card className="rounded-xl shadow-sm border-slate-200/80">
                        <CardHeader className="p-4 border-b border-slate-100">
                            <CardTitle className="text-base font-bold text-slate-800 flex items-center gap-2">
                                <Activity className="w-5 h-5 text-emerald-500" /> Recent Activity
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            {recentActivity && recentActivity.length > 0 ? (
                                <>
                                    <div className="divide-y divide-slate-100">
                                        {recentActivity.slice(0, 5).map((activity, i) => (
                                            <div key={i} className="flex items-start gap-3 p-3 hover:bg-slate-50/50 transition-colors">
                                                <div className="w-2 h-2 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-medium text-slate-700 truncate">{activity.description}</p>
                                                    <div className="flex items-center gap-2 mt-0.5">
                                                        <span className="text-[10px] text-slate-400">{activity.time}</span>
                                                        {activity.category && (
                                                            <span className="text-[9px] font-bold uppercase bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded">
                                                                {activity.category}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="p-3 border-t border-slate-100">
                                        <Link href="/teacher/activity-logs">
                                            <Button
                                                variant="ghost"
                                                className="w-full text-xs text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                                            >
                                                View More Activity
                                            </Button>
                                        </Link>
                                    </div>
                                </>
                            ) : (
                                <p className="text-sm text-slate-500 text-center p-6">No recent activity.</p>
                            )}
                        </CardContent>
                    </Card>
                </div>

            </div>
        </div>
    );
}
