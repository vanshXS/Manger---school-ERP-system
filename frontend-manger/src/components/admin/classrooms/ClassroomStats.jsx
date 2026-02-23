'use client';

import { Building2, GraduationCap, Users, XCircle } from 'lucide-react';

export default function ClassroomStats({ activeClassrooms }) {
    const totalStudents = activeClassrooms.reduce((s, c) => s + c.studentCount, 0);
    const totalCapacity = activeClassrooms.reduce((s, c) => s + c.capacity, 0);
    const fullClasses = activeClassrooms.filter(c => c.studentCount >= c.capacity).length;

    const stats = [
        { label: 'Active Classes', value: activeClassrooms.length, icon: Building2, color: 'text-blue-600', bg: 'bg-blue-50' },
        { label: 'Total Students', value: totalStudents, icon: Users, color: 'text-violet-600', bg: 'bg-violet-50' },
        { label: 'Total Capacity', value: totalCapacity, icon: GraduationCap, color: 'text-emerald-600', bg: 'bg-emerald-50' },
        { label: 'Full Classes', value: fullClasses, icon: XCircle, color: 'text-red-600', bg: 'bg-red-50' },
    ];

    return (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {stats.map(({ label, value, icon: Icon, color, bg }) => (
                <div key={label} className="bg-white border border-slate-200 rounded-xl p-4 flex items-center gap-3 shadow-sm">
                    <div className={`${bg} p-2 rounded-lg`}>
                        <Icon className={`h-4 w-4 ${color}`} />
                    </div>
                    <div>
                        <p className="text-2xl font-bold text-slate-800 leading-none">{value}</p>
                        <p className="text-xs text-slate-500 mt-1">{label}</p>
                    </div>
                </div>
            ))}
        </div>
    );
}
