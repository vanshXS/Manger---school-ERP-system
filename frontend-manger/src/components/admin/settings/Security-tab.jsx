'use client';

import apiClient from '@/lib/axios';
import { zodResolver } from '@hookform/resolvers/zod';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from "sonner";
import * as z from 'zod';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// Reusable Password Input Component
const PasswordInput = React.forwardRef(({ className, ...props }, ref) => {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <Input
        type={show ? "text" : "password"}
        className={`pr-10 ${className}`}
        ref={ref}
        {...props}
      />
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
        onClick={() => setShow(!show)}
      >
        {show ? <EyeOff className="h-4 w-4 text-slate-400" /> : <Eye className="h-4 w-4 text-slate-400" />}
      </Button>
    </div>
  );
});
PasswordInput.displayName = "PasswordInput";


const passwordSchema = z.object({
  oldPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(6, "Password must be at least 6 characters"),
  confirmNewPassword: z.string(),
}).refine(data => data.newPassword === data.confirmNewPassword, {
  message: "Passwords do not match",
  path: ["confirmNewPassword"],
}).refine(data => data.oldPassword !== data.newPassword, {
  message: "New password cannot be same as old",
  path: ["newPassword"],
});

export function SecurityTab() {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(passwordSchema),
  });

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    const promise = apiClient.put('/api/admin/school/reset-password', {
        oldPassword: data.oldPassword,
        newPassword: data.newPassword
    });

    toast.promise(promise, {
        loading: 'Updating password...',
        success: 'Password changed successfully',
        error: (err) => err.customMessage || 'Failed to change password'
    });

    try {
        await promise;
        reset();
    } catch(e) {
        console.error(e);
    } finally {
        setIsSubmitting(false);
    }
  };

  return (
    <Card className="max-w-2xl border-slate-200 shadow-sm">
      <CardHeader>
        <CardTitle>Change Password</CardTitle>
        <CardDescription>Ensure your account is using a long, random password to stay secure.</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="oldPassword">Current Password</Label>
            <PasswordInput id="oldPassword" {...register('oldPassword')} />
            {errors.oldPassword && <p className="text-xs text-red-500">{errors.oldPassword.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="newPassword">New Password</Label>
            <PasswordInput id="newPassword" {...register('newPassword')} />
            {errors.newPassword && <p className="text-xs text-red-500">{errors.newPassword.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmNewPassword">Confirm New Password</Label>
            <PasswordInput id="confirmNewPassword" {...register('confirmNewPassword')} />
            {errors.confirmNewPassword && <p className="text-xs text-red-500">{errors.confirmNewPassword.message}</p>}
          </div>
        </CardContent>
        <CardFooter className="bg-slate-50 border-t border-slate-100 px-6 py-4 flex justify-end">
          <Button type="submit" disabled={isSubmitting} variant="destructive">
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Update Password
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}