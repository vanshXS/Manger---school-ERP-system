'use client';

import { Input } from '@/components/ui/input';
import { FormField, inputCls, inputErr } from '../../shared/FormComponents';

export default function FamilyTab({ register, errors }) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <FormField label="Father's Name">
                <Input {...register('fatherName')} placeholder="Full name" className={inputCls} />
            </FormField>
            <FormField label="Mother's Name">
                <Input {...register('motherName')} placeholder="Full name" className={inputCls} />
            </FormField>
            <FormField label="Guardian Name" span2>
                <Input {...register('guardianName')} placeholder="If different from parents" className={inputCls} />
            </FormField>

            <FormField label="Primary Phone">
                <Input type="tel" {...register('parentPhonePrimary')} placeholder="+91" className={inputCls} />
            </FormField>
            <FormField label="Secondary Phone">
                <Input type="tel" {...register('parentPhoneSecondary')} placeholder="Optional" className={inputCls} />
            </FormField>
            <FormField label="Parent Email" error={errors.parentEmail}>
                <Input type="email" {...register('parentEmail')} placeholder="parent@email.com" className={`${inputCls} ${errors.parentEmail ? inputErr : ''}`} />
            </FormField>
            <FormField label="Occupation">
                <Input {...register('parentOccupation')} placeholder="e.g. Engineer" className={inputCls} />
            </FormField>
            <FormField label="Annual Income (₹)">
                <Input {...register('annualIncome')} placeholder="Amount" className={inputCls} />
            </FormField>
        </div>
    );
}
