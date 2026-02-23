'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  Dialog, DialogContent,
  DialogFooter,
  DialogTitle
} from "@/components/ui/dialog";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import {
  Popover, PopoverContent, PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table';
import { classroomDisplayName } from '@/lib/classroomDisplayName';
import { cn } from '@/lib/utils';
import {
  BookOpen,
  Building2,
  CheckCircle2, Download, Edit, Filter, Mail, MoreHorizontal,
  Phone, Trash2, XCircle
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

/* ─────────────────────────────────────────────────────────────────────────────
   HELPER: Group assignments by Classroom
───────────────────────────────────────────────────────────────────────────── */
function groupTeacherAssignments(assignments = []) {
  const map = new Map();
  for (const a of assignments) {
    const key = a.classroomId || a.className || Math.random();
    if (!map.has(key)) {
      map.set(key, {
        label: classroomDisplayName(a),
        subjects: []
      });
    }
    map.get(key).subjects.push({ name: a.subjectName, mandatory: a.mandatory });
  }
  return Array.from(map.values());
}

export default function TeacherTable({
  teachers = [],
  isLoading,
  currentTab,
  onTabChange,
  onEdit,
  onDelete,
  onDownloadSlip,
  onToggleStatus
}) {
  const router = useRouter();
  const [teacherToDelete, setTeacherToDelete] = useState(null);
  const safeTeachers = Array.isArray(teachers) ? teachers : [];

  const handleConfirmDelete = () => {
    if (teacherToDelete) {
      onDelete(teacherToDelete.id);
      setTeacherToDelete(null);
    }
  };

  if (isLoading) {
    return (
      <div className="border border-slate-200 rounded-lg bg-white p-6 space-y-5 shadow-sm">
        <div className="flex gap-2 mb-6">
          <Skeleton className="h-9 w-24 rounded-md" />
          <Skeleton className="h-9 w-24 rounded-md" />
          <Skeleton className="h-9 w-24 rounded-md" />
        </div>
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 py-3 border-b border-slate-100 last:border-0">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="space-y-2 flex-1">
              <Skeleton className="h-4 w-48 rounded" />
              <Skeleton className="h-3 w-32 rounded" />
            </div>
            <Skeleton className="h-8 w-24 rounded-md" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* --- CATEGORY TABS --- */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="inline-flex items-center p-1 rounded-md bg-slate-100/80 border border-slate-200">
          {['all', 'active', 'inactive'].map((tab) => (
            <button
              key={tab}
              onClick={() => onTabChange(tab)}
              className={cn(
                "px-5 py-1.5 text-sm font-medium rounded-sm transition-all duration-200 capitalize",
                currentTab === tab
                  ? "bg-white text-indigo-700 shadow-sm border border-slate-200/50"
                  : "text-slate-500 hover:text-slate-900 hover:bg-slate-200/50"
              )}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* --- TABLE CONTENT --- */}
      <div className="rounded-lg border border-slate-200 bg-white shadow-sm overflow-hidden">
        {safeTeachers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center bg-slate-50/50">
            <div className="h-12 w-12 bg-white border border-slate-200 shadow-sm rounded-lg flex items-center justify-center mb-4">
              <Filter className="h-5 w-5 text-slate-400" />
            </div>
            <h3 className="text-slate-900 font-semibold text-base">No faculty found</h3>
            <p className="text-slate-500 text-sm mt-1 max-w-sm">
              {currentTab === 'all' ? "Get started by adding a new faculty member." : `No ${currentTab} teachers found on this page.`}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-slate-50 border-b border-slate-200">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="font-semibold text-slate-600 pl-6 py-3 h-11 text-xs uppercase tracking-wider">Name</TableHead>
                  <TableHead className="font-semibold text-slate-600 hidden lg:table-cell py-3 h-11 text-xs uppercase tracking-wider">Subjects</TableHead>
                  <TableHead className="font-semibold text-slate-600 hidden md:table-cell py-3 h-11 text-xs uppercase tracking-wider">Gender</TableHead>
                  <TableHead className="font-semibold text-slate-600 hidden md:table-cell py-3 h-11 text-xs uppercase tracking-wider">Contact</TableHead>
                  <TableHead className="font-semibold text-slate-600 py-3 h-11 text-xs uppercase tracking-wider">Status</TableHead>
                  <TableHead className="font-semibold text-slate-600 text-right pr-6 py-3 h-11 text-xs uppercase tracking-wider">Actions</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {safeTeachers.map(t => {
                  const groupedAssignments = groupTeacherAssignments(t.assignedClassrooms);

                  return (
                    <TableRow key={t.id} onClick={() => router.push(`/admin/teachers/${t.id}`)} className="cursor-pointer hover:bg-slate-50 transition-colors group border-b border-slate-100 last:border-0">

                      {/* NAME */}
                      <TableCell className="pl-6 py-3">
                        <div className="flex gap-3 items-center">
                          <Avatar className="h-9 w-9 border border-slate-200 shadow-sm">
                            <AvatarImage src={t.profilePictureUrl ? `http://localhost:8080/api/files/teachers/${t.profilePictureUrl}` : ''} className="object-cover" />
                            <AvatarFallback className="bg-indigo-50 text-indigo-700 font-semibold text-xs">
                              {t.firstName?.[0]}{t.lastName?.[0]}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium text-slate-900 group-hover:text-indigo-600 transition-colors">{t.firstName} {t.lastName}</p>
                          </div>
                        </div>
                      </TableCell>

                      {/* SUBJECTS (Assignments) */}
                      <TableCell className="hidden lg:table-cell py-3">
                        <div className="flex flex-wrap gap-2 max-w-[320px]">
                          {groupedAssignments.length > 0 ? (
                            <>
                              {groupedAssignments.slice(0, 2).map((group, i) => (
                                <Popover key={i}>
                                  <PopoverTrigger asChild>
                                    <span
                                      className="font-medium text-[11px] px-2 py-1 bg-white border border-slate-200 text-slate-700 rounded-md shadow-sm cursor-pointer hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-200 transition-colors inline-flex items-center gap-1"
                                      onClick={(e) => { e.stopPropagation(); e.preventDefault(); }}
                                    >
                                      {group.label} {group.subjects.length > 1 && <span className="opacity-60">({group.subjects.length})</span>}
                                    </span>
                                  </PopoverTrigger>
                                  <PopoverContent className="w-64 p-0 rounded-lg shadow-lg border-slate-200" align="start" onClick={(e) => e.stopPropagation()}>
                                    <div className="bg-slate-50 px-3 py-2 border-b border-slate-100">
                                      <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Subjects in {group.label}</p>
                                    </div>
                                    <div className="p-2 space-y-1">
                                      {group.subjects.map((sub, idx) => (
                                        <div key={idx} className="flex items-center gap-2 text-xs font-medium text-slate-700 p-1">
                                          <div className={`h-1.5 w-1.5 rounded-full ${sub.mandatory ? 'bg-emerald-500' : 'bg-amber-400'}`} />
                                          {sub.name}
                                        </div>
                                      ))}
                                    </div>
                                  </PopoverContent>
                                </Popover>
                              ))}
                              {groupedAssignments.length > 2 && (
                                <Popover>
                                  <PopoverTrigger asChild>
                                    <span
                                      className="font-medium text-[11px] px-2 py-1 bg-slate-50 border border-slate-200 text-slate-500 rounded-md cursor-pointer hover:bg-slate-100 transition-colors"
                                      onClick={(e) => { e.stopPropagation(); e.preventDefault(); }}
                                    >
                                      +{groupedAssignments.length - 2} more
                                    </span>
                                  </PopoverTrigger>
                                  <PopoverContent className="w-72 p-0 rounded-lg shadow-lg border-slate-200 overflow-hidden" align="start" onClick={(e) => e.stopPropagation()}>
                                    <div className="bg-slate-50 px-3 py-2 border-b border-slate-100 flex items-center gap-2">
                                      <Building2 className="h-3.5 w-3.5 text-slate-400" />
                                      <p className="text-[10px] font-semibold text-slate-600 uppercase tracking-wider">All Assigned Classes</p>
                                    </div>
                                    <ScrollArea className="max-h-[250px]">
                                      <div className="p-2 space-y-1">
                                        {groupedAssignments.map((g, idx) => (
                                          <div key={idx} className="p-2 hover:bg-slate-50 rounded-md transition-colors">
                                            <p className="font-semibold text-xs text-slate-800 mb-1.5">{g.label}</p>
                                            <div className="flex flex-wrap gap-1">
                                              {g.subjects.map((sub, sIdx) => (
                                                <span key={sIdx} className="flex items-center gap-1 text-[10px] font-medium bg-white border border-slate-200 px-1.5 py-0.5 rounded text-slate-600">
                                                  <BookOpen className="h-3 w-3 text-indigo-400" />
                                                  {sub.name}
                                                </span>
                                              ))}
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    </ScrollArea>
                                  </PopoverContent>
                                </Popover>
                              )}
                            </>
                          ) : (
                            <span className="text-slate-400 text-xs italic font-medium bg-slate-50 px-2 py-1 rounded border border-slate-100">No Assignments</span>
                          )}
                        </div>
                      </TableCell>

                      {/* GENDER */}
                      <TableCell className="hidden md:table-cell py-3">
                        <span className="text-sm text-slate-600 capitalize">{t.gender?.toLowerCase() || '—'}</span>
                      </TableCell>

                      {/* CONTACT */}
                      <TableCell className="hidden md:table-cell py-3">
                        <div className="flex items-center gap-2 text-sm text-slate-600">
                          {t.phoneNumber ? (
                            <><Phone className="h-3.5 w-3.5 text-slate-400" /> <span>{t.phoneNumber}</span></>
                          ) : t.email ? (
                            <><Mail className="h-3.5 w-3.5 text-slate-400" /> <span className="truncate max-w-[150px]">{t.email}</span></>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </div>
                      </TableCell>

                      {/* STATUS */}
                      <TableCell className="py-3">
                        {t.active ? (
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <span className="relative flex h-1.5 w-1.5"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span><span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span></span>
                            Active
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
                            <div className="h-1.5 w-1.5 rounded-full bg-slate-400"></div>
                            Inactive
                          </div>
                        )}
                      </TableCell>

                      {/* ACTIONS */}
                      <TableCell className="text-right pr-6 py-3">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button size="icon" variant="ghost" className="h-8 w-8 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-md" onClick={(e) => e.stopPropagation()}>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48 rounded-lg shadow-lg border-slate-200">
                            <DropdownMenuLabel className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Manage</DropdownMenuLabel>

                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEdit(t); }} className="cursor-pointer text-sm font-medium text-slate-700 hover:bg-slate-50">
                              <Edit className="mr-2 h-4 w-4 text-slate-400" /> Edit Profile
                            </DropdownMenuItem>

                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onDownloadSlip(t.id); }} className="cursor-pointer text-sm font-medium text-slate-700 hover:bg-slate-50">
                              <Download className="mr-2 h-4 w-4 text-slate-400" /> Download Slip
                            </DropdownMenuItem>

                            <DropdownMenuSeparator className="bg-slate-100" />

                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onToggleStatus(t.id, !t.active); }} className="cursor-pointer text-sm font-medium">
                              {t.active ? (
                                <><XCircle className="mr-2 h-4 w-4 text-amber-500" /><span className="text-amber-700">Deactivate</span></>
                              ) : (
                                <><CheckCircle2 className="mr-2 h-4 w-4 text-emerald-500" /><span className="text-emerald-700">Activate</span></>
                              )}
                            </DropdownMenuItem>

                            <DropdownMenuSeparator className="bg-slate-100" />

                            <DropdownMenuItem disabled={t.active} className={cn("cursor-pointer text-sm font-medium", t.active ? "opacity-50" : "text-red-600 focus:text-red-700 focus:bg-red-50")} onClick={(e) => { if (t.active) return; e.stopPropagation(); setTeacherToDelete(t); }}>
                              <Trash2 className="mr-2 h-4 w-4" /> {t.active ? "Deactivate to Delete" : "Delete Permanently"}
                            </DropdownMenuItem>

                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>

                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {/* Delete Dialog */}
      <Dialog open={!!teacherToDelete} onOpenChange={(open) => !open && setTeacherToDelete(null)}>
        <DialogContent className="sm:max-w-md rounded-lg p-0 overflow-hidden border-slate-200 shadow-xl">
          <div className="bg-white p-6 pb-2 flex flex-col items-center text-center">
            <div className="h-12 w-12 bg-red-50 rounded-full flex items-center justify-center mb-4 border border-red-100">
              <Trash2 className="h-6 w-6 text-red-600" />
            </div>
            <DialogTitle className="text-lg font-bold text-slate-900">Delete Faculty Member</DialogTitle>
          </div>
          <div className="px-6 pb-6 pt-2">
            <p className="text-slate-500 text-sm text-center">
              You are about to permanently delete <span className="font-semibold text-slate-900">{teacherToDelete?.firstName} {teacherToDelete?.lastName}</span>. All associated data will be removed. This action cannot be undone.
            </p>
          </div>
          <DialogFooter className="bg-slate-50 px-6 py-4 border-t border-slate-200 gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setTeacherToDelete(null)} className="font-medium bg-white text-slate-600 border-slate-200">Cancel</Button>
            <Button variant="destructive" onClick={handleConfirmDelete} className="bg-red-600 hover:bg-red-700 font-medium">Yes, Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}