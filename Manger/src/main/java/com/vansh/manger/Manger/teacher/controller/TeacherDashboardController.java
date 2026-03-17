package com.vansh.manger.Manger.teacher.controller;

import com.vansh.manger.Manger.common.dto.ActivityLogDTO;
import com.vansh.manger.Manger.teacher.dto.TeacherDashboardResponseDTO;
import com.vansh.manger.Manger.teacher.service.TeacherDashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/teacher/dashboard")
@RequiredArgsConstructor
public class TeacherDashboardController {

    private final TeacherDashboardService dashboardService;

    @GetMapping("/summary")
    public ResponseEntity<TeacherDashboardResponseDTO> getDashboardSummary() {
        return ResponseEntity.ok(dashboardService.getDashboardSummary());
    }

    @GetMapping("/activity-logs")
    public ResponseEntity<Page<ActivityLogDTO>> getAllActivityLogs(Pageable pageable) {
        return ResponseEntity.ok(dashboardService.getAllActivityLogs(pageable));
    }
}
