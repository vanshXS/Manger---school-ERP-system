'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import toast from 'react-hot-toast';
import apiClient from '@/lib/axios';
import {
  ArrowRightLeft,
  BookCopy,
  Building2,
  Edit,
  Layers3,
  Loader2,
  MoreHorizontal,
  PlusCircle,
  Search,
  Sparkles,
  Trash2,
  Users,
  XCircle,
} from 'lucide-react';

import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

const subjectSchema = z.object({
  name: z.string()
    .min(2, { message: 'Subject name must be at least 2 characters.' })
    .max(100, { message: 'Name must be 100 characters or less.' }),
  code: z.string()
    .min(3, { message: 'Code must be at least 3 characters.' })
    .max(15, { message: 'Code must be 15 characters or less.' })
    .transform((value) => value.toUpperCase()),
});

const mockDataStore = {
  subjects: [
    { id: 1, name: 'Mathematics', code: 'MATH101', assignmentCount: 2, assignments: [{ classroomName: 'Grade 10-A', teacherName: 'Mr. Smith' }, { classroomName: 'Grade 10-B', teacherName: 'Ms. Davis' }] },
    { id: 2, name: 'Physics', code: 'PHY101', assignmentCount: 1, assignments: [{ classroomName: 'Grade 11-A', teacherName: 'Dr. Evans' }] },
    { id: 3, name: 'English Literature', code: 'ENG201', assignmentCount: 0, assignments: [] },
    { id: 4, name: 'History', code: 'HIST101', assignmentCount: 1, assignments: [{ classroomName: 'Grade 9-A', teacherName: 'Unassigned' }] },
    { id: 5, name: 'Art History', code: 'ART301', assignmentCount: 0, assignments: [] },
  ],
};

