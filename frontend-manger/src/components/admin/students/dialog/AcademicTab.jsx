'use client';

import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Heart } from 'lucide-react';
import { FormField, inputCls } from '../../shared/FormComponents';

export default function AcademicTab({ register, errors }) {
    return (
        <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <FormField label="Previous School">
                    <Input {...register('previousSchoolName')} placeholder="School Name" className={inputCls} />
                </FormField>
                <FormField label="Previous Class">
                    <Input {...register('previousClass')} placeholder="e.g. 5th Grade" className={inputCls} />
                </FormField>
                <FormField label="Admission Date">
                    <Input type="date" {...register('admissionDate')} className={inputCls} />
                </FormField>
                <FormField label="Fee Category">
                    <Input {...register('feeCategory')} placeholder="e.g. General" className={inputCls} />
                </FormField>

                <div className="md:col-span-2 flex gap-6 p-4 bg-white border border-slate-200 rounded-md mt-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" {...register('transportRequired')} className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
                        <span className="text-sm font-medium text-slate-700">Transport Required</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" {...register('hostelRequired')} className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
                        <span className="text-sm font-medium text-slate-700">Hostel Required</span>
                    </label>
                </div>

                <div className="md:col-span-2 mt-4">
                    <h4 className="text-sm font-semibold text-slate-800 mb-4 flex items-center gap-2">
                        <Heart className="h-4 w-4 text-pink-500" />
                        Health Information
                    </h4>
                    <div className="grid grid-cols-1 gap-5">
                        <FormField label="Medical Conditions">
                            <Textarea {...register('medicalConditions')} placeholder="List any conditions..." className="bg-white border-slate-200 min-h-[70px] resize-none" />
                        </FormField>
                        <FormField label="Allergies">
                            <Textarea {...register('allergies')} placeholder="List any allergies..." className="bg-white border-slate-200 min-h-[70px] resize-none" />
                        </FormField>
                    </div>
                </div>
            </div>
        </div>
    );
}
