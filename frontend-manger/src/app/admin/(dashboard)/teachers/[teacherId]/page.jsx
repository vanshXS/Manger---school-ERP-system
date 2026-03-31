'use client';

import TeacherDialog from '@/components/admin/teachers/TeacherDialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import apiClient from '@/lib/axios';
import {
  AlertCircle, Ban, BookOpen, Briefcase, Calendar, CheckCircle2,
  ChevronDown,
  DollarSign, Edit, GraduationCap,
  Layers, Mail, MapPin, Phone, Power, Star, User, Users, XCircle
} from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';

/* ═══════════════════════════════════════════════════════════
   HELPERS
   ═══════════════════════════════════════════════════════════ */
function classLabel(assignment) {
  if (assignment.className && assignment.className.includes(' - ')) return assignment.className;
  if (assignment.gradeLevel) return `${assignment.gradeLevel} - ${assignment.className || assignment.section || ''}`;
  return assignment.className || assignment.section || 'Unknown Class';
}

function groupByClassroom(assignments = []) {
  const map = new Map();
  for (const a of assignments) {
    const key = a.classroomId;
    if (!map.has(key)) map.set(key, { classroomId: a.classroomId, label: classLabel(a), subjects: [] });
    map.get(key).subjects.push({ id: a.assignmentId, name: a.subjectName, mandatory: a.mandatory });
  }
  return Array.from(map.values());
}

const getImageUrl = (url) => {
  if (!url) return '';
  if (url.startsWith('http')) return url;
  return url;
};

const InfoItem = ({ icon: Icon, label, value, iconColor = 'text-slate-400', mono }) => {
  if (!value && value !== 0) return null;
  return (
    <div className="flex items-start gap-3 py-3 border-b border-slate-50 last:border-0">
      <div className={`mt-0.5 p-1.5 rounded-md bg-slate-50 ${iconColor}`}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium text-slate-500 mb-0.5">{label}</p>
        <p className={`text-sm text-slate-900 break-words ${mono ? 'font-mono' : ''}`}>{value}</p>
      </div>
    </div>
  );
};

const SectionCard = ({ icon: Icon, title, children }) => (
  <Card className="border-slate-200 shadow-sm">
    <CardHeader className="py-4 border-b border-slate-100 bg-slate-50/50">
      <CardTitle className="flex items-center gap-2 text-sm font-semibold text-slate-800">
        <Icon className="h-4 w-4 text-slate-500" />
        {title}
      </CardTitle>
    </CardHeader>
    <CardContent className="pt-4">{children}</CardContent>
  </Card>
);

const EmptyState = ({ icon: Icon, text }) => (
  <div className="flex flex-col items-center justify-center py-8 text-center">
    <Icon className="h-8 w-8 text-slate-300 mb-3" />
    <p className="text-slate-500 text-sm">{text}</p>
  </div>
);

/* ═══════════════════════════════════════════════════════════
   ASSIGNMENTS SECTION
   ═══════════════════════════════════════════════════════════ */
