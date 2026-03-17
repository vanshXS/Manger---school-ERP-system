'use client';

import StudentDialog from '@/components/admin/students/StudentDialog';
import StudentProfile from '@/components/admin/students/StudentProfile';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import apiClient from '@/lib/axios';
import {
  Ban,
  CheckCircle2,
  ChevronRight,
  Edit,
  PauseCircle,
  Power,
  UserX
} from 'lucide-react';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';

export default function StudentProfilePage() {
  const { studentId } = useParams();

  const [student, setStudent] = useState(null);
  const [classrooms, setClassrooms] = useState([]);
  const [examResults, setExamResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingResults, setLoadingResults] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const fetchClassrooms = async () => {
    try {
      const res = await apiClient.get('/api/admin/classrooms');
      setClassrooms(res.data);
    } catch {
      toast.error('Failed to load classrooms');
    }
  };

  const fetchStudent = async () => {
    try {
      const res = await apiClient.get(`/api/admin/students/${studentId}`);
      setStudent(res.data);
    } catch {
      toast.error('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (newStatus) => {
    if (!student) return;
    setUpdatingStatus(true);
    try {
      await apiClient.patch(`/api/admin/students/${student.id}/active`, null, {
        params: { status: newStatus }
      });
      toast.success(`Student marked as ${newStatus}`);
      fetchStudent();
    } catch {
      toast.error('Status update failed');
    } finally {
      setUpdatingStatus(false);
    }
  };

  useEffect(() => {
    fetchStudent();
    fetchClassrooms();
    fetchExamResults();
  }, [studentId]);

  const fetchExamResults = async () => {
    try {
      setLoadingResults(true);
      const res = await apiClient.get(`/api/admin/students/${studentId}/exam-results?size=100`);
      setExamResults(res.data.content || []);
    } catch {
      toast.error('Failed to load exam results');
    } finally {
      setLoadingResults(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-6">
        <div className="flex justify-end">
          <Skeleton className="h-10 w-48 rounded-lg" />
        </div>
        <div className="flex gap-6">
          <Skeleton className="w-1/3 h-[500px] rounded-xl shadow-sm border border-slate-100" />
          <Skeleton className="w-2/3 h-[500px] rounded-xl shadow-sm border border-slate-100" />
        </div>
      </div>
    );
  }

  if (!student) return null;

  return (
    <div className="max-w-7xl mx-auto space-y-6 p-4 md:p-6 min-h-screen">
      <div className="flex justify-end mb-2 relative z-50">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={() => setIsEditOpen(true)}
            className="bg-white border-slate-200 text-slate-700 hover:bg-slate-50 font-medium rounded-lg h-10 px-4 shadow-sm"
          >
            <Edit className="h-4 w-4 mr-2 text-slate-400" /> Edit Profile
          </Button>

          <div className="relative group">
            <button
              disabled={updatingStatus}
              className={`flex items-center gap-2.5 h-10 px-4 rounded-lg shadow-sm text-white font-medium transition-colors cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed
                ${student.status === 'ACTIVE' ? 'bg-emerald-600 hover:bg-emerald-700' :
                  student.status === 'SUSPENDED' ? 'bg-amber-500 hover:bg-amber-600' :
                    'bg-slate-600 hover:bg-slate-700'
                }`}
            >
              {student.status === 'ACTIVE' && <Power className="h-4 w-4" />}
              {student.status === 'SUSPENDED' && <PauseCircle className="h-4 w-4" />}
              {student.status === 'INACTIVE' && <Ban className="h-4 w-4" />}
              <span className="capitalize">{student.status?.toLowerCase()}</span>
              <ChevronRight className="h-4 w-4 opacity-70 group-hover:rotate-90 transition-transform duration-300 ml-1" />
            </button>

            <div className="absolute right-0 top-full pt-2 w-56 opacity-0 invisible group-hover:opacity-100 group-hover:visible translate-y-[-10px] group-hover:translate-y-0 transition-all duration-300 ease-out origin-top-right">
              <div className="bg-white rounded-xl shadow-xl border border-slate-100 p-1.5 overflow-hidden ring-1 ring-black/5">
                <div className="px-3 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-50 mb-1">
                  Change Status
                </div>

                <button
                  onClick={() => handleStatusChange('ACTIVE')}
                  disabled={student.status === 'ACTIVE'}
                  className="w-full flex items-center px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 rounded-lg disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-slate-700 disabled:cursor-not-allowed transition-colors text-left"
                >
                  <CheckCircle2 className="mr-3 h-4 w-4 text-emerald-500" /> Activate
                </button>

                <button
                  onClick={() => handleStatusChange('SUSPENDED')}
                  disabled={student.status === 'SUSPENDED'}
                  className="w-full flex items-center px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-amber-50 hover:text-amber-700 rounded-lg disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-slate-700 disabled:cursor-not-allowed transition-colors text-left"
                >
                  <PauseCircle className="mr-3 h-4 w-4 text-amber-500" /> Suspend
                </button>

                <button
                  onClick={() => handleStatusChange('INACTIVE')}
                  disabled={student.status === 'INACTIVE'}
                  className="w-full flex items-center px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-100 hover:text-slate-900 rounded-lg disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-slate-700 disabled:cursor-not-allowed transition-colors text-left"
                >
                  <UserX className="mr-3 h-4 w-4 text-slate-500" /> Deactivate
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="relative z-10">
        <StudentProfile
          student={student}
          examResults={examResults}
          showAttendance={false}
          loadingResults={loadingResults}
          onEdit={() => setIsEditOpen(true)}
        />
      </div>

      <StudentDialog
        open={isEditOpen}
        onOpenChange={setIsEditOpen}
        editingStudent={student}
        setEditingStudent={() => { }}
        fetchStudents={fetchStudent}
        classrooms={classrooms}
      />
    </div>
  );
}
