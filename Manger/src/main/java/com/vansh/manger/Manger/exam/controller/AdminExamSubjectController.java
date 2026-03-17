package com.vansh.manger.Manger.exam.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.vansh.manger.Manger.exam.dto.ExamSubjectRequestDTO;
import com.vansh.manger.Manger.exam.dto.ExamSubjectResponseDTO;
import com.vansh.manger.Manger.exam.service.ExamSubjectService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import com.vansh.manger.Manger.subject.entity.Subject;

@RestController
@RequestMapping("/api/admin/exams/{examId}/subjects")
@RequiredArgsConstructor
public class AdminExamSubjectController {

    private final ExamSubjectService examSubjectService;

    /**
     * GET /api/admin/exams/{examId}/subjects
     * List all subject papers for an exam (timetable)
     */
    @GetMapping
    public ResponseEntity<List<ExamSubjectResponseDTO>> getSubjectsForExam(
            @PathVariable Long examId) {
        return ResponseEntity.ok(examSubjectService.getSubjectsForExam(examId));
    }

    /**
     * POST /api/admin/exams/{examId}/subjects
     * Add a subject paper to an exam
     */
    @PostMapping
    public ResponseEntity<ExamSubjectResponseDTO> addSubjectToExam(
            @PathVariable Long examId,
            @Valid @RequestBody ExamSubjectRequestDTO dto) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(examSubjectService.addSubjectToExam(examId, dto));
    }

    /**
     * PUT /api/admin/exams/{examId}/subjects/{examSubjectId}
     * Update a subject paper (date, time, max marks)
     */
    @PutMapping("/{examSubjectId:\\d+}")
    public ResponseEntity<ExamSubjectResponseDTO> updateSubjectPaper(
            @PathVariable Long examId,
            @PathVariable Long examSubjectId,
            @Valid @RequestBody ExamSubjectRequestDTO dto) {
        return ResponseEntity.ok(examSubjectService.updateSubjectPaper(examId, examSubjectId, dto));
    }

    /**
     * DELETE /api/admin/exams/{examId}/subjects/{examSubjectId}
     * Remove a subject paper from an exam
     */
    @DeleteMapping("/{examSubjectId:\\d+}")
    public ResponseEntity<String> removeSubjectFromExam(
            @PathVariable Long examId,
            @PathVariable Long examSubjectId) {
        examSubjectService.removeSubjectFromExam(examId, examSubjectId);
        return ResponseEntity.ok("Subject paper removed from exam.");
    }

    /**
     * GET /api/admin/exams/{examId}/subjects/available
     * Get classroom subjects not yet added to this exam
     */
    @GetMapping("/available")
    public ResponseEntity<List<ExamSubjectResponseDTO>> getAvailableSubjects(
            @PathVariable Long examId) {
        return ResponseEntity.ok(examSubjectService.getAvailableSubjects(examId));
    }
}
