package com.vansh.manger.Manger.attendance.service;

import java.time.LocalDate;
import java.util.List;

import com.vansh.manger.Manger.attendance.dto.AttendanceSummaryDTO;
import com.vansh.manger.Manger.attendance.dto.RosterStudentDTO;
import com.vansh.manger.Manger.classroom.dto.ClassroomAttendanceStatsDTO;

/**
 * ISP: Read-only operations for attendance queries and statistics.
 */
public interface AttendanceQueryOperations {
    List<RosterStudentDTO> getRoster(Long classroomId, LocalDate date);
    List<ClassroomAttendanceStatsDTO> getAssignedClassrooms();
    ClassroomAttendanceStatsDTO getClassroomStats(Long classroomId);
    AttendanceSummaryDTO getStudentAttendanceSummary(Long studentId);
}