function AssignmentsSection({ assignments = [] }) {
  const [expandedId, setExpandedId] = useState(null);
  const grouped = groupByClassroom(assignments);

  if (grouped.length === 0) {
    return <EmptyState icon={BookOpen} text="No classroom assignments found for this faculty member." />;
  }

  return (
    <div className="divide-y divide-slate-100 border border-slate-200 rounded-lg bg-white overflow-hidden">
      {grouped.map((group) => {
        const isOpen = expandedId === group.classroomId;
        return (
          <div key={group.classroomId} className="transition-colors">
            <button
              onClick={() => setExpandedId(isOpen ? null : group.classroomId)}
              className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-slate-50 focus:outline-none"
            >
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center shrink-0">
                  <GraduationCap className="h-5 w-5 text-indigo-600" />
                </div>
                <div>
                  <p className="font-semibold text-slate-900 text-sm">{group.label}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{group.subjects.length} Subjects Assigned</p>
                </div>
              </div>
              <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
              <div className="bg-slate-50 px-6 py-4 border-t border-slate-100">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {group.subjects.map((subject) => (
                    <div key={subject.id} className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-md shadow-sm">
                      <span className="text-sm font-medium text-slate-700">{subject.name}</span>
                      <Badge variant="secondary" className={subject.mandatory ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}>
                        {subject.mandatory ? 'Core' : 'Elective'}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   MAIN PAGE
   ═══════════════════════════════════════════════════════════ */
export default function TeacherProfilePage() {
  const { teacherId } = useParams();
  const router = useRouter();
  const [teacher, setTeacher] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [toggling, setToggling] = useState(false);

  const fetchTeacher = async () => {
    try {
      const res = await apiClient.get(`/api/admin/teachers/${teacherId}`);
      setTeacher(res.data);
    } catch (err) {
      toast.error(err.customMessage || 'Failed to load teacher');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async () => {
    setToggling(true);
    try {
      await apiClient.patch(`/api/admin/teachers/${teacher.id}/status`, null, { params: { active: !teacher.active } });
      toast.success(teacher.active ? 'Faculty deactivated' : 'Faculty activated');
      fetchTeacher();
    } catch (err) {
      toast.error(err.customMessage || 'Failed to update status');
    } finally {
      setToggling(false);
    }
  };

  useEffect(() => { fetchTeacher(); }, [teacherId]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-6 flex gap-6">
        <Skeleton className="w-1/3 h-[500px] rounded-xl" />
        <Skeleton className="w-2/3 h-[500px] rounded-xl" />
      </div>
    );
  }

  if (!teacher) return null;

  const assignments = teacher.assignedClassrooms ?? [];
  const grouped = groupByClassroom(assignments);
  const totalSubjects = assignments.length;
  const totalClasses = grouped.length;

  const hasProfessional = teacher.qualification || teacher.specialization || teacher.yearsOfExperience != null || teacher.employmentType || teacher.salary != null || teacher.status;
  const hasAddress = teacher.fullAddress || teacher.city || teacher.state || teacher.pincode;
  const hasEmergency = teacher.emergencyContactName || teacher.emergencyContactNumber;

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-6 bg-slate-50 min-h-screen">
      <div className="flex flex-col lg:flex-row gap-6">

        {/* LEFT COLUMN: Profile Summary Card */}
        <div className="w-full lg:w-1/3 space-y-6">
          <Card className="border-slate-200 shadow-sm overflow-hidden">
            <div className={`h-2 w-full ${teacher.active ? 'bg-indigo-600' : 'bg-slate-300'}`} />
            <CardContent className="pt-8 pb-6 px-6 flex flex-col items-center text-center">
              <div className="relative mb-4">
                {teacher.profilePictureUrl ? (
                  <Dialog>
                    <DialogTrigger asChild>
                      <img
                        src={getImageUrl(teacher.profilePictureUrl)}
                        alt={`${teacher.firstName} ${teacher.lastName}`}
                        className="h-28 w-28 rounded-full object-cover border-4 border-white shadow-md cursor-pointer hover:opacity-90 transition-opacity"
                      />
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md p-0 overflow-hidden bg-transparent border-none shadow-none">
                      <DialogTitle className="sr-only">Profile Picture</DialogTitle>
                      <img src={getImageUrl(teacher.profilePictureUrl)} alt="Profile" className="w-full h-auto rounded-lg shadow-2xl" />
                    </DialogContent>
                  </Dialog>
                ) : (
                  <div className="h-28 w-28 rounded-full bg-indigo-50 border-2 border-indigo-100 flex items-center justify-center shadow-sm">
                    <span className="text-3xl font-bold text-indigo-600">
                      {teacher.firstName?.charAt(0)}{teacher.lastName?.charAt(0)}
                    </span>
                  </div>
                )}
                <div className={`absolute bottom-0 right-0 h-6 w-6 rounded-full border-2 border-white flex items-center justify-center shadow-sm ${teacher.active ? 'bg-emerald-500' : 'bg-slate-400'}`}>
                  {teacher.active ? <CheckCircle2 className="h-3 w-3 text-white" /> : <XCircle className="h-3 w-3 text-white" />}
                </div>
              </div>

              <h1 className="text-xl font-bold text-slate-900 mb-1">{teacher.firstName} {teacher.lastName}</h1>
              <p className="text-sm text-slate-500 mb-4">{teacher.specialization || 'Faculty Member'}</p>

              <div className="flex gap-2 w-full mb-6">
                <Button variant="outline" onClick={() => setIsEditOpen(true)} className="flex-1 h-9 bg-white">
                  <Edit className="h-4 w-4 mr-2" /> Edit
                </Button>
                <Button variant={teacher.active ? 'outline' : 'default'} disabled={toggling} onClick={handleToggleStatus} className={`flex-1 h-9 ${teacher.active ? 'text-amber-600 hover:text-amber-700 hover:bg-amber-50' : 'bg-emerald-600 hover:bg-emerald-700'}`}>
                  {teacher.active ? <><Ban className="h-4 w-4 mr-2 " /> Deactivate</> : <><Power className="h-4 w-4 mr-2" /> Activate</>}
                </Button>
              </div>

              <div className="w-full space-y-3 text-left border-t border-slate-100 pt-5 mt-2">
                {teacher.email && (
                  <div className="flex items-center gap-3 text-sm text-slate-600">
                    <Mail className="h-4 w-4 text-slate-400" />
                    <span className="truncate">{teacher.email}</span>
                  </div>
                )}
                {teacher.phoneNumber && (
                  <div className="flex items-center gap-3 text-sm text-slate-600">
                    <Phone className="h-4 w-4 text-slate-400" />
                    <span>{teacher.phoneNumber}</span>
                  </div>
                )}
                {teacher.joinDate && (
                  <div className="flex items-center gap-3 text-sm text-slate-600">
                    <Calendar className="h-4 w-4 text-slate-400" />
                    <span>Joined {teacher.joinDate}</span>
                  </div>
                )}
                {teacher.gender && (
                  <div className="flex items-center gap-3 text-sm text-slate-600 capitalize">
                    <User className="h-4 w-4 text-slate-400" />
                    <span>{teacher.gender.toLowerCase()}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 gap-4">
            <Card className="border-slate-200 shadow-sm">
              <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                <Layers className="h-5 w-5 text-indigo-500 mb-2" />
                <p className="text-2xl font-bold text-slate-800">{totalClasses}</p>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mt-1">Classes</p>
              </CardContent>
            </Card>
            <Card className="border-slate-200 shadow-sm">
              <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                <BookOpen className="h-5 w-5 text-emerald-500 mb-2" />
                <p className="text-2xl font-bold text-slate-800">{totalSubjects}</p>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mt-1">Subjects</p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* RIGHT COLUMN: Tabs for Details and Assignments */}
        <div className="w-full lg:w-2/3">
          <Tabs defaultValue="details" className="w-full">
            <TabsList className="w-full justify-start border-b border-slate-200 bg-transparent rounded-none h-auto p-0 mb-6 space-x-6">
              <TabsTrigger value="details" className="rounded-none border-b-2 border-transparent data-[state=active]:border-indigo-600 data-[state=active]:bg-transparent data-[state=active]:shadow-none px-0 py-3 text-sm font-medium">
                Detailed Profile
              </TabsTrigger>
              <TabsTrigger value="assignments" className="rounded-none border-b-2 border-transparent data-[state=active]:border-indigo-600 data-[state=active]:bg-transparent data-[state=active]:shadow-none px-0 py-3 text-sm font-medium">
                Classroom Assignments
              </TabsTrigger>
            </TabsList>

            <TabsContent value="details" className="space-y-6 focus-visible:outline-none">
              <SectionCard icon={Briefcase} title="Professional Background">
                {hasProfessional ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2">
                    <InfoItem icon={GraduationCap} label="Qualification" value={teacher.qualification} />
                    <InfoItem icon={Star} label="Specialization" value={teacher.specialization} />
                    <InfoItem icon={Calendar} label="Experience" value={teacher.yearsOfExperience != null ? `${teacher.yearsOfExperience} years` : null} />
                    <InfoItem icon={Briefcase} label="Employment Type" value={teacher.employmentType?.replace('_', ' ')} />
                    <InfoItem icon={DollarSign} label="Salary" value={teacher.salary != null ? `₹${teacher.salary.toLocaleString()}` : null} />
                    <InfoItem icon={CheckCircle2} label="Status" value={teacher.status?.replace('_', ' ')} />
                    <InfoItem icon={User} label="Gender" value={teacher.gender ? teacher.gender.toLowerCase() : null} className="capitalize" />
                  </div>
                ) : (
                  <EmptyState icon={Briefcase} text="No professional details recorded." />
                )}
              </SectionCard>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <SectionCard icon={MapPin} title="Address Details">
                  {hasAddress ? (
                    <div className="space-y-4">
                      {teacher.fullAddress && (
                        <div>
                          <p className="text-xs font-medium text-slate-500 mb-1">Full Address</p>
                          <p className="text-sm text-slate-800 leading-relaxed">{teacher.fullAddress}</p>
                        </div>
                      )}
                      <div className="grid grid-cols-2 gap-4">
                        {teacher.city && <div><p className="text-xs font-medium text-slate-500 mb-1">City</p><p className="text-sm text-slate-800">{teacher.city}</p></div>}
                        {teacher.state && <div><p className="text-xs font-medium text-slate-500 mb-1">State</p><p className="text-sm text-slate-800">{teacher.state}</p></div>}
                        {teacher.pincode && <div><p className="text-xs font-medium text-slate-500 mb-1">Pincode</p><p className="text-sm text-slate-800 font-mono">{teacher.pincode}</p></div>}
                      </div>
                    </div>
                  ) : (
                    <EmptyState icon={MapPin} text="No address on file." />
                  )}
                </SectionCard>

                <SectionCard icon={AlertCircle} title="Emergency Contact">
                  {hasEmergency ? (
                    <div className="space-y-2">
                      <InfoItem icon={Users} label="Contact Name" value={teacher.emergencyContactName} />
                      <InfoItem icon={Phone} label="Contact Number" value={teacher.emergencyContactNumber} />
                    </div>
                  ) : (
                    <EmptyState icon={AlertCircle} text="No emergency contact listed." />
                  )}
                </SectionCard>
              </div>
            </TabsContent>

            <TabsContent value="assignments" className="focus-visible:outline-none">
              <AssignmentsSection assignments={assignments} />
            </TabsContent>
          </Tabs>
        </div>
      </div>

      <TeacherDialog
        open={isEditOpen}
        onOpenChange={setIsEditOpen}
        editingTeacher={teacher}
        fetchTeachers={fetchTeacher}
        setNewTeacherCredentials={() => { }}
      />
    </div>
  );
}