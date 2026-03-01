'use client';

import { CheckCircle2, ClipboardList, Clock, PlayCircle } from 'lucide-react';

function StatCard({ icon: Icon, label, value, color = 'text-slate-700', bg = 'bg-white' }) {
    return (
        <div className={`${bg} rounded-xl border border-slate-200 p-4 flex items-center gap-3 transition-shadow hover:shadow-sm`}>
            <div className="p-2 bg-white rounded-lg border border-slate-200 shadow-sm">
                <Icon className={`h-4 w-4 ${color}`} />
            </div>
            <div>
                <p className="text-xs text-slate-500 font-medium">{label}</p>
                <p className={`text-xl font-bold ${color}`}>{value ?? '—'}</p>
            </div>
        </div>
    );
}

export default function ExamStatsBar({ exams = [] }) {
    const stats = {
        total: exams.length,
        upcoming: exams.filter(e => e.status === 'Upcoming').length,
        ongoing: exams.filter(e => e.status === 'Ongoing').length,
        completed: exams.filter(e => e.status === 'Completed').length,
    };

    return (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <StatCard icon={ClipboardList} label="Total Exams" value={stats.total} color="text-slate-700" bg="bg-white" />
            <StatCard icon={Clock} label="Upcoming" value={stats.upcoming} color="text-blue-600" bg="bg-blue-50" />
            <StatCard icon={PlayCircle} label="Ongoing" value={stats.ongoing} color="text-emerald-600" bg="bg-emerald-50" />
            <StatCard icon={CheckCircle2} label="Completed" value={stats.completed} color="text-slate-600" bg="bg-slate-100" />
        </div>
    );
}
