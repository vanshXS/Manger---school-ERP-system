'use client';

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from "sonner";
import apiClient from '@/lib/axios';
import { Loader2, Upload, Building, Image as ImageIcon } from 'lucide-react';

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

// Schemas
const schoolProfileSchema = z.object({
  name: z.string().min(3, "School name is too short.").max(100),
  address: z.string().max(255).optional().or(z.literal('')),
  phoneNumber: z.string().max(20).optional().or(z.literal('')),
});

function SchoolProfileForm({ schoolData, fetchSchoolData }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { register, handleSubmit, reset, formState: { errors, isDirty } } = useForm({
    resolver: zodResolver(schoolProfileSchema),
    values: {
      name: schoolData?.name || '',
      address: schoolData?.address || '',
      phoneNumber: schoolData?.phoneNumber || '',
    }
  });

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    const promise = apiClient.put('/api/admin/school', data);

    toast.promise(promise, {
      loading: 'Updating school profile...',
      success: () => {
        fetchSchoolData();
        return 'School profile updated successfully';
      },
      error: (err) => err.customMessage || 'Failed to update profile',
    });

    try {
      await promise;
      reset(data); 
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="border-slate-200 shadow-sm">
      <CardHeader>
        <CardTitle>School Information</CardTitle>
        <CardDescription>Basic details displayed on reports and invoices.</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="name">School Name</Label>
            <Input id="name" {...register('name')} placeholder="e.g. Springfield High" />
            {errors.name && <span className="text-xs text-red-500">{errors.name.message}</span>}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="address">Address</Label>
              <Input id="address" {...register('address')} placeholder="e.g. 123 Education Lane" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="phoneNumber">Phone Number</Label>
              <Input id="phoneNumber" {...register('phoneNumber')} placeholder="e.g. +1 234 567 890" />
            </div>
          </div>
        </CardContent>
        <CardFooter className="bg-slate-50 border-t border-slate-100 px-6 py-4 flex justify-end">
          <Button type="submit" disabled={isSubmitting || !isDirty}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Changes
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}

function SchoolLogoForm({ schoolData, fetchSchoolData }) {
  const [isUploading, setIsUploading] = useState(false);
  const [preview, setPreview] = useState(null);

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error("File is too large. Max size is 2MB.");
      return;
    }

    // Show preview immediately
    const objectUrl = URL.createObjectURL(file);
    setPreview(objectUrl);

    // Auto upload on select
    const formData = new FormData();
    formData.append("file", file);

    setIsUploading(true);
    const promise = apiClient.post('/api/admin/school/logo', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });

    toast.promise(promise, {
      loading: 'Uploading logo...',
      success: 'Logo updated successfully',
      error: 'Failed to upload logo',
    });

    try {
      await promise;
      fetchSchoolData();
    } catch (error) {
      setPreview(null); // Revert preview on error
      console.error(error);
    } finally {
      setIsUploading(false);
    }
  };
  
  return (
    <Card className="border-slate-200 shadow-sm h-full">
      <CardHeader>
        <CardTitle>School Branding</CardTitle>
        <CardDescription>Upload your official school logo.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center justify-center space-y-6 py-6">
        <div className="relative group">
          <Avatar className="h-32 w-32 border-2 border-slate-100 shadow-inner bg-white">
            <AvatarImage src={preview || schoolData?.logoUrl} className="object-contain p-2" />
            <AvatarFallback className="bg-slate-50 text-slate-300">
              <ImageIcon className="h-12 w-12" />
            </AvatarFallback>
          </Avatar>
          {isUploading && (
            <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
              <Loader2 className="h-8 w-8 text-white animate-spin" />
            </div>
          )}
        </div>
        
        <div className="flex items-center justify-center w-full">
          <label htmlFor="logo-upload" className="cursor-pointer">
            <div className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 rounded-md shadow-sm hover:bg-slate-50 transition-colors text-sm font-medium text-slate-700">
              <Upload className="h-4 w-4" />
              <span>Click to Upload</span>
            </div>
            <input 
              id="logo-upload" 
              type="file" 
              className="hidden" 
              accept="image/png, image/jpeg" 
              onChange={handleFileChange}
              disabled={isUploading}
            />
          </label>
        </div>
        <p className="text-xs text-slate-500 text-center">
          SVG, PNG, JPG or GIF (max. 2MB)
        </p>
      </CardContent>
    </Card>
  );
}

export function GeneralSettingsTab() {
  const [schoolData, setSchoolData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchSchoolData = async () => {
    try {
      const response = await apiClient.get('/api/admin/school');
      setSchoolData(response.data);
    } catch (error) {
      toast.error(error?.customMessage || 'Failed to load school profile');
      setSchoolData(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSchoolData();
  }, []);

  if (isLoading) {
    return (
        <div className="grid gap-6 md:grid-cols-3">
           <div className="md:col-span-2 space-y-4">
              <Skeleton className="h-[300px] w-full rounded-xl" />
           </div>
           <div>
              <Skeleton className="h-[300px] w-full rounded-xl" />
           </div>
        </div>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-3">
      <div className="md:col-span-2">
        <SchoolProfileForm 
          schoolData={schoolData} 
          fetchSchoolData={fetchSchoolData} 
        />
      </div>
      <div>
        <SchoolLogoForm 
          schoolData={schoolData} 
          fetchSchoolData={fetchSchoolData}
        />
      </div>
    </div>
  );
}