package com.vansh.manger.Manger.Controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.vansh.manger.Manger.DTO.ExamRequestDTO;
import com.vansh.manger.Manger.DTO.ExamResponseDTO;
import com.vansh.manger.Manger.Entity.ExamStatus;
import com.vansh.manger.Manger.Service.AdminExamService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/admin/exams")
@RequiredArgsConstructor
public class AdminExamController {

    private final AdminExamService adminExamService;

    /**
     * GET /api/admin/exams
     * Supports optional filters: academicYearId, classroomId, status
     * e.g. GET /api/admin/exams?academicYearId=1&classroomId=3&status=ONGOING
     */
    @GetMapping
    public ResponseEntity<List<ExamResponseDTO>> getAllExams(
            @RequestParam(required = false) Long academicYearId,
            @RequestParam(required = false) Long classroomId,
            @RequestParam(required = false) ExamStatus status) {
        return ResponseEntity.ok(adminExamService.getAllExams(academicYearId, classroomId, status));
    }

    /**
     * GET /api/admin/exams/{examId}
     * Returns exam detail WITH result stats
     */
    @GetMapping("/{examId:\\d+}")
    public ResponseEntity<ExamResponseDTO> getExamById(@PathVariable Long examId) {
        return ResponseEntity.ok(adminExamService.getExamById(examId));
    }

    /**
     * POST /api/admin/exams
     * Creates a new exam
     */
    @PostMapping
    public ResponseEntity<ExamResponseDTO> createExam(@Valid @RequestBody ExamRequestDTO dto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(adminExamService.createExam(dto));
    }

    /**
     * POST /api/admin/exams/bulk
     * Creates one exam per classroom from the classroomIds list
     */
    @PostMapping("/bulk")
    public ResponseEntity<List<ExamResponseDTO>> createBulkExams(@RequestBody ExamRequestDTO dto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(adminExamService.createBulkExams(dto));
    }

    /**
     * PUT /api/admin/exams/{examId}
     * Updates exam details (not allowed if COMPLETED)
     */
    @PutMapping("/{examId:\\d+}")
    public ResponseEntity<ExamResponseDTO> updateExam(
            @PathVariable Long examId,
            @Valid @RequestBody ExamRequestDTO dto) {
        return ResponseEntity.ok(adminExamService.updateExam(examId, dto));
    }

    /**
     * PATCH /api/admin/exams/{examId}/status?status=ONGOING
     * Transitions exam status: UPCOMING→ONGOING→COMPLETED
     */
    @PatchMapping("/{examId:\\d+}/status")
    public ResponseEntity<ExamResponseDTO> updateExamStatus(
            @PathVariable Long examId,
            @RequestParam ExamStatus status) {
        return ResponseEntity.ok(adminExamService.updateExamStatus(examId, status));
    }

    /**
     * DELETE /api/admin/exams/{examId}
     * Deletes exam (not allowed if COMPLETED)
     */
    @DeleteMapping("/{examId:\\d+}")
    public ResponseEntity<String> deleteExam(@PathVariable Long examId) {
        adminExamService.deleteExam(examId);
        return ResponseEntity.ok("Exam deleted successfully.");
    }
}
