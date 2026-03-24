package com.vansh.manger.Manger.student.dto;

import com.vansh.manger.Manger.exam.entity.ExamStatus;
import com.vansh.manger.Manger.exam.entity.ExamType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

/**
 * Response DTO for listing exams a student participated in.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StudentExamDTO {

    private Long id;
    private String name;
    private ExamType examType;
    private ExamStatus status;
    private LocalDate startDate;
    private LocalDate endDate;
    private Double totalMarks;
}
