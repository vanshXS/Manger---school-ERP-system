'use client';

import apiClient from '@/lib/axios';
import {
    AlertCircle,
    BookOpen, Calendar, Check, Clock, Edit2, GraduationCap,
    Loader2, Plus, Save, Trash2, X
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
    Dialog, DialogContent, DialogDescription,
    DialogFooter, DialogHeader, DialogTitle
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select';

/* ─────────────────────────────────────────────────────────────────────
   HELPERS
───────────────────────────────────────────────────────────────────── */
function formatTime(time) {
    if (!time) return null;
    const [h, m] = time.split(':');
    const hour = parseInt(h);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const h12 = hour % 12 || 12;
    return `${h12}:${m} ${ampm}`;
}

function formatDate(dateStr) {
    if (!dateStr) return 'Unscheduled';
    try {
        return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-IN', {
            weekday: 'short', day: 'numeric', month: 'short', year: 'numeric'
        });
    } catch {
        return dateStr;
    }
}

function groupByDate(subjects) {
    const groups = {};
    const unscheduled = [];

    for (const s of subjects) {
        if (!s.examDate) {
            unscheduled.push(s);
        } else {
            if (!groups[s.examDate]) groups[s.examDate] = [];
            groups[s.examDate].push(s);
        }
    }

    // Sort dates chronologically
    const sortedDates = Object.keys(groups).sort();

    // Sort papers within each date by startTime
    for (const date of sortedDates) {
        groups[date].sort((a, b) => {
            if (!a.startTime) return 1;
            if (!b.startTime) return -1;
            return a.startTime.localeCompare(b.startTime);
        });
    }

    return { sortedDates, groups, unscheduled };
}

