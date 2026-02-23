'use client';

import apiClient from '@/lib/axios';
import { GitPullRequest } from 'lucide-react';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';

// Modular Components
import AssignmentsWorkspace from '@/components/admin/assignments/AssignmentsWorkspace';
import ClassroomSelector from '@/components/admin/assignments/ClassroomSelector';
import TeacherAssignmentDialog from '@/components/admin/assignments/TeacherAssignmentDialog';

export default function AssignmentsPage() {
  // === Data States ===
  const [classrooms, setClassrooms] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [assignments, setAssignments] = useState([]);

  // === UI States ===
  const [selectedClassroom, setSelectedClassroom] = useState(null);
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [loadingAssignments, setLoadingAssignments] = useState(false);
  const [busySubjectId, setBusySubjectId] = useState(null);

  // === Filter States ===
  const [classroomSearch, setClassroomSearch] = useState('');
  const [subjectSearch, setSubjectSearch] = useState('');
  const [teacherSearch, setTeacherSearch] = useState('');
  const [showOnlyAssigned, setShowOnlyAssigned] = useState(false);

  // === Dialog States ===
  const [teacherDialogOpen, setTeacherDialogOpen] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState(null);
  const [selectedTeacherId, setSelectedTeacherId] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  /* ===================================================================== */
  /* 1. INITIAL DATA LOAD                                                   */
  /* ===================================================================== */
  useEffect(() => {
    const loadInitial = async () => {
      try {
        const [c, s, t] = await Promise.all([
          apiClient.get('/api/admin/classrooms'),
          apiClient.get('/api/admin/subjects'),
          apiClient.get('/api/admin/teachers'),
        ]);
        setClassrooms(c.data || []);
        setSubjects(s.data || []);
        setTeachers(Array.isArray(t.data) ? t.data : t.data.content || []);
      } catch (err) {
        toast.error('Failed to load system data');
      } finally {
        setLoadingInitial(false);
      }
    };
    loadInitial();
  }, []);

  /* ===================================================================== */
  /* 2. FETCH ASSIGNMENTS (When Classroom Changes)                          */
  /* ===================================================================== */
  useEffect(() => {
    if (!selectedClassroom) return;
    const fetchAssignments = async () => {
      setLoadingAssignments(true);
      try {
        const res = await apiClient.get(`/api/admin/assignments/by-classroom/${selectedClassroom.id}`);
        setAssignments(res.data || []);
      } catch (err) {
        toast.error('Failed to load assignments');
        setAssignments([]);
      } finally {
        setLoadingAssignments(false);
      }
    };
    fetchAssignments();
  }, [selectedClassroom]);

  /* ===================================================================== */
  /* 3. ACTIONS: SUBJECTS                                                   */
  /* ===================================================================== */
  const handleToggleSubject = async (subject) => {
    if (!selectedClassroom || busySubjectId === subject.id) return;
    setBusySubjectId(subject.id);
    const existing = assignments.find(a => a.subjectId === subject.id);
    try {
      if (existing) {
        await apiClient.delete(`/api/admin/assignments/${existing.assignmentId}`);
        setAssignments(prev => prev.filter(a => a.assignmentId !== existing.assignmentId));
        toast.success(`Removed ${subject.name}`);
      } else {
        const res = await apiClient.post('/api/admin/assignments', {
          classroomId: selectedClassroom.id,
          subjectId: subject.id,
          mandatory: false,
        });
        setAssignments(prev => [...prev, res.data]);
        toast.success(`Assigned ${subject.name}`);
      }
    } catch (err) {
      toast.error('Operation failed');
    } finally {
      setBusySubjectId(null);
    }
  };

  const handleToggleMandatory = async (assignment, newVal) => {
    setAssignments(prev =>
      prev.map(a => a.assignmentId === assignment.assignmentId ? { ...a, mandatory: newVal } : a)
    );
    try {
      await apiClient.patch(`/api/admin/assignments/${assignment.assignmentId}/mandatory`, { mandatory: newVal });
    } catch (err) {
      toast.error('Failed to update mandatory status');
      setAssignments(prev =>
        prev.map(a => a.assignmentId === assignment.assignmentId ? { ...a, mandatory: !newVal } : a)
      );
    }
  };

  /* ===================================================================== */
  /* 4. ACTIONS: TEACHERS                                                   */
  /* ===================================================================== */
  const openTeacherDialog = (assignment) => {
    setEditingAssignment(assignment);
    setSelectedTeacherId(assignment.teacherId || null);
    setTeacherSearch('');
    setTeacherDialogOpen(true);
  };

  const handleAssignTeacher = async () => {
    if (!editingAssignment || !selectedTeacherId) return;
    setSubmitting(true);
    try {
      const res = await apiClient.put(
        `/api/admin/assignments/${editingAssignment.assignmentId}/teacher`,
        { teacherId: selectedTeacherId }
      );
      setAssignments(prev => prev.map(a => a.assignmentId === res.data.assignmentId ? res.data : a));
      toast.success('Teacher assigned');
      setTeacherDialogOpen(false);
    } catch (err) {
      toast.error(err.customMessage || 'Failed to assign teacher');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemoveTeacher = async () => {
    if (!editingAssignment) return;
    setSubmitting(true);
    try {
      const res = await apiClient.delete(`/api/admin/assignments/${editingAssignment.assignmentId}/teacher`);
      setAssignments(prev => prev.map(a => a.assignmentId === res.data.assignmentId ? res.data : a));
      toast.success('Teacher removed');
      setTeacherDialogOpen(false);
    } catch (err) {
      toast.error('Failed to remove teacher');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-5 lg:p-7 space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 bg-blue-600 rounded-lg shadow-sm">
          <GitPullRequest className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Assignments</h1>
          <p className="text-sm text-slate-500">Map subjects to classrooms and assign teachers</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* ── LEFT: Classroom Selector ──────────────────────────────────── */}
        <div className="lg:col-span-3">
          <ClassroomSelector
            classrooms={classrooms}
            selectedClassroom={selectedClassroom}
            setSelectedClassroom={setSelectedClassroom}
            loading={loadingInitial}
            searchQuery={classroomSearch}
            setSearchQuery={setClassroomSearch}
          />
        </div>

        {/* ── RIGHT: Workspace ──────────────────────────────────────────── */}
        <div className="lg:col-span-9 space-y-4">
          <AssignmentsWorkspace
            selectedClassroom={selectedClassroom}
            assignments={assignments}
            subjects={subjects}
            loading={loadingAssignments}
            busySubjectId={busySubjectId}
            showOnlyAssigned={showOnlyAssigned}
            setShowOnlyAssigned={setShowOnlyAssigned}
            subjectSearch={subjectSearch}
            setSubjectSearch={setSubjectSearch}
            handleToggleSubject={handleToggleSubject}
            handleToggleMandatory={handleToggleMandatory}
            openTeacherDialog={openTeacherDialog}
          />
        </div>
      </div>

      {/* ── Teacher Assignment Dialog ─────────────────────────────────────── */}
      <TeacherAssignmentDialog
        isOpen={teacherDialogOpen}
        onOpenChange={setTeacherDialogOpen}
        editingAssignment={editingAssignment}
        selectedClassroom={selectedClassroom}
        teachers={teachers}
        teacherSearch={teacherSearch}
        setTeacherSearch={setTeacherSearch}
        selectedTeacherId={selectedTeacherId}
        setSelectedTeacherId={setSelectedTeacherId}
        submitting={submitting}
        handleAssignTeacher={handleAssignTeacher}
        handleRemoveTeacher={handleRemoveTeacher}
      />
    </div>
  );
}