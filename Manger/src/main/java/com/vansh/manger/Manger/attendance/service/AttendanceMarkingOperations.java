package com.vansh.manger.Manger.attendance.service;

import java.util.List;

import com.vansh.manger.Manger.attendance.dto.AttendanceResponseDTO;
import com.vansh.manger.Manger.attendance.dto.BulkAttendanceRequestDTO;

/**
 * ISP: Write operations for marking student attendance.
 */
public interface AttendanceMarkingOperations {
    List<AttendanceResponseDTO> markAttendance(BulkAttendanceRequestDTO requestDTO);
}
