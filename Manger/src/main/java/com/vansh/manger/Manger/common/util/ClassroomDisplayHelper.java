package com.vansh.manger.Manger.common.util;

import com.vansh.manger.Manger.classroom.entity.Classroom;

/**
 * Utility for consistent classroom display-name formatting.
 *
 * <p><b>DRY</b> — the pattern {@code gradeLevel.getDisplayName() + " - " + section}
 * is scattered across 8+ files (TeacherDashboardService, AdminDashboardService,
 * AttendanceService, SearchService, AdminAssignmentService, AdminSubjectService,
 * TeacherService, PDFService). This centralizes it.</p>
 */
public final class ClassroomDisplayHelper {

    private ClassroomDisplayHelper() {
        // utility class — no instances
    }

    /**
     * Formats a classroom entity into a human-readable display name.
     * Example: "Grade 10 - A"
     */
    public static String formatName(Classroom classroom) {
        return formatName(
                classroom.getGradeLevel().getDisplayName(),
                classroom.getSection());
    }

    /**
     * Formats grade display name and section into a human-readable display name.
     * Example: "Grade 10 - A"
     */
    public static String formatName(String gradeDisplayName, String section) {
        return gradeDisplayName + " - " + section.toUpperCase();
    }
}
