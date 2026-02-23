'use client';
import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';

export const TableSkeleton = () => (
  <div className="space-y-3">
    {Array(5)
      .fill(0)
      .map((_, i) => (
        <Skeleton key={i} className="h-16 w-full rounded-md" />
      ))}
  </div>
);

export const SheetSkeleton = () => (
  <div className="space-y-4 pt-4">
    <Skeleton className="h-8 w-1/2" />
    <Skeleton className="h-10 w-full" />
    <Skeleton className="h-10 w-full" />
    <Separator className="my-6" />
    <Skeleton className="h-8 w-1/3" />
    <Skeleton className="h-10 w-full" />
  </div>
);
