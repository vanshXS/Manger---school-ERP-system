'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select';
import { Filter, Search, XCircle } from 'lucide-react';

export default function ExamFilters({
    search, onSearchChange,
    filterYearId, onFilterYearChange,
    filterClassId, onFilterClassChange,
    filterStatus, onFilterStatusChange,
    classrooms = [], academicYears = [],
    onClear,
}) {
    const hasActive = filterYearId || filterClassId || filterStatus || search;

    return (
        <Card className="border-slate-200 shadow-sm">
            <CardContent className="pt-4 pb-4">
                <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
                    {/* Search */}
                    <div className="relative flex-1 max-w-sm">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input
                            placeholder="Search exams..."
                            value={search}
                            onChange={e => onSearchChange(e.target.value)}
                            className="pl-9 h-9 text-sm"
                        />
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                        <Filter className="h-4 w-4 text-slate-400 shrink-0" />

                        {/* Academic Year */}
                        <Select value={filterYearId || 'all'} onValueChange={v => onFilterYearChange(v === 'all' ? '' : v)}>
                            <SelectTrigger className="h-9 text-xs w-[160px]">
                                <SelectValue placeholder="All Years" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Years</SelectItem>
                                {academicYears.map(y => (
                                    <SelectItem key={y.id} value={String(y.id)}>{y.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        {/* Classroom */}
                        <Select value={filterClassId || 'all'} onValueChange={v => onFilterClassChange(v === 'all' ? '' : v)}>
                            <SelectTrigger className="h-9 text-xs w-[150px]">
                                <SelectValue placeholder="All Classes" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Classes</SelectItem>
                                {classrooms.map(c => (
                                    <SelectItem key={c.id} value={String(c.id)}>
                                        {c.gradeLevel ? `${c.gradeLevel} - ${c.section?.toUpperCase()}` : c.section?.toUpperCase()}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        {/* Status */}
                        <Select value={filterStatus || 'all'} onValueChange={v => onFilterStatusChange(v === 'all' ? '' : v)}>
                            <SelectTrigger className="h-9 text-xs w-[130px]">
                                <SelectValue placeholder="All Status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Status</SelectItem>
                                <SelectItem value="UPCOMING">Upcoming</SelectItem>
                                <SelectItem value="ONGOING">Ongoing</SelectItem>
                                <SelectItem value="COMPLETED">Completed</SelectItem>
                            </SelectContent>
                        </Select>

                        {hasActive && (
                            <Button variant="ghost" size="sm" className="h-9 text-xs text-slate-500" onClick={onClear}>
                                <XCircle className="h-3.5 w-3.5 mr-1" /> Clear
                            </Button>
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
