import { Badge } from '@/components/ui/badge';
import {
  Table, TableBody, TableCell,
  TableHead, TableHeader, TableRow
} from '@/components/ui/table';
import { classroomDisplayName } from '@/lib/classroomDisplayName';
import { BookOpen, FolderOpen } from 'lucide-react';

export default function TeacherAssignmentsTable({ assignments }) {
  return (
    <div className="bg-white">
      <div className="relative max-h-[500px] overflow-auto">
        <Table>
          <TableHeader className="bg-slate-50/80 sticky top-0 z-10">
            <TableRow className="border-b border-slate-200">
              <TableHead className="font-bold text-slate-500 uppercase tracking-wider text-xs pl-8 py-4">Classroom</TableHead>
              <TableHead className="font-bold text-slate-500 uppercase tracking-wider text-xs">Subject Taught</TableHead>
              <TableHead className="font-bold text-slate-500 uppercase tracking-wider text-xs text-right pr-8">Assignment Type</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {assignments.length > 0 ? (
              assignments.map((a) => (
                <TableRow key={a.assignmentId} className="group hover:bg-slate-50/60 transition-colors cursor-default border-slate-100">
                  <TableCell className="pl-8 py-4">
                    <span className="font-bold text-slate-800">
                      {classroomDisplayName(a)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2.5 font-medium text-slate-700">
                      <div className="p-1.5 bg-indigo-50 rounded-lg group-hover:bg-indigo-100 transition-colors">
                        <BookOpen className="h-4 w-4 text-indigo-600" />
                      </div>
                      {a.subjectName}
                    </div>
                  </TableCell>
                  <TableCell className="text-right pr-8">
                    <Badge
                      variant="secondary"
                      className={`text-[10px] font-bold px-2.5 py-1 uppercase tracking-wider border shadow-sm ${
                        a.mandatory
                          ? "bg-indigo-50 text-indigo-700 border-indigo-200"
                          : "bg-amber-50 text-amber-700 border-amber-200"
                      }`}
                    >
                      {a.mandatory ? 'Core / Mandatory' : 'Elective'}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={3} className="h-64 text-center">
                  <div className="flex flex-col items-center justify-center text-slate-500">
                    <div className="bg-slate-50 p-5 rounded-full border border-slate-100 mb-4">
                      <FolderOpen className="h-10 w-10 text-slate-300" />
                    </div>
                    <p className="font-bold text-slate-800 text-lg">No active assignments</p>
                    <p className="text-sm font-medium text-slate-500 mt-1 max-w-[280px] mx-auto">
                      This teacher has not been assigned to any classrooms or subjects yet.
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {assignments.length > 0 && (
        <div className="bg-slate-50/80 border-t border-slate-100 px-8 py-3 text-xs font-medium text-slate-500 flex justify-end">
          Total {assignments.length} assignment{assignments.length !== 1 ? 's' : ''}
        </div>
      )}
    </div>
  );
}