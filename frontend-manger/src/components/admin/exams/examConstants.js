// Exam module shared constants

export const EXAM_TYPES = [
    { value: 'Unit Test', label: 'Unit Test' },
    { value: 'Mid Term', label: 'Mid Term' },
    { value: 'Final Term', label: 'Final Term' },
    { value: 'Practical', label: 'Practical' },
    { value: 'Assignment', label: 'Assignment' },
    { value: 'Mock Test', label: 'Mock Test' },
];

export const STATUS_CONFIG = {
    Upcoming: { label: 'Upcoming', color: 'blue', pill: 'bg-blue-100 text-blue-700 border-blue-200' },
    Ongoing: { label: 'Ongoing', color: 'emerald', pill: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
    Completed: { label: 'Completed', color: 'slate', pill: 'bg-slate-100 text-slate-600 border-slate-200' },
};

export const NEXT_STATUS = {
    Upcoming: null,
    Ongoing: { label: 'Complete Exam', next: 'COMPLETED', color: 'text-slate-700' },
    Completed: null,
};

export const EMPTY_FORM = {
    name: '', examType: '', startDate: '', endDate: '',
    totalMarks: '100', description: '',
};

