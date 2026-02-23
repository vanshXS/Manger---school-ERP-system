'use client';

import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FormField, inputCls } from '../../shared/FormComponents';

export default function ProfessionalTab({ register, watch, setValue }) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <FormField label="Highest Qualification">
                <Input {...register('qualification')} placeholder="e.g. M.Ed, B.Sc" className={inputCls} />
            </FormField>
            <FormField label="Specialization">
                <Input {...register('specialization')} placeholder="e.g. Mathematics" className={inputCls} />
            </FormField>
            <FormField label="Years of Experience">
                <Input type="number" min={0} {...register('yearsOfExperience')} placeholder="0" className={inputCls} />
            </FormField>
            <FormField label="Employment Type">
                <Select onValueChange={(v) => setValue('employmentType', v)} value={watch('employmentType') || ''}>
                    <SelectTrigger className={inputCls}><SelectValue placeholder="Select type" /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="FULL_TIME">Full Time</SelectItem>
                        <SelectItem value="PART_TIME">Part Time</SelectItem>
                        <SelectItem value="CONTRACT">Contract</SelectItem>
                    </SelectContent>
                </Select>
            </FormField>
            <FormField label="Monthly Salary (₹)">
                <Input type="number" step="0.01" {...register('salary')} placeholder="Amount" className={inputCls} />
            </FormField>
            <FormField label="Joining Date">
                <Input type="date" {...register('joiningDate')} className={inputCls} />
            </FormField>
            <FormField label="Current Status" span2>
                <Select onValueChange={(v) => setValue('status', v)} value={watch('status') || 'ACTIVE'}>
                    <SelectTrigger className={inputCls}><SelectValue /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="ACTIVE">Active</SelectItem>
                        <SelectItem value="ON_LEAVE">On Leave</SelectItem>
                        <SelectItem value="RESIGNED">Resigned</SelectItem>
                    </SelectContent>
                </Select>
            </FormField>
        </div>
    );
}
