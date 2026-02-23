'use client';

import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { classroomDisplayName } from '@/lib/classroomDisplayName';
import { Building2, ChevronRight, GraduationCap, Search } from 'lucide-react';

export function ClassroomSkeleton() {
    return Array(6).fill(0).map((_, i) => <Skeleton key={i} className="h-9 w-full rounded-lg mb-1" />);
}

export default function ClassroomSelector({
    classrooms,
    selectedClassroom,
    setSelectedClassroom,
    loading,
    searchQuery,
    setSearchQuery
}) {
    const filteredClassrooms = classrooms.filter(c =>
        classroomDisplayName(c).toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <Card className="border-slate-200 shadow-sm">
            <CardHeader className="pb-3 pt-4 px-4 border-b border-slate-100">
                <CardTitle className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-slate-500" />
                    Classrooms
                    <span className="ml-auto text-xs font-normal text-slate-400">{classrooms.length}</span>
                </CardTitle>
                <div className="relative mt-2">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                    <Input
                        placeholder="Search…"
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        className="pl-8 h-7 text-sm bg-slate-50"
                    />
                </div>
            </CardHeader>

            <ScrollArea className="h-[calc(100vh-280px)]">
                <div className="p-2 space-y-0.5">
                    {loading ? (
                        <ClassroomSkeleton />
                    ) : filteredClassrooms.length === 0 ? (
                        <p className="text-xs text-slate-400 text-center py-6">No classrooms found</p>
                    ) : (
                        filteredClassrooms.map(c => {
                            const isSelected = selectedClassroom?.id === c.id;
                            return (
                                <button
                                    key={c.id}
                                    onClick={() => setSelectedClassroom(c)}
                                    className={`w-full text-left px-3 py-2.5 rounded-lg text-sm transition-all flex items-center justify-between gap-2
                    ${isSelected
                                            ? 'bg-blue-600 text-white shadow-sm font-semibold'
                                            : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 font-medium'}`}
                                >
                                    <div className="flex items-center gap-2 min-w-0">
                                        <GraduationCap className={`h-3.5 w-3.5 shrink-0 ${isSelected ? 'text-blue-200' : 'text-slate-400'}`} />
                                        <span className="truncate">{classroomDisplayName(c)}</span>
                                    </div>
                                    {isSelected && <ChevronRight className="h-3.5 w-3.5 opacity-60 shrink-0" />}
                                </button>
                            );
                        })
                    )}
                </div>
            </ScrollArea>
        </Card>
    );
}
