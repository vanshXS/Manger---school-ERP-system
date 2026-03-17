package com.vansh.manger.Manger.exam.dto;

import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StudentExamResultDTO {

    private Long examId;
    private String examName;
    private String examStatus;
    private String academicYearName;
    private String examType;
    private String classroomName;

    private Double totalObtained;
    private Double totalMaxMarks;
    private Double percentage;
    private String overallGrade;

    private List<SubjectMark> subjectMarks;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SubjectMark {
        private String subjectName;
        private Double marksObtained;
        private Double maxMarks;
        private String grade;
        private Double percentage;
    }
}
