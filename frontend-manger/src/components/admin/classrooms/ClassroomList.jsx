'use client';

import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import ClassroomActionsMenu from './ClassroomActionsMenu';
import { getEnrollmentBadge, getEnrollmentColor } from './ClassroomHelpers';

export function ListSkeleton() {
    return (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            {Array(6).fill(0).map((_, i) => (
                <div key={i} className="flex items-center gap-4 px-4 py-3 border-b border-slate-100 animate-pulse">
                    <div className="h-4 bg-slate-200 rounded w-8" />
                    <div className="h-4 bg-slate-200 rounded w-32" />
                    <div className="h-4 bg-slate-100 rounded w-16 ml-auto" />
                </div>
            ))}
        </div>
    );
}

export default function ClassroomList({
    classrooms,
    isLoading,
    onViewStudents,
    onViewSchedule,
    onEdit,
    onUpdateStatus,
    onDelete,
    EmptyState
}) {
    if (isLoading) return <ListSkeleton />;
    if (classrooms.length === 0) return <EmptyState />;

    return (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
            <Table>
                <TableHeader>
                    <TableRow className="bg-slate-50 hover:bg-slate-50">
                        <TableHead className="font-semibold text-slate-600 text-xs uppercase tracking-wide w-12">#</TableHead>
                        <TableHead className="font-semibold text-slate-600 text-xs uppercase tracking-wide">Classroom</TableHead>
                        <TableHead className="font-semibold text-slate-600 text-xs uppercase tracking-wide">Enrollment</TableHead>
                        <TableHead className="font-semibold text-slate-600 text-xs uppercase tracking-wide hidden md:table-cell">Progress</TableHead>
                        <TableHead className="font-semibold text-slate-600 text-xs uppercase tracking-wide">Status</TableHead>
                        <TableHead className="text-right font-semibold text-slate-600 text-xs uppercase tracking-wide">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {classrooms.map((classroom) => {
                        const pct = classroom.capacity > 0 ? Math.min(100, (classroom.studentCount / classroom.capacity) * 100) : 0;
                        const badge = getEnrollmentBadge(pct);
                        return (
                            <TableRow key={classroom.id} className="hover:bg-slate-50/50 group">
                                <TableCell className="text-xs text-slate-400 font-mono">{classroom.id}</TableCell>
                                <TableCell>
                                    <div>
                                        <p className="font-semibold text-slate-800 text-sm">{classroom.gradeLevel} – {classroom.section}</p>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <span className="text-sm font-medium text-slate-700">
                                        {classroom.studentCount} / {classroom.capacity}
                                    </span>
                                </TableCell>
                                <TableCell className="hidden md:table-cell w-32">
                                    <Progress value={pct} className="h-1.5 bg-slate-100" indicatorClassName={getEnrollmentColor(pct)} />
                                </TableCell>
                                <TableCell>
                                    <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full border ${badge.color}`}>
                                        {badge.label}
                                    </span>
                                </TableCell>
                                <TableCell className="text-right">
                                    <ClassroomActionsMenu
                                        classroom={classroom}
                                        onViewStudents={onViewStudents}
                                        onViewSchedule={onViewSchedule}
                                        onEdit={onEdit}
                                        onUpdateStatus={onUpdateStatus}
                                        onDelete={onDelete}
                                    />
                                </TableCell>
                            </TableRow>
                        );
                    })}
                </TableBody>
            </Table>
        </div>
    );
}
