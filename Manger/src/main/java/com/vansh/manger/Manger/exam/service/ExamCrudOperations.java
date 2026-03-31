package com.vansh.manger.Manger.exam.service;

import java.util.List;

import com.vansh.manger.Manger.exam.dto.ExamRequestDTO;
import com.vansh.manger.Manger.exam.dto.ExamResponseDTO;

/**
 * ISP: Write operations for exam creation, update, and deletion.
 */
public interface ExamCrudOperations {
    ExamResponseDTO createExam(ExamRequestDTO dto);
    List<ExamResponseDTO> createBulkExams(ExamRequestDTO dto);
    ExamResponseDTO updateExam(Long examId, ExamRequestDTO dto);
    void deleteExam(Long examId);
}
