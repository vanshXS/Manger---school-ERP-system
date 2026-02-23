
export function classroomDisplayName(c) {
    if (!c) return '';
   
    if (c.displayName) return c.displayName;
   
    const grade = typeof c.gradeLevel === 'object' && c.gradeLevel !== null
        ? (c.gradeLevel.displayName ?? '')
        : (c.gradeLevel ?? '');
    const section = c.section ? c.section.toUpperCase() : '';
    if (grade && section) return `${grade} – ${section}`;
    if (grade) return grade;
    if (c.className) return c.className;
    if (c.name) return c.name;
    if (section) return `Section ${section}`;
    return c.id ? `Class #${c.id}` : '';
}
