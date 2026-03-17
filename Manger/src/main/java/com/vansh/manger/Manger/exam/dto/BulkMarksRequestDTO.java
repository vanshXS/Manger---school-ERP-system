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
public class BulkMarksRequestDTO {
    private Long examId;
    private Long subjectId;
    private List<StudentMarkInput> marks;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class StudentMarkInput {
        private Long enrollmentId;
        private Double marksObtained;
    }
}
