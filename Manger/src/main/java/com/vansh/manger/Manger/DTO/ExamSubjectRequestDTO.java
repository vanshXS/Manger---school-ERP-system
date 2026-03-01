package com.vansh.manger.Manger.DTO;

import java.time.LocalDate;
import java.time.LocalTime;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ExamSubjectRequestDTO {

    @NotNull(message = "Subject ID is required")
    private Long subjectId;

    @NotNull(message = "Exam date is required")
    private LocalDate examDate;

    /** Optional — start time for this paper */
    private LocalTime startTime;

    /** Optional — end time for this paper */
    private LocalTime endTime;

    @NotNull(message = "Max marks is required")
    @DecimalMin(value = "1.0", message = "Max marks must be at least 1")
    private Double maxMarks;
}
