package com.vansh.manger.Manger.student.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Response DTO for yearly attendance summary.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StudentAttendanceSummaryDTO {

    private long totalDays;
    private long presentDays;
    private long absentDays;
    private Double percentage;
}
