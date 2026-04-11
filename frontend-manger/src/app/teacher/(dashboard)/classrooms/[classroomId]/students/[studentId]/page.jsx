'use client';

import StudentProfile from '@/components/admin/students/StudentProfile';
import PaginationBar from '@/components/common/PaginationBar';
import { classroomDisplayName } from '@/lib/classroomDisplayName';
import teacherApiClient from '@/lib/teacherAxios';
import { showError } from '@/lib/toastHelper';
import { ArrowLeft, ChevronRight, User } from 'lucide-react';
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

    const [currentResultsPage, setCurrentResultsPage] = useState(0);
    const [totalResultsPages, setTotalResultsPages] = useState(0);
    const [totalResultsCount, setTotalResultsCount] = useState(0);

    const isMounted = useRef(false);

    useEffect(() => {
        isMounted.current = true;
        fetchData();
        return () => {
            isMounted.current = false;
        };
    }, [classroomId, studentId]);

    const fetchData = async () => {
        try {
            setLoading(true);

            const classRes = await teacherApiClient.get('/api/teacher/attendance/classes');
            const matchedClassroom = classRes.data.find((classItem) => String(classItem.id) === String(classroomId));
            if (isMounted.current) {
                setClassroom(matchedClassroom || null);
            }

            const studentRes = await teacherApiClient.get(`/api/teacher/attendance/students/${studentId}`);
            if (isMounted.current) {
                setStudent(studentRes.data);
            }

            try {
                const attendanceRes = await teacherApiClient.get(
                    `/api/teacher/attendance/students/${studentId}/attendance-summary`
                );
                if (isMounted.current) {
                    setAttendanceSummary(attendanceRes.data);
                }
            } catch {
                // Leave attendance summary empty if the endpoint has no data.
            }

            await fetchExamResults(0);
        } catch {
            if (isMounted.current) {
                showError('Failed to load student data.');
            }
        } finally {
            if (isMounted.current) {
                setLoading(false);
            }
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
            // Exam results are optional on this screen.
        } finally {
            if (isMounted.current) {
                setLoadingResults(false);
            }
        }
    };

    const handleResultsPageChange = (nextPage) => {
        if (nextPage < 0 || nextPage >= totalResultsPages) {
            return;
        }

        fetchExamResults(nextPage);
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
                <button
                    onClick={() => router.back()}
                    className="mt-4 text-indigo-600 font-semibold hover:underline"
                >
                    Back
                </button>
            </div>
        );
    }

    return (
        <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-5 animate-in fade-in duration-200">
            <div className="flex items-center gap-2 text-sm text-slate-500 flex-wrap">
                <button
                    onClick={() => router.push('/teacher/classrooms')}
                    className="hover:text-indigo-600 transition-colors flex items-center gap-1"
                >
                    <ArrowLeft size={14} /> My Classes
                </button>
                <ChevronRight size={14} />
                <button
                    onClick={() => router.push(`/teacher/classrooms/${classroomId}`)}
                    className="hover:text-indigo-600 transition-colors"
                >
                    {classroomName}
                </button>
                <ChevronRight size={14} />
                <span className="text-slate-800 font-semibold">
                    {student.firstName} {student.lastName}
                </span>
            </div>

            <StudentProfile
                student={student}
                examResults={examResults}
                attendanceSummary={attendanceSummary}
                showAttendance={true}
                loadingResults={loadingResults}
            />

            <PaginationBar
                pageData={{
                    number: currentResultsPage,
                    totalPages: totalResultsPages,
                    totalElements: totalResultsCount,
                    size: RESULTS_PAGE_SIZE,
                    numberOfElements: examResults.length
                }}
                itemLabel="results"
                onPageChange={handleResultsPageChange}
                isLoading={loadingResults}
                className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
            />
        </div>
    );
}
