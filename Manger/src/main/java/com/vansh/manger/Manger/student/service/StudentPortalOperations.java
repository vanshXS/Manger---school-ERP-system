package com.vansh.manger.Manger.student.service;

import com.vansh.manger.Manger.student.dto.*;

import java.util.List;

/**
 * Abstraction for the Student Portal's business operations.
 *
 * <p>Dependency Inversion (DIP): the controller depends on this
 * interface, not on the concrete implementation.  This makes the
 * service easily mockable and swappable.</p>
 *
 * <p>Interface Segregation (ISP): contains only the operations
 * the student portal needs — nothing more.</p>
 */
public interface StudentPortalOperations {

    /** Student's own profile + current enrollment info. */
    StudentResponseDTO getMyProfile();

    /** All academic years the student was enrolled in. */
    List<StudentAcademicYearDTO> getAcademicYears();

    /** Attendance summary (present, absent, %) for a given academic year. */
    StudentAttendanceSummaryDTO getAttendanceSummary(Long academicYearId);

    /** Monthly attendance comparison — current month vs previous month. */
    StudentAttendanceMonthDTO getMonthlyAttendance(int year, int month);

    /** All exams for the student's classroom in a given academic year. */
    List<StudentExamDTO> getExams(Long academicYearId);

    /** Subject-wise marks for a specific exam. */
    StudentExamResultDTO getExamResults(Long examId);

    /** Timetable for the student's current classroom. */
    List<StudentTimetableDTO> getTimetable();

    /** MVP: Student Self Risk Analysis. */
    StudentRiskAnalysisDTO getRiskAnalysis();
}
