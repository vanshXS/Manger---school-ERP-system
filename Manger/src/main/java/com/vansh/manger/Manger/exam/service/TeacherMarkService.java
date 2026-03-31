package com.vansh.manger.Manger.exam.service;

import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import com.vansh.manger.Manger.academicyear.dto.AcademicYearDTO;
import com.vansh.manger.Manger.exam.dto.BulkMarksRequestDTO;
import com.vansh.manger.Manger.exam.dto.ExamResponseDTO;
import com.vansh.manger.Manger.exam.dto.GradingSheetDTO;
import com.vansh.manger.Manger.exam.dto.StudentExamResultDTO;

import lombok.RequiredArgsConstructor;

/**
 * Facade — backward-compatible entry point for teacher mark/exam operations.
 *
 * <p><b>OCP</b> — new marking concerns can be added as new sub-services.
 * <b>DIP</b> — depends on 5 ISP interfaces, not concrete implementations.
 * <b>SRP</b> — sole responsibility is delegation.</p>
 *
 * <p>The {@code TeacherMarkController} continues to inject this single class,
 * so the API surface is unchanged.</p>
 */
@Service
@RequiredArgsConstructor
public class TeacherMarkService {

    private final TeacherExamQueryOperations examQueryOperations;
    private final GradingSheetOperations gradingSheetOperations;
    private final MarkEntryOperations markEntryOperations;
    private final MarksheetDistributionOperations distributionOperations;
    private final StudentExamResultOperations resultOperations;

    // ── Exam Queries ────────────────────────────────────────────

    public List<AcademicYearDTO> getAcademicYears() {
        return examQueryOperations.getAcademicYears();
    }

    public Page<ExamResponseDTO> getAssignedExams(Long academicYearId, String status, Pageable pageable) {
        return examQueryOperations.getAssignedExams(academicYearId, status, pageable);
    }

    // ── Grading Sheet ───────────────────────────────────────────

    public GradingSheetDTO getGradingSheet(Long examId, Long subjectId) {
        return gradingSheetOperations.getGradingSheet(examId, subjectId);
    }

    // ── Mark Entry ──────────────────────────────────────────────

    public void saveBulkMarks(BulkMarksRequestDTO request) {
        markEntryOperations.saveBulkMarks(request);
    }

    // ── Marksheet Distribution ──────────────────────────────────

    public void sendMarksheet(Long examId, Long enrollmentId) {
        distributionOperations.sendMarksheet(examId, enrollmentId);
    }

    public void sendAllMarksheets(Long examId) {
        distributionOperations.sendAllMarksheets(examId);
    }

    // ── Student Results ─────────────────────────────────────────

    public Page<StudentExamResultDTO> getStudentExamResults(Long studentId, Pageable pageable) {
        return resultOperations.getStudentExamResults(studentId, pageable);
    }
}
