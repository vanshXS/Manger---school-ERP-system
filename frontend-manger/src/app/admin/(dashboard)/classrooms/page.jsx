'use client';

import apiClient from '@/lib/axios';
import { Building2, LayoutGrid, List, PlusCircle, Search } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Modular Components
import ClassroomDetailsSheet from '@/components/admin/classrooms/ClassroomDetailsSheet';
import ClassroomDialog from '@/components/admin/classrooms/ClassroomDialog';
import ClassroomEmptyState from '@/components/admin/classrooms/ClassroomEmptyState';
import ClassroomGrid from '@/components/admin/classrooms/ClassroomGrid';
import ClassroomList from '@/components/admin/classrooms/ClassroomList';
import ClassroomScheduleDialog from '@/components/admin/classrooms/ClassroomScheduleDialog';
import ClassroomStats from '@/components/admin/classrooms/ClassroomStats';

// ─── Main Component ──────────────────────────────────────────────────────────
export default function ClassroomsPage() {
  const [activeClassrooms, setActiveClassrooms] = useState([]);
  const [archivedClassrooms, setArchivedClassrooms] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingClassroom, setEditingClassroom] = useState(null);
  const [currentTab, setCurrentTab] = useState('active');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list'
  const [searchQuery, setSearchQuery] = useState('');

  // Sheet & Schedule state
  const [selectedClassroom, setSelectedClassroom] = useState(null);
  const [detailsStudents, setDetailsStudents] = useState([]);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [scheduleData, setScheduleData] = useState([]);
  const [scheduleLoading, setScheduleLoading] = useState(false);
  const [isScheduleDialogOpen, setIsScheduleDialogOpen] = useState(false);

  const fetchClassrooms = useCallback(async (status = 'active') => {
    if (status === currentTab) setIsLoading(true);
    const setter = status === 'active' ? setActiveClassrooms : setArchivedClassrooms;
    const url = status === 'active' ? '/api/admin/classrooms' : '/api/admin/classrooms/archived';
    try {
      const response = await apiClient.get(url);
      const dataWithCount = response.data.map(c => ({ ...c, studentCount: c.studentCount ?? 0 }));
      setter(dataWithCount);
    } catch (error) {
      if (status === currentTab) toast.error(error.customMessage || `Failed to fetch ${status} classrooms.`);
      setter([]);
    } finally {
      if (status === currentTab) setIsLoading(false);
    }
  }, [currentTab]);

  useEffect(() => {
    fetchClassrooms('active');
    fetchClassrooms('archived');
  }, [fetchClassrooms]);

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    const isEditing = !!editingClassroom;
    const payload = { gradeLevel: data.gradeLevel, section: data.section, capacity: parseInt(data.capacity) };
    const apiCall = isEditing
      ? apiClient.put(`/api/admin/classrooms/${editingClassroom.id}`, payload)
      : apiClient.post('/api/admin/classrooms', payload);
    const toastId = toast.loading(isEditing ? 'Updating...' : 'Creating...');
    try {
      await apiCall;
      toast.success(isEditing ? 'Classroom updated!' : 'Classroom created!', { id: toastId });
      setIsDialogOpen(false);
      fetchClassrooms('active');
      fetchClassrooms('archived');
    } catch (error) {
      toast.error(error.response?.data?.message || error.customMessage || 'Operation failed.', { id: toastId });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateStatus = async (id, newStatus) => {
    const action = newStatus === 'ARCHIVED' ? 'archive' : 'activate';
    const toastId = toast.loading(`${action === 'archive' ? 'Archiving' : 'Activating'}...`);
    try {
      await apiClient.put(`/api/admin/classrooms/${id}/${action}`);
      toast.success(`Classroom ${action}d!`, { id: toastId });
      fetchClassrooms('active');
      fetchClassrooms('archived');
    } catch (error) {
      toast.error(error.response?.data?.message || error.customMessage || `Failed to ${action}.`, { id: toastId });
    }
  };

  const handleDelete = async (id) => {
    const toastId = toast.loading('Deleting...');
    try {
      await apiClient.delete(`/api/admin/classrooms/${id}`);
      toast.success('Classroom deleted.', { id: toastId });
      fetchClassrooms('archived');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Cannot delete — classroom has data. Archive instead.', { id: toastId });
    }
  };

  const openAddDialog = () => {
    setEditingClassroom(null);
    setIsDialogOpen(true);
  };

  const openEditDialog = (classroom) => {
    setEditingClassroom(classroom);
    setIsDialogOpen(true);
  };

  const openDetailsSheet = async (classroom) => {
    setSelectedClassroom(classroom);
    setIsSheetOpen(true);
    setDetailsLoading(true);
    setDetailsStudents([]);
    try {
      const response = await apiClient.get(`/api/admin/students/by-classroom/${classroom.id}`);
      setDetailsStudents(response.data || []);
    } catch (error) {
      setDetailsStudents([]);
    } finally {
      setDetailsLoading(false);
    }
  };

  const openScheduleDialog = async (classroom) => {
    setSelectedClassroom(classroom);
    setIsScheduleDialogOpen(true);
    setScheduleLoading(true);
    setScheduleData([]);
    try {
      const response = await apiClient.get(`/api/admin/timetable/classroom/${classroom.id}`);
      setScheduleData(response.data || []);
    } catch (error) {
      // silent fail
    } finally {
      setScheduleLoading(false);
    }
  };

  // Filtered list based on search
  const filterClassrooms = (list) => {
    if (!searchQuery.trim()) return list;
    const q = searchQuery.toLowerCase();
    return list.filter(c =>
      c.gradeLevel?.toLowerCase().includes(q) ||
      c.section?.toLowerCase().includes(q) ||
      `${c.gradeLevel} ${c.section}`.toLowerCase().includes(q)
    );
  };

  const displayedActive = filterClassrooms(activeClassrooms);
  const displayedArchived = filterClassrooms(archivedClassrooms);

  // Common Props for Grid and List Views
  const viewProps = {
    isLoading,
    onViewStudents: openDetailsSheet,
    onViewSchedule: openScheduleDialog,
    onEdit: openEditDialog,
    onUpdateStatus: handleUpdateStatus,
    onDelete: handleDelete,
    EmptyState: () => <ClassroomEmptyState currentTab={currentTab} onAddClick={openAddDialog} />
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 flex items-center gap-2 tracking-tight">
            <span className="p-2 rounded-xl bg-blue-100 text-blue-600"><Building2 className="h-6 w-6" /></span>
            Classrooms
          </h1>
          <p className="text-sm text-slate-500 mt-1">Manage classes, enrollments, and capacity</p>
        </div>
        <Button onClick={openAddDialog} className="bg-primary hover:bg-primary/90 shadow-sm rounded-xl">
          <PlusCircle className="mr-2 h-4 w-4" /> Add Classroom
        </Button>
      </div>

      {/* Stats */}
      <ClassroomStats activeClassrooms={activeClassrooms} />

      {/* Add/Edit Dialog */}
      <ClassroomDialog
        isOpen={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        classroom={editingClassroom}
        onSubmit={onSubmit}
        isSubmitting={isSubmitting}
      />

      {/* Tabs + Controls */}
      <Tabs value={currentTab} onValueChange={setCurrentTab}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <TabsList className="bg-white border border-slate-200 p-1 rounded-lg h-9">
            <TabsTrigger value="active" className="text-sm px-4 h-7 data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700">
              Active
              {activeClassrooms.length > 0 && (
                <span className="ml-1.5 bg-blue-100 text-blue-600 text-[11px] font-bold px-1.5 py-0.5 rounded-full">
                  {activeClassrooms.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="archived" className="text-sm px-4 h-7 data-[state=active]:bg-slate-100 data-[state=active]:text-slate-700">
              Archived
              {archivedClassrooms.length > 0 && (
                <span className="ml-1.5 bg-slate-200 text-slate-600 text-[11px] font-bold px-1.5 py-0.5 rounded-full">
                  {archivedClassrooms.length}
                </span>
              )}
            </TabsTrigger>
          </TabsList>

          {/* Search + View Toggle */}
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <Input
                placeholder="Search grade or section…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 h-8 text-sm w-48 bg-white"
              />
            </div>
            <div className="flex border border-slate-200 rounded-lg overflow-hidden bg-white">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 ${viewMode === 'grid' ? 'bg-blue-50 text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
              >
                <LayoutGrid className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 ${viewMode === 'list' ? 'bg-blue-50 text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
              >
                <List className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        <TabsContent value="active">
          {viewMode === 'grid'
            ? <ClassroomGrid classrooms={displayedActive} {...viewProps} />
            : <ClassroomList classrooms={displayedActive} {...viewProps} />}
        </TabsContent>
        <TabsContent value="archived">
          {viewMode === 'grid'
            ? <ClassroomGrid classrooms={displayedArchived} {...viewProps} />
            : <ClassroomList classrooms={displayedArchived} {...viewProps} />}
        </TabsContent>
      </Tabs>

      {/* Student Details Sheet */}
      <ClassroomDetailsSheet
        isOpen={isSheetOpen}
        onOpenChange={setIsSheetOpen}
        classroom={selectedClassroom}
        students={detailsStudents}
        isLoading={detailsLoading}
      />

      {/* Schedule Dialog */}
      <ClassroomScheduleDialog
        isOpen={isScheduleDialogOpen}
        onOpenChange={setIsScheduleDialogOpen}
        classroom={selectedClassroom}
        schedule={scheduleData}
        isLoading={scheduleLoading}
      />
    </div>
  );
}