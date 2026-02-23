'use client';

import React, { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import apiClient from '@/lib/axios';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import {
  GraduationCap, UserPlus, Search, CheckCircle2, XCircle,
  PauseCircle, Ban, ArrowUpCircle, UserX, Loader2, Shield
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { TableSkeleton } from '@/components/admin/students/Skeletons';
import StudentDialog from '@/components/admin/students/StudentDialog';
import StudentSheet from '@/components/admin/students/StudentSheet';
import StudentTable from '@/components/admin/students/StudentTable';
import PaginationBar from '@/components/admin/students/PaginationBar';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogDescription, DialogFooter,
} from '@/components/ui/dialog';

/* ─────────────────────────────────────────────────────────────────────────────
   CLASSROOM DISPLAY NAME
   Backend: mapToStudentResponseDTO builds ClassroomResponseDTO with only:
     id, section, capacity, status, studentCount
   gradeLevel is NOT set there — but gradeLevel IS on the Classroom entity.

   FIX: The backend must include gradeLevel in the ClassroomResponseDTO
   built inside mapToStudentResponseDTO. Until then, we show section only.

   However — if classroomResponseDTO.gradeLevel IS present (after backend fix),
   GradeLevel serializes via @JsonValue so it arrives as string e.g. "Grade 10".
   This helper handles both cases safely.
─────────────────────────────────────────────────────────────────────────────── */
export function classroomDisplayName(cr) {
  if (!cr) return '—';
  // After backend fix: gradeLevel arrives as "Grade 10" string (@JsonValue)
  if (cr.gradeLevel && cr.section) {
    return `${cr.gradeLevel} - ${cr.section.toUpperCase()}`;
  }
  // Fallback if only section available (current backend state)
  return cr.section ? `Section ${cr.section.toUpperCase()}` : '—';
}

/* ─────────────────────────────────────────────────────────────────────────────
   STATUS CONFIG — all StudentStatus enum values from backend
─────────────────────────────────────────────────────────────────────────────── */
export const STATUS_CONFIG = {
  ACTIVE:      { label: 'Active',      icon: CheckCircle2,  pill: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  INACTIVE:    { label: 'Inactive',    icon: XCircle,       pill: 'bg-slate-100   text-slate-500   border-slate-200'   },
  PROMOTED:    { label: 'Promoted',    icon: ArrowUpCircle, pill: 'bg-indigo-100  text-indigo-700  border-indigo-200'  },
  DETAINED:    { label: 'Detained',    icon: PauseCircle,   pill: 'bg-amber-100   text-amber-700   border-amber-200'   },
  GRADUATED:   { label: 'Graduated',   icon: GraduationCap, pill: 'bg-violet-100  text-violet-700  border-violet-200'  },
  SUSPENDED:   { label: 'Suspended',   icon: PauseCircle,   pill: 'bg-orange-100  text-orange-700  border-orange-200'  },
  DROPPED_OUT: { label: 'Dropped Out', icon: UserX,         pill: 'bg-red-100     text-red-700     border-red-200'     },
  TC_ISSUED:   { label: 'TC Issued',   icon: Shield,        pill: 'bg-zinc-100    text-zinc-600    border-zinc-200'    },
  TRANSFERRED: { label: 'Transferred', icon: Ban,           pill: 'bg-zinc-100    text-zinc-600    border-zinc-200'    },
};

export function StatusBadge({ status }) {
  const cfg  = STATUS_CONFIG[status] ?? { label: status ?? '—', icon: XCircle, pill: 'bg-slate-100 text-slate-500 border-slate-200' };
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full border ${cfg.pill}`}>
      <Icon className="h-3 w-3 shrink-0" />{cfg.label}
    </span>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   FILTER TABS
─────────────────────────────────────────────────────────────────────────────── */
const STATUS_FILTERS = [
  { label: 'All',         val: null          },
  { label: 'Active',      val: 'ACTIVE'      },
  { label: 'Inactive',    val: 'INACTIVE'    },
  { label: 'Suspended',   val: 'SUSPENDED'   },
  
];

/* ─────────────────────────────────────────────────────────────────────────────
   MAIN PAGE
─────────────────────────────────────────────────────────────────────────────── */
export default function StudentsPage() {
  const router       = useRouter();
  const pathname     = usePathname();
  const searchParams = useSearchParams();

  /* URL as state */
  const currentPage   = parseInt(searchParams.get('page') || '1', 10) - 1;
  const currentSearch = searchParams.get('search') || '';
  const currentStatus = searchParams.get('status') || null;

  /* Local state */
  const [students,    setStudents]    = useState([]);
  const [classrooms,  setClassrooms]  = useState([]);
  const [totalPages,  setTotalPages]  = useState(0);
  const [isLoading,   setIsLoading]   = useState(true);
  const [searchInput, setSearchInput] = useState(currentSearch);

  const [isAddEditOpen,           setIsAddEditOpen]           = useState(false);
  const [editingStudent,          setEditingStudent]          = useState(null);
  const [isSheetOpen,             setIsSheetOpen]             = useState(false);
  const [selectedStudentForSheet, setSelectedStudentForSheet] = useState(null);
  const [selectedStudentSubjects, setSelectedStudentSubjects] = useState([]);
  const [allSubjects,             setAllSubjects]             = useState([]);
  const [isDeleteOpen,            setIsDeleteOpen]            = useState(false);
  const [studentToDelete,         setStudentToDelete]         = useState(null);
  const [isDeleting,              setIsDeleting]              = useState(false);

  /* URL helper */
  const updateFilters = useCallback((updates) => {
    const params = new URLSearchParams(searchParams);
    Object.entries(updates).forEach(([key, value]) => {
      if (value === null || value === undefined || value === '') params.delete(key);
      else params.set(key, value);
    });
    if (updates.search !== undefined || updates.status !== undefined) params.set('page', '1');
    router.replace(`${pathname}?${params.toString()}`);
  }, [pathname, router, searchParams]);

  /* Debounce search */
  useEffect(() => {
    if (searchInput !== currentSearch) {
      const t = setTimeout(() => updateFilters({ search: searchInput }), 400);
      return () => clearTimeout(t);
    }
  }, [searchInput, currentSearch, updateFilters]);

  /* Fetch classrooms once */
  useEffect(() => {
    apiClient.get('/api/admin/classrooms')
      .then(res => setClassrooms(res.data || []))
      .catch(() => toast.error('Failed to load classrooms'));
  }, []);

  /* Fetch students on URL change */
  const fetchStudents = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await apiClient.get('/api/admin/students', {
        params: {
          page: currentPage, size: 10,
          search: currentSearch || undefined,
          status: currentStatus || undefined,
        },
      });
      setStudents(res.data.content || []);
      setTotalPages(res.data.totalPages || 0);
    } catch { toast.error('Failed to load students'); }
    finally   { setIsLoading(false); }
  }, [currentPage, currentSearch, currentStatus]);

  useEffect(() => { fetchStudents(); }, [fetchStudents]);

  /* Actions */
  const handleUpdateStatus = async (id, newStatus) => {
    try {
      await apiClient.patch(`/api/admin/students/${id}/active`, null, { params: { status: newStatus } });
      toast.success(`Status → ${STATUS_CONFIG[newStatus]?.label ?? newStatus}`);
      fetchStudents();
    } catch { toast.error('Failed to update status'); }
  };

  const handleDownloadSlip = async (studentId) => {
    const tid = toast.loading('Generating slip…');
    try {
      const res = await apiClient.get(`/api/admin/students/${studentId}/slip`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const a = Object.assign(document.createElement('a'), { href: url, download: `student_${studentId}_slip.pdf` });
      document.body.appendChild(a); a.click(); a.remove();
      toast.success('Download started', { id: tid });
    } catch { toast.error('Failed to generate slip', { id: tid }); }
  };

  const handleSendReset = async (studentId) => {
    try {
      await apiClient.post(`/api/admin/students/${studentId}/send-password-reset`);
      toast.success('Reset email sent');
    } catch { toast.error('Failed to send reset email'); }
  };

  const handleManageSubjects = async (student) => {
    if (!student.classroomResponseDTO?.id) {
      toast.error('Student must be assigned to a classroom first'); return;
    }
    try {
      const [assigned, available] = await Promise.all([
        apiClient.get(`/api/admin/students/subjects/${student.id}`),
        apiClient.get(`/api/admin/students/${student.classroomResponseDTO.id}/subjects`),
      ]);
      setSelectedStudentSubjects(assigned.data);
      setAllSubjects(available.data);
      setSelectedStudentForSheet(student);
      setIsSheetOpen(true);
    } catch { toast.error('Failed to load subjects'); }
  };

  const confirmDelete = async () => {
    if (!studentToDelete) return;
    setIsDeleting(true);
    try {
      await apiClient.delete(`/api/admin/students/${studentToDelete}`);
      toast.success('Student deleted');
      fetchStudents();
    } catch { toast.error('Failed to delete student'); }
    finally {
      setIsDeleting(false); setIsDeleteOpen(false); setStudentToDelete(null);
    }
  };

  const activeFilterCfg = currentStatus ? STATUS_CONFIG[currentStatus] : null;

  return (
    <div className="space-y-5">

      {/* ── HEADER ── */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 flex items-center gap-2 tracking-tight">
            <span className="p-2 rounded-xl bg-blue-100 text-blue-600"><GraduationCap className="h-6 w-6" /></span>
            Students
          </h1>
          <p className="text-sm text-slate-500 mt-1">Manage enrollment, status and academic records</p>
        </div>
        <Button onClick={() => { setEditingStudent(null); setIsAddEditOpen(true); }}
          className="bg-primary hover:bg-primary/90 gap-2 h-9 text-sm shrink-0 shadow-sm">
          <UserPlus className="h-4 w-4" /> Add Student
        </Button>
      </div>

      {/* ── SEARCH + FILTERS ── */}
      <div className="bg-white border border-slate-200/80 rounded-xl shadow-sm p-4 sm:p-5 space-y-3">
        {/* Search */}
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
            placeholder="Search by name, roll no, email…"
            className="pl-9 h-10 text-sm border-slate-200 rounded-xl"
          />
        </div>

        {/* Status filter pills — scrollable on mobile */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 no-scrollbar">
          {STATUS_FILTERS.map(({ label, val }) => {
            const isActive = currentStatus === val;
            return (
              <button key={label} onClick={() => updateFilters({ status: val })}
                className={`shrink-0 h-8 px-4 rounded-xl text-xs font-semibold border transition-all duration-200 touch-manipulation ${
                  isActive
                    ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:border-primary/40 hover:text-primary hover:bg-primary/5'
                }`}>
                {label}
              </button>
            );
          })}
        </div>

        {/* Active filter indicator */}
        {currentStatus && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">Filtering by:</span>
            <StatusBadge status={currentStatus} />
            <button onClick={() => updateFilters({ status: null })}
              className="text-xs text-slate-400 hover:text-red-500 transition-colors ml-1">
              ✕ Clear
            </button>
          </div>
        )}
      </div>

      {/* ── TABLE ── */}
      <div className="bg-white border border-slate-200/80 rounded-xl shadow-sm overflow-hidden">
        {isLoading ? (
          <TableSkeleton />
        ) : students.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 sm:py-20 text-center px-4">
            <div className="p-4 bg-slate-100 rounded-2xl mb-4">
              <GraduationCap className="h-10 w-10 text-slate-400" />
            </div>
            <p className="font-semibold text-slate-700 text-lg">No students found</p>
            <p className="text-sm text-slate-500 mt-1 mb-6 max-w-sm">
              {currentSearch
                ? `No results for "${currentSearch}"`
                : currentStatus
                ? `No students with status "${STATUS_CONFIG[currentStatus]?.label}"`
                : 'Add your first student to get started'}
            </p>
            {!currentSearch && !currentStatus && (
              <Button onClick={() => { setEditingStudent(null); setIsAddEditOpen(true); }}
                className="bg-primary hover:bg-primary/90 gap-2 shadow-sm">
                <UserPlus className="h-4 w-4" /> Add Student
              </Button>
            )}
          </div>
        ) : (
          <StudentTable
            students={students}
            classroomDisplayName={classroomDisplayName}
            StatusBadge={StatusBadge}
            onEdit={s => { setEditingStudent(s); setIsAddEditOpen(true); }}
            onManageSubjects={handleManageSubjects}
            onUpdateStatus={handleUpdateStatus}
            onDownloadSlip={handleDownloadSlip}
            onSendReset={handleSendReset}
            onDelete={id => { setStudentToDelete(id); setIsDeleteOpen(true); }}
            onRowClick={s => router.push(`/admin/students/${s.id}`)}
          />
        )}
      </div>

      {/* ── PAGINATION ── */}
      <PaginationBar
        page={currentPage}
        totalPages={totalPages}
        searchParams={searchParams}
        pathname={pathname}
        router={router}
      />

      {/* ── DIALOGS ── */}
      <StudentDialog
        open={isAddEditOpen}
        onOpenChange={setIsAddEditOpen}
        editingStudent={editingStudent}
        setEditingStudent={setEditingStudent}
        fetchStudents={fetchStudents}
        classrooms={classrooms}
      />

      <StudentSheet
        isOpen={isSheetOpen}
        setIsOpen={setIsSheetOpen}
        selectedStudent={selectedStudentForSheet}
        selectedSubjects={selectedStudentSubjects}
        setSelectedSubjects={setSelectedStudentSubjects}
        allSubjects={allSubjects}
      />

      {/* Delete confirmation */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="p-1.5 bg-red-100 rounded-lg">
                <UserX className="h-4 w-4 text-red-600" />
              </div>
              Delete Student
            </DialogTitle>
            <DialogDescription asChild>
              <div className="space-y-2 pt-1 text-sm">
                <p className="text-slate-600">This will permanently remove the student and all their data.</p>
                <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-xs text-amber-800 space-y-1">
                  <p className="font-semibold">⚠ Before deleting:</p>
                  <p>• Student status must be <strong>INACTIVE</strong></p>
                  <p>• All enrollments and subject records will be removed</p>
                  <p>• This action cannot be undone</p>
                </div>
              </div>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 mt-2">
            <Button variant="outline" onClick={() => setIsDeleteOpen(false)} className="h-9 text-sm rounded-xl">Cancel</Button>
            <Button variant="destructive" onClick={confirmDelete} disabled={isDeleting} className="h-9 text-sm gap-2 rounded-xl">
              {isDeleting
                ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Deleting…</>
                : 'Yes, Delete Student'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}