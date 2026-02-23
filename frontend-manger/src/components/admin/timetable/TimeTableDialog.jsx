import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { Loader2, AlertTriangle } from 'lucide-react';
import apiClient from '@/lib/axios';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';

const DAYS = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];

export default function TimeTableDialog({ isOpen, onClose, onSuccess, classroomId, initialData }) {
  const [assignments, setAssignments] = useState([]);
  const [loadingData, setLoadingData] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const [formData, setFormData] = useState({
    teacherAssignmentId: '',
    day: 'MONDAY',
    startTime: '09:00',
    endTime: '10:00'
  });

  // Fetch valid assignments for this classroom
  useEffect(() => {
    if (!isOpen) return;
    setLoadingData(true);
    setAssignments([]);
    setError(null);

    // Initialize Form
    if (initialData) {
      setFormData({
        teacherAssignmentId: '', // Ideally we need to map this back from existing data
        day: initialData.day,
        startTime: initialData.startTime.substring(0, 5), // HH:MM
        endTime: initialData.endTime.substring(0, 5)
      });
    } else {
      setFormData({ teacherAssignmentId: '', day: 'MONDAY', startTime: '09:00', endTime: '10:00' });
    }

    apiClient.get(`/api/admin/assignments/by-classroom/${classroomId}`)
      .then(res => {
        setAssignments(res.data || []);
        // Attempt to auto-select if editing (Logic depends on your API response structure)
        if (initialData) {
            const match = res.data.find(a => a.subjectName === initialData.subjectName && a.teacherName === initialData.teacherName);
            if(match) setFormData(prev => ({ ...prev, teacherAssignmentId: match.assignmentId }));
        }
      })
      .catch(() => toast.error('Could not load subjects'))
      .finally(() => setLoadingData(false));

  }, [isOpen, classroomId, initialData]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const payload = {
      ...formData,
      startTime: `${formData.startTime}:00`, // Ensure HH:MM:SS
      endTime: `${formData.endTime}:00`,
    };

    try {
      if (initialData) {
        await apiClient.put(`/api/admin/timetable/${initialData.id}`, payload);
        toast.success('Class updated successfully');
      } else {
        await apiClient.post('/api/admin/timetable', payload);
        toast.success('Class added to schedule');
      }
      onSuccess();
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to save';
      // Display error inside dialog for better UX
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-slate-800">
            {initialData ? 'Reschedule Class' : 'Add New Class'}
          </DialogTitle>
        </DialogHeader>

        {error && (
            <Alert variant="destructive" className="mb-2 bg-red-50 text-red-800 border-red-200">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
            </Alert>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-5 py-2">
          
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold uppercase text-slate-500">Subject & Faculty</Label>
            {loadingData ? (
                <div className="h-10 w-full bg-slate-100 animate-pulse rounded-md" />
            ) : (
                <Select 
                value={formData.teacherAssignmentId.toString()} 
                onValueChange={(val) => setFormData({...formData, teacherAssignmentId: val})}
                >
                <SelectTrigger className="bg-slate-50 border-slate-200 h-11">
                    <SelectValue placeholder="Select Subject" />
                </SelectTrigger>
                <SelectContent>
                    {assignments.map((a) => (
                    <SelectItem key={a.assignmentId} value={a.assignmentId.toString()}>
                        <span className="font-medium text-slate-700">{a.subjectName}</span>
                        <span className="text-slate-400 text-xs ml-2">({a.teacherName})</span>
                    </SelectItem>
                    ))}
                </SelectContent>
                </Select>
            )}
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold uppercase text-slate-500">Day of Week</Label>
            <Select 
              value={formData.day} 
              onValueChange={(val) => setFormData({...formData, day: val})}
            >
              <SelectTrigger className="bg-slate-50 border-slate-200 h-11">
                <SelectValue placeholder="Select Day" />
              </SelectTrigger>
              <SelectContent>
                {DAYS.map((d) => (
                  <SelectItem key={d} value={d}>{d}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase text-slate-500">Start Time</Label>
              <Input 
                type="time" 
                className="bg-slate-50 border-slate-200 h-11"
                value={formData.startTime}
                onChange={(e) => setFormData({...formData, startTime: e.target.value})}
                required 
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase text-slate-500">End Time</Label>
              <Input 
                type="time" 
                className="bg-slate-50 border-slate-200 h-11"
                value={formData.endTime}
                onChange={(e) => setFormData({...formData, endTime: e.target.value})}
                required 
              />
            </div>
          </div>

          <DialogFooter className="pt-4">
            <Button type="button" variant="outline" onClick={onClose} className="h-11">Cancel</Button>
            <Button 
                type="submit" 
                disabled={submitting || !formData.teacherAssignmentId}
                className="bg-indigo-600 hover:bg-indigo-700 h-11 min-w-[120px]"
            >
              {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              {submitting ? 'Saving...' : 'Save Schedule'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}