export default function SubjectsPage() {
  const [subjects, setSubjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [usageFilter, setUsageFilter] = useState('all');

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(subjectSchema),
    defaultValues: { name: '', code: '' },
  });

  const fetchSubjects = useCallback(async () => {
    setIsLoading(true);
    const useMockData = process.env.NEXT_PUBLIC_DEBUG === 'true';

    if (useMockData) {
      await new Promise((resolve) => setTimeout(resolve, 500));
      setSubjects(mockDataStore.subjects);
      setIsLoading(false);
      return;
    }

    try {
      const response = await apiClient.get('/api/admin/subjects');
      const normalizedSubjects = (response.data || []).map((subject) => ({
        ...subject,
        assignmentCount: subject.assignmentCount ?? 0,
        assignments: subject.subjectAssignmentDetailDTOS ?? [],
      }));
      setSubjects(normalizedSubjects);
    } catch (error) {
      toast.error(error.customMessage || 'Failed to fetch subjects.');
      setSubjects([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSubjects();
  }, [fetchSubjects]);

  const catalogStats = useMemo(() => {
    const inUse = subjects.filter((subject) => (subject.assignmentCount ?? 0) > 0).length;
    const totalAssignments = subjects.reduce((sum, subject) => sum + (subject.assignmentCount ?? 0), 0);

    return {
      totalSubjects: subjects.length,
      inUse,
      catalogOnly: subjects.length - inUse,
      totalAssignments,
    };
  }, [subjects]);

  const filteredSubjects = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return subjects.filter((subject) => {
      const assignmentCount = subject.assignmentCount ?? 0;
      const matchesSearch = normalizedSearch.length === 0
        || subject.name?.toLowerCase().includes(normalizedSearch)
        || subject.code?.toLowerCase().includes(normalizedSearch);

      const matchesUsage = usageFilter === 'all'
        || (usageFilter === 'inUse' && assignmentCount > 0)
        || (usageFilter === 'unused' && assignmentCount === 0);

      return matchesSearch && matchesUsage;
    });
  }, [searchTerm, subjects, usageFilter]);

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    const isEditing = Boolean(editingSubject);
    const processedData = { ...data, code: data.code.toUpperCase() };
    const request = isEditing
      ? apiClient.put(`/api/admin/subjects/${editingSubject.id}`, processedData)
      : apiClient.post('/api/admin/subjects', processedData);

    const toastId = toast.loading(isEditing ? 'Updating subject...' : 'Creating subject...');

    try {
      await request;
      toast.success(isEditing ? 'Subject updated!' : 'Subject created!', { id: toastId });
      setIsDialogOpen(false);
      fetchSubjects();
    } catch (error) {
      toast.error(error.customMessage || 'Operation failed.', { id: toastId });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (subjectId) => {
    const toastId = toast.loading('Deleting subject...');
    try {
      await apiClient.delete(`/api/admin/subjects/${subjectId}`);
      toast.success('Subject deleted!', { id: toastId });
      fetchSubjects();
    } catch (error) {
      toast.error(error.customMessage || 'Failed to delete subject.', { id: toastId });
    }
  };

  const openAddDialog = () => {
    reset({ name: '', code: '' });
    setEditingSubject(null);
    setIsDialogOpen(true);
  };

  const openEditDialog = (subject) => {
    reset({ name: subject.name, code: subject.code });
    setEditingSubject(subject);
    setValue('name', subject.name);
    setValue('code', subject.code);
    setIsDialogOpen(true);
  };

  const resetFilters = () => {
    setSearchTerm('');
    setUsageFilter('all');
  };

  return (
    <div className="min-h-[calc(100vh-64px)] space-y-8 bg-slate-50 p-4 md:p-6 lg:p-8">
      <div className="rounded-3xl border border-slate-200 bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.12),_transparent_35%),linear-gradient(135deg,_#ffffff,_#f8fafc)] p-6 shadow-sm">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-blue-700">
              <Sparkles className="h-3.5 w-3.5" />
              Curriculum Catalog
            </div>
            <div>
              <h1 className="flex items-center gap-3 text-3xl font-extrabold tracking-tight text-slate-900">
                <BookCopy className="h-8 w-8 text-blue-600" />
                Subject Catalog
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                Manage the school&apos;s official subject list here, then use the assignment module to map subjects to classrooms and teachers.
              </p>
            </div>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button asChild variant="outline" className="border-slate-300 bg-white">
              <Link href="/admin/assignments">
                <ArrowRightLeft className="mr-2 h-4 w-4" />
                Open Assignments
              </Link>
            </Button>
            <Button onClick={openAddDialog} className="px-6 py-3 text-base shadow-sm">
              <PlusCircle className="mr-2 h-5 w-5" />
              Add New Subject
            </Button>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-slate-200 shadow-sm">
          <CardContent className="flex items-center justify-between p-5">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Total Subjects</p>
              <p className="mt-2 text-3xl font-bold text-slate-900">{catalogStats.totalSubjects}</p>
            </div>
            <div className="rounded-2xl bg-slate-100 p-3 text-slate-700">
              <Layers3 className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-slate-200 shadow-sm">
          <CardContent className="flex items-center justify-between p-5">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">In Active Use</p>
              <p className="mt-2 text-3xl font-bold text-slate-900">{catalogStats.inUse}</p>
            </div>
            <div className="rounded-2xl bg-emerald-100 p-3 text-emerald-700">
              <Building2 className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-slate-200 shadow-sm">
          <CardContent className="flex items-center justify-between p-5">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Assignment Links</p>
              <p className="mt-2 text-3xl font-bold text-slate-900">{catalogStats.totalAssignments}</p>
            </div>
            <div className="rounded-2xl bg-blue-100 p-3 text-blue-700">
              <Users className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md md:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">{editingSubject ? 'Edit Subject' : 'Create New Subject'}</DialogTitle>
            <DialogDescription>
              {editingSubject ? 'Update the catalog details for this subject.' : 'Add a new subject to the school catalog.'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="grid gap-6 py-6">
              <div className="space-y-2">
                <Label htmlFor="name-input" className="text-base font-medium">Subject Name</Label>
                <Input
                  id="name-input"
                  {...register('name')}
                  className={`text-base ${errors.name ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
                  placeholder="e.g., Algebra II"
                />
                {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="code-input" className="text-base font-medium">Subject Code</Label>
                <Input
                  id="code-input"
                  {...register('code')}
                  className={`text-base uppercase ${errors.code ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
                  placeholder="e.g., MATH301"
                />
                {errors.code && <p className="mt-1 text-sm text-red-600">{errors.code.message}</p>}
              </div>
            </div>
            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {editingSubject ? 'Save Changes' : 'Create Subject'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Card className="border-slate-200 shadow-sm">
        <CardHeader>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <CardTitle>All Subjects</CardTitle>
              <CardDescription>The official catalog of all subjects offered by the school.</CardDescription>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <div className="relative min-w-[260px]">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Search by subject name or code"
                  className="bg-white pl-9"
                />
              </div>
              <div className="flex rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
                {[
                  { key: 'all', label: 'All' },
                  { key: 'inUse', label: 'In Use' },
                  { key: 'unused', label: 'Catalog Only' },
                ].map((filter) => (
                  <Button
                    key={filter.key}
                    type="button"
                    size="sm"
                    variant={usageFilter === filter.key ? 'default' : 'ghost'}
                    onClick={() => setUsageFilter(filter.key)}
                    className="rounded-lg"
                  >
                    {filter.label}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="mt-4 space-y-3">
              {Array.from({ length: 5 }).map((_, index) => (
                <div key={index} className="h-14 animate-pulse rounded-md bg-slate-200" />
              ))}
            </div>
          ) : filteredSubjects.length === 0 ? (
            <div className="mt-4 rounded-lg border border-dashed bg-slate-50 py-16 text-center text-slate-500 shadow-sm">
              <XCircle className="mx-auto mb-4 h-12 w-12 text-slate-400" />
              <p className="text-lg font-medium">No subjects match this view.</p>
              <p className="mt-2 text-sm">Try adjusting your search or usage filter, or add a new subject to the catalog.</p>
              <div className="mt-4 flex items-center justify-center gap-2">
                <Button variant="outline" onClick={resetFilters}>Reset Filters</Button>
                <Button variant="link" className="text-base" onClick={openAddDialog}>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Add Subject
                </Button>
              </div>
            </div>
          ) : (
            <div className="overflow-hidden rounded-lg border">
              <Table>
                <TableHeader className="bg-slate-50">
                  <TableRow>
                    <TableHead>Subject Name</TableHead>
                    <TableHead>Subject Code</TableHead>
                    <TableHead>Catalog Status</TableHead>
                    <TableHead>Usage (Assignments)</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSubjects.map((subject) => (
                    <TableRow key={subject.id}>
                      <TableCell>
                        <div className="space-y-1">
                          <p className="font-medium text-slate-800">{subject.name}</p>
                          <p className="text-xs text-slate-500">
                            {subject.assignmentCount > 0
                              ? 'Catalog item linked to active classroom delivery'
                              : 'Catalog-ready subject not yet linked to an assignment'}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-slate-500">{subject.code}</TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={subject.assignmentCount > 0
                            ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                            : 'border-slate-200 bg-slate-100 text-slate-700'}
                        >
                          {subject.assignmentCount > 0 ? 'Active in Delivery' : 'Catalog Only'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {subject.assignmentCount > 0 ? (
                          <Popover>
                            <PopoverTrigger asChild>
                              <button
                                type="button"
                                className="font-medium text-blue-600 underline decoration-dotted underline-offset-4 hover:text-blue-700"
                              >
                                {subject.assignmentCount} {subject.assignmentCount === 1 ? 'assignment' : 'assignments'}
                              </button>
                            </PopoverTrigger>
                            <PopoverContent className="w-72">
                              <div className="space-y-2">
                                <h4 className="font-medium leading-none text-slate-800">Assignments for {subject.name}</h4>
                                <p className="text-sm text-slate-500">Currently delivered through these classroom assignments:</p>
                                <ScrollArea className="h-32">
                                  <div className="space-y-3 pt-2">
                                    {subject.assignments?.map((assignment, index) => (
                                      <div key={`${subject.id}-${index}`} className="text-sm">
                                        <p className="flex items-center font-medium text-slate-700">
                                          <Building2 className="mr-2 h-4 w-4 text-slate-400" />
                                          {assignment.classroomName}
                                        </p>
                                        <p className="flex items-center pl-6 text-slate-500">
                                          <Users className="mr-2 h-4 w-4 text-slate-400" />
                                          {assignment.teacherName}
                                        </p>
                                      </div>
                                    ))}
                                  </div>
                                </ScrollArea>
                              </div>
                            </PopoverContent>
                          </Popover>
                        ) : (
                          <span className="text-slate-400">Not in use</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <AlertDialog>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-52">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuItem onClick={() => openEditDialog(subject)}>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem asChild>
                                <Link href="/admin/assignments">
                                  <ArrowRightLeft className="mr-2 h-4 w-4" />
                                  Manage Assignments
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              {subject.assignmentCount > 0 ? (
                                <DropdownMenuItem disabled className="cursor-not-allowed text-slate-400">
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Delete (In Use)
                                </DropdownMenuItem>
                              ) : (
                                <AlertDialogTrigger asChild>
                                  <DropdownMenuItem
                                    onSelect={(event) => event.preventDefault()}
                                    className="text-red-600 focus:bg-red-50 focus:text-red-700"
                                  >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Delete
                                  </DropdownMenuItem>
                                </AlertDialogTrigger>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This will permanently delete &quot;{subject.name}&quot;. This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction className="bg-red-600 hover:bg-red-700" onClick={() => handleDelete(subject.id)}>
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
