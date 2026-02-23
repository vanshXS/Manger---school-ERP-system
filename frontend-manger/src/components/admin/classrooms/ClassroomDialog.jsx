'use client';

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import React from 'react';
import { Controller, useForm } from 'react-hook-form';
import * as z from 'zod';

const GRADE_LEVELS = [
    { value: 'Nursery', label: 'Nursery' },
    { value: 'LKG', label: 'LKG' },
    { value: 'UKG', label: 'UKG' },
    { value: 'Grade 1', label: 'Grade 1' },
    { value: 'Grade 2', label: 'Grade 2' },
    { value: 'Grade 3', label: 'Grade 3' },
    { value: 'Grade 4', label: 'Grade 4' },
    { value: 'Grade 5', label: 'Grade 5' },
    { value: 'Grade 6', label: 'Grade 6' },
    { value: 'Grade 7', label: 'Grade 7' },
    { value: 'Grade 8', label: 'Grade 8' },
    { value: 'Grade 9', label: 'Grade 9' },
    { value: 'Grade 10', label: 'Grade 10' },
    { value: 'Grade 11', label: 'Grade 11' },
    { value: 'Grade 12', label: 'Grade 12' },
];

const classroomSchema = z.object({
    gradeLevel: z.string().min(1, { message: "Grade level is required." }),
    section: z.string()
        .min(1, { message: "Section is required." })
        .max(10, { message: "Section too long." })
        .regex(/^[a-zA-Z0-9\s-]+$/, { message: "Letters, numbers, or dashes only." }),
    capacity: z.coerce
        .number({ invalid_type_error: "Must be a number." })
        .int()
        .min(1, { message: "At least 1." })
        .max(200, { message: "Cannot exceed 200." }),
});

export default function ClassroomDialog({
    isOpen,
    onOpenChange,
    classroom,
    onSubmit,
    isSubmitting
}) {
    const { register, handleSubmit, reset, control, formState: { errors } } = useForm({
        resolver: zodResolver(classroomSchema),
        defaultValues: classroom ? {
            gradeLevel: classroom.gradeLevel,
            section: classroom.section,
            capacity: classroom.capacity
        } : { gradeLevel: '', section: '', capacity: 30 },
    });

    React.useEffect(() => {
        if (classroom) {
            reset({
                gradeLevel: classroom.gradeLevel,
                section: classroom.section,
                capacity: classroom.capacity
            });
        } else {
            reset({ gradeLevel: '', section: '', capacity: 30 });
        }
    }, [classroom, reset]);

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="text-lg font-bold text-slate-800">
                        {classroom ? 'Edit Classroom' : 'New Classroom'}
                    </DialogTitle>
                    <DialogDescription>
                        {classroom
                            ? `Editing ${classroom.gradeLevel} - ${classroom.section}`
                            : 'Fill in the details to create a new classroom.'}
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit(onSubmit)}>
                    <div className="grid gap-4 py-4">
                        <div className="space-y-1.5">
                            <Label className="text-slate-700 text-sm">Grade Level</Label>
                            <Controller
                                name="gradeLevel"
                                control={control}
                                render={({ field }) => (
                                    <Select value={field.value} onValueChange={field.onChange}>
                                        <SelectTrigger className={errors.gradeLevel ? 'border-red-500' : ''}>
                                            <SelectValue placeholder="Select grade…" />
                                        </SelectTrigger>
                                        <SelectContent className="max-h-64">
                                            {GRADE_LEVELS.map((g) => (
                                                <SelectItem key={g.value} value={g.value}>{g.label}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                )}
                            />
                            {errors.gradeLevel && <p className="text-xs text-red-500">{errors.gradeLevel.message}</p>}
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <Label className="text-slate-700 text-sm">Section</Label>
                                <Input
                                    {...register('section')}
                                    placeholder="e.g. A"
                                    className={errors.section ? 'border-red-500' : ''}
                                />
                                {errors.section && <p className="text-xs text-red-500">{errors.section.message}</p>}
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-slate-700 text-sm">Capacity</Label>
                                <Input
                                    type="number"
                                    {...register('capacity')}
                                    placeholder="30"
                                    className={errors.capacity ? 'border-red-500' : ''}
                                />
                                {errors.capacity && <p className="text-xs text-red-500">{errors.capacity.message}</p>}
                            </div>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                        <Button type="submit" disabled={isSubmitting} className="bg-blue-600 hover:bg-blue-700">
                            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {classroom ? 'Save Changes' : 'Create'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
