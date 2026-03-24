package com.vansh.manger.Manger.student.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Response DTO for monthly attendance comparison.
 * Shows current month vs previous month percentage + delta.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StudentAttendanceMonthDTO {

    private int currentMonth;
    private int currentYear;
    private Double currentPercentage;

    private int previousMonth;
    private int previousYear;
    private Double previousPercentage;

    /** currentPercentage - previousPercentage (null if either side is null) */
    private Double delta;
}
