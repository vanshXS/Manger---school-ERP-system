'use client';

import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Archive, ArchiveRestore, CalendarDays, Edit, MoreHorizontal, Trash2, Users } from 'lucide-react';

export default function ClassroomActionsMenu({
    classroom,
    onViewStudents,
    onViewSchedule,
    onEdit,
    onUpdateStatus,
    onDelete
}) {
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400 hover:text-slate-700">
                    <MoreHorizontal className="h-4 w-4" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
                <DropdownMenuLabel className="text-xs text-slate-500">Actions</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => onViewStudents(classroom)}>
                    <Users className="mr-2 h-4 w-4" /> View Students
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onViewSchedule(classroom)}>
                    <CalendarDays className="mr-2 h-4 w-4" /> View Schedule
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onEdit(classroom)}>
                    <Edit className="mr-2 h-4 w-4" /> Edit
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                {classroom.status === 'ACTIVE' && (
                    <DropdownMenuItem onClick={() => onUpdateStatus(classroom.id, 'ARCHIVED')} className="text-amber-600">
                        <Archive className="mr-2 h-4 w-4" /> Archive
                    </DropdownMenuItem>
                )}
                {classroom.status === 'ARCHIVED' && (
                    <>
                        <DropdownMenuItem onClick={() => onUpdateStatus(classroom.id, 'ACTIVE')} className="text-emerald-600">
                            <ArchiveRestore className="mr-2 h-4 w-4" /> Activate
                        </DropdownMenuItem>
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-red-600">
                                    <Trash2 className="mr-2 h-4 w-4" /> Delete
                                </DropdownMenuItem>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Delete Classroom?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        Permanently delete <strong>{classroom.gradeLevel} - {classroom.section}</strong>?
                                        This cannot be undone. Classrooms with historical data cannot be deleted — archive them instead.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction className="bg-red-600 hover:bg-red-700" onClick={() => onDelete(classroom.id)}>
                                        Confirm Delete
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </>
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
