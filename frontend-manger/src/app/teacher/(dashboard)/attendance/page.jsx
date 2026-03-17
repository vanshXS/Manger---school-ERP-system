"use client";

import {
    AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
    AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { classroomDisplayName } from "@/lib/classroomDisplayName";
import teacherApiClient from '@/lib/teacherAxios';
import { showError, showSuccess } from "@/lib/toastHelper";
import {
    AlertTriangle, Calendar, Check, CheckCircle2, CheckSquare, Clock,
    Loader2, RotateCcw, Save, Search, UserCheck, UserMinus, Users, UserX, X
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

/* ═══════════════════════════════════════════════════
   SKELETON SHIMMER
   ═══════════════════════════════════════════════════ */
function SkeletonRow() {
    return (
        <div className="flex items-center gap-3 py-3 px-4 animate-pulse">
            <div className="w-8 h-8 rounded-full bg-slate-200" />
            <div className="flex-1 space-y-1.5">
                <div className="h-3.5 bg-slate-200 rounded w-32" />
                <div className="h-2.5 bg-slate-100 rounded w-20" />
            </div>
            <div className="flex gap-1.5">
                <div className="w-9 h-9 rounded-lg bg-slate-200" />
                <div className="w-9 h-9 rounded-lg bg-slate-200" />
                <div className="w-9 h-9 rounded-lg bg-slate-200" />
            </div>
        </div>
    );
}

/* ═══════════════════════════════════════════════════
   STAT CARD
   ═══════════════════════════════════════════════════ */
function StatCard({ icon: Icon, label, count, total, colorClass, bgClass, borderClass }) {
    const pct = total > 0 ? Math.round((count / total) * 100) : 0;
    return (
        <div className={`relative overflow-hidden rounded-xl border ${borderClass} ${bgClass} p-3 transition-all duration-300 hover:shadow-md`}>
            <div className="flex items-center gap-2.5">
                <div className={`p-1.5 rounded-lg bg-white/70 shadow-sm`}>
                    <Icon size={15} className={colorClass} />
                </div>
                <div className="min-w-0">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{label}</p>
                    <div className="flex items-baseline gap-1.5">
                        <span className={`text-lg font-extrabold ${colorClass} tabular-nums`}>{count}</span>
                        {total > 0 && (
                            <span className="text-[10px] font-semibold text-slate-400">{pct}%</span>
                        )}
                    </div>
                </div>
            </div>
            {/* Mini progress bar at bottom */}
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/5">
                <div
                    className={`h-full transition-all duration-500 ease-out rounded-r-full ${colorClass.replace('text-', 'bg-')}`}
                    style={{ width: `${pct}%` }}
                />
            </div>
        </div>
    );
}

/* ═══════════════════════════════════════════════════
   STUDENT ROW
   ═══════════════════════════════════════════════════ */
const STATUS_CONFIG = [
    { key: 'PRESENT', label: 'P', icon: Check, active: 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30 scale-110', idle: 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border border-emerald-200 hover:border-emerald-300 hover:shadow-sm' },
    { key: 'ABSENT', label: 'A', icon: X, active: 'bg-red-500 text-white shadow-lg shadow-red-500/30 scale-110', idle: 'bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 hover:border-red-300 hover:shadow-sm' },
    { key: 'LEAVE', label: 'L', icon: Clock, active: 'bg-amber-500 text-white shadow-lg shadow-amber-500/30 scale-110', idle: 'bg-amber-50 text-amber-600 hover:bg-amber-100 border border-amber-200 hover:border-amber-300 hover:shadow-sm' },
];

function StudentRow({ student, index, onStatusChange, isEven }) {
    const s = student.status;
    const initials = (student.studentName || '?')
        .split(' ')
        .map(n => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase();

    const gradients = [
        'from-blue-500 to-indigo-600',
        'from-violet-500 to-purple-600',
        'from-teal-500 to-emerald-600',
        'from-rose-500 to-pink-600',
        'from-amber-500 to-orange-600',
    ];
    const gradient = gradients[index % gradients.length];

    return (
        <div className={`flex items-center gap-3 py-2.5 px-4 transition-all duration-200 group
            ${isEven ? 'bg-white' : 'bg-slate-50/50'}
            hover:bg-blue-50/40
            ${s ? '' : 'border-l-2 border-l-transparent hover:border-l-amber-400'}`}
        >
            {/* Index */}
            <span className="w-6 text-xs font-bold text-slate-400 tabular-nums text-center shrink-0">
                {index + 1}
            </span>

            {/* Avatar */}
            <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${gradient} flex items-center justify-center shrink-0 shadow-sm`}>
                <span className="text-[10px] font-bold text-white">{initials}</span>
            </div>

            {/* Name & Roll */}
            <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-800 truncate leading-tight">{student.studentName}</p>
                <p className="text-[10px] text-slate-400 font-medium">Roll: {student.rollNo || 'N/A'}</p>
            </div>

            {/* Status Buttons */}
            <div className="flex items-center gap-1.5 shrink-0">
                {STATUS_CONFIG.map(({ key, icon: StatusIcon, active, idle }) => (
                    <button
                        key={key}
                        type="button"
                        onClick={() => onStatusChange(student.studentId, key)}
                        className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all duration-200 text-xs font-bold
                            ${s === key ? active : idle}`}
                        title={key}
                        aria-label={`Mark ${student.studentName} as ${key}`}
                    >
                        <StatusIcon size={15} />
                    </button>
                ))}
            </div>

            {/* Status Badge */}
            <div className="w-16 text-right shrink-0 hidden sm:block">
                {s ? (
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide
                        ${s === 'PRESENT' ? 'bg-emerald-100 text-emerald-700' :
                            s === 'ABSENT' ? 'bg-red-100 text-red-700' :
                                'bg-amber-100 text-amber-700'}`}>
                        {s}
                    </span>
                ) : (
                    <span className="text-[10px] text-slate-300 font-medium">—</span>
                )}
            </div>
        </div>
    );
}

/* ═══════════════════════════════════════════════════
   MAIN ATTENDANCE PAGE
   ═══════════════════════════════════════════════════ */
export default function TeacherAttendancePage() {
    // ── State ──
    const [classrooms, setClassrooms] = useState([]);
    const [selectedClassroomId, setSelectedClassroomId] = useState("");
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

    const [roster, setRoster] = useState([]);
    const [isRosterLoaded, setIsRosterLoaded] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");

    const [loadingClassrooms, setLoadingClassrooms] = useState(true);
    const [loadingRoster, setLoadingRoster] = useState(false);
    const [saving, setSaving] = useState(false);

    const [showConfirmDialog, setShowConfirmDialog] = useState(false);
    const [showMarkAllConfirm, setShowMarkAllConfirm] = useState(null); // 'PRESENT' | 'ABSENT' | null

    const isMounted = useRef(true);

    // ── Fetch classrooms on mount ──
    useEffect(() => {
        isMounted.current = true;
        fetchAssignedClassrooms();
        return () => { isMounted.current = false; };
    }, []);

    // ── Auto-load roster when classroom + date are both selected ──
    useEffect(() => {
        if (selectedClassroomId && selectedDate) {
            fetchRoster();
        } else {
            setRoster([]);
            setIsRosterLoaded(false);
        }
    }, [selectedClassroomId, selectedDate]);

    const fetchAssignedClassrooms = async () => {
        try {
            setLoadingClassrooms(true);
            const res = await teacherApiClient.get("/api/teacher/attendance/classes");
            if (isMounted.current) setClassrooms(res.data || []);
        } catch {
            if (isMounted.current) showError("Failed to load assigned classrooms.");
        } finally {
            if (isMounted.current) setLoadingClassrooms(false);
        }
    };

    const fetchRoster = useCallback(async () => {
        if (!selectedClassroomId || !selectedDate) return;
        try {
            setLoadingRoster(true);
            const res = await teacherApiClient.get(
                `/api/teacher/attendance/classes/${selectedClassroomId}/roster?date=${selectedDate}`
            );
            if (isMounted.current) {
                setRoster(res.data || []);
                setIsRosterLoaded(true);
                setSearchQuery("");
            }
        } catch (err) {
            if (isMounted.current) {
                showError(err.response?.data?.message || "Failed to load student roster.");
                setIsRosterLoaded(false);
            }
        } finally {
            if (isMounted.current) setLoadingRoster(false);
        }
    }, [selectedClassroomId, selectedDate]);

    // ── Handlers ──
    const handleStatusChange = (studentId, newStatus) => {
        setRoster(prev => prev.map(s =>
            s.studentId === studentId
                ? { ...s, status: s.status === newStatus ? null : newStatus } // Toggle: click again to unmark
                : s
        ));
    };

    const handleMarkAll = (status) => {
        const alreadyMarked = roster.filter(s => s.status && s.status !== status).length;
        if (alreadyMarked > 0) {
            setShowMarkAllConfirm(status);
        } else {
            applyMarkAll(status);
        }
    };

    const applyMarkAll = (status) => {
        setRoster(prev => prev.map(s => ({ ...s, status })));
        setShowMarkAllConfirm(null);
        showSuccess(`All students marked as ${status.toLowerCase()}.`);
    };

    const handleReset = () => {
        setRoster(prev => prev.map(s => ({ ...s, status: null })));
        showSuccess("All marks cleared.");
    };

    const handleSaveClick = () => {
        const markedCount = roster.filter(s => s.status).length;
        if (markedCount === 0) {
            showError("No attendance marked. Please mark at least one student before saving.");
            return;
        }
        if (unmarked > 0) {
            showError(`${unmarked} student${unmarked > 1 ? 's are' : ' is'} still unmarked. Please mark all students before saving.`);
            return;
        }
        setShowConfirmDialog(true);
    };

    const handleConfirmSave = async () => {
        setShowConfirmDialog(false);
        try {
            setSaving(true);
            const records = roster
                .filter(s => s.status !== null && s.status !== undefined)
                .map(s => ({ studentId: s.studentId, status: s.status }));

            const payload = {
                classroomId: Number(selectedClassroomId),
                date: selectedDate,
                records
            };

            const res = await teacherApiClient.post("/api/teacher/attendance/bulk-save", payload);
            const data = res.data;

            if (data && data.changed === false) {
                showSuccess("Attendance is already up to date — no changes needed.");
            } else {
                showSuccess(`Attendance saved successfully! (${data?.savedCount || records.length} records updated)`);
                // Refresh roster to get consistent state
                await fetchRoster();
            }
        } catch (err) {
            showError(err.response?.data?.message || "Failed to save attendance. Please try again.");
        } finally {
            if (isMounted.current) setSaving(false);
        }
    };

    // ── Computed values ──
    const total = roster.length;
    const present = roster.filter(s => s.status === 'PRESENT').length;
    const absent = roster.filter(s => s.status === 'ABSENT').length;
    const leave = roster.filter(s => s.status === 'LEAVE').length;
    const unmarked = total - present - absent - leave;
    const marked = total - unmarked;
    const progressPct = total > 0 ? Math.round((marked / total) * 100) : 0;

    // ── Filtered roster ──
    const filteredRoster = roster.filter(s => {
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        return (
            s.studentName?.toLowerCase().includes(q) ||
            s.rollNo?.toLowerCase().includes(q)
        );
    });

    // ── Selected classroom name ──
    const selectedClassroom = classrooms.find(c => String(c.id) === String(selectedClassroomId));
    const selectedClassName = selectedClassroom ? classroomDisplayName(selectedClassroom) : '';

    /* ──────────── LOADING STATE ──────────── */
    if (loadingClassrooms && classrooms.length === 0) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="text-center space-y-3">
                    <div className="relative">
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center mx-auto shadow-lg shadow-blue-500/25">
                            <CheckSquare className="h-7 w-7 text-white" />
                        </div>
                        <Loader2 className="h-5 w-5 animate-spin text-blue-500 absolute -bottom-1 -right-1 bg-white rounded-full p-0.5 shadow" />
                    </div>
                    <p className="text-sm font-medium text-slate-500">Loading your classrooms...</p>
                </div>
            </div>
        );
    }

    /* ──────────── RENDER ──────────── */
    return (
        <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-5">

            {/* ═══ HEADER ═══ */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg shadow-emerald-500/20">
                        <CheckSquare className="h-5 w-5 text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Attendance</h1>
                        <p className="text-sm text-slate-500">Mark and manage student attendance</p>
                    </div>
                </div>
                {isRosterLoaded && selectedClassName && (
                    <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-lg">
                        <Users size={14} className="text-blue-600" />
                        <span className="text-sm font-semibold text-blue-700">{selectedClassName}</span>
                    </div>
                )}
            </div>

            {/* ═══ SELECTION FORM ═══ */}
            <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-4 md:p-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Classroom Select */}
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
                            <Users size={13} className="text-blue-500" /> Classroom
                        </label>
                        <select
                            className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/40 focus:border-blue-400 outline-none text-slate-700 text-sm transition-all"
                            value={selectedClassroomId}
                            onChange={(e) => setSelectedClassroomId(e.target.value)}
                        >
                            <option value="">Choose a classroom...</option>
                            {classrooms.map(c => (
                                <option key={c.id} value={c.id}>
                                    {classroomDisplayName(c)}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Date Select */}
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
                            <Calendar size={13} className="text-emerald-500" /> Date
                        </label>
                        <input
                            type="date"
                            className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-400 outline-none text-slate-700 text-sm transition-all"
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                            max={new Date().toISOString().split('T')[0]}
                        />
                    </div>
                </div>

                {/* Info text when no roster */}
                {!isRosterLoaded && selectedClassroomId && selectedDate && !loadingRoster && (
                    <p className="text-xs text-slate-400 mt-3 text-center">Select classroom and date above to auto-load the roster</p>
                )}
            </div>

            {/* ═══ LOADING ROSTER SKELETON ═══ */}
            {loadingRoster && (
                <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
                    <div className="p-3 bg-slate-50 border-b border-slate-100 flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                        <span className="text-sm font-medium text-slate-500">Loading student roster...</span>
                    </div>
                    <div className="divide-y divide-slate-100">
                        {[...Array(6)].map((_, i) => <SkeletonRow key={i} />)}
                    </div>
                </div>
            )}

            {/* ═══ EMPTY STATE ═══ */}
            {isRosterLoaded && !loadingRoster && roster.length === 0 && (
                <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-12 text-center">
                    <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
                        <Users className="h-8 w-8 text-slate-400" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-700 mb-1">No Students Found</h3>
                    <p className="text-sm text-slate-500 max-w-sm mx-auto">
                        This classroom has no enrolled students for the current academic year.
                    </p>
                </div>
            )}

            {/* ═══ ATTENDANCE ROSTER ═══ */}
            {isRosterLoaded && !loadingRoster && roster.length > 0 && (
                <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">

                    {/* ── Progress Bar ── */}
                    <div className="px-4 pt-4 pb-2">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                                Marking Progress
                            </span>
                            <span className={`text-xs font-bold tabular-nums ${progressPct === 100 ? 'text-emerald-600' : 'text-slate-500'}`}>
                                {marked} / {total} students ({progressPct}%)
                            </span>
                        </div>
                        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div
                                className={`h-full rounded-full transition-all duration-700 ease-out ${progressPct === 100
                                    ? 'bg-gradient-to-r from-emerald-400 to-emerald-500'
                                    : 'bg-gradient-to-r from-blue-400 to-indigo-500'
                                    }`}
                                style={{ width: `${progressPct}%` }}
                            />
                        </div>
                    </div>

                    {/* ── Stats Grid ── */}
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 px-4 pb-3">
                        <StatCard icon={Users} label="Total" count={total} total={0}
                            colorClass="text-blue-600" bgClass="bg-blue-50/50" borderClass="border-blue-200/60" />
                        <StatCard icon={UserCheck} label="Present" count={present} total={total}
                            colorClass="text-emerald-600" bgClass="bg-emerald-50/50" borderClass="border-emerald-200/60" />
                        <StatCard icon={UserX} label="Absent" count={absent} total={total}
                            colorClass="text-red-600" bgClass="bg-red-50/50" borderClass="border-red-200/60" />
                        <StatCard icon={UserMinus} label="Leave" count={leave} total={total}
                            colorClass="text-amber-600" bgClass="bg-amber-50/50" borderClass="border-amber-200/60" />
                        <StatCard icon={AlertTriangle} label="Unmarked" count={unmarked} total={total}
                            colorClass="text-slate-500" bgClass="bg-slate-50/50" borderClass="border-slate-200/60" />
                    </div>

                    {/* ── Quick Actions & Search ── */}
                    <div className="px-4 py-3 bg-slate-50/80 border-y border-slate-100 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                        {/* Search */}
                        <div className="relative flex-1">
                            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search by name or roll number..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 outline-none transition-all"
                            />
                            {searchQuery && (
                                <button
                                    onClick={() => setSearchQuery("")}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                >
                                    <X size={14} />
                                </button>
                            )}
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-1.5 shrink-0">
                            <button
                                onClick={() => handleMarkAll('PRESENT')}
                                className="text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-3 py-2 rounded-lg transition-all border border-emerald-200 hover:border-emerald-300 hover:shadow-sm flex items-center gap-1.5"
                            >
                                <CheckCircle2 size={13} /> All Present
                            </button>
                            <button
                                onClick={() => handleMarkAll('ABSENT')}
                                className="text-xs font-semibold text-red-700 bg-red-50 hover:bg-red-100 px-3 py-2 rounded-lg transition-all border border-red-200 hover:border-red-300 hover:shadow-sm flex items-center gap-1.5"
                            >
                                <UserX size={13} /> All Absent
                            </button>
                            <button
                                onClick={handleReset}
                                className="text-xs font-semibold text-slate-600 bg-white hover:bg-slate-50 px-3 py-2 rounded-lg transition-all border border-slate-200 hover:border-slate-300 hover:shadow-sm flex items-center gap-1.5"
                                title="Reset all marks"
                            >
                                <RotateCcw size={13} /> Reset
                            </button>
                        </div>
                    </div>

                    {/* ── Student List ── */}
                    <div className="divide-y divide-slate-100">
                        {filteredRoster.map((student, i) => (
                            <StudentRow
                                key={student.studentId}
                                student={student}
                                index={i}
                                onStatusChange={handleStatusChange}
                                isEven={i % 2 === 0}
                            />
                        ))}
                        {filteredRoster.length === 0 && searchQuery && (
                            <div className="py-10 text-center">
                                <Search className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                                <p className="text-sm font-medium text-slate-500">
                                    No students matching &ldquo;{searchQuery}&rdquo;
                                </p>
                                <button
                                    onClick={() => setSearchQuery("")}
                                    className="text-xs text-blue-600 hover:underline mt-1"
                                >
                                    Clear search
                                </button>
                            </div>
                        )}
                    </div>

                    {/* ── Save Footer ── */}
                    <div className="p-4 bg-gradient-to-r from-slate-50 to-slate-100/80 border-t border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-3">
                        <div className="text-center sm:text-left">
                            <p className="text-sm font-medium text-slate-600">
                                {marked} of {total} students marked
                            </p>
                            {unmarked > 0 && (
                                <p className="text-xs text-amber-600 font-medium flex items-center gap-1 justify-center sm:justify-start mt-0.5">
                                    <AlertTriangle size={12} />
                                    {unmarked} student{unmarked > 1 ? 's' : ''} still unmarked
                                </p>
                            )}
                        </div>
                        <button
                            onClick={handleSaveClick}
                            disabled={saving || marked === 0}
                            className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold px-8 py-2.5 rounded-xl flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30 active:scale-[0.98]"
                        >
                            {saving ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                <>
                                    <Save className="w-4 h-4" />
                                    Save Attendance
                                </>
                            )}
                        </button>
                    </div>
                </div>
            )}

            {/* ═══ NO CLASSROOM SELECTED ═══ */}
            {!isRosterLoaded && !loadingRoster && !selectedClassroomId && (
                <div className="bg-white rounded-xl border border-dashed border-slate-300 p-12 text-center">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center mx-auto mb-4">
                        <CheckSquare className="h-8 w-8 text-blue-400" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-700 mb-1">Select a Classroom</h3>
                    <p className="text-sm text-slate-500 max-w-sm mx-auto">
                        Choose a classroom and date above to start marking attendance for your students.
                    </p>
                </div>
            )}

            {/* ═══ CONFIRMATION DIALOG ═══ */}
            <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
                <AlertDialogContent className="max-w-md">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2 text-slate-900">
                            <CheckCircle2 className="h-5 w-5 text-blue-600" />
                            Confirm Save Attendance
                        </AlertDialogTitle>
                        <AlertDialogDescription asChild>
                            <div className="space-y-3 text-sm text-slate-600">
                                <p>
                                    You are about to save attendance for <strong className="text-slate-800">{selectedClassName}</strong> on{' '}
                                    <strong className="text-slate-800">
                                        {selectedDate ? new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-IN', {
                                            weekday: 'short', day: 'numeric', month: 'short', year: 'numeric'
                                        }) : ''}
                                    </strong>.
                                </p>
                                <div className="grid grid-cols-3 gap-2 py-2">
                                    <div className="bg-emerald-50 rounded-lg p-2.5 text-center border border-emerald-200">
                                        <p className="text-lg font-bold text-emerald-700">{present}</p>
                                        <p className="text-[10px] font-semibold text-emerald-600 uppercase">Present</p>
                                    </div>
                                    <div className="bg-red-50 rounded-lg p-2.5 text-center border border-red-200">
                                        <p className="text-lg font-bold text-red-700">{absent}</p>
                                        <p className="text-[10px] font-semibold text-red-600 uppercase">Absent</p>
                                    </div>
                                    <div className="bg-amber-50 rounded-lg p-2.5 text-center border border-amber-200">
                                        <p className="text-lg font-bold text-amber-700">{leave}</p>
                                        <p className="text-[10px] font-semibold text-amber-600 uppercase">On Leave</p>
                                    </div>
                                </div>
                            </div>
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel className="text-sm">Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleConfirmSave}
                            className="bg-blue-600 hover:bg-blue-700 text-white text-sm"
                        >
                            <Save className="w-4 h-4 mr-1.5" /> Confirm & Save
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* ═══ MARK ALL CONFIRMATION DIALOG ═══ */}
            <AlertDialog open={!!showMarkAllConfirm} onOpenChange={() => setShowMarkAllConfirm(null)}>
                <AlertDialogContent className="max-w-sm">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2 text-slate-900">
                            <AlertTriangle className="h-5 w-5 text-amber-500" />
                            Override Existing Marks?
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            Some students already have marks set. This will override <strong>all</strong> students
                            to <strong>{showMarkAllConfirm?.toLowerCase()}</strong>. Continue?
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel className="text-sm">Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => applyMarkAll(showMarkAllConfirm)}
                            className={`text-sm text-white ${showMarkAllConfirm === 'PRESENT'
                                ? 'bg-emerald-600 hover:bg-emerald-700'
                                : 'bg-red-600 hover:bg-red-700'
                                }`}
                        >
                            Yes, Mark All {showMarkAllConfirm === 'PRESENT' ? 'Present' : 'Absent'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
