package com.vansh.manger.Manger.exam.service;

import com.vansh.manger.Manger.exam.dto.GradingSheetDTO;

/**
 * ISP: Read-only operations for grading sheet retrieval.
 */
public interface GradingSheetOperations {
    GradingSheetDTO getGradingSheet(Long examId, Long subjectId);
}
