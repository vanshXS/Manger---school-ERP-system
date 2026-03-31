package com.vansh.manger.Manger.exam.service;

import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import com.vansh.manger.Manger.academicyear.dto.AcademicYearDTO;
import com.vansh.manger.Manger.exam.dto.ExamResponseDTO;

/**
 * ISP: Read-only operations for teacher-facing exam queries.
 */
public interface TeacherExamQueryOperations {
    List<AcademicYearDTO> getAcademicYears();
    Page<ExamResponseDTO> getAssignedExams(Long academicYearId, String status, Pageable pageable);
}
