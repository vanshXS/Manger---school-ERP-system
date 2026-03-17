'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem,
    DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table';
import {
    BookOpen, Calendar, CheckCircle2,
    ClipboardList,
    Clock, Edit, Eye,
    MoreHorizontal, PlayCircle, Plus, Trash2
} from 'lucide-react';
import { NEXT_STATUS, STATUS_CONFIG } from './examConstants';

function StatusBadge({ status }) {
    const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG['Upcoming'];
    return (
        <span className={`inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full border ${cfg.pill}`}>
            {status === 'Upcoming' && <Clock className="h-3 w-3" />}
            {status === 'Ongoing' && <PlayCircle className="h-3 w-3" />}
            {status === 'Completed' && <CheckCircle2 className="h-3 w-3" />}
            {cfg.label}
        </span>
    );
}

export default function ExamTable({
    exams = [], isLoading, onViewDetail, onEdit, onDelete, onStatusChange, onCreateFirst
}) {
    if (isLoading) {
        return (
            <Card className="border-slate-200 shadow-sm">
                <CardContent className="p-4 space-y-3">
                    {Array(5).fill(0).map((_, i) => (
                        <Skeleton key={i} className="h-14 w-full rounded-md" />
                    ))}
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="border-slate-200 shadow-sm">
            <CardHeader className="p-4 border-b border-slate-100">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-semibold text-slate-800">
                        All Exams
                        <span className="ml-2 text-xs font-normal text-slate-400">
                            ({exams.length} result{exams.length !== 1 ? 's' : ''})
                        </span>
                    </CardTitle>
                </div>
            </CardHeader>
            <CardContent className="p-0">
                {exams.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-slate-400">
                        <ClipboardList className="h-12 w-12 mb-3 opacity-30" />
                        <p className="font-semibold text-slate-500">No exams found</p>
                        <p className="text-xs mt-1">Create your first exam to get started.</p>
                        {onCreateFirst && (
                            <Button size="sm" className="mt-4 bg-indigo-600 hover:bg-indigo-700 text-xs" onClick={onCreateFirst}>
                                <Plus className="h-3.5 w-3.5 mr-1.5" /> Create First Exam
                            </Button>
                        )}
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader className="bg-slate-50">
                                <TableRow className="hover:bg-slate-50">
                                    <TableHead className="text-xs font-semibold text-slate-500 py-3 pl-4">Exam</TableHead>
                                    <TableHead className="text-xs font-semibold text-slate-500 py-3">Type</TableHead>
                                    <TableHead className="text-xs font-semibold text-slate-500 py-3">Classroom</TableHead>
                                    <TableHead className="text-xs font-semibold text-slate-500 py-3">Dates</TableHead>
                                    <TableHead className="text-xs font-semibold text-slate-500 py-3">Marks</TableHead>
                                    <TableHead className="text-xs font-semibold text-slate-500 py-3">Subjects</TableHead>
                                    <TableHead className="text-xs font-semibold text-slate-500 py-3">Status</TableHead>
                                    <TableHead className="text-xs font-semibold text-slate-500 py-3 pr-4 text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {exams.map(exam => {
                                    const transition = NEXT_STATUS[exam.status];
                                    return (
                                        <TableRow key={exam.id} className="hover:bg-slate-50/70 border-b border-slate-100">
                                            <TableCell className="py-3 pl-4">
                                                <div className="cursor-pointer" onClick={() => onViewDetail(exam)}>
                                                    <p className="font-semibold text-indigo-600 hover:text-indigo-800 text-sm underline decoration-dotted underline-offset-2">{exam.name}</p>
                                                    <p className="text-xs text-slate-400 mt-0.5">{exam.academicYearName}</p>
                                                </div>
                                            </TableCell>
                                            <TableCell className="py-3">
                                                <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                                                    <BookOpen className="h-3 w-3" />
                                                    {exam.examType}
                                                </span>
                                            </TableCell>
                                            <TableCell className="py-3">
                                                <span className="text-sm text-slate-700 font-medium">{exam.classroomName}</span>
                                            </TableCell>
                                            <TableCell className="py-3">
                                                <div className="flex items-center gap-1 text-xs text-slate-500">
                                                    <Calendar className="h-3.5 w-3.5 shrink-0" />
                                                    <span>{exam.startDate}</span>
                                                    <span className="text-slate-300 mx-0.5">→</span>
                                                    <span>{exam.endDate}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="py-3">
                                                <span className="text-sm font-semibold text-slate-700">{exam.totalMarks}</span>
                                            </TableCell>
                                            <TableCell className="py-3">
                                                <span
                                                    className="inline-flex items-center gap-1 text-xs font-medium text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100 cursor-pointer hover:bg-indigo-100"
                                                    onClick={() => onViewDetail(exam)}
                                                >
                                                    <BookOpen className="h-3 w-3" />
                                                    {exam.subjectCount ?? 0} papers
                                                </span>
                                            </TableCell>
                                            <TableCell className="py-3">
                                                <StatusBadge status={exam.status} />
                                            </TableCell>
                                            <TableCell className="py-3 pr-4 text-right">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon" className="h-8 w-8">
                                                            <MoreHorizontal className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end" className="w-48">
                                                        <DropdownMenuLabel className="text-xs text-slate-400">Actions</DropdownMenuLabel>
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem className="cursor-pointer text-sm" onClick={() => onViewDetail(exam)}>
                                                            <Eye className="h-4 w-4 mr-2 text-indigo-500" /> View Details
                                                        </DropdownMenuItem>
                                                        <DropdownMenuSeparator />
                                                        {transition && (
                                                            <>
                                                                <DropdownMenuItem
                                                                    className={`cursor-pointer text-sm ${transition.color}`}
                                                                    onClick={() => onStatusChange(exam)}
                                                                >
                                                                    <PlayCircle className="h-4 w-4 mr-2" />
                                                                    {transition.label}
                                                                </DropdownMenuItem>
                                                                <DropdownMenuSeparator />
                                                            </>
                                                        )}
                                                        {exam.status !== 'Completed' && (
                                                            <DropdownMenuItem className="cursor-pointer text-sm" onClick={() => onEdit(exam)}>
                                                                <Edit className="h-4 w-4 mr-2 text-slate-400" /> Edit
                                                            </DropdownMenuItem>
                                                        )}
                                                        {exam.status !== 'Completed' && (
                                                            <DropdownMenuItem
                                                                className="cursor-pointer text-sm text-red-600 focus:text-red-600 focus:bg-red-50"
                                                                onClick={() => onDelete(exam)}
                                                            >
                                                                <Trash2 className="h-4 w-4 mr-2" /> Delete
                                                            </DropdownMenuItem>
                                                        )}
                                                        {exam.status === 'Completed' && (
                                                            <DropdownMenuItem disabled className="text-xs text-slate-400">
                                                                <CheckCircle2 className="h-3.5 w-3.5 mr-2" /> Record Locked
                                                            </DropdownMenuItem>
                                                        )}
                                                        {exam.status === 'Upcoming' && (
                                                            <DropdownMenuItem disabled className="text-xs text-slate-400">
                                                                <Clock className="h-3.5 w-3.5 mr-2" /> Starts automatically on exam date
                                                            </DropdownMenuItem>
                                                        )}
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
