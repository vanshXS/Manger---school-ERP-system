package com.vansh.manger.Manger.student.controller;

import com.vansh.manger.Manger.student.dto.*;
import com.vansh.manger.Manger.student.service.StudentPortalOperations;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * REST controller for the Student Portal.
 *
 * <p>DIP: depends on {@link StudentPortalOperations} (interface),
 * not on the concrete {@code StudentPortalService}.</p>
 *
 * <p>SRP: thin controller — every method delegates to the service
 * and returns the result. No business logic here.</p>
 *
 * <p>All endpoints require ROLE_STUDENT authority
 * (enforced by SecurityConfig).</p>
 */
@RestController
@RequestMapping("/api/student")
@RequiredArgsConstructor
public class StudentPortalController {

    private final StudentPortalOperations studentPortalService;

    // ─── Profile ──────────────────────────────────────────────────

    @GetMapping("/profile")
    public ResponseEntity<StudentResponseDTO> getProfile() {
        return ResponseEntity.ok(studentPortalService.getMyProfile());
    }

    // ─── Academic Year Switcher ───────────────────────────────────

    @GetMapping("/academic-years")
    public ResponseEntity<List<StudentAcademicYearDTO>> getAcademicYears() {
        return ResponseEntity.ok(studentPortalService.getAcademicYears());
    }

    // ─── Attendance ───────────────────────────────────────────────

    @GetMapping("/attendance/summary")
    public ResponseEntity<StudentAttendanceSummaryDTO> getAttendanceSummary(
            @RequestParam Long academicYearId) {
        return ResponseEntity.ok(studentPortalService.getAttendanceSummary(academicYearId));
    }

    @GetMapping("/attendance/monthly")
    public ResponseEntity<StudentAttendanceMonthDTO> getMonthlyAttendance(
            @RequestParam int year,
            @RequestParam int month) {
        return ResponseEntity.ok(studentPortalService.getMonthlyAttendance(year, month));
    }

    // ─── Exams ────────────────────────────────────────────────────

    @GetMapping("/exams")
    public ResponseEntity<List<StudentExamDTO>> getExams(
            @RequestParam Long academicYearId) {
        return ResponseEntity.ok(studentPortalService.getExams(academicYearId));
    }

    @GetMapping("/exams/{examId}/results")
    public ResponseEntity<StudentExamResultDTO> getExamResults(
            @PathVariable Long examId) {
        return ResponseEntity.ok(studentPortalService.getExamResults(examId));
    }

    // ─── Timetable ────────────────────────────────────────────────

    @GetMapping("/timetable")
    public ResponseEntity<List<StudentTimetableDTO>> getTimetable() {
        return ResponseEntity.ok(studentPortalService.getTimetable());
    }

    // ─── Risk Analysis (MVP Differentiator) ───────────────────────

    @GetMapping("/risk-analysis")
    public ResponseEntity<StudentRiskAnalysisDTO> getRiskAnalysis() {
        return ResponseEntity.ok(studentPortalService.getRiskAnalysis());
    }
}
