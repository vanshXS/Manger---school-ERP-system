'use client';

import { Label } from '@/components/ui/label';

export const inputCls = 'h-10 bg-white border-slate-200 focus-visible:ring-indigo-500/20 focus-visible:border-indigo-500 rounded-md';
export const inputErr = 'border-red-300 focus-visible:ring-red-400/20 focus-visible:border-red-400';

export const FormField = ({ label, required, error, children, span2 }) => (
    <div className={`space-y-1.5 ${span2 ? 'md:col-span-2' : ''}`}>
        <Label className="text-xs font-semibold text-slate-600">
            {label} {required && <span className="text-red-500">*</span>}
        </Label>
        {children}
        {error && <p className="text-red-500 text-xs font-medium mt-1">{error.message}</p>}
    </div>
);
