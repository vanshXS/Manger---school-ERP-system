'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import studentApiClient from '@/lib/studentAxios';
import { showError } from '@/lib/toastHelper';
import { CalendarClock, Clock, Loader2, MapPin, UserCircle } from 'lucide-react';
import { useEffect, useState } from 'react';

const DAYS_OF_WEEK = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];

export default function StudentTimetablePage() {
    const [timetable, setTimetable] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedDay, setSelectedDay] = useState(
        new Date().toLocaleDateString('en-US', { weekday: 'long' }).toUpperCase()
    );

    // Fallback if today is Sunday or not in the list
    if (!DAYS_OF_WEEK.includes(selectedDay)) {
        // Must be changed within a useEffect or directly before render if state init is complex, 
        // but since we just need a default:
    }

    useEffect(() => {
        const fetchTimetable = async () => {
            try {
                const response = await studentApiClient.get('/api/student/timetable');
                setTimetable(response.data);
            } catch (error) {
                showError('Failed to load timetable.');
            } finally {
                setIsLoading(false);
            }
        };

        fetchTimetable();
        
        const today = new Date().toLocaleDateString('en-US', { weekday: 'long' }).toUpperCase();
        if (DAYS_OF_WEEK.includes(today)) {
            setSelectedDay(today);
        } else {
            setSelectedDay('MONDAY');
        }
    }, []);

    const formatTime = (timeString) => {
        if (!timeString) return '';
        const [hour, minute] = timeString.split(':');
        const h = parseInt(hour, 10);
        const ampm = h >= 12 ? 'PM' : 'AM';
        const h12 = h % 12 || 12;
        return `${h12}:${minute} ${ampm}`;
    };

    const displayClasses = timetable.filter(t => t.day === selectedDay);

    if (isLoading) {
        return (
            <div className="admin-page flex items-center justify-center min-h-[60vh]">
                <div className="flex flex-col items-center gap-4 text-orange-600">
                    <Loader2 className="animate-spin h-10 w-10" />
                    <p className="text-slate-600 font-medium">Loading Timetable...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="admin-page space-y-6 max-w-5xl mx-auto">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 flex items-center gap-3">
                        <CalendarClock className="text-orange-600" size={32} />
                        My Timetable
                    </h1>
                    <p className="text-slate-500 mt-1">View your weekly class schedule.</p>
                </div>
                
                {/* Mobile Day Selector wrapper */}
                <div className="sm:hidden w-full">
                    <Select value={selectedDay} onValueChange={setSelectedDay}>
                        <SelectTrigger className="w-full bg-white border-slate-200">
                            <SelectValue placeholder="Select Day" />
                        </SelectTrigger>
                        <SelectContent>
                            {DAYS_OF_WEEK.map(day => (
                                <SelectItem key={day} value={day} className="capitalize">{day.toLowerCase()}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <Card className="border-slate-200/60 shadow-sm overflow-hidden bg-white/50 backdrop-blur-sm">
                
                {/* Desktop Tabs */}
                <div className="hidden sm:flex border-b border-slate-200 bg-slate-50/50">
                    {DAYS_OF_WEEK.map(day => (
                        <button
                            key={day}
                            onClick={() => setSelectedDay(day)}
                            className={`flex-1 py-4 text-sm font-semibold transition-colors border-b-2 ${
                                selectedDay === day 
                                ? 'border-orange-600 text-orange-700 bg-orange-50/30' 
                                : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-100/50'
                            }`}
                        >
                            <span className="capitalize">{day.toLowerCase()}</span>
                        </button>
                    ))}
                </div>

                <CardContent className="p-0 sm:p-6 lg:p-8">
                    {displayClasses.length > 0 ? (
                        <div className="grid gap-4 sm:gap-6 p-4 sm:p-0 relative">
                            {/* Vertical timeline line (desktop only) */}
                            <div className="hidden sm:block absolute left-[120px] top-6 bottom-6 w-0.5 bg-orange-100 rounded-full" />

                            {displayClasses.map((cl, idx) => (
                                <div key={idx} className="relative flex flex-col sm:flex-row gap-4 sm:gap-8 bg-white sm:bg-transparent p-4 sm:p-0 rounded-2xl sm:rounded-none border sm:border-0 border-slate-100 shadow-sm sm:shadow-none group transition-all hover:-translate-y-0.5 sm:hover:translate-y-0">
                                    
                                    {/* Desktop Timeline Dot */}
                                    <div className="hidden sm:flex absolute left-[111px] top-4 h-5 w-5 rounded-full border-4 border-white bg-orange-500 shadow-sm group-hover:scale-125 transition-transform" />

                                    {/* Time Block */}
                                    <div className="sm:w-24 shrink-0 flex sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-2 sm:gap-1 text-slate-600 mt-1">
                                        <div className="flex items-center gap-1.5 sm:hidden text-orange-600 mb-2 border-b border-orange-100 pb-2 w-full">
                                            <Clock size={16} /> 
                                            <span className="font-bold text-sm tracking-tight">{formatTime(cl.startTime)} - {formatTime(cl.endTime)}</span>
                                        </div>
                                        <span className="hidden sm:block font-bold text-slate-800 text-sm tracking-tight">{formatTime(cl.startTime)}</span>
                                        <span className="hidden sm:block text-xs text-slate-400 font-medium">{formatTime(cl.endTime)}</span>
                                    </div>

                                    {/* Content Card */}
                                    <div className="flex-1 sm:bg-white sm:border sm:border-slate-100 sm:shadow-sm sm:rounded-2xl sm:p-6 sm:hover:shadow-md sm:hover:border-orange-200 transition-all">
                                        <h3 className="text-lg font-bold text-slate-900 mb-2">{cl.subjectName}</h3>
                                        <div className="flex flex-col gap-1.5">
                                            <div className="flex items-center gap-2 text-sm text-slate-600">
                                                <UserCircle size={16} className="text-slate-400" />
                                                <span className="font-medium text-slate-700">{cl.teacherName}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center p-12 text-center">
                            <div className="bg-slate-100 w-20 h-20 rounded-full flex items-center justify-center mb-6">
                                <CalendarClock size={32} className="text-slate-400" />
                            </div>
                            <h3 className="text-lg font-semibold text-slate-700 mb-2">No Classes Scheduled</h3>
                            <p className="text-slate-500 max-w-sm">Enjoy your free time or use this block for independent study.</p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
