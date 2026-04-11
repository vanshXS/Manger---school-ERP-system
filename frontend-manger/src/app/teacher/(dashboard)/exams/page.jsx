'use client';

import PaginationBar from '@/components/common/PaginationBar';
import { GradingSheetTable } from '@/components/teacher/marks/GradingSheetTable';
import { TopStats } from '@/components/teacher/marks/TopStats';
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel,
    AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
    AlertDialogHeader, AlertDialogTitle
} from '@/components/ui/alert-dialog';
import teacherApiClient from '@/lib/teacherAxios';
import { showError, showSuccess } from '@/lib/toastHelper';
import {
    ArrowLeft, BookOpen, Calendar, ChevronRight, Clock,
    FileText, GraduationCap, Loader2, Mail, Save, Search, X
} from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';

/* ─── STATUS BADGE ─── */
function StatusBadge({ status }) {
    const cfg = {
        Upcoming: { bg: 'bg-amber-100/50', text: 'text-amber-700', border: 'border-amber-200/50', dot: 'bg-amber-500' },
        Ongoing: { bg: 'bg-blue-100/50', text: 'text-blue-700', border: 'border-blue-200/50', dot: 'bg-blue-500' },
        Completed: { bg: 'bg-emerald-100/50', text: 'text-emerald-700', border: 'border-emerald-200/50', dot: 'bg-emerald-500' },
    }[status] || { bg: 'bg-slate-100/50', text: 'text-slate-600', border: 'border-slate-200/50', dot: 'bg-slate-400' };
    return (
        <span className={`inline-flex items-center gap-1.5 text-[10px] uppercase font-bold px-2 py-0.5 rounded border ${cfg.bg} ${cfg.text} ${cfg.border} shadow-sm`}>
            <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
            {status}
        </span>
    );
}

/* ─── EXAM CARD ─── */
function ExamCard({ exam, onSelect }) {
    const fmt = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '';
    return (
        <button onClick={() => onSelect(exam)}
            className="w-full text-left bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:-translate-y-0.5 hover:border-blue-200 transition-all duration-200 p-5 group flex flex-col justify-between h-full">
            <div>
                <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                            <StatusBadge status={exam.status} />
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider bg-slate-50 px-2 py-0.5 rounded">{exam.examType}</span>
                        </div>
                        <h3 className="text-lg font-bold text-slate-900 truncate group-hover:text-blue-700 transition-colors">{exam.name}</h3>
                        <p className="text-sm font-medium text-slate-500 mt-1 flex items-center gap-1.5">
                            <GraduationCap size={14} className="text-slate-400 shrink-0" /> {exam.classroomName}
                        </p>
                    </div>
                </div>
                {exam.description && <p className="text-sm text-slate-500 mt-3 line-clamp-2 leading-relaxed">{exam.description}</p>}
            </div>
            <div className="flex flex-wrap items-center justify-between gap-4 mt-5 pt-4 border-t border-slate-100/80">
                <div className="flex flex-col gap-1.5">
                    <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
                        <Calendar size={13} className="text-slate-400" /> {fmt(exam.startDate)} — {fmt(exam.endDate)}
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
                            <BookOpen size={13} className="text-slate-400" /> {exam.subjectCount || 0} Subjects
                        </span>
                        {exam.totalMarks && (
                            <span className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
                                <FileText size={13} className="text-slate-400" /> Total: {exam.totalMarks}
                            </span>
                        )}
                    </div>
                </div>
                <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors shrink-0">
                    <ChevronRight size={16} />
                </div>
            </div>
        </button>
    );
}

/* ─── SKELETON CARDS ─── */
function SkeletonCards() {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-white rounded-xl border border-slate-200/80 p-5 animate-pulse">
                    <div className="flex items-center gap-2 mb-3">
                        <div className="h-5 w-16 bg-slate-200 rounded-full" />
                        <div className="h-3 w-12 bg-slate-100 rounded" />
                    </div>
                    <div className="h-5 w-3/4 bg-slate-200 rounded mb-2" />
                    <div className="h-4 w-1/2 bg-slate-100 rounded" />
                    <div className="flex gap-4 mt-4 pt-3 border-t border-slate-100">
                        <div className="h-3 w-28 bg-slate-100 rounded" />
                        <div className="h-3 w-20 bg-slate-100 rounded" />
                    </div>
                </div>
            ))}
        </div>
    );
}

const PAGE_SIZE = 10;

