'use client';
import { classroomDisplayName } from '@/lib/classroomDisplayName';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import apiClient from '@/lib/axios';
import { BookCopy, BookOpen, Plus, School, Search, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import toast from 'react-hot-toast';

export default function StudentSheet({
  isOpen,
  setIsOpen,
  selectedStudent,
  selectedSubjects,
  setSelectedSubjects,
  allSubjects,
}) {
  const [searchQuery, setSearchQuery] = useState('');

  // --- FILTERING LOGIC (Large Data Capable) ---
  const availableSubjects = useMemo(() => {
    // 1. Remove already enrolled subjects
    let available = allSubjects.filter(
      (sub) => !selectedSubjects.some((s) => s.id === sub.id)
    );

    // 2. Filter by Search
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      available = available.filter(s =>
        s.name.toLowerCase().includes(q) ||
        s.code.toLowerCase().includes(q)
      );
    }

    // 3. Limit to 50 to prevent lag
    return available.slice(0, 50);
  }, [allSubjects, selectedSubjects, searchQuery]);


  // --- HANDLERS ---
  const handleAdd = async (subjectId) => {
    try {
      const res = await apiClient.post(
        `/api/admin/students/${selectedStudent.id}/assign-subject/${subjectId}`
      );
      toast.success('Subject added');
      setSelectedSubjects(res.data.subjectResponseDTOS);
    } catch (error) {
      toast.error(error.customMessage || 'Failed to add subject');
    }
  };

  const handleRemove = async (subjectId) => {
    try {
      await apiClient.delete(
        `/api/admin/students/${selectedStudent.id}/remove-subject/${subjectId}`
      );
      toast.success('Subject removed');
      setSelectedSubjects((prev) => prev.filter((s) => s.id !== subjectId));
    } catch (error) {
      toast.error(error.customMessage || 'Failed to remove subject');
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetContent className="w-full sm:w-[540px] flex flex-col pt-10 h-full">

        {/* === HEADER === */}
        <SheetHeader className="px-1 mb-2 shrink-0">
          <SheetTitle className="text-xl font-bold flex items-center gap-2 text-slate-900">
            <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
              <BookCopy className="h-5 w-5" />
            </div>
            <div>
              Manage Curriculum
              <p className="text-xs font-normal text-slate-500 mt-1 flex items-center gap-1">
                <School className="h-3 w-3" />
                {classroomDisplayName(selectedStudent?.classroomResponseDTO) || 'No Class'} • {selectedStudent?.firstName} {selectedStudent?.lastName}
              </p>
            </div>
          </SheetTitle>
        </SheetHeader>

        {/* === BODY (Scrollable Container) === */}
        <div className="flex-1 overflow-hidden flex flex-col gap-6">

          {/* SECTION 1: ADD NEW (Fixed Height Area) */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 shrink-0">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">
              Add New Subject
            </label>

            <div className="relative mb-3">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search by name or code..."
                className="pl-9 bg-white border-slate-200"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="h-[140px] overflow-y-auto pr-2 border rounded-md bg-white">
              {availableSubjects.length > 0 ? (
                <ul className="divide-y divide-slate-50">
                  {availableSubjects.map(subject => (
                    <li key={subject.id} className="flex items-center justify-between p-2 hover:bg-slate-50 transition-colors group">
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-slate-700">{subject.name}</span>
                        <span className="text-[10px] text-slate-400 font-mono">{subject.code}</span>
                      </div>
                      <Button
                        size="sm"
                        className="h-7 px-2 bg-emerald-600 hover:bg-emerald-700 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => handleAdd(subject.id)}
                      >
                        <Plus className="h-3 w-3 mr-1" /> Add
                      </Button>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-slate-400 text-xs">
                  <p>{searchQuery ? "No matching subjects." : "All subjects assigned."}</p>
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* SECTION 2: ENROLLED LIST (Flexible Height) */}
          <div className="flex-1 flex flex-col min-h-0">
            <div className="flex items-center justify-between mb-2 px-1">
              <h3 className="text-sm font-bold text-slate-900">Enrolled Subjects</h3>
              <Badge variant="secondary" className="bg-slate-100 text-slate-600">{selectedSubjects.length}</Badge>
            </div>

            <ScrollArea className="flex-1 pr-4 -mr-4">
              {selectedSubjects.length > 0 ? (
                <ul className="space-y-2 pb-4 px-1">
                  {selectedSubjects.map((subject) => (
                    <li key={subject.id} className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-lg shadow-sm hover:border-blue-300 transition-all">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                          <BookOpen className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-800">{subject.name}</p>
                          <p className="text-xs text-slate-500 font-mono">{subject.code}</p>
                        </div>
                      </div>

                      {subject.mandatory ? (
                        <Badge variant="outline" className="text-[10px] bg-amber-50 text-amber-700 border-amber-200">
                          Mandatory
                        </Badge>
                      ) : (
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-slate-400 hover:text-red-600 hover:bg-red-50"
                          onClick={() => handleRemove(subject.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-slate-400 border-2 border-dashed border-slate-100 rounded-xl bg-slate-50/30">
                  <BookCopy className="h-10 w-10 mb-2 opacity-20" />
                  <p className="text-sm font-medium">No subjects enrolled.</p>
                </div>
              )}
            </ScrollArea>
          </div>

        </div>
      </SheetContent>
    </Sheet>
  );
}