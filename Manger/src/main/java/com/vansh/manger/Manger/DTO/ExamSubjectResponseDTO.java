package com.vansh.manger.Manger.DTO;

import java.time.LocalDate;
import java.time.LocalTime;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ExamSubjectResponseDTO {

    private Long id;

    private Long subjectId;
    private String subjectName;
    private String subjectCode;

    private LocalDate examDate;
    private LocalTime startTime;
    private LocalTime endTime;
    private Double maxMarks;

    /** Number of students who have marks entered for this paper */
    private Integer marksEnteredCount;
}
