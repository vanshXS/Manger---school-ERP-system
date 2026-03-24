package com.vansh.manger.Manger.dashboard.controller;

import com.vansh.manger.Manger.common.dto.ActivityLogDTO;
import com.vansh.manger.Manger.classroom.dto.ClassroomEnrollmentDTO;
import com.vansh.manger.Manger.dashboard.dto.DashboardKpiDTO;
import com.vansh.manger.Manger.teacher.dto.TeacherWorkloadDTO;
import com.vansh.manger.Manger.dashboard.service.AdminDashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/admin/dashboard")
@RequiredArgsConstructor
public class AdminDashboardController {

    private final AdminDashboardService adminDashboardService;

    @GetMapping("/kpis")
    public ResponseEntity<DashboardKpiDTO> getKpis() {
        return ResponseEntity.ok(adminDashboardService.getKpis());
    }

    @GetMapping("/enrollment-overview")
    public ResponseEntity<List<ClassroomEnrollmentDTO>> getEnrollmentOverview() {

        return ResponseEntity.ok(adminDashboardService.getEnrollmentOverview());
    }

    @GetMapping("/teacher-workload")
    public ResponseEntity<List<TeacherWorkloadDTO>> getTeacherWorkload() {
        return ResponseEntity.ok(adminDashboardService.getTeacherWorkload());
    }

    @GetMapping("/recent-activity")
    public ResponseEntity<List<ActivityLogDTO>> getRecentActivity(
            @RequestParam(required = false) String role) {
        return ResponseEntity.ok(adminDashboardService.getRecentActivity(role));
    }

    @GetMapping("/activity-logs")
    public ResponseEntity<?> getAllActivityLog(
            @RequestParam(required = false) String role,
            Pageable pageable) {

        return ResponseEntity.ok(adminDashboardService.getAllActivityLogs(role, pageable));
    }

}
