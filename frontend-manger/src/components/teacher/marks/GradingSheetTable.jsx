import { Mail, Search, X } from 'lucide-react';
import { useState } from 'react';

export function GradingSheetTable({
    gradingSheet,
    marks,
    handleMarkChange,
    onSendMarksheet,
    sendingId,
    marksEditable = false,
    marksheetAllowed = false
}) {
    const [search, setSearch] = useState('');

    if (!gradingSheet) return null;

    const students = gradingSheet.students.filter((student) => {
        if (!search.trim()) return true;
        const q = search.toLowerCase();
        return student.studentName.toLowerCase().includes(q) || (student.rollNo || '').toLowerCase().includes(q);
    });

    return (
        <div className="overflow-x-auto max-h-[600px] border-b border-slate-200 rounded-b-xl shadow-sm">
            {gradingSheet.students.length > 5 && (
                <div className="px-5 py-4 border-b border-slate-200 bg-slate-50/50">
                    <div className="relative max-w-sm">
                        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search by student name or roll no..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-10 pr-10 py-2.5 text-sm font-medium border border-slate-300 rounded-xl bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none w-full shadow-sm transition-all"
                        />
                        {search && (
                            <button
                                onClick={() => setSearch('')}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 bg-slate-100 rounded-full p-1 transition-colors"
                            >
                                <X size={14} />
                            </button>
                        )}
                    </div>
                </div>
            )}

            <table className="w-full text-left whitespace-nowrap border-collapse">
                <thead className="sticky top-0 z-10 bg-slate-100 shadow-sm ring-1 ring-slate-200 ring-inset">
                    <tr className="text-slate-600 text-xs font-bold uppercase tracking-widest">
                        <th className="px-4 sm:px-6 py-4 text-center w-24">Roll No</th>
                        <th className="px-4 sm:px-6 py-4">Student Details</th>
                        <th className="px-4 sm:px-6 py-4 text-center w-48">Marks Obtained</th>
                        <th className="px-4 sm:px-6 py-4 text-center w-28">Grade</th>
                        <th className="px-4 sm:px-6 py-4 text-center w-32">Action</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                    {students.map((student) => {
                        const val = marks[student.enrollmentId];
                        const isGraded = val !== '' && val !== null && val !== undefined;
                        const grade = isGraded ? computeGrade(parseFloat(val), gradingSheet.maxMarks) : null;

                        return (
                            <tr
                                key={student.enrollmentId}
                                className={`transition-all hover:bg-slate-50 ${isGraded ? 'bg-emerald-50/10' : ''}`}
                            >
                                <td className="px-4 sm:px-6 py-4 text-center">
                                    <span className="inline-flex items-center justify-center min-w-[3rem] px-2 py-1 bg-slate-100 text-slate-600 text-xs font-mono font-bold rounded-md border border-slate-200/60 shadow-sm">
                                        {student.rollNo || '-'}
                                    </span>
                                </td>
                                <td className="px-4 sm:px-6 py-4">
                                    <div className="flex items-center gap-3.5">
                                        <div className="w-9 h-9 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-sm shrink-0 border border-indigo-100 shadow-sm">
                                            {student.studentName.charAt(0)}
                                        </div>
                                        <div>
                                            <p className="font-bold text-slate-800 text-sm">{student.studentName}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-4 sm:px-6 py-4">
                                    <div className="flex items-center justify-center gap-2">
                                        <input
                                            type="number"
                                            min="0"
                                            max={gradingSheet.maxMarks}
                                            step="0.5"
                                            disabled={!marksEditable}
                                            className={`w-20 text-center px-2 py-2 text-sm border-2 rounded-lg outline-none font-bold shadow-sm transition-all ${isGraded
                                                ? 'border-emerald-400 bg-emerald-50 text-emerald-800 focus:ring-4 focus:ring-emerald-500/20'
                                                : 'border-slate-300 bg-white text-slate-800 focus:border-blue-500 focus:bg-blue-50/30 focus:ring-4 focus:ring-blue-500/20 hover:border-slate-400'
                                                } ${val > gradingSheet.maxMarks ? 'border-red-400 text-red-600 bg-red-50 focus:ring-red-500/20 focus:border-red-500' : ''} disabled:bg-slate-100 disabled:text-slate-400 disabled:border-slate-200 disabled:cursor-not-allowed`}
                                            value={val !== undefined ? val : ''}
                                            onChange={(e) => handleMarkChange(student.enrollmentId, e.target.value)}
                                            placeholder="-"
                                        />
                                        <span className="text-slate-400 font-bold text-sm min-w-[3rem] text-left">
                                            / {gradingSheet.maxMarks}
                                        </span>
                                    </div>
                                </td>
                                <td className="px-4 sm:px-6 py-4 text-center">
                                    {grade ? (
                                        <span className={`inline-flex items-center justify-center min-w-[2.5rem] px-2 py-1 text-xs font-black rounded-md border shadow-sm ${gradeColor(grade)}`}>
                                            {grade}
                                        </span>
                                    ) : (
                                        <span className="text-slate-300 text-sm font-bold">-</span>
                                    )}
                                </td>
                                <td className="px-4 sm:px-6 py-4 text-center">
                                    <button
                                        onClick={() => onSendMarksheet?.(student.enrollmentId)}
                                        disabled={
                                            !marksheetAllowed ||
                                            sendingId === student.enrollmentId ||
                                            student.marksObtained === null
                                        }
                                        title={
                                            !marksheetAllowed
                                                ? 'Marksheets can be sent only after the exam is completed'
                                                : student.marksObtained === null
                                                    ? 'Save marks first'
                                                    : 'Send marksheet via email'
                                        }
                                        className="inline-flex items-center justify-center gap-1.5 w-full max-w-[80px] mx-auto px-3 py-1.5 text-xs font-bold rounded-lg bg-violet-50 text-violet-700 hover:bg-violet-100 hover:shadow-sm hover:border-violet-300 border border-violet-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
                                    >
                                        {sendingId === student.enrollmentId ? (
                                            <div className="w-3.5 h-3.5 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
                                        ) : (
                                            <Mail size={14} className="group-hover:scale-110 transition-transform" />
                                        )}
                                        <span className="hidden sm:inline">Send</span>
                                    </button>
                                </td>
                            </tr>
                        );
                    })}

                    {students.length === 0 && (
                        <tr>
                            <td colSpan="5" className="px-6 py-16 text-center">
                                <span className="inline-block p-3 rounded-full bg-slate-50 mb-3">
                                    <Search className="w-6 h-6 text-slate-300" />
                                </span>
                                <p className="text-slate-500 font-medium">
                                    {search ? `No students match "${search}"` : 'No students found in this classroom.'}
                                </p>
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
}

function computeGrade(obtained, max) {
    if (obtained === null || obtained === undefined || max === null || max === undefined || max === 0) {
        return null;
    }
    const pct = (obtained / max) * 100;
    if (pct >= 90) return 'A+';
    if (pct >= 80) return 'A';
    if (pct >= 70) return 'B';
    if (pct >= 60) return 'C';
    if (pct >= 40) return 'D';
    return 'F';
}

function gradeColor(grade) {
    const colors = {
        'A+': 'bg-emerald-50 text-emerald-700 border-emerald-200',
        A: 'bg-green-50 text-green-700 border-green-200',
        B: 'bg-blue-50 text-blue-700 border-blue-200',
        C: 'bg-amber-50 text-amber-700 border-amber-200',
        D: 'bg-orange-50 text-orange-700 border-orange-200',
        F: 'bg-red-50 text-red-700 border-red-200'
    };
    return colors[grade] || 'bg-slate-50 text-slate-600 border-slate-200';
}
