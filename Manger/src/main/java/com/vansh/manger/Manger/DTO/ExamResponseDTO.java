package com.vansh.manger.Manger.DTO;

import java.time.LocalDate;
import java.time.LocalDateTime;

import com.vansh.manger.Manger.Entity.ExamStatus;
import com.vansh.manger.Manger.Entity.ExamType;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ExamResponseDTO {

    private Long id;
    private String name;
    private ExamType examType; // serializes as "Mid Term" via @JsonValue
    private ExamStatus status; // serializes as "Ongoing" via @JsonValue
    private LocalDate startDate;
    private LocalDate endDate;
    private Double totalMarks;
    private String description;

    // Classroom info
    private Long classroomId;
    private String classroomName; // e.g. "Grade 10 - A"

    // Academic year info
    private Long academicYearId;
    private String academicYearName;

    // Result stats (populated only in detail/results endpoint)
    private Integer totalStudents;
    private Integer marksEnteredCount; // how many students have marks entered
    private Double classAverage;
    private Integer passCount;
    private Integer failCount;

    // Subject papers within this exam
    private Integer subjectCount;
    private java.util.List<ExamSubjectResponseDTO> subjects;

    private LocalDateTime createdAt;
}
