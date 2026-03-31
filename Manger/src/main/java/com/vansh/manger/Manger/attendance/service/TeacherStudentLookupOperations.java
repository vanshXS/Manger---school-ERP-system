package com.vansh.manger.Manger.attendance.service;

import com.vansh.manger.Manger.student.dto.StudentResponseDTO;

/**
 * ISP: Operations for teacher-facing student profile lookup.
 * This is NOT an attendance concern — it's a misplaced responsibility
 * that was in AttendanceService. Separated via ISP for clean boundaries.
 */
public interface TeacherStudentLookupOperations {
    StudentResponseDTO getStudentById(Long studentId);
}