/* ─────────────────────────────────────────────────────────────────────
   SUBJECT PAPER ROW — supports view & inline edit
───────────────────────────────────────────────────────────────────── */
function SubjectPaperRow({ paper, exam, onSaved, onDelete, isCompleted }) {
    const [editing, setEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [form, setForm] = useState({
        examDate: '', startTime: '', endTime: '', maxMarks: ''
    });

    function startEdit() {
        setForm({
            examDate: paper.examDate || '',
            startTime: paper.startTime || '',
            endTime: paper.endTime || '',
            maxMarks: String(paper.maxMarks ?? 100),
        });
        setEditing(true);
    }

    async function handleSave() {
        if (!form.examDate) {
            toast.error('Exam date is required.');
            return;
        }
        if (form.startTime && form.endTime && form.startTime >= form.endTime) {
            toast.error('End time must be after start time.');
            return;
        }

        setSaving(true);
        try {
            await apiClient.put(`/api/admin/exams/${exam.id}/subjects/${paper.id}`, {
                subjectId: paper.subjectId,
                examDate: form.examDate,
                startTime: form.startTime || null,
                endTime: form.endTime || null,
                maxMarks: Number(form.maxMarks),
            });
            toast.success(`${paper.subjectName} updated`);
            setEditing(false);
            onSaved();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Update failed.');
        } finally {
            setSaving(false);
        }
    }

    async function handleDelete() {
        setDeleting(true);
        const tid = toast.loading('Removing paper...');
        try {
            await apiClient.delete(`/api/admin/exams/${exam.id}/subjects/${paper.id}`);
            toast.success('Removed.', { id: tid });
            onDelete();
        } catch (err) {
            toast.error(err.customMessage || 'Failed.', { id: tid });
        } finally {
            setDeleting(false);
        }
    }

    const hasTime = paper.startTime && paper.endTime;
    const isScheduled = paper.examDate && hasTime;

    if (editing) {
        return (
            <div className="bg-white border border-indigo-200 rounded-lg p-3 space-y-3 shadow-sm ring-1 ring-indigo-100">
                <div className="flex items-center justify-between">
                    <h4 className="text-sm font-semibold text-indigo-700 flex items-center gap-1.5">
                        <Edit2 className="h-3.5 w-3.5" />
                        Editing: {paper.subjectName}
                        <span className="text-xs font-normal text-slate-400">({paper.subjectCode})</span>
                    </h4>
                    <Button type="button" variant="ghost" size="icon" className="h-7 w-7"
                        onClick={() => setEditing(false)} disabled={saving}>
                        <X className="h-4 w-4" />
                    </Button>
                </div>

                <div className="grid grid-cols-4 gap-2.5">
                    <div className="space-y-1">
                        <Label className="text-[11px] text-slate-500">Date</Label>
                        <Input type="date" value={form.examDate}
                            onChange={e => setForm(p => ({ ...p, examDate: e.target.value }))}
                            min={exam.startDate} max={exam.endDate}
                            className="h-8 text-xs" />
                    </div>
                    <div className="space-y-1">
                        <Label className="text-[11px] text-slate-500">Start Time</Label>
                        <Input type="time" value={form.startTime}
                            onChange={e => setForm(p => ({ ...p, startTime: e.target.value }))}
                            className="h-8 text-xs" />
                    </div>
                    <div className="space-y-1">
                        <Label className="text-[11px] text-slate-500">End Time</Label>
                        <Input type="time" value={form.endTime}
                            onChange={e => setForm(p => ({ ...p, endTime: e.target.value }))}
                            className="h-8 text-xs" />
                    </div>
                    <div className="space-y-1">
                        <Label className="text-[11px] text-slate-500">Max Marks</Label>
                        <Input type="number" min="1" value={form.maxMarks}
                            onChange={e => setForm(p => ({ ...p, maxMarks: e.target.value }))}
                            className="h-8 text-xs" />
                    </div>
                </div>

                <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" size="sm" className="h-7 text-xs"
                        onClick={() => setEditing(false)} disabled={saving}>Cancel</Button>
                    <Button type="button" size="sm" className="h-7 text-xs bg-indigo-600 hover:bg-indigo-700"
                        onClick={handleSave} disabled={saving}>
                        {saving ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Save className="h-3 w-3 mr-1" />}
                        Save
                    </Button>
                </div>
            </div>
        );
    }

    // ── View mode ──
    return (
        <div className={`flex items-center gap-3 px-3 py-2.5 rounded-lg border transition-colors group
            ${isScheduled
                ? 'bg-emerald-50/50 border-emerald-100 hover:border-emerald-200'
                : 'bg-amber-50/50 border-amber-100 hover:border-amber-200'}`}>

            {/* Status indicator */}
            <div className={`shrink-0 w-2 h-2 rounded-full ${isScheduled ? 'bg-emerald-500' : 'bg-amber-400'}`} />

            {/* Subject info */}
            <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-800 truncate">{paper.subjectName}</p>
                <p className="text-[11px] text-slate-400">{paper.subjectCode}</p>
            </div>

            {/* Time slot */}
            <div className="text-xs text-slate-500 flex items-center gap-1 shrink-0">
                <Clock className="h-3 w-3 text-slate-400" />
                {hasTime
                    ? <span>{formatTime(paper.startTime)} – {formatTime(paper.endTime)}</span>
                    : <span className="text-amber-500 italic">No time set</span>
                }
            </div>

            {/* Marks */}
            <div className="text-xs font-semibold text-slate-600 shrink-0 w-16 text-center bg-white rounded-md border border-slate-200 py-1">
                {paper.maxMarks} marks
            </div>

            {/* Actions */}
            {!isCompleted && (
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-indigo-500 hover:text-indigo-700 hover:bg-indigo-50"
                        onClick={startEdit}>
                        <Edit2 className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500 hover:text-red-700 hover:bg-red-50"
                        onClick={handleDelete} disabled={deleting}>
                        {deleting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                    </Button>
                </div>
            )}
        </div>
    );
}

/* ─────────────────────────────────────────────────────────────────────
   ADD SUBJECT PAPER FORM (compact)
───────────────────────────────────────────────────────────────────── */
function AddSubjectForm({ examId, exam, classroomSubjects, onAdded, onCancel }) {
    const [form, setForm] = useState({
        subjectId: '', examDate: '', startTime: '', endTime: '', maxMarks: '100'
    });
    const [submitting, setSubmitting] = useState(false);

    async function handleSubmit(e) {
        e.preventDefault();
        if (!form.subjectId) { toast.error('Select a subject.'); return; }
        if (!form.examDate) { toast.error('Date is required.'); return; }
        if (form.startTime && form.endTime && form.startTime >= form.endTime) {
            toast.error('End time must be after start time.'); return;
        }

        setSubmitting(true);
        const tid = toast.loading('Adding paper...');
        try {
            await apiClient.post(`/api/admin/exams/${examId}/subjects`, {
                subjectId: Number(form.subjectId),
                examDate: form.examDate,
                startTime: form.startTime || null,
                endTime: form.endTime || null,
                maxMarks: Number(form.maxMarks),
            });
            toast.success('Paper added!', { id: tid });
            onAdded();
            setForm({ subjectId: '', examDate: '', startTime: '', endTime: '', maxMarks: '100' });
        } catch (err) {
            toast.error(err.response?.data?.message || err.customMessage || 'Failed.', { id: tid });
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <form onSubmit={handleSubmit} className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold text-slate-700 flex items-center gap-1.5">
                    <Plus className="h-4 w-4 text-indigo-500" /> Add Subject Paper
                </h4>
                <Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={onCancel}>
                    <X className="h-4 w-4" />
                </Button>
            </div>

            <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                    <Label className="text-xs text-slate-600">Subject</Label>
                    <Select value={form.subjectId || 'none'}
                        onValueChange={v => setForm(p => ({ ...p, subjectId: v === 'none' ? '' : v }))}>
                        <SelectTrigger className="h-9 text-sm">
                            <SelectValue placeholder="Select subject" />
                        </SelectTrigger>
                        <SelectContent>
                            {classroomSubjects.map(s => (
                                <SelectItem key={s.subjectId} value={String(s.subjectId)}>
                                    {s.subjectName} ({s.subjectCode})
                                </SelectItem>
                            ))}
                            {classroomSubjects.length === 0 && (
                                <SelectItem value="none" disabled>All subjects added</SelectItem>
                            )}
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-1">
                    <Label className="text-xs text-slate-600">Exam Date</Label>
                    <Input type="date" value={form.examDate}
                        onChange={e => setForm(p => ({ ...p, examDate: e.target.value }))}
                        min={exam?.startDate} max={exam?.endDate}
                        className="h-9 text-sm" />
                </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                    <Label className="text-xs text-slate-600">Start Time</Label>
                    <Input type="time" value={form.startTime}
                        onChange={e => setForm(p => ({ ...p, startTime: e.target.value }))}
                        className="h-9 text-sm" />
                </div>
                <div className="space-y-1">
                    <Label className="text-xs text-slate-600">End Time</Label>
                    <Input type="time" value={form.endTime}
                        onChange={e => setForm(p => ({ ...p, endTime: e.target.value }))}
                        className="h-9 text-sm" />
                </div>
                <div className="space-y-1">
                    <Label className="text-xs text-slate-600">Max Marks</Label>
                    <Input type="number" min="1" value={form.maxMarks}
                        onChange={e => setForm(p => ({ ...p, maxMarks: e.target.value }))}
                        className="h-9 text-sm" />
                </div>
            </div>

            <div className="flex justify-end gap-2 pt-1">
                <Button type="button" variant="outline" size="sm" onClick={onCancel}
                    className="h-8 text-xs" disabled={submitting}>Cancel</Button>
                <Button type="submit" size="sm" disabled={submitting}
                    className="h-8 text-xs bg-indigo-600 hover:bg-indigo-700">
                    {submitting && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
                    Add Paper
                </Button>
            </div>
        </form>
    );
}

/* ═══════════════════════════════════════════════════════════════════
   EXAM DETAIL DIALOG — Timetable View
═══════════════════════════════════════════════════════════════════ */
export default function ExamDetailDialog({ open, onClose, exam }) {
    const [subjects, setSubjects] = useState([]);
    const [availableSubjects, setAvailableSubjects] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showAddForm, setShowAddForm] = useState(false);

    const examId = exam?.id;
    const isCompleted = exam?.status === 'Completed';

    const fetchSubjects = useCallback(async () => {
        if (!examId) return;
        setLoading(true);
        try {
            const res = await apiClient.get(`/api/admin/exams/${examId}/subjects`);
            setSubjects(res.data || []);
        } catch {
            toast.error('Failed to load subject papers.');
        } finally {
            setLoading(false);
        }
    }, [examId]);

    const fetchAvailable = useCallback(async () => {
        if (!examId) return;
        try {
            const res = await apiClient.get(`/api/admin/exams/${examId}/subjects/available`);
            setAvailableSubjects(res.data || []);
        } catch {
            setAvailableSubjects([]);
        }
    }, [examId]);

    useEffect(() => {
        if (open && examId) {
            fetchSubjects();
            fetchAvailable();
        }
    }, [open, examId, fetchSubjects, fetchAvailable]);

    function handleRefresh() {
        fetchSubjects();
        fetchAvailable();
    }

    // Group subjects by date
    const { sortedDates, groups, unscheduled } = useMemo(() => groupByDate(subjects), [subjects]);
    const scheduledCount = subjects.filter(s => s.examDate && s.startTime && s.endTime).length;
    const totalMarks = subjects.reduce((sum, s) => sum + (s.maxMarks || 0), 0);

    if (!exam) return null;

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <GraduationCap className="h-5 w-5 text-indigo-600" />
                        {exam.name}
                    </DialogTitle>
                    <DialogDescription>
                        <span className="inline-flex items-center gap-3 flex-wrap text-xs">
                            <span className="inline-flex items-center gap-1">
                                <BookOpen className="h-3.5 w-3.5" /> {exam.examType}
                            </span>
                            <span className="inline-flex items-center gap-1">
                                <Calendar className="h-3.5 w-3.5" /> {exam.startDate} → {exam.endDate}
                            </span>
                            <span className="font-medium">{exam.classroomName}</span>
                            <span className="text-slate-400">•</span>
                            <span>{exam.academicYearName}</span>
                        </span>
                    </DialogDescription>
                </DialogHeader>

                {/* ── Summary bar ── */}
                <div className="flex items-center gap-3 flex-wrap">
                    <div className="flex items-center gap-1.5 text-xs bg-indigo-50 text-indigo-700 px-2.5 py-1.5 rounded-md border border-indigo-100">
                        <BookOpen className="h-3.5 w-3.5" />
                        <span className="font-semibold">{subjects.length}</span> papers
                    </div>
                    <div className="flex items-center gap-1.5 text-xs bg-emerald-50 text-emerald-700 px-2.5 py-1.5 rounded-md border border-emerald-100">
                        <Check className="h-3.5 w-3.5" />
                        <span className="font-semibold">{scheduledCount}</span> scheduled
                    </div>
                    {subjects.length - scheduledCount > 0 && (
                        <div className="flex items-center gap-1.5 text-xs bg-amber-50 text-amber-700 px-2.5 py-1.5 rounded-md border border-amber-100">
                            <AlertCircle className="h-3.5 w-3.5" />
                            <span className="font-semibold">{subjects.length - scheduledCount}</span> need scheduling
                        </div>
                    )}
                    <div className="ml-auto text-xs font-semibold text-slate-600">
                        Total: {totalMarks} marks
                    </div>
                </div>

                {/* ── Header + Add button ── */}
                <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-1.5">
                        <Calendar className="h-4 w-4 text-indigo-500" />
                        Exam Timetable
                    </h3>
                    {!isCompleted && !showAddForm && (
                        <Button size="sm" variant="outline"
                            onClick={() => setShowAddForm(true)}
                            className="h-7 text-xs border-indigo-200 text-indigo-600 hover:bg-indigo-50">
                            <Plus className="h-3.5 w-3.5 mr-1" /> Add Paper
                        </Button>
                    )}
                </div>

                {/* ── Add Subject Form ── */}
                {showAddForm && (
                    <AddSubjectForm
                        examId={examId}
                        exam={exam}
                        classroomSubjects={availableSubjects}
                        onAdded={() => { handleRefresh(); setShowAddForm(false); }}
                        onCancel={() => setShowAddForm(false)}
                    />
                )}

                {/* ── Timetable Body ── */}
                {loading ? (
                    <div className="space-y-2 mt-1">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="h-14 bg-slate-100 rounded-lg animate-pulse" />
                        ))}
                    </div>
                ) : subjects.length === 0 ? (
                    <Card className="border-dashed border-slate-300">
                        <CardContent className="py-10 flex flex-col items-center text-slate-400 text-sm">
                            <BookOpen className="h-10 w-10 mb-2 opacity-30" />
                            <p className="font-medium text-slate-500">No subject papers yet</p>
                            <p className="text-xs mt-0.5">Add subject papers to build your exam timetable.</p>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="space-y-4">
                        {/* ── Scheduled: grouped by date ── */}
                        {sortedDates.map(date => (
                            <div key={date} className="space-y-1.5">
                                {/* Date header */}
                                <div className="flex items-center gap-2 px-1">
                                    <div className="p-1 bg-indigo-100 rounded">
                                        <Calendar className="h-3.5 w-3.5 text-indigo-600" />
                                    </div>
                                    <h4 className="text-xs font-bold text-indigo-700 uppercase tracking-wide">
                                        {formatDate(date)}
                                    </h4>
                                    <span className="text-[10px] text-slate-400">
                                        {groups[date].length} paper{groups[date].length > 1 ? 's' : ''}
                                    </span>
                                    <div className="flex-1 h-px bg-indigo-100 ml-2" />
                                </div>

                                {/* Papers for this date */}
                                <div className="space-y-1.5 ml-1">
                                    {groups[date].map(paper => (
                                        <SubjectPaperRow
                                            key={paper.id}
                                            paper={paper}
                                            exam={exam}
                                            onSaved={handleRefresh}
                                            onDelete={handleRefresh}
                                            isCompleted={isCompleted}
                                        />
                                    ))}
                                </div>
                            </div>
                        ))}

                        {/* ── Unscheduled papers ── */}
                        {unscheduled.length > 0 && (
                            <div className="space-y-1.5">
                                <div className="flex items-center gap-2 px-1">
                                    <div className="p-1 bg-amber-100 rounded">
                                        <AlertCircle className="h-3.5 w-3.5 text-amber-600" />
                                    </div>
                                    <h4 className="text-xs font-bold text-amber-700 uppercase tracking-wide">
                                        Unscheduled
                                    </h4>
                                    <span className="text-[10px] text-slate-400">
                                        {unscheduled.length} paper{unscheduled.length > 1 ? 's' : ''}
                                    </span>
                                    <div className="flex-1 h-px bg-amber-100 ml-2" />
                                </div>
                                <div className="space-y-1.5 ml-1">
                                    {unscheduled.map(paper => (
                                        <SubjectPaperRow
                                            key={paper.id}
                                            paper={paper}
                                            exam={exam}
                                            onSaved={handleRefresh}
                                            onDelete={handleRefresh}
                                            isCompleted={isCompleted}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                <DialogFooter className="pt-2">
                    <Button variant="outline" onClick={onClose}>Close</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
