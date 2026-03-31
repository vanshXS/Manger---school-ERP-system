package com.vansh.manger.Manger.student.service;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import com.vansh.manger.Manger.attendance.dto.AttendanceSummaryDTO;
import com.vansh.manger.Manger.exam.dto.StudentExamResultDTO;

/**
 * Defines the contract for read-only academic queries.
 *
 * <p><b>ISP</b> — segregated interface: only read-only academic data.
 * <b>DIP</b> — consumers depend on this abstraction.
 * <b>OCP</b> — new query types (e.g. progress reports) can be added
 * without modifying existing methods.</p>
 */
public interface StudentAcademicQueryOperations {

    /** Paginated exam results for a student. */
    Page<StudentExamResultDTO> getStudentExamResults(Long studentId, Pageable pageable);

    /** Attendance summary (present, absent, %) for current academic year. */
    AttendanceSummaryDTO getStudentAttendanceSummary(Long studentId);
}
