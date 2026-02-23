'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import apiClient from '@/lib/axios';
import { format, formatDistanceToNow, isValid } from 'date-fns';
import {
  AlertTriangle, BarChart3, GraduationCap,
  MoreHorizontal, Percent, RefreshCw, Settings, Users, XCircle
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Bar, BarChart, CartesianGrid, Legend,
  ResponsiveContainer, Tooltip, XAxis, YAxis
} from 'recharts';

/* ─────────────────────────────────────────────────────────────────────────────
   DATA TRANSFORMATION HELPERS

   Backend sends ClassroomEnrollmentDTO (enrollment-overview endpoint):
     { classroomName: "Grade 10 - A",  ← gradeLevel.displayName + " - " + section
       capacity: 40,
       enrolled: 32 }

   Chart needs:
     { name: "G10-A",            ← short axis label via toShortLabel()
       fullName: "Grade 10 - A", ← full tooltip label (classroomName as-is)
       enrolled: 32,
       capacity: 40 }
───────────────────────────────────────────────────────────────────────────── */

/**
 * "Grade 10 - A" → "G10-A"  |  "Nursery - B" → "NUR-B"
 * "LKG - A" → "LKG-A"  |  "UKG - A" → "UKG-A"
 * Keeps axis labels short so they never overlap.
 */
function toShortLabel(classroomName = '') {
  if (!classroomName) return '?';
  // Split on " - " to get ["Grade 10", "A"] or ["Nursery", "B"]
  const parts = classroomName.split(' - ');
  const grade   = parts[0]?.trim() || classroomName;
  const section = parts[1]?.trim() || '';

  let shortGrade = grade;
  if (grade === 'Nursery')   shortGrade = 'NUR';
  else if (grade === 'LKG')  shortGrade = 'LKG';
  else if (grade === 'UKG')  shortGrade = 'UKG';
  else {
    const m = grade.match(/Grade\s*(\d+)/i);
    if (m) shortGrade = `G${m[1]}`;
  }

  return section ? `${shortGrade}-${section}` : shortGrade;
}

/** Transforms ClassroomEnrollmentDTO[] → recharts-ready array */
function transformEnrollment(raw = []) {
  // ClassroomEnrollmentDTO fields (after fix):
  //   classroomName → "Grade 10 - A"  (gradeLevel.displayName + " - " + section)
  //   capacity      → classroom capacity (int)
  //   enrolled      → enrolled student count (int)
  return raw.map(c => ({
    name:     toShortLabel(c.classroomName),  // "G10-A" → short for X-axis
    fullName: c.classroomName || 'Unknown',   // "Grade 10 - A" → shown in tooltip
    enrolled: c.enrolled ?? 0,
    capacity: c.capacity ?? 0,
  }));
}

/** Safe date — returns null instead of throwing on bad values */
function safeDate(val) {
  if (!val) return null;
  const d = new Date(val);
  return isValid(d) ? d : null;
}

/* ─────────────────────────────────────────────────────────────────────────────
   KPI CARD
───────────────────────────────────────────────────────────────────────────── */
const KpiCard = ({ title, value, icon: Icon, isAlert = false }) => (
  <Card className={`rounded-xl border shadow-sm transition-all duration-200 hover:shadow-md ${
    isAlert ? 'border-amber-200 bg-amber-50/50' : 'border-slate-200/80 bg-white'
  }`}>
    <CardHeader className="p-4 sm:p-5 pb-2 flex flex-row items-center justify-between space-y-0">
      <CardTitle className={`text-xs font-semibold uppercase tracking-wider ${
        isAlert ? 'text-amber-800' : 'text-slate-500'
      }`}>
        {title}
      </CardTitle>
      <div className={`p-2 rounded-lg ${isAlert ? 'bg-amber-100' : 'bg-slate-100'}`}>
        <Icon className={`h-4 w-4 ${isAlert ? 'text-amber-600' : 'text-slate-500'}`} />
      </div>
    </CardHeader>
    <CardContent className="p-4 sm:p-5 pt-1">
      <p className={`text-2xl sm:text-3xl font-bold tracking-tight ${isAlert ? 'text-amber-700' : 'text-slate-800'}`}>
        {value !== undefined && value !== null ? value : '--'}
      </p>
    </CardContent>
  </Card>
);

