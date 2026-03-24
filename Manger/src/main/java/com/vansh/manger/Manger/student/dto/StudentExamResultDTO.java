package com.vansh.manger.Manger.student.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * Response DTO for subject-wise exam results.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StudentExamResultDTO {

    private String examName;
    private List<SubjectMarkDTO> subjects;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SubjectMarkDTO {
        private String subjectName;
        private Double marksObtained;
        private Double totalMarks;
        private Double percentage;
        private String grade;
    }
}
