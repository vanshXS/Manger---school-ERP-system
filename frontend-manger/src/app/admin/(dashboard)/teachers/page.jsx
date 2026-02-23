'use client';

import TeacherDialog from '@/components/admin/teachers/TeacherDialog';
import TeacherTable from '@/components/admin/teachers/TeacherTable';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import apiClient from '@/lib/axios';
import { Search, ShieldAlert, UserPlus, Users } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';

export default function TeachersPage() {
  const [teachers, setTeachers] = useState([]);
  const [page, setPage] = useState(0);

  // 'null' = All, 'true' = Active, 'false' = Inactive
  const [currentTab, setCurrentTab] = useState('all');

  const [totalPages, setTotalPages] = useState(0);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState(search);

  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState(null);
  const [newTeacherCredentials, setNewTeacherCredentials] = useState(null);

  const getActiveParam = (tab) => {
    if (tab === 'active') return true;
    if (tab === 'inactive') return false;
    return null; 
  };

  const fetchTeachers = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await apiClient.get('/api/admin/teachers', {
        params: {
          page,
          size: 10,
          active: getActiveParam(currentTab),
          search: debouncedSearch || undefined,
        },
      });

      setTeachers(res.data.content || []);
      setTotalPages(res.data.totalPages || 0);
    } catch (e) {
      toast.error('Failed to fetch teachers' || e.customMessage);
    } finally {
      setIsLoading(false);
    }
  }, [page, currentTab, debouncedSearch]); 

  useEffect(() => {
    fetchTeachers();
  }, [fetchTeachers]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 200);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    setPage(0);
  }, [debouncedSearch, currentTab]);

  const handleToggleTeacherStatus = async (teacherId, active) => {
    try {
      await apiClient.patch(
        `/api/admin/teachers/${teacherId}/status`,
        null,
        { params: { active } }
      );
      toast.success(active ? 'Teacher activated' : 'Teacher deactivated');
      fetchTeachers();
    } catch (err) {
      toast.error(err.customMessage || 'Failed to update status');
    }
  };

  const handleDelete = async (teacherId) => {
    try {
      await apiClient.delete(`/api/admin/teachers/${teacherId}`);
      toast.success('Teacher deleted');
      setTeachers((prev) => prev.filter((t) => t.id !== teacherId));
      if (teachers.length === 1 && page > 0) setPage(p => p - 1);
    } catch (e) {
      toast.error(e.customMessage || 'Failed to delete teacher');
    }
  };

  const handleDownloadSlip = async (teacherId) => {
    if (!teacherId) return toast.error('Invalid teacher');
    try {
      const res = await apiClient.get(`/api/admin/teachers/${teacherId}/slip`, { responseType: 'blob' });
      const blob = new Blob([res.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `teacher_${teacherId}_slip.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success('Teacher slip downloaded');
    } catch (err) {
      toast.error(err.customMessage || 'Failed to download slip');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 flex items-center gap-2 tracking-tight">
            <span className="p-2 rounded-xl bg-blue-100 text-blue-600"><Users className="h-6 w-6" /></span>
            Teachers
          </h1>
          <p className="text-sm text-slate-500 mt-1">Manage faculty members, status, and assignments</p>
        </div>
        <Button 
          onClick={() => { setEditingTeacher(null); setIsDialogOpen(true); }}
          className="bg-primary hover:bg-primary/90 shadow-sm font-semibold h-10 px-5 rounded-xl"
        >
          <UserPlus className="mr-2 h-5 w-5" />
          Add Teacher
        </Button>
      </div>

      {/* Search */}
      <div className="bg-white border border-slate-200/80 rounded-xl p-4 sm:p-5 shadow-sm">
        <div className="relative max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search teachers by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 h-10 text-sm border-slate-200 rounded-xl"
          />
        </div>
      </div>

      {/* Table */}
      <TeacherTable
        teachers={teachers}
        isLoading={isLoading}
        currentTab={currentTab}
        onTabChange={setCurrentTab}
        onToggleStatus={handleToggleTeacherStatus}
        onEdit={(t) => { setEditingTeacher(t); setIsDialogOpen(true); }}
        onDelete={handleDelete}
        onDownloadSlip={handleDownloadSlip}
      />

      {/* Pagination */}
      {totalPages > 0 && (
        <div className="flex justify-end items-center gap-4 mt-6 bg-white p-3 rounded-2xl border border-slate-200 shadow-sm w-fit ml-auto">
          <Button
            variant="outline"
            className="rounded-lg font-medium"
            disabled={page === 0 || isLoading}
            onClick={() => setPage((p) => p - 1)}
          >
            Prev
          </Button>
          <span className="text-sm font-bold text-slate-600">
            Page {page + 1} of {totalPages}
          </span>
          <Button
            variant="outline"
            className="rounded-lg font-medium"
            disabled={page + 1 >= totalPages || isLoading}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </Button>
        </div>
      )}

      {/* Add / Edit Dialog */}
      <TeacherDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        editingTeacher={editingTeacher}
        fetchTeachers={fetchTeachers}
        setNewTeacherCredentials={setNewTeacherCredentials}
      />

      {/* Credentials Modal */}
      {newTeacherCredentials && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-2xl p-0 max-w-md w-full animate-in fade-in zoom-in-95 duration-200 overflow-hidden">
            <div className="bg-emerald-50 border-b border-emerald-100 p-6 flex flex-col items-center text-center">
              <div className="h-14 w-14 bg-white rounded-full flex items-center justify-center shadow-sm mb-4">
                <ShieldAlert className="h-7 w-7 text-emerald-600" />
              </div>
              <h3 className="text-xl font-extrabold text-emerald-900">Account Created</h3>
              <p className="text-sm font-medium text-emerald-700 mt-1">Please securely share these credentials with the teacher.</p>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-500 font-medium">Name</span>
                  <span className="font-bold text-slate-900">{newTeacherCredentials.name}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-500 font-medium">Email</span>
                  <span className="font-bold text-slate-900">{newTeacherCredentials.email}</span>
                </div>
                <div className="pt-3 border-t border-slate-200 mt-3">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">Temporary Password</p>
                  <div className="font-mono bg-white border border-slate-200 p-3 rounded-xl select-all text-xl text-center font-bold tracking-wider text-slate-800 shadow-inner">
                    {newTeacherCredentials.password}
                  </div>
                </div>
              </div>
              <p className="text-xs font-semibold text-amber-600 text-center flex items-center justify-center gap-1.5 bg-amber-50 py-2 rounded-lg">
                <ShieldAlert className="h-4 w-4" /> Copy this password now. It will not be shown again.
              </p>
            </div>
            <div className="p-4 bg-slate-50 border-t border-slate-100">
              <Button className="w-full h-11 text-base font-semibold rounded-xl" onClick={() => setNewTeacherCredentials(null)}>
                I have copied the credentials
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}