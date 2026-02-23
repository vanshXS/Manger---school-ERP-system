'use client';

import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { AlertCircle } from 'lucide-react';
import { FormField, inputCls } from '../../shared/FormComponents';

export default function AddressTab({ register, errors }) {
    return (
        <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <FormField label="Full Address" span2>
                    <Textarea {...register('fullAddress')} placeholder="Street, area, building..." className="bg-white border-slate-200 focus-visible:ring-indigo-500/20 focus-visible:border-indigo-500 min-h-[80px] rounded-md resize-none" />
                </FormField>
                <FormField label="City">
                    <Input {...register('city')} placeholder="City" className={inputCls} />
                </FormField>
                <FormField label="State">
                    <Input {...register('state')} placeholder="State" className={inputCls} />
                </FormField>
                <FormField label="Pincode" span2>
                    <Input {...register('pincode')} placeholder="Postal code" className={inputCls} />
                </FormField>
            </div>

            <div className="pt-6 border-t border-slate-200">
                <h4 className="text-sm font-semibold text-slate-800 mb-4 flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-red-500" />
                    Emergency Contact
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <FormField label="Contact Person">
                        <Input {...register('emergencyContactName')} placeholder="Full name" className={inputCls} />
                    </FormField>
                    <FormField label="Contact Number">
                        <Input type="tel" {...register('emergencyContactNumber')} placeholder="Phone number" className={inputCls} />
                    </FormField>
                </div>
            </div>
        </div>
    );
}
