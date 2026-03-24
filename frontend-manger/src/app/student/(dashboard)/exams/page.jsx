'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import studentApiClient from '@/lib/studentAxios';
import { showError } from '@/lib/toastHelper';
import { BookOpen, Calendar, GraduationCap, Loader2, Award, ChevronRight } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function StudentExamsPage() {
    const [academicYears, setAcademicYears] = useState([]);
    const [selectedYearId, setSelectedYearId] = useState('');
    const [exams, setExams] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    
    // Results Modal State
    const [selectedExamId, setSelectedExamId] = useState(null);
    const [examResults, setExamResults] = useState(null);
    const [isResultsLoading, setIsResultsLoading] = useState(false);
    const [isResultsModalOpen, setIsResultsModalOpen] = useState(false);

    useEffect(() => {
        const fetchYears = async () => {
            try {
                const yearsRes = await studentApiClient.get('/api/student/academic-years');
                setAcademicYears(yearsRes.data);

                const currentYear = yearsRes.data.find(y => y.current ?? y.isCurrent) || yearsRes.data[0];
                if (currentYear) {
                    setSelectedYearId(currentYear.id.toString());
                    await loadExams(currentYear.id);
                }
            } catch (error) {
                showError('Failed to load academic years.');
            } finally {
                setIsLoading(false);
            }
        };
        fetchYears();
    }, []);

    const loadExams = async (yearId) => {
        try {
            const res = await studentApiClient.get(`/api/student/exams?academicYearId=${yearId}`);
            setExams(res.data);
        } catch (error) {
            showError('Failed to load exams.');
        }
    };

    const handleViewResults = async (examId) => {
        setSelectedExamId(examId);
        setExamResults(null);
        setIsResultsLoading(true);
        setIsResultsModalOpen(true);
        
        try {
            const res = await studentApiClient.get(`/api/student/exams/${examId}/results`);
            setExamResults(res.data);
        } catch (error) {
            showError('Failed to load exam results.');
            setIsResultsModalOpen(false);
        } finally {
            setIsResultsLoading(false);
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return '';
        return new Date(dateString).toLocaleDateString();
    };

    const normalizeExamStatus = (status) => {
        if (!status) return 'UNKNOWN';
        if (typeof status !== 'string') return String(status).toUpperCase();

        return status.trim().replace(/\s+/g, '_').toUpperCase();
    };

    const isResultAvailable = (exam) => {
        if (!exam) return false;
        if (normalizeExamStatus(exam.status) === 'COMPLETED') return true;
        if (!exam.endDate) return false;

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const endDate = new Date(exam.endDate);
        endDate.setHours(0, 0, 0, 0);

        return endDate < today;
    };

    const displayStatus = (exam) => {
        if (!exam) return 'UNKNOWN';
        return isResultAvailable(exam)
            ? 'COMPLETED'
            : normalizeExamStatus(exam.status);
    };

    if (isLoading) {
        return (
            <div className="admin-page flex justify-center items-center min-h-[60vh]">
                <Loader2 className="animate-spin h-8 w-8 text-orange-600" />
            </div>
        );
    }

    return (
        <div className="admin-page space-y-6 max-w-5xl mx-auto">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 flex items-center gap-3">
                        <GraduationCap className="text-orange-600" size={32} />
                        Exam Results
                    </h1>
                    <p className="text-slate-500 mt-1">View your past exams and academic performance.</p>
                </div>

                <Select value={selectedYearId} onValueChange={(val) => {
                    setSelectedYearId(val);
                    loadExams(val);
                }}>
                    <SelectTrigger className="w-full sm:w-[200px] bg-white border-slate-200">
                        <SelectValue placeholder="Academic Year" />
                    </SelectTrigger>
                    <SelectContent>
                        {academicYears.map(yr => (
                            <SelectItem key={yr.id} value={yr.id.toString()}>{yr.name} {(yr.current ?? yr.isCurrent) ? '(Current)' : ''}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {exams.length > 0 ? exams.map((exam) => (
                    <Card key={exam.id} className="border-slate-200/60 shadow-sm hover:shadow-md transition-shadow group overflow-hidden flex flex-col">
                        <div className={`h-1.5 w-full ${displayStatus(exam) === 'COMPLETED' ? 'bg-orange-500' : 'bg-slate-300'}`} />
                        <CardHeader className="pb-3 border-b border-slate-100">
                            <div className="flex items-center justify-between mb-2">
                                <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                                    displayStatus(exam) === 'COMPLETED' ? 'bg-emerald-100 text-emerald-700' :
                                    displayStatus(exam) === 'ONGOING' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600'
                                }`}>
                                    {displayStatus(exam)}
                                </span>
                                <span className="text-xs font-semibold text-slate-500 uppercase tracking-widest">{exam.examType}</span>
                            </div>
                            <CardTitle className="text-lg font-bold text-slate-800 line-clamp-1 group-hover:text-orange-600 transition-colors">
                                {exam.name}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-5 flex-1 flex flex-col">
                            <div className="space-y-3 mb-6">
                                <div className="flex items-center text-sm text-slate-600">
                                    <Calendar className="w-4 h-4 mr-2 text-slate-400" />
                                    {formatDate(exam.startDate)} - {formatDate(exam.endDate)}
                                </div>
                                <div className="flex items-center text-sm text-slate-600">
                                    <Award className="w-4 h-4 mr-2 text-slate-400" />
                                    Total Marks: {exam.totalMarks}
                                </div>
                            </div>

                            <div className="mt-auto">
                                <button
                                    disabled={!isResultAvailable(exam)}
                                    onClick={() => handleViewResults(exam.id)}
                                    className="w-full flex items-center justify-center p-2.5 bg-orange-50 text-orange-700 font-semibold rounded-lg hover:bg-orange-600 hover:text-white transition-colors disabled:opacity-50 disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed group/btn"
                                >
                                    {isResultAvailable(exam) ? 'View Results' : 'Results Not Available'}
                                    {isResultAvailable(exam) && <ChevronRight className="w-4 h-4 ml-1 group-hover/btn:translate-x-1 transition-transform" />}
                                </button>
                            </div>
                        </CardContent>
                    </Card>
                )) : (
                    <div className="col-span-full py-16 text-center text-slate-500 bg-white rounded-2xl border border-slate-200/60 border-dashed">
                        No exams found for this academic year.
                    </div>
                )}
            </div>

            {/* Results Modal */}
            <Dialog open={isResultsModalOpen} onOpenChange={setIsResultsModalOpen}>
                <DialogContent className="max-w-3xl rounded-2xl max-h-[90vh] overflow-hidden flex flex-col">
                    <DialogHeader className="border-b pb-4 px-6 pt-6">
                        <DialogTitle className="text-2xl font-bold flex flex-col gap-1">
                            <span className="text-sm font-semibold text-orange-600 uppercase tracking-wider">Exam Results</span>
                            {examResults?.examName || 'Loading...'}
                        </DialogTitle>
                    </DialogHeader>
                    
                    <div className="flex-1 overflow-y-auto px-6 py-4 custom-scrollbar">
                        {isResultsLoading ? (
                            <div className="flex justify-center py-12"><Loader2 className="animate-spin text-orange-600 h-8 w-8" /></div>
                        ) : examResults?.subjects?.length > 0 ? (
                            <div className="space-y-4">
                                {examResults.subjects.map((sub, idx) => (
                                    <div key={idx} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-slate-50 border border-slate-200 rounded-xl hover:border-orange-200 transition-colors">
                                        <div className="flex items-center gap-3 mb-3 sm:mb-0">
                                            <div className="bg-white p-2 border border-slate-200 rounded-lg shadow-sm">
                                                <BookOpen className="w-5 h-5 text-slate-500" />
                                            </div>
                                            <span className="font-bold text-slate-800">{sub.subjectName}</span>
                                        </div>
                                        
                                        <div className="flex items-center gap-4 sm:gap-8 bg-white py-2 px-4 border border-slate-200 rounded-lg">
                                            <div className="text-center">
                                                <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Score</p>
                                                <p className="font-bold text-slate-900">{sub.marksObtained} <span className="text-slate-400 text-sm font-normal">/ {sub.totalMarks}</span></p>
                                            </div>
                                            <div className="w-px h-8 bg-slate-100" />
                                            <div className="text-center">
                                                <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400">%</p>
                                                <p className={`font-bold ${sub.percentage < 40 ? 'text-red-600' : 'text-emerald-600'}`}>{sub.percentage}%</p>
                                            </div>
                                            <div className="w-px h-8 bg-slate-100" />
                                            <div className="text-center min-w-[32px]">
                                                <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Grade</p>
                                                <p className="font-black text-lg text-slate-800 leading-none">{sub.grade}</p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="py-12 text-center text-slate-500">No subject marks recorded for this exam yet.</div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
