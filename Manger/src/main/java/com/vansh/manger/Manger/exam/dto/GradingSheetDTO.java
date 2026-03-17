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
public class GradingSheetDTO {

    private String subjectName;
    private String examName;
    private String classroomName;
    private String examStatus;
    private Boolean marksEditable;
    private Boolean marksheetAllowed;

    private Double maxMarks;
    private Integer totalStudents;
    private Integer gradedCount;

    private List<StudentGradeRecord> students;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class StudentGradeRecord {
        private Long enrollmentId;
        private String studentName;
        private String rollNo;
        private Double marksObtained;
    }
}
