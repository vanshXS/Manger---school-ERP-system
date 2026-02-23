'use client';

import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Loader2, Users } from 'lucide-react';

export default function ClassroomDetailsSheet({
    isOpen,
    onOpenChange,
    classroom,
    students,
    isLoading
}) {
    return (
        <Sheet open={isOpen} onOpenChange={onOpenChange}>
            <SheetContent className="w-full sm:w-[500px] pt-8">
                <SheetHeader className="mb-4">
                    <SheetTitle className="text-xl font-bold flex items-center gap-2">
                        <Users className="h-5 w-5 text-blue-600" />
                        {classroom ? `${classroom.gradeLevel} – ${classroom.section}` : 'Students'}
                    </SheetTitle>
                    <SheetDescription>
                        Student roster — {students.length} enrolled
                    </SheetDescription>
                </SheetHeader>
                <Separator />
                <ScrollArea className="h-[calc(100vh-160px)] pr-4 mt-4">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                            <Loader2 className="animate-spin h-6 w-6 mb-2" />
                            <span className="text-sm">Loading roster…</span>
                        </div>
                    ) : students.length > 0 ? (
                        <ul className="space-y-2">
                            {students.map((student, i) => (
                                <li key={student.id} className="flex items-center gap-3 p-2.5 bg-slate-50 border border-slate-100 rounded-lg hover:border-blue-200 transition-colors">
                                    <span className="text-xs text-slate-400 w-5 text-right">{i + 1}</span>
                                    <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 text-xs font-bold shrink-0">
                                        {student.firstName[0]}{student.lastName[0]}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium text-slate-800 text-sm truncate">{student.firstName} {student.lastName}</p>
                                        <p className="text-xs text-slate-500 font-mono">Roll: {student.rollNo}</p>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <div className="text-center py-16">
                            <Users className="h-10 w-10 text-slate-200 mx-auto mb-3" />
                            <p className="text-sm text-slate-400">No students enrolled yet.</p>
                        </div>
                    )}
                </ScrollArea>
            </SheetContent>
        </Sheet>
    );
}
