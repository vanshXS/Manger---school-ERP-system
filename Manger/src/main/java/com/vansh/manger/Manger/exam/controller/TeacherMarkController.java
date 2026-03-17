package com.vansh.manger.Manger.exam.controller;

import com.vansh.manger.Manger.academicyear.dto.AcademicYearDTO;
import com.vansh.manger.Manger.exam.dto.BulkMarksRequestDTO;
import com.vansh.manger.Manger.exam.dto.ExamResponseDTO;
import com.vansh.manger.Manger.exam.dto.StudentExamResultDTO;
import com.vansh.manger.Manger.exam.service.TeacherMarkService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.vansh.manger.Manger.exam.dto.GradingSheetDTO;

import java.util.List;

@RestController
@RequestMapping("/api/teacher/marks")
@RequiredArgsConstructor
public class TeacherMarkController {

    private final TeacherMarkService teacherMarkService;

    @GetMapping("/academic-years")
    public ResponseEntity<List<AcademicYearDTO>> getAcademicYears() {
        return ResponseEntity.ok(teacherMarkService.getAcademicYears());
    }

    @GetMapping("/exams")
    public ResponseEntity<Page<ExamResponseDTO>> getAssignedExams(
            @RequestParam(required = false) Long academicYearId,
            @RequestParam(required = false) String status,
            Pageable pageable) {
        return ResponseEntity.ok(teacherMarkService.getAssignedExams(academicYearId, status, pageable));
    }

    @GetMapping("/exams/{examId}/subjects/{subjectId}/grading-sheet")
    public ResponseEntity<GradingSheetDTO> getGradingSheet(
            @PathVariable Long examId,
            @PathVariable Long subjectId) {
        return ResponseEntity.ok(teacherMarkService.getGradingSheet(examId, subjectId));
    }

    @GetMapping("/students/{studentId}/exam-results")
    public ResponseEntity<Page<StudentExamResultDTO>> getStudentExamResults(
            @PathVariable Long studentId,
            Pageable pageable) {
        return ResponseEntity.ok(teacherMarkService.getStudentExamResults(studentId, pageable));
    }

    @PostMapping("/bulk-save")
    public ResponseEntity<Void> bulkSaveMarks(@RequestBody BulkMarksRequestDTO request) {
        teacherMarkService.saveBulkMarks(request);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/send-marksheet/{examId}/{enrollmentId}")
    public ResponseEntity<Void> sendMarksheet(@PathVariable Long examId, @PathVariable Long enrollmentId) {
        teacherMarkService.sendMarksheet(examId, enrollmentId);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/send-all-marksheets/{examId}")
    public ResponseEntity<Void> sendAllMarksheets(@PathVariable Long examId) {
        teacherMarkService.sendAllMarksheets(examId);
        return ResponseEntity.ok().build();
    }
}
