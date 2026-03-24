package com.vansh.manger.Manger.common.util;

import com.vansh.manger.Manger.attendance.entity.Attendance;
import com.vansh.manger.Manger.attendance.entity.AttendanceStatus;
import com.vansh.manger.Manger.exam.entity.StudentSubjectMarks;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

/**
 * Shared utility for computing academic risk scores.
 *
 * <p>Single Responsibility: this class owns ONLY the risk-scoring algorithm.
 * Both TeacherDashboardService and StudentPortalService delegate here
 * instead of duplicating the logic (DRY + SRP).</p>
 *
 * <p>Open/Closed: new risk conditions can be added inside
 * {@link #computeRisk} without modifying consumer services.</p>
 */
public final class RiskScoreCalculator {

    private RiskScoreCalculator() {
        // utility – no instances
    }

    // ──────────────────── public result record ────────────────────

    /**
     * Immutable result of a risk computation.
     */
    public record RiskResult(
            int riskScore,
            String riskLevel,
            Double attendancePercentage,
            Double averagePercentage,
            String weakestSubject,
            List<String> reasons,
            String recommendedAction
    ) {}

    // ──────────────────── main entry point ────────────────────

    /**
     * Compute risk for a single student given their attendance and marks.
     *
     * @param attendanceRecords all attendance records (may be empty)
     * @param marks             all subject marks (may be empty)
     * @return a fully computed {@link RiskResult}
     */
    public static RiskResult computeRisk(List<Attendance> attendanceRecords,
                                         List<StudentSubjectMarks> marks) {

        double attendancePct = calculateAttendancePercentage(attendanceRecords);
        double averagePct    = calculateAveragePercentage(marks);
        String weakest       = findWeakestSubject(marks);

        long failedSubjects = marks.stream()
                .filter(m -> toPercentage(m) < 40.0)
                .count();

        long absences = attendanceRecords.stream()
                .filter(r -> r.getAttendanceStatus() == AttendanceStatus.ABSENT)
                .count();

        int riskScore = 0;
        List<String> reasons = new ArrayList<>();

        // ── attendance rules ──
        if (!attendanceRecords.isEmpty()) {
            if (attendancePct < 75) {
                riskScore += 40;
                reasons.add("critical attendance drop");
            } else if (attendancePct < 85) {
                riskScore += 20;
                reasons.add("attendance below target");
            }
        }

        // ── marks rules ──
        if (!marks.isEmpty()) {
            if (averagePct < 40) {
                riskScore += 40;
                reasons.add("average below passing");
            } else if (averagePct < 55) {
                riskScore += 25;
                reasons.add("low exam average");
            }

            if (failedSubjects >= 2) {
                riskScore += 20;
                reasons.add("multiple weak subjects");
            } else if (failedSubjects == 1 && weakest != null) {
                riskScore += 10;
                reasons.add("needs support in " + weakest);
            }
        }

        // ── absence pattern ──
        if (absences >= 3) {
            riskScore += 10;
            reasons.add("frequent absence pattern");
        }

        String level  = resolveRiskLevel(riskScore);
        String action = buildRecommendedAction(attendancePct, averagePct, weakest);

        return new RiskResult(
                riskScore,
                level,
                attendanceRecords.isEmpty() ? null : roundTwo(attendancePct),
                marks.isEmpty()             ? null : roundTwo(averagePct),
                weakest,
                List.copyOf(reasons),
                action
        );
    }

    // ──────────────────── public helper methods ────────────────────

    public static double calculateAttendancePercentage(List<Attendance> records) {
        if (records.isEmpty()) return 100.0;
        long present = records.stream()
                .filter(r -> r.getAttendanceStatus() == AttendanceStatus.PRESENT)
                .count();
        return (present * 100.0) / records.size();
    }

    public static double calculateAveragePercentage(List<StudentSubjectMarks> marks) {
        if (marks.isEmpty()) return 100.0;
        return marks.stream()
                .mapToDouble(RiskScoreCalculator::toPercentage)
                .average()
                .orElse(100.0);
    }

    public static String findWeakestSubject(List<StudentSubjectMarks> marks) {
        return marks.stream()
                .min(Comparator.comparingDouble(RiskScoreCalculator::toPercentage))
                .map(m -> m.getSubject().getName())
                .orElse(null);
    }

    public static String resolveRiskLevel(int riskScore) {
        if (riskScore >= 60) return "High";
        if (riskScore >= 35) return "Medium";
        if (riskScore >= 25) return "Watch";
        return "No Risk";
    }

    // ──────────────────── private helpers ────────────────────

    private static double toPercentage(StudentSubjectMarks mark) {
        if (mark.getMarksObtained() == null || mark.getTotalMarks() == null || mark.getTotalMarks() == 0) {
            return 0.0;
        }
        return (mark.getMarksObtained() / mark.getTotalMarks()) * 100.0;
    }

    private static String buildRecommendedAction(double attendancePct, double averagePct, String weakest) {
        if (attendancePct < 75 && averagePct < 40) {
            return "Call guardian this week and start a remedial follow-up plan.";
        }
        if (attendancePct < 75) {
            return "Check attendance barriers and contact home before the pattern deepens.";
        }
        if (weakest != null && averagePct < 55) {
            return "Plan a short remedial revision in " + weakest + " and recheck next assessment.";
        }
        return "Keep this student on a watchlist and review progress in the next class test.";
    }

    private static double roundTwo(double value) {
        return Math.round(value * 100.0) / 100.0;
    }
}
