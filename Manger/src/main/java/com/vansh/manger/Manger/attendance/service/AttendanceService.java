package com.vansh.manger.Manger.attendance.service;

import java.time.LocalDate;
import java.util.List;

import org.springframework.stereotype.Service;

import com.vansh.manger.Manger.attendance.dto.AttendanceResponseDTO;
import com.vansh.manger.Manger.attendance.dto.AttendanceSummaryDTO;
import com.vansh.manger.Manger.attendance.dto.BulkAttendanceRequestDTO;
import com.vansh.manger.Manger.attendance.dto.RosterStudentDTO;
import com.vansh.manger.Manger.classroom.dto.ClassroomAttendanceStatsDTO;
import com.vansh.manger.Manger.student.dto.StudentResponseDTO;

import lombok.RequiredArgsConstructor;

/**
 * Facade — backward-compatible entry point for teacher attendance operations.
 *
 * <p><b>OCP</b> — new attendance concerns can be added as new sub-services.
 * <b>DIP</b> — depends on 3 ISP interfaces, not concrete implementations.
 * <b>SRP</b> — sole responsibility is delegation.</p>
 *
 * <p>The {@code TeacherAttendanceController} continues to inject this single class,
 * so the API surface is unchanged.</p>
 */
@Service
@RequiredArgsConstructor
public class AttendanceService {

    private final AttendanceMarkingOperations markingOperations;
    private final AttendanceQueryOperations queryOperations;
    private final TeacherStudentLookupOperations studentLookupOperations;

    // ── Marking ─────────────────────────────────────────────────

    public List<AttendanceResponseDTO> markAttendance(BulkAttendanceRequestDTO requestDTO) {
        return markingOperations.markAttendance(requestDTO);
    }

    // ── Queries ─────────────────────────────────────────────────

    public List<RosterStudentDTO> getRoster(Long classroomId, LocalDate date) {
        return queryOperations.getRoster(classroomId, date);
    }

    public List<ClassroomAttendanceStatsDTO> getAssignedClassrooms() {
        return queryOperations.getAssignedClassrooms();
    }

    public ClassroomAttendanceStatsDTO getClassroomStats(Long classroomId) {
        return queryOperations.getClassroomStats(classroomId);
    }

    public AttendanceSummaryDTO getStudentAttendanceSummary(Long studentId) {
        return queryOperations.getStudentAttendanceSummary(studentId);
    }

    // ── Student Lookup ──────────────────────────────────────────

    public StudentResponseDTO getStudentById(Long studentId) {
        return studentLookupOperations.getStudentById(studentId);
    }
}
