import { Button } from '@/components/ui/button';
import {
  Dialog, DialogContent,
  DialogDescription, DialogFooter,
  DialogTitle
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import apiClient from '@/lib/axios';
import { zodResolver } from '@hookform/resolvers/zod';
import { Briefcase, Loader2, MapPin, User } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import * as z from 'zod';

// Modular Components
import AddressTab from '../shared/AddressTab';
import PersonalTab from './dialog/PersonalTab';
import ProfessionalTab from './dialog/ProfessionalTab';

/* ═════════════════════════════════════════════════════════
   VALIDATION SCHEMA
   ═════════════════════════════════════════════════════════ */
const teacherSchema = z.object({
  firstName: z.string().min(1, 'First name is required.'),
  lastName: z.string().min(1, 'Last name is required.'),
  email: z.string().email('Invalid email address.'),
  phoneNumber: z.string().optional(),
  profilePicture: z.any().optional(),
  qualification: z.string().optional(),
  specialization: z.string().optional(),
  yearsOfExperience: z.union([z.number(), z.string().transform(Number)]).optional(),
  employmentType: z.enum(['FULL_TIME', 'PART_TIME', 'CONTRACT']).optional(),
  salary: z.string().optional(),
  joiningDate: z.string().optional(),
  status: z.enum(['ACTIVE', 'ON_LEAVE', 'RESIGNED']).optional(),
  fullAddress: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  pincode: z.string().optional(),
  emergencyContactName: z.string().optional(),
  emergencyContactNumber: z.string().optional(),
  gender: z.enum(['MALE', 'FEMALE', 'OTHERS']).optional(),
});

const EMPTY = {
  firstName: '', lastName: '', email: '', phoneNumber: '', profilePicture: null,
  qualification: '', specialization: '', yearsOfExperience: '', employmentType: '',
  salary: '', joiningDate: '', status: 'ACTIVE',
  fullAddress: '', city: '', state: '', pincode: '',
  emergencyContactName: '', emergencyContactNumber: '',
  gender: '',
};

/* ═════════════════════════════════════════════════════════
   MAIN COMPONENT
   ═════════════════════════════════════════════════════════ */
export default function TeacherDialog({
  open,
  onOpenChange,
  editingTeacher,
  fetchTeachers,
  setNewTeacherCredentials
}) {
  const [activeTab, setActiveTab] = useState('personal');

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(teacherSchema),
    defaultValues: { ...EMPTY },
  });

  /* ── FILL FORM ON OPEN ── */
  useEffect(() => {
    if (open) {
      setActiveTab('personal');
      if (editingTeacher) {
        reset({
          firstName: editingTeacher.firstName || '',
          lastName: editingTeacher.lastName || '',
          email: editingTeacher.email || '',
          phoneNumber: editingTeacher.phoneNumber || '',
          profilePicture: null,
          qualification: editingTeacher.qualification || '',
          specialization: editingTeacher.specialization || '',
          yearsOfExperience: editingTeacher.yearsOfExperience ?? '',
          employmentType: editingTeacher.employmentType || '',
          salary: editingTeacher.salary != null ? String(editingTeacher.salary) : '',
          joiningDate: editingTeacher.joinDate ? editingTeacher.joinDate.slice(0, 10) : '',
          status: editingTeacher.status || (editingTeacher.active ? 'ACTIVE' : 'RESIGNED'),
          fullAddress: editingTeacher.fullAddress || '',
          city: editingTeacher.city || '',
          state: editingTeacher.state || '',
          pincode: editingTeacher.pincode || '',
          emergencyContactName: editingTeacher.emergencyContactName || '',
          emergencyContactNumber: editingTeacher.emergencyContactNumber || '',
          gender: editingTeacher.gender || '',
        });
      } else {
        reset({ ...EMPTY });
      }
    } else {
      reset();
    }
  }, [open, editingTeacher, reset]);

  /* ── SUBMIT ── */
  const onSubmit = async (data) => {
    const isEditing = !!editingTeacher;
    const formData = new FormData();

    formData.append('firstName', data.firstName);
    formData.append('lastName', data.lastName);
    formData.append('email', data.email);
    formData.append('phoneNumber', data.phoneNumber ?? '');

    if (data.profilePicture?.length) formData.append('profilePicture', data.profilePicture[0]);

    const optionals = [
      'qualification', 'specialization', 'employmentType',
      'salary', 'joiningDate', 'fullAddress', 'city', 'state', 'pincode',
      'emergencyContactName', 'emergencyContactNumber', 'status', 'gender',
    ];
    optionals.forEach((key) => { if (data[key]) formData.append(key, data[key]); });
    if (data.yearsOfExperience !== '' && data.yearsOfExperience != null) {
      formData.append('yearsOfExperience', String(data.yearsOfExperience));
    }

    const toastId = toast.loading(isEditing ? 'Updating faculty...' : 'Creating faculty...');

    try {
      const res = isEditing
        ? await apiClient.put(`/api/admin/teachers/${editingTeacher.id}`, formData)
        : await apiClient.post('/api/admin/teachers', formData);

      if (!isEditing && res.data?.password) {
        setNewTeacherCredentials({
          name: `${res.data.firstName} ${res.data.lastName}`,
          email: res.data.email,
          password: res.data.password
        });
      }

      toast.success(isEditing ? 'Teacher updated successfully' : 'Teacher created successfully', { id: toastId });
      fetchTeachers();
      onOpenChange(false);
    } catch (e) {
      toast.error(e.customMessage || 'Operation failed', { id: toastId });
    }
  };

  /* ── TAB CONFIG ── */
  const tabs = [
    { id: 'personal', label: 'Personal', icon: User },
    { id: 'professional', label: 'Professional', icon: Briefcase },
    { id: 'address', label: 'Address', icon: MapPin },
  ];

  const personalFields = ['firstName', 'lastName', 'email', 'phoneNumber'];
  const professionalFields = ['qualification', 'specialization', 'yearsOfExperience', 'salary'];
  const addressFields = ['fullAddress', 'city', 'state', 'pincode', 'emergencyContactName', 'emergencyContactNumber'];

  const tabErrors = {
    personal: personalFields.some((f) => errors[f]),
    professional: professionalFields.some((f) => errors[f]),
    address: addressFields.some((f) => errors[f]),
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl p-0 rounded-xl border-slate-200 shadow-xl bg-slate-50 flex flex-col max-h-[90vh] overflow-hidden">

        {/* HEADER */}
        <div className="bg-white border-b border-slate-200 px-6 py-5 shrink-0">
          <DialogTitle className="text-lg font-bold text-slate-900">
            {editingTeacher ? 'Edit Faculty Member' : 'Add New Faculty'}
          </DialogTitle>
          <DialogDescription className="text-slate-500 mt-1.5 text-sm">
            {editingTeacher
              ? 'Update existing records for this staff member.'
              : 'Enter details to register a new teacher in the system.'}
          </DialogDescription>
        </div>

        {/* FORM */}
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col flex-1 overflow-hidden">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full flex flex-col flex-1 overflow-hidden">

            {/* TABS */}
            <div className="px-6 pt-5 bg-slate-50 shrink-0">
              <TabsList className="w-full grid grid-cols-3 h-10 bg-slate-200/50 p-1 rounded-md">
                {tabs.map((tab) => (
                  <TabsTrigger
                    key={tab.id}
                    value={tab.id}
                    className="relative flex items-center justify-center gap-2 text-xs font-medium rounded-sm data-[state=active]:bg-white data-[state=active]:text-indigo-700 data-[state=active]:shadow-sm"
                  >
                    <tab.icon className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">{tab.label}</span>
                    {tabErrors[tab.id] && (
                      <span className="absolute top-1.5 right-2 h-1.5 w-1.5 rounded-full bg-red-500" />
                    )}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>

            {/* SCROLLABLE CONTENT */}
            <div className="flex-1 overflow-y-auto p-6">
              <TabsContent value="personal" className="mt-0 focus-visible:ring-0">
                <PersonalTab register={register} errors={errors} watch={watch} setValue={setValue} />
              </TabsContent>

              <TabsContent value="professional" className="mt-0 focus-visible:ring-0">
                <ProfessionalTab register={register} watch={watch} setValue={setValue} />
              </TabsContent>

              <TabsContent value="address" className="mt-0 focus-visible:ring-0">
                <AddressTab register={register} errors={errors} />
              </TabsContent>
            </div>

            {/* FOOTER */}
            <DialogFooter className="border-t border-slate-200 bg-white px-6 py-4 rounded-b-xl shrink-0">
              <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} className="mr-2 text-slate-600 hover:text-slate-900">
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting} className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm min-w-[120px]">
                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                {isSubmitting ? 'Saving...' : (editingTeacher ? 'Save Changes' : 'Create Teacher')}
              </Button>
            </DialogFooter>
          </Tabs>
        </form>
      </DialogContent>
    </Dialog>
  );
}