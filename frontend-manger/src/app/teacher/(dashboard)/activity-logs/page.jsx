'use client';

import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardFooter,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import teacherApiClient from '@/lib/teacherAxios';
import { format, isValid } from 'date-fns';
import {
    AlertCircle,
    ChevronLeft,
    ChevronRight,
    History,
    RefreshCcw
} from 'lucide-react';
import { useEffect, useState } from 'react';

export default function TeacherActivityLogsPage() {
    const [logs, setLogs] = useState([]);
    const [page, setPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [totalElements, setTotalElements] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const pageSize = 10;

    const fetchLogs = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await teacherApiClient.get('/api/teacher/dashboard/activity-logs', {
                params: { page, size: pageSize },
            });

            setLogs(res.data.content || []);
            setTotalPages(res.data.totalPages || 0);
            setTotalElements(res.data.totalElements || 0);
        } catch (err) {
            console.error('Failed to fetch teacher logs:', err);
            setError('Failed to load activity logs.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLogs();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [page]);

    // Helper: Safely parse and format date from multiple possible field names
    const formatDate = (log) => {
        const dateValue = log.date || log.createdAt || log.timestamp || log.time;
        if (!dateValue) return 'N/A';
        const dateObj = new Date(dateValue);
        if (isValid(dateObj)) {
            return format(dateObj, 'MMM d, yyyy h:mm a');
        }
        return 'Invalid Date';
    };

    const getCategoryColor = (category) => {
        const lower = category?.toLowerCase() || '';
        if (lower.includes('error') || lower.includes('delete') || lower.includes('fail') || lower.includes('absent'))
            return 'bg-red-100 text-red-800 border-red-200';
        if (lower.includes('create') || lower.includes('success') || lower.includes('add') || lower.includes('present'))
            return 'bg-green-100 text-green-800 border-green-200';
        if (lower.includes('update') || lower.includes('edit') || lower.includes('mark'))
            return 'bg-blue-100 text-blue-800 border-blue-200';
        return 'bg-slate-100 text-slate-800 border-slate-200';
    };

    return (
        <div className="space-y-6 max-w-6xl mx-auto p-4 md:p-6 animate-in fade-in duration-300">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                        <span className="p-2 rounded-xl bg-blue-100 text-blue-600 shadow-sm border border-blue-200/50">
                            <History className="h-5 w-5" />
                        </span>
                        Recent Activity
                    </h1>
                    <p className="text-sm text-slate-500 mt-1 font-medium">
                        Track your recent actions, attendance markings, and grade entries.
                    </p>
                </div>
                <Button variant="outline" size="sm" onClick={fetchLogs} disabled={loading} className="bg-white hover:bg-slate-50 border-slate-200 shadow-sm">
                    <RefreshCcw className={`mr-2 h-4 w-4 text-slate-500 ${loading ? 'animate-spin text-blue-500' : ''}`} />
                    Refresh
                </Button>
            </div>

            <Card className="shadow-sm border-slate-200 overflow-hidden">
                <CardHeader className="border-b border-slate-100 bg-slate-50/80 px-5 py-4">
                    <div className="flex justify-between items-center">
                        <CardTitle className="text-base font-bold text-slate-700">Activity Log</CardTitle>
                        {!loading && totalElements > 0 && (
                            <span className="text-xs font-semibold text-slate-500 bg-white px-2.5 py-1 rounded-full border border-slate-200 shadow-sm">
                                {page * pageSize + 1}-{Math.min((page + 1) * pageSize, totalElements)} of {totalElements}
                            </span>
                        )}
                    </div>
                </CardHeader>

                <CardContent className="p-0">
                    {error ? (
                        <div className="flex flex-col items-center justify-center py-16 text-center bg-white">
                            <AlertCircle className="h-10 w-10 text-red-400 mb-3" />
                            <p className="text-slate-800 font-semibold mb-1">Unable to load data</p>
                            <p className="text-sm text-slate-500 mb-4">{error}</p>
                            <Button variant="outline" size="sm" onClick={fetchLogs}>Try Again</Button>
                        </div>
                    ) : loading ? (
                        <div className="p-5 space-y-4 bg-white">
                            {[...Array(5)].map((_, i) => (
                                <Skeleton key={i} className="h-14 w-full rounded-xl bg-slate-100/80" />
                            ))}
                        </div>
                    ) : logs.length === 0 ? (
                        <div className="text-center py-20 bg-white border-2 border-dashed border-slate-100 m-4 rounded-2xl">
                            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-3">
                                <History className="h-8 w-8 text-slate-300" />
                            </div>
                            <p className="font-semibold text-slate-700">No recent activity</p>
                            <p className="text-sm text-slate-500 mt-1">Your actions will appear here once you start using the system.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto bg-white">
                            <Table>
                                <TableHeader className="bg-slate-50/50">
                                    <TableRow className="border-slate-100 hover:bg-transparent">
                                        <TableHead className="w-[50%] font-bold text-slate-600 text-xs uppercase tracking-wider h-11">Description</TableHead>
                                        <TableHead className="w-[20%] hidden sm:table-cell font-bold text-slate-600 text-xs uppercase tracking-wider h-11">Category</TableHead>
                                        <TableHead className="w-[30%] text-right font-bold text-slate-600 text-xs uppercase tracking-wider h-11">Timestamp</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody className="divide-y divide-slate-50">
                                    {logs.map((log, i) => (
                                        <TableRow key={i} className="hover:bg-slate-50/50 transition-colors border-slate-100 group">
                                            <TableCell className="font-medium text-slate-700 py-4">
                                                {log.description}
                                            </TableCell>
                                            <TableCell className="hidden sm:table-cell py-4">
                                                <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border shadow-sm ${getCategoryColor(log.category)}`}>
                                                    {log.category}
                                                </span>
                                            </TableCell>
                                            <TableCell className="text-right text-xs font-semibold text-slate-500 tabular-nums py-4 group-hover:text-slate-700 transition-colors">
                                                {formatDate(log)}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>

                {!loading && !error && logs.length > 0 && (
                    <CardFooter className="flex items-center justify-between border-t border-slate-100 bg-slate-50/80 p-4">
                        <div className="text-xs font-semibold text-slate-500">
                            Page {page + 1} of {totalPages}
                        </div>
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={page === 0}
                                onClick={() => setPage((p) => Math.max(0, p - 1))}
                                className="h-8 px-3 bg-white hover:bg-slate-50 border-slate-200 shadow-sm"
                            >
                                <ChevronLeft className="mr-1 h-3.5 w-3.5 text-slate-500" /> <span className="text-xs font-medium">Prev</span>
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={page >= totalPages - 1}
                                onClick={() => setPage((p) => p + 1)}
                                className="h-8 px-3 bg-white hover:bg-slate-50 border-slate-200 shadow-sm"
                            >
                                <span className="text-xs font-medium">Next</span> <ChevronRight className="ml-1 h-3.5 w-3.5 text-slate-500" />
                            </Button>
                        </div>
                    </CardFooter>
                )}
            </Card>
        </div>
    );
}
