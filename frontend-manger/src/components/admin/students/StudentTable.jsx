'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table';
import { classroomDisplayName } from '@/lib/classroomDisplayName';
import { BookCopy, Edit, MoreHorizontal, PauseCircle, Trash2, User, UserCheck, UserX, Mail } from 'lucide-react';

export default function StudentTable({
  students, onEdit, onManageSubjects, onDelete, onDownloadSlip, onUpdateStatus, onSendReset, onRowClick,
  StatusBadge,
}) {
  if (!students?.length) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center border rounded-xl bg-slate-50/50 border-dashed border-slate-200">
        <User className="h-10 w-10 text-slate-300 mb-3" />
        <p className="text-slate-500 font-medium">No students found</p>
      </div>
    );
  }

  const renderStatus = (status) =>
    StatusBadge ? <StatusBadge status={status} /> : (
      <Badge className="bg-slate-100 text-slate-600 hover:bg-slate-100 border-0">{(status && status !== 'ACTIVE') ? status : 'Active'}</Badge>
    );

  return (
    <div className="rounded-xl border border-slate-200/80 bg-white overflow-hidden shadow-sm">
      <div className="overflow-x-auto custom-scrollbar">
        <Table>
          <TableHeader className="bg-slate-50">
            <TableRow>
              <TableHead className="w-[260px]">Name</TableHead>
              <TableHead className="hidden sm:table-cell">Roll No</TableHead>
              <TableHead className="hidden md:table-cell">Class</TableHead>
              <TableHead className="hidden md:table-cell">Gender</TableHead>
              <TableHead className="hidden lg:table-cell">Parent Phone</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {students.map((s) => (
              <TableRow
                key={s.id}
                className="cursor-pointer hover:bg-slate-50/80 group transition-colors duration-150"
                onClick={(e) => { if (!e.defaultPrevented) onRowClick?.(s); }}
              >
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-9 w-9 border border-slate-100">
                      <AvatarImage src={s.profilePictureUrl ? `http://localhost:8080/api/files/students/${s.profilePictureUrl}` : ''} />
                      <AvatarFallback className="bg-indigo-50 text-indigo-600 font-bold text-xs">
                        {s.firstName?.[0]}{s.lastName?.[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-slate-900 group-hover:text-indigo-600 transition-colors">
                        {s.firstName} {s.lastName}
                      </p>
                      <p className="text-xs text-slate-500">{s.email}</p>
                    </div>
                  </div>
                </TableCell>

                <TableCell className="hidden sm:table-cell">
                  <span className="font-mono text-xs bg-slate-100 px-2 py-1 rounded text-slate-600">{s.rollNo || '--'}</span>
                </TableCell>

                <TableCell className="hidden md:table-cell">
                  {s.classroomResponseDTO ? (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700">
                      {classroomDisplayName(s.classroomResponseDTO)}
                    </span>
                  ) : <span className="text-slate-400 text-xs italic">Unassigned</span>}
                </TableCell>

                <TableCell className="hidden md:table-cell text-sm text-slate-600 capitalize">{s.gender?.toLowerCase() || '--'}</TableCell>

                <TableCell className="text-sm text-slate-600 hidden lg:table-cell">{s.parentPhonePrimary || s.parentPhoneSecondary || '--'}</TableCell>

                <TableCell>{renderStatus(s.status)}</TableCell>

                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 min-w-[44px] min-h-[44px] md:min-w-0 md:min-h-0 touch-manipulation" onClick={e => e.stopPropagation()} aria-label="Actions">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuLabel className="text-xs font-normal text-slate-500">Manage Student</DropdownMenuLabel>

                      <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEdit(s); }}>
                        <Edit className="mr-2 h-4 w-4" /> Edit Details
                      </DropdownMenuItem>

                      <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onManageSubjects(s); }}>
                        <BookCopy className="mr-2 h-4 w-4" /> Subjects
                      </DropdownMenuItem>

                      <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onSendReset(s.id); }}>
                        <Mail className="mr-2 h-4 w-4" /> Send Reset Link
                      </DropdownMenuItem>

                      <DropdownMenuSeparator />

                      {/* Dynamic Status Actions */}
                      {s.status !== 'ACTIVE' && (
                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onUpdateStatus(s.id, 'ACTIVE'); }}>
                          <UserCheck className="mr-2 h-4 w-4 text-emerald-600" /> Activate
                        </DropdownMenuItem>
                      )}
                      {s.status === 'ACTIVE' && (
                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onUpdateStatus(s.id, 'SUSPENDED'); }}>
                          <PauseCircle className="mr-2 h-4 w-4 text-amber-600" /> Suspend
                        </DropdownMenuItem>
                      )}
                      {s.status !== 'INACTIVE' && (
                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onUpdateStatus(s.id, 'INACTIVE'); }}>
                          <UserX className="mr-2 h-4 w-4 text-slate-500" /> Mark Inactive
                        </DropdownMenuItem>
                      )}

                      <DropdownMenuSeparator />

                      {s.status === 'INACTIVE' && (
                        <DropdownMenuItem className="text-red-600 focus:bg-red-50" onClick={(e) => { e.stopPropagation(); onDelete(s.id); }}>
                          <Trash2 className="mr-2 h-4 w-4" /> Delete
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}