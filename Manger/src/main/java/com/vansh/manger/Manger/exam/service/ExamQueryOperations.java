package com.vansh.manger.Manger.exam.service;

import java.util.List;

import com.vansh.manger.Manger.exam.dto.ExamResponseDTO;
import com.vansh.manger.Manger.exam.entity.ExamStatus;

/**
 * ISP: Read-only query operations for exams.
 */
public interface ExamQueryOperations {
    List<ExamResponseDTO> getAllExams(Long academicYearId, Long classroomId, ExamStatus status);
    ExamResponseDTO getExamById(Long examId);
}
