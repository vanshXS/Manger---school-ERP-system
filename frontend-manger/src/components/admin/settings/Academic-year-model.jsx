'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from "sonner";
import apiClient from '@/lib/axios';
import { Calendar, Loader2, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";

const yearSchema = z.object({
  name: z.string().min(3),
  startDate: z.date(),
  endDate: z.date(),
}).refine(data => data.endDate > data.startDate, { message: "End date must be after start date", path: ["endDate"] });

export function AcademicYearSetupModal({ isOpen, setIsOpen, onSetupComplete }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm({
    resolver: zodResolver(yearSchema),
    defaultValues: { name: `${new Date().getFullYear()}-${new Date().getFullYear() + 1}` }
  });
  const startDate = watch('startDate');
  const endDate = watch('endDate');

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    const apiData = {
      ...data,
      startDate: format(data.startDate, 'yyyy-MM-dd'),
      endDate: format(data.endDate, 'yyyy-MM-dd'),
    };

    try {
      const res = await apiClient.post('/api/admin/academic-years', apiData);
      await apiClient.put(`/api/admin/academic-years/${res.data.id}/set-current`);
      
      toast.success("System initialized successfully!");
      setIsOpen(false);
      if(onSetupComplete) onSetupComplete();
      
    } catch (error) {
      toast.error("Setup failed. Please check network connection.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => { /* Prevent Closing */ }}>
      <DialogContent className="max-w-md" onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader className="text-center items-center">
          <div className="h-12 w-12 bg-red-100 rounded-full flex items-center justify-center mb-2">
            <AlertTriangle className="h-6 w-6 text-red-600" />
          </div>
          <DialogTitle>Setup Required</DialogTitle>
          <DialogDescription className="text-center">
            Welcome! To begin using the dashboard, please define the current academic year.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-4">
            {/* Form inputs are same as Academic Tab, simplified for brevity here */}
             <div className="space-y-2">
                <Label>Year Name</Label>
                <Input {...register('name')} placeholder="e.g. 2024-2025" />
             </div>
             <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                    <Label>Start</Label>
                    <Popover>
                        <PopoverTrigger asChild><Button variant="outline"><Calendar className="mr-2 h-4 w-4"/> {startDate ? format(startDate, 'PPP') : 'Pick'}</Button></PopoverTrigger>
                        <PopoverContent className="p-0"><CalendarComponent mode="single" selected={startDate} onSelect={d => setValue('startDate', d)} /></PopoverContent>
                    </Popover>
                </div>
                 <div className="flex flex-col gap-2">
                    <Label>End</Label>
                    <Popover>
                        <PopoverTrigger asChild><Button variant="outline"><Calendar className="mr-2 h-4 w-4"/> {endDate ? format(endDate, 'PPP') : 'Pick'}</Button></PopoverTrigger>
                        <PopoverContent className="p-0"><CalendarComponent mode="single" selected={endDate} onSelect={d => setValue('endDate', d)} /></PopoverContent>
                    </Popover>
                </div>
             </div>
             
             <DialogFooter>
                <Button className="w-full" type="submit" disabled={isSubmitting}>
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>} Complete Setup
                </Button>
             </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}