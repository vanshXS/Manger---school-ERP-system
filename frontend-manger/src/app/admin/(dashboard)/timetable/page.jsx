'use client';

import apiClient from '@/lib/axios';
import { classroomDisplayName } from '@/lib/classroomDisplayName';
import {
  Calendar,
  Filter,
  Plus,
  School
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';

import TimeTableDialog from '@/components/admin/timetable/TimeTableDialog';
import TimeTableGrid from '@/components/admin/timetable/TimeTableGrid';
import { Button } from '@/components/ui/button';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';

export default function TimeTablePage() {
  // === Data State ===
  const [classrooms, setClassrooms] = useState([]);
  const [selectedClassroom, setSelectedClassroom] = useState(null);
  const [timetableData, setTimetableData] = useState([]);

  // === UI State ===
  const [loadingClassrooms, setLoadingClassrooms] = useState(true);
  const [loadingTimetable, setLoadingTimetable] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSlot, setEditingSlot] = useState(null);

  // === 1. Fetch Classrooms on Mount ===
  useEffect(() => {
    const fetchClassrooms = async () => {
      try {
        const res = await apiClient.get('/api/admin/classrooms');
        setClassrooms(res.data || []);
      } catch (err) {
        toast.error('Failed to load classrooms');
      } finally {
        setLoadingClassrooms(false);
      }
    };
    fetchClassrooms();
  }, []);

  // === 2. Fetch Timetable on Selection ===
  const fetchTimetable = useCallback(async () => {
    if (!selectedClassroom) return;

    setLoadingTimetable(true);
    try {
      const res = await apiClient.get(`/api/admin/timetable/classroom/${selectedClassroom.id}`);
      setTimetableData(res.data || []);
    } catch (err) {
      toast.error('Failed to load schedule');
    } finally {
      setLoadingTimetable(false);
    }
  }, [selectedClassroom]);

  useEffect(() => {
    fetchTimetable();
  }, [fetchTimetable]);

  // === Actions ===
  const handleDelete = async (id) => {
    // Optimistic Update: Remove immediately from UI for speed
    const previousData = [...timetableData];
    setTimetableData(prev => prev.filter(item => item.id !== id));
    toast.success('Class removed');

    try {
      await apiClient.delete(`/api/admin/timetable/${id}`);
    } catch (err) {
      // Revert if failed
      setTimetableData(previousData);
      toast.error('Failed to delete class');
    }
  };

  const handleOpenAdd = () => {
    setEditingSlot(null);
    setIsDialogOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-50/50 p-4 md:p-6 space-y-6">

      {/* === HEADER SECTION === */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
            <span className="p-2 rounded-xl bg-blue-100 text-blue-600">
              <Calendar className="h-6 w-6" />
            </span>
            Class Timetable
          </h1>
          <p className="text-slate-500 text-sm mt-1 ml-1">
            Manage weekly schedules and conflict detection.
          </p>
        </div>

        <div className="flex items-center gap-3 bg-white p-1.5 rounded-xl border shadow-sm">
          {loadingClassrooms ? (
            <Skeleton className="w-[200px] h-10 rounded-lg" />
          ) : (
            <Select
              value={selectedClassroom?.id?.toString()}
              onValueChange={(val) => setSelectedClassroom(classrooms.find(c => c.id.toString() === val))}
            >
              <SelectTrigger className="w-[240px] border-0 focus:ring-0 bg-transparent font-medium">
                <div className="flex items-center gap-2 text-slate-700">
                  <School className="h-4 w-4 text-slate-400" />
                  <SelectValue placeholder="Select a classroom..." />
                </div>
              </SelectTrigger>
              <SelectContent>
                {classrooms.map((c) => (
                  <SelectItem key={c.id} value={c.id.toString()}>
                    {classroomDisplayName(c)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          <div className="h-6 w-px bg-slate-200 mx-1" />

          <Button
            onClick={handleOpenAdd}
            disabled={!selectedClassroom}
            className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-100"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Slot
          </Button>
        </div>
      </div>

      {/* === CONTENT SECTION === */}
      {!selectedClassroom ? (
        // Empty State
        <div className="flex flex-col items-center justify-center py-32 text-center border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50">
          <div className="bg-white p-4 rounded-full shadow-sm mb-4">
            <Filter className="h-8 w-8 text-indigo-200" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900">No Classroom Selected</h3>
          <p className="text-slate-500 max-w-sm mt-2 text-sm">
            Please select a classroom from the top bar to view or manage its weekly schedule.
          </p>
        </div>
      ) : loadingTimetable ? (
        // Loading State
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="space-y-3">
              <Skeleton className="h-10 w-full rounded-lg" />
              <Skeleton className="h-32 w-full rounded-xl" />
              <Skeleton className="h-32 w-full rounded-xl" />
            </div>
          ))}
        </div>
      ) : (
        // Data Grid
        <TimeTableGrid
          data={timetableData}
          onEdit={(slot) => { setEditingSlot(slot); setIsDialogOpen(true); }}
          onDelete={handleDelete}
        />
      )}

      {/* === DIALOG === */}
      {selectedClassroom && (
        <TimeTableDialog
          isOpen={isDialogOpen}
          onClose={() => setIsDialogOpen(false)}
          onSuccess={() => { fetchTimetable(); setIsDialogOpen(false); }}
          classroomId={selectedClassroom.id}
          initialData={editingSlot}
        />
      )}
    </div>
  );
}