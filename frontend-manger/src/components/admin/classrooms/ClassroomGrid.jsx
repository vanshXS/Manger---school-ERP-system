'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ChevronRight, Users } from 'lucide-react';
import ClassroomActionsMenu from './ClassroomActionsMenu';
import { getEnrollmentBadge, getEnrollmentColor } from './ClassroomHelpers';

export function GridSkeleton() {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array(8).fill(0).map((_, i) => (
                <div key={i} className="bg-white border border-slate-200 rounded-xl p-4 animate-pulse space-y-3">
                    <div className="h-5 bg-slate-200 rounded w-2/3" />
                    <div className="h-3 bg-slate-100 rounded w-1/3" />
                    <div className="h-2 bg-slate-100 rounded w-full mt-4" />
                </div>
            ))}
        </div>
    );
}

export default function ClassroomGrid({
    classrooms,
    isLoading,
    onViewStudents,
    onViewSchedule,
    onEdit,
    onUpdateStatus,
    onDelete,
    EmptyState
}) {
    if (isLoading) return <GridSkeleton />;
    if (classrooms.length === 0) return <EmptyState />;

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {classrooms.map((classroom) => {
                const pct = classroom.capacity > 0 ? Math.min(100, (classroom.studentCount / classroom.capacity) * 100) : 0;
                const badge = getEnrollmentBadge(pct);
                return (
                    <Card key={classroom.id} className="group border-slate-200 hover:border-blue-300 hover:shadow-md transition-all duration-150">
                        <CardHeader className="pb-2 pt-4 px-4">
                            <div className="flex items-start justify-between gap-2">
                                <div>
                                    <CardTitle className="text-base font-bold text-slate-800 leading-tight">
                                        {classroom.gradeLevel} – {classroom.section}
                                    </CardTitle>
                                    <p className="text-[11px] text-slate-400 font-mono mt-0.5">#{classroom.id}</p>
                                </div>
                                <ClassroomActionsMenu
                                    classroom={classroom}
                                    onViewStudents={onViewStudents}
                                    onViewSchedule={onViewSchedule}
                                    onEdit={onEdit}
                                    onUpdateStatus={onUpdateStatus}
                                    onDelete={onDelete}
                                />
                            </div>
                        </CardHeader>
                        <CardContent className="px-4 pb-3 space-y-2">
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-slate-500 flex items-center gap-1">
                                    <Users className="h-3.5 w-3.5" /> Enrollment
                                </span>
                                <span className="font-semibold text-slate-700">
                                    {classroom.studentCount} / {classroom.capacity}
                                </span>
                            </div>
                            <Progress
                                value={pct}
                                className="h-1.5 bg-slate-100"
                                indicatorClassName={getEnrollmentColor(pct)}
                            />
                        </CardContent>
                        <CardFooter className="px-4 pb-3 pt-0 flex items-center justify-between">
                            <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full border ${badge.color}`}>
                                {badge.label}
                            </span>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 text-xs text-slate-500 hover:text-blue-600 px-2"
                                onClick={() => onViewStudents(classroom)}
                            >
                                Students <ChevronRight className="h-3 w-3 ml-1" />
                            </Button>
                        </CardFooter>
                    </Card>
                );
            })}
        </div>
    );
}
