export function getEnrollmentColor(pct) {
    if (pct >= 100) return 'bg-red-500';
    if (pct >= 80) return 'bg-amber-500';
    return 'bg-emerald-500';
}

export function getEnrollmentBadge(pct) {
    if (pct >= 100) return { color: 'bg-red-50 text-red-700 border-red-200', label: 'Full' };
    if (pct >= 80) return { color: 'bg-amber-50 text-amber-700 border-amber-200', label: 'Almost Full' };
    return { color: 'bg-emerald-50 text-emerald-700 border-emerald-200', label: 'Available' };
}
