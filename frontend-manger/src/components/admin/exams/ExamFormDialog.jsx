'use client';

import { Button } from '@/components/ui/button';
import {
    Dialog, DialogContent, DialogDescription,
    DialogFooter, DialogHeader, DialogTitle
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select';
import apiClient from '@/lib/axios';
import { CheckSquare, ClipboardList, Loader2, MinusSquare } from 'lucide-react';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { EMPTY_FORM, EXAM_TYPES } from './examConstants';

/* ── small form field wrapper ── */
function FormField({ label, id, error, children }) {
    return (
        <div className="space-y-1.5">
            <Label htmlFor={id} className="text-sm font-medium text-slate-700">{label}</Label>
            {children}
            {error && <p className="text-xs text-red-600">{error}</p>}
        </div>
    );
}

/* ═══════════════════════════════════════════════════════════════════
   EXAM FORM DIALOG (Create / Edit)
   - Create: supports multi-classroom selection (bulk)
   - Edit:   single classroom (locked)
═══════════════════════════════════════════════════════════════════ */
export default function ExamFormDialog({ open, onClose, onSaved, editingExam, classrooms }) {
    const [form, setForm] = useState(EMPTY_FORM);
    const [errors, setErrors] = useState({});
    const [submitting, setSubmitting] = useState(false);

    // Multi-classroom state (create mode only)
    const [selectedClassroomIds, setSelectedClassroomIds] = useState([]);
    // Per-classroom subjects: { [classroomId]: { subjects: [], selected: [] } }
    const [classroomSubjectsMap, setClassroomSubjectsMap] = useState({});
    const [loadingSubjects, setLoadingSubjects] = useState(false);

    // Edit mode: single classroom subjects
    const [editClassroomId, setEditClassroomId] = useState('');

    useEffect(() => {
        if (editingExam) {
            const typeEntry = EXAM_TYPES.find(t => t.label === editingExam.examType);
            setForm({
                name: editingExam.name || '',
                examType: typeEntry?.value || '',
                startDate: editingExam.startDate || '',
                endDate: editingExam.endDate || '',
                totalMarks: String(editingExam.totalMarks ?? 100),
                description: editingExam.description || '',
            });
            setEditClassroomId(String(editingExam.classroomId || ''));
            setSelectedClassroomIds([]);
            setClassroomSubjectsMap({});
        } else {
            setForm(EMPTY_FORM);
            setEditClassroomId('');
            setSelectedClassroomIds([]);
            setClassroomSubjectsMap({});
        }
        setErrors({});
    }, [editingExam, open]);

    /* ── Fetch subjects when a classroom is toggled on ── */
    async function fetchSubjectsForClassroom(classroomId) {
        try {
            const res = await apiClient.get(`/api/admin/classrooms/${classroomId}/subjects`);
            const subjects = res.data || [];
            setClassroomSubjectsMap(prev => ({
                ...prev,
                [classroomId]: {
                    subjects,
                    selected: subjects.map(s => s.id), // all checked by default
                }
            }));
        } catch {
            setClassroomSubjectsMap(prev => ({
                ...prev,
                [classroomId]: { subjects: [], selected: [] }
            }));
        }
    }

    /* ── Toggle a classroom checkbox ── */
    function toggleClassroom(classroomId) {
        setSelectedClassroomIds(prev => {
            const isSelected = prev.includes(classroomId);
            if (isSelected) {
                // Remove
                setClassroomSubjectsMap(p => {
                    const copy = { ...p };
                    delete copy[classroomId];
                    return copy;
                });
                return prev.filter(id => id !== classroomId);
            } else {
                // Add — fetch subjects
                fetchSubjectsForClassroom(classroomId);
                return [...prev, classroomId];
            }
        });
    }

    /* ── Select / deselect all classrooms ── */
    function toggleAllClassrooms() {
        if (selectedClassroomIds.length === classrooms.length) {
            // Deselect all
            setSelectedClassroomIds([]);
            setClassroomSubjectsMap({});
        } else {
            // Select all
            const allIds = classrooms.map(c => c.id);
            setSelectedClassroomIds(allIds);
            setLoadingSubjects(true);
            Promise.all(allIds.map(id => fetchSubjectsForClassroom(id)))
                .finally(() => setLoadingSubjects(false));
        }
    }

    /* ── Toggle a subject within a classroom ── */
    function toggleSubject(classroomId, subjectId) {
        setClassroomSubjectsMap(prev => {
            const entry = prev[classroomId];
            if (!entry) return prev;
            const isSelected = entry.selected.includes(subjectId);
            return {
                ...prev,
                [classroomId]: {
                    ...entry,
                    selected: isSelected
                        ? entry.selected.filter(id => id !== subjectId)
                        : [...entry.selected, subjectId]
                }
            };
        });
    }

    /* ── Toggle all subjects for a classroom ── */
    function toggleAllSubjects(classroomId) {
        setClassroomSubjectsMap(prev => {
            const entry = prev[classroomId];
            if (!entry) return prev;
            const allSelected = entry.selected.length === entry.subjects.length;
            return {
                ...prev,
                [classroomId]: {
                    ...entry,
                    selected: allSelected ? [] : entry.subjects.map(s => s.id)
                }
            };
        });
    }

    const set = (field) => (e) =>
        setForm(prev => ({ ...prev, [field]: e.target?.value ?? e }));

    function validate() {
        const e = {};
        if (!form.name.trim()) e.name = 'Exam name is required.';
        if (!form.examType) e.examType = 'Please select an exam type.';
        if (!form.startDate) e.startDate = 'Start date is required.';
        if (!form.endDate) e.endDate = 'End date is required.';
        if (form.startDate && form.endDate && form.startDate > form.endDate)
            e.endDate = 'End date must be after start date.';
        if (!form.totalMarks || isNaN(Number(form.totalMarks)) || Number(form.totalMarks) < 1)
            e.totalMarks = 'Total marks must be at least 1.';

        if (editingExam) {
            if (!editClassroomId) e.classroomId = 'Please select a classroom.';
        } else {
            if (selectedClassroomIds.length === 0) e.classrooms = 'Please select at least one classroom.';
            // Check that each selected classroom has at least one subject
            for (const cid of selectedClassroomIds) {
                const entry = classroomSubjectsMap[cid];
                if (entry && entry.subjects.length > 0 && entry.selected.length === 0) {
                    e.classrooms = 'Each classroom must have at least one subject selected.';
                    break;
                }
            }
        }
        return e;
    }

    async function handleSubmit(ev) {
        ev.preventDefault();
        const errs = validate();
        if (Object.keys(errs).length) { setErrors(errs); return; }

        setSubmitting(true);
        const tid = toast.loading(editingExam ? 'Updating exam...' : `Creating exam${selectedClassroomIds.length > 1 ? 's' : ''}...`);

        try {
            if (editingExam) {
                // ── EDIT (single classroom) ──
                await apiClient.put(`/api/admin/exams/${editingExam.id}`, {
                    name: form.name.trim(),
                    examType: form.examType,
                    startDate: form.startDate,
                    endDate: form.endDate,
                    totalMarks: Number(form.totalMarks),
                    description: form.description.trim() || null,
                    classroomId: Number(editClassroomId),
                });
                toast.success('Exam updated!', { id: tid });
            } else if (selectedClassroomIds.length === 1) {
                // ── SINGLE CREATE ──
                const cid = selectedClassroomIds[0];
                const entry = classroomSubjectsMap[cid];
                await apiClient.post('/api/admin/exams', {
                    name: form.name.trim(),
                    examType: form.examType,
                    startDate: form.startDate,
                    endDate: form.endDate,
                    totalMarks: Number(form.totalMarks),
                    description: form.description.trim() || null,
                    classroomId: cid,
                    subjectIds: entry?.selected || [],
                });
                toast.success('Exam created!', { id: tid });
            } else {
                // ── BULK CREATE ──
                await apiClient.post('/api/admin/exams/bulk', {
                    name: form.name.trim(),
                    examType: form.examType,
                    startDate: form.startDate,
                    endDate: form.endDate,
                    totalMarks: Number(form.totalMarks),
                    description: form.description.trim() || null,
                    classroomIds: selectedClassroomIds,
                });
                toast.success(`${selectedClassroomIds.length} exams created!`, { id: tid });
            }
            onSaved();
            onClose();
        } catch (err) {
            toast.error(err.response?.data?.message || err.customMessage || 'Something went wrong.', { id: tid });
        } finally {
            setSubmitting(false);
        }
    }

    function classroomLabel(c) {
        return c.gradeLevel ? `${c.gradeLevel} - ${c.section?.toUpperCase()}` : c.section?.toUpperCase();
    }

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <ClipboardList className="h-5 w-5 text-indigo-600" />
                        {editingExam ? 'Edit Exam' : 'Create New Exam'}
                    </DialogTitle>
                    <DialogDescription>
                        {editingExam
                            ? 'Update exam details.'
                            : 'Schedule an exam — select one or multiple classrooms to create in bulk.'}
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4 py-2">
                    {/* Name */}
                    <FormField label="Exam Name" id="name" error={errors.name}>
                        <Input id="name" value={form.name} onChange={set('name')}
                            placeholder="e.g. Mid Term Examination 2025"
                            className={errors.name ? 'border-red-400' : ''} />
                    </FormField>

                    {/* Type + Total Marks */}
                    <div className="grid grid-cols-2 gap-3">
                        <FormField label="Exam Type" id="examType" error={errors.examType}>
                            <Select value={form.examType || 'none'} onValueChange={v => setForm(p => ({ ...p, examType: v === 'none' ? '' : v }))}>
                                <SelectTrigger className={errors.examType ? 'border-red-400' : ''}>
                                    <SelectValue placeholder="Select type" />
                                </SelectTrigger>
                                <SelectContent>
                                    {EXAM_TYPES.map(t => (
                                        <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </FormField>
                        <FormField label="Total Marks" id="totalMarks" error={errors.totalMarks}>
                            <Input id="totalMarks" type="number" min="1" value={form.totalMarks}
                                onChange={set('totalMarks')} placeholder="100"
                                className={errors.totalMarks ? 'border-red-400' : ''} />
                        </FormField>
                    </div>

                    {/* Dates */}
                    <div className="grid grid-cols-2 gap-3">
                        <FormField label="Start Date" id="startDate" error={errors.startDate}>
                            <Input id="startDate" type="date" value={form.startDate} onChange={set('startDate')}
                                className={errors.startDate ? 'border-red-400' : ''} />
                        </FormField>
                        <FormField label="End Date" id="endDate" error={errors.endDate}>
                            <Input id="endDate" type="date" value={form.endDate} onChange={set('endDate')}
                                className={errors.endDate ? 'border-red-400' : ''} />
                        </FormField>
                    </div>

                    {/* ── CLASSROOMS ─────────────────────────────────────────────── */}
                    {editingExam ? (
                        // Edit mode — single classroom (locked)
                        <FormField label="Classroom" id="classroomId" error={errors.classroomId}>
                            <Select value={editClassroomId || 'none'} disabled>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select classroom" />
                                </SelectTrigger>
                                <SelectContent>
                                    {classrooms.map(c => (
                                        <SelectItem key={c.id} value={String(c.id)}>{classroomLabel(c)}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </FormField>
                    ) : (
                        // Create mode — multi-classroom checkboxes
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <Label className="text-sm font-medium text-slate-700">
                                    Classrooms
                                    <span className="text-xs font-normal text-slate-400 ml-1.5">
                                        ({selectedClassroomIds.length}/{classrooms.length} selected)
                                    </span>
                                </Label>
                                <Button type="button" variant="ghost" size="sm" className="h-7 text-xs text-indigo-600"
                                    onClick={toggleAllClassrooms}>
                                    {selectedClassroomIds.length === classrooms.length ? (
                                        <><MinusSquare className="h-3.5 w-3.5 mr-1" /> Deselect All</>
                                    ) : (
                                        <><CheckSquare className="h-3.5 w-3.5 mr-1" /> Select All</>
                                    )}
                                </Button>
                            </div>

                            {errors.classrooms && <p className="text-xs text-red-600">{errors.classrooms}</p>}

                            <div className="bg-slate-50 rounded-lg border border-slate-200 max-h-[280px] overflow-y-auto divide-y divide-slate-100">
                                {classrooms.map(c => {
                                    const isSelected = selectedClassroomIds.includes(c.id);
                                    const entry = classroomSubjectsMap[c.id];
                                    const subjects = entry?.subjects || [];
                                    const selectedSubs = entry?.selected || [];

                                    return (
                                        <div key={c.id} className="px-3 py-2">
                                            {/* Classroom checkbox */}
                                            <label className="flex items-center gap-2.5 cursor-pointer hover:bg-white rounded px-1 py-1 transition-colors">
                                                <input
                                                    type="checkbox"
                                                    checked={isSelected}
                                                    onChange={() => toggleClassroom(c.id)}
                                                    className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                                />
                                                <span className="text-sm font-medium text-slate-700">{classroomLabel(c)}</span>
                                                {isSelected && subjects.length > 0 && (
                                                    <span className="text-xs text-slate-400 ml-auto">
                                                        {selectedSubs.length}/{subjects.length} subjects
                                                    </span>
                                                )}
                                            </label>

                                            {/* Subjects for this classroom */}
                                            {isSelected && subjects.length > 0 && (
                                                <div className="ml-7 mt-1.5 mb-1 space-y-0.5">
                                                    <button type="button" className="text-[11px] text-indigo-500 hover:text-indigo-700 mb-1"
                                                        onClick={() => toggleAllSubjects(c.id)}>
                                                        {selectedSubs.length === subjects.length ? 'Deselect all subjects' : 'Select all subjects'}
                                                    </button>
                                                    {subjects.map(s => (
                                                        <label key={s.id}
                                                            className="flex items-center gap-2 cursor-pointer hover:bg-white rounded px-1 py-0.5 transition-colors">
                                                            <input
                                                                type="checkbox"
                                                                checked={selectedSubs.includes(s.id)}
                                                                onChange={() => toggleSubject(c.id, s.id)}
                                                                className="h-3.5 w-3.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                                            />
                                                            <span className="text-xs text-slate-600">{s.name}</span>
                                                            <span className="text-[10px] text-slate-400">({s.code})</span>
                                                        </label>
                                                    ))}
                                                </div>
                                            )}

                                            {isSelected && subjects.length === 0 && !loadingSubjects && (
                                                <p className="ml-7 text-[11px] text-amber-600 mt-1">
                                                    No subjects assigned to this classroom.
                                                </p>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Description */}
                    <FormField label="Description (optional)" id="description">
                        <textarea
                            id="description"
                            value={form.description}
                            onChange={set('description')}
                            placeholder="Any instructions or notes..."
                            rows={2}
                            className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 resize-none"
                        />
                    </FormField>

                    <DialogFooter className="pt-2">
                        <Button type="button" variant="outline" onClick={onClose} disabled={submitting}>Cancel</Button>
                        <Button type="submit" disabled={submitting} className="bg-indigo-600 hover:bg-indigo-700">
                            {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {editingExam
                                ? 'Save Changes'
                                : selectedClassroomIds.length > 1
                                    ? `Create ${selectedClassroomIds.length} Exams`
                                    : 'Create Exam'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
