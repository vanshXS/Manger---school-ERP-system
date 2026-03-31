package com.vansh.manger.Manger.exam.service;

import com.vansh.manger.Manger.exam.dto.ExamResponseDTO;
import com.vansh.manger.Manger.exam.entity.ExamStatus;

/**
 * ISP: Operations for managing exam lifecycle status transitions.
 */
public interface ExamStatusOperations {
    ExamResponseDTO updateExamStatus(Long examId, ExamStatus newStatus);
}
