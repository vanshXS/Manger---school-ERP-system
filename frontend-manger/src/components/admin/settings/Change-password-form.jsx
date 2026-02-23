'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import toast from 'react-hot-toast';
import apiClient from '@/lib/axios';
import { Loader2, KeyRound } from 'lucide-react';

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

// Zod Schema
const passwordSchema = z.object({
  oldPassword: z.string().min(1, "Current password is required."),
  newPassword: z.string().min(5, "New password must be at least 5 characters.").max(15),
}).refine(data => data.oldPassword !== data.newPassword, {
  message: "New password must be different from the old password.",
  path: ["newPassword"],
});

export function ChangePasswordForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(passwordSchema),
  });

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    const toastId = toast.loading("Updating password...");

    try {
      await apiClient.put('/api/admin/school/reset-password', {
        oldPassword: data.oldPassword,
        newPassword: data.newPassword,
      });
      toast.success("Password changed successfully!", { id: toastId });
      reset({ oldPassword: '', newPassword: '' }); // Clear form
    } catch (error) {
      toast.error(error.customMessage || "Failed to change password.", { id: toastId });
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Change Password</CardTitle>
          <CardDescription>Update your administrator account password. This will log you out of other sessions.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="oldPassword" className="text-base font-medium">Current Password</Label>
            <Input id="oldPassword" type="password" {...register('oldPassword')} className={`text-base ${errors.oldPassword ? 'border-red-500' : ''}`} />
            {errors.oldPassword && <p className="text-sm text-red-600 mt-1">{errors.oldPassword.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="newPassword" className="text-base font-medium">New Password</Label>
            <Input id="newPassword" type="password" {...register('newPassword')} className={`text-base ${errors.newPassword ? 'border-red-500' : ''}`} />
            {errors.newPassword && <p className="text-sm text-red-600 mt-1">{errors.newPassword.message}</p>}
          </div>
        </CardContent>
        <CardFooter className="border-t pt-6">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Change Password
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
}