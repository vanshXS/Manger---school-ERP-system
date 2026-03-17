import { BarChart3, CheckCircle2, Trophy, Users } from 'lucide-react';

export function TopStats({ gradingSheet, marks }) {
    if (!gradingSheet) return null;

    // Calculate live graded count from marks state if available
    const gradedCount = marks
        ? Object.values(marks).filter(v => v !== '' && v !== null && v !== undefined).length
        : gradingSheet.gradedCount;

    const total = gradingSheet.totalStudents;
    const pct = total > 0 ? Math.round((gradedCount / total) * 100) : 0;

    // Calculate average from current marks
    let avg = null;
    if (marks && gradedCount > 0) {
        const sum = Object.values(marks)
            .filter(v => v !== '' && v !== null && v !== undefined)
            .reduce((acc, v) => acc + parseFloat(v), 0);
        avg = Math.round((sum / gradedCount) * 100) / 100;
    }

    return (
        <div className="bg-white border-b border-slate-100 p-5 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
                <div>
                    <h2 className="text-xl font-bold text-slate-800">{gradingSheet.subjectName}</h2>
                    <p className="text-sm font-medium text-slate-500 mt-1">
                        {gradingSheet.examName} <span className="mx-2 text-slate-300">•</span> {gradingSheet.classroomName}
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Max Marks */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100/60 shadow-sm transition-all hover:shadow-md">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="p-1.5 bg-amber-100 text-amber-600 rounded-lg">
                            <Trophy size={16} />
                        </div>
                        <p className="text-xs text-slate-500 uppercase font-bold tracking-wider">Max Marks</p>
                    </div>
                    <p className="text-2xl font-bold text-slate-800 mt-1">{gradingSheet.maxMarks}</p>
                </div>

                {/* Graded */}
                <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100/50 shadow-sm transition-all hover:shadow-md">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="p-1.5 bg-blue-100 text-blue-600 rounded-lg">
                            <CheckCircle2 size={16} />
                        </div>
                        <p className="text-xs text-blue-600 uppercase font-bold tracking-wider">Graded</p>
                    </div>
                    <div className="flex items-baseline gap-1 mt-1">
                        <p className="text-2xl font-bold text-blue-800">{gradedCount}</p>
                        <span className="text-sm text-blue-500 font-semibold">/ {total}</span>
                    </div>
                    <div className="mt-3 h-1.5 bg-blue-100/50 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-500 rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
                    </div>
                </div>

                {/* Total Students */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100/60 shadow-sm transition-all hover:shadow-md">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="p-1.5 bg-purple-100 text-purple-600 rounded-lg">
                            <Users size={16} />
                        </div>
                        <p className="text-xs text-slate-500 uppercase font-bold tracking-wider">Students</p>
                    </div>
                    <p className="text-2xl font-bold text-slate-800 mt-1">{total}</p>
                </div>

                {/* Average */}
                <div className="bg-emerald-50/50 p-4 rounded-xl border border-emerald-100/50 shadow-sm transition-all hover:shadow-md">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="p-1.5 bg-emerald-100 text-emerald-600 rounded-lg">
                            <BarChart3 size={16} />
                        </div>
                        <p className="text-xs text-emerald-600 uppercase font-bold tracking-wider">Average</p>
                    </div>
                    <div className="flex items-baseline gap-1 mt-1">
                        <p className="text-2xl font-bold text-emerald-800">{avg !== null ? avg : '—'}</p>
                        {avg !== null && <span className="text-sm text-emerald-500 font-semibold">/ {gradingSheet.maxMarks}</span>}
                    </div>
                </div>
            </div>
        </div>
    );
}
