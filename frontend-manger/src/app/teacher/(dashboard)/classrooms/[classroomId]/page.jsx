'use client';

import { classroomDisplayName } from '@/lib/classroomDisplayName';
import teacherApiClient from '@/lib/teacherAxios';
import { showError } from '@/lib/toastHelper';
import {
    ArrowLeft, ChevronRight,
    Search, User,
    X
} from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

const INITIAL_SHOW = 12;

export default function ClassroomStudentsPage() {
    const { classroomId } = useParams();
    const router = useRouter();

    const [classroom, setClassroom] = useState(null);
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [showAll, setShowAll] = useState(false);
    const isMounted = useRef(false);

    useEffect(() => {
        isMounted.current = true;
        fetchData();
        return () => { isMounted.current = false; };
    }, [classroomId]);

    const fetchData = async () => {
        try {
            setLoading(true);
            // Fetch classroom info
            const classRes = await teacherApiClient.get('/api/teacher/attendance/classes');
            const cls = classRes.data.find(c => String(c.id) === String(classroomId));
            if (isMounted.current) setClassroom(cls || null);

            // Fetch student roster (without date — we just need names)
            const rosterRes = await teacherApiClient.get(`/api/teacher/attendance/classes/${classroomId}/roster`);
            if (isMounted.current) setStudents(rosterRes.data);
        } catch {
            if (isMounted.current) showError('Failed to load students.');
        } finally {
            if (isMounted.current) setLoading(false);
        }
    };

    const classroomName = classroom ? classroomDisplayName(classroom) : 'Classroom';

    let filtered = students;
    if (search.trim()) {
        const q = search.toLowerCase();
        filtered = students.filter(s =>
            (s.studentName || '').toLowerCase().includes(q) ||
            (s.rollNo || '').toLowerCase().includes(q)
        );
    }
    const displayed = showAll ? filtered : filtered.slice(0, INITIAL_SHOW);

    if (loading) {
        return (
            <div className="space-y-6 max-w-6xl mx-auto p-4 md:p-6">
                <div className="h-5 w-40 bg-slate-200 rounded animate-pulse mb-4" />
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {[...Array(6)].map((_, i) => (
                        <div key={i} className="bg-white rounded-xl border p-4 animate-pulse flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-slate-200" />
                            <div className="flex-1">
                                <div className="h-4 w-28 bg-slate-200 rounded mb-1.5" />
                                <div className="h-3 w-16 bg-slate-100 rounded" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-6xl mx-auto p-4 md:p-6 animate-in fade-in duration-300">
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-sm text-slate-500">
                <button onClick={() => router.push('/teacher/classrooms')} className="hover:text-indigo-600 transition-colors flex items-center gap-1">
                    <ArrowLeft size={14} /> My Classes
                </button>
                <ChevronRight size={14} />
                <span className="text-slate-800 font-semibold">{classroomName}</span>
            </div>

            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold text-lg">
                        {classroom?.section?.charAt(0)?.toUpperCase() || '?'}
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">{classroomName}</h1>
                        <p className="text-sm text-slate-500">{students.length} student{students.length !== 1 ? 's' : ''} enrolled</p>
                    </div>
                </div>
                {students.length > 6 && (
                    <div className="relative">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input type="text" placeholder="Search students..." value={search}
                            onChange={(e) => { setSearch(e.target.value); setShowAll(false); }}
                            className="pl-9 pr-8 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none w-56" />
                        {search && (
                            <button onClick={() => setSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"><X size={14} /></button>
                        )}
                    </div>
                )}
            </div>

            {/* Student Grid */}
            {displayed.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 text-center border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50">
                    <div className="bg-white p-4 rounded-full shadow-sm mb-4"><User className="h-8 w-8 text-slate-300" /></div>
                    <h3 className="text-lg font-semibold text-slate-900">{search ? 'No Matching Students' : 'No Students'}</h3>
                    <p className="text-slate-500 max-w-sm mt-2 text-sm">
                        {search ? `No students match "${search}".` : 'No students enrolled in this classroom.'}
                    </p>
                </div>
            ) : (
                <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {displayed.map((s) => (
                            <Link key={s.enrollmentId || s.studentId}
                                href={`/teacher/classrooms/${classroomId}/students/${s.studentId}`}
                                className="w-full text-left bg-white rounded-xl border border-slate-200/80 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all duration-200 p-4 group flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-100 to-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-sm shrink-0">
                                    {s.studentName?.charAt(0) || '?'}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h4 className="font-semibold text-slate-800 group-hover:text-indigo-700 transition-colors truncate">{s.studentName}</h4>
                                    <div className="flex items-center gap-2 mt-0.5">
                                        <p className="text-xs text-slate-500">Roll: {s.rollNo || '—'}</p>
                                        <span className="text-slate-300">•</span>
                                        <p className="text-xs text-slate-500">{s.gender || 'N/A'}</p>
                                    </div>
                                </div>
                                <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                    <span className="text-[10px] font-bold text-indigo-600 uppercase bg-indigo-50 px-2 py-1 rounded-md border border-indigo-100">
                                        Profile
                                    </span>
                                </div>
                                <ChevronRight size={16} className="text-slate-300 group-hover:text-indigo-500 shrink-0 transition-colors" />
                            </Link>
                        ))}
                    </div>
                    {!showAll && filtered.length > INITIAL_SHOW && (
                        <div className="flex justify-center">
                            <button onClick={() => setShowAll(true)}
                                className="px-6 py-2.5 text-sm font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors border border-indigo-200">
                                See All Students ({filtered.length})
                            </button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
