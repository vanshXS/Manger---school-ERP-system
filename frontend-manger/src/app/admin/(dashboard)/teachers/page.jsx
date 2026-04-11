'use client';

import TeacherDialog from '@/components/admin/teachers/TeacherDialog';
import PaginationBar from '@/components/common/PaginationBar';
import TeacherTable from '@/components/admin/teachers/TeacherTable';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import apiClient from '@/lib/axios';
import { Search, UserPlus, Users } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';

export default function TeachersPage() {
  const [teachers, setTeachers] = useState([]);
  const [page, setPage] = useState(0);

  // 'null' = All, 'true' = Active, 'false' = Inactive
  const [currentTab, setCurrentTab] = useState('all');

  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
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
      setTotalElements(res.data.totalElements || 0);
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
      if (teachers.length === 1 && page > 0) {
        setPage((currentValue) => currentValue - 1);
      } else {
        fetchTeachers();
      }
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

  const handleSendReset = async (teacherId) => {
    if (!teacherId) return toast.error('Invalid teacher');
    try {
      await apiClient.post(`/api/admin/teachers/${teacherId}/send-password-reset`);
      toast.success('Password reset email sent');
    } catch (err) {
      toast.error(err.customMessage || 'Failed to send reset email');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 flex items-center gap-2 tracking-tight">
            <span className="p-2 rounded-xl bg-blue-100 text-blue-600"><Users className="h-6 w-6" /></span>
            Teachers
          </h1>
          <p className="text-sm text-slate-500 mt-1">Manage faculty members, status, and assignments</p>
        </div>
        <Button
          onClick={() => { setEditingTeacher(null); setIsDialogOpen(true); }}
          className="bg-primary hover:bg-primary/90 gap-2 h-9 text-sm shrink-0 shadow-sm"
        >
          <UserPlus className="h-4 w-4" />
          Add Teacher
        </Button>
      </div>

      {/* Search + Filters */}
      <div className="bg-white border border-slate-200/80 rounded-xl p-4 sm:p-5 space-y-3 shadow-sm">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search teachers by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-10 text-sm border-slate-200 rounded-xl"
          />
        </div>

        {/* Status filter pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 no-scrollbar">
          {[
            { label: 'All', val: 'all' },
            { label: 'Active', val: 'active' },
            { label: 'Inactive', val: 'inactive' },
          ].map(({ label, val }) => {
            const isActive = currentTab === val;
            return (
              <button key={val} onClick={() => setCurrentTab(val)}
                className={`shrink-0 h-8 px-4 rounded-xl text-xs font-semibold border transition-all duration-200 touch-manipulation ${isActive
                    ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:border-primary/40 hover:text-primary hover:bg-primary/5'
                  }`}>
                {label}
              </button>
            );
          })}
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
        onSendReset={handleSendReset}
      />

      {/* Pagination */}
      <PaginationBar
        pageData={{
          number: page,
          totalPages,
          totalElements,
          size: 10,
          numberOfElements: teachers.length
        }}
        itemLabel="teachers"
        onPageChange={setPage}
        isLoading={isLoading}
        className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm"
      />

      {/* Add / Edit Dialog */}
      <TeacherDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        editingTeacher={editingTeacher}
        fetchTeachers={fetchTeachers}
        newTeacherCredentials={newTeacherCredentials}
        setNewTeacherCredentials={setNewTeacherCredentials}
      />
    </div>
  );
}
