package com.vansh.manger.Manger.common.util;

/**
 * Single source of truth for grade boundaries across the entire application.
 *
 * <p><b>SRP</b> — one responsibility: percentage → grade letter.
 * <b>DRY</b> — replaces duplicate grade if-else chains in
 * TeacherMarkService (inline), PDFService.getOverallGrade(),
 * and AdminStudentService exam-result mapping.
 * <b>OCP</b> — if the school later needs configurable grade boundaries,
 * this class is the single place to change.</p>
 */
public final class GradeCalculator {

    private GradeCalculator() {
        // utility class — no instances
    }

    /**
     * Computes the letter grade for a given percentage.
     * Uses a unified scale (A+/A/B/C/D/F).
     *
     * @param percentage The percentage score (0–100).
     * @return The letter grade.
     */
    public static String computeGrade(double percentage) {
        if (percentage >= 90) return "A+";
        if (percentage >= 80) return "A";
        if (percentage >= 70) return "B";
        if (percentage >= 60) return "C";
        if (percentage >= 40) return "D";
        return "F";
    }
}
