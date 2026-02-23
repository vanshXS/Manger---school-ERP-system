'use client';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { classroomDisplayName } from '@/lib/classroomDisplayName';
import { CheckCircle2, Loader2, Search, UserX } from 'lucide-react';

export default function TeacherAssignmentDialog({
    isOpen,
    onOpenChange,
    editingAssignment,
    selectedClassroom,
    teachers,
    teacherSearch,
    setTeacherSearch,
    selectedTeacherId,
    setSelectedTeacherId,
    submitting,
    handleAssignTeacher,
    handleRemoveTeacher
}) {
    const filteredTeachers = teachers.filter(t =>
        `${t.firstName} ${t.lastName}`.toLowerCase().includes(teacherSearch.toLowerCase())
    );

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-sm">
                <DialogHeader>
                    <DialogTitle className="text-base">Assign Teacher</DialogTitle>
                    <DialogDescription className="text-sm">
                        Selecting teacher for{' '}
                        <span className="font-semibold text-slate-800">{editingAssignment?.subjectName}</span>
                        {' '}in{' '}
                        <span className="font-semibold text-slate-800">{selectedClassroom ? classroomDisplayName(selectedClassroom) : ''}</span>
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-3 py-1">
                    <div className="relative">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                        <Input
                            placeholder="Search teacher…"
                            className="pl-8 h-8 text-sm"
                            value={teacherSearch}
                            onChange={e => setTeacherSearch(e.target.value)}
                            autoFocus
                        />
                    </div>

                    <ScrollArea className="h-52 border border-slate-200 rounded-lg bg-slate-50">
                        <div className="p-1.5 space-y-0.5">
                            {filteredTeachers.length === 0 ? (
                                <p className="text-center text-xs text-slate-400 py-8">No teachers found</p>
                            ) : (
                                filteredTeachers.map(t => {
                                    const isSelected = selectedTeacherId === t.id;
                                    return (
                                        <button
                                            key={t.id}
                                            onClick={() => setSelectedTeacherId(t.id)}
                                            className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm rounded-md transition-colors
                        ${isSelected ? 'bg-blue-600 text-white' : 'text-slate-700 hover:bg-white hover:shadow-sm'}`}
                                        >
                                            <div className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0
                        ${isSelected ? 'bg-white text-blue-600' : 'bg-slate-200 text-slate-600'}`}>
                                                {t.firstName?.charAt(0) ?? '?'}
                                            </div>
                                            <span className="flex-1 text-left truncate">{t.firstName} {t.lastName}</span>
                                            {isSelected && <CheckCircle2 className="h-4 w-4 shrink-0 opacity-80" />}
                                        </button>
                                    );
                                })
                            )}
                        </div>
                    </ScrollArea>

                    {selectedTeacherId && (
                        <p className="text-xs text-center text-slate-500">
                            Selected: <span className="font-medium text-slate-700">
                                {teachers.find(t => t.id === selectedTeacherId)
                                    ? `${teachers.find(t => t.id === selectedTeacherId).firstName} ${teachers.find(t => t.id === selectedTeacherId).lastName}`
                                    : '—'}
                            </span>
                        </p>
                    )}
                </div>

                <Separator />

                <DialogFooter className="flex items-center justify-between sm:justify-between gap-2 pt-0">
                    <div>
                        {editingAssignment?.teacherId && (
                            <Button
                                variant="ghost"
                                size="sm"
                                className="text-red-600 hover:text-red-700 hover:bg-red-50 h-8"
                                onClick={handleRemoveTeacher}
                                disabled={submitting}
                            >
                                <UserX className="h-3.5 w-3.5 mr-1.5" /> Unassign
                            </Button>
                        )}
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => onOpenChange(false)} className="h-8">
                            Cancel
                        </Button>
                        <Button size="sm" onClick={handleAssignTeacher} disabled={submitting || !selectedTeacherId} className="h-8">
                            {submitting && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
                            Confirm
                        </Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
