package com.vansh.manger.Manger.exam.service;

import java.util.List;

import org.springframework.stereotype.Service;

import com.vansh.manger.Manger.exam.dto.ExamRequestDTO;
import com.vansh.manger.Manger.exam.dto.ExamResponseDTO;
import com.vansh.manger.Manger.exam.entity.ExamStatus;

import lombok.RequiredArgsConstructor;

/**
 * Facade — backward-compatible entry point for admin exam operations.
 *
 * <p><b>OCP</b> — new exam concerns can be added as new sub-services.
 * <b>DIP</b> — depends on ISP interfaces, not concrete implementations.
 * <b>SRP</b> — sole responsibility is delegation.</p>
 *
 * <p>The {@code AdminExamController} continues to inject this single class,
 * so the API surface is unchanged.</p>
 */
@Service
@RequiredArgsConstructor
public class AdminExamService {

    private final ExamCrudOperations crudOperations;
    private final ExamStatusOperations statusOperations;
    private final ExamQueryOperations queryOperations;

    // ── CRUD ────────────────────────────────────────────────────

    public ExamResponseDTO createExam(ExamRequestDTO dto) {
        return crudOperations.createExam(dto);
    }

    public List<ExamResponseDTO> createBulkExams(ExamRequestDTO dto) {
        return crudOperations.createBulkExams(dto);
    }

    public ExamResponseDTO updateExam(Long examId, ExamRequestDTO dto) {
        return crudOperations.updateExam(examId, dto);
    }

    public void deleteExam(Long examId) {
        crudOperations.deleteExam(examId);
    }

    // ── Status ──────────────────────────────────────────────────

    public ExamResponseDTO updateExamStatus(Long examId, ExamStatus newStatus) {
        return statusOperations.updateExamStatus(examId, newStatus);
    }

    // ── Query ───────────────────────────────────────────────────

    public List<ExamResponseDTO> getAllExams(Long academicYearId, Long classroomId, ExamStatus status) {
        return queryOperations.getAllExams(academicYearId, classroomId, status);
    }

    public ExamResponseDTO getExamById(Long examId) {
        return queryOperations.getExamById(examId);
    }
}
