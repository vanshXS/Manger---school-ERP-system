package com.vansh.manger.Manger.attendance.controller;


import com.vansh.manger.Manger.attendance.dto.AttendanceResponseDTO;
import com.vansh.manger.Manger.attendance.dto.BulkAttendanceRequestDTO;
import com.vansh.manger.Manger.classroom.dto.ClassroomAttendanceStatsDTO;
import com.vansh.manger.Manger.attendance.dto.RosterStudentDTO;
import com.vansh.manger.Manger.attendance.service.AttendanceService;
import com.vansh.manger.Manger.attendance.dto.AttendanceSummaryDTO;
import com.vansh.manger.Manger.student.dto.StudentResponseDTO;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/teacher/attendance")
@RequiredArgsConstructor
public class TeacherAttendanceController {

    private final AttendanceService attendanceService;

    @GetMapping("/classes")
    public ResponseEntity<List<ClassroomAttendanceStatsDTO>> getClassrooms() {

        return ResponseEntity.ok(attendanceService.getAssignedClassrooms());
    }

    @GetMapping("/classes/{id}/roster")
    public ResponseEntity<List<RosterStudentDTO>> getClassroomsByDate(
            @PathVariable Long id,
            @RequestParam(required = false)LocalDate date
            ) {
        return ResponseEntity.ok(attendanceService.getRoster(id, date));
    }

    @PostMapping("/bulk-save")
    public ResponseEntity<List<AttendanceResponseDTO>> bulkAttendance(@RequestBody BulkAttendanceRequestDTO requestDTO) {
        return ResponseEntity.ok(attendanceService.markAttendance(requestDTO));

    }

    @GetMapping("/students/{studentId}")
    public ResponseEntity<StudentResponseDTO> getStudentById(@PathVariable Long studentId) {
        return ResponseEntity.ok(attendanceService.getStudentById(studentId));
    }

    @GetMapping("/students/{studentId}/attendance-summary")
    public ResponseEntity<AttendanceSummaryDTO> getStudentAttendanceSummary(@PathVariable Long studentId) {
        return ResponseEntity.ok(attendanceService.getStudentAttendanceSummary(studentId));
    }
}
