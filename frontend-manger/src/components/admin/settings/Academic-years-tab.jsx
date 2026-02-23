'use client';

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from "sonner";
import apiClient from '@/lib/axios';
import { Calendar, CheckCircle, Loader2, AlertTriangle, Plus, RefreshCw, CalendarRange, Lock } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";

// Schema
const yearSchema = z.object({
  name: z.string().min(3, "Name required (e.g. 2024-2025)").max(50),
  startDate: z.date({ required_error: "Start date required" }),
  endDate: z.date({ required_error: "End date required" }),
}).refine(data => data.endDate > data.startDate, {
  message: "End date must be after start date",
  path: ["endDate"]
});

export function AcademicYearsTab() {
  const [years, setYears] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [settingCurrentId, setSettingCurrentId] = useState(null);
  const [closingYearId, setClosingYearId] = useState(null);

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm({
    resolver: zodResolver(yearSchema),
    defaultValues: {
      name: `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`,
    }
  });
  
  const startDate = watch('startDate');
  const endDate = watch('endDate');

  const fetchYears = async () => {
    setIsLoading(true);
    try {
      const response = await apiClient.get('/api/admin/academic-years', {
        params: { _t: Date.now() }
      });
      // Sort: newest start date first
      const sorted = (response.data || []).sort((a, b) => new Date(b.startDate) - new Date(a.startDate));
      setYears(sorted);
    } catch (error) {
      toast.error("Failed to load academic years");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchYears();
  }, []);

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    const apiData = {
      ...data,
      startDate: format(data.startDate, 'yyyy-MM-dd'),
      endDate: format(data.endDate, 'yyyy-MM-dd'),
    };
    
    try {
      await apiClient.post('/api/admin/academic-years', apiData);
      toast.success("Academic year created");
      setIsDialogOpen(false);
      reset();
      fetchYears();
    } catch (error) {
      toast.error(error.customMessage || "Failed to create year");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSetCurrent = async (yearId) => {
    setSettingCurrentId(yearId);
    const previousYears = [...years];
    setYears(prev => prev.map(y => ({ ...y, isCurrent: y.id === yearId })));
    try {
      await apiClient.put(`/api/admin/academic-years/${yearId}/set-current`);
      toast.success("Current academic year updated");
    } catch (error) {
      setYears(previousYears);
      toast.error(error?.customMessage || "Failed to set current year");
    } finally {
      setSettingCurrentId(null);
    }
  };

  const handleCloseCurrentYear = async () => {
    setClosingYearId(true);
    try {
      await apiClient.post('/api/admin/academic-years/close-current');
      toast.success("Academic year closed. Set the next year as current on Academic Year.");
      fetchYears();
    } catch (error) {
      toast.error(error?.customMessage || "Failed to close year");
    } finally {
      setClosingYearId(null);
    }
  };

  const isAnyActive = years.some(y => y.isCurrent);

  return (
    <div className="space-y-6">
      {/* Alert if no year is active */}
      {!isLoading && !isAnyActive && years.length > 0 && (
        <Alert variant="destructive" className="bg-red-50 border-red-200 text-red-900">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Configuration Missing</AlertTitle>
          <AlertDescription>
            No academic year is currently active. Enrollment and reporting will be disabled until you set a current year.
          </AlertDescription>
        </Alert>
      )}

      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <CardTitle>Academic Calendar</CardTitle>
            <CardDescription>Manage school years and terms. Use <Link href="/admin/academics" className="text-blue-600 hover:underline font-medium">Academic Year</Link> to manage academic sessions.</CardDescription>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={fetchYears}>
              <RefreshCw className="h-4 w-4 mr-2" /> Refresh
            </Button>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" /> Add Year
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create Academic Year</DialogTitle>
                  <DialogDescription>Define the start and end dates for the new school session.</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Year Name</Label>
                    <Input {...register('name')} placeholder="e.g. 2025-2026" />
                    {errors.name && <span className="text-red-500 text-xs">{errors.name.message}</span>}
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2 flex flex-col">
                      <Label>Start Date</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" className={`w-full justify-start text-left font-normal ${!startDate && "text-muted-foreground"}`}>
                            <Calendar className="mr-2 h-4 w-4" />
                            {startDate ? format(startDate, "PPP") : <span>Pick date</span>}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <CalendarComponent mode="single" selected={startDate} onSelect={(date) => setValue('startDate', date)} initialFocus />
                        </PopoverContent>
                      </Popover>
                    </div>
                    <div className="space-y-2 flex flex-col">
                      <Label>End Date</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" className={`w-full justify-start text-left font-normal ${!endDate && "text-muted-foreground"}`}>
                            <Calendar className="mr-2 h-4 w-4" />
                            {endDate ? format(endDate, "PPP") : <span>Pick date</span>}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <CalendarComponent mode="single" selected={endDate} onSelect={(date) => setValue('endDate', date)} initialFocus />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>
                  {errors.endDate && <p className="text-red-500 text-xs">{errors.endDate.message}</p>}
                  
                  <DialogFooter className="pt-4">
                    <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Create
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader className="bg-slate-50">
                <TableRow>
                  <TableHead className="font-semibold">Year Name</TableHead>
                  <TableHead className="font-semibold">Duration</TableHead>
                  <TableHead className="font-semibold">Status</TableHead>
                  <TableHead className="text-right font-semibold">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                   <TableRow>
                     <TableCell colSpan={4} className="h-24 text-center">Loading...</TableCell>
                   </TableRow>
                ) : years.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="h-32 text-center text-slate-500">
                      No academic years found.
                    </TableCell>
                  </TableRow>
                ) : (
                  years.map((year) => (
                    <TableRow key={year.id} className={year.isCurrent ? "bg-blue-50/30" : ""}>
                      <TableCell className="font-medium flex items-center gap-2">
                        <CalendarRange className="h-4 w-4 text-slate-400" />
                        {year.name}
                      </TableCell>
                      <TableCell>
                        {format(new Date(year.startDate), "MMM d, yyyy")} - {format(new Date(year.endDate), "MMM d, yyyy")}
                      </TableCell>
                      <TableCell>
                        {year.isCurrent ? (
                          <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-green-200">
                            <CheckCircle className="mr-1 h-3 w-3" /> Current
                          </Badge>
                        ) : year.closed ? (
                          <Badge className="bg-slate-100 text-slate-700 border-slate-200">
                            <Lock className="mr-1 h-3 w-3" /> Closed
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-slate-500">Inactive</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right flex justify-end gap-1">
                        {year.isCurrent && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={handleCloseCurrentYear}
                            disabled={closingYearId}
                            className="text-amber-700 hover:bg-amber-50 border-amber-200"
                          >
                            {closingYearId && <Loader2 className="mr-2 h-3 w-3 animate-spin" />}
                            Close year
                          </Button>
                        )}
                        {!year.isCurrent && !year.closed && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleSetCurrent(year.id)}
                            disabled={settingCurrentId === year.id}
                            className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                          >
                            {settingCurrentId === year.id && <Loader2 className="mr-2 h-3 w-3 animate-spin" />}
                            Set as Current
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}