/* ═══ MAIN PAGE ═══ */
export default function TeacherExamsPage() {
    const [exams, setExams] = useState([]);
    const [selectedExam, setSelectedExam] = useState(null);
    const [selectedSubject, setSelectedSubject] = useState(null);

    const [gradingSheet, setGradingSheet] = useState(null);
    const [marks, setMarks] = useState({});

    const [academicYears, setAcademicYears] = useState([]);
    const [selectedYearId, setSelectedYearId] = useState('');

    const [loadingExams, setLoadingExams] = useState(true);
    const [loadingSheet, setLoadingSheet] = useState(false);
    const [saving, setSaving] = useState(false);
    const [sendingId, setSendingId] = useState(null);
    const [statusFilter, setStatusFilter] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');

    // Server-side pagination state
    const [currentPage, setCurrentPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [totalElements, setTotalElements] = useState(0);

    const [confirmOpen, setConfirmOpen] = useState(false);

    const isMounted = useRef(false);

    /* ── Load academic years on mount ── */
    useEffect(() => {
        isMounted.current = true;
        fetchAcademicYears();
        return () => { isMounted.current = false; };
    }, []);

    const fetchAcademicYears = async () => {
        try {
            const res = await teacherApiClient.get('/api/teacher/marks/academic-years');
            if (!isMounted.current) return;
            setAcademicYears(res.data);
            // Auto-select current year
            const current = res.data.find(y => y.current ?? y.isCurrent);
            if (current) {
                setSelectedYearId(current.id);
                fetchExams(current.id);
            } else if (res.data.length > 0) {
                setSelectedYearId(res.data[0].id);
                fetchExams(res.data[0].id);
            } else {
                setLoadingExams(false);
            }
        } catch {
            if (isMounted.current) {
                showError('Failed to load academic years.');
                setLoadingExams(false);
            }
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
        setSearchQuery('');
        setStatusFilter('all');
        fetchExams(yearId, 0);
    };

    const handlePageChange = (newPage) => {
        if (newPage < 0 || newPage >= totalPages) return;
        fetchExams(selectedYearId, newPage);
    };

    /* ── Select exam / subject ── */
    const handleSelectExam = (exam) => {
        setSelectedExam(exam); setSelectedSubject(null);
        setGradingSheet(null); setMarks({});
    };

    const handleSelectSubject = async (subject) => {
        setSelectedSubject(subject); setGradingSheet(null);
        try {
            setLoadingSheet(true);
            const res = await teacherApiClient.get(
                `/api/teacher/marks/exams/${selectedExam.id}/subjects/${subject.subjectId}/grading-sheet`
            );
            if (!isMounted.current) return;
            setGradingSheet(res.data);
            const init = {};
            res.data.students.forEach(s => {
                init[s.enrollmentId] = s.marksObtained !== null ? s.marksObtained : '';
            });
            setMarks(init);
        } catch (err) {
            if (isMounted.current) showError(err.response?.data?.message || 'Failed to load grading sheet.');
        } finally {
            if (isMounted.current) setLoadingSheet(false);
        }
    };

    /* ── Mark handling ── */
    const handleMarkChange = (enrollmentId, value) => {
        if (value === '') { setMarks(p => ({ ...p, [enrollmentId]: '' })); return; }
        const num = parseFloat(value);
        if (num > gradingSheet.maxMarks || num < 0) return;
        setMarks(p => ({ ...p, [enrollmentId]: num }));
    };

    /* ── Save marks with confirmation ── */
    const handleSaveMarks = async () => {
        if (!gradingSheet?.marksEditable) {
            setConfirmOpen(false);
            showError('Marks can only be saved while the exam is ongoing.');
            return;
        }
        setConfirmOpen(false);
        try {
            setSaving(true);
            const payload = {
                examId: selectedExam.id,
                subjectId: selectedSubject.subjectId,
                marks: Object.entries(marks).map(([eid, score]) => ({
                    enrollmentId: parseInt(eid, 10),
                    marksObtained: score === '' ? null : parseFloat(score)
                }))
            };
            await teacherApiClient.post('/api/teacher/marks/bulk-save', payload);
            showSuccess('Marks saved successfully!');
            handleSelectSubject(selectedSubject);
        } catch {
            showError('Failed to save marks. Please check your inputs.');
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
            await teacherApiClient.post(`/api/teacher/marks/send-marksheet/${selectedExam.id}/${enrollmentId}`);
            showSuccess('Marksheet sent successfully!');
        } catch (err) {
            showError(err.response?.data?.message || 'Failed to send marksheet.');
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
            const res = await teacherApiClient.post(`/api/teacher/marks/send-all-marksheets/${selectedExam.id}`);
            showSuccess(res.data || 'Marksheets sent!');
        } catch (err) {
            showError(err.response?.data?.message || 'Failed to send marksheets.');
        } finally {
            setSendingId(null);
        }
    };

    /* ── Navigation ── */
    const goBackToExams = () => { setSelectedExam(null); setSelectedSubject(null); setGradingSheet(null); };
    const goBackToSubjects = () => { setSelectedSubject(null); setGradingSheet(null); };

    /* ── Client-side filtering (on current page data) ── */
    let filteredExams = statusFilter === 'all' ? exams : exams.filter(e => e.status === statusFilter);
    if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        filteredExams = filteredExams.filter(e =>
            e.name.toLowerCase().includes(q) ||
            (e.classroomName || '').toLowerCase().includes(q) ||
            (e.examType || '').toLowerCase().includes(q)
        );
    }
    const displayedExams = filteredExams;

    const statusCounts = { all: exams.length, Ongoing: 0, Upcoming: 0, Completed: 0 };
    exams.forEach(e => { if (statusCounts[e.status] !== undefined) statusCounts[e.status]++; });

    const fmt = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '';

    /* ━━━━━ GRADING SHEET VIEW ━━━━━ */
    if (selectedExam && selectedSubject) {
        const gradedCount = gradingSheet ? Object.values(marks).filter(v => v !== '').length : 0;
        const totalStudents = gradingSheet ? gradingSheet.students.length : 0;
        const examStatus = gradingSheet?.examStatus || selectedExam.status;
        const marksEditable = Boolean(gradingSheet?.marksEditable);
        const marksheetAllowed = Boolean(gradingSheet?.marksheetAllowed);

        return (
            <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-4 animate-in fade-in duration-200">
                {/* Breadcrumb */}
                <div className="flex items-center gap-2 text-sm text-slate-500">
                    <button onClick={goBackToExams} className="hover:text-blue-600 transition-colors flex items-center gap-1">
                        <ArrowLeft size={14} /> Exams
                    </button>
                    <ChevronRight size={14} />
                    <button onClick={goBackToSubjects} className="hover:text-blue-600 transition-colors">{selectedExam.name}</button>
                    <ChevronRight size={14} />
                    <span className="text-slate-800 font-semibold">{selectedSubject.subjectName}</span>
                </div>

                {loadingSheet ? (
                    <div className="flex items-center justify-center py-24">
                        <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
                    </div>
                ) : gradingSheet ? (
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200/80 overflow-hidden">
                        <TopStats gradingSheet={gradingSheet} marks={marks} />
                        <div className={`mx-5 mt-5 rounded-xl border px-4 py-3 text-sm ${marksEditable
                            ? 'border-blue-200 bg-blue-50 text-blue-700'
                            : marksheetAllowed
                                ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                                : 'border-amber-200 bg-amber-50 text-amber-700'
                            }`}>
                            {marksEditable
                                ? `Marks entry is open because this exam is currently ${examStatus.toLowerCase()}.`
                                : marksheetAllowed
                                    ? 'Marks entry is locked because this exam is completed. You can still send final marksheets.'
                                    : 'Marks entry is locked until the exam becomes ongoing.'}
                        </div>
                        <GradingSheetTable
                            gradingSheet={gradingSheet}
                            marks={marks}
                            handleMarkChange={handleMarkChange}
                            onSendMarksheet={handleSendMarksheet}
                            sendingId={sendingId}
                            marksEditable={marksEditable}
                            marksheetAllowed={marksheetAllowed}
                        />

                        {gradingSheet.students.length > 0 && (
                            <div className="p-4 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row justify-between gap-3">
                                <button onClick={handleSendAllMarksheets}
                                    disabled={sendingId === 'all' || gradingSheet.gradedCount === 0 || !marksheetAllowed}
                                    className="bg-violet-600 hover:bg-violet-700 text-white font-medium px-5 py-2.5 rounded-lg flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm">
                                    {sendingId === 'all' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
                                    {sendingId === 'all' ? 'Sending...' : `Send All Marksheets (${gradingSheet.gradedCount})`}
                                </button>
                                <button onClick={() => setConfirmOpen(true)}
                                    disabled={saving || !marksEditable}
                                    className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-2.5 rounded-lg flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm">
                                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                    Save Marks
                                </button>
                            </div>
                        )}
                    </div>
                ) : null}

                {/* Save Confirmation Dialog */}
                <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Save Marks?</AlertDialogTitle>
                            <AlertDialogDescription>
                                You are saving marks for <strong>{selectedSubject.subjectName}</strong> in <strong>{selectedExam.name}</strong>.
                                <br /><br />
                                <span className="text-blue-600 font-semibold">{gradedCount}</span> of <span className="font-semibold">{totalStudents}</span> students have marks entered.
                                {gradedCount < totalStudents && (
                                    <span className="text-amber-600 block mt-1">
                                        ⚠ {totalStudents - gradedCount} student(s) will remain ungraded.
                                    </span>
                                )}
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={handleSaveMarks} disabled={!marksEditable}>Save Marks</AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </div>
        );
    }

    /* ━━━━━ SUBJECTS VIEW ━━━━━ */
    if (selectedExam) {
        const subjects = selectedExam.subjects || [];
        return (
            <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-5 animate-in fade-in duration-200">
                <div className="flex items-center gap-2 text-sm text-slate-500">
                    <button onClick={goBackToExams} className="hover:text-blue-600 transition-colors flex items-center gap-1">
                        <ArrowLeft size={14} /> All Exams
                    </button>
                    <ChevronRight size={14} />
                    <span className="text-slate-800 font-semibold">{selectedExam.name}</span>
                </div>

                <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
                    <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 p-5 sm:p-6">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div>
                                <h2 className="text-xl sm:text-2xl font-bold text-white">{selectedExam.name}</h2>
                                <p className="text-blue-100 text-sm mt-1">{selectedExam.classroomName} • {selectedExam.examType}</p>
                            </div>
                            <StatusBadge status={selectedExam.status} />
                        </div>
                    </div>
                    <div className="p-5 flex flex-wrap gap-6 border-b border-slate-100">
                        <div className="flex items-center gap-2 text-sm text-slate-600">
                            <Calendar size={15} className="text-slate-400" /> {fmt(selectedExam.startDate)} — {fmt(selectedExam.endDate)}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-slate-600">
                            <BookOpen size={15} className="text-slate-400" /> {subjects.length} Subject{subjects.length !== 1 ? 's' : ''}
                        </div>
                        {selectedExam.totalMarks && (
                            <div className="flex items-center gap-2 text-sm text-slate-600">
                                <FileText size={15} className="text-slate-400" /> Total: {selectedExam.totalMarks} marks
                            </div>
                        )}
                    </div>
                    {selectedExam.description && (
                        <div className="px-5 py-3 bg-slate-50 text-sm text-slate-500 border-b border-slate-100">{selectedExam.description}</div>
                    )}

                    <div className="p-5">
                        <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4 flex items-center gap-2">
                            <BookOpen size={14} className="text-blue-500" /> Subject Papers
                        </h3>
                        {subjects.length === 0 ? (
                            <div className="text-center py-12 bg-slate-50 rounded-xl border-2 border-dashed border-slate-200">
                                <BookOpen className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                                <p className="text-sm text-slate-500">No subject papers added to this exam yet.</p>
                                <p className="text-xs text-slate-400 mt-1">Subjects are configured by the admin.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {subjects.map((subj) => {
                                    const examDate = subj.examDate ? new Date(subj.examDate) : null;
                                    return (
                                        <button key={subj.id} onClick={() => handleSelectSubject(subj)}
                                            className="w-full text-left bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:border-blue-300 p-5 transition-all group relative overflow-hidden">
                                            <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50 rounded-bl-full opacity-50 transition-transform group-hover:scale-110 -z-0"></div>
                                            <div className="relative z-10 flex items-start justify-between mb-4">
                                                <div className="flex-1 min-w-0 pr-4">
                                                    <h4 className="font-bold text-slate-800 text-lg group-hover:text-blue-700 transition-colors truncate">{subj.subjectName}</h4>
                                                    {subj.subjectCode && (
                                                        <span className="text-[10px] font-bold tracking-wider text-slate-500 uppercase bg-slate-100 px-2 py-0.5 rounded shadow-sm mt-1.5 inline-block">{subj.subjectCode}</span>
                                                    )}
                                                </div>
                                                <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-blue-100 group-hover:text-blue-600 transition-colors shrink-0">
                                                    <ChevronRight size={16} />
                                                </div>
                                            </div>

                                            <div className="relative z-10 grid grid-cols-2 gap-3 text-sm text-slate-600 mb-4 bg-slate-50/50 p-3 rounded-xl border border-slate-100">
                                                {subj.examDate && (
                                                    <span className="flex items-center gap-2"><Calendar size={14} className="text-slate-400" /> {fmt(subj.examDate)}</span>
                                                )}
                                                {subj.startTime && subj.endTime && (
                                                    <span className="flex items-center gap-2"><Clock size={14} className="text-slate-400" /> {subj.startTime.slice(0, 5)} – {subj.endTime.slice(0, 5)}</span>
                                                )}
                                                {subj.maxMarks && (
                                                    <span className="flex items-center gap-2 col-span-2"><FileText size={14} className="text-slate-400" /> Max Marks: {subj.maxMarks}</span>
                                                )}
                                            </div>

                                            {subj.marksEnteredCount != null && (
                                                <div className="relative z-10 flex items-center justify-between text-xs font-semibold">
                                                    <span className="text-slate-500 uppercase tracking-wider">Marks Entered</span>
                                                    <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full ${subj.marksEnteredCount > 0 ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-slate-100 text-slate-500'}`}>
                                                        <span className={`w-1.5 h-1.5 rounded-full ${subj.marksEnteredCount > 0 ? 'bg-emerald-500' : 'bg-slate-400'}`}></span>
                                                        {subj.marksEnteredCount} Student{subj.marksEnteredCount !== 1 ? 's' : ''}
                                                    </div>
                                                </div>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    /* ━━━━━ EXAM LIST VIEW ━━━━━ */
    return (
        <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-5 animate-in fade-in duration-200">
            {/* Header + Year Switcher */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div className="flex items-center gap-3">
                    <span className="p-2.5 rounded-xl bg-blue-100 text-blue-600">
                        <GraduationCap className="h-6 w-6" />
                    </span>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Exams & Marks</h1>
                        <p className="text-sm text-slate-500">View assigned exams and manage student marks</p>
                    </div>
                </div>
                {academicYears.length > 0 && (
                    <select value={selectedYearId} onChange={handleYearChange}
                        className="px-3 py-2 text-sm font-medium border border-slate-200 rounded-lg bg-white shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-slate-700 min-w-[160px]">
                        {academicYears.map(y => (
                            <option key={y.id} value={y.id}>{y.name}{(y.current ?? y.isCurrent) ? ' (Current)' : ''}</option>
                        ))}
                    </select>
                )}
            </div>

            {/* Filter Tabs + Search */}
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex gap-1 bg-slate-100 p-1 rounded-xl overflow-x-auto flex-1">
                    {['all', 'Ongoing', 'Upcoming', 'Completed'].map((tab) => {
                        const count = statusCounts[tab];
                        const isActive = statusFilter === tab;
                        return (
                            <button key={tab} onClick={() => { setStatusFilter(tab); }}
                                className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-all whitespace-nowrap ${isActive
                                    ? 'bg-white text-slate-900 shadow-sm'
                                    : 'text-slate-500 hover:text-slate-700 hover:bg-white/50'
                                    }`}>
                                {tab === 'all' ? 'All' : tab}
                                <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${isActive ? 'bg-blue-100 text-blue-700' : 'bg-slate-200 text-slate-500'}`}>{count}</span>
                            </button>
                        );
                    })}
                </div>
                <div className="relative">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input type="text" placeholder="Search exams..." value={searchQuery}
                        onChange={(e) => { setSearchQuery(e.target.value); }}
                        className="pl-9 pr-8 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none w-full sm:w-56" />
                    {searchQuery && (
                        <button onClick={() => setSearchQuery('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                            <X size={14} />
                        </button>
                    )}
                </div>
            </div>

            {/* Exam Cards */}
            {loadingExams ? (
                <SkeletonCards />
            ) : displayedExams.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 text-center border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50">
                    <div className="bg-white p-4 rounded-full shadow-sm mb-4">
                        <GraduationCap className="h-8 w-8 text-slate-300" />
                    </div>
                    <h3 className="text-lg font-semibold text-slate-900">
                        {searchQuery ? 'No Matching Exams' : statusFilter === 'all' ? 'No Exams Found' : `No ${statusFilter} Exams`}
                    </h3>
                    <p className="text-slate-500 max-w-sm mt-2 text-sm">
                        {searchQuery
                            ? `No exams match "${searchQuery}". Try a different search.`
                            : statusFilter === 'all'
                                ? 'You don\'t have any assigned exams for this academic year.'
                                : `No exams with "${statusFilter}" status.`}
                    </p>
                </div>
            ) : (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {displayedExams.map((exam) => <ExamCard key={exam.id} exam={exam} onSelect={handleSelectExam} />)}
                    </div>
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
                        className="pt-2"
                    />
                </>
            )}
        </div>
    );
}