/* ─────────────────────────────────────────────────────────────────────────────
   WORKLOAD ITEM
   Backend: { name: "First Last", assignedClassesCount: 5 }
   maxLoad passed from parent (computed from dataset max, floor 8)
───────────────────────────────────────────────────────────────────────────── */
const WorkloadItem = ({ name, load, maxLoad = 8 }) => {
  const pct = Math.min((load / maxLoad) * 100, 100);
  let barColor   = 'bg-emerald-500';
  let loadText   = 'Optimal';
  let badgeColor = 'text-emerald-700 bg-emerald-50 border-emerald-200';

  if (pct > 85) {
    barColor   = 'bg-red-500';
    loadText   = 'Overloaded';
    badgeColor = 'text-red-700 bg-red-50 border-red-200';
  } else if (pct < 40) {
    barColor   = 'bg-amber-400';
    loadText   = 'Underutilized';
    badgeColor = 'text-amber-700 bg-amber-50 border-amber-200';
  }

  return (
    <div className="group hover:bg-slate-50 p-2.5 rounded-md transition-colors border border-transparent hover:border-slate-100">
      <div className="flex justify-between mb-1.5 items-end">
        <div>
          <p className="text-sm font-semibold text-slate-800 leading-tight">{name}</p>
          <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded border mt-1 inline-block ${badgeColor}`}>
            {loadText}
          </span>
        </div>
        <p className="text-sm font-bold text-slate-700 leading-none">
          {load} <span className="text-[10px] font-medium text-slate-400">/ {maxLoad}</span>
        </p>
      </div>
      <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
        <div className={`${barColor} h-full rounded-full transition-all duration-700`}
          style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
};

/* ─────────────────────────────────────────────────────────────────────────────
   CHART TOOLTIP
   Uses fullName from payload for the proper "Grade 10 - A" display.
   Shows enrolled, capacity, utilization % with colour coding.
───────────────────────────────────────────────────────────────────────────── */
const CustomChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  const fullName = payload[0]?.payload?.fullName || label;
  const enrolled = payload.find(p => p.dataKey === 'enrolled')?.value ?? 0;
  const capacity = payload.find(p => p.dataKey === 'capacity')?.value  ?? 0;
  const pct      = capacity > 0 ? Math.round((enrolled / capacity) * 100) : 0;
  const pctColor = pct >= 100 ? 'text-red-600' : pct >= 85 ? 'text-amber-600' : 'text-emerald-600';

  return (
    <div className="bg-white border border-slate-200 shadow-lg rounded-lg p-3 text-sm min-w-[160px]">
      <p className="font-semibold text-slate-800 mb-2 border-b border-slate-100 pb-1">{fullName}</p>
      <div className="space-y-1">
        <div className="flex justify-between gap-4 text-xs font-medium">
          <span className="text-blue-500">Enrolled:</span>
          <span className="text-slate-700">{enrolled}</span>
        </div>
        <div className="flex justify-between gap-4 text-xs font-medium">
          <span className="text-slate-400">Capacity:</span>
          <span className="text-slate-700">{capacity}</span>
        </div>
        <div className={`flex justify-between gap-4 text-xs font-bold pt-1 border-t border-slate-100 ${pctColor}`}>
          <span>Utilization:</span>
          <span>{pct}%</span>
        </div>
      </div>
    </div>
  );
};

/* ─────────────────────────────────────────────────────────────────────────────
   MAIN DASHBOARD
───────────────────────────────────────────────────────────────────────────── */
export default function AcademicHealthDashboard() {
  const [data,           setData]           = useState({ kpis: null, enrollment: [], workload: [], activity: [] });
  const [isLoading,      setIsLoading]      = useState(true);
  const [dashboardError, setDashboardError] = useState(null);
  const [isRefetching,   setIsRefetching]   = useState(false);

  const router    = useRouter();
  const isMounted = useRef(false);

  const fetchData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setIsRefetching(true); else setIsLoading(true);
    setDashboardError(null);

    try {
      const [kpisRes, enrollmentRes, workloadRes, activityRes] = await Promise.all([
        apiClient.get('/api/admin/dashboard/kpis'),
        apiClient.get('/api/admin/dashboard/enrollment-overview'),
        apiClient.get('/api/admin/dashboard/teacher-workload'),
        apiClient.get('/api/admin/dashboard/recent-activity'),
      ]);
      if (!isMounted.current) return;

      /* enrollment: ClassroomResponseDTO[] → chart shape */
      const enrollmentChart = transformEnrollment(enrollmentRes.data || []);

      /* workload: compute maxLoad from dataset so bars are relative to busiest teacher */
      const rawWorkload = workloadRes.data || [];
      const maxLoad     = Math.max(8, ...rawWorkload.map(t => t.assignedClassesCount ?? 0));

      setData({
        kpis:       kpisRes.data,
        enrollment: enrollmentChart,
        /* embed maxLoad into each teacher row so WorkloadItem can use it */
        workload:   rawWorkload.map(t => ({ ...t, maxLoad })),
        activity:   activityRes.data || [],
      });
    } catch (error) {
      if (!isMounted.current) return;
      setDashboardError(error?.customMessage || 'Unable to connect to dashboard services.');
    } finally {
      if (isMounted.current) { setIsLoading(false); setIsRefetching(false); }
    }
  }, []);

  useEffect(() => {
    isMounted.current = true;
    fetchData();
    return () => { isMounted.current = false; };
  }, [fetchData]);

  /* ── LOADING SKELETON ── */
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-end">
          <div className="space-y-2">
            <Skeleton className="h-8 w-48 rounded" />
            <Skeleton className="h-3 w-32 rounded" />
          </div>
          <Skeleton className="h-9 w-28 rounded-md" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-28 w-full rounded-lg" />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Skeleton className="h-[350px] w-full rounded-lg lg:col-span-2" />
          <Skeleton className="h-[350px] w-full rounded-lg" />
        </div>
        <Skeleton className="h-[300px] w-full rounded-lg" />
      </div>
    );
  }

  /* ── ERROR STATE ── */
  if (dashboardError) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] p-4">
        <div className="w-full max-w-md text-center p-6 bg-white shadow-sm rounded-xl border border-red-200">
          <AlertTriangle className="h-10 w-10 text-red-500 mx-auto mb-3" />
          <h2 className="text-lg font-semibold text-slate-900 mb-1">System Alert</h2>
          <p className="text-sm text-slate-500 mb-6">{dashboardError}</p>
          <div className="space-y-2">
            <Button className="w-full h-9" onClick={() => fetchData()}>
              <RefreshCw className="mr-2 h-4 w-4" /> Try Again
            </Button>
            <Button variant="outline" className="w-full h-9" onClick={() => router.push('/admin/settings')}>
              <Settings className="mr-2 h-4 w-4" /> Check Settings
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const { kpis, enrollment, workload, activity } = data;

  /* angle the X-axis labels when there are many classrooms to prevent overlap */
  const manyClassrooms = enrollment.length > 8;
  const xAxisAngle     = manyClassrooms ? -40 : 0;
  const xAxisAnchor    = manyClassrooms ? 'end' : 'middle';
  const xAxisHeight    = manyClassrooms ? 54 : 30;
  const chartBottom    = manyClassrooms ? 30 : 10;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">

      {/* ── HEADER ── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">Dashboard</h1>
          <p className="text-sm text-slate-500 mt-1">
            System overview as of{' '}
            <span className="font-semibold text-slate-700">{format(new Date(), 'MMM d, yyyy')}</span>
          </p>
        </div>
        <Button
          variant="outline" size="sm"
          onClick={() => fetchData(true)}
          disabled={isRefetching}
          className="h-8 text-xs border-slate-200 shadow-sm"
        >
          <RefreshCw className={`mr-2 h-3 w-3 ${isRefetching ? 'animate-spin text-blue-600' : 'text-slate-500'}`} />
          {isRefetching ? 'Syncing...' : 'Sync Data'}
        </Button>
      </div>

      {/* ── KPI CARDS ──
          DashboardKpiDTO fields (exact backend field names):
            totalStudents        → studentRepository.count()
            activeTeachers       → teacherRespository.count()
            classroomUtilization → (enrolledStudents / totalCapacity) * 100  [integer %]
            unassignedTeachers   → teachers with no TeacherAssignment rows
      ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <KpiCard title="Total Students"    value={kpis?.totalStudents}                                              icon={GraduationCap} />
        <KpiCard title="Active Faculty"    value={kpis?.activeTeachers}                                             icon={Users}         />
        <KpiCard title="Room Utilization"  value={kpis?.classroomUtilization != null ? `${kpis.classroomUtilization}%` : '--'} icon={Percent}       />
        <KpiCard
          title="Unassigned Staff"
          value={kpis?.unassignedTeachers ?? 0}
          icon={AlertTriangle}
          isAlert={(kpis?.unassignedTeachers ?? 0) > 0}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* ── ENROLLMENT CHART ── */}
        <Card className="lg:col-span-2 rounded-xl shadow-sm border-slate-200/80">
          <CardHeader className="p-4 border-b border-slate-100 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-sm font-semibold text-slate-800">Enrollment vs. Capacity</CardTitle>
              <CardDescription className="text-xs mt-0.5">Real-time classroom distribution</CardDescription>
            </div>
            <BarChart3 className="h-4 w-4 text-slate-400" />
          </CardHeader>
          <CardContent className="p-4">
            {enrollment.length > 0 ? (
              <div className="w-full h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={enrollment}
                    margin={{ top: 10, right: 10, left: -25, bottom: chartBottom }}
                    barGap={2}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis
                      dataKey="name"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#64748b', fontSize: 11 }}
                      angle={xAxisAngle}
                      textAnchor={xAxisAnchor}
                      height={xAxisHeight}
                      interval={0}
                      dy={manyClassrooms ? 4 : 8}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#64748b', fontSize: 11 }}
                    />
                    <Tooltip content={<CustomChartTooltip />} cursor={{ fill: '#f8fafc' }} />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                    <Bar name="Enrolled" dataKey="enrolled" fill="#3b82f6" radius={[2, 2, 0, 0]} maxBarSize={40} />
                    <Bar name="Capacity" dataKey="capacity" fill="#cbd5e1" radius={[2, 2, 0, 0]} maxBarSize={40} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-72 flex flex-col items-center justify-center text-slate-400 bg-slate-50/50 rounded border border-dashed border-slate-200">
                <BarChart3 className="h-8 w-8 mb-2 opacity-30" />
                <p className="text-sm font-medium text-slate-500">No Classroom Data</p>
                <p className="text-xs text-slate-400 mt-1">Classrooms will appear once students are enrolled</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* ── TEACHER WORKLOAD ── */}
        <Card className="rounded-xl shadow-sm border-slate-200/80 flex flex-col h-[365px] min-h-[280px]">
          <CardHeader className="p-4 border-b border-slate-100 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-semibold text-slate-800">Faculty Workload</CardTitle>
            <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
              {workload.length} Staff
            </span>
          </CardHeader>
          <CardContent className="flex-1 p-2 overflow-hidden">
            {workload.length > 0 ? (
              <div className="h-full overflow-y-auto pr-2 space-y-0.5 custom-scrollbar pb-2">
                {workload.map((teacher, idx) => (
                  <WorkloadItem
                    key={`${teacher.name}-${idx}`}
                    name={teacher.name}
                    load={teacher.assignedClassesCount ?? 0}
                    maxLoad={teacher.maxLoad}
                  />
                ))}
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-400">
                <Users className="h-8 w-8 mb-2 opacity-30" />
                <p className="text-sm font-medium text-slate-500">No Faculty Data</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── RECENT ACTIVITY ──
          Backend: { description: string, category: string, date: ISO-8601 string }[]
          safeDate() guards against null/invalid dates so formatDistanceToNow never throws.
      ── */}
      <Card className="rounded-xl shadow-sm border-slate-200/80">
        <CardHeader className="flex flex-row justify-between items-center border-b border-slate-100 p-4">
          <CardTitle className="text-sm font-semibold text-slate-800">Recent Activity</CardTitle>
          {activity.length > 0 && (
            <Link href="/admin/activity-logs"
              className="text-xs font-medium text-blue-600 hover:underline flex items-center gap-1">
              View All <MoreHorizontal className="h-3 w-3" />
            </Link>
          )}
        </CardHeader>

        <CardContent className="p-0">
          <div className="max-h-[300px] overflow-auto">
            <Table>
              <TableHeader className="bg-slate-50 sticky top-0 z-10 shadow-sm border-b border-slate-200">
                <TableRow className="hover:bg-slate-50">
                  <TableHead className="text-xs font-semibold text-slate-500 py-3 pl-4">Event Description</TableHead>
                  <TableHead className="text-xs font-semibold text-slate-500 py-3">Category</TableHead>
                  <TableHead className="text-xs font-semibold text-slate-500 py-3 text-right pr-4">Time</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {activity.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center py-12 text-slate-500">
                      <XCircle className="h-6 w-6 mx-auto mb-2 opacity-20" />
                      <p className="text-sm font-medium">No recent activity recorded.</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  activity.map((item, index) => {
                    const date = safeDate(item.date);
                    return (
                      <TableRow key={index}
                        className="hover:bg-slate-50/50 transition-colors border-slate-100">
                        <TableCell className="text-sm font-medium text-slate-700 pl-4 py-2.5">
                          {item.description}
                        </TableCell>
                        <TableCell className="py-2.5">
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
                            {item.category}
                          </span>
                        </TableCell>
                        <TableCell className="text-right text-xs text-slate-500 whitespace-nowrap pr-4 py-2.5">
                          {date ? formatDistanceToNow(date, { addSuffix: true }) : '—'}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

    </div>
  );
}