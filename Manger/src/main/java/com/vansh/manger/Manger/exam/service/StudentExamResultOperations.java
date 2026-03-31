package com.vansh.manger.Manger.exam.service;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import com.vansh.manger.Manger.exam.dto.StudentExamResultDTO;

/**
 * ISP: Read-only operations for student exam result queries.
 */
public interface StudentExamResultOperations {
    Page<StudentExamResultDTO> getStudentExamResults(Long studentId, Pageable pageable);
}
