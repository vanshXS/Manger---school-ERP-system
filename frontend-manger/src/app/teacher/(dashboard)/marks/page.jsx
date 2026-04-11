"use client";

import PaginationBar from '@/components/common/PaginationBar';
import { GradingSheetTable } from '@/components/teacher/marks/GradingSheetTable';
import { TopStats } from '@/components/teacher/marks/TopStats';
import teacherApiClient from '@/lib/teacherAxios';
import {
    AlertCircle,
    BookOpen,
    CheckCircle2,
    ChevronLeft,
    ChevronRight,
    FileText,
    Loader2,
    Mail,
    Save,
    Search,
    Users,
    X
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { showError, showSuccess } from "@/lib/toastHelper";

const PAGE_SIZE = 10;

export default function TeacherMarksPage() {
    // Academic year state
    const [academicYears, setAcademicYears] = useState([]);
    const [selectedYearId, setSelectedYearId] = useState('');

    // Exam list + pagination
    const [exams, setExams] = useState([]);
    const [currentPage, setCurrentPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [totalElements, setTotalElements] = useState(0);

    // Selected exam / subject
    const [selectedExamId, setSelectedExamId] = useState("");
    const [selectedSubjectId, setSelectedSubjectId] = useState("");

    // Grading sheet
    const [gradingSheet, setGradingSheet] = useState(null);
    const [marks, setMarks] = useState({});

    // UI state
    const [loadingYears, setLoadingYears] = useState(true);
    const [loadingExams, setLoadingExams] = useState(false);
    const [loadingSheet, setLoadingSheet] = useState(false);
    const [saving, setSaving] = useState(false);
    const [sendingId, setSendingId] = useState(null);

    const isMounted = useRef(false);

    /* ── Load academic years on mount ── */
    useEffect(() => {
        isMounted.current = true;
        fetchAcademicYears();
        return () => { isMounted.current = false; };
    }, []);

    const fetchAcademicYears = async () => {
        try {
            setLoadingYears(true);
            const res = await teacherApiClient.get('/api/teacher/marks/academic-years');
            if (!isMounted.current) return;
            setAcademicYears(res.data);
            const current = res.data.find(y => y.current);
            if (current) {
                setSelectedYearId(current.id);
                fetchExams(current.id, 0);
            } else if (res.data.length > 0) {
                setSelectedYearId(res.data[0].id);
                fetchExams(res.data[0].id, 0);
            }
        } catch {
            if (isMounted.current) showError('Failed to load academic years.');
        } finally {
            if (isMounted.current) setLoadingYears(false);
        }
    };

    /* ── Fetch exams for selected year (paginated) ── */
    const fetchExams = useCallback(async (yearId, page = 0) => {
        try {
            setLoadingExams(true);
            const params = new URLSearchParams();
            if (yearId) params.set('academicYearId', yearId);
            params.set('page', page);
            params.set('size', PAGE_SIZE);
            params.set('sort', 'startDate,desc');
            const res = await teacherApiClient.get(`/api/teacher/marks/exams?${params}`);
            if (isMounted.current) {
                setExams(res.data.content || []);
                setTotalPages(res.data.totalPages || 0);
                setTotalElements(res.data.totalElements || 0);
                setCurrentPage(res.data.number || 0);
            }
        } catch {
            if (isMounted.current) showError('Failed to load assigned exams.');
        } finally {
            if (isMounted.current) setLoadingExams(false);
        }
    }, []);

    const handleYearChange = (e) => {
        const yearId = e.target.value;
        setSelectedYearId(yearId);
        setSelectedExamId('');
        setSelectedSubjectId('');
        setGradingSheet(null);
        fetchExams(yearId, 0);
    };

    const handlePageChange = (newPage) => {
        if (newPage < 0 || newPage >= totalPages) return;
        fetchExams(selectedYearId, newPage);
    };

    /* ── Exam / Subject selection ── */
    const handleExamChange = (e) => {
        setSelectedExamId(e.target.value);
        setSelectedSubjectId('');
        setGradingSheet(null);
        setMarks({});
    };

    const selectedExam = exams.find(ex => String(ex.id) === String(selectedExamId));
    const subjects = selectedExam?.subjects || [];

    /* ── Fetch grading sheet ── */
    const handleFetchGradingSheet = async (e) => {
        e?.preventDefault();
        if (!selectedExamId || !selectedSubjectId) return;

        try {
            setLoadingSheet(true);
            setGradingSheet(null);
            const res = await teacherApiClient.get(`/api/teacher/marks/exams/${selectedExamId}/subjects/${selectedSubjectId}/grading-sheet`);
            if (!isMounted.current) return;

            setGradingSheet(res.data);
            const initialMarks = {};
            res.data.students.forEach(student => {
                initialMarks[student.enrollmentId] = student.marksObtained !== null ? student.marksObtained : "";
            });
            setMarks(initialMarks);
        } catch (err) {
            if (isMounted.current) showError(err.response?.data?.message || "Failed to load grading sheet.");
        } finally {
            if (isMounted.current) setLoadingSheet(false);
        }
    };

    /* ── Mark handling ── */
    const handleMarkChange = (enrollmentId, value) => {
        if (value === "") {
            setMarks(prev => ({ ...prev, [enrollmentId]: "" }));
            return;
        }
        const numValue = parseFloat(value);
        if (numValue > gradingSheet.maxMarks || numValue < 0) return;
        setMarks(prev => ({ ...prev, [enrollmentId]: numValue }));
    };

    /* ── Save marks ── */
    const handleSaveMarks = async () => {
        if (!gradingSheet?.marksEditable) {
            showError('Marks can only be saved while the exam is ongoing.');
            return;
        }
        try {
            setSaving(true);
            const payload = {
                examId: parseInt(selectedExamId, 10),
                subjectId: parseInt(selectedSubjectId, 10),
                marks: Object.entries(marks).map(([enrollmentId, score]) => ({
                    enrollmentId: parseInt(enrollmentId, 10),
                    marksObtained: score === "" ? null : parseFloat(score)
                }))
            };
            await teacherApiClient.post("/api/teacher/marks/bulk-save", payload);
            showSuccess("Marks saved successfully!");
            handleFetchGradingSheet({ preventDefault: () => { } });
        } catch {
            showError("Failed to save marks. Please check your inputs.");
        } finally {
            setSaving(false);
        }
    };

    /* ── Send marksheets ── */
    const handleSendMarksheet = async (enrollmentId) => {
        if (!gradingSheet?.marksheetAllowed) {
            showError('Marksheets can only be sent after the exam is completed.');
            return;
        }
        try {
            setSendingId(enrollmentId);
            await teacherApiClient.post(`/api/teacher/marks/send-marksheet/${selectedExamId}/${enrollmentId}`);
            showSuccess("Marksheet sent successfully!");
        } catch (err) {
            showError(err.response?.data?.message || "Failed to send marksheet.");
        } finally {
            setSendingId(null);
        }
    };

    const handleSendAllMarksheets = async () => {
        if (!gradingSheet?.marksheetAllowed) {
            showError('Marksheets can only be sent after the exam is completed.');
            return;
        }
        try {
            setSendingId('all');
            const res = await teacherApiClient.post(`/api/teacher/marks/send-all-marksheets/${selectedExamId}`);
            showSuccess(res.data || "Marksheets sent!");
        } catch (err) {
            showError(err.response?.data?.message || "Failed to send marksheets.");
        } finally {
            setSendingId(null);
        }
    };

    /* ── Loading state ── */
    if (loadingYears && academicYears.length === 0) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="text-center space-y-3">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-500 mx-auto" />
                    <p className="text-sm font-medium text-slate-500">Loading...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-6xl mx-auto p-4 md:p-6 animate-in fade-in duration-300">

            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">Grade Entry System</h1>
                    <p className="text-sm text-slate-500 mt-1">Select an exam and subject to enter or update student marks.</p>
                </div>
                {academicYears.length > 0 && (
                    <select value={selectedYearId} onChange={handleYearChange}
                        className="px-3 py-2 text-sm font-medium border border-slate-200 rounded-lg bg-white shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-slate-700 min-w-[160px]">
                        {academicYears.map(y => (
                            <option key={y.id} value={y.id}>{y.name}{y.current ? ' (Current)' : ''}</option>
                        ))}
                    </select>
                )}
            </div>

            {/* Selection Form */}
            <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-end">

                    {/* Exam Select */}
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
                            <FileText className="w-3.5 h-3.5 text-blue-500" />
                            Select Exam
                        </label>
                        {loadingExams ? (
                            <div className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-400 flex items-center gap-2">
                                <Loader2 className="w-4 h-4 animate-spin" /> Loading exams...
                            </div>
                        ) : (
                            <select
                                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/40 focus:border-blue-400 transition-all outline-none text-slate-700 text-sm"
                                value={selectedExamId}
                                onChange={handleExamChange}
                            >
                                <option value="">-- Choose an Exam --</option>
                                {exams.map(exam => (
                                    <option key={exam.id} value={exam.id}>
                                        {exam.name} ({exam.classroomName}) – {exam.status}
                                    </option>
                                ))}
                            </select>
                        )}
                    </div>

                    {/* Subject Select */}
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
                            <BookOpen className="w-3.5 h-3.5 text-emerald-500" />
                            Select Subject
                        </label>
                        <select
                            className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-400 transition-all outline-none text-slate-700 text-sm disabled:opacity-50"
                            value={selectedSubjectId}
                            onChange={(e) => { setSelectedSubjectId(e.target.value); setGradingSheet(null); setMarks({}); }}
                            disabled={!selectedExamId || subjects.length === 0}
                        >
                            <option value="">-- Choose a Subject --</option>
                            {subjects.map(subj => (
                                <option key={subj.subjectId} value={subj.subjectId}>
                                    {subj.subjectName}{subj.subjectCode ? ` (${subj.subjectCode})` : ''} — Max: {subj.maxMarks}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Load Button */}
                    <div className="pt-1">
                        <button
                            type="button"
                            onClick={handleFetchGradingSheet}
                            disabled={loadingSheet || !selectedExamId || !selectedSubjectId}
                            className="w-full bg-slate-900 hover:bg-slate-800 text-white font-medium p-2.5 rounded-lg flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                        >
                            {loadingSheet ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <Users className="w-4 h-4" />
                            )}
                            Load Grading Sheet
                        </button>
                    </div>
                </div>

                {/* Pagination for exams */}
                {false && (
                    <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-100">
                        <p className="text-xs text-slate-500">
                            Page <span className="font-semibold text-slate-700">{currentPage + 1}</span> of{' '}
                            <span className="font-semibold text-slate-700">{totalPages}</span>
                            <span className="hidden sm:inline"> · {totalElements} total exams</span>
                        </p>
                        <div className="flex gap-2">
                            <button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 0}
                                className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                                <ChevronLeft size={14} /> Prev
                            </button>
                            <button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage >= totalPages - 1}
                                className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                                Next <ChevronRight size={14} />
                            </button>
                        </div>
                    </div>
                )}
                <PaginationBar
                    pageData={{
                        number: currentPage,
                        totalPages,
                        totalElements,
                        size: PAGE_SIZE,
                        numberOfElements: exams.length
                    }}
                    itemLabel="exams"
                    onPageChange={handlePageChange}
                    isLoading={loadingExams}
                    className="mt-4 border-t border-slate-100 pt-3"
                />
            </div>

            {/* Loading Sheet State */}
            {loadingSheet && (
                <div className="flex items-center justify-center py-16">
                    <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
                </div>
            )}

            {/* The Grading Sheet */}
            {gradingSheet && !loadingSheet && (
                <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden animate-in fade-in slide-in-from-bottom-4">

                    <TopStats gradingSheet={gradingSheet} marks={marks} />

                    <GradingSheetTable
                        gradingSheet={gradingSheet}
                        marks={marks}
                        handleMarkChange={handleMarkChange}
                        onSendMarksheet={handleSendMarksheet}
                        sendingId={sendingId}
                        marksEditable={Boolean(gradingSheet?.marksEditable)}
                        marksheetAllowed={Boolean(gradingSheet?.marksheetAllowed)}
                    />

                    {/* Action Footer */}
                    {gradingSheet.students.length > 0 && (
                        <div className="p-4 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row justify-between gap-3">
                            <button
                                onClick={handleSendAllMarksheets}
                                disabled={sendingId === 'all' || gradingSheet.gradedCount === 0 || !gradingSheet.marksheetAllowed}
                                className="bg-violet-600 hover:bg-violet-700 text-white font-medium px-5 py-2.5 rounded-lg flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                            >
                                {sendingId === 'all' ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <Mail className="w-4 h-4" />
                                )}
                                {sendingId === 'all' ? 'Sending...' : `Send All Marksheets (${gradingSheet.gradedCount})`}
                            </button>
                            <button
                                onClick={handleSaveMarks}
                                disabled={saving || !gradingSheet.marksEditable}
                                className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-2.5 rounded-lg flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                            >
                                {saving ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <Save className="w-4 h-4" />
                                )}
                                Confirm & Save Marks
                            </button>
                        </div>
                    )}

                </div>
            )}

        </div>
    );
}
