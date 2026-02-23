'use client';

import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { classroomDisplayName } from '@/lib/classroomDisplayName';
import { Upload } from 'lucide-react';
import { FormField, inputCls, inputErr } from '../../shared/FormComponents';

export default function PersonalTab({ register, errors, watch, setValue, classrooms }) {
    const profilePictureFile = watch('profilePicture');
    const profilePictureName =
        profilePictureFile && profilePictureFile.length > 0
            ? profilePictureFile[0].name
            : null;

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <FormField label="First Name" required error={errors.firstName}>
                <Input {...register('firstName')} placeholder="John" className={`${inputCls} ${errors.firstName ? inputErr : ''}`} />
            </FormField>
            <FormField label="Last Name" required error={errors.lastName}>
                <Input {...register('lastName')} placeholder="Doe" className={`${inputCls} ${errors.lastName ? inputErr : ''}`} />
            </FormField>
            <FormField label="Email Address" required error={errors.email} span2>
                <Input type="email" {...register('email')} placeholder="student@school.edu" className={`${inputCls} ${errors.email ? inputErr : ''}`} />
            </FormField>
            <FormField label="Phone Number" error={errors.phoneNumber}>
                <Input type="tel" {...register('phoneNumber')} placeholder="+91" className={`${inputCls} ${errors.phoneNumber ? inputErr : ''}`} />
            </FormField>
            <FormField label="Gender">
                <Select onValueChange={(v) => setValue('gender', v)} value={watch('gender') || ''}>
                    <SelectTrigger className={inputCls}><SelectValue placeholder="Select gender" /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="MALE">Male</SelectItem>
                        <SelectItem value="FEMALE">Female</SelectItem>
                        <SelectItem value="OTHERS">Others</SelectItem>
                    </SelectContent>
                </Select>
            </FormField>
            <FormField label="Assign Classroom">
                <Select onValueChange={(v) => setValue('classroomId', v)} value={watch('classroomId') || 'none'}>
                    <SelectTrigger className={`${inputCls}`}>
                        <SelectValue placeholder="Select Class" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="none">-- Unassigned --</SelectItem>
                        {classrooms.map((cls) => (
                            <SelectItem key={cls.id} value={cls.id.toString()}>{classroomDisplayName(cls)}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </FormField>
            <FormField label="Profile Photo" span2>
                <div className="relative border-2 border-dashed border-slate-300 rounded-lg p-5 hover:bg-slate-100 transition-colors text-center cursor-pointer group bg-white">
                    <input type="file" {...register('profilePicture')} accept="image/*" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                    <div className="flex flex-col items-center justify-center gap-2">
                        <div className="p-2 bg-slate-100 rounded-full group-hover:bg-indigo-50 transition-colors">
                            <Upload className="h-5 w-5 text-slate-500 group-hover:text-indigo-600" />
                        </div>
                        <span className="text-sm text-slate-600 font-medium">
                            {profilePictureName || 'Click to browse or drag and drop'}
                        </span>
                    </div>
                </div>
            </FormField>
        </div>
    );
}
