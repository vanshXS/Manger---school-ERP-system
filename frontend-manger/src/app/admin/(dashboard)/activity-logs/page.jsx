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
import apiClient from '@/lib/axios';
import { format, isValid } from 'date-fns';
import {
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  History,
  RefreshCcw
} from 'lucide-react';
import { useEffect, useState } from 'react';

export default function ActivityLogsPage() {
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
      const res = await apiClient.get('/api/admin/dashboard/activity-logs', {
        params: { page, size: pageSize },
      });

      // Debug: Check what the API actually returns in the console
      console.log('API Response:', res.data);

      setLogs(res.data.content || []);
      setTotalPages(res.data.totalPages || 0);
      setTotalElements(res.data.totalElements || 0);
    } catch (err) {
      console.error('Failed to fetch logs:', err);
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
    // 1. Try to find the date field
    const dateValue = log.date || log.createdAt || log.timestamp || log.time;

    if (!dateValue) return 'N/A';

    // 2. Parse the date safely
    const dateObj = new Date(dateValue);

    // 3. Check if valid and format
    if (isValid(dateObj)) {
      return format(dateObj, 'MMM d, yyyy h:mm a');
    }

    return 'Invalid Date';
  };

  const getCategoryColor = (category) => {
    const lower = category?.toLowerCase() || '';
    if (lower.includes('error') || lower.includes('delete') || lower.includes('fail'))
      return 'bg-red-100 text-red-800 border-red-200';
    if (lower.includes('create') || lower.includes('success') || lower.includes('add'))
      return 'bg-green-100 text-green-800 border-green-200';
    if (lower.includes('update') || lower.includes('edit'))
      return 'bg-blue-100 text-blue-800 border-blue-200';
    return 'bg-slate-100 text-slate-800 border-slate-200';
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto p-4 md:p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <History className="h-6 w-6 text-slate-600" />
            System Activity
          </h1>
          <p className="text-slate-500 mt-1">
            View and track all system events and user actions.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchLogs} disabled={loading}>
          <RefreshCcw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <Card className="shadow-sm border-slate-200">
        <CardHeader className="border-b border-slate-100 bg-slate-50/50">
          <div className="flex justify-between items-center">
            <CardTitle className="text-lg font-semibold text-slate-700">Audit Log</CardTitle>
            {!loading && totalElements > 0 && (
              <span className="text-sm text-slate-500">
                Showing {page * pageSize + 1}-{Math.min((page + 1) * pageSize, totalElements)} of {totalElements}
              </span>
            )}
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {error ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <AlertCircle className="h-10 w-10 text-red-500 mb-3" />
              <p className="text-slate-800 font-medium">Unable to load data</p>
              <Button variant="outline" className="mt-4" onClick={fetchLogs}>Try Again</Button>
            </div>
          ) : loading ? (
            <div className="p-4 space-y-4">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-16 text-slate-500">
              <History className="h-12 w-12 mx-auto mb-3 text-slate-300 opacity-50" />
              <p>No activity logs found.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-slate-50">
                  <TableRow>
                    <TableHead className="w-[50%]">Description</TableHead>
                    <TableHead className="w-[20%] hidden sm:table-cell">Category</TableHead>
                    <TableHead className="w-[30%] text-right">Timestamp</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map((log, i) => (
                    <TableRow key={i} className="hover:bg-slate-50/50 transition-colors">
                      <TableCell className="font-medium text-slate-700 py-4">
                        {log.description}
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${getCategoryColor(log.category)}`}>
                          {log.category}
                        </span>
                      </TableCell>

                      {/* UPDATED: Uses the safe formatDate helper */}
                      <TableCell className="text-right text-slate-500 tabular-nums">
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
          <CardFooter className="flex items-center justify-between border-t border-slate-100 bg-slate-50/50 p-4">
            <div className="text-xs text-slate-500">
              Page {page + 1} of {totalPages}
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page === 0}
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                className="h-8 px-3"
              >
                <ChevronLeft className="mr-1 h-4 w-4" /> Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages - 1}
                onClick={() => setPage((p) => p + 1)}
                className="h-8 px-3"
              >
                Next <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </div>
          </CardFooter>
        )}
      </Card>
    </div>
  );
}