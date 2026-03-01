package com.vansh.manger.Manger.Controller;


import com.vansh.manger.Manger.DTO.AttendanceResponseDTO;
import com.vansh.manger.Manger.DTO.BulkAttendanceRequestDTO;
import com.vansh.manger.Manger.Service.AttendanceService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/teacher/attendance")
@RequiredArgsConstructor
public class TeacherAttendanceController {

    private final AttendanceService attendanceService;

    @PostMapping
    public ResponseEntity<List<AttendanceResponseDTO>> markAttendance(@Valid @RequestBody BulkAttendanceRequestDTO requestDTO) {
        return ResponseEntity.ok(attendanceService.markAttendance(requestDTO));
    }
}
