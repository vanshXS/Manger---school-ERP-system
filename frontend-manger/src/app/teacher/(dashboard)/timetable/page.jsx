'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import teacherApiClient from '@/lib/teacherAxios';
import {
    BookOpen,
    Calendar,
    Clock
} from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';

const DAYS_ORDER = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
const dayLabel = (d) => d.charAt(0) + d.slice(1).toLowerCase();

/* ── TIME SLOT CARD ── */
const SlotCard = ({ entry, isNow }) => (
    <div className={`p-3 rounded-xl border transition-all ${isNow
        ? 'border-blue-200 bg-blue-50/60 shadow-sm ring-1 ring-blue-100'
        : 'border-slate-100 bg-white hover:border-slate-200 hover:shadow-sm'
        }`}>
        <div className="flex items-start gap-3">
            <div className={`p-2 rounded-lg shrink-0 ${isNow ? 'bg-blue-100' : 'bg-slate-100'}`}>
                <BookOpen className={`h-4 w-4 ${isNow ? 'text-blue-600' : 'text-slate-500'}`} />
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-800 truncate">
                    {entry.subjectName || 'Subject'}
                </p>
                <p className="text-xs text-slate-500 mt-0.5">
                    {entry.classroomName || 'Classroom'}
                </p>
                <div className="flex items-center gap-1 mt-1.5">
                    <Clock className="h-3 w-3 text-slate-400" />
                    <span className="text-[11px] font-medium text-slate-600">
                        {entry.startTime?.substring(0, 5) || '--:--'} – {entry.endTime?.substring(0, 5) || '--:--'}
                    </span>
                </div>
                {entry.teacherName && (
                    <p className="text-[11px] text-slate-400 mt-1 truncate">{entry.teacherName}</p>
                )}
            </div>
            {isNow && (
                <span className="text-[9px] font-bold text-blue-600 bg-blue-100 px-2 py-0.5 rounded-full uppercase tracking-wide shrink-0">
                    Now
                </span>
            )}
        </div>
    </div>
);

/* ── MAIN TIMETABLE PAGE ── */
export default function TeacherTimetablePage() {
    const [timetable, setTimetable] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const isMounted = useRef(false);

    const fetchTimetable = useCallback(async () => {
        setIsLoading(true);
        try {
            const res = await teacherApiClient.get('/api/teacher/timetable');
            if (!isMounted.current) return;
            setTimetable(res.data || []);
        } catch {
            // silently fail — empty state shown
        } finally {
            if (isMounted.current) setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        isMounted.current = true;
        fetchTimetable();
        return () => { isMounted.current = false; };
    }, [fetchTimetable]);

    // Group by day
    const grouped = {};
    DAYS_ORDER.forEach(d => { grouped[d] = []; });

    timetable.forEach(entry => {
        const day = entry.day?.toUpperCase();
        if (grouped[day]) {
            grouped[day].push(entry);
        }
    });

    // Sort each day by start time
    Object.keys(grouped).forEach(d => {
        grouped[d].sort((a, b) => (a.startTime || '').localeCompare(b.startTime || ''));
    });

    // Detect current class
    const now = new Date();
    const daysMap = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
    const todayStr = daysMap[now.getDay()];
    const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    const isCurrentSlot = (entry) => {
        if (entry.day?.toUpperCase() !== todayStr) return false;
        const start = entry.startTime?.substring(0, 5) || '';
        const end = entry.endTime?.substring(0, 5) || '';
        return currentTime >= start && currentTime <= end;
    };

    /* ── LOADING ── */
    if (isLoading) {
        return (
            <div className="space-y-6 max-w-6xl mx-auto p-4 md:p-6">
                <div className="space-y-2">
                    <Skeleton className="h-8 w-48 rounded" />
                    <Skeleton className="h-3 w-64 rounded" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[...Array(6)].map((_, i) => (
                        <div key={i} className="space-y-3">
                            <Skeleton className="h-8 w-28 rounded-lg" />
                            <Skeleton className="h-24 w-full rounded-xl" />
                            <Skeleton className="h-24 w-full rounded-xl" />
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    const totalSlots = timetable.length;
    const todaySlots = grouped[todayStr]?.length || 0;

    return (
        <div className="space-y-6 max-w-6xl mx-auto p-4 md:p-6 animate-in fade-in duration-300">

            {/* ── HEADER ── */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-6">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
                        <span className="p-2 rounded-xl bg-blue-100 text-blue-600">
                            <Calendar className="h-6 w-6" />
                        </span>
                        My Timetable
                    </h1>
                    <p className="text-slate-500 text-sm mt-1 ml-1">
                        Your weekly schedule • {totalSlots} classes total • {todaySlots} today
                    </p>
                </div>
            </div>

            {/* ── TIMETABLE GRID ── */}
            {totalSlots === 0 ? (
                <div className="flex flex-col items-center justify-center py-32 text-center border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50">
                    <div className="bg-white p-4 rounded-full shadow-sm mb-4">
                        <Calendar className="h-8 w-8 text-blue-200" />
                    </div>
                    <h3 className="text-lg font-semibold text-slate-900">No Schedule Found</h3>
                    <p className="text-slate-500 max-w-sm mt-2 text-sm">
                        Your timetable will appear here once the admin assigns your schedule.
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {DAYS_ORDER.map(day => {
                        const entries = grouped[day];
                        const isToday = day === todayStr;

                        return (
                            <Card key={day} className={`rounded-xl shadow-sm transition-all ${isToday
                                ? 'border-blue-200 ring-1 ring-blue-100'
                                : 'border-slate-200/80'
                                }`}>
                                <CardHeader className={`p-3 px-4 flex flex-row items-center justify-between ${isToday
                                    ? 'bg-blue-50/80 border-b border-blue-100'
                                    : 'bg-slate-50/80 border-b border-slate-100'
                                    }`}>
                                    <CardTitle className={`text-sm font-bold ${isToday ? 'text-blue-700' : 'text-slate-700'}`}>
                                        {dayLabel(day)}
                                    </CardTitle>
                                    <div className="flex items-center gap-1.5">
                                        {isToday && (
                                            <span className="text-[9px] font-bold text-blue-600 bg-blue-100 px-2 py-0.5 rounded-full uppercase">
                                                Today
                                            </span>
                                        )}
                                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded ${isToday
                                            ? 'text-blue-600 bg-blue-100'
                                            : 'text-slate-500 bg-slate-100'
                                            }`}>
                                            {entries.length}
                                        </span>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-3 space-y-2">
                                    {entries.length > 0 ? (
                                        entries.map((entry, idx) => (
                                            <SlotCard
                                                key={entry.id || idx}
                                                entry={entry}
                                                isNow={isCurrentSlot(entry)}
                                            />
                                        ))
                                    ) : (
                                        <div className="flex items-center justify-center py-6 text-slate-400">
                                            <p className="text-xs font-medium">No classes</p>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
