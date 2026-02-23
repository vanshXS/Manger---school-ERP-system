'use client';

import { Button } from '@/components/ui/button';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogTitle
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import apiClient from '@/lib/axios';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  BookOpen,
  Loader2,
  MapPin,
  ShieldAlert, User, UserPlus, Users
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import * as z from 'zod';

// Modular Tab Components
import AddressTab from '../shared/AddressTab';
import AcademicTab from './dialog/AcademicTab';
import FamilyTab from './dialog/FamilyTab';
import PersonalTab from './dialog/PersonalTab';

/* ═══════════════════════════════════════════════════════════
   VALIDATION SCHEMA
   ═══════════════════════════════════════════════════════════ */
const studentSchema = z.object({
  firstName: z.string().min(1, 'First name is required.'),
  lastName: z.string().min(1, 'Last name is required.'),
  email: z.string().email('Invalid email address.'),
  phoneNumber: z.string().optional(),
  classroomId: z.string().optional(),
  profilePicture: z.any().optional(),
  fatherName: z.string().optional(),
  motherName: z.string().optional(),
  guardianName: z.string().optional(),
  parentPhonePrimary: z.string().optional(),
  parentPhoneSecondary: z.string().optional(),
  parentEmail: z.string().email().optional().or(z.literal('')),
  parentOccupation: z.string().optional(),
  annualIncome: z.string().optional(),
  fullAddress: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  pincode: z.string().optional(),
  emergencyContactName: z.string().optional(),
  emergencyContactNumber: z.string().optional(),
  medicalConditions: z.string().optional(),
  allergies: z.string().optional(),
  previousSchoolName: z.string().optional(),
  previousClass: z.string().optional(),
  admissionDate: z.string().optional(),
  transportRequired: z.boolean().optional(),
  hostelRequired: z.boolean().optional(),
  feeCategory: z.string().optional(),
  gender: z.enum(['MALE', 'FEMALE', 'OTHERS']).optional(),
});

const EMPTY = {
  firstName: '', lastName: '', email: '', phoneNumber: '', classroomId: '', profilePicture: null,
  fatherName: '', motherName: '', guardianName: '', parentPhonePrimary: '', parentPhoneSecondary: '',
  parentEmail: '', parentOccupation: '', annualIncome: '',
  fullAddress: '', city: '', state: '', pincode: '',
  emergencyContactName: '', emergencyContactNumber: '',
  medicalConditions: '', allergies: '', previousSchoolName: '', previousClass: '',
  admissionDate: '', transportRequired: false, hostelRequired: false, feeCategory: '',
  gender: '',
};


