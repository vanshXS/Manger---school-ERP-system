'use client';

import React, { useState, useEffect, useCallback } from 'react';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

import toast from 'react-hot-toast';
import apiClient from '@/lib/axios'; 

import { PlusCircle, Edit, Trash2, MoreHorizontal, Loader2, BookCopy, XCircle, AlertTriangle, Building, Building2, Users } from 'lucide-react'; // <-- Added Building, Users

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";


const subjectSchema = z.object({
  name: z.string()
           .min(2, { message: "Subject name must be at least 2 characters." })
           .max(100, { message: "Name must be 100 characters or less." }),
  code: z.string()
           .min(3, { message: "Code must be at least 3 characters." })
           .max(15, { message: "Code must be 15 characters or less." })
           .regex(/^[A-Za-z0-9]+$/, { message: "Code must contain only letters and numbers." })
           .transform(val => val.toUpperCase()),
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

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm({
    resolver: zodResolver(subjectSchema),
    defaultValues: { name: '', code: '' },
  });

  const fetchSubjects = useCallback(async () => {
    setIsLoading(true);
    const useMockData = process.env.NEXT_PUBLIC_DEBUG === 'true';
    if (useMockData) {
      console.log("Subjects Mode: Using Mock Data");
      await new Promise(resolve => setTimeout(resolve, 500));
      setSubjects(mockDataStore.subjects);
      setIsLoading(false);
    } else {
      console.log("Subjects Mode: Fetching Real API Data...");
      try {
        const response = await apiClient.get('/api/admin/subjects');
       
        const dataWithDetails = response.data.map(s => ({ 
          ...s, 
          assignmentCount: s.assignmentCount ?? 0,
          assignments: s.subjectAssignmentDetailDTOS ?? [] 
        }));
        setSubjects(dataWithDetails || []);
      } catch (error) {
        toast.error(error.customMessage || 'Failed to fetch subjects.');
        console.error('Error fetching subjects:', error);
        setSubjects([]);
      } finally {
        setIsLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    fetchSubjects();
  }, [fetchSubjects]);

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    const isEditing = !!editingSubject;
    const processedData = { ...data, code: data.code.toUpperCase() };
    const apiCall = isEditing
      ? apiClient.put(`/api/admin/subjects/${editingSubject.id}`, processedData)
      : apiClient.post('/api/admin/subjects', processedData);
    const toastId = toast.loading(isEditing ? 'Updating subject...' : 'Creating subject...');
    try {
      await apiCall;
      toast.success(isEditing ? 'Subject updated!' : 'Subject created!', { id: toastId });
      setIsDialogOpen(false);
      fetchSubjects();
    } catch (error) {
      toast.error(error.customMessage || `Operation failed.`, { id: toastId });
      console.error('Submit Subject Error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };
  const handleDelete = async (id) => {
    const toastId = toast.loading('Deleting subject...');
    try {
      await apiClient.delete(`/api/admin/subjects/${id}`);
      toast.success('Subject deleted!', { id: toastId });
      fetchSubjects();
    } catch (error) {
         toast.error(error.customMessage || 'Failed to delete subject.')
      console.error('Delete Subject Error:', error);
    }
  };

  const openAddDialog = () => {
    reset({ name: '', code: '' });
    setEditingSubject(null);
    setIsDialogOpen(true);
  };
  const openEditDialog = (subject) => {
    reset();
    setEditingSubject(subject);
    setValue('name', subject.name);
    setValue('code', subject.code);
    setIsDialogOpen(true);
  };


  return (
    <div className="space-y-8 p-4 md:p-6 lg:p-8 bg-slate-50 min-h-[calc(100vh-64px)]">
      {/* 1. Page Header (Unchanged) */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
        <h1 className="text-3xl font-extrabold text-slate-900 flex items-center gap-3">
          <BookCopy className="h-8 w-8 text-blue-600" /> Subject Catalog
        </h1>
        <Button onClick={openAddDialog} className="mt-4 sm:mt-0 px-6 py-3 text-base">
          <PlusCircle className="mr-2 h-5 w-5" /> Add New Subject
        </Button>
      </div>

      {/* 2. Add/Edit Dialog (Modal) (Unchanged) */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md md:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">{editingSubject ? 'Edit Subject' : 'Create New Subject'}</DialogTitle>
            <DialogDescription>{editingSubject ? 'Update subject details.' : 'Add a new subject to the catalog.'}</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="grid gap-6 py-6">
              <div className="space-y-2">
                <Label htmlFor="name-input" className="text-base font-medium">Subject Name</Label>
                <Input id="name-input" {...register('name')} className={`text-base ${errors.name ? 'border-red-500 focus-visible:ring-red-500' : ''}`} placeholder="e.g., Algebra II" />
                {errors.name && <p className="text-sm text-red-600 mt-1">{errors.name.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="code-input" className="text-base font-medium">Subject Code</Label>
                <Input id="code-input" {...register('code')} className={`text-base uppercase ${errors.code ? 'border-red-500 focus-visible:ring-red-500' : ''}`} placeholder="e.g., MATH301" />
                {errors.code && <p className="text-sm text-red-600 mt-1">{errors.code.message}</p>}
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

      {/* 3. Main Content Card with Table (MODIFIED) */}
      <Card>
        <CardHeader>
          <CardTitle>All Subjects</CardTitle>
          <CardDescription>The official catalog of all subjects offered by the school.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3 mt-4">
              {Array(5).fill(0).map((_, i) => (<div key={i} className="h-14 bg-slate-200 rounded-md animate-pulse"></div>))}
            </div>
          ) : subjects.length === 0 ? (
            <div className="text-center py-16 text-slate-500 bg-slate-50 rounded-lg border border-dashed shadow-sm mt-4">
              <XCircle className="h-12 w-12 text-slate-400 mx-auto mb-4" />
              <p className="text-lg font-medium">No subjects found.</p>
              <Button variant="link" className="mt-4 text-base" onClick={openAddDialog}>
                <PlusCircle className="mr-2 h-4 w-4" /> Add your first Subject
              </Button>
            </div>
          ) : (
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader className="bg-slate-50">
                  <TableRow>
                    <TableHead>Subject Name</TableHead>
                    <TableHead>Subject Code</TableHead>
                    <TableHead>Usage (Assignments)</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {subjects.map((subject) => (
                    <TableRow key={subject.id}>
                      <TableCell className="font-medium text-slate-800">{subject.name}</TableCell>
                      <TableCell className="font-mono text-slate-500">{subject.code}</TableCell>
                      
                      {/* --- THIS IS THE UPDATED SECTION --- */}
                      <TableCell>
                        {subject.assignmentCount > 0 ? (
                          <Popover>
                            <PopoverTrigger asChild>
                              <span className="font-medium text-blue-600 underline decoration-dotted cursor-pointer hover:text-blue-700">
                                {subject.assignmentCount} {subject.assignmentCount === 1 ? 'assignment' : 'assignments'}
                              </span>
                            </PopoverTrigger>
                            <PopoverContent className="w-72">
                              <div className="space-y-2">
                                <h4 className="font-medium leading-none text-slate-800">Assignments for {subject.name}</h4>
                                <p className="text-sm text-slate-500">Currently used in the following classrooms:</p>
                                <ScrollArea className="h-32">
                                  <div className="space-y-3 pt-2">
                                    {subject.assignments?.map((assign, index) => (
                                      <div key={index} className="text-sm">
                                        <p className="font-medium text-slate-700 flex items-center">
                                          <Building2 className="h-4 w-4 mr-2 text-slate-400" />
                                          {assign.classroomName}
                                        </p>
                                        <p className="text-slate-500 pl-6 flex items-center">
                                          <Users className="h-4 w-4 mr-2 text-slate-400" />
                                          {assign.teacherName}
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
                      {/* --- END OF UPDATED SECTION --- */}

                      <TableCell className="text-right">
                        <AlertDialog>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0"><MoreHorizontal className="h-4 w-4" /></Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuItem onClick={() => openEditDialog(subject)}><Edit className="mr-2 h-4 w-4" /> Edit</DropdownMenuItem>
                              {subject.assignmentCount > 0 ? (
                                <DropdownMenuItem disabled className="text-slate-400 cursor-not-allowed">
                                  <Trash2 className="mr-2 h-4 w-4" /> Delete (In Use)
                                </DropdownMenuItem>
                              ) : (
                                <AlertDialogTrigger asChild>
                                  <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-red-600 focus:bg-red-50 focus:text-red-700">
                                    <Trash2 className="mr-2 h-4 w-4" /> Delete
                                  </DropdownMenuItem>
                                </AlertDialogTrigger>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                              <AlertDialogDescription>This will permanently delete "{subject.name}". This action cannot be undone.</AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction className="bg-red-600 hover:bg-red-700" onClick={() => handleDelete(subject.id)}>Delete</AlertDialogAction>
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

