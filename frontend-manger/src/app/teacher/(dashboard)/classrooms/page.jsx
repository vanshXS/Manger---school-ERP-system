'use client';

import { classroomDisplayName } from '@/lib/classroomDisplayName';
import teacherApiClient from '@/lib/teacherAxios';
import { showError } from '@/lib/toastHelper';
import {
    ChevronRight, GraduationCap,
    Search, Users, X
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

const INITIAL_SHOW = 8;

export default function TeacherClassroomsPage() {
    const [classrooms, setClassrooms] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [showAll, setShowAll] = useState(false);
    const router = useRouter();
    const isMounted = useRef(false);

    useEffect(() => {
        isMounted.current = true;
        fetchClassrooms();
        return () => { isMounted.current = false; };
    }, []);

    const fetchClassrooms = async () => {
        try {
            setLoading(true);
            const res = await teacherApiClient.get('/api/teacher/attendance/classes');
            if (isMounted.current) setClassrooms(res.data);
        } catch {
            if (isMounted.current) showError('Failed to load your classrooms.');
        } finally {
            if (isMounted.current) setLoading(false);
        }
    };

    let filtered = classrooms;
    if (search.trim()) {
        const q = search.toLowerCase();
        filtered = classrooms.filter(c => {
            const name = classroomDisplayName(c).toLowerCase();
            return name.includes(q) || (c.section || '').toLowerCase().includes(q);
        });
    }
    const displayed = showAll ? filtered : filtered.slice(0, INITIAL_SHOW);

    if (loading) {
        return (
            <div className="space-y-6 max-w-6xl mx-auto p-4 md:p-6">
                <div className="flex items-center gap-3 mb-6">
                    <span className="p-2.5 rounded-xl bg-indigo-100 text-indigo-600"><Users className="h-6 w-6" /></span>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">My Classes</h1>
                        <p className="text-sm text-slate-500">Your assigned classrooms and students</p>
                    </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[...Array(6)].map((_, i) => (
                        <div key={i} className="bg-white rounded-xl border border-slate-200 p-5 animate-pulse">
                            <div className="h-5 w-24 bg-slate-200 rounded mb-3" />
                            <div className="h-4 w-32 bg-slate-100 rounded mb-2" />
                            <div className="h-3 w-20 bg-slate-100 rounded" />
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-6xl mx-auto p-4 md:p-6 animate-in fade-in duration-300">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div className="flex items-center gap-3">
                    <span className="p-2.5 rounded-xl bg-indigo-100 text-indigo-600"><Users className="h-6 w-6" /></span>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">My Classes</h1>
                        <p className="text-sm text-slate-500">{classrooms.length} classroom{classrooms.length !== 1 ? 's' : ''} assigned</p>
                    </div>
                </div>
                {classrooms.length > 4 && (
                    <div className="relative">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input type="text" placeholder="Search classes..." value={search}
                            onChange={(e) => { setSearch(e.target.value); setShowAll(false); }}
                            className="pl-9 pr-8 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none w-56" />
                        {search && (
                            <button onClick={() => setSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"><X size={14} /></button>
                        )}
                    </div>
                )}
            </div>

            {/* Classroom Cards */}
            {displayed.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 text-center border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50">
                    <div className="bg-white p-4 rounded-full shadow-sm mb-4"><Users className="h-8 w-8 text-slate-300" /></div>
                    <h3 className="text-lg font-semibold text-slate-900">{search ? 'No Matching Classes' : 'No Classes Assigned'}</h3>
                    <p className="text-slate-500 max-w-sm mt-2 text-sm">
                        {search ? `No classes match "${search}".` : 'You don\'t have any classrooms assigned yet.'}
                    </p>
                </div>
            ) : (
                <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {displayed.map((c) => {
                            const name = classroomDisplayName(c);
                            return (
                                <Link key={c.id} href={`/teacher/classrooms/${c.id}`}
                                    className="w-full text-left bg-white rounded-xl border border-slate-200/80 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all duration-200 p-5 group">
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold text-sm shrink-0">
                                                {c.section?.charAt(0)?.toUpperCase() || '?'}
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-slate-900 group-hover:text-indigo-700 transition-colors">{name}</h3>
                                                <p className="text-xs text-slate-500 mt-0.5">Section {c.section?.toUpperCase()}</p>
                                            </div>
                                        </div>
                                        <ChevronRight size={18} className="text-slate-300 group-hover:text-indigo-500 mt-1 transition-colors shrink-0" />
                                    </div>
                                        <div className="flex items-center gap-4 mt-4 pt-3 border-t border-slate-100">
                                            <div className="flex items-center gap-1.5 text-xs text-slate-500">
                                                <GraduationCap size={13} className="text-slate-400" />
                                                {c.activeStudents ?? c.studentCount ?? 0} Students
                                            </div>
                                        {c.capacity && (
                                            <div className="flex items-center gap-1.5 text-xs text-slate-500">
                                                Capacity: {c.capacity}
                                            </div>
                                        )}
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                    {!showAll && filtered.length > INITIAL_SHOW && (
                        <div className="flex justify-center">
                            <button onClick={() => setShowAll(true)}
                                className="px-6 py-2.5 text-sm font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors border border-indigo-200">
                                See All Classes ({filtered.length})
                            </button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
