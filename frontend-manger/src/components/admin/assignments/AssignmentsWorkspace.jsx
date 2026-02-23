'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { classroomDisplayName } from '@/lib/classroomDisplayName';
import { BookOpen, Building2, CheckCircle2, ChevronRight, Edit, Filter, GraduationCap, LayoutList, Loader2, Search, User, Users, X } from 'lucide-react';

export function AssignmentsSkeleton() {
    return (
        <Card className="border-slate-200 shadow-sm">
            <CardContent className="p-6 space-y-3">
                {Array(5).fill(0).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
            </CardContent>
        </Card>
    );
}

export default function AssignmentsWorkspace({
    selectedClassroom,
    assignments,
    subjects,
    loading,
    busySubjectId,
    showOnlyAssigned,
    setShowOnlyAssigned,
    subjectSearch,
    setSubjectSearch,
    handleToggleSubject,
    handleToggleMandatory,
    openTeacherDialog
}) {
    if (!selectedClassroom) {
        return (
            <Card className="border-slate-200 shadow-sm">
                <CardContent className="flex flex-col items-center justify-center py-24 text-slate-400">
                    <Building2 className="h-12 w-12 mb-4 text-slate-200" />
                    <p className="text-base font-medium text-slate-500">Select a classroom to begin</p>
                    <p className="text-sm text-slate-400 mt-1">Choose from the list on the left</p>
                </CardContent>
            </Card>
        );
    }

    const assignedCount = assignments.length;
    const unassignedTeacherCount = assignments.filter(a => !a.teacherId).length;

    const filteredSubjects = subjects.filter(s => {
        let matches = true;
        if (showOnlyAssigned) {
            matches = assignments.some(a => a.subjectId === s.id);
        }
        if (matches && subjectSearch.trim()) {
            const q = subjectSearch.toLowerCase();
            matches = s.name.toLowerCase().includes(q) || s.code.toLowerCase().includes(q);
        }
        return matches;
    });

    return (
        <div className="space-y-4">
            {/* Context Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white border border-slate-200 rounded-xl px-4 py-3 shadow-sm">
                <div>
                    <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
                        <GraduationCap className="h-4 w-4 text-blue-600" />
                        {classroomDisplayName(selectedClassroom)}
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                        Capacity: {selectedClassroom.capacity} · {selectedClassroom.studentCount ?? 0} enrolled
                    </p>
                </div>
                <div className="flex items-center gap-3 text-xs">
                    <div className="flex items-center gap-1.5 bg-blue-50 text-blue-700 border border-blue-200 px-2.5 py-1 rounded-full">
                        <BookOpen className="h-3 w-3" />
                        {assignedCount} subjects
                    </div>
                    {unassignedTeacherCount > 0 && (
                        <div className="flex items-center gap-1.5 bg-amber-50 text-amber-700 border border-amber-200 px-2.5 py-1 rounded-full">
                            <User className="h-3 w-3" />
                            {unassignedTeacherCount} unassigned
                        </div>
                    )}
                </div>
            </div>

            {loading ? (
                <AssignmentsSkeleton />
            ) : (
                <>
                    {/* ── SECTION 1: Subject Selection ──────────────────── */}
                    <Card className="border-slate-200 shadow-sm">
                        <CardHeader className="pb-3 pt-4 px-4 border-b border-slate-100">
                            <div className="flex items-center justify-between gap-3 flex-wrap">
                                <CardTitle className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                                    <BookOpen className="h-4 w-4 text-blue-500" />
                                    Subjects
                                    <span className="text-xs font-normal text-slate-400 ml-1">
                                        {assignedCount} of {subjects.length} assigned
                                    </span>
                                </CardTitle>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => setShowOnlyAssigned(!showOnlyAssigned)}
                                        className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border transition-colors
                      ${showOnlyAssigned
                                                ? 'bg-blue-600 text-white border-blue-600'
                                                : 'text-slate-600 border-slate-200 hover:border-slate-300 bg-white'}`}
                                    >
                                        <Filter className="h-3 w-3" />
                                        Assigned only
                                    </button>
                                    <div className="relative">
                                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                                        <Input
                                            placeholder="Search subjects…"
                                            value={subjectSearch}
                                            onChange={e => setSubjectSearch(e.target.value)}
                                            className="pl-8 h-7 text-sm w-44 bg-slate-50"
                                        />
                                        {subjectSearch && (
                                            <button onClick={() => setSubjectSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2">
                                                <X className="h-3 w-3 text-slate-400 hover:text-slate-600" />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </CardHeader>

                        <CardContent className="p-3">
                            {filteredSubjects.length === 0 ? (
                                <p className="text-center text-sm text-slate-400 py-8">No subjects match your filter.</p>
                            ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-2">
                                    {filteredSubjects.map(subject => {
                                        const assignment = assignments.find(a => a.subjectId === subject.id);
                                        const isBusy = busySubjectId === subject.id;

                                        return (
                                            <div
                                                key={subject.id}
                                                className={`flex flex-col p-3 rounded-lg border transition-all duration-150
                          ${assignment
                                                        ? 'bg-white border-blue-200 shadow-sm'
                                                        : 'bg-slate-50 border-slate-200 hover:bg-white hover:border-slate-300'}`}
                                            >
                                                <div className="flex items-start justify-between gap-2">
                                                    <div className="min-w-0">
                                                        <p className={`font-semibold text-sm truncate ${assignment ? 'text-blue-700' : 'text-slate-700'}`}>
                                                            {subject.name}
                                                        </p>
                                                        <p className="text-[11px] text-slate-400 font-mono">{subject.code}</p>
                                                    </div>
                                                    <button
                                                        onClick={() => handleToggleSubject(subject)}
                                                        disabled={isBusy}
                                                        title={assignment ? 'Remove subject' : 'Add subject'}
                                                        className={`shrink-0 h-7 w-7 rounded-full flex items-center justify-center border transition-all
                              ${assignment
                                                                ? 'bg-blue-50 border-blue-200 text-blue-600 hover:bg-red-50 hover:border-red-200 hover:text-red-500'
                                                                : 'bg-white border-slate-200 text-slate-400 hover:border-blue-300 hover:text-blue-500'}`}
                                                    >
                                                        {isBusy
                                                            ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                                            : assignment
                                                                ? <CheckCircle2 className="h-3.5 w-3.5" />
                                                                : <ChevronRight className="h-3.5 w-3.5" />}
                                                    </button>
                                                </div>

                                                {assignment && (
                                                    <div className="mt-2 pt-2 border-t border-slate-100 flex items-center gap-2">
                                                        <Checkbox
                                                            checked={assignment.mandatory}
                                                            onCheckedChange={val => handleToggleMandatory(assignment, val)}
                                                            className="h-3.5 w-3.5"
                                                            id={`mandatory-${assignment.assignmentId}`}
                                                        />
                                                        <label
                                                            htmlFor={`mandatory-${assignment.assignmentId}`}
                                                            className={`text-xs font-medium cursor-pointer ${assignment.mandatory ? 'text-red-600' : 'text-slate-400'}`}
                                                        >
                                                            Mandatory
                                                        </label>
                                                        {assignment.teacherName && (
                                                            <span className="ml-auto text-[11px] text-slate-400 truncate max-w-[80px]">
                                                                {assignment.teacherName}
                                                            </span>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* ── SECTION 2: Faculty Assignments Table ──────────── */}
                    <Card className="border-slate-200 shadow-sm">
                        <CardHeader className="pb-3 pt-4 px-4 border-b border-slate-100">
                            <CardTitle className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                                <Users className="h-4 w-4 text-violet-500" />
                                Faculty Assignments
                                {unassignedTeacherCount > 0 && (
                                    <span className="ml-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                                        {unassignedTeacherCount} need teacher
                                    </span>
                                )}
                            </CardTitle>
                        </CardHeader>

                        {assignments.length === 0 ? (
                            <CardContent className="py-12 text-center">
                                <LayoutList className="h-8 w-8 text-slate-200 mx-auto mb-3" />
                                <p className="text-sm text-slate-400">No subjects assigned yet. Add subjects above.</p>
                            </CardContent>
                        ) : (
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="bg-slate-50 hover:bg-slate-50">
                                            <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Subject</TableHead>
                                            <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Type</TableHead>
                                            <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Assigned Teacher</TableHead>
                                            <TableHead className="text-right text-xs font-semibold text-slate-500 uppercase tracking-wide">Action</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {assignments.map(a => (
                                            <TableRow key={a.assignmentId} className="hover:bg-slate-50/50">
                                                <TableCell className="font-medium text-slate-800 text-sm">{a.subjectName}</TableCell>
                                                <TableCell>
                                                    {a.mandatory ? (
                                                        <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-red-50 text-red-600 border border-red-200">
                                                            Required
                                                        </span>
                                                    ) : (
                                                        <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">
                                                            Optional
                                                        </span>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    {a.teacherId ? (
                                                        <div className="flex items-center gap-2">
                                                            <div className="h-6 w-6 rounded-full bg-violet-100 text-violet-700 flex items-center justify-center text-xs font-bold shrink-0">
                                                                {a.teacherName?.charAt(0) ?? '?'}
                                                            </div>
                                                            <span className="text-sm text-slate-700">{a.teacherName}</span>
                                                        </div>
                                                    ) : (
                                                        <span className="text-xs text-amber-600 flex items-center gap-1">
                                                            <User className="h-3 w-3" /> Not assigned
                                                        </span>
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        className="h-7 text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                                        onClick={() => openTeacherDialog(a)}
                                                    >
                                                        {a.teacherId
                                                            ? <><Edit className="h-3 w-3 mr-1" /> Change</>
                                                            : <><User className="h-3 w-3 mr-1" /> Assign</>}
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        )}
                    </Card>
                </>
            )}
        </div>
    );
}
