package com.vansh.manger.Manger.exam.dto;

import java.time.LocalDate;
import java.util.List;

import com.vansh.manger.Manger.exam.entity.ExamType;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import com.vansh.manger.Manger.classroom.entity.Classroom;
import com.vansh.manger.Manger.exam.entity.Exam;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ExamRequestDTO {

    @NotBlank(message = "Exam name is required")
    private String name;

    @NotNull(message = "Exam type is required")
    private ExamType examType;

    @NotNull(message = "Start date is required")
    private LocalDate startDate;

    @NotNull(message = "End date is required")
    private LocalDate endDate;

    @NotNull(message = "Total marks is required")
    @DecimalMin(value = "1.0", message = "Total marks must be at least 1")
    private Double totalMarks;

    private String description;

    @NotNull(message = "Classroom ID is required")
    private Long classroomId;

    @NotNull(message = "Academic year ID is required")
    private Long academicYearId;

    /**
     * Selected subject IDs to include in this exam (from classroom's assigned
     * subjects)
     */
    private List<Long> subjectIds;

    /**
     * Multiple classroom IDs for bulk exam creation.
     * When provided, one exam is created per classroom.
     */
    private List<Long> classroomIds;
}
