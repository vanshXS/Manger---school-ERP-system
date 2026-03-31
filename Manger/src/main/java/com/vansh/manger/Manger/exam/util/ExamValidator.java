package com.vansh.manger.Manger.exam.util;

import org.springframework.stereotype.Component;

import com.vansh.manger.Manger.exam.dto.ExamRequestDTO;

/**
 * SRP: Centralised exam request validation.
 * Extracted from AdminExamService — validation is not a CRUD concern.
 */
@Component
public class ExamValidator {

    public void validateRequest(ExamRequestDTO dto) {
        if (dto.getName() == null || dto.getName().trim().isEmpty()) {
            throw new IllegalArgumentException("Exam name is required.");
        }
        if (dto.getClassroomId() == null) {
            throw new IllegalArgumentException("Classroom is required.");
        }
        if (dto.getStartDate() == null || dto.getEndDate() == null) {
            throw new IllegalArgumentException("Exam start date and end date are required.");
        }
        if (dto.getStartDate().isAfter(dto.getEndDate())) {
            throw new IllegalArgumentException("Start date must be before end date.");
        }
    }
}
