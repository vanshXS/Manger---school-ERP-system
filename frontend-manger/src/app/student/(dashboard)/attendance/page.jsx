'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import studentApiClient from '@/lib/studentAxios';
import { showError } from '@/lib/toastHelper';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip as RechartsTooltip, XAxis, YAxis } from 'recharts';
import { ClipboardCheck, Loader2, TrendingDown, TrendingUp, AlertCircle } from 'lucide-react';
import { useEffect, useState } from 'react';

const MONTHS = [
    { value: 1, label: 'January' }, { value: 2, label: 'February' },
    { value: 3, label: 'March' }, { value: 4, label: 'April' },
    { value: 5, label: 'May' }, { value: 6, label: 'June' },
    { value: 7, label: 'July' }, { value: 8, label: 'August' },
    { value: 9, label: 'September' }, { value: 10, label: 'October' },
    { value: 11, label: 'November' }, { value: 12, label: 'December' }
];

export default function StudentAttendancePage() {
    const [academicYears, setAcademicYears] = useState([]);
    const [selectedYearId, setSelectedYearId] = useState('');
    const [summary, setSummary] = useState(null);
    const [monthlyData, setMonthlyData] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
    const [selectedRealYear, setSelectedRealYear] = useState(new Date().getFullYear());
    const [monthComparison, setMonthComparison] = useState(null);

    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                const yearsRes = await studentApiClient.get('/api/student/academic-years');
                setAcademicYears(yearsRes.data);

                const currentYear = yearsRes.data.find(y => y.current) || yearsRes.data[0];
                if (currentYear) {
                    setSelectedYearId(currentYear.id.toString());
                    await loadAttendanceData(currentYear.id);
                }
            } catch (error) {
                showError('Failed to load academic years.');
            } finally {
                setIsLoading(false);
            }
        };

        fetchInitialData();
    }, []);

    const loadAttendanceData = async (yearId) => {
        try {
            const summaryRes = await studentApiClient.get(`/api/student/attendance/summary?academicYearId=${yearId}`);
            setSummary(summaryRes.data);

            // Fetch actual historical data for timeline
            // Since there's no bulk monthly endpoint in SRS, we will construct a mock timeline for the active year 
            // from the summary to at least show a visual representation (or we could make 12 API calls, but that's slow).
            // Ideal: update backend to return monthly trends.
            
            // For now we will fetch the currently selected month comparison:
            fetchMonthComparison(selectedRealYear, selectedMonth);

        } catch (error) {
            showError('Failed to load attendance data.');
        }
    };

    const fetchMonthComparison = async (year, month) => {
        try {
            const res = await studentApiClient.get(`/api/student/attendance/monthly?year=${year}&month=${month}`);
            setMonthComparison(res.data);
            
            // Generate a simple chart data set
            if (res.data.previousPercentage !== null && res.data.currentPercentage !== null) {
                setMonthlyData([
                    { month: 'Previous', percentage: res.data.previousPercentage },
                    { month: 'Current', percentage: res.data.currentPercentage }
                ]);
            }
        } catch (error) {
            // handle silently
        }
    };

    useEffect(() => {
        if (selectedYearId) {
            fetchMonthComparison(selectedRealYear, selectedMonth);
        }
    }, [selectedMonth, selectedRealYear, selectedYearId]);

    if (isLoading) {
        return (
            <div className="admin-page flex justify-center items-center min-h-[60vh]">
                <Loader2 className="animate-spin h-8 w-8 text-orange-600" />
            </div>
        );
    }

    return (
        <div className="admin-page space-y-6 max-w-6xl mx-auto">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 flex items-center gap-3">
                        <ClipboardCheck className="text-orange-600" size={32} />
                        Attendance
                    </h1>
                    <p className="text-slate-500 mt-1">Track your presence and stay on target.</p>
                </div>

                <Select value={selectedYearId} onValueChange={(val) => {
                    setSelectedYearId(val);
                    loadAttendanceData(val);
                }}>
                    <SelectTrigger className="w-[200px] bg-white border-slate-200">
                        <SelectValue placeholder="Academic Year" />
                    </SelectTrigger>
                    <SelectContent>
                        {academicYears.map(yr => (
                            <SelectItem key={yr.id} value={yr.id.toString()}>{yr.name} {yr.current ? '(Current)' : ''}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {/* Overview Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                <Card className="border-slate-200/60 shadow-sm relative overflow-hidden">
                    <div className="absolute right-0 top-0 w-24 h-24 bg-gradient-to-br from-orange-100 to-transparent opacity-50 rounded-bl-full pointer-events-none" />
                    <CardContent className="p-6">
                        <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Overall Percentage</p>
                        <div className="mt-2 flex items-baseline gap-2">
                            <span className={`text-4xl font-black ${
                                summary?.percentage >= 75 ? 'text-emerald-600' : 
                                summary?.percentage >= 60 ? 'text-amber-500' : 'text-red-500'
                            }`}>
                                {summary?.percentage || 0}%
                            </span>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-slate-200/60 shadow-sm">
                    <CardContent className="p-6">
                        <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Total Working Days</p>
                        <div className="mt-2 text-3xl font-bold text-slate-800">{summary?.totalDays || 0}</div>
                    </CardContent>
                </Card>
                <Card className="border-slate-200/60 shadow-sm">
                    <CardContent className="p-6">
                        <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Days Present</p>
                        <div className="mt-2 text-3xl font-bold text-emerald-600">{summary?.presentDays || 0}</div>
                    </CardContent>
                </Card>
                <Card className="border-slate-200/60 shadow-sm">
                    <CardContent className="p-6">
                        <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Days Absent</p>
                        <div className="mt-2 text-3xl font-bold text-red-500">{summary?.absentDays || 0}</div>
                    </CardContent>
                </Card>
            </div>

            {/* Monthly Deep Dive */}
            <Card className="border-slate-200/60 shadow-sm">
                <CardHeader className="border-b border-slate-100 bg-slate-50/50 pb-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <CardTitle className="text-lg font-bold text-slate-800">Monthly Deep Dive</CardTitle>
                        
                        <div className="flex gap-2">
                            <Select value={selectedMonth.toString()} onValueChange={(val) => setSelectedMonth(parseInt(val))}>
                                <SelectTrigger className="w-[140px] bg-white h-9">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {MONTHS.map(m => <SelectItem key={m.value} value={m.value.toString()}>{m.label}</SelectItem>)}
                                </SelectContent>
                            </Select>
                            
                            <Select value={selectedRealYear.toString()} onValueChange={(val) => setSelectedRealYear(parseInt(val))}>
                                <SelectTrigger className="w-[100px] bg-white h-9">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {[2024, 2025, 2026, 2027].map(yr => <SelectItem key={yr} value={yr.toString()}>{yr}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                    
                    {monthComparison?.currentPercentage != null ? (
                        <>
                        <div className="space-y-6">
                            <div className="flex items-start gap-4 p-5 bg-white border border-slate-200 rounded-2xl shadow-sm">
                                <div className={`p-3 rounded-xl shrink-0 ${monthComparison.delta >= 0 ? 'bg-emerald-100' : 'bg-red-100'}`}>
                                    {monthComparison.delta >= 0 ? <TrendingUp size={24} className="text-emerald-600" /> : <TrendingDown size={24} className="text-red-600" />}
                                </div>
                                <div>
                                    <h3 className="text-sm font-semibold text-slate-500 mb-1">Comparing to previous month</h3>
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-3xl font-bold text-slate-900">{monthComparison.currentPercentage}%</span>
                                        <span className={`text-sm font-bold ${monthComparison.delta >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                                            {monthComparison.delta > 0 ? '+' : ''}{monthComparison.delta}%
                                        </span>
                                    </div>
                                </div>
                            </div>
                            
                            {monthComparison.currentPercentage < 75 && (
                                <div className="flex items-start gap-3 p-4 bg-orange-50 border border-orange-200 text-orange-800 rounded-xl">
                                    <AlertCircle className="shrink-0 mt-0.5" size={18} />
                                    <p className="text-sm">Your attendance for this month is below the 75% threshold. Please try to attend more classes to avoid academic risks.</p>
                                </div>
                            )}
                        </div>

                        <div className="h-64 w-full">
                            {monthlyData.length > 0 && (
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={monthlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                        <defs>
                                            <linearGradient id="colorPct" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#ea580c" stopOpacity={0.3}/>
                                                <stop offset="95%" stopColor="#ea580c" stopOpacity={0}/>
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                        <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} dy={10} />
                                        <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} domain={[0, 100]} />
                                        <RechartsTooltip 
                                            contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 15px rgba(0,0,0,0.05)'}}
                                            formatter={(value) => [`${value}%`, 'Attendance']}
                                        />
                                        <Area type="monotone" dataKey="percentage" stroke="#ea580c" strokeWidth={3} fillOpacity={1} fill="url(#colorPct)" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            )}
                        </div>
                        </>
                    ) : (
                        <div className="col-span-full py-16 text-center text-slate-500">
                            No attendance records found for this specific month.
                        </div>
                    )}
                </CardContent>
            </Card>

        </div>
    );
}