/* ═══════════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════════ */
export default function StudentDialog({
  open,
  onOpenChange,
  editingStudent,
  setEditingStudent,
  fetchStudents,
  newStudentCredentials,
  setNewStudentCredentials,
  classrooms = []
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
    resolver: zodResolver(studentSchema),
    defaultValues: { ...EMPTY },
  });

  const profilePictureFile = watch('profilePicture');
  const profilePictureName =
    profilePictureFile && profilePictureFile.length > 0
      ? profilePictureFile[0].name
      : null;

  /* ── FILL FORM ON OPEN ── */
  useEffect(() => {
    if (open) {
      setActiveTab('personal');
      if (editingStudent) {
        reset({
          firstName: editingStudent.firstName || '',
          lastName: editingStudent.lastName || '',
          email: editingStudent.email || '',
          phoneNumber: editingStudent.phoneNumber || '',
          classroomId: editingStudent.classroomResponseDTO?.id?.toString() || '',
          profilePicture: null,
          fatherName: editingStudent.fatherName || '',
          motherName: editingStudent.motherName || '',
          guardianName: editingStudent.guardianName || '',
          parentPhonePrimary: editingStudent.parentPhonePrimary || '',
          parentPhoneSecondary: editingStudent.parentPhoneSecondary || '',
          parentEmail: editingStudent.parentEmail || '',
          parentOccupation: editingStudent.parentOccupation || '',
          annualIncome: editingStudent.annualIncome || '',
          fullAddress: editingStudent.fullAddress || '',
          city: editingStudent.city || '',
          state: editingStudent.state || '',
          pincode: editingStudent.pincode || '',
          emergencyContactName: editingStudent.emergencyContactName || '',
          emergencyContactNumber: editingStudent.emergencyContactNumber || '',
          medicalConditions: editingStudent.medicalConditions || '',
          allergies: editingStudent.allergies || '',
          previousSchoolName: editingStudent.previousSchoolName || '',
          previousClass: editingStudent.previousClass || '',
          admissionDate: editingStudent.admissionDate ? editingStudent.admissionDate.slice(0, 10) : '',
          transportRequired: !!editingStudent.transportRequired,
          hostelRequired: !!editingStudent.hostelRequired,
          feeCategory: editingStudent.feeCategory || '',
          gender: editingStudent.gender || '',
        });
      } else {
        reset({ ...EMPTY });
      }
    } else {
      setEditingStudent(null);
      reset();
    }
  }, [open, editingStudent, reset, setEditingStudent]);

  /* ── SUBMIT ── */
  const onSubmit = async (data) => {
    const isEditing = !!editingStudent;
    const formData = new FormData();

    formData.append('firstName', data.firstName);
    formData.append('lastName', data.lastName);
    formData.append('email', data.email);
    if (data.phoneNumber) formData.append('phoneNumber', data.phoneNumber);
    if (data.classroomId && data.classroomId !== 'none') formData.append('classroomId', data.classroomId);
    if (data.profilePicture?.length) formData.append('profilePicture', data.profilePicture[0]);

    const optionals = [
      'fatherName', 'motherName', 'guardianName', 'parentPhonePrimary', 'parentPhoneSecondary',
      'parentEmail', 'parentOccupation', 'annualIncome', 'fullAddress', 'city', 'state', 'pincode',
      'medicalConditions', 'allergies', 'emergencyContactName', 'emergencyContactNumber',
      'previousSchoolName', 'previousClass', 'admissionDate', 'feeCategory', 'gender',
    ];
    optionals.forEach((key) => { if (data[key]) formData.append(key, data[key]); });
    if (data.transportRequired != null) formData.append('transportRequired', String(data.transportRequired));
    if (data.hostelRequired != null) formData.append('hostelRequired', String(data.hostelRequired));

    const toastId = toast.loading(isEditing ? 'Updating student...' : 'Creating student...');

    try {
      if (isEditing) {
        await apiClient.put(`/api/admin/students/${editingStudent.id}`, formData);
        const oldClassroomId = editingStudent.classroomResponseDTO?.id?.toString() || '';
        const newClassroomId = data.classroomId || '';
        if (newClassroomId && newClassroomId !== 'none' && oldClassroomId !== newClassroomId) {
          await apiClient.post(`/api/admin/students/${editingStudent.id}/assign-classroom/${newClassroomId}`);
        }
      } else {
        await apiClient.post('/api/admin/students', formData);
      }

      toast.success(isEditing ? 'Student updated!' : 'Student created!', { id: toastId });
      onOpenChange(false);
      fetchStudents();
    } catch (error) {
      toast.error(error.customMessage || 'Operation failed.', { id: toastId });
    }
  };

  const tabs = [
    { id: 'personal', label: 'Personal', icon: User },
    { id: 'family', label: 'Family', icon: Users },
    { id: 'address', label: 'Address', icon: MapPin },
    { id: 'academic', label: 'Academic', icon: BookOpen },
  ];

  const personalFields = ['firstName', 'lastName', 'email', 'phoneNumber'];
  const familyFields = ['fatherName', 'motherName', 'guardianName', 'parentPhonePrimary', 'parentPhoneSecondary', 'parentEmail', 'parentOccupation', 'annualIncome'];
  const addressFields = ['fullAddress', 'city', 'state', 'pincode', 'emergencyContactName', 'emergencyContactNumber'];
  const academicFields = ['previousSchoolName', 'previousClass', 'admissionDate', 'feeCategory', 'medicalConditions', 'allergies'];

  const tabErrors = {
    personal: personalFields.some((f) => errors[f]),
    family: familyFields.some((f) => errors[f]),
    address: addressFields.some((f) => errors[f]),
    academic: academicFields.some((f) => errors[f]),
  };


  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-2xl p-0 rounded-xl border-slate-200 shadow-xl bg-slate-50 flex flex-col max-h-[90vh] overflow-hidden">

          {/* HEADER (Fixed) */}
          <div className="bg-white border-b border-slate-200 px-6 py-5 shrink-0">
            <DialogTitle className="text-lg font-bold text-slate-900">
              {editingStudent ? 'Edit Student Profile' : 'New Student Admission'}
            </DialogTitle>
            <DialogDescription className="text-slate-500 mt-1.5 text-sm">
              {editingStudent
                ? 'Update student details and records.'
                : 'Fill in the form to register a new student. Personal info is required.'}
            </DialogDescription>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col flex-1 overflow-hidden">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full flex flex-col flex-1 overflow-hidden">

              {/* TAB BAR (Fixed) */}
              <div className="px-6 pt-5 bg-slate-50 shrink-0">
                <TabsList className="w-full grid grid-cols-4 h-10 bg-slate-200/50 p-1 rounded-md">
                  {tabs.map((tab) => (
                    <TabsTrigger
                      key={tab.id}
                      value={tab.id}
                      className="relative flex items-center justify-center gap-2 text-xs font-medium rounded-sm data-[state=active]:bg-white data-[state=active]:text-indigo-700 data-[state=active]:shadow-sm"
                    >
                      <tab.icon className="h-3.5 w-3.5 hidden sm:block" />
                      <span>{tab.label}</span>
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
                  <PersonalTab register={register} errors={errors} watch={watch} setValue={setValue} classrooms={classrooms} />
                </TabsContent>

                <TabsContent value="family" className="mt-0 focus-visible:ring-0">
                  <FamilyTab register={register} errors={errors} />
                </TabsContent>

                <TabsContent value="address" className="mt-0 focus-visible:ring-0">
                  <AddressTab register={register} errors={errors} />
                </TabsContent>

                <TabsContent value="academic" className="mt-0 focus-visible:ring-0">
                  <AcademicTab register={register} errors={errors} />
                </TabsContent>
              </div>

              {/* FOOTER (Fixed) */}
              <DialogFooter className="border-t border-slate-200 bg-white px-6 py-4 rounded-b-xl shrink-0">
                <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} className="mr-2 text-slate-600 hover:text-slate-900">
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting} className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm min-w-[120px]">
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {editingStudent ? 'Save Changes' : 'Register Student'}
                </Button>
              </DialogFooter>
            </Tabs>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── CREDENTIALS MODAL ── */}
      {newStudentCredentials && setNewStudentCredentials && (
        <Dialog open={true} onOpenChange={() => setNewStudentCredentials(null)}>
          <DialogContent className="sm:max-w-md rounded-xl p-0 overflow-hidden border-slate-200 shadow-xl">
            <div className="bg-white px-6 py-5 border-b border-slate-200 flex flex-col items-center">
              <div className="h-12 w-12 bg-emerald-50 rounded-full flex items-center justify-center mb-3 border border-emerald-100">
                <UserPlus className="h-6 w-6 text-emerald-600" />
              </div>
              <DialogTitle className="text-lg font-bold text-slate-900 text-center">Student Registered!</DialogTitle>
              <DialogDescription className="text-center text-slate-500 mt-1">
                A temporary password has been generated.
              </DialogDescription>
            </div>

            <div className="p-6 bg-slate-50">
              <div className="bg-white rounded-lg p-4 border border-slate-200 space-y-3 shadow-sm">
                <div className="flex justify-between items-center text-sm border-b border-slate-100 pb-2">
                  <span className="text-slate-500 font-medium">Name</span>
                  <span className="font-bold text-slate-900">{newStudentCredentials.name}</span>
                </div>
                <div className="flex justify-between items-center text-sm border-b border-slate-100 pb-2">
                  <span className="text-slate-500 font-medium">Email</span>
                  <span className="font-bold text-slate-900">{newStudentCredentials.email}</span>
                </div>
                <div className="pt-2 text-center">
                  <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">Temporary Password</Label>
                  <div className="bg-slate-50 border border-slate-200 py-3 rounded-md font-mono text-lg font-bold tracking-widest text-slate-900 select-all">
                    {newStudentCredentials.password}
                  </div>
                </div>
              </div>

              <div className="flex gap-2 items-center justify-center mt-4 p-3 bg-amber-50 rounded-md text-amber-800 text-xs border border-amber-200 font-medium">
                <ShieldAlert className="h-4 w-4 shrink-0" />
                <span>Save this password now; it will not be shown again.</span>
              </div>
            </div>

            <DialogFooter className="bg-white px-6 py-4 border-t border-slate-200 sm:justify-center">
              <Button onClick={() => setNewStudentCredentials(null)} className="w-full sm:w-auto bg-slate-900 hover:bg-slate-800 text-white">
                I have saved the credentials
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}