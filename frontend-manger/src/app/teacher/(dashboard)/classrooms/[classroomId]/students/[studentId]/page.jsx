'use client';

import StudentProfile from '@/components/admin/students/StudentProfile';
import { classroomDisplayName } from '@/lib/classroomDisplayName';
import teacherApiClient from '@/lib/teacherAxios';
import { showError } from '@/lib/toastHelper';
import {
    ArrowLeft, ChevronLeft, ChevronRight,
    User
} from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

const RESULTS_PAGE_SIZE = 8;

export default function TeacherStudentProfilePage() {
    const { classroomId, studentId } = useParams();
    const router = useRouter();

    const [student, setStudent] = useState(null);
    const [classroom, setClassroom] = useState(null);
    const [examResults, setExamResults] = useState([]);
    const [attendanceSummary, setAttendanceSummary] = useState(null);
    const [loading, setLoading] = useState(true);
    const [loadingResults, setLoadingResults] = useState(false);

    // Pagination for exam results
    const [currentResultsPage, setCurrentResultsPage] = useState(0);
    const [totalResultsPages, setTotalResultsPages] = useState(0);
    const [totalResultsCount, setTotalResultsCount] = useState(0);

    const isMounted = useRef(false);

    useEffect(() => {
        isMounted.current = true;
        fetchData();
        return () => { isMounted.current = false; };
    }, [classroomId, studentId]);

    const fetchData = async () => {
        try {
            setLoading(true);

            // Fetch classroom info for breadcrumb
            const classRes = await teacherApiClient.get('/api/teacher/attendance/classes');
            const cls = classRes.data.find(c => String(c.id) === String(classroomId));
            if (isMounted.current) setClassroom(cls || null);

            // Fetch full student profile using the new teacher endpoint
            const studentRes = await teacherApiClient.get(`/api/teacher/attendance/students/${studentId}`);
            if (isMounted.current) setStudent(studentRes.data);

            // Fetch attendance summary
            try {
                const attendanceRes = await teacherApiClient.get(`/api/teacher/attendance/students/${studentId}/attendance-summary`);
                if (isMounted.current) setAttendanceSummary(attendanceRes.data);
            } catch (e) {
                // Silently fail if attendance not available
            }

            // Fetch first page of exam results
            await fetchExamResults(0);
        } catch {
            if (isMounted.current) showError('Failed to load student data.');
        } finally {
            if (isMounted.current) setLoading(false);
        }
    };

    const fetchExamResults = async (page = 0) => {
        try {
            setLoadingResults(true);
            const res = await teacherApiClient.get(
                `/api/teacher/marks/students/${studentId}/exam-results?page=${page}&size=${RESULTS_PAGE_SIZE}`
            );
            if (isMounted.current) {
                setExamResults(res.data.content || []);
                setCurrentResultsPage(res.data.number || 0);
                setTotalResultsPages(res.data.totalPages || 0);
                setTotalResultsCount(res.data.totalElements || 0);
            }
        } catch {
            // Silently fail — may have no results
        } finally {
            if (isMounted.current) setLoadingResults(false);
        }
    };

    const handleResultsPageChange = (newPage) => {
        if (newPage < 0 || newPage >= totalResultsPages) return;
        fetchExamResults(newPage);
    };

    const classroomName = classroom ? classroomDisplayName(classroom) : 'Classroom';

    if (loading) {
        return (
            <div className="p-4 md:p-6 max-w-7xl mx-auto">
                <div className="h-5 w-48 bg-slate-200 rounded animate-pulse mb-6" />
                <div className="flex flex-col lg:flex-row gap-6 animate-pulse">
                    <div className="w-full lg:w-1/3 h-[400px] bg-slate-100 rounded-xl" />
                    <div className="w-full lg:w-2/3 h-[400px] bg-slate-100 rounded-xl" />
                </div>
            </div>
        );
    }

    if (!student) {
        return (
            <div className="p-4 md:p-6 max-w-7xl mx-auto text-center py-24">
                <User className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                <h2 className="text-xl font-bold text-slate-900">Student Not Found</h2>
                <p className="text-slate-500 mt-2">This student may not be enrolled in your classroom.</p>
                <button onClick={() => router.back()} className="mt-4 text-indigo-600 font-semibold hover:underline">← Go Back</button>
            </div>
        );
    }

    return (
        <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-5 animate-in fade-in duration-200">
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-sm text-slate-500 flex-wrap">
                <button onClick={() => router.push('/teacher/classrooms')} className="hover:text-indigo-600 transition-colors flex items-center gap-1">
                    <ArrowLeft size={14} /> My Classes
                </button>
                <ChevronRight size={14} />
                <button onClick={() => router.push(`/teacher/classrooms/${classroomId}`)} className="hover:text-indigo-600 transition-colors">
                    {classroomName}
                </button>
                <ChevronRight size={14} />
                <span className="text-slate-800 font-semibold">{student.firstName} {student.lastName}</span>
            </div>

            {/* Full Student Profile (reuses admin's shared component) */}
            <StudentProfile
                student={student}
                examResults={examResults}
                attendanceSummary={attendanceSummary}
                showAttendance={true}
                loadingResults={loadingResults}
            />

            {/* Exam Results Pagination Controls */}
            {totalResultsPages > 1 && (
                <div className="flex items-center justify-between bg-white rounded-xl border border-slate-200 shadow-sm p-4">
                    <p className="text-sm text-slate-500">
                        Page <span className="font-semibold text-slate-700">{currentResultsPage + 1}</span> of{' '}
                        <span className="font-semibold text-slate-700">{totalResultsPages}</span>
                        <span className="hidden sm:inline"> · {totalResultsCount} total results</span>
                    </p>
                    <div className="flex gap-2">
                        <button onClick={() => handleResultsPageChange(currentResultsPage - 1)} disabled={currentResultsPage === 0}
                            className="flex items-center gap-1 px-3 py-2 text-sm font-medium rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                            <ChevronLeft size={16} /> Prev
                        </button>
                        <button onClick={() => handleResultsPageChange(currentResultsPage + 1)} disabled={currentResultsPage >= totalResultsPages - 1}
                            className="flex items-center gap-1 px-3 py-2 text-sm font-medium rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                            Next <ChevronRight size={16} />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
