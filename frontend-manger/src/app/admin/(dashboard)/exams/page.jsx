'use client';

import { NEXT_STATUS } from '@/components/admin/exams/examConstants';
import ExamDetailDialog from '@/components/admin/exams/ExamDetailDialog';
import ExamFilters from '@/components/admin/exams/ExamFilters';
import ExamFormDialog from '@/components/admin/exams/ExamFormDialog';
import ExamStatsBar from '@/components/admin/exams/ExamStatsBar';
import ExamTable from '@/components/admin/exams/ExamTable';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import apiClient from '@/lib/axios';
import {
  AlertTriangle,
  ClipboardList,
  Loader2,
  Plus,
  RefreshCw
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';

export default function ExamsPage() {
  const [exams, setExams] = useState([]);
  const [classrooms, setClassrooms] = useState([]);
  const [academicYears, setAcademicYears] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [filterYearId, setFilterYearId] = useState('');
  const [filterClassId, setFilterClassId] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [search, setSearch] = useState('');

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingExam, setEditingExam] = useState(null);
  const [deletingExam, setDeletingExam] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [statusExam, setStatusExam] = useState(null);
  const [detailExam, setDetailExam] = useState(null);

  const fetchMeta = useCallback(async () => {
    try {
      const crRes = await apiClient.get('/api/admin/classrooms');
      setClassrooms(crRes.data || []);
      const ayRes = await apiClient.get('/api/admin/academic-years');
      setAcademicYears(ayRes.data || []);
    } catch {
      toast.error('Failed to load metadata.');
    }
  }, []);

  const fetchExams = useCallback(async (silent = false) => {
    if (!silent) setIsLoading(true);
    else setIsRefreshing(true);

    try {
      const params = {};
      if (filterYearId) params.academicYearId = filterYearId;
      if (filterClassId) params.classroomId = filterClassId;
      if (filterStatus) params.status = filterStatus;

      const res = await apiClient.get('/api/admin/exams', { params });
      setExams(res.data || []);
    } catch (err) {
      toast.error(err.customMessage || 'Failed to load exams.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [filterClassId, filterStatus, filterYearId]);

  useEffect(() => {
    fetchMeta();
  }, [fetchMeta]);

  useEffect(() => {
    fetchExams();
  }, [fetchExams]);

  async function handleDelete() {
    if (!deletingExam) return;

    setIsDeleting(true);
    const tid = toast.loading('Deleting exam...');

    try {
      await apiClient.delete(`/api/admin/exams/${deletingExam.id}`);
      toast.success('Exam deleted.', { id: tid });
      setDeletingExam(null);
      fetchExams(true);
    } catch (err) {
      toast.error(err.customMessage || 'Delete failed.', { id: tid });
    } finally {
      setIsDeleting(false);
    }
  }

  async function handleStatusChange(exam) {
    const transition = NEXT_STATUS[exam.status];
    if (!transition) return;

    const tid = toast.loading('Completing exam...');
    try {
      await apiClient.patch(`/api/admin/exams/${exam.id}/status`, null, {
        params: { status: transition.next }
      });
      toast.success('Exam marked as completed.', { id: tid });
      setStatusExam(null);
      fetchExams(true);
    } catch (err) {
      toast.error(err.customMessage || 'Status update failed.', { id: tid });
    }
  }

  function clearFilters() {
    setFilterYearId('');
    setFilterClassId('');
    setFilterStatus('');
    setSearch('');
  }

  const displayed = exams.filter((exam) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      exam.name?.toLowerCase().includes(q) ||
      exam.classroomName?.toLowerCase().includes(q) ||
      exam.examType?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <span className="p-2 rounded-xl bg-blue-100 text-blue-600">
              <ClipboardList className="h-6 w-6" />
            </span>
            Exam Management
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Schedule, manage, and track all school examinations
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchExams(true)}
            disabled={isRefreshing}
            className="h-8 text-xs border-slate-200"
          >
            <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button
            size="sm"
            onClick={() => {
              setEditingExam(null);
              setIsFormOpen(true);
            }}
            className="h-8 text-xs bg-indigo-600 hover:bg-indigo-700"
          >
            <Plus className="h-3.5 w-3.5 mr-1.5" /> New Exam
          </Button>
        </div>
      </div>

      <ExamStatsBar exams={exams} />

      <ExamFilters
        search={search}
        onSearchChange={setSearch}
        filterYearId={filterYearId}
        onFilterYearChange={setFilterYearId}
        filterClassId={filterClassId}
        onFilterClassChange={setFilterClassId}
        filterStatus={filterStatus}
        onFilterStatusChange={setFilterStatus}
        classrooms={classrooms}
        academicYears={academicYears}
        onClear={clearFilters}
      />

      <ExamTable
        exams={displayed}
        isLoading={isLoading}
        onViewDetail={setDetailExam}
        onEdit={(exam) => {
          setEditingExam(exam);
          setIsFormOpen(true);
        }}
        onDelete={setDeletingExam}
        onStatusChange={setStatusExam}
        onCreateFirst={() => setIsFormOpen(true)}
      />

      <ExamFormDialog
        open={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditingExam(null);
        }}
        onSaved={() => fetchExams(true)}
        editingExam={editingExam}
        classrooms={classrooms}
      />

      <ExamDetailDialog
        open={!!detailExam}
        onClose={() => setDetailExam(null)}
        exam={detailExam}
      />

      <AlertDialog open={!!deletingExam} onOpenChange={() => setDeletingExam(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" /> Delete Exam
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>"{deletingExam?.name}"</strong>?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={isDeleting}
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete Exam
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!statusExam} onOpenChange={() => setStatusExam(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Complete Exam</AlertDialogTitle>
            <AlertDialogDescription>
              {statusExam && (
                <>
                  Mark <strong>"{statusExam.name}"</strong> as completed?
                  <span className="block mt-2 text-amber-600 font-medium">
                    Completed exams are locked for editing and marks entry.
                  </span>
                  <span className="block mt-2 text-slate-500">
                    Upcoming and ongoing statuses change automatically from the exam dates.
                  </span>
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-indigo-600 hover:bg-indigo-700"
              onClick={() => handleStatusChange(statusExam)}
            >
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
